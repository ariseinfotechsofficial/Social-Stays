"use client";

import { XIcon } from "@phosphor-icons/react";
import { Dialog as RDialog, DropdownMenu } from "radix-ui";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Button } from "@admin/components/ui/button";
import { cn } from "@admin/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-night/45 backdrop-blur-[1px]" />
        <RDialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[90svh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[14px] bg-white shadow-2xl",
            { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size],
          )}
          aria-describedby={description ? undefined : undefined}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <RDialog.Title className="type-heading">{title}</RDialog.Title>
              {description ? <RDialog.Description className="mt-1 text-[0.875rem] text-ink-soft">{description}</RDialog.Description> : <RDialog.Description className="sr-only">{String(title)}</RDialog.Description>}
            </div>
            <RDialog.Close className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full hover:bg-sand" aria-label="Close">
              <XIcon className="size-4.5" />
            </RDialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/** Side panel for viewing a record without leaving the list */
export function Drawer({ open, onOpenChange, title, children, footer }: { open: boolean; onOpenChange: (o: boolean) => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-night/35" />
        <RDialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl" aria-describedby={undefined}>
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <RDialog.Title className="type-heading min-w-0 truncate">{title}</RDialog.Title>
            <RDialog.Close className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-sand" aria-label="Close">
              <XIcon className="size-4.5" />
            </RDialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/* ---------- Confirm ---------- */

type ConfirmOptions = { title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean };
const ConfirmContext = createContext<(o: ConfirmOptions) => Promise<boolean>>(async () => false);

/** `const confirm = useConfirm(); if (await confirm({ title: "Delete?" })) …` */
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(v: boolean) => void>(undefined);
  const confirm = useCallback(
    (o: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setOpts(o);
      }),
    [],
  );
  const close = (v: boolean) => {
    resolver.current?.(v);
    setOpts(null);
  };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={Boolean(opts)}
        onOpenChange={(o) => !o && close(false)}
        title={opts?.title ?? ""}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button variant={opts?.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>
              {opts?.confirmLabel ?? "Confirm"}
            </Button>
          </>
        }
      >
        {opts?.body && <div className="text-[0.9375rem] text-ink-soft">{opts.body}</div>}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

/* ---------- Menu ---------- */

export function Menu({ trigger, items, align = "end" }: { trigger: ReactNode; items: ({ label: ReactNode; onSelect: () => void; danger?: boolean; icon?: ReactNode } | "separator" | null | false | undefined)[]; align?: "start" | "end" }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align={align} sideOffset={6} className="z-50 min-w-48 rounded-[10px] border border-line bg-white p-1 shadow-xl">
          {items.filter(Boolean).map((item, i) =>
            item === "separator" ? (
              <DropdownMenu.Separator key={i} className="my-1 h-px bg-line" />
            ) : (
              <DropdownMenu.Item
                key={i}
                onSelect={(item as { onSelect: () => void }).onSelect}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-[6px] px-3 py-2 text-[0.875rem] outline-none data-[highlighted]:bg-sand",
                  (item as { danger?: boolean }).danger && "text-error",
                )}
              >
                {(item as { icon?: ReactNode }).icon}
                {(item as { label: ReactNode }).label}
              </DropdownMenu.Item>
            ),
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
