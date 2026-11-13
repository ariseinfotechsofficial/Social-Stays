import { StarIcon } from "@phosphor-icons/react";
import { Badge } from "@admin/components/ui/feedback";
import { shortDate } from "@admin/lib/utils";
import { PublishBadge, TitleCell, idsFor, seoSection, statusField } from "./common";
import type { ResourceConfig } from "./types";

export const reviews: ResourceConfig = {
  key: "reviews",
  endpoint: "/admin/reviews",
  title: "Reviews",
  singular: "Review",
  description: "Guest reviews. Featured ones rotate on the home page; each villa page shows its own.",
  perms: ["content"],
  searchable: true,
  sortable: true,
  filters: [
    {
      name: "featured",
      label: "Featured",
      options: [
        { value: "true", label: "Featured" },
        { value: "false", label: "Not featured" },
      ],
    },
  ],
  columns: [
    { label: "Guest", render: (d) => <TitleCell title={String(d.name)} sub={[d.city, (d.villa as { name?: string })?.name].filter(Boolean).join(" · ")} /> },
    { label: "Review", className: "minmax(0,2.4fr)", render: (d) => <span className="line-clamp-2 text-ink-soft">{String(d.text)}</span> },
    {
      label: "Rating",
      className: "5rem",
      render: (d) => (
        <span className="inline-flex items-center gap-1 font-semibold">
          <StarIcon weight="fill" className="size-4 text-brass" /> {String(d.rating)}
        </span>
      ),
    },
    { label: "Shown", className: "7rem", render: (d) => (d.status === "draft" ? <Badge>Hidden</Badge> : d.featured ? <Badge tone="gold">Featured</Badge> : <Badge tone="success">Villa page</Badge>) },
  ],
  defaults: { name: "", city: "", rating: 5, text: "", featured: false, status: "published", source: "manual", date: new Date().toISOString().slice(0, 10) },
  titleOf: (d) => String(d.name ?? ""),
  toForm: (d) => ({ ...idsFor(d, ["villa"]), date: d.date ? String(d.date).slice(0, 10) : "" }),
  sections: [
    {
      title: "Review",
      fields: [
        { name: "name", label: "Guest name", type: "text", width: "half" },
        { name: "city", label: "City", type: "text", width: "third" },
        { name: "rating", label: "Stars", type: "number", min: 1, max: 5, width: "third" },
        { name: "villa", label: "Villa", type: "ref", endpoint: "/admin/villas", labelKey: "name", width: "half" },
        { name: "occasion", label: "Occasion", type: "text", width: "third" },
        { name: "date", label: "Stay date", type: "date", width: "third" },
        { name: "text", label: "Review", type: "textarea", rows: 5 },
      ],
    },
    {
      title: "Display",
      fields: [
        { name: "featured", label: "Feature on the home page", type: "boolean", width: "half" },
        statusField,
        {
          name: "source",
          label: "Source",
          type: "select",
          width: "third",
          options: [
            { value: "manual", label: "Added by team" },
            { value: "google", label: "Google" },
            { value: "guest", label: "Guest" },
          ],
        },
      ],
    },
  ],
};

export const faqGroups: ResourceConfig = {
  key: "faq-groups",
  endpoint: "/admin/faq-groups",
  title: "FAQ groups",
  singular: "FAQ group",
  description: "Headings that group the questions on the FAQ page. Drag to reorder.",
  perms: ["content"],
  sortable: true,
  columns: [{ label: "Group", render: (d) => <TitleCell title={String(d.title)} sub={`#${d.key}`} /> }],
  defaults: { title: "", key: "" },
  titleOf: (d) => String(d.title ?? ""),
  sections: [
    {
      title: "Group",
      fields: [
        { name: "title", label: "Heading", type: "text", width: "half" },
        { name: "key", label: "Link id", type: "slug", from: "title", width: "third" },
      ],
    },
  ],
};

export const faqs: ResourceConfig = {
  key: "faqs",
  endpoint: "/admin/faqs",
  title: "FAQs",
  singular: "Question",
  description: "Questions on the FAQ page (added to Google as FAQ results). Tick 'Show on home' for the home page FAQ block.",
  perms: ["content"],
  searchable: true,
  sortable: true,
  columns: [
    { label: "Question", className: "minmax(0,2.5fr)", render: (d) => <TitleCell title={String(d.q)} sub={String(d.a ?? "").slice(0, 110)} /> },
    { label: "Group", render: (d) => <span className="text-ink-soft">{(d.group as { title?: string })?.title ?? "—"}</span> },
    { label: "Shown", className: "8rem", render: (d) => (d.status === "draft" ? <Badge>Hidden</Badge> : d.showOnHome ? <Badge tone="gold">Home + FAQ</Badge> : <Badge tone="success">FAQ page</Badge>) },
  ],
  defaults: { q: "", a: "", showOnHome: false, status: "published" },
  titleOf: (d) => String(d.q ?? ""),
  toForm: (d) => idsFor(d, ["group"]),
  viewUrl: () => "/faq",
  sections: [
    {
      title: "Question",
      fields: [
        { name: "group", label: "Group", type: "ref", endpoint: "/admin/faq-groups", labelKey: "title", width: "half", help: "Manage groups under FAQ groups" },
        statusField,
        { name: "q", label: "Question", type: "text" },
        { name: "a", label: "Answer", type: "textarea", rows: 5 },
        { name: "showOnHome", label: "Also show on the home page", type: "boolean" },
      ],
    },
  ],
};

export const team: ResourceConfig = {
  key: "team",
  endpoint: "/admin/team",
  title: "Team",
  singular: "Team member",
  description: "The people on the About page. Drag to reorder.",
  perms: ["content"],
  sortable: true,
  columns: [
    { label: "Name", render: (d) => <TitleCell title={String(d.name)} sub={String(d.role ?? "")} img={(d.photo as never) ?? null} /> },
    { label: "Status", render: (d) => <PublishBadge status={d.status} /> },
  ],
  defaults: { name: "", role: "", bio: "", status: "published" },
  titleOf: (d) => String(d.name ?? ""),
  viewUrl: () => "/about",
  sections: [
    {
      title: "Team member",
      fields: [
        { name: "name", label: "Name", type: "text", width: "half" },
        { name: "role", label: "Role", type: "text", width: "third" },
        statusField,
        { name: "bio", label: "Short bio", type: "textarea", rows: 3 },
        { name: "photo", label: "Portrait", type: "image", folder: "team" },
      ],
    },
  ],
};

export const policies: ResourceConfig = {
  key: "policies",
  endpoint: "/admin/policies",
  title: "Policies",
  singular: "Policy",
  description: "Terms, cancellation & refund, privacy. Linked in the footer and at checkout.",
  perms: ["content"],
  sortable: true,
  columns: [
    { label: "Policy", className: "minmax(0,2fr)", render: (d) => <TitleCell title={String(d.title)} sub={`/policies/${d.slug}`} /> },
    { label: "Updated", render: (d) => <span className="text-ink-soft">{shortDate(d.updatedOn as string)}</span> },
    { label: "Status", render: (d) => <PublishBadge status={d.status} /> },
  ],
  defaults: { title: "", slug: "", summary: "", sections: [], status: "published", updatedOn: new Date().toISOString().slice(0, 10), seo: {} },
  titleOf: (d) => String(d.title ?? ""),
  viewUrl: (d) => (d.slug ? `/policies/${d.slug}` : null),
  toForm: (d) => ({ ...d, updatedOn: d.updatedOn ? String(d.updatedOn).slice(0, 10) : "" }),
  notice: () => (
    <p className="mb-4 rounded-[10px] bg-warn-soft px-4 py-3 text-[0.875rem] text-warn">Have policy changes checked by your legal advisor before publishing.</p>
  ),
  sections: [
    {
      title: "Policy",
      fields: [
        { name: "title", label: "Title", type: "text", width: "half" },
        { name: "slug", label: "Web address", type: "slug", from: "title", prefix: "/policies/", width: "half" },
        { name: "summary", label: "Summary", type: "textarea", rows: 2 },
        { name: "updatedOn", label: "Last updated", type: "date", width: "third" },
        statusField,
      ],
    },
    {
      title: "Sections",
      fields: [
        {
          name: "sections",
          label: "Sections",
          type: "list",
          itemLabel: "Section",
          titleKey: "heading",
          fields: [
            { name: "heading", label: "Heading", type: "text" },
            { name: "body", label: "Paragraphs", type: "strings", itemLabel: "paragraph", rows: 3 },
          ],
        },
      ],
    },
    seoSection(),
  ],
};

export const landingPages: ResourceConfig = {
  key: "landing-pages",
  endpoint: "/admin/landing-pages",
  title: "Ad landing pages",
  singular: "Landing page",
  description: "Focused pages for Meta and Google ads (/lp/…), with no menu. Hidden from search by default. Add UTM tags to the ad link.",
  perms: ["content"],
  searchable: true,
  duplicable: true,
  columns: [
    { label: "Page", className: "minmax(0,2.4fr)", render: (d) => <TitleCell title={String(d.headline)} sub={`/lp/${d.slug}`} img={(d.hero as never) ?? null} /> },
    { label: "Type", render: (d) => <span className="text-ink-soft">{d.kind === "villa" ? "Single villa" : "Occasion"}</span> },
    { label: "Status", render: (d) => <PublishBadge status={d.status} /> },
  ],
  defaults: { kind: "villa", slug: "", headline: "", subhead: "", bullets: [], gallery: [], villas: [], status: "draft", seo: { noindex: true } },
  titleOf: (d) => String(d.headline ?? ""),
  viewUrl: (d) => (d.slug && d.status === "published" ? `/lp/${d.slug}` : null),
  toForm: (d) => idsFor(d, ["villas"]),
  tabs: [
    {
      key: "content",
      label: "Content",
      sections: [
        {
          title: "Page",
          fields: [
            {
              name: "kind",
              label: "Type",
              type: "select",
              width: "third",
              options: [
                { value: "villa", label: "Single villa" },
                { value: "occasion", label: "Occasion (several villas)" },
              ],
            },
            { name: "slug", label: "Web address", type: "slug", from: "headline", prefix: "/lp/", width: "third" },
            { name: "status", label: "Status", type: "select", width: "third", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft (hidden)" }] },
            { name: "headline", label: "Headline", type: "text" },
            { name: "subhead", label: "Subheading", type: "textarea", rows: 2 },
            { name: "bullets", label: "Bullet points", type: "strings", itemLabel: "bullet" },
            { name: "villas", label: "Villas", type: "ref", endpoint: "/admin/villas", labelKey: "name", multiple: true, help: "For a single-villa page, choose one" },
            { name: "occasion", label: "Occasion", type: "text", width: "half", help: "Pre-selects the enquiry form and filters reviews", showIf: (v) => v.kind === "occasion" },
          ],
        },
        {
          title: "Photos",
          fields: [
            { name: "hero", label: "Hero photo", type: "image", folder: "landing" },
            { name: "gallery", label: "Gallery (4 photos)", type: "images", folder: "landing" },
          ],
        },
      ],
    },
    {
      key: "text",
      label: "Buttons & text",
      sections: [
        {
          title: "Form and buttons",
          fields: [
            { name: "formTitle", label: "Form heading", type: "text", width: "half" },
            { name: "formIntro", label: "Form intro", type: "text", width: "half" },
            { name: "villasTitle", label: "Villas heading", type: "text", width: "half", showIf: (v) => v.kind === "occasion" },
            { name: "ctaTitle", label: "Closing heading", type: "text", width: "half" },
            { name: "ctaLabel", label: "Closing button", type: "text", width: "third" },
            { name: "stickyLabel", label: "Phone sticky button", type: "text", width: "third" },
            { name: "stickyMessage", label: "WhatsApp message from the sticky button", type: "textarea", rows: 2 },
          ],
        },
      ],
    },
    { key: "seo", label: "SEO", sections: [seoSection()] },
  ],
};

export const redirects: ResourceConfig = {
  key: "redirects",
  endpoint: "/admin/redirects",
  title: "Redirects",
  singular: "Redirect",
  description: "Send old or retired links somewhere useful, so ads and Google results never land on a 404.",
  perms: ["settings"],
  searchable: true,
  columns: [
    { label: "From", render: (d) => <span className="font-mono text-[0.8125rem]">{String(d.from)}</span> },
    { label: "To", render: (d) => <span className="font-mono text-[0.8125rem] text-ink-soft">{String(d.to)}</span> },
    { label: "Type", className: "8rem", render: (d) => (d.active === false ? <Badge>Off</Badge> : <Badge tone={d.permanent ? "success" : "info"}>{d.permanent ? "Permanent" : "Temporary"}</Badge>) },
  ],
  defaults: { from: "/", to: "/", permanent: true, active: true },
  titleOf: (d) => String(d.from ?? ""),
  sections: [
    {
      title: "Redirect",
      fields: [
        { name: "from", label: "Old path", type: "text", width: "half", help: "e.g. /celebrations" },
        { name: "to", label: "New path or URL", type: "text", width: "half", help: "e.g. /experiences" },
        { name: "permanent", label: "Permanent (301/308): tells Google the page has moved", type: "boolean" },
        { name: "active", label: "Active", type: "boolean" },
      ],
    },
  ],
};
