import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

const PRIVATE = ["/dashboard", "/admin", "/api", "/chart", "/onboarding/save", "/sign-in", "/sign-up", "/forgot-password", "/reset-password"];
// Answer engines and AI assistants are welcome to read the public pages (and /llms.txt).
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE }, { userAgent: AI_BOTS, allow: ["/", "/llms.txt", "/llms-full.txt"], disallow: PRIVATE }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
