import { getConfig } from "@/server/config";
import { ConfigEditor } from "@/components/admin/ConfigEditor";

export default async function AdminPricing() {
  const [pricing, flags] = await Promise.all([getConfig("pricing"), getConfig("flags")]);
  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Pricing & feature flags</h1>
      <ConfigEditor configKey="pricing" initial={pricing} help="Plans and regional prices in minor units (paise/cents). Country codes map to regions; 'EU' covers euCountries; 'DEFAULT' is the fallback. New orders use new prices immediately; existing orders keep theirs." />
      <ConfigEditor configKey="flags" initial={flags} help="Feature flags. Turning off 'aura' or 'reports' pauses those features for everyone." />
    </div>
  );
}
