"use client";
import * as Accordion from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { SectionHeading } from "@/components/ui/Reveal";
import { FAQS } from "@/lib/faq";
import { faqLd, ldScript } from "@/lib/seo";



export function Faq() {
  return (
    <section id="faq" className="relative scroll-mt-24 py-28 md:py-36">
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeading align="center" eyebrow="Questions" title="Frequently asked" />
        <Accordion.Root type="single" collapsible className="mt-14 divide-y divide-[rgba(165,139,255,.14)] border-y hairline">
          {FAQS.map((f, i) => (
            <Accordion.Item key={i} value={`q${i}`}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-6 text-left">
                  <span className="font-display text-xl text-moon md:text-2xl">{f.q}</span>
                  <Plus className="h-5 w-5 shrink-0 text-gold transition-transform duration-300 group-data-[state=open]:rotate-45" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-none">
                <p className="pb-6 leading-relaxed text-slate">{f.a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(faqLd(FAQS))} />
    </section>
  );
}
