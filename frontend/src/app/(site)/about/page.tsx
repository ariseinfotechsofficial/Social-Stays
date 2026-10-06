import type { Metadata } from "next";
import Image from "next/image";
import { RevealImage } from "@/components/motion/Reveal";
import { OwnerBand } from "@/components/shared/Bands";
import { PageHero } from "@/components/shared/PageHero";
import { team } from "@/data/company";
import { photo } from "@/data/photos";

export const metadata: Metadata = {
  title: "About Social Stays",
  description:
    "Social Stays is a small Indore team curating private villas and farmhouses around the city, hosted by the families who own them.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    title: "We stay before we list",
    body: "Every villa is visited and slept in by someone on our team before it joins the collection. If we wouldn't bring our own families, it doesn't go on the site.",
  },
  {
    title: "Hosts, not managers",
    body: "The owner families cook, welcome you and answer the door. We look after everything before you arrive, so they can look after you once you do.",
  },
  {
    title: "Straight answers on WhatsApp",
    body: "One quote with everything in it, the real photos of the real rooms, and someone who replies. That's the whole booking process.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        photo={photo("site/about-hero")}
        title="We started with one question"
        intro="Where can all of us stay together for a weekend that isn't a hotel?"
      />

      <section className="section-y">
        <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-16">
          <div className="measure space-y-4 leading-relaxed text-ink-soft lg:py-2">
            <p className="type-lead text-ink">
              Social Stays began in 2021, when our families kept asking the same thing every Diwali, every birthday and every
              long weekend. Hotels split everyone across floors. Resorts were full of other people&apos;s parties.
            </p>
            <p>
              Meanwhile, around Indore, families who had built beautiful weekend homes were leaving them empty most of the
              year. Farmhouses near Mhow, an old house in Mandu, a villa above the Narmada.
            </p>
            <p>
              So we started introducing one to the other. Today we look after a small collection of homes within two and a half
              hours of the city, each one still lived in and hosted by the family that owns it. We keep the collection small
              on purpose, so we can know every house, and every host, well.
            </p>
          </div>
          <RevealImage photo={photo("site/family-diwali")} sizes="(min-width: 1024px) 45vw, 100vw" className="aspect-[4/3] w-full lg:aspect-auto lg:min-h-[24rem]" />
        </div>
      </section>

      <section className="section-y bg-sand">
        <div className="container-page">
          <h2 className="type-display-l">How we work</h2>
          <ul className="stack-head grid gap-8 lg:grid-cols-3 lg:gap-12">
            {values.map((v) => (
              <li key={v.title} className="border-t border-ink pt-5">
                <h3 className="font-display text-[1.5rem] font-medium">{v.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-y">
        <div className="container-page">
          <h2 className="type-display-l">The team</h2>
          <p className="type-lead mt-4 max-w-lg text-ink-soft">Four of us in Indore, and the families who host you at every villa.</p>
          <ul className="stack-head grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
            {team.map((m) => {
              const p = photo(m.photo);
              return (
                <li key={m.name}>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-photo bg-sand-deep">
                    <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw" className="object-cover grayscale" />
                  </div>
                  <h3 className="mt-4 font-display text-[1.5rem] font-medium">{m.name}</h3>
                  <p className="text-[0.9375rem] font-semibold text-gold-deep">{m.role}</p>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{m.bio}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <OwnerBand />
    </>
  );
}
