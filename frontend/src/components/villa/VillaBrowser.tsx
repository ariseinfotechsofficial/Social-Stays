"use client";

import { m, AnimatePresence } from "motion/react";
import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { Rail } from "@/components/villa/VillaCarousel";
import type { Villa, VillaCategory } from "@/data/types";
import { cn } from "@/lib/utils";

/** "12+ guests" chip */
const BIG_GROUP = 12;

const SEARCH_EVENT = "ss:villa-filters";

function subscribeToSearch(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(SEARCH_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(SEARCH_EVENT, onChange);
  };
}

export type Filters = {
  category: VillaCategory | "all";
  big: boolean;
  pool: boolean;
  pets: boolean;
};

const defaultFilters: Filters = { category: "all", big: false, pool: false, pets: false };

/** Reads filters from a shared link like /villas?category=luxury&pool=1 */
function filtersFromSearch(search: string): Filters {
  const p = new URLSearchParams(search);
  // "value" was the old name for budget; older shared links still use it
  const category = p.get("category") === "value" ? "budget" : p.get("category");
  return {
    category: category === "luxury" || category === "budget" ? category : "all",
    big: p.get("guests") === String(BIG_GROUP),
    pool: p.get("pool") === "1",
    pets: p.get("pets") === "1",
  };
}

const ease = [0.16, 1, 0.3, 1] as const;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 items-center rounded-full border px-5 text-[0.9375rem] font-medium whitespace-nowrap transition-colors duration-300",
        active ? "border-gold bg-gold text-white" : "border-line bg-white text-ink hover:border-gold",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Villas listing: title on the left, one row of filter chips on the right,
 * then one band per category (Luxury, Budget), each a sideways-scrolling rail of cards.
 * Filters live in the URL so a filtered list can be shared on WhatsApp.
 */
export function VillaBrowser({
  villas,
  heading,
  intro,
  categories,
  children,
}: {
  villas: Villa[];
  heading: string;
  intro: string;
  categories: { slug: VillaCategory; label: string; short: string; blurb: string }[];
  /** Pre-rendered cards keyed by slug (server components) */
  children: Record<string, ReactNode>;
}) {
  // The server renders every villa (good for search engines); a shared link applies once the page hydrates.
  const search = useSyncExternalStore(subscribeToSearch, () => window.location.search, () => "");
  const f = useMemo(() => (search ? filtersFromSearch(search) : defaultFilters), [search]);

  const update = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    const params = new URLSearchParams();
    if (next.category !== "all") params.set("category", next.category);
    if (next.big) params.set("guests", String(BIG_GROUP));
    if (next.pool) params.set("pool", "1");
    if (next.pets) params.set("pets", "1");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    window.dispatchEvent(new Event(SEARCH_EVENT));
  };

  const results = useMemo(() => {
    const list = villas.filter(
      (v) =>
        (f.category === "all" || v.category === f.category) &&
        (!f.big || v.guests.max >= BIG_GROUP) &&
        (!f.pool || v.privatePool) &&
        (!f.pets || v.petFriendly),
    );
    const live = (v: Villa) => (v.status === "live" ? 0 : 1);
    return [...list].sort((a, b) => live(a) - live(b));
  }, [villas, f]);

  // One section per category, in the order given; empty ones are left out
  const sections = categories.map((category) => ({ category, list: results.filter((v) => v.category === category.slug) })).filter((s) => s.list.length);

  const filtered = f.category !== "all" || f.big || f.pool || f.pets;
  const reset = () => update(defaultFilters);

  return (
    <div className="container-page pb-16 lg:pb-24">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="mt-5 lg:mt-6">
          <h1 className="type-display-xl">{heading}</h1>
          <p className="mt-3 max-w-xl text-ink-soft">{intro}</p>
        </div>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0 lg:justify-end" role="group" aria-label="Filter villas">
          <Chip active={!filtered} onClick={reset}>
            All
          </Chip>
          {categories.map((c) => (
            <Chip key={c.slug} active={f.category === c.slug} onClick={() => update({ category: f.category === c.slug ? "all" : c.slug })}>
              {c.short}
            </Chip>
          ))}
          <Chip active={f.pool} onClick={() => update({ pool: !f.pool })}>
            Private pool
          </Chip>
          <Chip active={f.big} onClick={() => update({ big: !f.big })}>
            {BIG_GROUP}+ guests
          </Chip>
          <Chip active={f.pets} onClick={() => update({ pets: !f.pets })}>
            Pet friendly
          </Chip>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {results.length === 1 ? "1 villa" : `${results.length} villas`}
      </p>

      {results.length ? (
        <div className="mt-8 lg:mt-10">
          <AnimatePresence mode="popLayout" initial={false}>
            {sections.map(({ category, list }) => (
              <m.section
                key={category.slug}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.6, ease }}
                aria-labelledby={`cat-${category.slug}`}
                className="border-t border-line py-8 first:border-t-0 first:pt-0 lg:py-10"
              >
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <h2 id={`cat-${category.slug}`} className="type-display-l">
                      {category.label}
                    </h2>
                    <p className="mt-1 max-w-2xl text-[0.9375rem] text-ink-soft">{category.blurb}</p>
                  </div>
                  <p className="shrink-0 text-[0.9375rem] text-ink-soft">{list.length === 1 ? "1 villa" : `${list.length} villas`}</p>
                </div>
                {/* Keyed by the villas shown, so a new filter starts the rail from the first card */}
                <Rail key={list.map((v) => v.slug).join()} label={category.label}>
                  {list.map((v) => children[v.slug])}
                </Rail>
              </m.section>
            ))}
          </AnimatePresence>
        </div>
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
  );
}
