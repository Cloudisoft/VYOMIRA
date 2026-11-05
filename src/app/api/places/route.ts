import { searchPlaces } from "@/server/places";
import { err, json, publicLimited } from "@/server/http";

export async function GET(req: Request) {
  const limited = await publicLimited("places", 120, 60);
  if (limited) return limited;
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 80) ?? "";
  if (q.trim().length < 2) return err(400, "Query too short");
  return json({ places: searchPlaces(q, 8).map((p) => ({ id: p.id, label: p.label, name: p.name, country: p.country, lat: p.lat, lng: p.lng, tz: p.tz })) }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
