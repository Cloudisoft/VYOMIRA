import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";

/**
 * Provider-independent LLM interface. Implementations: Anthropic (official SDK) and any
 * OpenAI-compatible Chat Completions endpoint (OpenRouter, Groq, Together, Azure, local vLLM…).
 * Keys never leave the server.
 */
export interface GenerateInput {
  tier: "fast" | "deep";
  model: string;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens: number;
  jsonSchema?: Record<string, unknown>;
}
export interface GenerateOutput {
  text: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  refused?: boolean;
}
export interface LlmProvider {
  id: string;
  generate(input: GenerateInput): Promise<GenerateOutput>;
}

class AnthropicProvider implements LlmProvider {
  id = "anthropic";
  private client = new Anthropic({ apiKey: env().ANTHROPIC_API_KEY, maxRetries: 2, timeout: 90_000 });
  async generate(i: GenerateInput): Promise<GenerateOutput> {
    const res = await this.client.beta.messages.create({
      model: i.model,
      max_tokens: i.maxTokens,
      system: [{ type: "text", text: i.system, cache_control: { type: "ephemeral" } }],
      messages: i.messages,
      // Everyday chat runs at low effort; complex chart explanations at medium.
      output_config: { effort: i.tier === "fast" ? "low" : "medium", ...(i.jsonSchema ? { format: { type: "json_schema", schema: i.jsonSchema } } : {}) },
      // Server-side refusal fallback (route by refusal category).
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    if (res.stop_reason === "refusal") return { text: "", model: res.model, tokensIn: res.usage.input_tokens, tokensOut: res.usage.output_tokens, refused: true };
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return { text, model: res.model, tokensIn: res.usage.input_tokens + (res.usage.cache_read_input_tokens ?? 0), tokensOut: res.usage.output_tokens };
  }
}

class OpenAiCompatibleProvider implements LlmProvider {
  id = "openai-compatible";
  async generate(i: GenerateInput): Promise<GenerateOutput> {
    const e = env();
    const res = await fetch(`${e.OPENAI_COMPAT_BASE_URL ?? "https://api.openai.com/v1"}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${e.OPENAI_COMPAT_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: i.model,
        max_tokens: i.maxTokens,
        messages: [{ role: "system", content: i.system }, ...i.messages],
        ...(i.jsonSchema ? { response_format: { type: "json_schema", json_schema: { name: "reading", schema: i.jsonSchema, strict: true } } } : {}),
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) throw new Error(`LLM provider error ${res.status}`);
    const j = (await res.json()) as { model: string; choices: { message: { content: string } }[]; usage?: { prompt_tokens: number; completion_tokens: number } };
    return { text: j.choices[0]?.message?.content ?? "", model: j.model, tokensIn: j.usage?.prompt_tokens ?? 0, tokensOut: j.usage?.completion_tokens ?? 0 };
  }
}

let provider: LlmProvider | null | undefined;
export function llm(): LlmProvider | null {
  if (provider !== undefined) return provider;
  const e = env();
  if (e.AI_PROVIDER === "anthropic" && e.ANTHROPIC_API_KEY) provider = new AnthropicProvider();
  else if (e.AI_PROVIDER === "openai-compatible" && e.OPENAI_COMPAT_API_KEY) provider = new OpenAiCompatibleProvider();
  else provider = null;
  return provider;
}

export function costMicros(prices: Record<string, [number, number]>, model: string, tokensIn: number, tokensOut: number) {
  const key = Object.keys(prices).find((k) => model.startsWith(k));
  const [pin, pout] = key ? prices[key] : [0, 0];
  return Math.round(tokensIn * pin + tokensOut * pout); // $/1M tokens × tokens = micro-dollars
}
