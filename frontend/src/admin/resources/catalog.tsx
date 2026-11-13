import { Badge } from "@admin/components/ui/feedback";
import { AMENITY_ICONS } from "@admin/lib/icons";
import { formatINR } from "@admin/lib/utils";
import { PUBLISH_OPTIONS, PublishBadge, TitleCell, idsFor, name, seoSection, statusField } from "./common";
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

const CHARGE_TYPES = [
  { value: "per_person", label: "Per person (× guests)" },
  { value: "per_person_per_night", label: "Per person per night" },
  { value: "per_unit", label: "Per item (guest picks a quantity)" },
  { value: "per_night", label: "Per night" },
  { value: "on_request", label: "Quoted on request (not charged online)" },
];

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
  defaults: { status: "draft", title: "", slug: "", price: { amount: 0, unit: "per person", from: false }, chargeType: "per_person", bookable: true, includes: [], availableAt: [] },
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
      description: "The price shown on the website, and how online bookings charge it.",
      fields: [
        { name: "price.amount", label: "Amount", type: "money", width: "third" },
        { name: "price.unit", label: "Unit", type: "text", width: "third", help: "e.g. per person, per set-up" },
        { name: "price.from", label: 'Show as "From"', type: "boolean", width: "third" },
        { name: "chargeType", label: "Charged at checkout", type: "select", options: CHARGE_TYPES, width: "half" },
        { name: "minGuests", label: "Minimum guests charged", type: "number", min: 0, width: "third", showIf: (v) => String(v.chargeType).startsWith("per_person") },
        { name: "bookable", label: "Can be added at online checkout", type: "boolean" },
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

export const cancellationPolicies: ResourceConfig = {
  key: "cancellation-policies",
  endpoint: "/admin/cancellation-policies",
  title: "Cancellation rules",
  singular: "Cancellation rule",
  description: "Refund tiers used for online cancellations. Each villa picks one. The written policy is edited under Policies.",
  perms: ["catalog"],
  columns: [
    { label: "Rule", render: (d) => <TitleCell title={String(d.name)} sub={String(d.summary ?? "")} /> },
    {
      label: "Tiers",
      render: (d) => (
        <span className="text-ink-soft">
          {((d.tiers as { daysBefore: number; refundPercent: number }[]) ?? []).map((t) => `${t.daysBefore}+ days: ${t.refundPercent}%`).join(" · ")}
        </span>
      ),
    },
  ],
  defaults: { name: "", key: "", summary: "", tiers: [{ daysBefore: 15, refundPercent: 100 }, { daysBefore: 7, refundPercent: 50 }, { daysBefore: 0, refundPercent: 0 }], deductionPercent: 0 },
  titleOf: (d) => String(d.name ?? ""),
  sections: [
    {
      title: "Rule",
      fields: [
        { name: "name", label: "Name", type: "text", width: "half" },
        { name: "key", label: "Key", type: "slug", from: "name", width: "third" },
        { name: "summary", label: "One line on the villa page", type: "text" },
        { name: "deductionPercent", label: "Payment charges kept on refunds", type: "number", min: 0, max: 10, step: 0.5, suffix: "%", width: "third" },
      ],
    },
    {
      title: "Refund tiers",
      description: "Cancelling at least this many days before check-in refunds this share of what was paid. Add a 0-day tier for late cancellations.",
      fields: [
        {
          name: "tiers",
          label: "Tiers",
          type: "list",
          itemLabel: "Tier",
          titleKey: "daysBefore",
          fields: [
            { name: "daysBefore", label: "Days before check-in (at least)", type: "number", min: 0, width: "half" },
            { name: "refundPercent", label: "Refund", type: "number", min: 0, max: 100, suffix: "%", width: "half" },
          ],
        },
      ],
    },
  ],
};

export const coupons: ResourceConfig = {
  key: "coupons",
  endpoint: "/admin/coupons",
  title: "Coupons",
  singular: "Coupon",
  description: "Discount codes guests can enter at online checkout.",
  perms: ["coupons"],
  searchable: true,
  sort: "-createdAt",
  duplicable: true,
  filters: [
    {
      name: "active",
      label: "Active",
      options: [
        { value: "true", label: "Active" },
        { value: "false", label: "Off" },
      ],
    },
  ],
  columns: [
    { label: "Code", render: (d) => <TitleCell title={String(d.code)} sub={String(d.description ?? "")} /> },
    { label: "Discount", render: (d) => <span className="tabular-nums">{d.type === "percent" ? `${d.value}%${d.maxDiscount ? ` (max ${formatINR(d.maxDiscount as number)})` : ""}` : formatINR(d.value as number)}</span> },
    { label: "Used", render: (d) => <span className="tabular-nums text-ink-soft">{`${d.usedCount ?? 0}${d.usageLimit ? ` / ${d.usageLimit}` : ""}`}</span> },
    { label: "Status", render: (d) => (d.active ? <Badge tone="success">Active</Badge> : <Badge>Off</Badge>) },
  ],
  defaults: { code: "", description: "", type: "percent", value: 10, maxDiscount: 0, minAmount: 0, minNights: 0, usageLimit: 0, villas: [], active: true },
  titleOf: (d) => String(d.code ?? ""),
  toForm: (d) => ({ ...idsFor(d, ["villas"]), validFrom: d.validFrom ? String(d.validFrom).slice(0, 10) : "", validTo: d.validTo ? String(d.validTo).slice(0, 10) : "" }),
  fromForm: (v) => ({ ...v, code: String(v.code ?? "").toUpperCase(), validFrom: v.validFrom || null, validTo: v.validTo || null }),
  sections: [
    {
      title: "Code",
      fields: [
        { name: "code", label: "Code", type: "text", width: "third", help: "Letters and numbers, e.g. DIWALI10" },
        { name: "active", label: "Active", type: "boolean", width: "third" },
        { name: "description", label: "Internal note", type: "text" },
      ],
    },
    {
      title: "Discount",
      fields: [
        {
          name: "type",
          label: "Type",
          type: "select",
          width: "third",
          options: [
            { value: "percent", label: "Percentage" },
            { value: "flat", label: "Fixed amount" },
          ],
        },
        { name: "value", label: "Value", type: "number", min: 0, width: "third", help: "% or ₹" },
        { name: "maxDiscount", label: "Maximum discount", type: "money", width: "third", help: "0 = no cap", showIf: (v) => v.type === "percent" },
      ],
    },
    {
      title: "Conditions",
      fields: [
        { name: "minAmount", label: "Minimum booking value", type: "money", width: "third" },
        { name: "minNights", label: "Minimum nights", type: "number", min: 0, width: "third" },
        { name: "usageLimit", label: "Total uses allowed", type: "number", min: 0, width: "third", help: "0 = unlimited" },
        { name: "validFrom", label: "Valid from", type: "date", width: "third" },
        { name: "validTo", label: "Valid until", type: "date", width: "third" },
        { name: "villas", label: "Only for these villas", type: "ref", endpoint: "/admin/villas", labelKey: "name", multiple: true, help: "Leave empty for every villa" },
      ],
    },
  ],
};

export { PUBLISH_OPTIONS };
