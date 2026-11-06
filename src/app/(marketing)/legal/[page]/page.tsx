import { notFound } from "next/navigation";
import { ContentPage } from "@/components/layout/ContentPage";
import { LEGAL } from "@/lib/legal";
import { COMPANY } from "@/lib/company";

export function generateStaticParams() { return Object.keys(LEGAL).map((page) => ({ page })); }
export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const p = LEGAL[(await params).page];
  const slug = (await params).page;
  return p ? { title: p.title, alternates: { canonical: `/legal/${slug}` } } : {};
}

export default async function Legal({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const p = LEGAL[page];
  if (!p) notFound();
  return (
    <ContentPage eyebrow={`Legal · effective ${COMPANY.effectiveDate} · v${COMPANY.policyVersion}`} title={p.title} intro={p.intro}>
      <div lang={page.endsWith("-hi") ? "hi" : undefined}>{p.body}</div>
    </ContentPage>
  );
}
