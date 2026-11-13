import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { userLang } from "@/server/lang";
import { PageHeader } from "@/components/dashboard/ui";
import { NewReadingForm } from "@/components/readings/NewReadingForm";
import { availableCredits, categoryOpen, products } from "@/server/readings/service";
import { chargePrice, rupees } from "@/lib/pricing";
import { productText, rui } from "@/lib/readings/ui-strings";
import { toRLang } from "@/lib/readings/lang";

export const metadata = { title: "New reading" };


export default async function NewReading({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const user = await requireUser();
  const { category } = await searchParams;
  if (category !== "numerology" && category !== "tarot" && category !== "palmistry") redirect("/dashboard/readings");
  if (!(await categoryOpen(category, user.role === "ADMIN"))) redirect("/dashboard/readings?closed=" + category);
  const [all, credits, ulang] = await Promise.all([products(), availableCredits(user.id), userLang(user.id)]);
  const lang = toRLang(ulang);
  const list = all.filter((p) => p.active && p.category === category).map((p) => ({ id: p.id, tier: p.tier, ...productText(p, lang), price: rupees(chargePrice(p)), was: chargePrice(p) < p.priceMinor ? rupees(p.priceMinor) : null, credit: (credits[p.id] ?? 0) > 0 }));
  const [eyebrow, title, intro] = rui(lang).newCopy[category];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} intro={intro} />
      <NewReadingForm category={category} products={list} defaultName={user.name} lang={lang} />
    </div>
  );
}
