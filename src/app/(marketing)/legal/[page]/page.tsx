import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ContentPage } from "@/components/layout/ContentPage";

const DRAFT = <>Draft for review by qualified legal counsel before public launch in India or any other region. VYOMIRA makes no claim of regulatory compliance until that review is complete. Last updated 5 November 2026.</>;

const PAGES: Record<string, { title: string; intro: string; body: ReactNode }> = {
  privacy: {
    title: "Privacy Notice",
    intro: "Birth details are personal information. This notice explains what we collect, why, and the control you have.",
    body: (
      <>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Account:</strong> name, email, password hash (or Google account identifier), session records.</li>
          <li><strong>Birth details (only if you save a chart):</strong> name for the chart, date and time of birth, birth-time precision, birthplace. Stored encrypted with AES-256-GCM at the application layer.</li>
          <li><strong>Charts and conversations:</strong> computed chart data (encrypted), your questions to AURA and its answers, reports you generate, ratings you give.</li>
          <li><strong>Billing:</strong> order and payment identifiers, amounts and status from Razorpay/Stripe. We never receive or store card numbers.</li>
          <li><strong>Operational:</strong> security and audit events (without birth details, message text or raw IP addresses); hashed IP identifiers for rate limiting.</li>
        </ul>
        <h2>Anonymous chart previews</h2>
        <p>When you calculate a chart without saving it, the details are processed in memory to compute the chart and returned to your browser tab. We do not store or log them.</p>
        <h2>Why we use it (purposes and legal bases)</h2>
        <ul>
          <li>To compute and show your chart and readings — your explicit consent at save time.</li>
          <li>To let AURA use an AI provider — a separate, optional consent. Only a compact summary of chart factors and your question is sent; not your name, birth date, time or place.</li>
          <li>To process payments and prevent fraud — contract and legitimate interest.</li>
          <li>To keep the service secure — legitimate interest.</li>
        </ul>
        <h2>Processors</h2>
        <p>Hosting and database provider; Razorpay (payments, India); Stripe (optional, international cards); Resend (transactional email); the configured AI provider (only with your consent). Each is bound by its own data-processing terms. List to be finalised with deployment choices.</p>
        <h2>Your rights</h2>
        <ul>
          <li>Access and portability: Settings → Export my data (JSON).</li>
          <li>Correction: update birth details at any time.</li>
          <li>Erasure: Settings → Delete account removes your account and all associated data from our database immediately; backups expire on their rotation schedule.</li>
          <li>Withdraw consent: switch off AI processing or marketing in Settings at any time.</li>
          <li>Grievances: contact privacy@vyomira.app. A Grievance Officer will be designated as required under India's Digital Personal Data Protection Act, 2023 and its rules.</li>
        </ul>
        <h2>Retention</h2>
        <p>Account data is kept while your account is active. Unpaid abandoned orders are retained for reconciliation for up to 180 days. Audit logs are retained for up to 12 months. Payment records may be retained by our payment processors as required by law.</p>
        <h2>Children</h2>
        <p>VYOMIRA is intended for adults (18+). We do not knowingly create accounts for children; charts for a child should be calculated by a parent without saving.</p>
        <h2>Analytics</h2>
        <p>We do not place birth details in analytics or application logs, and we do not sell personal data.</p>
      </>
    ),
  },
  terms: {
    title: "Terms of Service",
    intro: "The agreement between you and VYOMIRA when you use the service.",
    body: (
      <>
        <h2>The service</h2>
        <p>VYOMIRA computes Vedic astrology charts from astronomical data and offers traditional interpretations, optionally phrased by an AI language model. Astrological interpretations are traditional and symbolic; they are not scientifically established, and are provided for reflection and entertainment.</p>
        <h2>Not professional advice</h2>
        <p>Nothing on VYOMIRA is medical, psychological, legal, financial or other professional advice. Do not rely on it for decisions in those areas.</p>
        <h2>Accounts</h2>
        <p>You must be 18 or older, provide accurate information and keep your credentials secure. You may only enter another person's birth details with their permission.</p>
        <h2>Purchases</h2>
        <p>Message packs are one-time purchases of a stated number of AURA replies. They do not expire while your account exists. Guardrail replies, repeated identical questions and failed generations are not charged. Prices may differ by country and may change for future purchases.</p>
        <h2>Acceptable use</h2>
        <p>No scraping, reverse engineering of rate limits, automated bulk querying, or attempts to extract other users' data.</p>
        <h2>Liability</h2>
        <p>The service is provided "as is". To the extent permitted by law, our liability is limited to the amount you paid in the 12 months before the claim.</p>
        <h2>Governing law</h2>
        <p>To be confirmed by counsel (expected: laws of India, courts at the registered office's city), subject to mandatory consumer protections where you live.</p>
      </>
    ),
  },
  refunds: {
    title: "Refund & Cancellation Policy",
    intro: "Clear rules for message packs.",
    body: (
      <>
        <h2>Unused packs</h2>
        <p>If you haven't used any messages from a pack, you can request a full refund within 7 days of purchase by writing to support@vyomira.app.</p>
        <h2>Partly used packs</h2>
        <p>Partly used packs may be refunded pro rata for unused messages within 7 days, at our discretion.</p>
        <h2>Technical failures</h2>
        <p>Messages that fail to generate are automatically returned to your balance. If you were charged for an order that never activated, it is refunded in full.</p>
        <h2>How refunds work</h2>
        <p>Refunds are issued to the original payment method through Razorpay or Stripe, typically within 5–7 business days. When a refund is processed, any unused messages from that pack are removed.</p>
        <h2>Subscriptions</h2>
        <p>VYOMIRA does not currently sell subscriptions; there is nothing to cancel and nothing renews automatically.</p>
      </>
    ),
  },
  disclaimer: {
    title: "Astrology Disclaimer",
    intro: "What VYOMIRA can and cannot tell you.",
    body: (
      <>
        <p>VYOMIRA separates three things. <strong>Astronomy</strong> — the positions of the Sun, Moon and planets at your birth — is computed precisely and tested. <strong>Astrology</strong> — what those positions are said to mean — is a traditional interpretive system whose predictive claims are not scientifically established. <strong>AI</strong> is used only to phrase chart evidence in natural language, under validation.</p>
        <p>We do not claim any level of predictive accuracy. We do not forecast death, illness, pregnancy, accidents, legal outcomes or investment results. We do not sell gemstones, yantras or remedies.</p>
        <p>If you are struggling, please reach out to a qualified professional. In India, Tele-MANAS (14416) offers free, confidential mental-health support 24×7.</p>
      </>
    ),
  },
  attributions: {
    title: "Attributions & Licences",
    intro: "VYOMIRA is built on the work of others.",
    body: (
      <ul>
        <li>Place data: GeoNames (geonames.org), Creative Commons Attribution 4.0.</li>
        <li>Ephemeris: Astronomy Engine by Don Cross, MIT licence.</li>
        <li>Timezone history: IANA Time Zone Database (public domain), via the runtime's ICU data.</li>
        <li>Swiss Ephemeris (Astrodienst AG) is used only as an independent test oracle during development; it is not distributed with or linked into VYOMIRA.</li>
        <li>Typefaces: Cormorant Garamond and Manrope, SIL Open Font License.</li>
        <li>Icons: Lucide, ISC licence.</li>
      </ul>
    ),
  },
};

export function generateStaticParams() { return Object.keys(PAGES).map((page) => ({ page })); }
export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const p = PAGES[(await params).page];
  return p ? { title: p.title } : {};
}

export default async function Legal({ params }: { params: Promise<{ page: string }> }) {
  const p = PAGES[(await params).page];
  if (!p) notFound();
  return <ContentPage eyebrow="Legal" title={p.title} intro={p.intro} notice={DRAFT}>{p.body}</ContentPage>;
}
