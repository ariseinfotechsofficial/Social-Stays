"use client";

import { AvailabilityCalendar } from "@admin/components/calendar/AvailabilityCalendar";
import { PageHeader } from "@admin/components/ui/layout";
import { OwnerOnly } from "../OwnerOnly";

export default function OwnerCalendarPage() {
  return (
    <OwnerOnly>
      <PageHeader title="Calendar" description="Guest stays and blocked dates at your villas. Click a free night to keep it for your family; click your own block to open the dates again." />
      <AvailabilityCalendar endpoint="/owner/calendar" blocksEndpoint="/owner/blocks" ownerMode />
    </OwnerOnly>
  );
}
