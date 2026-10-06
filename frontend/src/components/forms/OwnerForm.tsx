"use client";

import { CheckCircleIcon, CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { getAttribution } from "@/lib/attribution";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Errors = Partial<Record<"name" | "phone" | "location" | "rooms" | "photos", string>>;

const inputClass =
  "mt-2 w-full rounded-[4px] border border-field bg-white px-4 py-3.5 text-base text-ink outline-none transition-colors placeholder:text-ink-soft/80 focus:border-gold focus:ring-1 focus:ring-gold aria-[invalid=true]:border-error";

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-[0.875rem] text-ink-soft">{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-[0.875rem] font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** Owner partnership lead form from the brief: name, location, rooms, photos link → /api/owner-leads. */
export function OwnerForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries()) as Record<string, string>;
    const next: Errors = {};
    if (!data.name?.trim()) next.name = "Enter your name.";
    if (!/^[+\d][\d\s-]{9,}$/.test(data.phone?.trim() ?? "")) next.phone = "Enter a 10-digit mobile number.";
    if (!data.location?.trim()) next.location = "Enter the village or town the property is in.";
    if (!(Number(data.rooms) > 0)) next.rooms = "Enter the number of bedrooms.";
    if (data.photos && !/^https?:\/\//.test(data.photos.trim())) next.photos = "Paste a full link starting with https://";
    setErrors(next);
    if (Object.keys(next).length) return;

    setState("sending");
    try {
      const res = await fetch("/api/owner-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: getAttribution().source, page: window.location.pathname }),
      });
      if (!res.ok) throw new Error(String(res.status));
      track("owner_lead", { rooms: Number(data.rooms) });
      setState("sent");
    } catch {
      setState("failed");
    }
  };

  if (state === "sent") {
    return (
      <div className="rounded-[8px] bg-white p-8 sm:p-10" role="status">
        <CheckCircleIcon weight="light" className="size-12 text-gold" />
        <h3 className="type-display-m mt-5">Thank you, we have your details</h3>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Someone from our partnerships team will call you within two working days to talk about your property and arrange a visit.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-[8px] bg-white p-6 sm:p-10">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="owner-name" label="Your name" error={errors.name}>
          <input id="owner-name" name="name" autoComplete="name" className={inputClass} aria-invalid={!!errors.name} aria-describedby={errors.name ? "owner-name-error" : undefined} />
        </Field>
        <Field id="owner-phone" label="Mobile number" error={errors.phone}>
          <input id="owner-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91" className={inputClass} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "owner-phone-error" : undefined} />
        </Field>
        <Field id="owner-location" label="Property location" hint="Village or town, and the nearest destination" error={errors.location}>
          <input id="owner-location" name="location" placeholder="e.g. Simrol, near Jaam Gate" className={inputClass} aria-invalid={!!errors.location} aria-describedby={errors.location ? "owner-location-error" : undefined} />
        </Field>
        <Field id="owner-rooms" label="Bedrooms" hint="With attached bathrooms" error={errors.rooms}>
          <input id="owner-rooms" name="rooms" type="number" min={1} inputMode="numeric" className={inputClass} aria-invalid={!!errors.rooms} aria-describedby={errors.rooms ? "owner-rooms-error" : undefined} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="owner-photos" label="Link to photos" hint="Google Drive, Google Photos or Instagram. Optional, but it helps." error={errors.photos}>
            <input id="owner-photos" name="photos" type="url" inputMode="url" placeholder="https://" className={inputClass} aria-invalid={!!errors.photos} aria-describedby={errors.photos ? "owner-photos-error" : undefined} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="owner-note" label="Anything else we should know?">
            <textarea id="owner-note" name="note" rows={4} className={cn(inputClass, "resize-y")} />
          </Field>
        </div>
      </div>
      {state === "failed" && (
        <p className="mt-6 font-medium text-error" role="alert">
          That didn&apos;t send. Check your connection and try again, or message us on WhatsApp.
        </p>
      )}
      <Button type="submit" size="lg" className="mt-8 w-full sm:w-auto" disabled={state === "sending"} icon={state === "sending" ? <CircleNotchIcon className="size-5 animate-spin" /> : undefined}>
        {state === "sending" ? "Sending" : "Send property details"}
      </Button>
      <p className="mt-4 text-[0.8125rem] text-ink-soft">We use these details only to get in touch about a partnership.</p>
    </form>
  );
}
