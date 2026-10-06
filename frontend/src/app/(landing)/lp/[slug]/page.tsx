import { CheckIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import { WhatsAppLink } from "@/components/layout/ContactLinks";
import { ReviewCarousel, Stars } from "@/components/shared/Reviews";
import { buttonClasses } from "@/components/ui/Button";
import { VillaCard } from "@/components/villa/VillaCard";
import { VillaFacts } from "@/components/villa/VillaFacts";
import { destinationName } from "@/data/destinations";
import { getLandingPage, landingPages } from "@/data/landing";
import { photo } from "@/data/photos";
import { reviews, reviewSummary } from "@/data/reviews";
import { getVilla } from "@/data/villas";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return landingPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/lp/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lp = getLandingPage(slug);
  if (!lp) return {};
  // Ad pages stay out of search results so they don't compete with the main villa pages
  return { title: lp.seoTitle, description: lp.subhead, robots: { index: false, follow: false } };
}

export default async function LandingPage({ params }: PageProps<"/lp/[slug]">) {
  const { slug } = await params;
  const lp = getLandingPage(slug);
  if (!lp) notFound();

  const hero = photo(lp.hero);
  const villa = lp.kind === "villa" ? getVilla(lp.villas[0]) : undefined;
  const prefillVilla = villa
    ? { name: villa.name, slug: villa.slug, destination: destinationName(villa.destination), maxGuests: villa.guests.max }
    : undefined;
  const lpReviews = reviews.filter((r) => lp.villas.includes(r.villa) || (lp.occasion && r.occasion === lp.occasion));

  return (
    <>
      <section className="relative isolate overflow-hidden bg-night text-white">
        <Image src={hero.src} alt={hero.alt} fill preload sizes="100vw" className="hero-settle -z-10 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-night/55" />
        <div className="container-page grid gap-8 pt-28 pb-12 lg:min-h-[86svh] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16 lg:pt-24">
          <div>
            <h1 className="type-display-xl hero-rise max-w-[15ch]">{lp.headline}</h1>
            <p className="type-lead hero-rise mt-4 max-w-xl text-white/90 [animation-delay:150ms]">{lp.subhead}</p>
            <ul className="hero-rise mt-6 space-y-2.5 [animation-delay:280ms]">
              {lp.bullets.map((b) => (
                <li key={b} className="flex items-center gap-3 font-medium">
                  <span className="grid size-6 place-items-center rounded-full bg-gold">
                    <CheckIcon weight="bold" className="size-3.5" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <p className="hero-rise mt-6 flex items-center gap-3 text-white/85 [animation-delay:380ms]">
              <Stars rating={reviewSummary.score} />
              {reviewSummary.score} from {reviewSummary.count}+ {reviewSummary.source} reviews
            </p>
          </div>
          <div id="enquire" className="hero-rise overflow-hidden rounded-[8px] bg-white text-ink shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)] [animation-delay:250ms]">
            <div className="px-5 pt-6 pb-2">
              <h2 className="type-display-m">Check your dates</h2>
              <p className="mt-1 text-[0.9375rem] text-ink-soft">No payment needed. We reply on WhatsApp, usually within 30 minutes.</p>
            </div>
            <EnquiryForm villa={prefillVilla} occasion={lp.occasion} placement={`landing_${lp.slug}`} />
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-page">
          <ul className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {lp.gallery.map((key) => {
              const p = photo(key);
              return (
                <li key={key} className="relative aspect-[4/5] overflow-hidden rounded-photo bg-sand-deep">
                  <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 24vw, 48vw" className="object-cover" />
                </li>
              );
            })}
          </ul>

          {villa ? (
            <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="type-display-l">About {villa.name}</h2>
                <div className="mt-4 space-y-3 leading-relaxed text-ink-soft">
                  {villa.description.slice(0, 2).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
              <div>
                <VillaFacts villa={villa} />
                <p className="mt-5 leading-relaxed text-ink-soft">{villa.meals}</p>
              </div>
            </div>
          ) : (
            <div className="mt-10">
              <h2 className="type-display-l">Farmhouses that suit a party</h2>
              <ul className="stack-head grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
                {lp.villas.map((s) => {
                  const v = getVilla(s);
                  return v ? (
                    <li key={s}>
                      <VillaCard villa={v} morph={false} ratio="landscape" />
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          )}
        </div>
      </section>

      {lpReviews.length > 0 && (
        <section className="section-y bg-sand">
          <div className="container-page">
            <ReviewCarousel
              reviews={lpReviews.map((r) => ({
                id: r.id,
                text: r.text,
                name: r.name,
                rating: r.rating,
                meta: [getVilla(r.villa)?.name, r.occasion].filter(Boolean).join(", "),
              }))}
            />
          </div>
        </section>
      )}

      <section className="py-12 lg:py-16">
        <div className="container-page flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <h2 className="type-display-l max-w-[16ch]">Ask us about your dates</h2>
          <a href="#enquire" className={buttonClasses("primary", "lg")}>
            Check availability
          </a>
        </div>
      </section>

      {/* Sticky mobile action */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <WhatsAppLink
          placement={`landing_${lp.slug}_sticky`}
          message={villa ? `Hello Social Stays, I'd like to check dates for ${villa.name}.` : `Hello Social Stays, I'm planning a ${lp.occasion?.toLowerCase() ?? "stay"} and would like to check villas.`}
          className={buttonClasses("primary", "lg", "w-full")}
        >
          <WhatsappLogoIcon className="size-5" /> Chat on WhatsApp
        </WhatsAppLink>
        <p className="sr-only">{site.replyHours}</p>
      </div>
    </>
  );
}
