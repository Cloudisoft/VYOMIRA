import { requireUser } from "@/server/session";
import { userLang } from "@/server/lang";
import { UI } from "@/lib/i18n/ui";
import { db } from "@/server/db";
import { PageHeader } from "@/components/dashboard/ui";
import { renderMarkdown } from "@/lib/markdown";
import Link from "next/link";

export const metadata = { title: "Saved Readings" };

export default async function SavedPage() {
  const user = await requireUser();
  const lang = await userLang(user.id);
  const readings = await db.reading.findMany({ where: { userId: user.id, saved: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <PageHeader eyebrow={UI[lang].pages.saved[0]} title={UI[lang].pages.saved[1]} intro={lang === "en" ? "Answers you bookmarked in AURA, kept with the chart factors that informed them." : undefined} />
      {readings.length === 0 ? (
        <p className="text-slate">Nothing saved yet. Use the bookmark under any AURA answer. <Link className="text-gold" href="/dashboard/aura">Ask AURA →</Link></p>
      ) : (
        <ul className="space-y-5">
          {readings.map((r) => {
            const c = r.content as { question: string; answer: string };
            return (
              <li key={r.id} className="glass rounded-[1.5rem] p-6">
                <p className="text-xs text-slate">{r.createdAt.toLocaleDateString("en-GB")} · {r.topic} · {r.generator}</p>
                <p className="mt-2 font-display text-2xl">{c.question}</p>
                <div className="prose-aura mt-3 text-sm text-moon/90" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.answer) }} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
