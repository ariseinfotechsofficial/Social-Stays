import { differenceInCalendarDays, format } from "date-fns";
import { PUBLIC_API } from "@/lib/api";
import { describeAttribution, getAttribution } from "@/lib/attribution";
import { track } from "@/lib/analytics";

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
export function buildEnquiryMessage(enquiry: Enquiry, pageUrl: string, brand = "Social Stays") {
  const lines = [`Hello ${brand}, I'd like to check availability.`, ""];
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

export const whatsappUrl = (number: string, text?: string) => `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

const isoDate = (d?: Date) => (d ? format(d, "yyyy-MM-dd") : undefined);

/** Saves the enquiry for the admin's inbox. Fire-and-forget: `keepalive` lets it finish while WhatsApp opens. */
function saveEnquiry(enquiry: Enquiry, placement: string) {
  const a = getAttribution();
  try {
    void fetch(`${PUBLIC_API}/api/public/enquiries`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        villa: enquiry.villa?.slug,
        destination: enquiry.villa?.destination ?? enquiry.destination,
        checkIn: isoDate(enquiry.checkIn),
        checkOut: isoDate(enquiry.checkOut),
        guests: enquiry.guests,
        occasion: enquiry.occasion,
        name: enquiry.name,
        note: enquiry.note,
        placement,
        page: window.location.href.slice(0, 500),
        attribution: { source: a.source, medium: a.medium, campaign: a.campaign, content: a.content, term: a.term, landing: a.landingPage, label: describeAttribution(a) },
      }),
    }).catch(() => {});
  } catch {
    /* never block the WhatsApp hand-off */
  }
}

/** Builds the message, records the conversion, saves the lead and opens WhatsApp. Call from a click/submit handler. */
export function openWhatsAppEnquiry(enquiry: Enquiry, placement: string, number: string, brand?: string) {
  const text = buildEnquiryMessage(enquiry, window.location.href, brand);
  track("form_submit", { form: placement, villa: enquiry.villa?.slug, occasion: enquiry.occasion });
  track("whatsapp_click", { placement, villa: enquiry.villa?.slug });
  saveEnquiry(enquiry, placement);
  window.open(whatsappUrl(number, text), "_blank", "noopener,noreferrer");
}

/** For plain "Chat on WhatsApp" links that don't come from a form. */
export function quickWhatsAppText(message: string) {
  if (typeof window === "undefined") return undefined;
  const lines = [message, ""];
  lines.push(`Source: ${describeAttribution(getAttribution())}`);
  lines.push(`Page: ${window.location.href.replace(/^https?:\/\//, "")}`);
  return lines.join("\n");
}
