import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ARTICLES } from "@/lib/learn";
import { ContentPage } from "@/components/layout/ContentPage";
import { articleLd, breadcrumbLd, faqLd, ldScript } from "@/lib/seo";

const UPDATED = "2026-11-05";

export function generateStaticParams() { return ARTICLES.map((a) => ({ slug: a.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) return {};
  const path = `/learn/${a.slug}`;
  return {
    title: a.title,
    description: a.summary,
    alternates: { canonical: path },
    openGraph: { type: "article", url: path, title: a.title, description: a.summary, modifiedTime: a.updated ?? UPDATED, images: [{ url: `/og/learn-${a.slug}.jpg`, width: 1200, height: 630, alt: a.title }] },
    twitter: { card: "summary_large_image", title: a.title, description: a.summary, images: [`/og/learn-${a.slug}.jpg`] },
  };
}

export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) notFound();
  const related = ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 4);
  const ld = [articleLd({ ...a, updated: a.updated ?? UPDATED }), breadcrumbLd([["Home", "/"], ["Learn Jyotish", "/learn"], [a.title, `/learn/${a.slug}`]]), ...(a.faqs?.length ? [faqLd(a.faqs)] : [])];
  return (
    <ContentPage eyebrow="Learn Jyotish" title={a.title} intro={a.summary}>
      <nav aria-label="Breadcrumb" className="-mt-4 mb-8 text-sm text-slate"><Link href="/">Home</Link> / <Link href="/learn">Learn</Link> / <span>{a.title}</span></nav>
      {a.body.map((p) => (p.startsWith("## ") ? <h2 key={p}>{p.slice(3)}</h2> : <p key={p.slice(0, 40)} className="mb-5 text-lg">{p}</p>))}
      {a.faqs?.length ? (
        <section aria-labelledby="faq-h">
          <h2 id="faq-h">Common questions</h2>
          {a.faqs.map((f) => (
            <div key={f.q} className="mb-5">
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>
      ) : null}
      <h2>Keep reading</h2>
      <ul>{related.map((r) => <li key={r.slug}><Link href={`/learn/${r.slug}`}>{r.title}</Link></li>)}</ul>
      <p className="mt-10"><Link href="/onboarding">Calculate your free Kundli →</Link></p>
      <p className="mt-4 text-sm">Updated {new Date(a.updated ?? UPDATED).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · VYOMIRA by Cloudisoft</p>
      {ld.map((d, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={ldScript(d)} />)}
    </ContentPage>
  );
}
