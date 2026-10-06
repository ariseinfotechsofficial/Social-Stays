import { differenceInCalendarDays, format } from "date-fns";
import { describeAttribution, getAttribution } from "@/lib/attribution";
import { track } from "@/lib/analytics";
import { site } from "@/lib/site";

export type Enquiry = {
  villa?: { name: string; slug: string; destination: string };
  destination?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  occasion?: string;
  name?: string;
  note?: string;
};

export function formatStayDates(checkIn?: Date, checkOut?: Date) {
  if (!checkIn) return undefined;
  if (!checkOut) return format(checkIn, "EEE d MMM yyyy");
  const nights = differenceInCalendarDays(checkOut, checkIn);
  const sameYear = checkIn.getFullYear() === checkOut.getFullYear();
  const start = format(checkIn, sameYear ? "EEE d MMM" : "EEE d MMM yyyy");
  return `${start} – ${format(checkOut, "EEE d MMM yyyy")} (${nights} night${nights === 1 ? "" : "s"})`;
}

/** The pre-filled WhatsApp text. Plain lines so it reads well on a phone. */
export function buildEnquiryMessage(enquiry: Enquiry, pageUrl: string) {
  const lines = ["Hello Social Stays, I'd like to check availability.", ""];
  if (enquiry.villa) lines.push(`Villa: ${enquiry.villa.name}, ${enquiry.villa.destination}`);
  else if (enquiry.destination) lines.push(`Destination: ${enquiry.destination}`);
  const dates = formatStayDates(enquiry.checkIn, enquiry.checkOut);
  if (dates) lines.push(`Dates: ${dates}`);
  if (enquiry.guests) lines.push(`Guests: ${enquiry.guests}`);
  if (enquiry.occasion) lines.push(`Occasion: ${enquiry.occasion}`);
  if (enquiry.name) lines.push(`Name: ${enquiry.name}`);
  if (enquiry.note) lines.push("", enquiry.note);
  lines.push("", `Source: ${describeAttribution(getAttribution())}`);
  lines.push(`Page: ${pageUrl.replace(/^https?:\/\//, "")}`);
  return lines.join("\n");
}

export const whatsappUrl = (text?: string) =>
  `https://wa.me/${site.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Builds the message, records the conversion and opens WhatsApp. Call from a click/submit handler. */
export function openWhatsAppEnquiry(enquiry: Enquiry, placement: string) {
  const text = buildEnquiryMessage(enquiry, window.location.href);
  track("form_submit", { form: placement, villa: enquiry.villa?.slug, occasion: enquiry.occasion });
  track("whatsapp_click", { placement, villa: enquiry.villa?.slug });
  window.open(whatsappUrl(text), "_blank", "noopener,noreferrer");
}

/** For plain "Chat on WhatsApp" links that don't come from a form. */
export function quickWhatsAppText(context?: string) {
  if (typeof window === "undefined") return undefined;
  const lines = [context ?? "Hello Social Stays, I have a question about a stay.", ""];
  lines.push(`Source: ${describeAttribution(getAttribution())}`);
  lines.push(`Page: ${window.location.href.replace(/^https?:\/\//, "")}`);
  return lines.join("\n");
}
