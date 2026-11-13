"use client";

import { AvailabilityCalendar } from "@admin/components/calendar/AvailabilityCalendar";
import { NoAccess } from "@admin/components/NoAccess";
import { PageHeader } from "@admin/components/ui/layout";
import { useCan } from "@admin/lib/session";

export default function CalendarPage() {
  const can = useCan();
  if (!can("bookings")) return <NoAccess />;
  return (
    <>
      <PageHeader title="Calendar" description="Every villa's booked, held and blocked nights. Click a free night to block it, a booking to open it, or a block to lift it." />
      <AvailabilityCalendar endpoint="/admin/calendar" blocksEndpoint="/admin/calendar/blocks" bookingHref={(id) => `/admin/bookings/${id}`} />
    </>
  );
}
