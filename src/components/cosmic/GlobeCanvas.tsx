"use client";
import { useEffect, useRef } from "react";

/**
 * A genuinely rotating globe without WebGL: a procedural equirectangular texture is generated once,
 * then each frame every pixel of the disc looks up its (rotated) longitude/latitude and is shaded with
 * precomputed lighting. ~70k pixels per frame, 30 fps, paused off-screen / in background tabs.
 */
const TEX_W = 512;
const TEX_H = 256;

function hash(x: number, y: number, z: number) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v), l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
function fbm(x: number, y: number, z: number) {
  let v = 0, a = 0.5;
  for (let i = 0; i < 5; i++) { v += a * noise3(x, y, z); x *= 2.03; y *= 2.03; z *= 2.03; a *= 0.5; }
  return v;
}
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * Math.max(0, Math.min(1, t)));
const smooth = (e0: number, e1: number, x: number) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

/** Same palette and structure as the WebGL shader: turbulent bands, large patches, storms. */
function buildTexture(): Uint8ClampedArray {
  const tex = new Uint8ClampedArray(TEX_W * TEX_H * 3);
  const deep = [9, 11, 36], indigo = [33, 31, 102], violet = [77, 56, 168], lilac = [168, 148, 237], gold = [219, 179, 115];
  const storms = [[0.72, -0.28, 0.63], [-0.8, 0.22, 0.55], [0.1, 0.42, -0.9], [-0.35, -0.55, -0.76]].map((s) => { const n = Math.hypot(...s); return s.map((v) => v / n); });
  for (let j = 0; j < TEX_H; j++) {
    const lat = (0.5 - (j + 0.5) / TEX_H) * Math.PI;
    for (let i = 0; i < TEX_W; i++) {
      const lon = ((i + 0.5) / TEX_W) * Math.PI * 2;
      const px = Math.cos(lat) * Math.cos(lon), py = Math.sin(lat), pz = Math.cos(lat) * Math.sin(lon);
      const warp = fbm(px * 3, py * 3, pz * 3);
      const la = py + (warp - 0.5) * 0.22;
      const bands = 0.5 + 0.5 * Math.sin(la * 22 + fbm(px * 6, py * 6, pz * 6) * 3);
      const fine = fbm(px * 2, la * 18, pz * 2);
      const patches = smooth(0.52, 0.68, fbm(px * 2.4 + 7, py * 2.4 + 7, pz * 2.4 + 7));
      let sd = 9;
      storms.forEach((s, k) => { sd = Math.min(sd, Math.hypot(px - s[0], py - s[1], pz - s[2]) * (1 + k * 0.15)); });
      const storm = smooth(0.3, 0, sd);
      const swirl = fbm(px * 14 + sd * 20, py * 14 + sd * 20, pz * 14 + sd * 20);
      let col = mix(deep, indigo, bands);
      col = mix(col, violet, smooth(0.45, 0.85, fine) * 0.8);
      col = mix(col, lilac, smooth(0.72, 0.95, fine * bands) * 0.5);
      col = mix(col, mix(lilac, gold, fbm(px * 5, py * 5, pz * 5)), patches * 0.45);
      col = mix(col, mix(gold, lilac, swirl), storm * 0.8);
      const o = (j * TEX_W + i) * 3;
      tex[o] = col[0]; tex[o + 1] = col[1]; tex[o + 2] = col[2];
    }
  }
  return tex;
}

let cachedTex: Uint8ClampedArray | null = null;

export function GlobeCanvas({ className, size = 360 }: { className?: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N = size;
    canvas.width = N;
    canvas.height = N;
    const tex = (cachedTex ??= buildTexture());
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
      if (!visible || t - last < 33) return; // ~30 fps
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
    return () => { cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [size]);
  return <canvas ref={ref} aria-hidden className={className} />;
}
