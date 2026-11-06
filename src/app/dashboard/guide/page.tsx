import { requireUser } from "@/server/session";
import { loadChart } from "@/server/charts";
import { lifeGuideFor } from "@/server/life-guide";
import { toLang } from "@/lib/interpret/life-guide-i18n";
import { NoChart } from "@/components/dashboard/ui";
import { LifeGuideView } from "@/components/guide/LifeGuideView";

export const metadata = { title: "My Life Guide" };

export default async function GuidePage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const user = await requireUser();
  const loaded = await loadChart(user.id);
  if (!loaded) return <NoChart />;
  const sp = await searchParams;
  const lang = toLang(sp.lang ?? loaded.language);
  const g = await lifeGuideFor(loaded.chartId, loaded.chart, loaded.fullName, lang);
  if (!g) return <NoChart />;
  return <LifeGuideView g={g} lang={lang} />;
}
