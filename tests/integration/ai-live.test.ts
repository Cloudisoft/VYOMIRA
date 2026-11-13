/**
 * LIVE AI check — skipped unless LIVE_AI=1 (it calls the real model and costs money).
 * Prints each report and how many sections the AI wrote vs. the rule-based fallback.
 */
import { afterAll, describe, expect, it } from "vitest";
import { randomUUID, randomInt } from "node:crypto";
import fs from "node:fs";
import { db } from "@/server/db";
import { CONSENT_VERSION } from "@/server/consent";
import { createReading } from "@/server/readings/service";
import { generateReading } from "@/server/readings/generate";
import { processPalmImage } from "@/server/readings/palm-image";
import { palmPrecheck } from "@/server/readings/palm-precheck";
import { encryptJson } from "@/server/crypto";
import { resolvePicks, type SpreadId } from "@/lib/readings/tarot";
import { assertNoRepetition, repeatedPhrases, type ReportDoc } from "@/lib/readings/report";

const live = process.env.LIVE_AI === "1";
const OUT = process.env.LIVE_OUT ?? "/tmp";
const ids: string[] = [];
afterAll(async () => { if (live) { await db.serviceReading.deleteMany({ where: { userId: { in: ids } } }); await db.user.deleteMany({ where: { id: { in: ids } } }); } });

async function user() {
  const id = randomUUID(); ids.push(id);
  await db.user.create({ data: { id, name: "Live Test", email: `${id}@test.local`, role: "ADMIN" } });
  await db.consent.create({ data: { userId: id, kind: "ai_processing", version: CONSENT_VERSION, granted: true } });
  return { id, role: "ADMIN" };
}
function dump(name: string, doc: ReportDoc, gen: string | null) {
  fs.writeFileSync(`${OUT}/${name}.md`, `# ${doc.title}\n_${doc.subtitle}_ · generator: ${gen}\n\n${doc.sections.map((s) => `## ${s.title}\n${s.body}`).join("\n\n")}\n\n---\nremoved: ${JSON.stringify(doc.validation?.removed ?? [])}\n`);
}

describe.skipIf(!live)("live AI readings", () => {
  for (const [lang, tier] of [["en", "complete"], ["hi", "detailed"], ["hinglish", "detailed"]] as const) {
    it(`numerology ${tier} in ${lang}`, async () => {
      const u = await user();
      const r = await createReading(u, `numerology_${tier}`, { name: "Rohan Mehta", dob: "1991-08-24", method: "pythagorean" }, lang);
      if ("error" in r) throw new Error(r.error);
      await db.serviceReading.update({ where: { id: r.reading.id }, data: { status: "PAID" } });
      const out = await generateReading(r.reading.id, u.id);
      expect(out.status).toBe("READY");
      const row = (await db.serviceReading.findUnique({ where: { id: r.reading.id } }))!;
      const doc = (row.result as unknown as { report: ReportDoc }).report;
      dump(`num-${lang}`, doc, row.generator);
      expect(() => assertNoRepetition(doc)).not.toThrow();
      expect(repeatedPhrases(doc)).toEqual([]);
    }, 180_000);
  }
  for (const [lang, spread] of [["en", "celtic"], ["hinglish", "three"], ["hi", "five"]] as const) {
    it(`tarot ${spread} in ${lang}`, async () => {
      const u = await user();
      const r = await createReading(u, `tarot_${spread}`, { category: "career", question: lang === "hi" ? "क्या मुझे इस साल नौकरी बदलनी चाहिए?" : "Should I change jobs this year?" }, lang);
      if ("error" in r) throw new Error(r.error);
      const draw = r.reading.draw as unknown as { deck: { id: string; reversed: boolean }[] };
      const need = { single: 1, three: 3, five: 5, celtic: 10 }[spread];
      const picks: number[] = []; while (picks.length < need) { const x = randomInt(22); if (!picks.includes(x)) picks.push(x); }
      await db.serviceReading.update({ where: { id: r.reading.id }, data: { status: "PAID", draw: { ...draw, picks: resolvePicks(draw.deck, spread as SpreadId, picks) } as never } });
      const out = await generateReading(r.reading.id, u.id);
      expect(out.status).toBe("READY");
      const row = (await db.serviceReading.findUnique({ where: { id: r.reading.id } }))!;
      const doc = (row.result as unknown as { report: ReportDoc }).report;
      dump(`tarot-${lang}-${spread}`, doc, row.generator);
      expect(repeatedPhrases(doc)).toEqual([]);
    }, 300_000);
  }
  for (const f of (process.env.PRECHECK_FILES ?? "").split(",").filter(Boolean)) {
    it(`precheck rejects ${f.split("/").pop()}`, async () => {
      const u = await user();
      const img = await processPalmImage(fs.readFileSync(f));
      if (!img.ok) return;
      const r = await palmPrecheck(u.id, "precheck", img.jpeg.toString("base64"), "right", process.env.PALM_LANG ?? "en");
      fs.writeFileSync(`${OUT}/precheck-${f.split("/").pop()}.txt`, JSON.stringify(r));
      expect(r?.ok).toBe(false);
    }, 120_000);
  }
  for (const f of (process.env.PALM_FILES ?? "").split(",").filter(Boolean)) {
    it(`palm photo ${f}`, async () => {
      const u = await user();
      const r = await createReading(u, "palmistry_detailed", { dominant: "right", hands: "right" }, process.env.PALM_LANG ?? "en");
      if ("error" in r) throw new Error(r.error);
      const img = await processPalmImage(fs.readFileSync(f));
      if (!img.ok) { fs.writeFileSync(`${OUT}/palm-${f.split("/").pop()}.md`, `upload rejected: ${img.error}`); return; }
      await db.palmImage.create({ data: { readingId: r.reading.id, side: "right", mime: "image/jpeg", width: img.width, height: img.height, data: encryptJson(img.jpeg.toString("base64")), quality: img.quality as never } });
      await db.serviceReading.update({ where: { id: r.reading.id }, data: { status: "PAID" } });
      const out = await generateReading(r.reading.id, u.id);
      const row = (await db.serviceReading.findUnique({ where: { id: r.reading.id } }))!;
      const res = row.result as unknown as { report?: ReportDoc; hands?: unknown; retake?: string[] };
      fs.writeFileSync(`${OUT}/palm-${f.split("/").pop()}.md`, `status: ${out.status} ${out.error ?? ""}\nquality: ${JSON.stringify(img.quality)}\nretake: ${JSON.stringify(res?.retake ?? null)}\nhands: ${JSON.stringify(res?.hands ?? null, null, 1)}\n\n${res?.report ? res.report.sections.map((s) => `## ${s.title}\n${s.body}`).join("\n\n") : ""}`);
    }, 300_000);
  }
});
