import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { fill, getContent, shared } from "@/lib/content";

/** Dark band inviting villa owners to partner. Content is edited under Pages → Shared blocks. */
export async function OwnerBand() {
  const data = shared(await getContent(), "ownerBand");
  const p = data.photo("image");
  return (
    <section className="bg-ink text-sand">
      <div className="container-page grid items-stretch gap-0 lg:grid-cols-2">
        <div className="relative -mx-5 aspect-[16/10] md:-mx-8 lg:mx-0 lg:aspect-auto lg:min-h-[26rem]">
          {p && <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />}
        </div>
        <div className="flex flex-col justify-center py-12 lg:py-16 lg:pl-16 xl:pl-20">
          <h2 className="type-display-l max-w-[18ch] text-white">{data.text("title")}</h2>
          {data.text("body") && <p className="type-lead mt-5 max-w-lg text-sand/80">{data.text("body")}</p>}
          <div className="mt-8 flex flex-wrap items-center gap-6">
            {data.text("primaryLabel") && (
              <ButtonLink href={data.text("primaryHref", "/owners")} variant="light" size="lg">
                {data.text("primaryLabel")}
              </ButtonLink>
            )}
            {data.text("secondaryLabel") && (
              <Link href={data.text("secondaryHref", "/owners#how-it-works")} className="link-draw text-[0.9375rem] font-semibold text-brass">
                {data.text("secondaryLabel")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Instagram block from the brief: a photo grid that links to the profile set in Settings. */
export async function InstagramStrip() {
  const c = await getContent();
  const data = shared(c, "instagram");
  const { instagramUrl: url, instagramHandle: handle } = c.settings.social;
  const photos = data.list<{ src: string; alt: string }>("images").filter((p) => p?.src);
  if (!url || !photos.length) return null;
  return (
    <section className="section-y">
      <div className="container-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="type-display-m">{data.text("title")}</h2>
          <a href={url} target="_blank" rel="noopener noreferrer" className="link-draw text-[0.9375rem] font-semibold text-gold-deep">
            {fill(data.text("linkLabel", "Follow @{handle}"), { handle })}
          </a>
        </div>
        <ul className="mt-7 grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
          {photos.map((p, i) => (
            <li key={`${p.src}-${i}`}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden rounded-photo bg-sand-deep">
                <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 16vw, 33vw" className="object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.06]" />
                <span className="sr-only">Open Instagram</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
