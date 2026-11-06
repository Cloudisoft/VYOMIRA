import { COMPANY } from "./company";

/** Canonical site identity for metadata, structured data (JSON-LD) and /llms.txt. */
export const SITE = {
  url: (process.env.NEXT_PUBLIC_APP_URL ?? "https://vyomira.cloudisoft.com").replace(/\/$/, ""),
  name: "VYOMIRA",
  tagline: "Your Universe. Your Story.",
  description:
    "Free Vedic Kundli (Janam Kundli) calculated from real astronomy for your exact birth time and place, a plain-language Life Guide to your past, present and future, and AURA — an AI astrologer that shows the chart factors behind every answer.",
  logo: "/brand/vyomira-app-logo.png",
  publisher: "Cloudisoft",
};

export const abs = (path = "/") => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": abs("/#organization"),
    name: SITE.publisher,
    brand: { "@type": "Brand", name: SITE.name, logo: abs(SITE.logo) },
    url: SITE.url,
    logo: abs(SITE.logo),
    email: COMPANY.supportEmail,
    telephone: COMPANY.phone.replace(/\s/g, ""),
    contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", email: COMPANY.supportEmail, telephone: COMPANY.phone.replace(/\s/g, ""), areaServed: "IN", availableLanguage: ["English", "Hindi"] }],
  };
}

export function websiteLd() {
  return { "@context": "https://schema.org", "@type": "WebSite", "@id": abs("/#website"), name: SITE.name, alternateName: "VYOMIRA Vedic Astrology", url: SITE.url, description: SITE.description, inLanguage: ["en-IN", "hi-IN"], publisher: { "@id": abs("/#organization") } };
}

export function appLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": abs("/#app"),
    name: SITE.name,
    url: SITE.url,
    image: abs(SITE.logo),
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description: SITE.description,
    inLanguage: ["en", "hi"],
    publisher: { "@id": abs("/#organization") },
    featureList: [
      "Free Vedic birth chart (D1, Navamsa D9, Dashamsa D10) in North and South Indian styles",
      "Vimshottari dasha timeline and current transits",
      "Life Guide: past, present and future in plain language with remedies",
      "AURA AI astrologer that cites the chart factors behind every answer",
      "Guna Milan compatibility (36 points)",
      "Shadbala and Ashtakavarga",
      "PDF reports in English and Hindi",
    ],
    offers: [
      { "@type": "Offer", name: "Free Kundli", price: "0", priceCurrency: "INR" },
      { "@type": "Offer", name: "Starter — 10 AURA messages", price: "199", priceCurrency: "INR" },
      { "@type": "Offer", name: "Cosmic Plus — 25 messages and reports", price: "599", priceCurrency: "INR" },
      { "@type": "Offer", name: "Explorer monthly — 50 messages", price: "349", priceCurrency: "INR" },
      { "@type": "Offer", name: "Cosmic Plus monthly — 120 messages", price: "649", priceCurrency: "INR" },
    ],
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
}

export function breadcrumbLd(items: [string, string][]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(path) })) };
}

export function articleLd(a: { slug: string; title: string; summary: string; updated: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.summary,
    url: abs(`/learn/${a.slug}`),
    mainEntityOfPage: abs(`/learn/${a.slug}`),
    datePublished: a.updated,
    dateModified: a.updated,
    inLanguage: "en-IN",
    image: abs("/brand/vyomira-banner.webp"),
    author: { "@type": "Organization", name: `${SITE.name} by ${SITE.publisher}`, url: SITE.url },
    publisher: { "@id": abs("/#organization") },
    about: "Vedic astrology (Jyotish)",
  };
}

/** Renders a JSON-LD block. Escapes "<" so the payload can never break out of the script tag. */
export const ldScript = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
