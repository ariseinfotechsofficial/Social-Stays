"use client";

import { WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { useId, useState } from "react";
import type { DateRange } from "react-day-picker";
import { DatesField, GuestsField, SelectField } from "@/components/enquiry/fields";
import { Button } from "@/components/ui/Button";
import { destinations } from "@/data/destinations";
import { enquiryOccasions } from "@/data/occasions";
import { openWhatsAppEnquiry } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export type EnquiryPrefill = {
  villa?: { name: string; slug: string; destination: string; maxGuests: number };
  destination?: string;
  occasion?: string;
};

type Props = EnquiryPrefill & {
  /** "bar" = one row on large screens (home hero); "stack" = vertical card */
  layout?: "bar" | "stack";
  /** Where the form sits, sent with the tracking event */
  placement: string;
  submitLabel?: string;
  className?: string;
  onSubmitted?: () => void;
};

const destinationOptions = destinations.map((d) => ({ value: d.name, label: d.name }));
const occasionOptions = enquiryOccasions.map((o) => ({ value: o, label: o }));

/**
 * The enquiry flow from the brief: destination, dates, guests, occasion →
 * opens WhatsApp with a pre-filled message including the villa and traffic source.
 */
export function EnquiryForm({ villa, destination, occasion, layout = "stack", placement, submitLabel, className, onSubmitted }: Props) {
  const id = useId();
  const [dest, setDest] = useState(destination ?? "");
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(0);
  const [occ, setOcc] = useState(occasion ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    openWhatsAppEnquiry(
      {
        villa: villa ? { name: villa.name, slug: villa.slug, destination: villa.destination } : undefined,
        destination: villa ? undefined : dest || undefined,
        checkIn: range?.from,
        checkOut: range?.to,
        guests: guests || undefined,
        occasion: occ || undefined,
      },
      placement,
    );
    onSubmitted?.();
  };

  const bar = layout === "bar";
  const cell = bar
    ? "px-5 py-3.5 lg:px-6 lg:py-0 border-b border-line lg:border-b-0 lg:border-r"
    : "px-4 py-3 border-b border-line";

  return (
    <form
      onSubmit={submit}
      className={cn(
        "bg-white",
        bar ? "grid rounded-[6px] lg:h-[5.25rem] lg:grid-cols-[1.1fr_1.25fr_1.15fr_1.1fr_auto] lg:items-center lg:rounded-full lg:pl-3" : "flex flex-col",
        className,
      )}
      aria-label={villa ? `Enquire about ${villa.name}` : "Check availability"}
    >
      {!villa && (
        <SelectField
          id={`${id}-dest`}
          label="Destination"
          value={dest}
          onChange={setDest}
          options={destinationOptions}
          placeholder="Anywhere near Indore"
          className={cell}
        />
      )}
      <DatesField id={`${id}-dates`} range={range} onChange={setRange} className={cell} />
      <GuestsField id={`${id}-guests`} value={guests} onChange={setGuests} max={villa?.maxGuests ?? 30} className={cell} />
      <SelectField
        id={`${id}-occasion`}
        label="Occasion"
        value={occ}
        onChange={setOcc}
        options={occasionOptions}
        placeholder="Just a getaway"
        className={cn(cell, bar && "lg:border-r-0")}
      />
      <div className={cn(bar ? "p-3 lg:p-2" : "p-4 pt-5")}>
        <Button
          type="submit"
          size="lg"
          className={cn("w-full", bar && "lg:h-[4.25rem] lg:px-8")}
          icon={<WhatsappLogoIcon weight="regular" className="size-5" />}
        >
          {submitLabel ?? "Enquire on WhatsApp"}
        </Button>
      </div>
    </form>
  );
}
