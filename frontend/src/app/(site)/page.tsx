import { CelebrationBand } from "@/components/home/CelebrationBand";
import { DriveScale, type ScaleStop } from "@/components/home/DriveScale";
import { ExperienceIndex } from "@/components/home/ExperienceIndex";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Principles } from "@/components/home/Principles";
import { InstagramStrip, OwnerBand } from "@/components/shared/Bands";
import { FaqList } from "@/components/shared/FaqList";
import { JsonLd } from "@/components/shared/JsonLd";
import { ReviewCarousel } from "@/components/shared/Reviews";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TextLink } from "@/components/ui/Button";
import { Rail } from "@/components/villa/VillaCarousel";
import { VillaCard } from "@/components/villa/VillaCard";
import { WhatsAppLink } from "@/components/layout/ContactLinks";
import { destinations } from "@/data/destinations";
import { experiences } from "@/data/experiences";
import { homeFaqs } from "@/data/faqs";
import { photo } from "@/data/photos";
import { reviews, reviewSummary } from "@/data/reviews";
import { getVilla, liveVillas, startingPrice, villasIn } from "@/data/villas";
import { site } from "@/lib/site";
import { priceLabel } from "@/lib/utils";

export default function HomePage() {
  const stops: ScaleStop[] = destinations.map((d) => ({
    slug: d.slug,
    name: d.name,
    minutes: d.driveMinutes,
    km: d.distanceKm,
    villas: villasIn(d.slug).filter((v) => v.status === "live").length,
    priceFrom: startingPrice(d.slug),
    tagline: d.tagline,
    photo: photo(d.card),
  }));

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
      <Principles />

      <section className="section-y bg-sand" aria-labelledby="destinations-heading">
        <div className="container-page">
          <DriveScale
            stops={stops}
            heading={
              <div>
                <h2 id="destinations-heading" className="type-display-l">
                  An easy drive from Indore
                </h2>
                <p className="type-lead mt-4 max-w-sm text-ink-soft">
                  Four places we know well, each between one and two and a half hours from the city.
                </p>
                <TextLink href="/destinations" className="mt-5">
                  Explore destinations
                </TextLink>
              </div>
            }
            note={
              <div className="border-l-2 border-brass pl-5">
                <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
                  Times are by road from central Indore on a weekday morning. Not sure which suits your group?
                </p>
                <WhatsAppLink
                  placement="home_destinations"
                  message="Hello Social Stays, can you suggest a destination for our group?"
                  className="mt-2 inline-block text-[0.9375rem] font-semibold text-gold-deep underline underline-offset-4"
                >
                  Ask us on WhatsApp
                </WhatsAppLink>
              </div>
            }
          />
        </div>
      </section>

      <section className="section-y overflow-hidden" aria-labelledby="collection-heading">
        <div className="container-page">
          <SectionHeading
            title={<span id="collection-heading">The collection</span>}
            intro="Eight homes open now and one on the way. Each one visited, photographed and hosted by the family who owns it."
            action={<TextLink href="/villas">View all villas</TextLink>}
          />
          <Rail label="Villas" className="stack-head">
            {liveVillas.map((v) => (
              <VillaCard key={v.slug} villa={v} />
            ))}
          </Rail>
        </div>
      </section>

      <section className="section-y bg-sand" aria-labelledby="experiences-heading">
        <div className="container-page">
          <SectionHeading
            title={<span id="experiences-heading">Add to your stay</span>}
            intro="Meals, fires and celebrations, arranged before you arrive. Prices are indicative; your quote confirms them."
            action={<TextLink href="/experiences">All experiences</TextLink>}
          />
          <div className="stack-head">
            <ExperienceIndex
              rows={experiences.slice(0, 6).map((e) => ({
                slug: e.slug,
                title: e.title,
                summary: e.summary,
                price: priceLabel(e.price),
                photo: photo(e.photo),
              }))}
            />
          </div>
        </div>
      </section>

      <CelebrationBand />
      <HowItWorks />

      <section className="section-y">
        <div className="container-page">
          <ReviewCarousel
            summary={reviewSummary}
            reviews={reviews.map((r) => ({
              id: r.id,
              text: r.text,
              name: r.name,
              rating: r.rating,
              meta: [getVilla(r.villa)?.name, r.occasion].filter(Boolean).join(", "),
            }))}
          />
        </div>
      </section>

      <section className="section-y bg-sand">
        <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,2fr)] lg:gap-16">
          <div>
            <h2 className="type-display-l">Questions, answered</h2>
            <p className="type-lead mt-4 max-w-sm text-ink-soft">
              Anything else, ask us on{" "}
              <WhatsAppLink placement="home_faq" className="font-semibold text-gold-deep underline underline-offset-4">
                WhatsApp
              </WhatsAppLink>
              .
            </p>
            <TextLink href="/faq" className="mt-5">
              Read all FAQs
            </TextLink>
          </div>
          <FaqList items={homeFaqs} />
        </div>
      </section>

      <OwnerBand />
      <InstagramStrip />
    </>
  );
}
