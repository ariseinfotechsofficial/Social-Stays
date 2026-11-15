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
import { fill, getContent, getDestination, labels, villasIn } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { formatDriveTime } from "@/lib/utils";

export async function generateStaticParams() {
  const c = await getContent();
  return c.destinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = await getContent();
  const d = getDestination(c, slug);
  if (!d) return {};
  return buildMetadata(c, d.seo, { title: `Villas in ${d.name}`, description: d.tagline, path: `/destinations/${d.slug}`, image: d.hero });
}

export default async function DestinationPage({ params }: PageProps<"/destinations/[slug]">) {
  const { slug } = await params;
  const c = await getContent();
  const d = getDestination(c, slug);
  if (!d) notFound();
  const stays = villasIn(c, d.slug);
  const t = labels(c, "destination");
  const vars = { name: d.name };
  const cta = t.text("ctaLabel", "Check availability");
  const hero = d.hero ?? d.card;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TouristDestination",
          name: d.name,
          description: d.intro.join(" "),
          url: `${siteUrl}/destinations/${d.slug}`,
          geo: { "@type": "GeoCoordinates", latitude: d.coordinates.lat, longitude: d.coordinates.lng },
          touristType: ["Families", "Friend groups", "Couples"],
        }}
      />
      {d.faqs.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: d.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }}
        />
      )}

      <PageHero
        photo={hero}
        title={fill(t.text("heroTitle", "Villas in {name}"), vars)}
        intro={d.tagline}
        meta={<Breadcrumbs tone="light" items={[{ label: "Destinations", href: "/destinations" }, { label: d.name, href: `/destinations/${d.slug}` }]} />}
      >
        <EnquireTrigger className={buttonClasses("light", "lg")} prefill={{ destination: d.name, title: `Plan a stay in ${d.name}` }}>
          {cta}
        </EnquireTrigger>
      </PageHero>

      <section className="section-y">
        <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="type-display-l">{fill(t.text("whyTitle", "Why stay in {name}"), vars)}</h2>
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
            <h3 className="font-display text-[1.5rem] font-medium">{t.text("planTitle", "Plan the trip")}</h3>
            <dl className="mt-4 divide-y divide-ink/10 text-[0.9375rem]">
              {[
                [t.text("fromIndoreLabel", "From Indore"), `${formatDriveTime(d.driveMinutes)}, ${d.distanceKm} km`],
                ["Route", d.route],
                [t.text("bestTimeLabel", "Best time"), d.bestTime],
                ["Stays", `${stays.length} ${stays.length === 1 ? "villa" : "villas"} in ${d.name}`],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-4 py-3">
                    <dt className="font-semibold">{k}</dt>
                    <dd className="text-ink-soft">{v}</dd>
                  </div>
                ))}
            </dl>
            <EnquireTrigger className={buttonClasses("primary", "md", "mt-5 w-full")} prefill={{ destination: d.name, title: `Plan a stay in ${d.name}` }}>
              {cta}
            </EnquireTrigger>
          </aside>
        </div>
      </section>

      {stays.length > 0 && (
        <section className="section-y bg-sand" aria-labelledby="stays-heading">
          <div className="container-page">
            <h2 id="stays-heading" className="type-display-l">
              {fill(t.text("staysTitle", "Where to stay in {name}"), vars)}
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
                      <p className="font-display text-[1.625rem] leading-tight font-medium">{fill(t.text("suggestTitle"), vars)}</p>
                      <p className="mt-3 leading-relaxed text-ink-soft">{fill(t.text("suggestBody"), vars)}</p>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <WhatsAppLink
                        placement={`destination_${d.slug}_suggest`}
                        message={`Hello ${c.settings.brand.name}, can you suggest a villa in ${d.name} for our group?`}
                        className={buttonClasses("primary", "md")}
                      >
                        {t.text("suggestButton", "Ask on WhatsApp")}
                      </WhatsAppLink>
                      <TextLink href="/villas">{t.text("seeAllLabel", "See all villas")}</TextLink>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </section>
      )}

      {d.thingsToDo.length > 0 && (
        <section className="section-y" aria-labelledby="todo-heading">
          <div className="container-page">
            <h2 id="todo-heading" className="type-display-l">
              {fill(t.text("thingsTitle", "Things to do around {name}"), vars)}
            </h2>
            <ul className="stack-head grid gap-x-8 gap-y-10 md:grid-cols-2 lg:gap-x-10">
              {d.thingsToDo.map((item, i) => (
                <li key={item.title}>
                  {item.photo && <RevealImage photo={item.photo} sizes="(min-width: 768px) 45vw, 100vw" delay={(i % 2) * 0.1} className="aspect-[16/10] w-full" />}
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-[1.625rem] leading-tight font-medium">{item.title}</h3>
                    {item.time && <p className="shrink-0 text-[0.875rem] font-semibold text-gold-deep">{item.time}</p>}
                  </div>
                  <p className="measure mt-2 leading-relaxed text-ink-soft">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {d.faqs.length > 0 && (
        <section className="section-y bg-sand">
          <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
            <div>
              <h2 className="type-display-l">{fill(t.text("faqTitle", "{name}, answered"), vars)}</h2>
              <p className="type-lead mt-4 max-w-sm text-ink-soft">{fill(t.text("faqIntro"), vars)}</p>
            </div>
            <FaqList items={d.faqs} />
          </div>
        </section>
      )}
    </>
  );
}
