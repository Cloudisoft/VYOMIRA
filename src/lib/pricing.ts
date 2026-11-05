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

export interface PricingConfig {
  plans: PlanDef[];
  subscriptions: SubscriptionPlanDef[];
  free: { aiMessages: number; features: string[] };
  regions: Record<string, RegionPrice>; // ISO country → price; "DEFAULT" fallback; "EU" for eurozone
  euCountries: string[];
}

export const DEFAULT_PRICING: PricingConfig = {
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
    { id: "explorer_monthly", name: "Explorer", tagline: "A steady monthly companion", aiMessagesPerMonth: 50, detailedReports: false, priceMinor: 24900, features: ["50 AURA messages every month", "Monthly guidance from your dasha & transits", "Cancel anytime from Billing"] },
    { id: "cosmic_plus_monthly", name: "Cosmic Plus Monthly", tagline: "Everything, every month", aiMessagesPerMonth: 200, detailedReports: true, priceMinor: 49900, highlight: true, features: ["200 AURA messages every month", "All detailed reports + Hindi PDFs", "Priority generation (deeper model)", "Cancel anytime from Billing"] },
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
