import { AMENITY_ICONS } from "@admin/lib/icons";
import { formatINR } from "@admin/lib/utils";
import { PublishBadge, TitleCell, idsFor, name, seoSection, statusField } from "./common";
import type { ResourceConfig } from "./types";

export const destinations: ResourceConfig = {
  key: "destinations",
  endpoint: "/admin/destinations",
  title: "Destinations",
  singular: "Destination",
  description: "Each destination has its own SEO landing page with things to do, FAQs and its villas.",
  perms: ["catalog"],
  searchable: true,
  sortable: true,
  duplicable: true,
  columns: [
    { label: "Destination", className: "minmax(0,2fr)", render: (d) => <TitleCell title={String(d.name)} sub={String(d.tagline ?? "")} img={(d.card ?? d.hero) as never} /> },
    { label: "From Indore", render: (d) => <span className="text-ink-soft">{d.distanceKm ? `${d.distanceKm} km` : "—"}</span> },
    { label: "Status", render: (d) => <PublishBadge status={d.status} /> },
  ],
  defaults: { status: "draft", name: "", slug: "", intro: [""], thingsToDo: [], faqs: [], coordinates: { lat: 22.72, lng: 75.86 }, seo: {} },
  titleOf: name,
  viewUrl: (d) => (d.slug && d.status === "published" ? `/destinations/${d.slug}` : null),
  tabs: [
    {
      key: "basics",
      label: "Basics",
      sections: [
        {
          title: "Destination",
          fields: [
            { name: "name", label: "Name", type: "text", width: "half" },
            { name: "slug", label: "Web address", type: "slug", from: "name", prefix: "/destinations/", width: "half" },
            { name: "tagline", label: "Tagline", type: "text", width: "two-thirds" },
            statusField,
            { name: "district", label: "District", type: "text", width: "half" },
            { name: "route", label: "Route", type: "text", width: "half" },
            { name: "driveMinutes", label: "Drive from Indore", type: "number", suffix: "min", width: "third" },
            { name: "distanceKm", label: "Distance", type: "number", suffix: "km", width: "third" },
            { name: "bestTime", label: "Best time to visit", type: "textarea", rows: 2 },
          ],
        },
        { title: "Introduction", fields: [{ name: "intro", label: "Paragraphs", type: "strings", itemLabel: "paragraph", rows: 4 }] },
        {
          title: "Photos",
          fields: [
            { name: "hero", label: "Top of page photo", type: "image", folder: "destinations" },
            { name: "card", label: "Card photo (home and lists)", type: "image", folder: "destinations" },
          ],
        },
        {
          title: "Map",
          fields: [
            { name: "coordinates.lat", label: "Latitude", type: "number", step: 0.0001, width: "third" },
            { name: "coordinates.lng", label: "Longitude", type: "number", step: 0.0001, width: "third" },
          ],
        },
      ],
    },
    {
      key: "things",
      label: "Things to do",
      sections: [
        {
          title: "Things to do",
          fields: [
            {
              name: "thingsToDo",
              label: "Things to do",
              type: "list",
              itemLabel: "Thing to do",
              fields: [
                { name: "title", label: "Title", type: "text", width: "two-thirds" },
                { name: "time", label: "Time needed", type: "text", width: "third" },
                { name: "description", label: "Description", type: "textarea", rows: 3 },
                { name: "photo", label: "Photo", type: "image", folder: "destinations" },
              ],
            },
          ],
        },
      ],
    },
    {
      key: "faqs",
      label: "FAQs",
      sections: [{ title: "FAQs", description: "Also added to Google as FAQ results.", fields: [{ name: "faqs", label: "Questions", type: "list", itemLabel: "Question", titleKey: "q", fields: [{ name: "q", label: "Question", type: "text" }, { name: "a", label: "Answer", type: "textarea", rows: 3 }] }] }],
    },
    { key: "seo", label: "SEO", sections: [seoSection()] },
  ],
};

export const experiences: ResourceConfig = {
  key: "experiences",
  endpoint: "/admin/experiences",
  title: "Experiences",
  singular: "Experience",
  description: "Add-ons guests can ask for or add at checkout: meals, bonfires, décor and more.",
  perms: ["catalog"],
  searchable: true,
  sortable: true,
  duplicable: true,
  columns: [
    { label: "Experience", className: "minmax(0,2fr)", render: (d) => <TitleCell title={String(d.title)} sub={String(d.summary ?? "")} img={(d.photo as never) ?? null} /> },
    {
      label: "Price",
      render: (d) => {
        const p = d.price as { amount?: number; unit?: string; from?: boolean };
        return <span className="tabular-nums">{`${p?.from ? "From " : ""}${formatINR(p?.amount)} ${p?.unit ?? ""}`}</span>;
      },
    },
    { label: "Status", render: (d) => <PublishBadge status={d.status} /> },
  ],
  defaults: { status: "draft", title: "", slug: "", price: { amount: 0, unit: "per person", from: false }, includes: [], availableAt: [] },
  titleOf: (d) => String(d.title ?? ""),
  viewUrl: (d) => (d.status === "published" ? `/experiences#${d.slug}` : null),
  sections: [
    {
      title: "Experience",
      fields: [
        { name: "title", label: "Title", type: "text", width: "half" },
        { name: "slug", label: "Web id", type: "slug", from: "title", width: "third" },
        statusField,
        { name: "summary", label: "Short summary", type: "textarea", rows: 2, help: "Used on cards" },
        { name: "description", label: "Description", type: "textarea", rows: 4 },
        { name: "includes", label: "What's included", type: "strings", itemLabel: "line" },
        { name: "photo", label: "Photo", type: "image", folder: "experiences" },
      ],
    },
    {
      title: "Price",
      description: "The price shown on the website.",
      fields: [
        { name: "price.amount", label: "Amount", type: "money", width: "third" },
        { name: "price.unit", label: "Unit", type: "text", width: "third", help: "e.g. per person, per set-up" },
        { name: "price.from", label: 'Show as "From"', type: "boolean", width: "third" },
      ],
    },
    {
      title: "Where it's offered",
      description: "Leave empty for every destination.",
      fields: [{ name: "availableAt", label: "Destinations", type: "ref", endpoint: "/admin/destinations", labelKey: "name", multiple: true }],
    },
  ],
};

export const categories: ResourceConfig = {
  key: "categories",
  endpoint: "/admin/categories",
  title: "Villa categories",
  singular: "Category",
  description: "Groups on the home page and the villas filter, e.g. Luxury Stays and Budget Stays.",
  perms: ["catalog"],
  sortable: true,
  columns: [
    { label: "Category", render: (d) => <TitleCell title={String(d.label)} sub={String(d.blurb ?? "")} /> },
    { label: "Filter label", render: (d) => <span className="text-ink-soft">{String(d.short ?? "")}</span> },
  ],
  defaults: { label: "", short: "", blurb: "", slug: "" },
  titleOf: (d) => String(d.label ?? ""),
  sections: [
    {
      title: "Category",
      fields: [
        { name: "label", label: "Name", type: "text", width: "half", help: "e.g. Luxury Stays" },
        { name: "short", label: "Short name", type: "text", width: "third", help: "On filter chips, e.g. Luxury" },
        { name: "slug", label: "Link id", type: "slug", from: "label", width: "third", help: "Used in /villas?category=…" },
        { name: "blurb", label: "One-line description", type: "textarea", rows: 2 },
      ],
    },
  ],
};

export const amenities: ResourceConfig = {
  key: "amenities",
  endpoint: "/admin/amenities",
  title: "Amenities",
  singular: "Amenity",
  description: "The list villas pick from, each with an icon. Drag to set the order on villa pages.",
  perms: ["catalog"],
  sortable: true,
  searchable: true,
  columns: [
    {
      label: "Amenity",
      render: (d) => {
        const Icon = AMENITY_ICONS[String(d.icon)] ?? AMENITY_ICONS.Check;
        return (
          <span className="flex items-center gap-3 font-semibold">
            <Icon weight="light" className="size-6 text-gold" /> {String(d.label)}
          </span>
        );
      },
    },
    { label: "Key", render: (d) => <span className="font-mono text-[0.8125rem] text-ink-soft">{String(d.key)}</span> },
  ],
  defaults: { label: "", key: "", icon: "Check" },
  titleOf: (d) => String(d.label ?? ""),
  sections: [
    {
      title: "Amenity",
      fields: [
        { name: "label", label: "Label", type: "text", width: "half" },
        { name: "key", label: "Key", type: "slug", from: "label", width: "third" },
        { name: "icon", label: "Icon", type: "icon" },
      ],
    },
  ],
};

export const occasions: ResourceConfig = {
  key: "occasions",
  endpoint: "/admin/occasions",
  title: "Occasions",
  singular: "Occasion",
  description: "Birthdays, anniversaries and other reasons people book, linked to suitable villas.",
  perms: ["catalog"],
  sortable: true,
  columns: [
    { label: "Occasion", className: "minmax(0,2fr)", render: (d) => <TitleCell title={String(d.title)} sub={String(d.summary ?? "")} img={(d.photo as never) ?? null} /> },
    { label: "Status", render: (d) => <PublishBadge status={d.status} /> },
  ],
  defaults: { status: "published", title: "", slug: "", ideas: [], villas: [] },
  titleOf: (d) => String(d.title ?? ""),
  toForm: (d) => idsFor(d, ["villas"]),
  sections: [
    {
      title: "Occasion",
      fields: [
        { name: "title", label: "Title", type: "text", width: "half" },
        { name: "slug", label: "Web id", type: "slug", from: "title", width: "third" },
        statusField,
        { name: "heading", label: "Heading", type: "text" },
        { name: "summary", label: "Summary", type: "textarea", rows: 2 },
        { name: "description", label: "Description", type: "textarea", rows: 4 },
        { name: "ideas", label: "Ideas", type: "strings", itemLabel: "idea" },
        { name: "groupSize", label: "Group size", type: "text", width: "half" },
        { name: "enquiryOccasion", label: "Pre-selected in the enquiry form as", type: "text", width: "half" },
        { name: "photo", label: "Photo", type: "image", folder: "occasions" },
        { name: "villas", label: "Suitable villas", type: "ref", endpoint: "/admin/villas", labelKey: "name", multiple: true },
      ],
    },
  ],
};
