import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/learn";
import { SITE } from "@/lib/seo";

const UPDATED = "2026-11-06";

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" | "yearly" = "weekly", lastModified = UPDATED) => ({ url: `${SITE.url}${path}`, lastModified, changeFrequency, priority });
  return [
    page("", 1, "weekly"),
    page("/onboarding", 0.9, "monthly"),
    page("/pricing", 0.8, "monthly"),
    page("/learn", 0.8, "weekly"),
    ...ARTICLES.map((a) => page(`/learn/${a.slug}`, 0.7, "monthly", a.updated ?? "2026-11-05")),
    page("/methodology", 0.6, "monthly"),
    page("/contact", 0.5, "yearly"),
    ...["privacy", "terms", "refunds", "disclaimer", "cookies", "grievance", "privacy-hi", "attributions"].map((p) => page(`/legal/${p}`, 0.3, "yearly")),
  ];
}
