import { describe, expect, it } from "vitest";
import { localToUtc, offsetAt, validateLocal, formatOffset } from "@/lib/astro/timezone";

describe("historical timezone conversion", () => {
  it("India 1942 wartime offset is +06:30", () => {
    const r = localToUtc({ year: 1942, month: 12, day: 1, hour: 12, minute: 0 }, "Asia/Kolkata");
    expect(r.status).toBe("ok");
    expect(r.offsetMinutes).toBe(390);
    expect(r.utc.toISOString()).toBe("1942-12-01T05:30:00.000Z");
  });
  it("India 1900 uses Madras time +05:21:10 (seconds precision)", () => {
    expect(formatOffset(offsetAt("Asia/Kolkata", Date.parse("1900-06-01T00:00:00Z")))).toBe("UTC+05:21:10");
  });
  it("IST since 1945 is +05:30", () => {
    expect(localToUtc({ year: 1990, month: 8, day: 15, hour: 10, minute: 30 }, "Asia/Kolkata").utc.toISOString()).toBe("1990-08-15T05:00:00.000Z");
  });
  it("detects an ambiguous (repeated) local time — UK fall-back", () => {
    const r = localToUtc({ year: 2019, month: 10, day: 27, hour: 1, minute: 30 }, "Europe/London");
    expect(r.status).toBe("ambiguous");
    expect(r.alternatives?.map((a) => a.utc)).toEqual(["2019-10-27T00:30:00.000Z", "2019-10-27T01:30:00.000Z"]);
  });
  it("detects a nonexistent local time — US spring-forward", () => {
    const r = localToUtc({ year: 2021, month: 3, day: 14, hour: 2, minute: 30 }, "America/New_York");
    expect(r.status).toBe("nonexistent");
    expect(r.utc.toISOString()).toBe("2021-03-14T07:30:00.000Z");
  });
  it("handles southern-hemisphere DST (Sydney, January = +11)", () => {
    expect(localToUtc({ year: 2020, month: 1, day: 15, hour: 9, minute: 0 }, "Australia/Sydney").offsetMinutes).toBe(660);
    expect(localToUtc({ year: 2020, month: 7, day: 15, hour: 9, minute: 0 }, "Australia/Sydney").offsetMinutes).toBe(600);
  });
  it("handles half/quarter-hour zones (Kathmandu +05:45)", () => {
    expect(localToUtc({ year: 2000, month: 1, day: 1, hour: 5, minute: 45 }, "Asia/Kathmandu").utc.toISOString()).toBe("2000-01-01T00:00:00.000Z");
  });
  it("validates leap days", () => {
    expect(validateLocal({ year: 2024, month: 2, day: 29, hour: 0, minute: 0 })).toBeNull();
    expect(validateLocal({ year: 2023, month: 2, day: 29, hour: 0, minute: 0 })).not.toBeNull();
    expect(validateLocal({ year: 1900, month: 2, day: 29, hour: 0, minute: 0 })).not.toBeNull();
    expect(validateLocal({ year: 2000, month: 2, day: 29, hour: 0, minute: 0 })).toBeNull();
  });
});
