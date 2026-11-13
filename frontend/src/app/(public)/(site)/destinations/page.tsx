import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { destinationsByDrive, fill, getContent, getPage, labels, startingPrice, villasIn } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { formatDriveTime, formatINR } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return buildMetadata(c, getPage(c, "destinations").seo, { path: "/destinations", title: "Weekend destinations near Indore" });
}

export default async function DestinationsPage() {
  const c = await getContent();
  const header = labels(c, "destinations", "header");
  const list = labels(c, "destinations", "list");

  return (
    <>
      <PageHeader crumbs={[{ label: "Destinations", href: "/destinations" }]} title={header.text("title")} intro={header.text("intro")} />

      <section className="container-page pb-16 lg:pb-24">
        <ul className="space-y-12 lg:space-y-16">
          {destinationsByDrive(c).map((d, i) => {
            const p = d.hero ?? d.card;
            const count = villasIn(c, d.slug).filter((v) => v.status === "live").length;
            const from = startingPrice(c, d.slug);
            return (
              <li key={d.slug} className="grid items-center gap-6 md:grid-cols-2 md:gap-10 lg:gap-16">
                <Link href={`/destinations/${d.slug}`} className={`group relative block aspect-[3/2] overflow-hidden rounded-photo bg-sand-deep ${i % 2 ? "md:order-2" : ""}`}>
                  {p && <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.04]" />}
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
                  {d.tagline && <p className="mt-1 font-display-italic text-[1.25rem] text-ink-soft">{d.tagline}</p>}
                  {d.intro[0] && <p className="measure mt-4 leading-relaxed text-ink-soft">{d.intro[0]}</p>}
                  {count > 0 && (
                    <p className="mt-4 font-medium">
                      {count} {count === 1 ? "villa" : "villas"} from {formatINR(from)} a night
                    </p>
                  )}
                  <Link href={`/destinations/${d.slug}`} className="link-draw mt-4 inline-block font-semibold text-gold-deep">
                    {fill(list.text("linkLabel", "Stays and things to do in {name}"), { name: d.name })}
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
