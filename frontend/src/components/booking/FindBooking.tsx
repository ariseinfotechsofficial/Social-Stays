"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError, api } from "@/lib/api";
import { bookingUrl } from "@/lib/booking";

const inputClass = "mt-2 w-full rounded-[4px] border border-field bg-white px-4 py-3.5 text-base outline-none focus:border-gold focus:ring-1 focus:ring-gold";

/** Reference + phone number → the guest's booking page */
export function FindBooking({ initialRef }: { initialRef?: string }) {
  const router = useRouter();
  const [ref, setRef] = useState(initialRef ?? "");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await api<{ ref: string; key: string }>("/bookings/lookup", { method: "POST", json: { ref: ref.trim(), phone: phone.trim() } });
      router.push(bookingUrl(r.ref, r.key));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-[8px] border border-line p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-8">
      <div>
        <label htmlFor="fb-ref" className="font-semibold">
          Booking reference
        </label>
        <input id="fb-ref" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder="SS-XXXXXX" className={inputClass} required />
      </div>
      <div>
        <label htmlFor="fb-phone" className="font-semibold">
          Mobile number
        </label>
        <input id="fb-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91" className={inputClass} required />
      </div>
      <Button type="submit" size="lg" disabled={busy}>
        Find booking
      </Button>
      {error && (
        <p className="font-medium text-error sm:col-span-3" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
