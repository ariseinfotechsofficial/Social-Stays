import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { destinations } from "@/data/destinations";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col bg-sand">
      <div className="container-page flex h-20 items-center">
        <Link href="/" aria-label="Social Stays, home">
          <Logo />
        </Link>
      </div>
      <div className="container-page flex flex-1 flex-col justify-center py-20">
        <p className="font-semibold text-gold-deep">Page not found</p>
        <h1 className="type-display-xl mt-4 max-w-[14ch]">This road doesn&apos;t lead to a villa</h1>
        <p className="type-lead mt-6 max-w-lg text-ink-soft">
          The page may have moved, or the link has a typo. Start from the villas, or pick a destination.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
          <ButtonLink href="/villas" size="lg">
            Browse villas
          </ButtonLink>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {destinations.map((d) => (
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
