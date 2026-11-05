import { PageHeader } from "@/components/dashboard/ui";
import { CompatibilityClient } from "@/components/dashboard/CompatibilityClient";

export const metadata = { title: "Compatibility" };

export default function CompatibilityPage() {
  return (
    <div>
      <PageHeader eyebrow="Partial Ashtakoota" title="Compatibility" intro="Compare your chart with a partner's using three kootas with unambiguous classical tables — Nadi, Bhakoot and Gana (21 of 36 points). The full Guna Milan will be released only after its remaining tables are validated. Partner details are used for this calculation only and are not stored." />
      <CompatibilityClient />
    </div>
  );
}
