import { ARTICLES } from "@/lib/learn";
import { FAQS } from "@/lib/faq";
import { SITE, abs } from "@/lib/seo";

/** /llms-full.txt — every guide and FAQ as plain text, for AI assistants that want the full content. */
export function GET() {
  const guides = ARTICLES.map((a) => `# ${a.title}\nSource: ${abs(`/learn/${a.slug}`)}\n\n${a.summary}\n\n${a.body.map((p) => (p.startsWith("## ") ? `## ${p.slice(3)}` : p)).join("\n\n")}${a.faqs?.length ? `\n\n## Common questions\n\n${a.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")}` : ""}`).join("\n\n---\n\n");
  const faq = FAQS.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");
  const body = `# ${SITE.name} — full reference\n\n${SITE.description}\nWebsite: ${SITE.url}\n\n---\n\n${guides}\n\n---\n\n# Frequently asked questions\nSource: ${abs("/#faq")}\n\n${faq}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
