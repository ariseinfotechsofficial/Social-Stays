"use client";

import { WhatsappLogoIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { m, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { Dialog } from "radix-ui";
import { useEffect, useId, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { useSite } from "@/components/layout/SiteProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { openWhatsAppEnquiry } from "@/lib/whatsapp";

/** Closed or shown in this browser session: wait for the next visit */
const SEEN_KEY = "ss-welcome-seen";
/** Submitted on this device: never ask again */
const DONE_KEY = "ss-welcome-done";
const DELAY_MS = 1200;

// Also remembered in memory, for browsers that block storage
let shownThisLoad = false;

const ease = [0.16, 1, 0.3, 1] as const;

const inputClass =
  "w-full rounded-[4px] border border-field bg-white px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-soft/70 focus:border-gold focus:ring-1 focus:ring-gold aria-[invalid=true]:border-error";

const readFlag = (store: () => Storage, key: string) => {
  try {
    return store().getItem(key) === "1";
  } catch {
    return false;
  }
};
const writeFlag = (store: () => Storage, key: string) => {
  try {
    store().setItem(key, "1");
  } catch {
    /* storage blocked: the in-memory flag still covers this page load */
  }
};

/** 10-digit Indian mobile, accepting +91 / 91 / 0 in front and any spaces or dashes. */
function normalisePhone(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/**
 * Welcome pop-up: name + mobile → saved to the admin's Enquiries (form "welcome_popup") → WhatsApp opens.
 * Shown once per visit shortly after the site opens; never again on a device that has submitted it.
 */
export function WelcomePopup() {
  const id = useId();
  const site = useSite();
  const popup = site.welcomePopup;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    if (!popup.enabled || !site.whatsappNumber || shownThisLoad) return;
    if (readFlag(() => sessionStorage, SEEN_KEY) || readFlag(() => localStorage, DONE_KEY)) return;
    const timer = setTimeout(() => {
      shownThisLoad = true;
      writeFlag(() => sessionStorage, SEEN_KEY);
      setOpen(true);
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname, popup.enabled, site.whatsappNumber]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const mobile = normalisePhone(phone);
    const next = {
      name: cleanName.length < 2 ? "Please enter your name." : undefined,
      phone: mobile ? undefined : "Enter a 10-digit mobile number.",
    };
    setErrors(next);
    if (next.name || next.phone || !mobile) return;

    openWhatsAppEnquiry(
      { name: cleanName, phone: `+91${mobile}`, greeting: `Hello ${site.name}, I'd like to plan a stay.` },
      "welcome_popup",
      site.whatsappNumber,
      site.name,
    );
    writeFlag(() => localStorage, DONE_KEY);
    setOpen(false);
  };

  const title = popup.title || "Plan your getaway";
  const buttonLabel = popup.buttonLabel || "Let's connect on WhatsApp";

  return (
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
            <Dialog.Content asChild forceMount aria-describedby={popup.intro ? `${id}-intro` : undefined}>
              <m.div
                className="fixed top-1/2 left-1/2 z-[71] max-h-[92svh] w-[calc(100%-2rem)] max-w-[24rem] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[10px] bg-white px-6 pt-7 pb-6 shadow-[0_30px_80px_-30px_rgb(29_25_19/0.6)] sm:px-8 sm:pt-8"
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.5, ease }}
                data-lenis-prevent
              >
                <Dialog.Close className="absolute top-3 right-3 grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-sand hover:text-ink" aria-label="Close">
                  <XIcon className="size-[1.125rem]" />
                </Dialog.Close>

                <div className="text-center">
                  <Logo className="mx-auto h-11 w-fit" />
                  <Dialog.Title className="type-display-m mt-5">{title}</Dialog.Title>
                  {popup.intro && (
                    <p id={`${id}-intro`} className="mx-auto mt-2 max-w-[19rem] text-[0.9375rem] leading-relaxed text-balance text-ink-soft">
                      {popup.intro}
                    </p>
                  )}
                </div>

                <form onSubmit={submit} noValidate className="mt-6 space-y-3.5">
                  <div>
                    <label htmlFor={`${id}-name`} className="type-label text-ink-soft">
                      Your name
                    </label>
                    <input
                      id={`${id}-name`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      maxLength={120}
                      placeholder="Full name"
                      className={cn(inputClass, "mt-1.5")}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? `${id}-name-error` : undefined}
                    />
                    {errors.name && (
                      <p id={`${id}-name-error`} className="mt-1.5 text-[0.8125rem] font-medium text-error">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={`${id}-phone`} className="type-label text-ink-soft">
                      Mobile number
                    </label>
                    <div
                      className={cn(
                        "mt-1.5 flex items-stretch rounded-[4px] border border-field bg-white transition-colors focus-within:border-gold focus-within:ring-1 focus-within:ring-gold",
                        errors.phone && "border-error",
                      )}
                    >
                      <span className="grid place-items-center border-r border-line px-3.5 text-base text-ink-soft" aria-hidden>
                        +91
                      </span>
                      <input
                        id={`${id}-phone`}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        maxLength={16}
                        placeholder="98765 43210"
                        className="w-full min-w-0 rounded-r-[4px] bg-transparent px-3.5 py-3 text-base text-ink outline-none placeholder:text-ink-soft/70"
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? `${id}-phone-error` : undefined}
                      />
                    </div>
                    {errors.phone && (
                      <p id={`${id}-phone-error`} className="mt-1.5 text-[0.8125rem] font-medium text-error">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="mt-2 h-[3.25rem] w-full px-5" icon={<WhatsappLogoIcon weight="regular" className="size-5" />}>
                    {buttonLabel}
                  </Button>
                </form>

                {popup.note && <p className="mt-3.5 text-center text-[0.8125rem] text-balance text-ink-soft">{popup.note}</p>}
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
