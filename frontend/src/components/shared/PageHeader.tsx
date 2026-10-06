import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/shared/Breadcrumbs";
import { cn } from "@/lib/utils";

/**
 * Opening for pages without a photo hero: breadcrumb, then the title and intro side by side
 * on large screens, so the first screen is content rather than empty space.
 */
export function PageHeader({
  crumbs,
  title,
  intro,
  aside,
  className,
}: {
  crumbs: Crumb[];
  title: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("container-page pt-26 pb-8 lg:pt-30 lg:pb-12", className)}>
      <Breadcrumbs items={crumbs} />
      <div className="mt-5 grid gap-4 lg:mt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <h1 className="type-display-xl">{title}</h1>
        {(intro || aside) && (
          <div className="lg:pb-2">
            {intro && <p className="type-lead max-w-xl text-ink-soft">{intro}</p>}
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}
