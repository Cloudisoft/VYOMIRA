// Usage: node scripts/video/preview.cjs <video> <outdir> t1 t2 ...  — renders still frames for review
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const [v, out, ...ts] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on("pageerror", (e) => console.error("pageerror", e.message));
  await p.goto("file://" + path.join(__dirname, "stage.html") + "?v=" + v);
  await p.evaluate(() => window.ready);
  for (const t of ts) { await p.evaluate((t) => window.renderAt(t), Number(t)); await p.screenshot({ path: path.join(out, `v${v}-${t}.jpg`), quality: 80, type: "jpeg" }); }
  await b.close();
})();
