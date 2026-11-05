import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/learn";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const paths = ["", "/pricing", "/learn", "/methodology", "/onboarding", "/contact", "/legal/privacy", "/legal/terms", "/legal/refunds", "/legal/disclaimer", "/legal/attributions", ...ARTICLES.map((a) => `/learn/${a.slug}`)];
  return paths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.6 }));
}
