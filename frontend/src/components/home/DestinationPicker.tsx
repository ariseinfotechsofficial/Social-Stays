import Link from "next/link";
import type { ReactNode } from "react";
import type { DestinationSlug } from "@/data/types";

/*
 * Line illustrations, one per destination: ink strokes over soft brass and sand shapes.
 * Drawn on a 96×96 grid so they sit at the same weight side by side.
 */
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const icons: Record<DestinationSlug, ReactNode> = {
  // Ridge with the old Jaam Gate darwaza on the ghat road
  "jaam-gate": (
    <>
      <path d="M58 20h18a6 6 0 0 1 6 6v36H58z" className="fill-brass/35" />
      <circle cx="30" cy="30" r="9" className="fill-sand-deep" />
      <g {...stroke}>
        <path d="M8 66 28 36l10 14 12-20 18 28" />
        <path d="M40 78V56h30v22" />
        <path d="M47 78V67a8 8 0 0 1 16 0v11" />
        <path d="M38 56h34M42 56v-4h26v4" />
        <path d="M55 52v-8l7 2-7 2" />
        <path d="M6 78h84" />
        <path d="M14 84h20M46 84h32" />
      </g>
    </>
  ),
  // Jahaz Mahal: the long "ship palace" with its pavilions, floating on the tank
  mandu: (
    <>
      <path d="M14 24h22a6 6 0 0 1 6 6v20H14z" className="fill-brass/35" />
      <circle cx="74" cy="26" r="8" className="fill-sand-deep" />
      <g {...stroke}>
        <path d="M10 64h76" />
        <path d="M16 64V48h64v16" />
        <path d="M22 64v-8a3 3 0 0 1 6 0v8M34 64v-8a3 3 0 0 1 6 0v8M46 64v-8a3 3 0 0 1 6 0v8M58 64v-8a3 3 0 0 1 6 0v8M70 64v-8a3 3 0 0 1 6 0v8" />
        <path d="M24 48v-6h12v6M24 42c0-6 12-6 12 0M30 36v-3" />
        <path d="M60 48v-6h12v6M60 42c0-6 12-6 12 0M66 36v-3" />
        <path d="M42 48v-4h12v4" />
        <path d="M8 72c5-3 9-3 14 0s9 3 14 0 9-3 14 0 9 3 14 0 9-3 14 0 6 2 8 1" />
        <path d="M20 80c5-3 9-3 14 0s9 3 14 0 9-3 14 0 9 3 14 0" />
      </g>
    </>
  ),
  // Temple spire on the Om-shaped island, a boat on the Narmada below
  omkareshwar: (
    <>
      <path d="M52 18h20a6 6 0 0 1 6 6v30H52z" className="fill-brass/35" />
      <circle cx="22" cy="28" r="8" className="fill-sand-deep" />
      <g {...stroke}>
        <path d="M14 62c8-8 20-10 34-10s26 2 34 10" />
        <path d="M38 54V40l10-16 10 16v14" />
        <path d="M42 40h12M44 47h8" />
        <path d="M48 24v-8l7 2-7 2" />
        <path d="M30 56v-6h8M58 50h8v6" />
        <path d="M8 70c5-3 9-3 14 0s9 3 14 0 9-3 14 0 9 3 14 0 9-3 14 0 6 2 8 1" />
        <path d="M24 80h26l-4 5H28z" />
        <path d="M37 80V72" />
        <path d="M58 84c5-3 9-3 14 0s7 2 12 0" />
      </g>
    </>
  ),
  // Mahakaleshwar's tall shikhara above the ghat steps, with diyas
  ujjain: (
    <>
      <path d="M16 22h20a6 6 0 0 1 6 6v28H16z" className="fill-brass/35" />
      <circle cx="74" cy="30" r="8" className="fill-sand-deep" />
      <g {...stroke}>
        <path d="M34 62V42c0-10 14-24 14-24s14 14 14 24v20" />
        <path d="M48 18v-6M48 12l7 2-7 2" />
        <path d="M38 44h20M37 52h22" />
        <path d="M44 62v-6a4 4 0 0 1 8 0v6" />
        <path d="M24 62h48M18 70h60M12 78h72" />
        <path d="M22 62v-5h12M62 57h12v5" />
        <path d="M18 86h12M42 86h12M66 86h12" />
        <path d="M24 86c0-3 0-4 0-5M48 86c0-3 0-4 0-5M72 86c0-3 0-4 0-5" />
      </g>
    </>
  ),
};

export type PickerStop = { slug: DestinationSlug; name: string; drive: string; villas: number };

/** Home: one icon per destination, each linking to its page. */
export function DestinationPicker({ stops }: { stops: PickerStop[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 md:grid-cols-4">
      {stops.map((s) => (
        <li key={s.slug}>
          <Link href={`/destinations/${s.slug}`} className="group flex flex-col items-center text-center">
            <span className="grid size-36 place-items-center rounded-full bg-white shadow-[0_18px_40px_-28px_rgb(42_36_27/0.5)] ring-1 ring-line transition-[translate,box-shadow] duration-500 ease-out-expo group-hover:-translate-y-1.5 group-hover:shadow-[0_28px_50px_-26px_rgb(42_36_27/0.55)] group-hover:ring-brass sm:size-44">
              <svg viewBox="0 0 96 96" aria-hidden className="size-24 text-ink sm:size-28">
                {icons[s.slug]}
              </svg>
            </span>
            <span className="mt-4 bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat pb-0.5 font-display text-[1.5rem] leading-tight font-medium transition-[color,background-size] duration-500 ease-out-expo group-hover:bg-[length:100%_1px] group-hover:text-gold sm:text-[1.75rem]">
              {s.name}
            </span>
            <span className="mt-1 text-[0.875rem] text-ink-soft">
              {s.drive} from Indore
              <span className="block font-semibold text-gold-deep">{s.villas === 1 ? "1 villa" : `${s.villas} villas`}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
