import Link from "next/link";
import { RevealImage } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { occasions } from "@/data/occasions";
import { photo } from "@/data/photos";

export function CelebrationBand() {
  return (
    <section className="section-y">
      <div className="container-page grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16 xl:gap-20">
        {/* Two photos, the smaller one dropped half a step for an editorial offset */}
        <div className="grid grid-cols-[1.35fr_1fr] items-start gap-3 sm:gap-4">
          <RevealImage photo={photo("occasions/anniversary")} sizes="(min-width: 1024px) 30vw, 58vw" className="aspect-[4/5]" />
          <RevealImage photo={photo("occasions/haldi")} sizes="(min-width: 1024px) 22vw, 40vw" className="mt-[18%] aspect-[4/5]" delay={0.15} />
        </div>
        <div>
          <h2 className="type-display-l">Celebrations, at home</h2>
          <p className="type-lead mt-5 max-w-lg text-ink-soft">
            Birthdays with three generations, anniversaries for two, haldis on the lawn and team weekends. We arrange the
            décor, food and music so you can be a guest at your own party.
          </p>
          <ul className="mt-7 border-t border-line">
            {occasions.map((o) => (
              <li key={o.slug} className="border-b border-line">
                <Link href={`/celebrations#${o.slug}`} className="group flex items-baseline justify-between gap-6 py-3.5">
                  <span className="font-display text-[1.375rem] font-medium transition-colors group-hover:text-gold">{o.title}</span>
                  <span className="text-[0.875rem] text-ink-soft">{o.groupSize}</span>
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href="/celebrations" size="lg" className="mt-8">
            Plan a celebration
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
