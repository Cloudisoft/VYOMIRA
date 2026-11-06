import type { MetadataRoute } from "next";

/** Web app manifest — lets phones add VYOMIRA to the home screen with the brand icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VYOMIRA — Free Vedic Kundli & AI Astrologer",
    short_name: "VYOMIRA",
    description: "Free Vedic Kundli, a plain-language Life Guide to your past, present and future, and AURA — an AI astrologer that shows its reasons.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#080D20",
    theme_color: "#080D20",
    lang: "en-IN",
    categories: ["lifestyle", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
