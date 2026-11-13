"use client";

import { LeadsInbox, type LeadsConfig } from "@admin/components/leads/LeadsInbox";

const config: LeadsConfig = {
  endpoint: "/admin/owner-leads",
  title: "Owner leads",
  description: "Villa owners who filled in the Partner with us form.",
  statuses: [
    { value: "new", label: "New", tone: "gold" },
    { value: "contacted", label: "Contacted", tone: "info" },
    { value: "visit-planned", label: "Visit planned", tone: "warn" },
    { value: "onboarded", label: "Onboarded", tone: "success" },
    { value: "not-a-fit", label: "Not a fit", tone: "neutral" },
  ],
  columns: [
    { label: "Owner", render: (l) => <span className="font-semibold">{String(l.name)}</span> },
    { label: "Location", render: (l) => <span className="text-ink-soft">{String(l.location)}</span> },
    { label: "Bedrooms", render: (l) => <span className="tabular-nums">{String(l.rooms)}</span> },
    { label: "Phone", render: (l) => <span className="tabular-nums text-ink-soft">{String(l.phone)}</span> },
  ],
  details: (l) => [
    ["Name", String(l.name)],
    ["Phone", String(l.phone)],
    ["Location", String(l.location)],
    ["Bedrooms", String(l.rooms)],
    ["Photos", l.photos ? <a href={String(l.photos)} target="_blank" rel="noopener noreferrer" className="text-gold-deep underline">Open photos</a> : ""],
    ["Message", String(l.note ?? "")],
    ["Source", String(l.source ?? "")],
  ],
  whatsappText: (l) => `Hello ${String(l.name).split(" ")[0]}, this is Social Stays. Thank you for telling us about your property in ${String(l.location)}.`,
};

export default function OwnerLeadsPage() {
  return <LeadsInbox config={config} />;
}
