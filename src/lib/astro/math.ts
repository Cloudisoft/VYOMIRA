export const DEG = Math.PI / 180;
export const norm360 = (x: number) => ((x % 360) + 360) % 360;
export const signOf = (lon: number) => Math.floor(norm360(lon) / 30);
export const degInSign = (lon: number) => norm360(lon) % 30;

/** Format decimal degrees as D°MM'SS". */
export function dms(x: number): string {
  const sign = x < 0 ? "-" : "";
  let a = Math.abs(x);
  let d = Math.floor(a);
  a = (a - d) * 60;
  let m = Math.floor(a);
  let s = Math.round((a - m) * 60);
  if (s === 60) { s = 0; m += 1; }
  if (m === 60) { m = 0; d += 1; }
  return `${sign}${d}°${String(m).padStart(2, "0")}′${String(s).padStart(2, "0")}″`;
}

export const JD_UNIX_EPOCH = 2440587.5;
export const jdFromDate = (d: Date) => d.getTime() / 86400000 + JD_UNIX_EPOCH;
export const dateFromJd = (jd: number) => new Date((jd - JD_UNIX_EPOCH) * 86400000);

type Mat = number[][];
export const mul = (a: Mat, b: Mat): Mat =>
  a.map((r) => b[0].map((_, j) => r.reduce((s, v, k) => s + v * b[k][j], 0)));
export const mulVec = (a: Mat, v: number[]) => a.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
export const transpose = (a: Mat): Mat => a[0].map((_, j) => a.map((r) => r[j]));
export const rotX = (t: number): Mat => [[1, 0, 0], [0, Math.cos(t), Math.sin(t)], [0, -Math.sin(t), Math.cos(t)]];
export const rotY = (t: number): Mat => [[Math.cos(t), 0, -Math.sin(t)], [0, 1, 0], [Math.sin(t), 0, Math.cos(t)]];
export const rotZ = (t: number): Mat => [[Math.cos(t), Math.sin(t), 0], [-Math.sin(t), Math.cos(t), 0], [0, 0, 1]];
