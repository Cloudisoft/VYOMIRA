/**
 * Generates favicon / app icons and Open Graph share images with the real brand fonts and logo.
 * Run: node scripts/brand/gen-images.cjs   (uses the pre-installed Chromium)
 */
const { chromium } = require("playwright");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const ICON_SVG = fs.readFileSync(path.join(ROOT, "src/app/icon.svg"), "utf8");
const MARK = ICON_SVG.replace(/<rect[^>]*\/>/, "").replace("translate(4 4) scale(.875)", "translate(0 0) scale(1)");
const font = (f) => "file://" + path.join(ROOT, f);
const ARTICLES = JSON.parse(process.argv[2] || "[]");

const css = `
@font-face { font-family: Cormorant; src: url(${font("scripts/video/fonts/cormorant-latin.woff2")}) format("woff2"); }
@font-face { font-family: Cormorant; src: url(${font("scripts/video/fonts/cormorant-latin-ext.woff2")}) format("woff2"); unicode-range: U+0100-02BA, U+20A0-20C0; }
@font-face { font-family: Manrope; src: url(${font("scripts/video/fonts/manrope-latin.woff2")}) format("woff2"); font-weight: 200 800; }
@font-face { font-family: Manrope; src: url(${font("scripts/video/fonts/manrope-latin-ext.woff2")}) format("woff2"); font-weight: 200 800; unicode-range: U+0100-02BA, U+20A0-20C0; }
@font-face { font-family: Deva; src: url(${font("assets/fonts/NotoSansDevanagari-Regular.ttf")}) format("truetype"); unicode-range: U+0900-097F; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; color: #E9E3F5; font-family: Manrope, Deva, sans-serif;
  background: radial-gradient(ellipse 60% 70% at 78% 45%, rgba(114,86,216,.42), transparent 60%), radial-gradient(ellipse 50% 50% at 0% 100%, rgba(216,180,119,.14), transparent 60%), #080D20; }
.stars { position: absolute; inset: 0; background-image: radial-gradient(1.2px 1.2px at 12% 18%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 32% 72%, #F1DCAE 50%, transparent 51%), radial-gradient(1.4px 1.4px at 52% 12%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 68% 84%, #C9B8FF 50%, transparent 51%), radial-gradient(1.2px 1.2px at 88% 22%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 22% 48%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 44% 38%, #C9B8FF 50%, transparent 51%), radial-gradient(1.3px 1.3px at 95% 60%, #F1DCAE 50%, transparent 51%), radial-gradient(1px 1px at 6% 86%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 60% 55%, #fff 50%, transparent 51%); opacity: .8; }
.planet { position: absolute; width: 470px; height: 470px; right: -70px; top: 80px; border-radius: 50%;
  background: radial-gradient(circle at 74% 76%, rgba(3,4,14,.85) 14%, transparent 58%), radial-gradient(circle at 30% 28%, rgba(255,240,220,.22), transparent 40%), url(${font("public/brand/globe-texture.webp")}) center/220% 100%;
  box-shadow: inset -40px -30px 80px rgba(0,0,0,.65), inset 10px 6px 40px rgba(165,139,255,.35), 0 0 120px rgba(114,86,216,.55); }
.ring { position: absolute; right: -230px; top: 250px; width: 800px; height: 150px; border-radius: 50%; border: 2px solid rgba(216,180,119,.55); transform: rotate(-14deg); box-shadow: 0 0 30px rgba(216,180,119,.2); }
.brand { position: absolute; left: 72px; top: 64px; display: flex; align-items: center; gap: 18px; }
.brand span { font-family: Cormorant; font-size: 40px; letter-spacing: .32em; color: #ECD3A2; }
.eyebrow { font-size: 20px; letter-spacing: .3em; text-transform: uppercase; color: #D8B477; }
h1 { font-family: Cormorant, Deva, serif; font-weight: 500; line-height: 1.02; letter-spacing: -.01em; }
.gold { background: linear-gradient(100deg, #f1dcae, #d8b477 45%, #b98d4f); -webkit-background-clip: text; background-clip: text; color: transparent; }
.sub { color: #9BA3BC; font-size: 27px; line-height: 1.4; }
.pill { display: inline-block; margin-top: 30px; padding: 14px 28px; border-radius: 999px; font-weight: 700; font-size: 22px; color: #1a1407; background: linear-gradient(180deg, #ecd3a2, #d8b477 55%, #c39a5c); }
.copy { position: absolute; left: 72px; top: 165px; width: 640px; }
`;
const brand = `<div class="brand">${MARK.replace("<svg ", '<svg width="64" height="64" ')}<span>VYOMIRA</span></div>`;
const card = (inner, planet = true) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="stars"></div>${planet ? '<div class="planet"></div><div class="ring"></div>' : ""}${brand}<div class="copy">${inner}</div></body></html>`;

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const shoot = async (html, out) => { const f = path.join(ROOT, ".og-tmp.html"); fs.writeFileSync(f, html); await p.goto("file://" + f); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150); const png = await p.screenshot({ type: "png" }); await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toFile(out); fs.unlinkSync(f); console.log("wrote", path.relative(ROOT, out)); };

  // Default share card
  await shoot(card(`<p class="eyebrow">Free Vedic Kundli · AI Astrologer</p><h1 style="font-size:72px;margin-top:20px">Your universe has a story written in your <span class="gold">stars.</span></h1><p class="sub" style="margin-top:18px;font-size:25px">Past, present &amp; future — in simple words.<br>English · हिन्दी · Hinglish</p><span class="pill">vyomira.cloudisoft.com</span>`), path.join(ROOT, "public/og/default.jpg"));
  // Pricing
  await shoot(card(`<p class="eyebrow">Honest pricing</p><h1 style="font-size:88px;margin-top:22px">Your Kundli is <span class="gold">free.</span> Forever.</h1><p class="sub" style="margin-top:22px">Ask AURA from ₹199 · Monthly from ₹349 · Cancel anytime</p><span class="pill">vyomira.cloudisoft.com/pricing</span>`), path.join(ROOT, "public/og/pricing.jpg"));
  // Learn index + every article
  await shoot(card(`<p class="eyebrow">Learn Jyotish</p><h1 style="font-size:84px;margin-top:22px">Understand the sky behind your <span class="gold">chart.</span></h1><p class="sub" style="margin-top:22px">Kundli · Dasha · Sade Sati · Rahu &amp; Ketu · Nakshatras</p><span class="pill">vyomira.cloudisoft.com/learn</span>`), path.join(ROOT, "public/og/learn.jpg"));
  for (const a of ARTICLES) {
    const size = a.title.length > 48 ? 58 : a.title.length > 34 ? 66 : 76;
    await shoot(card(`<p class="eyebrow">Learn Jyotish</p><h1 style="font-size:${size}px;margin-top:22px">${a.title.replace(/&/g, "&amp;")}</h1><p class="sub" style="margin-top:22px;font-size:24px">${a.summary.replace(/&/g, "&amp;").slice(0, 120).replace(/\s+\S*$/, "")}${a.summary.length > 120 ? "…" : ""}</p><span class="pill">Read on vyomira.cloudisoft.com</span>`), path.join(ROOT, `public/og/learn-${a.slug}.jpg`));
  }

  // Icons from the SVG mark (rounded navy tile)
  const iconPng = async (size, out, opts = {}) => {
    const svg = opts.square ? ICON_SVG.replace('rx="14"', 'rx="0"') : ICON_SVG;
    const pad = opts.maskable ? Math.round(size * 0.1) : 0;
    let img = sharp(Buffer.from(svg), { density: Math.ceil((size / 64) * 72 * 2) }).resize(size - pad * 2, size - pad * 2);
    if (pad) img = sharp(await img.png().toBuffer()).extend({ top: pad, bottom: pad, left: pad, right: pad, background: "#080D20" });
    const buf = await img.png().toBuffer();
    if (out) { fs.writeFileSync(out, buf); console.log("wrote", path.relative(ROOT, out)); }
    return buf;
  };
  await iconPng(180, path.join(ROOT, "src/app/apple-icon.png"), { square: true });
  await iconPng(192, path.join(ROOT, "public/icons/icon-192.png"));
  await iconPng(512, path.join(ROOT, "public/icons/icon-512.png"));
  await iconPng(512, path.join(ROOT, "public/icons/icon-maskable-512.png"), { square: true, maskable: true });
  // favicon.ico with 16/32/48 PNG entries
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map((s) => iconPng(s)));
  const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
  let offset = 6 + 16 * sizes.length;
  const dir = sizes.map((s, i) => { const e = Buffer.alloc(16); e.writeUInt8(s, 0); e.writeUInt8(s, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(pngs[i].length, 8); e.writeUInt32LE(offset, 12); offset += pngs[i].length; return e; });
  fs.writeFileSync(path.join(ROOT, "src/app/favicon.ico"), Buffer.concat([header, ...dir, ...pngs]));
  console.log("wrote src/app/favicon.ico");
  await b.close();
})();
