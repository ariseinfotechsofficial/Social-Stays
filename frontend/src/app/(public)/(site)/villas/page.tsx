import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { JsonLd } from "@/components/shared/JsonLd";
import { VillaBrowser } from "@/components/villa/VillaBrowser";
import { VillaCard } from "@/components/villa/VillaCard";
import { getContent, getPage, labels } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return buildMetadata(c, getPage(c, "villas").seo, { path: "/villas", title: "Villas & farmhouses near Indore" });
}

export default async function VillasPage() {
  const c = await getContent();
  const { villas } = c;
  const h = labels(c, "villas", "header");
  const cards = Object.fromEntries(villas.map((v, i) => [v.slug, <VillaCard key={v.slug} villa={v} ratio="landscape" detailed priority={i === 0} />]));

  return (
    <>
      <div className="container-page pt-26 lg:pt-30">
        <Breadcrumbs items={[{ label: c.settings.header.nav.find((n) => n.href === "/villas")?.label ?? "Stays", href: "/villas" }]} />
      </div>

      <VillaBrowser
        villas={villas}
        categories={c.categories}
        heading={h.text("title", "Our villas")}
        intro={h.text("intro")}
        labels={{
          allLabel: h.text("allLabel", "All"),
          poolLabel: h.text("poolLabel", "Private pool"),
          groupLabel: h.text("groupLabel", "{n}+ guests"),
          groupSize: h.num("groupSize", 12),
          petsLabel: h.text("petsLabel", "Pet friendly"),
          emptyTitle: h.text("emptyTitle", "No villa matches all of that yet."),
          emptyBody: h.text("emptyBody"),
          emptyReset: h.text("emptyReset", "Show all villas"),
        }}
      >
        {cards}
      </VillaBrowser>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${c.settings.brand.name} villas`,
          itemListElement: villas.map((v, i) => ({ "@type": "ListItem", position: i + 1, url: `${siteUrl}/villas/${v.slug}`, name: v.name })),
        }}
      />
    </>
  );
}
