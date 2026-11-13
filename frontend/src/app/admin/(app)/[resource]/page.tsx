"use client";

import { notFound, useParams } from "next/navigation";
import { NoAccess } from "@admin/components/NoAccess";
import { ResourceList } from "@admin/components/resource/ResourceList";
import { useCan } from "@admin/lib/session";
import { RESOURCES } from "@admin/resources";

export default function ResourceListPage() {
  const { resource } = useParams<{ resource: string }>();
  const can = useCan();
  const config = RESOURCES[resource];
  if (!config) notFound();
  if (!can(...config.perms)) return <NoAccess />;
  return <ResourceList key={resource} config={config} />;
}
