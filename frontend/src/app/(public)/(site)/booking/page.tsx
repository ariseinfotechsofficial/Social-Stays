import type { Metadata } from "next";
import { FindBooking } from "@/components/booking/FindBooking";
import { PageHeader } from "@/components/shared/PageHeader";
import { getContent, labels } from "@/lib/content";

export const metadata: Metadata = { title: "Find my booking", robots: { index: false, follow: true } };

export default async function FindBookingPage({ searchParams }: PageProps<"/booking">) {
  const { ref } = await searchParams;
  const t = labels(await getContent(), "booking");
  return (
    <>
      <PageHeader crumbs={[{ label: "Find my booking", href: "/booking" }]} title="Find my booking" intro={t.text("manageIntro", "Enter your booking reference and the phone number you booked with.")} />
      <section className="container-page pb-16 lg:pb-24">
        <FindBooking initialRef={typeof ref === "string" ? ref : undefined} />
      </section>
    </>
  );
}
