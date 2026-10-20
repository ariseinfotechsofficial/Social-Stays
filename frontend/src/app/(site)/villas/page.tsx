import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { JsonLd } from "@/components/shared/JsonLd";
import { VillaBrowser } from "@/components/villa/VillaBrowser";
import { VillaCard } from "@/components/villa/VillaCard";
import { villaCategories, villas } from "@/data/villas";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Villas & farmhouses near Indore with private pools",
  description:
    "Browse private villas and farmhouses near Indore in Jaam Gate, Mandu, Omkareshwar and Ujjain. Filter by luxury or budget, private pool, group size and pet-friendly. Whole-villa stays from ₹14,500 a night.",
  alternates: { canonical: "/villas" },
};

export default function VillasPage() {
  const cards = Object.fromEntries(villas.map((v, i) => [v.slug, <VillaCard key={v.slug} villa={v} ratio="landscape" detailed priority={i === 0} />]));

  return (
    <>
      <div className="container-page pt-26 lg:pt-30">
        <Breadcrumbs items={[{ label: "Stays", href: "/villas" }]} />
      </div>

      <VillaBrowser
        villas={villas}
        categories={villaCategories}
        heading="Our villas"
        intro="Booked whole, for your group only. Prices are per night for the entire property; meals and set-ups are added to your quote."
      >
        {cards}
      </VillaBrowser>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Social Stays villas",
          itemListElement: villas.map((v, i) => ({ "@type": "ListItem", position: i + 1, url: `${site.url}/villas/${v.slug}`, name: v.name })),
        }}
      />
    </>
  );
}
