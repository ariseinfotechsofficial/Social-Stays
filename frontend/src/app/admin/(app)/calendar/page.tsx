"use client";

import { AvailabilityCalendar } from "@admin/components/calendar/AvailabilityCalendar";
import { NoAccess } from "@admin/components/NoAccess";
import { PageHeader } from "@admin/components/ui/layout";
import { useCan } from "@admin/lib/session";

export default function CalendarPage() {
  const can = useCan();
  if (!can("calendar")) return <NoAccess />;
  return (
    <>
      <PageHeader title="Calendar" description="Your team's record of which nights each villa is taken. Click a free night to block it, or a block to lift it. The website doesn't show this." />
      <AvailabilityCalendar endpoint="/admin/calendar" blocksEndpoint="/admin/calendar/blocks" />
    </>
  );
}
