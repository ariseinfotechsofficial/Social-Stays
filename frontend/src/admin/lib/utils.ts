import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatINR = (n: number | null | undefined) => inr.format(Math.round(n ?? 0));

const toDate = (d: string | Date | null | undefined) => (d ? (typeof d === "string" ? parseISO(d) : d) : null);

/** Stay dates are calendar days stored as UTC midnight; read them without a timezone shift */
export const stayDay = (d: string | Date | null | undefined, pattern = "EEE d MMM yyyy") => {
  if (!d) return "";
  const iso = typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10);
  return format(parseISO(iso), pattern);
};

export const dateTime = (d: string | Date | null | undefined) => {
  const x = toDate(d);
  return x && isValid(x) ? format(x, "d MMM yyyy, h:mm a") : "";
};

export const shortDate = (d: string | Date | null | undefined) => {
  const x = toDate(d);
  return x && isValid(x) ? format(x, "d MMM yyyy") : "";
};

export const ago = (d: string | Date | null | undefined) => {
  const x = toDate(d);
  return x && isValid(x) ? `${formatDistanceToNowStrict(x)} ago` : "";
};

export const isoDay = (d: Date) => format(d, "yyyy-MM-dd");

/** Reads "a.b.c" from an object */
export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

/** Returns a copy of obj with "a.b.c" set to value */
export function setPath<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".");
  if (!rest.length) return { ...obj, [head]: value };
  const child = (obj?.[head] && typeof obj[head] === "object" ? obj[head] : {}) as Record<string, unknown>;
  return { ...obj, [head]: setPath(child, rest.join("."), value) };
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** The website is served by the same app, so "View on site" links are same-origin */
export const SITE_URL = "";

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const VERBS: Record<string, string> = {
  create: "added",
  update: "edited",
  delete: "deleted",
  login: "signed in",
  reorder: "reordered",
  duplicate: "duplicated",
  upload: "uploaded",
  approve: "approved",
  decline: "declined",
  cancel: "cancelled",
  refund: "refunded",
  payment: "recorded a payment on",
  move: "moved",
  reject: "declined",
  "reject-cancellation": "kept",
  "mark-paid": "marked paid",
};

/** "Asha edited villa · Amaltas House" */
export const activityText = (a: { action: string; entity: string }) => (a.action === "login" ? "signed in" : `${VERBS[a.action] ?? a.action} ${a.entity}`);
