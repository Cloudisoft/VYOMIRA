import { redirect } from "next/navigation";
import { requireUser } from "@/server/session";
import { userLang } from "@/server/lang";
import { PageHeader } from "@/components/dashboard/ui";
import { NewReadingForm } from "@/components/readings/NewReadingForm";
import { availableCredits, categoryOpen, products } from "@/server/readings/service";
import { chargePrice, rupees } from "@/lib/pricing";

export const metadata = { title: "New reading" };
const COPY = {
  numerology: ["Numerology", "Your numbers, calculated exactly", "Life Path, Expression, Soul Urge, Personality, Birthday, Personal Year and your Lo Shu grid — calculated deterministically, then explained in plain language."],
  tarot: ["Tarot", "Draw your cards", "Choose an area of life, ask a question if you like, pick a spread, then choose your cards face-down from a securely shuffled 78-card deck."],
  palmistry: ["Palmistry", "Read your palm", "Upload a clear photo of your palm. We only interpret lines we can actually see — if a photo isn't clear enough, we'll ask for another instead of guessing."],
} as const;

export default async function NewReading({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const user = await requireUser();
  const { category } = await searchParams;
  if (category !== "numerology" && category !== "tarot" && category !== "palmistry") redirect("/dashboard/readings");
  if (!(await categoryOpen(category, user.role === "ADMIN"))) redirect("/dashboard/readings?closed=" + category);
  const [all, credits, lang] = await Promise.all([products(), availableCredits(user.id), userLang(user.id)]);
  const list = all.filter((p) => p.active && p.category === category).map((p) => ({ id: p.id, tier: p.tier, name: p.name, description: p.description, price: rupees(chargePrice(p)), was: chargePrice(p) < p.priceMinor ? rupees(p.priceMinor) : null, credit: (credits[p.id] ?? 0) > 0 }));
  const [eyebrow, title, intro] = COPY[category];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} intro={intro} />
      <NewReadingForm category={category} products={list} defaultName={user.name} lang={lang} />
    </div>
  );
}
