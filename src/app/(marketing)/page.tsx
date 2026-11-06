import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { VideoTour } from "@/components/home/VideoTour";
import { ZodiacWheel } from "@/components/home/ZodiacWheel";
import { ChartPreview } from "@/components/home/ChartPreview";
import { AuraPreview } from "@/components/home/AuraPreview";
import { CosmicTimeline } from "@/components/home/CosmicTimeline";
import { Readings } from "@/components/home/Readings";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Pricing } from "@/components/home/Pricing";
import { Methodology } from "@/components/home/Methodology";
import { Faq } from "@/components/home/Faq";
import { sampleData } from "@/server/sample";

export default function Home() {
  const sample = sampleData();
  return (
    <>
      <Hero />
      <Features />
      <VideoTour />
      <ZodiacWheel />
      <ChartPreview sample={sample} />
      <AuraPreview sample={sample} />
      <CosmicTimeline sample={sample} />
      <Readings />
      <HowItWorks />
      <Pricing />
      <Methodology />
      <Faq />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebApplication", name: "VYOMIRA", url: "https://vyomira.cloudisoft.com", image: "https://vyomira.cloudisoft.com/brand/vyomira-app-logo.png", applicationCategory: "LifestyleApplication", description: "Vedic birth charts computed from real astronomy with evidence-grounded AI interpretation.", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } }) }}
      />
    </>
  );
}
