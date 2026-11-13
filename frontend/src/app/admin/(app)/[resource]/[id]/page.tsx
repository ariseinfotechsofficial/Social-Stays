"use client";

import { notFound, useParams } from "next/navigation";
import { NoAccess } from "@admin/components/NoAccess";
import { ResourceEditor } from "@admin/components/resource/ResourceEditor";
import { useCan } from "@admin/lib/session";
import { RESOURCES } from "@admin/resources";

export default function ResourceEditPage() {
  const { resource, id } = useParams<{ resource: string; id: string }>();
  const can = useCan();
  const config = RESOURCES[resource];
  if (!config) notFound();
  if (!can(...config.perms)) return <NoAccess />;
  return <ResourceEditor key={`${resource}/${id}`} config={config} id={id} />;
}
