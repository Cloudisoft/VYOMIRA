import { notFound } from "next/navigation";
import Link from "next/link";
import { ARTICLES } from "@/lib/learn";
import { ContentPage } from "@/components/layout/ContentPage";

export function generateStaticParams() { return ARTICLES.map((a) => ({ slug: a.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  return a ? { title: a.title, description: a.summary } : {};
}

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) notFound();
  return (
    <ContentPage eyebrow="Learn" title={a.title} intro={a.summary}>
      {a.body.map((p) => <p key={p.slice(0, 20)} className="mb-5 text-lg">{p}</p>)}
      <p className="mt-10"><Link href="/learn">← All articles</Link> · <Link href="/onboarding">Calculate your chart</Link></p>
    </ContentPage>
  );
}
