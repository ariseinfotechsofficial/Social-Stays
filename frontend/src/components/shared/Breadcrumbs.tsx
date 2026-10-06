import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { JsonLd } from "@/components/shared/JsonLd";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href: string };

export function Breadcrumbs({ items, className, tone = "dark" }: { items: Crumb[]; className?: string; tone?: "dark" | "light" }) {
  const all = [{ label: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("text-[0.875rem]", tone === "light" ? "text-white/80" : "text-ink-soft", className)}>
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((c, i) => (
            <li key={c.href} className="flex items-center gap-1.5">
              {i > 0 && <CaretRightIcon aria-hidden className="size-3 opacity-60" />}
              {i === all.length - 1 ? (
                <span aria-current="page" className={tone === "light" ? "text-white" : "text-ink"}>
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="hover:underline hover:underline-offset-4">
                  {c.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: `${site.url}${c.href}` })),
        }}
      />
    </>
  );
}
