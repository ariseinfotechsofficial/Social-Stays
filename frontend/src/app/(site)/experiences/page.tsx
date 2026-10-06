import type { Metadata } from "next";
import Image from "next/image";
import { EnquireTrigger } from "@/components/enquiry/EnquiryDialog";
import { PageHero } from "@/components/shared/PageHero";
import { buttonClasses } from "@/components/ui/Button";
import { destinationName } from "@/data/destinations";
import { experiences } from "@/data/experiences";
import { photo } from "@/data/photos";
import { priceLabel } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Experiences & add-ons: Malwa thali, bonfires, BBQ, celebration décor",
  description:
    "Add home-cooked Malwa thalis, bonfire evenings, barbecue dinners, celebration décor and private chefs to your villa stay near Indore. Indicative prices inside.",
  alternates: { canonical: "/experiences" },
};

export default function ExperiencesPage() {
  return (
    <>
      <PageHero
        photo={photo("site/experiences-hero")}
        title="Add to your stay"
        intro="Food from the villa kitchen, fires on the lawn and celebrations set up before you arrive. Ask for any of these in your enquiry."
      />

      <section className="section-y">
        <div className="container-page">
          <p className="max-w-2xl text-ink-soft">
            Prices are indicative and per the unit shown. Your WhatsApp quote confirms the final amount, along with what is
            possible at the villa you choose.
          </p>
          <ul className="mt-8 grid gap-x-8 gap-y-11 md:grid-cols-2 xl:grid-cols-3">
            {experiences.map((e) => {
              const p = photo(e.photo);
              return (
                <li key={e.slug} id={e.slug} className="group flex scroll-mt-28 flex-col">
                  <div className="relative aspect-[3/2] overflow-hidden rounded-photo bg-sand-deep">
                    <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw" className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.04]" />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <h2 className="font-display text-[1.625rem] leading-tight font-medium">{e.title}</h2>
                    <p className="shrink-0 text-[0.9375rem] font-semibold text-gold-deep">{priceLabel(e.price)}</p>
                  </div>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{e.description}</p>
                  <ul className="mt-3.5 flex flex-wrap gap-1.5">
                    {e.includes.map((inc) => (
                      <li key={inc} className="rounded-full bg-sand px-3 py-1 text-[0.8125rem] font-medium">
                        {inc}
                      </li>
                    ))}
                  </ul>
                  {e.availableAt !== "all" && (
                    <p className="mt-3 text-[0.875rem] text-ink-soft">Available at {e.availableAt.map(destinationName).join(" and ")}.</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-sand py-12 lg:py-14">
        <div className="container-page flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="type-display-m max-w-[32ch]">Tell us what you&apos;d like and we&apos;ll add it to your quote</h2>
          </div>
          <EnquireTrigger className={buttonClasses("primary", "lg", "shrink-0")} prefill={{ title: "Plan your stay" }}>
            Check availability
          </EnquireTrigger>
        </div>
      </section>
    </>
  );
}
