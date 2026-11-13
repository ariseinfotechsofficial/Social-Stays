import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { getContent, labels } from "@/lib/content";

export default async function NotFound() {
  const c = await getContent();
  const t = labels(c, "not-found", "content");
  return (
    <main className="flex min-h-svh flex-col bg-sand">
      <div className="container-page flex h-20 items-center">
        <Link href="/" aria-label={`${c.settings.brand.name}, home`}>
          <Logo />
        </Link>
      </div>
      <div className="container-page flex flex-1 flex-col justify-center py-20">
        <p className="font-semibold text-gold-deep">{t.text("eyebrow", "Page not found")}</p>
        <h1 className="type-display-xl mt-4 max-w-[14ch]">{t.text("title", "This road doesn't lead to a villa")}</h1>
        {t.text("body") && <p className="type-lead mt-6 max-w-lg text-ink-soft">{t.text("body")}</p>}
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
          <ButtonLink href={t.text("primaryHref", "/villas")} size="lg">
            {t.text("primaryLabel", "Browse villas")}
          </ButtonLink>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {c.destinations.map((d) => (
              <li key={d.slug}>
                <Link href={`/destinations/${d.slug}`} className="link-draw font-semibold text-gold-deep">
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
