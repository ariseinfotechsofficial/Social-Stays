import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnquireTrigger } from "@/components/enquiry/EnquiryDialog";
import { WhatsAppLink } from "@/components/layout/ContactLinks";
import { RevealImage } from "@/components/motion/Reveal";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { FaqList } from "@/components/shared/FaqList";
import { JsonLd } from "@/components/shared/JsonLd";
import { PageHero } from "@/components/shared/PageHero";
import { TextLink, buttonClasses } from "@/components/ui/Button";
import { VillaCard } from "@/components/villa/VillaCard";
import { destinations, getDestination } from "@/data/destinations";
import { photo } from "@/data/photos";
import { villasIn } from "@/data/villas";
import { site } from "@/lib/site";
import { formatDriveTime } from "@/lib/utils";

export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) return {};
  const hero = photo(d.hero);
  return {
    title: d.seo.title,
    description: d.seo.description,
    alternates: { canonical: `/destinations/${d.slug}` },
    openGraph: { images: [{ url: typeof hero.src === "string" ? hero.src : hero.src.src, alt: hero.alt }] },
  };
}

export default async function DestinationPage({ params }: PageProps<"/destinations/[slug]">) {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) notFound();
  const stays = villasIn(d.slug);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TouristDestination",
          name: d.name,
          description: d.intro.join(" "),
          url: `${site.url}/destinations/${d.slug}`,
          geo: { "@type": "GeoCoordinates", latitude: d.coordinates.lat, longitude: d.coordinates.lng },
          touristType: ["Families", "Friend groups", "Couples"],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: d.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />

      <PageHero
        photo={photo(d.hero)}
        title={`Villas in ${d.name}`}
        intro={d.tagline}
        meta={<Breadcrumbs tone="light" items={[{ label: "Destinations", href: "/destinations" }, { label: d.name, href: `/destinations/${d.slug}` }]} />}
      >
        <EnquireTrigger className={buttonClasses("light", "lg")} prefill={{ destination: d.name, title: `Plan a stay in ${d.name}` }}>
          Check availability
        </EnquireTrigger>
      </PageHero>

      <section className="section-y">
        <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="type-display-l">Why stay in {d.name}</h2>
            <div className="measure mt-5 space-y-4">
              {d.intro.map((p, i) => (
                <p key={i} className={i === 0 ? "type-lead" : "leading-relaxed text-ink-soft"}>
                  {p}
                </p>
              ))}
            </div>
          </div>
          {/* Trip facts beside the intro rather than under it */}
          <aside className="self-start rounded-[8px] bg-sand p-6 lg:mt-2">
            <h3 className="font-display text-[1.5rem] font-medium">Plan the trip</h3>
            <dl className="mt-4 divide-y divide-ink/10 text-[0.9375rem]">
              {[
                ["From Indore", `${formatDriveTime(d.driveMinutes)}, ${d.distanceKm} km`],
                ["Route", d.route],
                ["Best time", d.bestTime],
                ["Stays", `${stays.length} ${stays.length === 1 ? "villa" : "villas"} in ${d.name}`],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-4 py-3">
                  <dt className="font-semibold">{k}</dt>
                  <dd className="text-ink-soft">{v}</dd>
                </div>
              ))}
            </dl>
            <EnquireTrigger className={buttonClasses("primary", "md", "mt-5 w-full")} prefill={{ destination: d.name, title: `Plan a stay in ${d.name}` }}>
              Check availability
            </EnquireTrigger>
          </aside>
        </div>
      </section>

      <section className="section-y bg-sand" aria-labelledby="stays-heading">
        <div className="container-page">
          <h2 id="stays-heading" className="type-display-l">
            Where to stay in {d.name}
          </h2>
          <ul className="stack-head grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
            {stays.map((v) => (
              <li key={v.slug}>
                <VillaCard villa={v} ratio="landscape" />
              </li>
            ))}
            {/* With two villas the three-column row would end in a gap; offer help there instead */}
            {stays.length % 3 === 2 && (
              <li className="hidden lg:block">
                <div className="flex h-full flex-col justify-between rounded-photo border border-ink/12 bg-white p-7">
                  <div>
                    <p className="font-display text-[1.625rem] leading-tight font-medium">Not sure which villa suits your group?</p>
                    <p className="mt-3 leading-relaxed text-ink-soft">
                      Tell us who is coming and what you are planning. We will suggest the right home in {d.name}, or a better fit
                      nearby.
                    </p>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <WhatsAppLink
                      placement={`destination_${d.slug}_suggest`}
                      message={`Hello Social Stays, can you suggest a villa in ${d.name} for our group?`}
                      className={buttonClasses("primary", "md")}
                    >
                      Ask on WhatsApp
                    </WhatsAppLink>
                    <TextLink href="/villas">See all villas</TextLink>
                  </div>
                </div>
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="section-y" aria-labelledby="todo-heading">
        <div className="container-page">
          <h2 id="todo-heading" className="type-display-l">
            Things to do around {d.name}
          </h2>
          <ul className="stack-head grid gap-x-8 gap-y-10 md:grid-cols-2 lg:gap-x-10">
            {d.thingsToDo.map((t, i) => (
              <li key={t.title}>
                {t.photo && (
                  <RevealImage
                    photo={photo(t.photo)}
                    sizes="(min-width: 768px) 45vw, 100vw"
                    delay={(i % 2) * 0.1}
                    className="aspect-[16/10] w-full"
                  />
                )}
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-[1.625rem] leading-tight font-medium">{t.title}</h3>
                  {t.time && <p className="shrink-0 text-[0.875rem] font-semibold text-gold-deep">{t.time}</p>}
                </div>
                <p className="measure mt-2 leading-relaxed text-ink-soft">{t.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-y bg-sand">
        <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div>
            <h2 className="type-display-l">{d.name}, answered</h2>
            <p className="type-lead mt-4 max-w-sm text-ink-soft">The questions we hear most about staying in {d.name}.</p>
          </div>
          <FaqList items={d.faqs} />
        </div>
      </section>
    </>
  );
}
