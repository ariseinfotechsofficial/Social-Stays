"use client";

import { LeadsInbox, type Lead, type LeadsConfig } from "@admin/components/leads/LeadsInbox";
import { stayDay } from "@admin/lib/utils";

const stay = (l: Lead) => (l.checkIn ? `${stayDay(l.checkIn as string, "d MMM")}${l.checkOut ? ` – ${stayDay(l.checkOut as string, "d MMM yyyy")}` : ""}` : "Flexible");

const config: LeadsConfig = {
  endpoint: "/admin/enquiries",
  title: "Enquiries",
  description: "Every enquiry sent from the website, saved just before WhatsApp opens, with the ad or page it came from.",
  statuses: [
    { value: "new", label: "New", tone: "gold" },
    { value: "contacted", label: "Contacted", tone: "info" },
    { value: "quoted", label: "Quoted", tone: "warn" },
    { value: "booked", label: "Booked", tone: "success" },
    { value: "lost", label: "Lost", tone: "neutral" },
  ],
  columns: [
    { label: "Villa / destination", render: (l) => <span className="font-semibold">{String(l.villaName || l.destination || "Any villa")}</span> },
    { label: "Dates", render: (l) => <span className="whitespace-nowrap text-ink-soft">{stay(l)}</span> },
    { label: "Guests", render: (l) => <span className="tabular-nums">{String(l.guests ?? "—")}</span> },
    { label: "Occasion", render: (l) => <span className="text-ink-soft">{String(l.occasion || "—")}</span> },
    { label: "Source", render: (l) => <span className="text-ink-soft">{l.attribution?.label || l.attribution?.source || "Direct"}</span> },
  ],
  details: (l) => [
    ["Villa", String(l.villaName ?? "")],
    ["Destination", String(l.destination ?? "")],
    ["Dates", stay(l)],
    ["Guests", String(l.guests ?? "")],
    ["Occasion", String(l.occasion ?? "")],
    ["Name", String(l.name ?? "")],
    ["Phone", String(l.phone ?? "")],
    ["Message", String(l.note ?? "")],
    ["Source", l.attribution?.label || l.attribution?.source || "Direct"],
    ["Campaign", l.attribution?.campaign ?? ""],
    ["Form", String(l.placement ?? "")],
    ["Page", l.page ? <a href={String(l.page)} target="_blank" rel="noopener noreferrer" className="text-gold-deep underline">{String(l.page).replace(/^https?:\/\//, "")}</a> : ""],
  ],
};

export default function EnquiriesPage() {
  return <LeadsInbox config={config} />;
}
