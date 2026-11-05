import { PageHeader } from "@/components/dashboard/ui";
import { CompatibilityClient } from "@/components/dashboard/CompatibilityClient";

export const metadata = { title: "Compatibility" };

export default function CompatibilityPage() {
  return (
    <div>
      <PageHeader eyebrow="Ashtakoota Guna Milan" title="Compatibility" intro="The traditional 36-point comparison of two Moon charts across eight kootas, with every table sourced and versioned. Partner details are used for this calculation only and are never stored." />
      <CompatibilityClient />
    </div>
  );
}
