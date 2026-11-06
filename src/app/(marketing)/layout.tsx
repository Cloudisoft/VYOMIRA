import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Spotlight } from "@/components/motion/Spotlight";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { CursorGlow } from "@/components/motion/CursorGlow";
import { MarketingBackHome } from "@/components/layout/MarketingBackHome";
import { WhatsAppButton } from "@/components/support/WhatsAppButton";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <ScrollProgress />
      <Spotlight />
      <CursorGlow />
      <Navbar />
      <main id="main" className="relative">
        <MarketingBackHome />
        {children}
      </main>
      <WhatsAppButton />
      <Footer />
    </>
  );
}
