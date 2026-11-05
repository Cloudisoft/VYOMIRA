import { describe, expect, it } from "vitest";
import { computeChart } from "@/lib/astro/chart";
import { transitSummary } from "@/lib/astro/transits";
import { buildEvidence } from "@/lib/interpret/evidence";
import { deterministicReading, readingToMarkdown } from "@/lib/interpret/narrative";
import { validateText } from "@/lib/interpret/validate";
import { detectTopic } from "@/lib/interpret/catalog";
import { guard } from "@/server/ai/guardrails";
import { renderMarkdown } from "@/lib/markdown";
import { regionFor, DEFAULT_PRICING } from "@/lib/pricing";

const chart = computeChart({ local: { year: 1990, month: 8, day: 15, hour: 10, minute: 30 }, timeZone: "Asia/Kolkata", latitude: 28.63576, longitude: 77.22445, placeLabel: "New Delhi", precision: "exact" });
const now = new Date("2026-11-05T12:00:00Z");
const ev = buildEvidence(chart, "career", transitSummary(chart, now, true), now);

describe("evidence & deterministic reading", () => {
  it("every factor cites a rule and the topic", () => {
    expect(ev.factors.length).toBeGreaterThan(3);
    for (const f of ev.factors) expect(f.ruleId).toBeTruthy();
    expect(ev.topic).toBe("career");
  });
  it("deterministic reading passes its own validator", () => {
    const md = readingToMarkdown(deterministicReading(ev, "When is a favorable phase for career changes?"));
    expect(validateText(md, ev)).toEqual([]);
  });
});

describe("validator (layer 5)", () => {
  it("accepts supported placements", () => {
    expect(validateText("Your Moon in Taurus and Mars in Aries are traditionally strong.", ev)).toEqual([]);
  });
  it("rejects invented placements, houses, yogas, dashas and years", () => {
    const v = validateText("Saturn in Leo in the 10th house forms Saraswati Yoga; your current Rahu Mahadasha peaks in 2093.", ev);
    const kinds = v.map((x) => x.kind);
    expect(kinds).toContain("placement");
    expect(kinds).toContain("yoga");
    expect(kinds).toContain("year");
  });
  it("rejects guaranteed outcomes and gem selling", () => {
    expect(validateText("You will definitely get promoted. Wear a blue sapphire.", ev).some((x) => x.kind === "guardrail")).toBe(true);
    expect(validateText("This is guaranteed to happen.", ev).some((x) => x.kind === "guardrail")).toBe(true);
  });
});

describe("guardrails", () => {
  it("routes crisis messages to support resources", () => {
    const g = guard("I want to end my life", "en");
    expect(g.kind).toBe("crisis");
    if (g.kind === "crisis") expect(g.reply).toContain("14416");
  });
  it("refuses death, medical and gambling predictions", () => {
    expect(guard("When will I die?", "en").kind).toBe("boundary");
    expect(guard("Will I get pregnant this year?", "en").kind).toBe("boundary");
    expect(guard("Which stock should I buy?", "en").kind).toBe("boundary");
    expect(guard("What are my career themes?", "en").kind).toBe("ok");
  });
  it("detects topics in English, Hinglish and Hindi", () => {
    expect(detectTopic("When will my career grow?")).toBe("career");
    expect(detectTopic("meri shaadi kab hogi")).toBe("marriage");
    expect(detectTopic("मेरी नौकरी कैसी रहेगी")).toBe("career");
  });
});

describe("output safety & pricing", () => {
  it("markdown renderer escapes HTML", () => {
    const html = renderMarkdown('**hi** <img src=x onerror="alert(1)"> _ok_');
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
    expect(html).toContain("<strong>hi</strong>");
  });
  it("regional pricing: India INR, eurozone EUR, unknown USD", () => {
    expect(regionFor("IN").region.prices.starter).toBe(19900);
    expect(regionFor("IN").region.prices.cosmic_plus).toBe(59900);
    expect(regionFor("FR").region.currency).toBe("EUR");
    expect(regionFor("BR").region.currency).toBe("USD");
    expect(DEFAULT_PRICING.plans.map((p) => p.aiMessages)).toEqual([10, 25]);
  });
});
