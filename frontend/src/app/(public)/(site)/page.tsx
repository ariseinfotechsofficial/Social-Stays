import { CheckIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import { Fragment, type ReactNode } from "react";
import { DestinationPicker } from "@/components/home/DestinationPicker";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ReviewSpotlight } from "@/components/home/ReviewSpotlight";
import { WhatsAppLink } from "@/components/layout/ContactLinks";
import { InstagramStrip, OwnerBand } from "@/components/shared/Bands";
import { FaqList } from "@/components/shared/FaqList";
import { JsonLd } from "@/components/shared/JsonLd";
import { Stars } from "@/components/shared/Reviews";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TextLink, buttonClasses } from "@/components/ui/Button";
import { Rail } from "@/components/villa/VillaCarousel";
import { VillaCard } from "@/components/villa/VillaCard";
import type { Content } from "@/data/types";
import { fill, getContent, getPage, getVilla, liveVillas, type SectionData } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { cn, formatDriveTime, formatINR, priceLabel } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return buildMetadata(c, getPage(c, "home").seo, { path: "/" });
}

function Destinations({ c, data }: { c: Content; data: SectionData }) {
  const live = liveVillas(c);
  const stops = c.destinations.map((d) => ({
    slug: d.slug,
    name: d.name,
    drive: formatDriveTime(d.driveMinutes),
    villas: live.filter((v) => v.destination === d.slug).length,
    photo: d.card ?? d.hero,
  }));
  return (
    <section className="section-y bg-sand" aria-labelledby="destinations-heading">
      <div className="container-page">
        <SectionHeading
          title={<span id="destinations-heading">{data.text("title")}</span>}
          intro={data.text("intro")}
          action={data.text("linkLabel") ? <TextLink href="/destinations">{data.text("linkLabel")}</TextLink> : undefined}
        />
        <div className="stack-head">
          <DestinationPicker stops={stops} />
        </div>
        {data.text("helpLinkLabel") && (
          <p className="mt-10 text-center text-[0.9375rem] text-ink-soft">
            {data.text("helpText")}{" "}
            <WhatsAppLink placement="home_destinations" message={data.text("helpMessage")} className="font-semibold text-gold-deep underline underline-offset-4">
              {data.text("helpLinkLabel")}
            </WhatsAppLink>
          </p>
        )}
      </div>
    </section>
  );
}

function Collection({ c, data }: { c: Content; data: SectionData }) {
  const live = liveVillas(c);
  return (
    <section className="section-y overflow-hidden" aria-labelledby="collection-heading">
      <div className="container-page">
        <SectionHeading
          title={<span id="collection-heading">{data.text("title")}</span>}
          intro={data.text("intro")}
          action={data.text("linkLabel") ? <TextLink href="/villas">{data.text("linkLabel")}</TextLink> : undefined}
        />
        {c.categories.map((cat) => {
          const list = live.filter((v) => v.category === cat.slug);
          if (!list.length) return null;
          // A short row has no carousel to fill the width, so a panel takes the spare columns
          const short = list.length < 3;
          const name = (cat.short || cat.label).toLowerCase();
          const points = [...data.list<string>("panelPoints"), `From ${formatINR(Math.min(...list.map((v) => v.priceFrom)))} a night`];
          return (
            <div key={cat.slug} className="stack-head">
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-3">
                <div>
                  <h3 className="type-display-m">{cat.label}</h3>
                  {!short && <p className="mt-1 text-[0.9375rem] text-ink-soft">{cat.blurb}</p>}
                </div>
                <TextLink href={`/villas?category=${cat.slug}`} className="shrink-0 text-[0.9375rem]">
                  {list.length === 1 ? "1 villa" : `${list.length} villas`}
                </TextLink>
              </div>
              {short ? (
                <div className="grid gap-5 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
                  {list.map((v) => (
                    <VillaCard key={v.slug} villa={v} morph={false} />
                  ))}
                  <div className={cn("flex flex-col justify-center gap-8 rounded-[14px] bg-sand p-7 lg:p-12", list.length === 1 ? "lg:col-span-2" : "sm:col-span-2 lg:col-span-1")}>
                    <div>
                      <p className="text-[0.8125rem] font-semibold tracking-[0.16em] text-gold-deep uppercase">{cat.label}</p>
                      <p className="mt-3 max-w-lg font-display text-[1.375rem] leading-snug font-medium sm:text-[1.75rem] lg:text-[2.125rem]">{cat.blurb}</p>
                      <ul className="mt-6 grid gap-2.5 text-[0.9375rem] sm:grid-cols-2">
                        {points.map((t) => (
                          <li key={t} className="flex items-center gap-2.5">
                            <CheckIcon aria-hidden weight="bold" className="size-4 shrink-0 text-gold" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      <WhatsAppLink
                        placement={`home_${cat.slug}_panel`}
                        message={`Hello ${c.settings.brand.name}, I would like to know about your ${cat.label.toLowerCase()}.`}
                        className={buttonClasses("primary", "md")}
                      >
                        <WhatsappLogoIcon className="size-5" /> {fill(data.text("panelButtonLabel", "Ask about {category} stays"), { category: name })}
                      </WhatsAppLink>
                      <TextLink href={`/villas?category=${cat.slug}`}>{fill(data.text("panelLinkLabel", "See {category} stays"), { category: name })}</TextLink>
                    </div>
                  </div>
                </div>
              ) : (
                <Rail label={cat.label}>
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
  );
}

function Experiences({ c, data }: { c: Content; data: SectionData }) {
  const chosen = data.list<string>("items");
  const featured = chosen.length ? chosen.flatMap((slug) => c.experiences.filter((e) => e.slug === slug)) : c.experiences.slice(0, 4);
  if (!featured.length) return null;
  return (
    <section className="section-y bg-sand" aria-labelledby="experiences-heading">
      <div className="container-page">
        <SectionHeading
          title={
            <span id="experiences-heading">
              {data.text("eyebrow") && <span className="mb-2 block font-sans text-[0.8125rem] font-semibold tracking-[0.16em] text-gold-deep uppercase">{data.text("eyebrow")}</span>}
              {data.text("title")}
            </span>
          }
          intro={data.text("intro")}
          action={data.text("linkLabel") ? <TextLink href="/experiences">{data.text("linkLabel")}</TextLink> : undefined}
        />
        {/* Phones: a swipe row instead of four tall cards stacked */}
        <ul className="stack-head no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 lg:gap-6">
          {featured.map((e) => (
            <li
              key={e.slug}
              className="group flex w-[78%] shrink-0 snap-start flex-col overflow-hidden rounded-[14px] border border-line bg-white transition-[translate,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(42_36_27/0.45)] sm:w-auto"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-sand-deep">
                {e.photo && (
                  <Image src={e.photo.src} alt={e.photo.alt} fill sizes="(min-width: 1024px) 23vw, (min-width: 640px) 45vw, 100vw" className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.04]" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-5 lg:p-6">
                <h3 className="font-display text-[1.625rem] leading-tight font-medium">{e.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{e.summary}</p>
                <p className="mt-auto pt-4 text-[0.9375rem] font-semibold text-gold-deep">{priceLabel(e.price)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Reviews({ c, data }: { c: Content; data: SectionData }) {
  const featured = c.reviews.filter((r) => r.featured);
  const photo = data.photo("image");
  if (!featured.length || !photo) return null;
  const summary = c.settings.reviewSummary;
  return (
    <section className="section-y" aria-labelledby="reviews-heading">
      <div className="container-page">
        <SectionHeading
          title={<span id="reviews-heading">{data.text("title")}</span>}
          intro={
            summary.count ? (
              <span className="flex items-center gap-3">
                <Stars rating={summary.score} />
                <span>
                  <strong className="font-semibold text-ink">{summary.score}</strong> from {summary.count}+ {summary.source} reviews
                </span>
              </span>
            ) : undefined
          }
        />
        <div className="stack-head">
          <ReviewSpotlight
            photo={photo}
            reviews={featured.map((r) => ({
              id: r.id,
              text: r.text,
              name: r.name,
              rating: r.rating,
              meta: [getVilla(c, r.villa)?.name, r.occasion].filter(Boolean).join(" · "),
            }))}
          />
        </div>
      </div>
    </section>
  );
}

function HomeFaq({ c, data }: { c: Content; data: SectionData }) {
  const items = c.faqGroups.flatMap((g) => g.items).filter((f) => f.showOnHome);
  if (!items.length) return null;
  return (
    <section className="section-y bg-sand">
      <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
        <div>
          <h2 className="type-display-l">{data.text("title")}</h2>
          {data.text("intro") && <p className="type-lead mt-4 max-w-sm text-ink-soft">{data.text("intro")}</p>}
          {data.text("linkLabel") && (
            <TextLink href="/faq" className="mt-6">
              {data.text("linkLabel")}
            </TextLink>
          )}
        </div>
        <FaqList items={items} />
      </div>
    </section>
  );
}

export default async function HomePage() {
  const c = await getContent();
  const page = getPage(c, "home");
  const { settings } = c;

  const render = (key: string, data: SectionData): ReactNode => {
    switch (key) {
      case "hero":
        return <Hero data={data} />;
      case "destinations":
        return <Destinations c={c} data={data} />;
      case "collection":
        return <Collection c={c} data={data} />;
      case "experiences":
        return <Experiences c={c} data={data} />;
      case "howItWorks":
        return <HowItWorks data={data} brand={settings.brand.name} />;
      case "reviews":
        return <Reviews c={c} data={data} />;
      case "faq":
        return <HomeFaq c={c} data={data} />;
      case "ownerBand":
        return <OwnerBand />;
      case "instagram":
        return <InstagramStrip />;
      default:
        return null;
    }
  };

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: settings.brand.name,
          url: siteUrl,
          ...(settings.brand.logo ? { logo: settings.brand.logo.src } : {}),
          description: settings.brand.description,
          email: settings.contact.email,
          telephone: settings.contact.phoneDisplay,
          address: { "@type": "PostalAddress", addressLocality: settings.address.locality, addressRegion: settings.address.region, addressCountry: settings.address.country },
          sameAs: [settings.social.instagramUrl, settings.social.facebookUrl, settings.social.youtubeUrl].filter(Boolean),
        }}
      />
      {page.visible.map((s) => (
        <Fragment key={s.key}>{render(s.key, page.section(s.key)!)}</Fragment>
      ))}
    </>
  );
}
