import type { Metadata } from "next";
import { OwnerForm } from "@/components/forms/OwnerForm";
import { WhatsAppLink } from "@/components/layout/ContactLinks";
import { RevealImage } from "@/components/motion/Reveal";
import { PageHero } from "@/components/shared/PageHero";
import { buttonClasses } from "@/components/ui/Button";
import { ownerBenefits, ownerCriteria, ownerSteps } from "@/data/company";
import { photo } from "@/data/photos";

export const metadata: Metadata = {
  title: "List your villa or farmhouse near Indore",
  description:
    "Own a villa or farmhouse within 2½ hours of Indore? Partner with Social Stays for photography, listing, vetted guests and monthly payouts. You keep control of your calendar.",
  alternates: { canonical: "/owners" },
};

export default function OwnersPage() {
  return (
    <>
      <PageHero
        photo={photo("site/owners-hero")}
        title="Your villa, looked after and booked"
        intro="We partner with families who own villas and farmhouses around Indore. You keep your home and your weekends; we bring the right guests."
      >
        <a href="#partner-form" className={buttonClasses("light", "lg")}>
          Tell us about your property
        </a>
      </PageHero>

      <section className="section-y">
        <div className="container-page">
          <h2 className="type-display-l max-w-[18ch]">What partnering with us looks like</h2>
          <ul className="stack-head grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {ownerBenefits.map((b) => (
              <li key={b.title} className="border-t border-line pt-5">
                <h3 className="font-display text-[1.5rem] leading-snug font-medium">{b.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{b.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="section-y scroll-mt-24 bg-sand">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <h2 className="type-display-l">How partnership works</h2>
            <ol className="mt-7">
              {ownerSteps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-ink/15 py-4.5 last:border-b">
                  <span className="font-display text-[1.75rem] leading-none font-medium text-gold-deep lining-nums">{i + 1}</span>
                  <div>
                    <h3 className="font-sans text-[1.0625rem] font-semibold">{s.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-ink-soft">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <RevealImage photo={photo("villas/palash-farm/03")} sizes="(min-width: 1024px) 45vw, 100vw" className="aspect-[4/3] w-full" />
            <h3 className="mt-7 font-display text-[1.5rem] font-medium">What we look for</h3>
            <ul className="mt-3 grid gap-x-8 gap-y-2 text-[0.9375rem] text-ink-soft sm:grid-cols-2">
              {ownerCriteria.map((c) => (
                <li key={c} className="relative pl-6 before:absolute before:top-[0.7em] before:left-0 before:h-px before:w-3 before:bg-brass">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="partner-form" className="section-y scroll-mt-20 bg-ink text-sand">
        <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-16">
          <div>
            <h2 className="type-display-l max-w-[14ch] text-white">Tell us about your property</h2>
            <p className="type-lead mt-4 max-w-sm text-sand/80">
              A few details and a link to some photos is enough. We reply within two working days.
            </p>
            <p className="mt-6 text-sand/80">
              Prefer to talk first?{" "}
              <WhatsAppLink
                placement="owners_page"
                message="Hello Social Stays, I own a property near Indore and would like to know about partnering with you."
                className="font-semibold text-brass underline underline-offset-4"
              >
                Message us on WhatsApp
              </WhatsAppLink>
            </p>
          </div>
          <div className="text-ink">
            <OwnerForm />
          </div>
        </div>
      </section>
    </>
  );
}
