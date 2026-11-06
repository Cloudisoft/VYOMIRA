/**
 * Legal identity used across policies, invoices and grievance notices. Set these in the environment
 * before launch (they are public). The fallbacks keep pages coherent in development.
 */
export const COMPANY = {
  brand: "VYOMIRA",
  legalName: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME || "VYOMIRA",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "",
  cityForJurisdiction: process.env.NEXT_PUBLIC_LEGAL_JURISDICTION_CITY || "Mumbai",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "info@cloudisoft.com",
  privacyEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || "info@cloudisoft.com",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+91 88668 19132",
  grievanceOfficer: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME || "Grievance Officer",
  grievanceEmail: process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL || "info@cloudisoft.com",
  gstin: process.env.NEXT_PUBLIC_GSTIN || "",
  effectiveDate: "5 November 2026",
  policyVersion: "2026-11-05",
};

/** tel: link for the support phone number ("+91 88668 19132" → "tel:+918866819132"). */
export const telHref = (phone = COMPANY.phone) => `tel:${phone.replace(/[^+\d]/g, "")}`;
