import { requireUser } from "@/server/session";
import { userLang } from "@/server/lang";
import { UI } from "@/lib/i18n/ui";
import { loadChart } from "@/server/charts";
import { balance } from "@/server/billing/entitlements";
import { hasConsent } from "@/server/consent";
import { features } from "@/server/env";
import { NoChart } from "@/components/dashboard/ui";
import { AuraChat } from "@/components/dashboard/AuraChat";

export const metadata = { title: "Ask AURA" };

export default async function AuraPage() {
  const user = await requireUser();
  const loaded = await loadChart(user.id);
  if (!loaded) return <NoChart t={UI[await userLang(user.id)].noChart} />;
  const [bal, consent] = await Promise.all([balance(user.id), hasConsent(user.id, "ai_processing")]);
  return <AuraChat initialBalance={bal.aiMessages} aiConsent={consent} aiConfigured={features().ai} defaultLanguage={(loaded.language as "en" | "hi" | "hinglish") ?? "en"} />;
}
