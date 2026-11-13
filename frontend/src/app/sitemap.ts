import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const c = await getContent();
  const now = new Date(c.generatedAt);
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly", lastModified: Date | string = now) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  });
  // Pages switched to "hide from search" in the admin stay out of the sitemap too
  const indexed = (key: string) => !c.pages[key]?.seo.noindex;

  return [
    page("/", 1, "weekly"),
    ...(indexed("villas") ? [page("/villas", 0.9, "weekly")] : []),
    ...c.villas.filter((v) => !v.seo.noindex).map((v) => page(`/villas/${v.slug}`, v.status === "live" ? 0.9 : 0.5, "weekly", v.updatedAt ?? now)),
    ...(indexed("destinations") ? [page("/destinations", 0.7)] : []),
    ...c.destinations.filter((d) => !d.seo.noindex).map((d) => page(`/destinations/${d.slug}`, 0.8, "monthly", d.updatedAt ?? now)),
    ...(["experiences", "owners", "about", "faq", "contact"] as const).filter(indexed).map((k) => page(`/${k}`, k === "experiences" ? 0.6 : k === "about" ? 0.4 : 0.5)),
    ...c.policies.filter((p) => !p.seo.noindex).map((p) => page(`/policies/${p.slug}`, 0.2, "yearly")),
    ...c.landingPages.filter((l) => !l.seo.noindex).map((l) => page(`/lp/${l.slug}`, 0.3)),
  ];
}
