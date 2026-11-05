import "server-only";
import fs from "node:fs";
import path from "node:path";

type Row = [number, string, string, string, string, number, number, string, number];
interface Data { rows: Row[]; countries: Record<string, string> }
export interface Place { id: number; name: string; admin1: string; country: string; countryName: string; lat: number; lng: number; tz: string; population: number; label: string }

let data: (Data & { norm: string[] }) | null = null;
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function load() {
  if (data) return data;
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/places.json"), "utf8")) as Data;
  data = { ...raw, norm: raw.rows.map((r) => norm(r[2] || r[1])) };
  return data;
}

function toPlace(r: Row, countries: Record<string, string>): Place {
  const countryName = countries[r[4]] ?? r[4];
  return { id: r[0], name: r[1], admin1: r[3], country: r[4], countryName, lat: r[5], lng: r[6], tz: r[7], population: r[8], label: [r[1], r[3], countryName].filter(Boolean).join(", ") };
}

/** Prefix search over GeoNames cities (pop ≥ 15k), ranked by exact > prefix > word-prefix, then population. */
export function searchPlaces(q: string, limit = 8): Place[] {
  const d = load();
  const [cityPart, ...rest] = norm(q).split(",").map((s) => s.trim());
  if (!cityPart || cityPart.length < 2) return [];
  const qualifier = rest.join(" ");
  const scored: { i: number; s: number }[] = [];
  for (let i = 0; i < d.rows.length; i++) {
    const n = d.norm[i];
    let s = 0;
    if (n === cityPart) s = 3;
    else if (n.startsWith(cityPart)) s = 2;
    else if (n.includes(` ${cityPart}`)) s = 1;
    if (!s) continue;
    if (qualifier) {
      const r = d.rows[i];
      const ctx = norm(`${r[3]} ${r[4]} ${d.countries[r[4]] ?? ""}`);
      if (!ctx.includes(qualifier)) continue;
    }
    scored.push({ i, s });
    if (scored.length > 400) break;
  }
  scored.sort((a, b) => b.s - a.s || d.rows[b.i][8] - d.rows[a.i][8]);
  return scored.slice(0, limit).map(({ i }) => toPlace(d.rows[i], d.countries));
}

export function placeById(id: number): Place | null {
  const d = load();
  const r = d.rows.find((x) => x[0] === id);
  return r ? toPlace(r, d.countries) : null;
}
