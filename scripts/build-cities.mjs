#!/usr/bin/env node
/**
 * Builds data/places.json from the GeoNames "cities15000" dump.
 * Source: https://download.geonames.org/export/dump/ (CC BY 4.0 — attribution required, see /legal/attributions).
 *
 * Usage: node scripts/build-cities.mjs <dir-containing cities15000.txt, admin1CodesASCII.txt, countryInfo.txt>
 * The GeoNames record already carries an IANA timezone identifier for every place, so we
 * never derive timezones from longitude.
 */
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: node scripts/build-cities.mjs <geonames-dir>");
  process.exit(1);
}
const read = (f) => fs.readFileSync(path.join(dir, f), "utf8");

const admin1 = new Map();
for (const line of read("admin1CodesASCII.txt").split("\n")) {
  if (!line) continue;
  const [code, name] = line.split("\t");
  admin1.set(code, name);
}
const countries = new Map();
for (const line of read("countryInfo.txt").split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const cols = line.split("\t");
  countries.set(cols[0], cols[4]);
}

const out = [];
for (const line of read("cities15000.txt").split("\n")) {
  if (!line) continue;
  const c = line.split("\t");
  const [id, name, ascii, , lat, lng, , , cc, , a1, , , , pop, , , tz] = c;
  if (!tz) continue;
  out.push([
    Number(id),
    name,
    ascii,
    admin1.get(`${cc}.${a1}`) ?? "",
    cc,
    Number(Number(lat).toFixed(5)),
    Number(Number(lng).toFixed(5)),
    tz,
    Number(pop) || 0,
  ]);
}
out.sort((a, b) => b[8] - a[8]);
const payload = {
  source: "GeoNames cities15000 (https://www.geonames.org) — CC BY 4.0",
  generatedAt: new Date().toISOString(),
  fields: ["id", "name", "ascii", "admin1", "country", "lat", "lng", "tz", "population"],
  countries: Object.fromEntries(countries),
  rows: out,
};
fs.writeFileSync(path.join(process.cwd(), "data/places.json"), JSON.stringify(payload));
console.log(`wrote ${out.length} places`);
