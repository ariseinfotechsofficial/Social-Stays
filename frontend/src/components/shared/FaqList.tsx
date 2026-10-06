"use client";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { Accordion } from "radix-ui";
import type { Faq } from "@/data/types";
import { cn } from "@/lib/utils";

/** Accordion of questions; the plus turns into a minus as the answer opens. */
export function FaqList({ items, className }: { items: Faq[]; className?: string }) {
  return (
    <Accordion.Root type="single" collapsible className={cn("border-t border-line", className)}>
      {items.map((item, i) => (
        <Accordion.Item key={item.q} value={`q${i}`} className="border-b border-line">
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-start justify-between gap-6 py-4.5 text-left">
              <span className="font-display text-[1.25rem] leading-snug font-medium sm:text-[1.375rem]">{item.q}</span>
              <span className="relative mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-line transition-colors duration-300 group-hover:border-ink group-data-[state=open]:border-gold group-data-[state=open]:bg-gold group-data-[state=open]:text-white">
                <PlusIcon className="size-4 transition-transform duration-500 ease-out-expo group-data-[state=open]:rotate-45" />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[accordion-up_300ms_var(--ease-out-expo)] data-[state=open]:animate-[accordion-down_400ms_var(--ease-out-expo)]">
            <p className="measure pr-12 pb-5 leading-relaxed text-ink-soft">{item.a}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
