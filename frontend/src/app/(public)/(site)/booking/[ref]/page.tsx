import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingView } from "@/components/booking/BookingView";
import { getContent, labels } from "@/lib/content";

export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };

/** The guest's private booking page, opened from the confirmation email or "Find my booking" */
export default async function BookingPage({ params, searchParams }: PageProps<"/booking/[ref]">) {
  const { ref } = await params;
  const { key } = await searchParams;
  if (typeof key !== "string" || !key) redirect(`/booking?ref=${encodeURIComponent(ref)}`);
  const t = labels(await getContent(), "booking");
  return (
    <div className="container-page pt-32 pb-16 lg:pt-36 lg:pb-24">
      <BookingView refCode={ref.toUpperCase()} accessKey={key} labels={{ confirmedBody: t.text("confirmedBody"), requestedBody: t.text("requestedBody") }} />
    </div>
  );
}
