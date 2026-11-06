import { userLang } from "@/server/lang";
import { UI } from "@/lib/i18n/ui";
import { requireUser } from "@/server/session";
import { PageHeader } from "@/components/dashboard/ui";
import { CompatibilityClient } from "@/components/dashboard/CompatibilityClient";

export const metadata = { title: "Compatibility" };

export default async function CompatibilityPage() {
  const lang = await userLang((await requireUser()).id);
  return (
    <div>
      <PageHeader eyebrow={UI[lang].pages.compat[0]} title={UI[lang].pages.compat[1]} intro={lang === "en" ? "The traditional 36-point comparison of two Moon charts across eight kootas, with every table sourced and versioned. Partner details are used for this calculation only and are never stored." : undefined} />
      <CompatibilityClient />
    </div>
  );
}
