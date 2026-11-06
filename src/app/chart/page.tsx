import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { PreviewClient } from "./PreviewClient";
import { BackHome } from "@/components/layout/BackHome";
import { WhatsAppButton } from "@/components/support/WhatsAppButton";

export const metadata: Metadata = { title: "Your Kundli", robots: { index: false } };

export default function ChartPreviewPage() {
  return (
    <main id="main" className="min-h-dvh">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" aria-label="VYOMIRA home"><Logo /></Link>
        <Link href="/onboarding" className="text-sm text-slate hover:text-moon">Edit birth details</Link>
      </header>
      <div className="mx-auto max-w-7xl px-6"><BackHome /></div>
      <PreviewClient />
      <WhatsAppButton />
    </main>
  );
}
