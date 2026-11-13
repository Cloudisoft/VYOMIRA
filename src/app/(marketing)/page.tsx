import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { VideoTour } from "@/components/home/VideoTour";
import { FourPaths } from "@/components/home/FourPaths";
import { ChartPreview } from "@/components/home/ChartPreview";
import { AuraPreview } from "@/components/home/AuraPreview";
import { CombinedInsightsTeaser } from "@/components/home/CombinedInsightsTeaser";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Pricing } from "@/components/home/Pricing";
import { ReadingsPricing } from "@/components/home/ReadingsPricing";
import { Methodology } from "@/components/home/Methodology";
import { Faq } from "@/components/home/Faq";
import { sampleData } from "@/server/sample";
import { getConfig } from "@/server/config";
import { fromPrice, rupees } from "@/lib/pricing";
import { appLd, ldScript } from "@/lib/seo";

export default async function Home() {
  const sample = sampleData();
  const [pricing, flags] = await Promise.all([getConfig("pricing"), getConfig("flags")]);
  const p = (c: "numerology" | "tarot" | "palmistry") => { const v = flags[c] !== false ? fromPrice(pricing.readings, c) : null; return v ? rupees(v) : null; };
  return (
    <>
      <Hero />
      <Features />
      <VideoTour />
      <FourPaths prices={{ astrology: "Free Kundli", palmistry: p("palmistry"), numerology: p("numerology"), tarot: p("tarot") }} />
      <ChartPreview sample={sample} />
      <AuraPreview sample={sample} />
      <CombinedInsightsTeaser />
      <HowItWorks />
      <Pricing />
      <ReadingsPricing />
      <Methodology />
      <Faq />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(appLd())} />
    </>
  );
}
