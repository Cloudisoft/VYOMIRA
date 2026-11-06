/**
 * Renders the promo videos: deterministic frames from stage.html → H.264 MP4 with the synthesised music.
 * Usage: node scripts/video/render.cjs [videoNumbers...]   (default: 1 2 3 4 5)
 * Output: public/videos/<slug>.mp4 and <slug>.jpg (poster)
 */
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const FPS = 30, DUR = 30;
const OUT = path.join(__dirname, "..", "..", "public", "videos");

(async () => {
  const list = process.argv.slice(2).length ? process.argv.slice(2) : ["1", "2", "3", "4", "5"];
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  for (const v of list) {
    const tmp = fs.mkdtempSync(path.join(process.env.FRAMES_DIR || os.tmpdir(), `vy-v${v}-`));
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    p.on("pageerror", (e) => console.error("pageerror", e.message));
    await p.goto("file://" + path.join(__dirname, "stage.html") + "?v=" + v);
    await p.evaluate(() => window.ready);
    const meta = await p.evaluate(() => ({ slug: window.VIDEOS[new URLSearchParams(location.search).get("v")].slug, music: window.VIDEOS[new URLSearchParams(location.search).get("v")].music }));
    const t0 = Date.now();
    for (let f = 0; f < FPS * DUR; f++) {
      await p.evaluate((t) => window.renderAt(t), f / FPS);
      await p.screenshot({ path: path.join(tmp, `f${String(f).padStart(4, "0")}.jpg`), type: "jpeg", quality: 92 });
    }
    await p.evaluate(() => window.renderAt(3.2));
    await p.screenshot({ path: path.join(OUT, `${meta.slug}.jpg`), type: "jpeg", quality: 82 });
    await p.close();
    const wav = path.join(tmp, "music.wav");
    execFileSync("node", [path.join(__dirname, "music.cjs"), String(meta.music), wav, String(DUR)]);
    const mp4 = path.join(OUT, `${meta.slug}.mp4`);
    execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(tmp, "f%04d.jpg"), "-i", wav,
      "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p", "-profile:v", "high", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", mp4]);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`video ${v} → ${mp4} (${(fs.statSync(mp4).size / 1e6).toFixed(1)} MB, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  await b.close();
})();
