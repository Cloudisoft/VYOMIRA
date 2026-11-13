/**
 * Launch pricing — DEFAULTS ONLY. Live values come from AdminConfig("pricing") and are editable
 * in /admin/pricing. Amounts are in minor units (paise, cents). These are business targets,
 * not guaranteed margins.
 */
export type PlanId = "starter" | "cosmic_plus";

export interface PlanDef {
  id: PlanId;
  name: string;
  tagline: string;
  aiMessages: number;
  detailedReports: boolean;
  features: string[];
  highlight?: boolean;
}

export interface RegionPrice {
  currency: string;
  symbol: string;
  prices: Record<PlanId, number>; // minor units
}

/** Monthly plans billed by recurring mandate (PayU Standing Instructions / UPI Autopay / card e-mandate). INR only. */
export interface SubscriptionPlanDef {
  id: "explorer_monthly" | "cosmic_plus_monthly";
  name: string;
  tagline: string;
  aiMessagesPerMonth: number;
  detailedReports: boolean;
  priceMinor: number; // INR paise per month
  features: string[];
  highlight?: boolean;
}

export type ReadingCategory = "numerology" | "tarot" | "palmistry" | "bundle";

/** One-time reading products (INR, paise). `launchPriceMinor` (if set) is the introductory price charged. */
export interface ReadingProduct {
  id: string;
  category: ReadingCategory;
  tier: string;
  name: string;
  description: string;
  priceMinor: number;
  launchPriceMinor?: number | null;
  active: boolean;
  /** Bundle only: product ids granted as one-time credits. */
  grants?: string[];
}

export interface PricingConfig {
  readings: ReadingProduct[];
  plans: PlanDef[];
  subscriptions: SubscriptionPlanDef[];
  free: { aiMessages: number; features: string[] };
  regions: Record<string, RegionPrice>; // ISO country → price; "DEFAULT" fallback; "EU" for eurozone
  euCountries: string[];
}

export const DEFAULT_READING_PRODUCTS: ReadingProduct[] = [
  { id: "numerology_basic", category: "numerology", tier: "basic", name: "Numerology Basic", description: "Your core numbers with a clear overview and summary.", priceMinor: 9900, launchPriceMinor: 7900, active: true },
  { id: "numerology_detailed", category: "numerology", tier: "detailed", name: "Numerology Detailed", description: "Core numbers plus career, relationships, strengths and your Personal Year.", priceMinor: 14900, launchPriceMinor: null, active: true },
  { id: "numerology_complete", category: "numerology", tier: "complete", name: "Numerology Complete", description: "Everything, plus your Lo Shu grid, missing and repeated numbers, and a three-year outlook.", priceMinor: 24900, launchPriceMinor: null, active: true },
  { id: "tarot_single", category: "tarot", tier: "single", name: "Single Card", description: "One card for one clear question.", priceMinor: 4900, launchPriceMinor: 3900, active: true },
  { id: "tarot_three", category: "tarot", tier: "three", name: "Three Cards — Past, Present, Future", description: "How a situation has moved and where it is heading.", priceMinor: 9900, launchPriceMinor: 7900, active: true },
  { id: "tarot_five", category: "tarot", tier: "five", name: "Five-Card Guidance", description: "Situation, challenge, hidden influence, guidance and direction.", priceMinor: 14900, launchPriceMinor: null, active: true },
  { id: "tarot_celtic", category: "tarot", tier: "celtic", name: "Celtic Cross", description: "The classic ten-position spread for a full picture.", priceMinor: 19900, launchPriceMinor: null, active: true },
  { id: "palmistry_basic", category: "palmistry", tier: "basic", name: "Palm Reading Basic", description: "Your major lines and palm shape, with an overview.", priceMinor: 9900, launchPriceMinor: 7900, active: true },
  { id: "palmistry_detailed", category: "palmistry", tier: "detailed", name: "Palm Reading Detailed", description: "All visible lines, mounts, personality, career and relationships.", priceMinor: 14900, launchPriceMinor: null, active: true },
  { id: "palmistry_complete", category: "palmistry", tier: "complete", name: "Palm Reading Complete", description: "Both hands compared, every section, plus personal development.", priceMinor: 19900, launchPriceMinor: null, active: true },
  { id: "bundle_insight", category: "bundle", tier: "bundle", name: "Self-Discovery Bundle", description: "Palm Reading Detailed + Numerology Detailed + Three-Card Tarot, and Combined Insights.", priceMinor: 29900, launchPriceMinor: 24900, active: true, grants: ["palmistry_detailed", "numerology_detailed", "tarot_three"] },
];

/** The price actually charged today (introductory price if one is set). */
export const chargePrice = (p: ReadingProduct) => (p.launchPriceMinor && p.launchPriceMinor > 0 && p.launchPriceMinor < p.priceMinor ? p.launchPriceMinor : p.priceMinor);
export const rupees = (minor: number) => `₹${(minor / 100).toLocaleString("en-IN")}`;
export const fromPrice = (products: ReadingProduct[], category: ReadingCategory) => {
  const ps = products.filter((p) => p.active && p.category === category);
  return ps.length ? Math.min(...ps.map(chargePrice)) : null;
};

export const DEFAULT_PRICING: PricingConfig = {
  readings: DEFAULT_READING_PRODUCTS,
  free: {
    aiMessages: 1,
    features: ["Full Vedic birth chart (D1, D9, D10)", "Planetary positions & Nakshatra", "Vimshottari Dasha timeline", "One short AURA question", "Daily Moon-transit insight"],
  },
  plans: [
    {
      id: "starter",
      name: "Starter",
      tagline: "For a focused set of questions",
      aiMessages: 10,
      detailedReports: false,
      features: ["10 AURA messages", "Chart factors shown with every answer", "English, Hindi or Hinglish", "Saved conversations", "Never expires"],
    },
    {
      id: "cosmic_plus",
      name: "Cosmic Plus",
      tagline: "Deeper guidance and every report",
      aiMessages: 25,
      detailedReports: true,
      highlight: true,
      features: ["25 AURA messages", "All detailed reports + PDF downloads", "Priority AI generation (deeper model)", "Extended interpretation history", "Never expires"],
    },
  ],
  subscriptions: [
    { id: "explorer_monthly", name: "Explorer", tagline: "A steady monthly companion", aiMessagesPerMonth: 50, detailedReports: false, priceMinor: 34900, features: ["50 AURA messages every month", "Monthly guidance from your dasha & transits", "Cancel anytime from Billing"] },
    { id: "cosmic_plus_monthly", name: "Cosmic Plus Monthly", tagline: "Everything, every month", aiMessagesPerMonth: 120, detailedReports: true, priceMinor: 64900, highlight: true, features: ["120 AURA messages every month", "All detailed reports + Hindi PDFs", "Priority generation (deeper model)", "Cancel anytime from Billing"] },
  ],
  regions: {
    IN: { currency: "INR", symbol: "₹", prices: { starter: 19900, cosmic_plus: 59900 } },
    US: { currency: "USD", symbol: "$", prices: { starter: 499, cosmic_plus: 1299 } },
    GB: { currency: "GBP", symbol: "£", prices: { starter: 399, cosmic_plus: 999 } },
    EU: { currency: "EUR", symbol: "€", prices: { starter: 449, cosmic_plus: 1199 } },
    AE: { currency: "AED", symbol: "AED ", prices: { starter: 1799, cosmic_plus: 4499 } },
    SG: { currency: "SGD", symbol: "S$", prices: { starter: 649, cosmic_plus: 1699 } },
    CA: { currency: "CAD", symbol: "CA$", prices: { starter: 649, cosmic_plus: 1699 } },
    AU: { currency: "AUD", symbol: "A$", prices: { starter: 749, cosmic_plus: 1899 } },
    NP: { currency: "INR", symbol: "₹", prices: { starter: 19900, cosmic_plus: 59900 } },
    DEFAULT: { currency: "USD", symbol: "$", prices: { starter: 499, cosmic_plus: 1299 } },
  },
  euCountries: ["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"],
};

export function regionFor(country: string | null | undefined, cfg: PricingConfig = DEFAULT_PRICING): { key: string; region: RegionPrice } {
  const c = (country ?? "").toUpperCase();
  if (c && cfg.regions[c]) return { key: c, region: cfg.regions[c] };
  if (c && cfg.euCountries.includes(c) && cfg.regions.EU) return { key: "EU", region: cfg.regions.EU };
  return { key: "DEFAULT", region: cfg.regions.DEFAULT };
}

export function formatMoney(minor: number, region: RegionPrice) {
  const major = minor / 100;
  const s = Number.isInteger(major) ? major.toString() : major.toFixed(2);
  return `${region.symbol}${region.currency === "INR" ? Number(s).toLocaleString("en-IN") : s}`;
}
