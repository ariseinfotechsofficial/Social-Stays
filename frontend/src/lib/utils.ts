import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ type: ["display-xl", "display-l", "display-m", "display-s", "lead", "label", "price"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** ₹18,500 */
export const formatINR = (amount: number) => inr.format(amount);

/** "From ₹4,500 per set-up" */
export const priceLabel = (price: { amount: number; unit: string; from?: boolean }) =>
  `${price.from ? "From " : ""}${formatINR(price.amount)} ${price.unit}`;

/** 75 → "1 hr 15 min", 120 → "2 hrs" */
export function formatDriveTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hours = h ? `${h} hr${h > 1 && !m ? "s" : ""}` : "";
  return [hours, m ? `${m} min` : ""].filter(Boolean).join(" ");
}

export const pluralise = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/** Serialises JSON-LD safely for a <script> tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
