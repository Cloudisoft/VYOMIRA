import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { computeChart } from "@/lib/astro/chart";
import { transitSummary } from "@/lib/astro/transits";
import { buildReport } from "@/server/reports";
import { renderReportPdf } from "@/server/pdf";

const hasPdftotext = (() => { try { execFileSync("pdftotext", ["-v"], { stdio: "ignore" }); return true; } catch { return false; } })();

describe("report PDF", () => {
  const chart = computeChart({ local: { year: 1990, month: 8, day: 15, hour: 10, minute: 30 }, timeZone: "Asia/Kolkata", latitude: 28.63576, longitude: 77.22445, placeLabel: "New Delhi", precision: "exact" });
  const report = buildReport("birth-chart", chart, "Test Person", transitSummary(chart, new Date("2026-11-05T00:00:00Z")), new Date("2026-11-05T00:00:00Z"));
  it.runIf(hasPdftotext)("renders Latin and Devanagari text that survives extraction", async () => {
    const hi = { ...report, title: "जन्म कुंडली और व्यक्तित्व", reading: { ...report.reading, summary: "आपकी वर्तमान महादशा बृहस्पति की है — 2034 तक। VYOMIRA ₹599" } };
    const bytes = await renderReportPdf(hi, "hi");
    const f = path.join(os.tmpdir(), `vy-${Date.now()}.pdf`);
    fs.writeFileSync(f, bytes);
    const text = execFileSync("pdftotext", [f, "-"]).toString();
    expect(text).toContain("VYOMIRA");
    expect(text).toContain("Test Person");
    expect(text).toContain("2034");
    expect(text).toContain("₹599");
    expect(text).toMatch(/कुंडली/);
    expect(text).toContain("Virgo");
  });
});
