import type { FieldDef } from "@admin/components/fields/types";
import { Badge } from "@admin/components/ui/feedback";
import { formatINR } from "@admin/lib/utils";
import { TitleCell, idsFor, seoSection } from "./common";
import type { ResourceConfig } from "./types";

const VILLA_STATUS = [
  { value: "live", label: "Live" },
  { value: "coming-soon", label: "Coming soon" },
  { value: "draft", label: "Draft (hidden)" },
  { value: "archived", label: "Archived (hidden)" },
];

const statusTone = { live: "success", "coming-soon": "info", draft: "neutral", archived: "neutral" } as const;

const f = (defs: FieldDef[]) => defs;

export const villas: ResourceConfig = {
  key: "villas",
  endpoint: "/admin/villas",
  title: "Villas",
  singular: "Villa",
  description: "Every villa on the website, with photos, prices, rooms and house rules. Drag to set the order on the website.",
  perms: ["catalog"],
  searchable: true,
  sortable: true,
  filters: [{ name: "status", label: "Status", options: VILLA_STATUS }],
  duplicable: true,
  columns: [
    {
      label: "Villa",
      className: "minmax(0,2.2fr)",
      render: (d) => <TitleCell title={String(d.name)} sub={String((d.destination as { name?: string })?.name ?? "")} img={(d.photos as never[])?.[0] ?? null} />,
    },
    { label: "Category", render: (d) => <span className="text-ink-soft">{(d.category as { label?: string })?.label ?? "—"}</span> },
    { label: "From", render: (d) => <span className="tabular-nums">{formatINR(d.priceFrom as number)}</span> },
    { label: "Status", render: (d) => <Badge tone={statusTone[d.status as keyof typeof statusTone] ?? "neutral"}>{VILLA_STATUS.find((s) => s.value === d.status)?.label.replace(/ \(.*\)/, "")}</Badge> },
  ],
  defaults: {
    status: "draft",
    name: "",
    slug: "",
    description: [""],
    guests: { base: 6, max: 10 },
    bedrooms: 3,
    bathrooms: 3,
    priceFrom: 0,
    weekendPrice: 0,
    minNights: 1,
    checkIn: "1:00 pm",
    checkOut: "11:00 am",
    securityDeposit: 0,
    photos: [],
    highlights: [],
    amenities: [],
    rooms: [],
    houseRules: [],
    occasions: [],
    location: { area: "", lat: 22.72, lng: 75.86, fromIndore: "" },
    host: { name: "", note: "" },
    rating: { score: 0, count: 0 },
    seo: {},
  },
  titleOf: (d) => String(d.name ?? ""),
  viewUrl: (d) => (d.slug && (d.status === "live" || d.status === "coming-soon") ? `/villas/${d.slug}` : null),
  toForm: (d) => idsFor(d, ["destination", "category", "owner", "amenities", "occasions"]),
  tabs: [
    {
      key: "basics",
      label: "Basics",
      sections: [
        {
          title: "Villa",
          description: "Name, where it is, and whether it shows on the website.",
          fields: f([
            { name: "name", label: "Villa name", type: "text", width: "half", required: true },
            { name: "slug", label: "Web address", type: "slug", from: "name", prefix: "/villas/", width: "half", help: "Changing it breaks old links; add a redirect if you do." },
            { name: "destination", label: "Destination", type: "ref", endpoint: "/admin/destinations", labelKey: "name", width: "third" },
            { name: "category", label: "Category", type: "ref", endpoint: "/admin/categories", labelKey: "label", width: "third" },
            { name: "status", label: "Status", type: "select", options: VILLA_STATUS, width: "third" },
            { name: "badge", label: "Badge on photo", type: "text", width: "third", help: "Optional, e.g. Signature, New" },
            { name: "openingNote", label: "Opening note", type: "text", width: "two-thirds", help: "For coming-soon villas, e.g. Opening December 2026", showIf: (v) => v.status === "coming-soon" },
          ]),
        },
        {
          title: "Description",
          description: "The tagline sits under the name; the summary is used on cards.",
          fields: f([
            { name: "tagline", label: "Tagline", type: "text" },
            { name: "summary", label: "Card summary", type: "textarea", rows: 2, help: "About 20 words" },
            { name: "description", label: "Description paragraphs", type: "strings", itemLabel: "paragraph", rows: 4, help: "The first paragraph appears beside the photos." },
            { name: "highlights", label: "Highlights", type: "strings", itemLabel: "highlight", help: "Three short highlights work best." },
          ]),
        },
      ],
    },
    {
      key: "photos",
      label: "Photos",
      sections: [{ title: "Gallery", description: "Drag to reorder. The first photo is the cover on cards and the top of the page.", fields: f([{ name: "photos", label: "Photos", type: "images", folder: "villas" }]) }],
    },
    {
      key: "rooms",
      label: "Rooms & amenities",
      sections: [
        {
          title: "Size",
          fields: f([
            { name: "bedrooms", label: "Bedrooms", type: "number", min: 0, width: "third" },
            { name: "bathrooms", label: "Bathrooms", type: "number", min: 0, width: "third" },
            { name: "guests.base", label: "Guests in base price", type: "number", min: 1, width: "third" },
            { name: "guests.max", label: "Maximum guests", type: "number", min: 1, width: "third" },
            { name: "privatePool", label: "Private pool", type: "boolean", width: "third" },
            { name: "petFriendly", label: "Pet-friendly", type: "boolean", width: "third" },
          ]),
        },
        {
          title: "Rooms",
          fields: f([
            {
              name: "rooms",
              label: "Rooms",
              type: "list",
              itemLabel: "Room",
              fields: [
                { name: "name", label: "Room name", type: "text", width: "half" },
                { name: "beds", label: "Beds", type: "text", width: "half" },
                { name: "note", label: "Note", type: "text" },
              ],
            },
          ]),
        },
        { title: "Amenities", description: "Manage the list itself under Amenities.", fields: f([{ name: "amenities", label: "Amenities", type: "ref", endpoint: "/admin/amenities", labelKey: "label", multiple: true }]) },
        { title: "Meals", fields: f([{ name: "meals", label: "Meals", type: "textarea", rows: 3 }]) },
      ],
    },
    {
      key: "pricing",
      label: "Prices & owner",
      sections: [
        {
          title: "Prices",
          description: "Shown on the website, per night for the whole villa. Guests confirm the final quote on WhatsApp.",
          fields: f([
            { name: "priceFrom", label: "Weekday price", type: "money", width: "third" },
            { name: "weekendPrice", label: "Weekend price", type: "money", width: "third", help: "Optional" },
            { name: "minNights", label: "Minimum nights", type: "number", min: 1, width: "third" },
            { name: "securityDeposit", label: "Security deposit", type: "money", width: "third" },
            { name: "checkIn", label: "Check-in time", type: "text", width: "third" },
            { name: "checkOut", label: "Check-out time", type: "text", width: "third" },
          ]),
        },
        {
          title: "Owner & WhatsApp",
          description: "The owner can request changes to this listing from their account.",
          fields: f([
            { name: "owner", label: "Owner account", type: "ref", endpoint: "/admin/users", query: { role: "owner" }, labelKey: "name", width: "half", help: "Owner accounts are created under Users." },
            { name: "whatsappNumber", label: "WhatsApp number for this villa", type: "text", width: "half", help: "Optional. Digits with country code, e.g. 919812345678" },
          ]),
        },
      ],
    },
    {
      key: "location",
      label: "Location & host",
      sections: [
        {
          title: "Location",
          description: "Approximate only: never the exact gate. The map shows this point.",
          fields: f([
            { name: "location.area", label: "Area", type: "text", width: "two-thirds" },
            { name: "location.fromIndore", label: "Drive from Indore", type: "text", width: "third", help: "e.g. 1 hr 10 min" },
            { name: "location.lat", label: "Latitude", type: "number", step: 0.0001, width: "third" },
            { name: "location.lng", label: "Longitude", type: "number", step: 0.0001, width: "third" },
          ]),
        },
        {
          title: "Host",
          fields: f([
            { name: "host.name", label: "Host name", type: "text", width: "half" },
            { name: "host.note", label: "About the host", type: "textarea", rows: 2 },
          ]),
        },
        {
          title: "Rating",
          description: "Shown with stars on the villa page. Leave the count at 0 to hide it.",
          fields: f([
            { name: "rating.score", label: "Score", type: "number", min: 0, max: 5, step: 0.1, width: "third" },
            { name: "rating.count", label: "Number of stays", type: "number", min: 0, width: "third" },
          ]),
        },
        { title: "Occasions", fields: f([{ name: "occasions", label: "Good for", type: "ref", endpoint: "/admin/occasions", labelKey: "title", multiple: true }]) },
      ],
    },
    {
      key: "rules",
      label: "House rules",
      sections: [{ title: "House rules", description: "Listed on the villa page. They form part of the terms of stay.", fields: f([{ name: "houseRules", label: "Rules", type: "strings", itemLabel: "rule", rows: 2 }]) }],
    },
    { key: "seo", label: "SEO", sections: [seoSection()] },
  ],
};
