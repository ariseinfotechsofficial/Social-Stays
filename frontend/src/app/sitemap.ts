import type { MetadataRoute } from "next";
import { destinations } from "@/data/destinations";
import { policies } from "@/data/policies";
import { villas } from "@/data/villas";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page("/", 1, "weekly"),
    page("/villas", 0.9, "weekly"),
    ...villas.map((v) => page(`/villas/${v.slug}`, v.status === "live" ? 0.9 : 0.5, "weekly")),
    page("/destinations", 0.7),
    ...destinations.map((d) => page(`/destinations/${d.slug}`, 0.8)),
    page("/experiences", 0.6),
    page("/celebrations", 0.8),
    page("/owners", 0.5),
    page("/about", 0.4),
    page("/faq", 0.5),
    page("/contact", 0.5),
    ...policies.map((p) => page(`/policies/${p.slug}`, 0.2, "yearly")),
  ];
}
