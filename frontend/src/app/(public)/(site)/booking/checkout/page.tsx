import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Checkout, type CheckoutAddOn } from "@/components/booking/Checkout";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { getCancellation, getContent, getDestination, getVilla, labels } from "@/lib/content";
import { priceLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Book your stay", robots: { index: false, follow: false } };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export default async function CheckoutPage({ searchParams }: PageProps<"/booking/checkout">) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const c = await getContent();
  const villa = getVilla(c, one("villa") ?? "");
  // Only villas that take online bookings have a checkout; everyone else goes back to the villa page
  if (!villa || villa.status !== "live" || villa.bookingMode === "enquiry" || !c.settings.booking.available) redirect(villa ? `/villas/${villa.slug}` : "/villas");

  const destination = getDestination(c, villa.destination);
  const t = labels(c, "booking");
  const addOns: CheckoutAddOn[] = c.experiences
    .filter((e) => e.availableAt === "all" || e.availableAt.includes(villa.destination))
    .map((e) => ({ slug: e.slug, title: e.title, summary: e.summary, price: priceLabel(e.price), chargeType: e.chargeType, bookable: e.bookable && e.chargeType !== "on_request" }));
  const checkIn = one("in");
  const checkOut = one("out");

  return (
    <div className="container-page pt-26 pb-16 lg:pt-30 lg:pb-24">
      <Breadcrumbs
        items={[
          { label: "Stays", href: "/villas" },
          { label: villa.name, href: `/villas/${villa.slug}` },
          { label: "Book", href: `/booking/checkout?villa=${villa.slug}` },
        ]}
      />
      <h1 className="type-display-l mt-5">{t.text("checkoutTitle", "Confirm and pay")}</h1>
      <div className="mt-6">
        <Checkout
          villa={{
            slug: villa.slug,
            name: villa.name,
            destination: destination?.name ?? "",
            photo: villa.photos[0] ?? null,
            baseGuests: villa.guests.base,
            maxGuests: villa.guests.max,
            mode: villa.bookingMode === "instant" ? "instant" : "request",
            cancellation: getCancellation(c, villa.cancellation)?.summary ?? "",
          }}
          addOns={addOns}
          initial={{
            checkIn: checkIn && DAY.test(checkIn) ? checkIn : undefined,
            checkOut: checkOut && DAY.test(checkOut) ? checkOut : undefined,
            guests: Number(one("guests")) || undefined,
          }}
          labels={{
            title: t.text("checkoutTitle", "Confirm and pay"),
            intro: t.text("checkoutIntro"),
            requestIntro: t.text("requestIntro"),
            payLabel: t.text("payLabel", "Pay and confirm"),
            submitRequestLabel: t.text("submitRequestLabel", "Send booking request"),
            termsNote: c.settings.booking.termsNote || t.text("termsNote", "By booking you agree to our terms of stay and the villa's cancellation policy."),
          }}
          occasions={c.settings.enquiry.occasions}
        />
      </div>
    </div>
  );
}
