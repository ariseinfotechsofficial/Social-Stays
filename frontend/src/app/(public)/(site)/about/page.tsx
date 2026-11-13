import type { Metadata } from "next";
import Image from "next/image";
import { Fragment } from "react";
import { RevealImage } from "@/components/motion/Reveal";
import { OwnerBand } from "@/components/shared/Bands";
import { PageHero } from "@/components/shared/PageHero";
import { getContent, getPage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return buildMetadata(c, getPage(c, "about").seo, { path: "/about", title: `About ${c.settings.brand.name}` });
}

export default async function AboutPage() {
  const c = await getContent();
  const page = getPage(c, "about");

  return (
    <>
      {page.visible.map((s) => {
        const data = page.section(s.key)!;
        switch (s.key) {
          case "hero":
            return <PageHero key={s.key} photo={data.photo("image")} title={data.text("title")} intro={data.text("intro")} />;
          case "story": {
            const image = data.photo("image");
            return (
              <section key={s.key} className="section-y">
                <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-16">
                  <div className="measure space-y-4 leading-relaxed text-ink-soft lg:py-2">
                    {data.text("lead") && <p className="type-lead text-ink">{data.text("lead")}</p>}
                    {data.list<string>("paragraphs").map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  {image && <RevealImage photo={image} sizes="(min-width: 1024px) 45vw, 100vw" className="aspect-[4/3] w-full lg:aspect-auto lg:min-h-[24rem]" />}
                </div>
              </section>
            );
          }
          case "values":
            return (
              <section key={s.key} className="section-y bg-sand">
                <div className="container-page">
                  <h2 className="type-display-l">{data.text("title")}</h2>
                  <ul className="stack-head grid gap-8 lg:grid-cols-3 lg:gap-12">
                    {data.list<{ title: string; body: string }>("items").map((v) => (
                      <li key={v.title} className="border-t border-ink pt-5">
                        <h3 className="font-display text-[1.5rem] font-medium">{v.title}</h3>
                        <p className="mt-2 leading-relaxed text-ink-soft">{v.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          case "team":
            if (!c.team.length) return null;
            return (
              <section key={s.key} className="section-y">
                <div className="container-page">
                  <h2 className="type-display-l">{data.text("title")}</h2>
                  {data.text("intro") && <p className="type-lead mt-4 max-w-lg text-ink-soft">{data.text("intro")}</p>}
                  <ul className="stack-head grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
                    {c.team.map((m) => (
                      <li key={m.name}>
                        <div className="relative aspect-[4/5] overflow-hidden rounded-photo bg-sand-deep">
                          {m.photo && <Image src={m.photo.src} alt={m.photo.alt} fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw" className="object-cover grayscale" />}
                        </div>
                        <h3 className="mt-4 font-display text-[1.5rem] font-medium">{m.name}</h3>
                        <p className="text-[0.9375rem] font-semibold text-gold-deep">{m.role}</p>
                        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{m.bio}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          case "ownerBand":
            return <OwnerBand key={s.key} />;
          default:
            return <Fragment key={s.key} />;
        }
      })}
    </>
  );
}
