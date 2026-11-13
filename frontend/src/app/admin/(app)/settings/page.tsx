"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Fields } from "@admin/components/fields/Fields";
import type { FieldDef, FormValue } from "@admin/components/fields/types";
import { NoAccess } from "@admin/components/NoAccess";
import { useUnsavedWarning } from "@admin/components/resource/ResourceEditor";
import { Button } from "@admin/components/ui/button";
import { Alert, Card, Loading } from "@admin/components/ui/feedback";
import { FormSection, PageHeader, Tabs } from "@admin/components/ui/layout";
import { ApiError, api, fieldErrors } from "@admin/lib/api";
import { useCan, type Permission } from "@admin/lib/session";

type Group = { title: string; description?: string; fields: FieldDef[] };
type Tab = { key: string; label: string; perm: Permission; groups: Group[] };

const link = (name: string, label: string): FieldDef => ({
  name,
  label,
  type: "list",
  itemLabel: "Link",
  titleKey: "label",
  fields: [
    { name: "label", label: "Label", type: "text", width: "half" },
    { name: "href", label: "Link", type: "text", width: "half", help: "A page path like /villas, or a full URL" },
  ],
});

const TABS: Tab[] = [
  {
    key: "brand",
    label: "Brand",
    perm: "settings",
    groups: [
      {
        title: "Brand",
        fields: [
          { name: "brand.name", label: "Business name", type: "text", width: "half" },
          { name: "brand.tagline", label: "Tagline", type: "text", width: "half" },
          { name: "brand.description", label: "Short description", type: "textarea", rows: 2, help: "Used in Google's knowledge panel data and as the fallback page description" },
        ],
      },
      {
        title: "Logos",
        description: "PNG with a transparent background works best.",
        fields: [
          { name: "brand.logo", label: "Header logo (on white)", type: "image", folder: "brand" },
          { name: "brand.logoLight", label: "Header logo over photos (white version)", type: "image", folder: "brand" },
          { name: "brand.badge", label: "Footer badge", type: "image", folder: "brand" },
          { name: "brand.favicon", label: "Browser tab icon", type: "image", folder: "brand", help: "Square, at least 192 × 192" },
        ],
      },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    perm: "settings",
    groups: [
      {
        title: "WhatsApp & phone",
        description: "Every WhatsApp button and enquiry form on the website uses this number.",
        fields: [
          { name: "contact.whatsappNumber", label: "WhatsApp number", type: "text", width: "half", help: "Country code + number, digits only: 919812345678" },
          { name: "contact.phoneDisplay", label: "Phone, as shown", type: "text", width: "half", help: "+91 98123 45678" },
          { name: "contact.phoneE164", label: "Phone, for tap-to-call", type: "text", width: "half", help: "+919812345678" },
          { name: "contact.email", label: "Email", type: "email", width: "half" },
          { name: "contact.replyHours", label: "Reply hours", type: "text", help: "e.g. We reply on WhatsApp from 9 am to 10 pm, every day." },
          { name: "contact.callHours", label: "Call hours", type: "text" },
          { name: "contact.defaultWhatsappMessage", label: "Default WhatsApp message", type: "textarea", rows: 2, help: "Pre-filled on plain Chat on WhatsApp buttons" },
          { name: "contact.floatingWhatsapp", label: "Show the floating WhatsApp button", type: "boolean" },
        ],
      },
      {
        title: "Social",
        fields: [
          { name: "social.instagramHandle", label: "Instagram handle", type: "text", width: "half", help: "Without the @" },
          { name: "social.instagramUrl", label: "Instagram link", type: "url", width: "half" },
          { name: "social.facebookUrl", label: "Facebook link", type: "url", width: "half" },
          { name: "social.youtubeUrl", label: "YouTube link", type: "url", width: "half" },
          { name: "social.googleReviewsUrl", label: "Google reviews link", type: "url" },
        ],
      },
      {
        title: "Address & map",
        description: "The pin on the Contact page map. Find coordinates by right-clicking the place in Google Maps.",
        fields: [
          { name: "address.street", label: "Street", type: "text" },
          { name: "address.locality", label: "City", type: "text", width: "third" },
          { name: "address.region", label: "State", type: "text", width: "third" },
          { name: "address.postalCode", label: "PIN code", type: "text", width: "third" },
          { name: "address.lat", label: "Latitude", type: "number", step: 0.0001, width: "third" },
          { name: "address.lng", label: "Longitude", type: "number", step: 0.0001, width: "third" },
        ],
      },
    ],
  },
  {
    key: "navigation",
    label: "Header & footer",
    perm: "settings",
    groups: [
      { title: "Main menu", description: "Links in the header (and the top of the phone menu).", fields: [link("header.nav", "Main menu")] },
      { title: "Second menu", description: "Smaller links in the phone menu.", fields: [link("header.secondaryNav", "Second menu"), { name: "header.ctaLabel", label: "Header button label", type: "text", width: "half" }] },
      {
        title: "Footer",
        fields: [
          { name: "footer.blurb", label: "Text under the logo", type: "textarea", rows: 2 },
          {
            name: "footer.columns",
            label: "Link columns",
            type: "list",
            itemLabel: "Column",
            titleKey: "title",
            fields: [
              { name: "title", label: "Column heading", type: "text", width: "half" },
              {
                name: "auto",
                label: "Fill automatically",
                type: "select",
                width: "half",
                options: [
                  { value: "", label: "No, use my links" },
                  { value: "destinations", label: "All destinations" },
                  { value: "policies", label: "All policies" },
                ],
              },
              link("links", "Links"),
            ],
          },
          { name: "footer.copyright", label: "Copyright line", type: "text", help: "{year} becomes the current year" },
        ],
      },
    ],
  },
  {
    key: "seo",
    label: "SEO & tracking",
    perm: "settings",
    groups: [
      {
        title: "Default SEO",
        description: "Used for the home page and any page without its own SEO.",
        fields: [
          { name: "seo", label: "SEO", type: "seo" },
          { name: "titleTemplate", label: "Title pattern", type: "text", help: "%s is replaced with each page's title, e.g. %s | Social Stays" },
        ],
      },
      {
        title: "Tracking",
        description: "Recommended: only set the Tag Manager ID and configure GA4, Meta Pixel and Conversions API inside GTM. Direct GA4/Pixel IDs are used only when there is no GTM ID.",
        fields: [
          { name: "tracking.gtmId", label: "Google Tag Manager ID", type: "text", width: "half", help: "GTM-XXXXXXX" },
          { name: "tracking.ga4Id", label: "GA4 measurement ID", type: "text", width: "half", help: "G-XXXXXXXXXX" },
          { name: "tracking.metaPixelId", label: "Meta Pixel ID", type: "text", width: "half" },
          { name: "tracking.googleSiteVerification", label: "Search Console verification code", type: "text", width: "half", help: "The content value of the HTML tag method" },
        ],
      },
    ],
  },
  {
    key: "enquiry",
    label: "Reviews & enquiries",
    perm: "settings",
    groups: [
      {
        title: "Review summary",
        description: "The score shown next to the stars on the home page and ad pages.",
        fields: [
          { name: "reviewSummary.score", label: "Score", type: "number", min: 0, max: 5, step: 0.1, width: "third" },
          { name: "reviewSummary.count", label: "Number of reviews", type: "number", min: 0, width: "third", help: "0 hides the line" },
          { name: "reviewSummary.source", label: "Source", type: "text", width: "third" },
        ],
      },
      {
        title: "Enquiry form",
        fields: [
          { name: "enquiry.occasions", label: "Occasion options", type: "strings", itemLabel: "occasion" },
          { name: "enquiry.dialogTitle", label: "Pop-up heading", type: "text", width: "half" },
          { name: "enquiry.submitLabel", label: "Button label", type: "text", width: "half" },
          { name: "enquiry.dialogIntro", label: "Pop-up intro", type: "text" },
          { name: "enquiry.note", label: "Note under the form", type: "text" },
          { name: "enquiry.flexibleNote", label: "Note under the calendar", type: "text" },
        ],
      },
    ],
  },
  {
    key: "booking",
    label: "Booking & payments",
    perm: "booking-settings",
    groups: [
      {
        title: "Online booking",
        description: "Each villa chooses instant, request or WhatsApp-only. Online payment also needs the Razorpay keys on the server.",
        fields: [
          { name: "booking.enabled", label: "Online booking switched on", type: "boolean" },
          {
            name: "booking.paymentMode",
            label: "Payment",
            type: "select",
            width: "half",
            options: [
              { value: "advance", label: "Advance now, balance later" },
              { value: "full", label: "Full amount upfront" },
              { value: "choice", label: "Guest chooses" },
            ],
          },
          { name: "booking.advancePercent", label: "Advance", type: "number", min: 1, max: 100, suffix: "%", width: "third" },
          { name: "booking.balanceDueDays", label: "Balance due before check-in", type: "number", min: 0, suffix: "days", width: "third" },
          { name: "booking.weekendNights", label: "Weekend nights (use the weekend price)", type: "weekdays", help: "Nights starting on these days. Fri + Sat is usual." },
        ],
      },
      {
        title: "Holds & requests",
        fields: [
          { name: "booking.holdMinutes", label: "Hold dates while paying", type: "number", min: 5, max: 120, suffix: "min", width: "third" },
          { name: "booking.requestExpiryHours", label: "Requests lapse after", type: "number", min: 1, suffix: "hours", width: "third" },
          { name: "booking.paymentWindowHours", label: "Time to pay after approval", type: "number", min: 1, suffix: "hours", width: "third" },
          { name: "booking.maxAdvanceDays", label: "Book up to", type: "number", min: 30, suffix: "days ahead", width: "third" },
        ],
      },
      {
        title: "Tax & invoices",
        fields: [
          { name: "booking.gstPercent", label: "GST", type: "number", min: 0, max: 28, step: 0.5, suffix: "%", width: "third" },
          { name: "booking.gstInclusive", label: "Prices already include GST", type: "boolean", width: "two-thirds" },
          { name: "booking.legalName", label: "Registered business name", type: "text", width: "half" },
          { name: "booking.gstin", label: "GSTIN", type: "text", width: "half" },
          { name: "booking.termsNote", label: "Terms line at checkout", type: "textarea", rows: 2, help: "Leave empty to use the text from Pages → Online booking" },
        ],
      },
    ],
  },
];

export default function SettingsPage() {
  const can = useCan();
  const qc = useQueryClient();
  const tabs = TABS.filter((t) => can(t.perm));
  const [tab, setTab] = useState(tabs[0]?.key ?? "");
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => api<FormValue>("/admin/settings"), enabled: tabs.length > 0 });
  const [value, setValue] = useState<FormValue | null>(null);
  const [saved, setSaved] = useState("");
  const [loadedAt, setLoadedAt] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (settings.data && settings.dataUpdatedAt !== loadedAt) {
    setLoadedAt(settings.dataUpdatedAt);
    setValue(settings.data);
    setSaved(JSON.stringify(settings.data));
  }
  const dirty = value !== null && JSON.stringify(value) !== saved;
  useUnsavedWarning(dirty);

  if (!tabs.length) return <NoAccess />;
  if (!value) return settings.error ? <Alert tone="error">{settings.error.message}</Alert> : <Loading />;

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      await api("/admin/settings", { method: "PUT", json: value });
      toast.success("Settings saved. The website updates in a few seconds.");
      await qc.invalidateQueries({ queryKey: ["settings"] });
    } catch (e) {
      setErrors(fieldErrors(e));
      toast.error(e instanceof ApiError ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  const current = tabs.find((t) => t.key === tab) ?? tabs[0];

  return (
    <>
      <PageHeader
        title="Site settings"
        description="Contact details, menus, SEO, tracking and booking rules for the whole website."
        actions={
          <Button onClick={save} loading={saving} disabled={!dirty}>
            {dirty ? "Save settings" : "Saved"}
          </Button>
        }
      />
      <Tabs value={current.key} onChange={setTab} tabs={tabs.map((t) => ({ value: t.key, label: t.label }))} className="mb-5" />
      <Card>
        {current.groups.map((g) => (
          <FormSection key={g.title} title={g.title} description={g.description}>
            <Fields fields={g.fields} value={value} onChange={setValue} errors={errors} />
          </FormSection>
        ))}
      </Card>
      {dirty && (
        <div className="sticky bottom-4 z-20 mt-6 flex items-center justify-between gap-4 rounded-full border border-line bg-white/95 py-2 pr-2 pl-5 shadow-xl backdrop-blur">
          <span className="text-[0.875rem] font-medium">You have unsaved changes</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setValue(JSON.parse(saved))}>
              Discard
            </Button>
            <Button size="sm" onClick={save} loading={saving}>
              Save settings
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
