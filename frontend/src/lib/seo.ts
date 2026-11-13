import type { Metadata } from "next";
import type { Content, Photo, Seo } from "@/data/types";

type Fallback = { title?: string; description?: string; path: string; image?: Photo | null; noindex?: boolean };

/**
 * Metadata from an item's SEO fields (set in the admin), falling back to the given defaults
 * and then to the site-wide SEO settings.
 */
export function buildMetadata(c: Content, seo: Partial<Seo> | null | undefined, fallback: Fallback): Metadata {
  const title = seo?.title || fallback.title;
  const description = seo?.description || fallback.description || c.settings.seo.description;
  const image = seo?.ogImage ?? fallback.image ?? null;
  const noindex = Boolean(seo?.noindex || fallback.noindex);
  return {
    ...(title ? { title } : {}),
    description,
    ...(seo?.keywords?.length ? { keywords: seo.keywords } : {}),
    alternates: { canonical: fallback.path },
    openGraph: {
      ...(title ? { title } : {}),
      description,
      ...(image ? { images: [{ url: image.src, width: image.width || undefined, height: image.height || undefined, alt: image.alt }] } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
