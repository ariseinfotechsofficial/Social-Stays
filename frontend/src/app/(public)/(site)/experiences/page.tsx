import type { Metadata } from "next";
import Image from "next/image";
import { Fragment } from "react";
import { EnquireTrigger } from "@/components/enquiry/EnquiryDialog";
import { PageHero } from "@/components/shared/PageHero";
import { buttonClasses } from "@/components/ui/Button";
import { destinationName, getContent, getPage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { priceLabel } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return buildMetadata(c, getPage(c, "experiences").seo, { path: "/experiences", title: "Experiences & add-ons" });
}

export default async function ExperiencesPage() {
  const c = await getContent();
  const page = getPage(c, "experiences");

  return (
    <>
      {page.visible.map((s) => {
        const data = page.section(s.key)!;
        if (s.key === "hero")
          return (
            <PageHero key={s.key} photo={data.photo("image")} title={data.text("title")} intro={data.text("intro")}>
              {data.text("buttonLabel") && (
                <EnquireTrigger className={buttonClasses("light", "lg")} prefill={{ title: "Plan your stay" }}>
                  {data.text("buttonLabel")}
                </EnquireTrigger>
              )}
            </PageHero>
          );
        if (s.key === "list")
          return (
            <section key={s.key} className="section-y">
              <div className="container-page">
                {data.text("note") && <p className="max-w-2xl text-ink-soft">{data.text("note")}</p>}
                {/* Phones: a swipe row instead of six long cards stacked */}
                <ul className="no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-11 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
                  {c.experiences.map((e) => (
                    <li key={e.slug} id={e.slug} className="group flex w-[84%] shrink-0 snap-start scroll-mt-28 flex-col md:w-auto">
                      <div className="relative aspect-[3/2] overflow-hidden rounded-photo bg-sand-deep">
                        {e.photo && (
                          <Image src={e.photo.src} alt={e.photo.alt} fill sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw" className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.04]" />
                        )}
                      </div>
                      <div className="mt-4 flex items-baseline justify-between gap-4">
                        <h2 className="font-display text-[1.625rem] leading-tight font-medium">{e.title}</h2>
                        <p className="shrink-0 text-[0.9375rem] font-semibold text-gold-deep">{priceLabel(e.price)}</p>
                      </div>
                      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{e.description}</p>
                      {e.includes.length > 0 && (
                        <ul className="mt-3.5 flex flex-wrap gap-1.5">
                          {e.includes.map((inc) => (
                            <li key={inc} className="rounded-full bg-sand px-3 py-1 text-[0.8125rem] font-medium">
                              {inc}
                            </li>
                          ))}
                        </ul>
                      )}
                      {e.availableAt !== "all" && e.availableAt.length > 0 && (
                        <p className="mt-3 text-[0.875rem] text-ink-soft">Available at {e.availableAt.map((d) => destinationName(c, d)).join(" and ")}.</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        if (s.key === "cta")
          return (
            <section key={s.key} className="bg-sand py-12 lg:py-14">
              <div className="container-page flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                <h2 className="type-display-m max-w-[32ch]">{data.text("title")}</h2>
                <EnquireTrigger className={buttonClasses("primary", "lg", "shrink-0")} prefill={{ title: "Plan your stay" }}>
                  {data.text("buttonLabel", "Check availability")}
                </EnquireTrigger>
              </div>
            </section>
          );
        return <Fragment key={s.key} />;
      })}
    </>
  );
}
