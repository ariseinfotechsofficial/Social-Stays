"use client";

import { addDays, format, startOfToday } from "date-fns";
import { useEffect, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";

function useIsWide() {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 48rem)").matches);
  useEffect(() => {
    const q = window.matchMedia("(min-width: 48rem)");
    const update = () => setWide(q.matches);
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  return wide;
}

const key = (d: Date) => format(d, "yyyy-MM-dd");

/**
 * Range picker for stay dates: past days disabled, one month on phones, two on wider screens.
 * `unavailable` holds booked nights ("yyyy-MM-dd"). Once a check-in is picked, the first booked
 * night after it stays selectable as the check-out, since guests leave the morning the next stay begins.
 */
export function Calendar({
  range,
  onSelect,
  unavailable,
  months,
}: {
  range: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  unavailable?: Set<string>;
  months?: 1 | 2;
}) {
  const wide = useIsWide();
  const today = startOfToday();

  let firstBlockedAfter: string | undefined;
  if (unavailable?.size && range?.from && !range.to) {
    for (let d = addDays(range.from, 1); d < addDays(range.from, 400); d = addDays(d, 1)) {
      if (unavailable.has(key(d))) {
        firstBlockedAfter = key(d);
        break;
      }
    }
  }

  return (
    <DayPicker
      className="ss-calendar"
      mode="range"
      numberOfMonths={months ?? (wide ? 2 : 1)}
      selected={range}
      onSelect={onSelect}
      disabled={[{ before: today }, (day: Date) => Boolean(unavailable?.has(key(day)) && key(day) !== firstBlockedAfter)]}
      modifiers={{ booked: (day: Date) => Boolean(unavailable?.has(key(day))) }}
      modifiersClassNames={{ booked: "ss-booked" }}
      startMonth={today}
      endMonth={addDays(today, 365)}
      excludeDisabled
      min={1}
    />
  );
}
