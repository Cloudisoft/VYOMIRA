import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Spotlight } from "@/components/motion/Spotlight";
import { ScrollProgress } from "@/components/motion/ScrollProgress";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollProgress />
      <Spotlight />
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
