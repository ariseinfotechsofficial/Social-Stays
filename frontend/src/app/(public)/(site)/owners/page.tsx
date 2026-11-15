import type { Metadata } from "next";
import { Fragment } from "react";
import { OwnerForm } from "@/components/forms/OwnerForm";
import { WhatsAppLink } from "@/components/layout/ContactLinks";
import { RevealImage } from "@/components/motion/Reveal";
import { PageHero } from "@/components/shared/PageHero";
import { buttonClasses } from "@/components/ui/Button";
import { getContent, getPage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return buildMetadata(c, getPage(c, "owners").seo, { path: "/owners", title: "List your villa or farmhouse near Indore" });
}

type Item = { title: string; body: string };

export default async function OwnersPage() {
  const c = await getContent();
  const page = getPage(c, "owners");

  return (
    <>
      {page.visible.map((s) => {
        const data = page.section(s.key)!;
        switch (s.key) {
          case "hero":
            return (
              <PageHero key={s.key} photo={data.photo("image")} title={data.text("title")} intro={data.text("intro")}>
                {data.text("buttonLabel") && (
                  <a href="#partner-form" className={buttonClasses("light", "lg")}>
                    {data.text("buttonLabel")}
                  </a>
                )}
              </PageHero>
            );
          case "benefits":
            return (
              <section key={s.key} className="section-y">
                <div className="container-page">
                  <h2 className="type-display-l max-w-[18ch]">{data.text("title")}</h2>
                  <ul className="stack-head grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                    {data.list<Item>("items").map((b) => (
                      <li key={b.title} className="border-t border-line pt-5">
                        <h3 className="font-display text-[1.5rem] leading-snug font-medium">{b.title}</h3>
                        <p className="mt-2 leading-relaxed text-ink-soft">{b.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          case "process": {
            const image = data.photo("image");
            const criteria = data.list<string>("criteria");
            return (
              <section key={s.key} id="how-it-works" className="section-y scroll-mt-24 bg-sand">
                <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
                  <div>
                    <h2 className="type-display-l">{data.text("title")}</h2>
                    <ol className="mt-7">
                      {data.list<Item>("steps").map((step, i) => (
                        <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-ink/15 py-4.5 last:border-b">
                          <span className="font-display text-[1.75rem] leading-none font-medium text-gold-deep lining-nums">{i + 1}</span>
                          <div>
                            <h3 className="font-sans text-[1.0625rem] font-semibold">{step.title}</h3>
                            <p className="mt-1.5 leading-relaxed text-ink-soft">{step.body}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    {image && <RevealImage photo={image} sizes="(min-width: 1024px) 45vw, 100vw" className="aspect-[4/3] w-full" />}
                    {criteria.length > 0 && (
                      <>
                        <h3 className="mt-7 font-display text-[1.5rem] font-medium">{data.text("criteriaTitle")}</h3>
                        <ul className="mt-3 grid gap-x-8 gap-y-2 text-[0.9375rem] text-ink-soft sm:grid-cols-2">
                          {criteria.map((item) => (
                            <li key={item} className="relative pl-6 before:absolute before:top-[0.7em] before:left-0 before:h-px before:w-3 before:bg-brass">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </section>
            );
          }
          case "form":
            return (
              <section key={s.key} id="partner-form" className="section-y scroll-mt-20 bg-ink text-sand">
                <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-16">
                  <div>
                    <h2 className="type-display-l max-w-[14ch] text-white">{data.text("title")}</h2>
                    {data.text("intro") && <p className="type-lead mt-4 max-w-sm text-sand/80">{data.text("intro")}</p>}
                    {data.text("linkLabel") && (
                      <p className="mt-6 text-sand/80">
                        {data.text("prompt")}{" "}
                        <WhatsAppLink placement="owners_page" message={data.text("message")} className="font-semibold text-brass underline underline-offset-4">
                          {data.text("linkLabel")}
                        </WhatsAppLink>
                      </p>
                    )}
                  </div>
                  <div className="text-ink">
                    <OwnerForm
                      copy={{
                        submitLabel: data.text("submitLabel", "Send property details"),
                        successTitle: data.text("successTitle", "Thank you, we have your details"),
                        successBody: data.text("successBody"),
                        privacyNote: data.text("privacyNote"),
                        nameLabel: data.text("nameLabel", "Your name"),
                        phoneLabel: data.text("phoneLabel", "Mobile number"),
                        locationLabel: data.text("locationLabel", "Property location"),
                        locationHint: data.text("locationHint", "Village or town, and the nearest destination"),
                        roomsLabel: data.text("roomsLabel", "Bedrooms"),
                        roomsHint: data.text("roomsHint", "With attached bathrooms"),
                        photosLabel: data.text("photosLabel", "Link to photos"),
                        photosHint: data.text("photosHint", "Google Drive, Google Photos or Instagram. Optional, but it helps."),
                        noteLabel: data.text("noteLabel", "Anything else we should know?"),
                      }}
                    />
                  </div>
                </div>
              </section>
            );
          default:
            return <Fragment key={s.key} />;
        }
      })}
    </>
  );
}
