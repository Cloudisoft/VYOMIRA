import { requireUser } from "@/server/session";
import { loadChart } from "@/server/charts";
import { hasConsent } from "@/server/consent";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { SettingsClient } from "@/components/dashboard/SettingsClient";
import Link from "next/link";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [loaded, ai, marketing] = await Promise.all([loadChart(user.id), hasConsent(user.id, "ai_processing"), hasConsent(user.id, "marketing")]);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Account & privacy" />
      <Panel title="Birth profile">
        {loaded ? (
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="text-sm"><p className="text-moon">{loaded.fullName}</p><p className="text-slate">{loaded.birth.date} {loaded.birth.time ?? "(time unknown)"} · {loaded.chart.input.placeLabel}</p><p className="text-xs text-slate/70">Encrypted at rest · computed with {loaded.chart.computation.id}</p></div>
            <Link href="/onboarding" className="btn-ghost !py-2.5 text-sm">Update birth details</Link>
          </div>
        ) : <Link href="/onboarding" className="btn-primary">Add birth details</Link>}
      </Panel>
      <SettingsClient aiConsent={ai} marketingConsent={marketing} email={user.email} language={loaded ? ((loaded.language as "en" | "hi" | "hinglish") ?? "en") : null} />
    </div>
  );
}
