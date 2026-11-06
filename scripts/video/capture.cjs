/**
 * Captures real product screens for the promo videos from a locally running build.
 * Usage: node scripts/video/capture.cjs http://localhost:3011
 */
const { chromium } = require("playwright");
const path = require("path");
const BASE = process.argv[2] || "http://localhost:3011";
const OUT = path.join(__dirname, "assets");

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5, reducedMotion: "no-preference" });
  const p = await ctx.newPage();
  const shot = async (name, opts = {}) => { await p.waitForTimeout(opts.wait ?? 1800); await p.screenshot({ path: path.join(OUT, name + ".png"), ...opts.shot }); console.log("captured", name); };

  await p.goto(BASE + "/?vy3d=1", { waitUntil: "networkidle" });
  await shot("home", { wait: 4500 });
  await p.goto(BASE + "/pricing", { waitUntil: "networkidle" });
  await p.mouse.wheel(0, 520); await shot("pricing", { wait: 2500 });

  // demo account with a chart
  await p.goto(BASE + "/onboarding", { waitUntil: "networkidle" });
  await p.locator("#name").fill("Ananya Rao");
  await p.getByRole("button", { name: /Continue/ }).click();
  await p.locator("#dob").fill("1994-06-21");
  await p.getByRole("button", { name: /Continue/ }).click();
  await p.getByRole("radio", { name: /Approximate/ }).click();
  await p.getByRole("button", { name: /Continue/ }).click();
  await p.locator("#place").fill("Bengaluru");
  await p.getByRole("option").first().click();
  await p.getByRole("button", { name: /Continue/ }).click();
  await p.getByRole("button", { name: /Calculate my chart/ }).click();
  await p.getByText("Your sky is ready.").waitFor({ timeout: 30000 });
  await shot("ready", { wait: 2500 });
  await p.getByRole("button", { name: /View my Kundli/ }).click();
  await p.getByRole("link", { name: /Create free account/ }).click();
  await p.waitForLoadState("networkidle");
  await p.locator("#name").fill("Ananya Rao");
  await p.locator("#email").fill(`ananya.${Date.now()}@example.com`);
  await p.locator("#password").fill("a-long-demo-password");
  await p.getByRole("button", { name: "Create account" }).click();
  await p.waitForURL("**/onboarding/save");
  await p.waitForLoadState("networkidle");
  await p.getByText("Store my birth details").click();
  await p.getByText(/I agree to the/).click();
  await p.getByRole("button", { name: /Save securely/ }).click();
  await p.waitForURL("**/dashboard");
  await shot("dashboard", { wait: 2500 });

  await p.goto(BASE + "/dashboard/guide", { waitUntil: "networkidle" });
  await shot("guide-top");
  await p.locator("#areas").scrollIntoViewIfNeeded(); await p.mouse.wheel(0, -60); await shot("guide-areas");
  await p.locator("#do").scrollIntoViewIfNeeded(); await shot("guide-remedies");
  await p.locator("#next").scrollIntoViewIfNeeded(); await shot("guide-future");

  await p.goto(BASE + "/dashboard/kundli", { waitUntil: "networkidle" });
  await shot("kundli", { wait: 2500 });

  await p.goto(BASE + "/dashboard/aura?q=" + encodeURIComponent("What does my chart say about my career this year?"), { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Chart factors/ }).waitFor({ timeout: 30000 });
  await p.getByRole("button", { name: /Chart factors/ }).click();
  await shot("aura", { wait: 1500 });
  await b.close();
})();
