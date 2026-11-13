import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/server/session";
import { db } from "@/server/db";
import { PageHeader } from "@/components/dashboard/ui";
import { ReadingFlow } from "@/components/readings/ReadingFlow";
import { availableCredits, productById, publicReading, readInput } from "@/server/readings/service";
import { chargePrice, rupees } from "@/lib/pricing";

export const metadata = { title: "Reading" };
const LABEL: Record<string, string> = { numerology: "Numerology", tarot: "Tarot", palmistry: "Palmistry" };

export default async function ReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const r = await db.serviceReading.findFirst({ where: { id, userId: user.id }, include: { images: { select: { side: true, width: true, height: true, quality: true } } } });
  if (!r) notFound();
  const [product, credits] = await Promise.all([productById(r.productId), availableCredits(user.id)]);
  const initial = JSON.parse(JSON.stringify({ reading: publicReading(r, readInput(r)), images: r.images, hasCredit: (credits[r.productId] ?? 0) > 0 }));
  return (
    <div className="space-y-6">
      <nav className="text-sm text-slate"><Link href="/dashboard/readings" className="hover:text-moon">My Readings</Link> / {LABEL[r.category]}</nav>
      <PageHeader eyebrow={LABEL[r.category]} title={r.title} intro={`Started ${r.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`} />
      <Suspense><ReadingFlow initial={initial} price={product ? rupees(chargePrice(product)) : "—"} /></Suspense>
    </div>
  );
}
