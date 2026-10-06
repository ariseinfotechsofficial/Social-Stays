import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { JsonLd } from "@/components/shared/JsonLd";
import { VillaBrowser } from "@/components/villa/VillaBrowser";
import { VillaCard } from "@/components/villa/VillaCard";
import { destinations } from "@/data/destinations";
import { villas } from "@/data/villas";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Villas & farmhouses near Indore with private pools",
  description:
    "Browse private villas and farmhouses near Indore in Jaam Gate, Mandu, Omkareshwar and Ujjain. Filter by guests, private pool and pet-friendly. Whole-villa stays from ₹14,500 a night.",
  alternates: { canonical: "/villas" },
};

export default function VillasPage() {
  const cards = Object.fromEntries(villas.map((v) => [v.slug, <VillaCard key={v.slug} villa={v} ratio="landscape" />]));

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Villas", href: "/villas" }]}
        title="Villas & farmhouses near Indore"
        intro="Every villa is booked whole, for your group only. Prices are per night for the entire property; meals and set-ups are added to your quote."
      />

      <VillaBrowser villas={villas} destinations={destinations.map((d) => ({ slug: d.slug, name: d.name }))}>
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
