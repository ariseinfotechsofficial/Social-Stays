"use client";

import { XIcon } from "@phosphor-icons/react/dist/ssr";
import { m, AnimatePresence } from "motion/react";
import { Dialog } from "radix-ui";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { EnquiryForm, type EnquiryPrefill } from "@/components/enquiry/EnquiryForm";
import { site } from "@/lib/site";

type Ctx = { openEnquiry: (prefill?: EnquiryPrefill & { title?: string }) => void };

const EnquiryContext = createContext<Ctx>({ openEnquiry: () => {} });

export const useEnquiry = () => useContext(EnquiryContext);

const ease = [0.16, 1, 0.3, 1] as const;

/** One enquiry dialog for the whole site, opened from the header, CTAs and celebration pages. */
export function EnquiryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<EnquiryPrefill & { title?: string }>({});

  const openEnquiry = useCallback((next: EnquiryPrefill & { title?: string } = {}) => {
    setPrefill(next);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openEnquiry }), [openEnquiry]);

  return (
    <EnquiryContext.Provider value={value}>
      {children}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <m.div
                  className="fixed inset-0 z-[70] bg-night/55 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <m.div
                  className="fixed inset-x-0 bottom-0 z-[71] max-h-[92svh] overflow-y-auto rounded-t-[14px] bg-white sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[30rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[8px]"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ duration: 0.5, ease }}
                  data-lenis-prevent
                >
                  <div className="flex items-start justify-between gap-6 px-5 pt-6 pb-2">
                    <div>
                      <Dialog.Title className="type-display-m">{prefill.title ?? "Plan your stay"}</Dialog.Title>
                      <p className="mt-1 text-[0.9375rem] text-ink-soft">
                        {prefill.villa ? `${prefill.villa.name}, ${prefill.villa.destination}` : "Tell us a little; we'll suggest the right villa."}
                      </p>
                    </div>
                    <Dialog.Close className="-mt-1 -mr-1 grid size-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-sand" aria-label="Close">
                      <XIcon className="size-5" />
                    </Dialog.Close>
                  </div>
                  <EnquiryForm {...prefill} placement="enquiry_dialog" onSubmitted={() => setOpen(false)} />
                  <p className="px-5 pb-6 text-[0.8125rem] text-ink-soft">No payment needed to enquire. {site.replyHours}</p>
                </m.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </EnquiryContext.Provider>
  );
}

/** A button anywhere on the page that opens the enquiry dialog. */
export function EnquireTrigger({
  children,
  className,
  prefill,
}: {
  children: ReactNode;
  className?: string;
  prefill?: EnquiryPrefill & { title?: string };
}) {
  const { openEnquiry } = useEnquiry();
  return (
    <button type="button" className={className} onClick={() => openEnquiry(prefill)}>
      {children}
    </button>
  );
}
