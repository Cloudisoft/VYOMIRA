/**
 * Procedural surface for the 2D rotating globe (same palette/structure as the WebGL shader).
 * Generated once at build time into public/brand/globe-texture.webp (scripts/gen-globe-texture.ts)
 * so phones download a ~20 KB image instead of computing ~30M noise samples on load.
 */
export const TEX_W = 512;
export const TEX_H = 256;

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
export const smooth = (e0: number, e1: number, x: number) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

/** Same palette and structure as the WebGL shader: turbulent bands, large patches, storms. */
export function buildTexture(): Uint8ClampedArray {
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

