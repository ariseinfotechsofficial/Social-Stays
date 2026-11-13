import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { settings } = await getContent();
  // "Hide the whole site from search" in Settings → SEO (useful before launch)
  if (settings.seo.noindex) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/booking/", "/admin"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
