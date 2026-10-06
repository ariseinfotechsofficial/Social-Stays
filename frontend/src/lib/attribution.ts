/**
 * Captures where a visitor came from (UTM tags, ad click IDs or referrer) so every
 * WhatsApp enquiry carries its source. Last non-direct touch wins, kept for 30 days.
 */

export type Attribution = {
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  landingPage?: string;
  capturedAt: number;
};

const KEY = "ss_attribution";
const TTL = 30 * 24 * 60 * 60 * 1000;

const SOURCE_NAMES: Record<string, string> = {
  fb: "Meta",
  facebook: "Meta",
  meta: "Meta",
  ig: "Instagram",
  instagram: "Instagram",
  google: "Google",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
};

const normaliseSource = (raw: string) => SOURCE_NAMES[raw.toLowerCase()] ?? raw;

function fromReferrer(referrer: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host === window.location.hostname) return null;
    if (host.includes("google.")) return "Google";
    if (host.includes("instagram.")) return "Instagram";
    if (host.includes("facebook.") || host === "fb.com" || host.startsWith("l.facebook")) return "Meta";
    if (host.includes("bing.")) return "Bing";
    if (host.includes("youtube.")) return "YouTube";
    return host;
  } catch {
    return null;
  }
}

function read(): Attribution | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    return Date.now() - parsed.capturedAt > TTL ? null : parsed;
  } catch {
    return null;
  }
}

function write(value: Attribution) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* storage blocked — attribution falls back to "Direct" */
  }
}

/** Call once per page load (done in <AttributionCapture />). */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const landingPage = window.location.pathname;

  if (utmSource || params.get("gclid") || params.get("fbclid")) {
    write({
      source: utmSource ? normaliseSource(utmSource) : params.get("gclid") ? "Google" : "Meta",
      medium: params.get("utm_medium") ?? (params.get("gclid") || params.get("fbclid") ? "paid" : undefined),
      campaign: params.get("utm_campaign") ?? undefined,
      content: params.get("utm_content") ?? undefined,
      term: params.get("utm_term") ?? undefined,
      landingPage,
      capturedAt: Date.now(),
    });
    return;
  }

  const referred = fromReferrer(document.referrer);
  if (referred) write({ source: referred, medium: "organic", landingPage, capturedAt: Date.now() });
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return { source: "Direct", capturedAt: 0 };
  return read() ?? { source: "Direct", capturedAt: Date.now() };
}

const PAID = new Set(["cpc", "ppc", "paid", "paid_social", "paidsocial", "ads", "ad", "display"]);

/** "Instagram ad (diwali-weekends)" / "Google search" / "Direct" */
export function describeAttribution(a: Attribution) {
  const paid = a.medium && PAID.has(a.medium.toLowerCase());
  let label = a.source;
  if (paid) label += " ad";
  else if (a.medium === "organic" && a.source === "Google") label += " search";
  if (a.campaign) label += ` (${a.campaign})`;
  return label;
}
