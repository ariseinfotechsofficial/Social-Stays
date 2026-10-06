import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { destinations } from "@/data/destinations";
import { photo } from "@/data/photos";
import { startingPrice, villasIn } from "@/data/villas";
import { formatDriveTime, formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Weekend destinations near Indore: Jaam Gate, Mandu, Omkareshwar, Ujjain",
  description:
    "Four weekend destinations within 2½ hours of Indore, each with private villas and farmhouses. Drive times, things to do and where to stay.",
  alternates: { canonical: "/destinations" },
};

export default function DestinationsPage() {
  const sorted = [...destinations].sort((a, b) => a.driveMinutes - b.driveMinutes);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Destinations", href: "/destinations" }]}
        title="Four places, one easy drive"
        intro="A ridge above the Narmada, a plateau of Afghan palaces, a temple island and one of India's oldest cities. All between one and two and a half hours from Indore."
      />

      <section className="container-page pb-16 lg:pb-24">
        <ul className="space-y-12 lg:space-y-16">
          {sorted.map((d, i) => {
            const p = photo(d.hero);
            const count = villasIn(d.slug).filter((v) => v.status === "live").length;
            return (
              <li key={d.slug} className="grid items-center gap-6 md:grid-cols-2 md:gap-10 lg:gap-16">
                <Link
                  href={`/destinations/${d.slug}`}
                  className={`group relative block aspect-[3/2] overflow-hidden rounded-photo bg-sand-deep ${i % 2 ? "md:order-2" : ""}`}
                >
                  <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.04]" />
                </Link>
                <div>
                  <p className="text-[0.9375rem] font-semibold text-gold-deep">
                    {formatDriveTime(d.driveMinutes)} from Indore, {d.distanceKm} km
                  </p>
                  <h2 className="type-display-l mt-2">
                    <Link href={`/destinations/${d.slug}`} className="hover:text-gold">
                      {d.name}
                    </Link>
                  </h2>
                  <p className="mt-1 font-display-italic text-[1.25rem] text-ink-soft">{d.tagline}</p>
                  <p className="measure mt-4 leading-relaxed text-ink-soft">{d.intro[0]}</p>
                  <p className="mt-4 font-medium">
                    {count} {count === 1 ? "villa" : "villas"} from {formatINR(startingPrice(d.slug))} a night
                  </p>
                  <Link href={`/destinations/${d.slug}`} className="link-draw mt-4 inline-block font-semibold text-gold-deep">
                    Stays and things to do in {d.name}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
