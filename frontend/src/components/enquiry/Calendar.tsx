"use client";

import { addDays, startOfToday } from "date-fns";
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

/** Range picker for stay dates: past days disabled, one month on phones, two on wider screens. */
export function Calendar({ range, onSelect }: { range: DateRange | undefined; onSelect: (range: DateRange | undefined) => void }) {
  const wide = useIsWide();
  const today = startOfToday();
  return (
    <DayPicker
      className="ss-calendar"
      mode="range"
      numberOfMonths={wide ? 2 : 1}
      selected={range}
      onSelect={onSelect}
      disabled={{ before: today }}
      startMonth={today}
      endMonth={addDays(today, 365)}
      excludeDisabled
      min={1}
    />
  );
}
