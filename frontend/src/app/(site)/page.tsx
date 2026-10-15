import { CheckIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { DestinationPicker } from "@/components/home/DestinationPicker";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { InstagramStrip, OwnerBand } from "@/components/shared/Bands";
import { JsonLd } from "@/components/shared/JsonLd";
import { ReviewReels } from "@/components/home/ReviewReels";
import { Stars } from "@/components/shared/Reviews";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TextLink, buttonClasses } from "@/components/ui/Button";
import { Rail } from "@/components/villa/VillaCarousel";
import { VillaCard } from "@/components/villa/VillaCard";
import { WhatsAppLink } from "@/components/layout/ContactLinks";
import { destinations } from "@/data/destinations";
import { experiences } from "@/data/experiences";
import { photo } from "@/data/photos";
import { reviews, reviewSummary } from "@/data/reviews";
import { getVilla, liveVillas, villaCategories } from "@/data/villas";
import { site } from "@/lib/site";
import { cn, formatDriveTime, formatINR, priceLabel } from "@/lib/utils";

/** Home experience cards, in this order */
const featuredExperiences = ["malwa-thali", "bonfire-evening", "celebration-decor", "candlelit-dinner"];

export default function HomePage() {
  const stops = destinations.map((d) => ({
    slug: d.slug,
    name: d.name,
    drive: formatDriveTime(d.driveMinutes),
    villas: liveVillas.filter((v) => v.destination === d.slug).length,
  }));
  const featured = featuredExperiences.flatMap((slug) => experiences.filter((e) => e.slug === slug));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: site.name,
          url: site.url,
          logo: `${site.url}/images/logo.jpeg`,
          description: site.description,
          email: site.email,
          telephone: site.phone.display,
          address: { "@type": "PostalAddress", addressLocality: site.address.locality, addressRegion: site.address.region, addressCountry: site.address.country },
          sameAs: [site.instagram.url],
        }}
      />

      <Hero />
      <section className="section-y bg-sand" aria-labelledby="destinations-heading">
        <div className="container-page">
          <SectionHeading
            title={<span id="destinations-heading">Pick a destination</span>}
            intro="Four places we know well, each an easy drive from Indore."
            action={<TextLink href="/destinations">Explore destinations</TextLink>}
          />
          <div className="stack-head">
            <DestinationPicker stops={stops} />
          </div>
          <p className="mt-10 text-center text-[0.9375rem] text-ink-soft">
            Not sure which suits your group?{" "}
            <WhatsAppLink
              placement="home_destinations"
              message="Hello Social Stays, can you suggest a destination for our group?"
              className="font-semibold text-gold-deep underline underline-offset-4"
            >
              Ask us on WhatsApp
            </WhatsAppLink>
          </p>
        </div>
      </section>

      <section className="section-y overflow-hidden" aria-labelledby="collection-heading">
        <div className="container-page">
          <SectionHeading
            title={<span id="collection-heading">The collection</span>}
            intro="Eight homes open now and one on the way. Each one visited, photographed and hosted by the family who owns it."
            action={<TextLink href="/villas">View all villas</TextLink>}
          />
          {villaCategories.map((c) => {
            const list = liveVillas.filter((v) => v.category === c.slug);
            if (!list.length) return null;
            // A short row has no carousel to fill the width, so a panel takes the spare columns
            const short = list.length < 3;
            return (
              <div key={c.slug} className="stack-head">
                <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-3">
                  <div>
                    <h3 className="type-display-m">{c.label}</h3>
                    {!short && <p className="mt-1 text-[0.9375rem] text-ink-soft">{c.blurb}</p>}
                  </div>
                  <TextLink href={`/villas?category=${c.slug}`} className="shrink-0 text-[0.9375rem]">
                    {list.length === 1 ? "1 villa" : `${list.length} villas`}
                  </TextLink>
                </div>
                {short ? (
                  <div className="grid gap-5 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
                    {list.map((v) => (
                      <VillaCard key={v.slug} villa={v} morph={false} />
                    ))}
                    <div
                      className={cn(
                        "flex flex-col justify-center gap-8 rounded-[14px] bg-sand p-7 lg:p-12",
                        list.length === 1 ? "lg:col-span-2" : "sm:col-span-2 lg:col-span-1",
                      )}
                    >
                      <div>
                        <p className="text-[0.8125rem] font-semibold tracking-[0.16em] text-gold-deep uppercase">{c.label}</p>
                        <p className="mt-3 max-w-lg font-display text-[1.375rem] leading-snug font-medium sm:text-[1.75rem] lg:text-[2.125rem]">{c.blurb}</p>
                        <ul className="mt-6 grid gap-2.5 text-[0.9375rem] sm:grid-cols-2">
                          {["The whole villa, only your group", "Hosted by the owner family", "Home-cooked meals on request", `From ${formatINR(Math.min(...list.map((v) => v.priceFrom)))} a night`].map((t) => (
                            <li key={t} className="flex items-center gap-2.5">
                              <CheckIcon aria-hidden weight="bold" className="size-4 shrink-0 text-gold" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <WhatsAppLink
                          placement={`home_${c.slug}_panel`}
                          message={`Hello Social Stays, I would like to know about your ${c.label.toLowerCase()}.`}
                          className={buttonClasses("primary", "md")}
                        >
                          <WhatsappLogoIcon className="size-5" /> Ask about {c.short.toLowerCase()} stays
                        </WhatsAppLink>
                        <TextLink href={`/villas?category=${c.slug}`}>See {c.short.toLowerCase()} stays</TextLink>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Rail label={c.label}>
                    {list.map((v) => (
                      <VillaCard key={v.slug} villa={v} morph={false} />
                    ))}
                  </Rail>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="section-y bg-sand" aria-labelledby="experiences-heading">
        <div className="container-page">
          <SectionHeading
            title={
              <span id="experiences-heading">
                <span className="mb-2 block font-sans text-[0.8125rem] font-semibold tracking-[0.16em] text-gold-deep uppercase">Add to your stay</span>
                Experiences
              </span>
            }
            intro="Arranged by your host. Just mention it in your WhatsApp enquiry."
            action={<TextLink href="/experiences">All experiences</TextLink>}
          />
          {/* Phones: a swipe row instead of four tall cards stacked */}
          <ul className="stack-head no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 lg:gap-6">
            {featured.map((e) => {
              const p = photo(e.photo);
              return (
                <li
                  key={e.slug}
                  className="group flex w-[78%] shrink-0 snap-start flex-col overflow-hidden rounded-[14px] border border-line bg-white transition-[translate,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(42_36_27/0.45)] sm:w-auto"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-sand-deep">
                    <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 23vw, (min-width: 640px) 45vw, 100vw" className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.04]" />
                  </div>
                  <div className="flex flex-1 flex-col p-5 lg:p-6">
                    <h3 className="font-display text-[1.625rem] leading-tight font-medium">{e.title}</h3>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{e.summary}</p>
                    <p className="mt-auto pt-4 text-[0.9375rem] font-semibold text-gold-deep">{priceLabel(e.price)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <HowItWorks />

      <section className="section-y overflow-hidden" aria-labelledby="reviews-heading">
        <div className="container-page">
          <SectionHeading
            title={<span id="reviews-heading">From recent guests</span>}
            intro={
              <span className="flex items-center gap-3">
                <Stars rating={reviewSummary.score} />
                <span>
                  <strong className="font-semibold text-ink">{reviewSummary.score}</strong> from {reviewSummary.count}+ {reviewSummary.source} reviews
                </span>
              </span>
            }
          />
        </div>
        <div className="stack-head">
          <ReviewReels
            reels={reviews.map((r) => {
              const villa = getVilla(r.villa);
              return {
                id: r.id,
                text: r.text,
                name: r.name,
                rating: r.rating,
                meta: [villa?.name, r.occasion].filter(Boolean).join(" · "),
                photo: photo(villa ? (villa.photos[1] ?? villa.photos[0]) : "occasions/friends"),
              };
            })}
          />
        </div>
      </section>

      <OwnerBand />
      <InstagramStrip />
    </>
  );
}
