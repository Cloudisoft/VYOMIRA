import { requireUser } from "@/server/session";
import { userLang } from "@/server/lang";
import { UI } from "@/lib/i18n/ui";
import { loadChart } from "@/server/charts";
import { balance } from "@/server/billing/entitlements";
import { hasConsent } from "@/server/consent";
import { features } from "@/server/env";
import { NoChart } from "@/components/dashboard/ui";
import { AuraChat } from "@/components/dashboard/AuraChat";
import { db } from "@/server/db";

export const metadata = { title: "Ask AURA" };

export default async function AuraPage() {
  const user = await requireUser();
  const loaded = await loadChart(user.id);
  const lang = await userLang(user.id);
  // Without a chart, AURA can still answer from numerology / tarot / palm readings.
  if (!loaded && !(await db.serviceReading.count({ where: { userId: user.id, status: "READY" } }))) return <NoChart t={UI[lang].noChart} />;
  const [bal, consent] = await Promise.all([balance(user.id), hasConsent(user.id, "ai_processing")]);
  return <AuraChat initialBalance={bal.aiMessages} aiConsent={consent} aiConfigured={features().ai} hasChart={Boolean(loaded)} defaultLanguage={((loaded?.language ?? lang) as "en" | "hi" | "hinglish") ?? "en"} />;
}
