"use client";
import { useEffect, useRef } from "react";

/**
 * A genuinely rotating globe without WebGL: a procedural equirectangular texture is generated once,
 * then each frame every pixel of the disc looks up its (rotated) longitude/latitude and is shaded with
 * precomputed lighting. ~70k pixels per frame, 30 fps, paused off-screen / in background tabs.
 */
import { buildTexture, smooth, TEX_H, TEX_W } from "@/lib/globe-texture";

let cachedTex: Uint8ClampedArray | null = null;

/** Prefer the prebuilt texture image (tiny download); compute it only if the image can't load. */
async function loadTexture(): Promise<Uint8ClampedArray> {
  if (cachedTex) return cachedTex;
  try {
    const im = new Image();
    im.decoding = "async";
    im.src = "/brand/globe-texture.webp";
    await im.decode();
    const c = document.createElement("canvas");
    c.width = TEX_W; c.height = TEX_H;
    const x = c.getContext("2d", { willReadFrequently: true })!;
    x.drawImage(im, 0, 0, TEX_W, TEX_H);
    const d = x.getImageData(0, 0, TEX_W, TEX_H).data;
    const t = new Uint8ClampedArray(TEX_W * TEX_H * 3);
    for (let i = 0, j = 0; i < d.length; i += 4, j += 3) { t[j] = d[i]; t[j + 1] = d[i + 1]; t[j + 2] = d[i + 2]; }
    return (cachedTex = t);
  } catch {
    return (cachedTex = buildTexture());
  }
}

/** Run after the page has settled, so the globe never competes with first paint. */
const whenIdle = (fn: () => void) => {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 1500 }); else setTimeout(fn, 400);
};

export function GlobeCanvas({ className, size = 360 }: { className?: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 767px)").matches;
    // Phones: fewer pixels and frames — still a smoothly turning globe, a fraction of the CPU.
    const N = small ? Math.min(size, 220) : size;
    const frameMs = small ? 50 : 33;
    canvas.width = N;
    canvas.height = N;
    let cancelled = false;
    let stop = () => {};
    const begin = async () => {
    const tex = await loadTexture();
    if (cancelled) return;
    const img = ctx.createImageData(N, N);
    const data = img.data;

    // Precompute, per disc pixel: texture row, base longitude column, lighting (diffuse + rim).
    const tilt = -0.3; // axial tilt (radians) around the view axis
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    const L = [-0.62, 0.42, 0.66]; const ln = Math.hypot(...L); L[0] /= ln; L[1] /= ln; L[2] /= ln;
    const idx: number[] = [], row: number[] = [], baseCol: number[] = [], shade: number[] = [], rim: number[] = [], alpha: number[] = [];
    const r = N / 2 - 1;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const nx = (x + 0.5 - N / 2) / r, ny = (N / 2 - y - 0.5) / r;
      const d2 = nx * nx + ny * ny;
      if (d2 > 1) continue;
      const nz = Math.sqrt(1 - d2);
      // undo the axial tilt to get body-frame coordinates
      const bx = nx * ct + ny * st, by = -nx * st + ny * ct;
      const lat = Math.asin(Math.max(-1, Math.min(1, by)));
      const lon = Math.atan2(nz, bx);
      idx.push((y * N + x) * 4);
      row.push(Math.min(TEX_H - 1, Math.floor((0.5 - lat / Math.PI) * TEX_H)));
      baseCol.push(((lon / (Math.PI * 2)) * TEX_W + TEX_W * 4) % TEX_W);
      const ndl = nx * L[0] + ny * L[1] + nz * L[2];
      const day = smooth(-0.15, 0.45, ndl);
      shade.push(0.07 + day * 1.12);
      rim.push(Math.pow(1 - nz, 3) * (0.25 + day * 0.55));
      const edge = Math.sqrt(d2);
      alpha.push(edge > 0.985 ? Math.max(0, (1 - edge) / 0.015) * 255 : 255);
    }

    let raf = 0, last = 0, offset = 0, visible = true;
    const speed = (reduce ? 0.012 : 0.035) * TEX_W; // texture columns per second
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || t - last < frameMs) return; // ~30 fps desktop, ~20 fps phones
      const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
      last = t;
      offset = (offset + dt * speed) % TEX_W;
      for (let k = 0; k < idx.length; k++) {
        let c = (baseCol[k] + offset) | 0;
        if (c >= TEX_W) c -= TEX_W;
        const o = (row[k] * TEX_W + c) * 3;
        const s = shade[k], rm = rim[k] * 255;
        const p = idx[k];
        data[p] = tex[o] * s + 158 * rm / 255;
        data[p + 1] = tex[o + 1] * s + 133 * rm / 255;
        data[p + 2] = tex[o + 2] * s + 255 * rm / 255;
        data[p + 3] = alpha[k];
      }
      ctx.putImageData(img, 0, 0);
    };
    raf = requestAnimationFrame(draw);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const onVis = () => { visible = !document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    stop = () => { cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
    };
    whenIdle(() => { void begin(); });
    return () => { cancelled = true; stop(); };
  }, [size]);
  return <canvas ref={ref} aria-hidden className={className} />;
}
