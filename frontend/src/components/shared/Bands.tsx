import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { photo } from "@/data/photos";
import { site } from "@/lib/site";

/** Dark band inviting villa owners to partner. Used on the home page and About. */
export function OwnerBand() {
  const p = photo("site/owners-hero");
  return (
    <section className="bg-ink text-sand">
      <div className="container-page grid items-stretch gap-0 lg:grid-cols-2">
        <div className="relative -mx-5 aspect-[16/10] md:-mx-8 lg:mx-0 lg:aspect-auto lg:min-h-[26rem]">
          <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col justify-center py-12 lg:py-16 lg:pl-16 xl:pl-20">
          <h2 className="type-display-l max-w-[18ch] text-white">Own a villa or farmhouse near Indore?</h2>
          <p className="type-lead mt-5 max-w-lg text-sand/80">
            We look after the photography, the listing, the guests and the bookings. You keep your home, your calendar and
            your weekends when you want them.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <ButtonLink href="/owners" variant="light" size="lg">
              Partner with us
            </ButtonLink>
            <Link href="/owners#how-it-works" className="link-draw text-[0.9375rem] font-semibold text-brass">
              How partnership works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const grid = [
  "villas/sunset-ridge/01",
  "experiences/thali",
  "villas/baobab-house/02",
  "occasions/birthday",
  "destinations/omkareshwar/boats",
  "villas/palash-farm/07",
] as const;

/** Instagram block from the brief: a photo grid that links to the profile. */
export function InstagramStrip() {
  return (
    <section className="section-y">
      <div className="container-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="type-display-m">
            Weekends at our villas, on Instagram
          </h2>
          <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="link-draw text-[0.9375rem] font-semibold text-gold-deep">
            Follow @{site.instagram.handle}
          </a>
        </div>
        <ul className="mt-7 grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
          {grid.map((key) => {
            const p = photo(key);
            return (
              <li key={key}>
                <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden rounded-photo bg-sand-deep">
                  <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 16vw, 33vw" className="object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.06]" />
                  <span className="sr-only">Open Instagram</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
