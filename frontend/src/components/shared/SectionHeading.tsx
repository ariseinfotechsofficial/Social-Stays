import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
  as?: "h1" | "h2";
  size?: "l" | "m";
  className?: string;
  tone?: "dark" | "light";
};

/** Left-aligned display heading with an optional short intro and a link on the right. */
export function SectionHeading({ title, intro, action, as: Tag = "h2", size = "l", className, tone = "dark" }: Props) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10", className)}>
      <div className="max-w-3xl">
        <Tag className={size === "l" ? "type-display-l" : "type-display-m"}>{title}</Tag>
        {intro && <p className={cn("type-lead mt-4 max-w-2xl", tone === "light" ? "text-sand/80" : "text-ink-soft")}>{intro}</p>}
      </div>
      {action && <div className="shrink-0 md:pb-1.5">{action}</div>}
    </div>
  );
}
