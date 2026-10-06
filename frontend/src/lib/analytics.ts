import { getAttribution } from "@/lib/attribution";

/**
 * Conversion events from the brief. They are pushed to the GTM dataLayer, where GA4,
 * Meta Pixel and the Conversions API tags pick them up (configure triggers in GTM).
 */
export type TrackEvent = "whatsapp_click" | "call_click" | "form_submit" | "villa_view" | "owner_lead";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

/** Meta standard events, used when the Pixel is loaded on the page. */
const META_EVENT: Partial<Record<TrackEvent, string>> = {
  whatsapp_click: "Contact",
  call_click: "Contact",
  form_submit: "Lead",
  owner_lead: "Lead",
  villa_view: "ViewContent",
};

export function track(event: TrackEvent, params: Params = {}) {
  if (typeof window === "undefined") return;
  const { source, medium, campaign } = getAttribution();
  const payload = { event, ...params, traffic_source: source, traffic_medium: medium, traffic_campaign: campaign };

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);

  const metaEvent = META_EVENT[event];
  if (metaEvent) window.fbq?.("track", metaEvent, params);

  if (process.env.NODE_ENV === "development") console.debug("[track]", payload);
}
