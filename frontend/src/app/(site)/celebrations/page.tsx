import type { Metadata } from "next";
import Link from "next/link";
import { EnquireTrigger } from "@/components/enquiry/EnquiryDialog";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import { RevealImage } from "@/components/motion/Reveal";
import { PageHero } from "@/components/shared/PageHero";
import { ReviewCarousel } from "@/components/shared/Reviews";
import { buttonClasses } from "@/components/ui/Button";
import { destinationName } from "@/data/destinations";
import { occasions } from "@/data/occasions";
import { photo } from "@/data/photos";
import { reviews } from "@/data/reviews";
import { getVilla } from "@/data/villas";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Farmhouse & villa near Indore for birthdays, anniversaries and haldi",
  description:
    "Celebrate at a private villa or farmhouse near Indore: birthday parties, anniversaries, haldi and mehendi, pre-wedding shoots and team offsites. Décor, food and music arranged.",
  alternates: { canonical: "/celebrations" },
};

export default function CelebrationsPage() {
  const celebrationReviews = reviews.filter((r) => r.occasion && /Birthday|Anniversary|offsite/i.test(r.occasion));

  return (
    <>
      <PageHero
        photo={photo("site/celebrations-hero")}
        title="Celebrations, at a home of your own"
        intro="Birthdays, anniversaries, haldis and team weekends at a private villa near Indore. You bring the people; we arrange the rest."
      >
        <EnquireTrigger className={buttonClasses("light", "lg")} prefill={{ title: "Plan a celebration", occasion: "Birthday" }}>
          Plan a celebration
        </EnquireTrigger>
      </PageHero>

      <section className="section-y">
        <div className="container-page grid gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            { title: "Your own villa", body: "No banquet hall, no other parties. The house, the lawn and the pool are yours for the stay." },
            { title: "One person to talk to", body: "Your host coordinates décor, food, music and timings with our trusted local partners." },
            { title: "Everyone stays the night", body: "No one drives home at midnight. Rooms for the family, breakfast for everyone the morning after." },
          ].map((p) => (
            <div key={p.title} className="border-t border-ink pt-5">
              <h2 className="font-display text-[1.5rem] font-medium">{p.title}</h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {occasions.map((o, i) => (
        <section key={o.slug} id={o.slug} className={`section-y scroll-mt-24 ${i % 2 === 0 ? "bg-sand" : ""}`}>
          <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <RevealImage photo={photo(o.photo)} sizes="(min-width: 1024px) 50vw, 100vw" from={i % 2 ? "right" : "left"} className={`aspect-[4/3] w-full lg:aspect-square ${i % 2 ? "lg:order-2" : ""}`} />
            <div>
              <p className="text-[0.9375rem] font-semibold text-gold-deep">
                {o.title}, {o.groupSize}
              </p>
              <h2 className="type-display-l mt-2 max-w-[20ch]">{o.heading}</h2>
              <p className="type-lead mt-4 max-w-xl text-ink-soft">{o.description}</p>
              <h3 className="mt-7 font-sans text-base font-semibold">We can arrange</h3>
              <ul className="mt-3 grid gap-x-8 gap-y-2 text-[0.9375rem] sm:grid-cols-2">
                {o.ideas.map((idea) => (
                  <li key={idea} className="relative pl-6 text-ink-soft before:absolute before:top-[0.7em] before:left-0 before:h-px before:w-3 before:bg-brass">
                    {idea}
                  </li>
                ))}
              </ul>
              <h3 className="mt-7 font-sans text-base font-semibold">Villas we suggest</h3>
              <ul className="mt-3 border-t border-line">
                {o.villas.map((slug) => {
                  const v = getVilla(slug);
                  if (!v) return null;
                  return (
                    <li key={slug} className="border-b border-line">
                      <Link href={`/villas/${slug}`} className="group flex items-baseline justify-between gap-6 py-3">
                        <span>
                          <span className="font-display text-[1.3125rem] font-medium group-hover:text-gold">{v.name}</span>
                          <span className="ml-3 text-[0.875rem] text-ink-soft">{destinationName(v.destination)}, sleeps {v.guests.max}</span>
                        </span>
                        <span className="shrink-0 text-[0.875rem] text-ink-soft">from {formatINR(v.priceFrom)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <EnquireTrigger
                className={buttonClasses("primary", "lg", "mt-7")}
                prefill={{ title: "Plan a celebration", occasion: o.enquiryOccasion }}
              >
                Enquire for {o.title.toLowerCase()}
              </EnquireTrigger>
            </div>
          </div>
        </section>
      ))}

      <section className="section-y">
        <div className="container-page">
          <ReviewCarousel
            reviews={celebrationReviews.map((r) => ({
              id: r.id,
              text: r.text,
              name: r.name,
              rating: r.rating,
              meta: [getVilla(r.villa)?.name, r.occasion].filter(Boolean).join(", "),
            }))}
          />
        </div>
      </section>

      <section id="enquire" className="section-y bg-ink text-sand">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <h2 className="type-display-l max-w-[16ch] text-white">Tell us about the occasion</h2>
            <p className="type-lead mt-4 max-w-md text-sand/80">
              Dates, guest count and what you&apos;re celebrating is all we need to start. {site.replyHours}
            </p>
          </div>
          <div className="overflow-hidden rounded-[8px]">
            <EnquiryForm placement="celebrations_page" occasion="Birthday" submitLabel="Send on WhatsApp" />
          </div>
        </div>
      </section>
    </>
  );
}
