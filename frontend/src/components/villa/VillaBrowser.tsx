"use client";

import { CheckIcon, MinusIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { m, AnimatePresence } from "motion/react";
import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { DestinationSlug, Villa } from "@/data/types";
import { cn } from "@/lib/utils";

export const defaultFilters: Filters = { destination: "all", guests: 0, pool: false, pets: false, sort: "recommended" };

const SORTS = ["recommended", "price-asc", "price-desc", "guests"] as const;

const SEARCH_EVENT = "ss:villa-filters";

function subscribeToSearch(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(SEARCH_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(SEARCH_EVENT, onChange);
  };
}

/** Reads filters from a shared link like /villas?destination=mandu&pool=1 */
function filtersFromSearch(search: string, valid: string[]): Filters {
  const p = new URLSearchParams(search);
  const destination = p.get("destination");
  const sort = p.get("sort");
  return {
    destination: destination && valid.includes(destination) ? (destination as DestinationSlug) : "all",
    guests: Math.min(24, Math.max(0, Number(p.get("guests")) || 0)),
    pool: p.get("pool") === "1",
    pets: p.get("pets") === "1",
    sort: SORTS.includes(sort as Filters["sort"]) ? (sort as Filters["sort"]) : "recommended",
  };
}

export type Filters = {
  destination: DestinationSlug | "all";
  guests: number;
  pool: boolean;
  pets: boolean;
  sort: "recommended" | "price-asc" | "price-desc" | "guests";
};

const ease = [0.16, 1, 0.3, 1] as const;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[0.9375rem] font-medium whitespace-nowrap transition-colors duration-300",
        active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
      className="inline-flex h-10 items-center gap-2.5 text-[0.9375rem] font-medium whitespace-nowrap text-ink"
    >
      <span
        className={cn(
          "grid size-5 place-items-center rounded-[4px] border transition-colors duration-200",
          active ? "border-gold bg-gold text-white" : "border-field bg-white",
        )}
      >
        {active && <CheckIcon weight="bold" className="size-3" />}
      </span>
      {children}
    </button>
  );
}

/**
 * Villas listing with the brief's filters: destination, guests, private pool, pet-friendly.
 * Filters live in the URL so a filtered list can be shared on WhatsApp.
 */
export function VillaBrowser({
  villas,
  destinations,
  children,
}: {
  villas: Villa[];
  destinations: { slug: DestinationSlug; name: string }[];
  /** Pre-rendered cards keyed by slug (server components) */
  children: Record<string, ReactNode>;
}) {
  // Filters live in the URL. The server renders every villa (good for search engines);
  // a shared link like ?destination=mandu applies once the page hydrates.
  const search = useSyncExternalStore(subscribeToSearch, () => window.location.search, () => "");
  const slugs = useMemo(() => destinations.map((d) => d.slug), [destinations]);
  const f = useMemo(() => (search ? filtersFromSearch(search, slugs) : defaultFilters), [search, slugs]);

  const update = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    const params = new URLSearchParams();
    if (next.destination !== "all") params.set("destination", next.destination);
    if (next.guests) params.set("guests", String(next.guests));
    if (next.pool) params.set("pool", "1");
    if (next.pets) params.set("pets", "1");
    if (next.sort !== "recommended") params.set("sort", next.sort);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    window.dispatchEvent(new Event(SEARCH_EVENT));
  };

  const results = useMemo(() => {
    const list = villas.filter(
      (v) =>
        (f.destination === "all" || v.destination === f.destination) &&
        (!f.guests || v.guests.max >= f.guests) &&
        (!f.pool || v.privatePool) &&
        (!f.pets || v.petFriendly),
    );
    const live = (v: Villa) => (v.status === "live" ? 0 : 1);
    return [...list].sort((a, b) => {
      if (live(a) !== live(b)) return live(a) - live(b);
      if (f.sort === "price-asc") return a.priceFrom - b.priceFrom;
      if (f.sort === "price-desc") return b.priceFrom - a.priceFrom;
      if (f.sort === "guests") return b.guests.max - a.guests.max;
      return 0;
    });
  }, [villas, f]);

  const reset = () => update({ destination: "all", guests: 0, pool: false, pets: false });
  const filtered = f.destination !== "all" || f.guests > 0 || f.pool || f.pets;

  return (
    <>
      <div className="sticky top-[4.5rem] z-30 border-y border-line bg-white/95 backdrop-blur-md lg:top-20">
        <div className="container-page flex flex-col gap-2.5 py-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0" role="group" aria-label="Destination">
            <Chip active={f.destination === "all"} onClick={() => update({ destination: "all" })}>
              All destinations
            </Chip>
            {destinations.map((d) => (
              <Chip key={d.slug} active={f.destination === d.slug} onClick={() => update({ destination: d.slug })}>
                {d.name}
              </Chip>
            ))}
          </div>

          <div className="no-scrollbar -mx-5 flex items-center gap-6 overflow-x-auto px-5 md:mx-0 md:px-0">
            <div className="flex items-center gap-2.5" role="group" aria-label="Minimum guests">
              <span className="text-[0.9375rem] font-medium whitespace-nowrap">Guests</span>
              <button
                type="button"
                aria-label="Fewer guests"
                disabled={!f.guests}
                onClick={() => update({ guests: Math.max(0, f.guests - 2) })}
                className="grid size-8 place-items-center rounded-full border border-field disabled:opacity-35"
              >
                <MinusIcon className="size-3.5" />
              </button>
              <output aria-live="polite" className="w-8 text-center text-[0.9375rem] font-semibold tabular-nums">
                {f.guests ? `${f.guests}+` : "Any"}
              </output>
              <button
                type="button"
                aria-label="More guests"
                disabled={f.guests >= 24}
                onClick={() => update({ guests: f.guests ? f.guests + 2 : 4 })}
                className="grid size-8 place-items-center rounded-full border border-field disabled:opacity-35"
              >
                <PlusIcon className="size-3.5" />
              </button>
            </div>
            <Toggle active={f.pool} onClick={() => update({ pool: !f.pool })}>
              Private pool
            </Toggle>
            <Toggle active={f.pets} onClick={() => update({ pets: !f.pets })}>
              Pet-friendly
            </Toggle>
            <label className="flex items-center gap-2 text-[0.9375rem] font-medium whitespace-nowrap">
              <span className="sr-only lg:not-sr-only">Sort</span>
              <select
                value={f.sort}
                onChange={(e) => update({ sort: e.target.value as Filters["sort"] })}
                className="h-10 rounded-full border border-line bg-white pr-8 pl-4 text-[0.9375rem]"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="guests">Most guests</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="container-page pt-7 pb-16 lg:pt-9 lg:pb-24">
        <div className="mb-6 flex items-center justify-between gap-4" aria-live="polite">
          <p className="text-ink-soft">
            {results.length === 1 ? "1 villa" : `${results.length} villas`}
            {f.destination !== "all" && ` in ${destinations.find((d) => d.slug === f.destination)?.name}`}
          </p>
          {filtered && (
            <button type="button" onClick={reset} className="text-[0.9375rem] font-semibold text-gold-deep underline-offset-4 hover:underline">
              Clear filters
            </button>
          )}
        </div>

        <h2 className="sr-only">Villas</h2>
        {results.length ? (
          <m.ul layout className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
            <AnimatePresence mode="popLayout" initial={false}>
              {results.map((v) => (
                <m.li
                  key={v.slug}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.6, ease }}
                >
                  {children[v.slug]}
                </m.li>
              ))}
            </AnimatePresence>
          </m.ul>
        ) : (
          <div className="rounded-[8px] bg-sand px-6 py-16 text-center">
            <p className="type-display-m">No villa matches all of that yet.</p>
            <p className="mx-auto mt-3 max-w-md text-ink-soft">
              Try fewer filters, or tell us what you need on WhatsApp. New villas join the collection every month.
            </p>
            <button type="button" onClick={reset} className="mt-6 font-semibold text-gold-deep underline underline-offset-4">
              Show all villas
            </button>
          </div>
        )}
      </div>
    </>
  );
}
