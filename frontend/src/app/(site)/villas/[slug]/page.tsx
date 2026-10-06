import { ClockIcon, MapPinIcon, ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { amenities } from "@/components/icons";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { JsonLd } from "@/components/shared/JsonLd";
import { MapEmbed } from "@/components/shared/MapEmbed";
import { Stars } from "@/components/shared/Reviews";
import { TextLink } from "@/components/ui/Button";
import { Gallery } from "@/components/villa/Gallery";
import { MobileBookingBar, TrackVillaView, VillaEnquiryCard, type BookingVilla } from "@/components/villa/VillaBooking";
import { VillaCard } from "@/components/villa/VillaCard";
import { VillaFacts } from "@/components/villa/VillaFacts";
import { destinationName, getDestination } from "@/data/destinations";
import { experiences } from "@/data/experiences";
import { photo } from "@/data/photos";
import { getReviewsFor } from "@/data/reviews";
import { getVilla, similarVillas, villas } from "@/data/villas";
import { site } from "@/lib/site";
import { formatINR, priceLabel } from "@/lib/utils";

export function generateStaticParams() {
  return villas.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: PageProps<"/villas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const villa = getVilla(slug);
  if (!villa) return {};
  const cover = photo(villa.photos[0]);
  const coverUrl = typeof cover.src === "string" ? cover.src : cover.src.src;
  return {
    title: villa.seo.title,
    description: villa.seo.description,
    alternates: { canonical: `/villas/${villa.slug}` },
    openGraph: { title: `${villa.name}, ${destinationName(villa.destination)}`, description: villa.summary, images: [{ url: coverUrl, alt: cover.alt }] },
  };
}

function Block({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-line py-8 lg:py-10">
      <h2 className="type-display-m">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function VillaPage({ params }: PageProps<"/villas/[slug]">) {
  const { slug } = await params;
  const villa = getVilla(slug);
  if (!villa) notFound();

  const destination = getDestination(villa.destination)!;
  const photos = villa.photos.map(photo);
  const villaReviews = getReviewsFor(villa.slug);
  const addOns = experiences.filter((e) => e.availableAt === "all" || e.availableAt.includes(villa.destination)).slice(0, 4);
  const soon = villa.status === "coming-soon";
  const booking: BookingVilla = {
    slug: villa.slug,
    name: villa.name,
    destination: destination.name,
    priceFrom: villa.priceFrom,
    weekendPrice: villa.weekendPrice,
    maxGuests: villa.guests.max,
    baseGuests: villa.guests.base,
    status: villa.status,
    openingNote: villa.openingNote,
  };

  return (
    <>
      <TrackVillaView slug={villa.slug} name={villa.name} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LodgingBusiness",
          name: villa.name,
          description: villa.description.join(" "),
          url: `${site.url}/villas/${villa.slug}`,
          image: photos.map((p) => `${site.url}${typeof p.src === "string" ? p.src : p.src.src}`),
          telephone: site.phone.display,
          priceRange: `${formatINR(villa.priceFrom)}${villa.weekendPrice ? ` – ${formatINR(villa.weekendPrice)}` : ""} per night`,
          numberOfRooms: villa.bedrooms,
          petsAllowed: villa.petFriendly,
          checkinTime: villa.checkIn,
          checkoutTime: villa.checkOut,
          address: { "@type": "PostalAddress", addressLocality: destination.name, addressRegion: site.address.region, addressCountry: "IN" },
          geo: { "@type": "GeoCoordinates", latitude: villa.location.lat, longitude: villa.location.lng },
          amenityFeature: villa.amenities.map((a) => ({ "@type": "LocationFeatureSpecification", name: amenities[a].label, value: true })),
          ...(villa.rating && {
            aggregateRating: { "@type": "AggregateRating", ratingValue: villa.rating.score, reviewCount: villa.rating.count, bestRating: 5 },
          }),
        }}
      />

      <div className="container-page pt-26 lg:pt-28">
        <Breadcrumbs
          items={[
            { label: "Villas", href: "/villas" },
            { label: destination.name, href: `/destinations/${destination.slug}` },
            { label: villa.name, href: `/villas/${villa.slug}` },
          ]}
        />

        <header className="mt-5 mb-6 flex flex-col gap-3 lg:mb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href={`/destinations/${destination.slug}`} className="text-[0.9375rem] font-semibold text-gold-deep hover:underline hover:underline-offset-4">
              {destination.name}, {villa.location.fromIndore} from Indore
            </Link>
            <h1 className="type-display-xl mt-2">{villa.name}</h1>
            <p className="type-lead mt-2 max-w-2xl text-ink-soft">{villa.tagline}</p>
          </div>
          {villa.rating ? (
            <a href="#reviews" className="flex items-center gap-3 text-ink-soft lg:pb-2">
              <Stars rating={villa.rating.score} />
              <span>
                <strong className="font-semibold text-ink">{villa.rating.score}</strong> from {villa.rating.count} stays
              </span>
            </a>
          ) : (
            soon && <span className="w-fit rounded-full bg-sand px-4 py-2 text-[0.9375rem] font-semibold lg:mb-3">{villa.openingNote}</span>
          )}
        </header>

        <Gallery photos={photos} title={villa.name} morphName={`villa-${villa.slug}`} />

        <div className="grid gap-x-12 pt-6 pb-14 lg:grid-cols-[minmax(0,1fr)_23rem] lg:pt-8 lg:pb-20 xl:gap-x-16">
          <div className="min-w-0">
            <VillaFacts villa={villa} />

            <section className="py-8 lg:py-10">
              <h2 className="sr-only">About {villa.name}</h2>
              <div className="measure space-y-4 leading-relaxed text-ink-soft">
                {villa.description.map((p, i) => (
                  <p key={i} className={i === 0 ? "type-lead text-ink" : undefined}>
                    {p}
                  </p>
                ))}
              </div>
              <ul className="mt-7 grid gap-3 sm:grid-cols-3">
                {villa.highlights.map((h) => (
                  <li key={h} className="rounded-[6px] bg-sand px-4 py-4 font-display text-[1.25rem] leading-snug font-medium">
                    {h}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-l-2 border-brass pl-4 text-[0.9375rem] leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">Hosted by {villa.host.name}.</span> {villa.host.note}
              </p>
            </section>

            <Block title="Where you'll sleep">
              <ul className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {villa.rooms.map((r) => (
                  <li key={r.name} className="rounded-[6px] border border-line px-3.5 py-3 text-[0.9375rem] sm:px-4 sm:py-3.5 sm:text-base">
                    <p className="font-semibold">{r.name}</p>
                    <p className="mt-0.5 text-ink-soft">{r.beds}</p>
                    {r.note && <p className="mt-1 text-[0.875rem] text-ink-soft">{r.note}</p>}
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="What's at the villa">
              <ul className="grid grid-cols-2 gap-x-6 gap-y-3.5 xl:grid-cols-3">
                {villa.amenities.map((key) => {
                  const { label, icon: Icon } = amenities[key];
                  return (
                    <li key={key} className="flex items-center gap-3 text-[0.9375rem]">
                      <Icon aria-hidden weight="light" className="size-6 shrink-0 text-gold" />
                      <span>{label}</span>
                    </li>
                  );
                })}
              </ul>
            </Block>

            <Block title="Meals and add-ons">
              <p className="measure leading-relaxed text-ink-soft">{villa.meals}</p>
              <ul className="mt-6 grid gap-x-12 gap-y-2.5 sm:grid-cols-2">
                {addOns.map((e) => (
                  <li key={e.slug} className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5">
                    <span className="font-medium">{e.title}</span>
                    <span className="text-[0.875rem] whitespace-nowrap text-ink-soft">{priceLabel(e.price)}</span>
                  </li>
                ))}
              </ul>
              <TextLink href="/experiences" className="mt-5">
                See all experiences
              </TextLink>
            </Block>

            <Block title="Good to know">
              <ul className="grid gap-5 sm:grid-cols-3">
                <li className="flex gap-3">
                  <ClockIcon aria-hidden weight="light" className="size-6 shrink-0 text-gold" />
                  <div>
                    <p className="font-semibold">Check-in and out</p>
                    <p className="mt-1 text-ink-soft">
                      In from {villa.checkIn}
                      <br />
                      Out by {villa.checkOut}
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <ShieldCheckIcon aria-hidden weight="light" className="size-6 shrink-0 text-gold" />
                  <div>
                    <p className="font-semibold">Security deposit</p>
                    <p className="mt-1 text-ink-soft">{formatINR(villa.securityDeposit)}, refunded within 3 working days</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <ShieldCheckIcon aria-hidden weight="light" className="size-6 shrink-0 text-gold" />
                  <div>
                    <p className="font-semibold">Cancellation</p>
                    <p className="mt-1 text-ink-soft">
                      {villa.cancellation === "peak"
                        ? "Peak dates are non-refundable but can be moved once."
                        : "Full refund up to 15 days before; 50% up to 7 days before."}{" "}
                      <Link href="/policies/cancellation-refund" className="font-semibold text-gold-deep underline-offset-4 hover:underline">
                        Full policy
                      </Link>
                    </p>
                  </div>
                </li>
              </ul>
              <h3 className="mt-8 font-sans text-base font-semibold">House rules</h3>
              <ul className="measure mt-3 space-y-2 text-[0.9375rem] text-ink-soft">
                {villa.houseRules.map((rule) => (
                  <li key={rule} className="relative pl-6 before:absolute before:top-[0.7em] before:left-0 before:h-px before:w-3 before:bg-brass">
                    {rule}
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="Where it is" id="location">
              <p className="flex items-start gap-3 text-ink-soft">
                <MapPinIcon aria-hidden weight="light" className="mt-0.5 size-6 shrink-0 text-gold" />
                <span>
                  {villa.location.area}, about {villa.location.fromIndore} from Indore. The map shows the approximate area; we
                  share the exact location and directions when you book.
                </span>
              </p>
              <MapEmbed lat={villa.location.lat} lng={villa.location.lng} zoom={11} title={`Approximate location of ${villa.name}`} className="mt-5 aspect-[16/9] w-full lg:aspect-[2/1]" />
            </Block>


            {villaReviews.length > 0 && (
              <Block title="What guests say" id="reviews">
                <ul className="space-y-8">
                  {villaReviews.map((r) => (
                    <li key={r.id}>
                      <Stars rating={r.rating} />
                      <blockquote className="mt-3 font-display-italic text-[1.375rem] leading-snug sm:text-[1.5rem]">“{r.text}”</blockquote>
                      <p className="mt-3 text-[0.9375rem] text-ink-soft">
                        <span className="font-semibold text-ink">{r.name}</span>, {r.city}
                        {r.occasion ? `. ${r.occasion}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </Block>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <VillaEnquiryCard villa={booking} />
            </div>
          </aside>
        </div>
      </div>

      <section className="section-y bg-sand">
        <div className="container-page">
          <h2 className="type-display-l">You might also like</h2>
          <ul className="stack-head grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
            {similarVillas(villa).map((v) => (
              <li key={v.slug}>
                <VillaCard villa={v} ratio="landscape" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <MobileBookingBar villa={booking} />
    </>
  );
}
