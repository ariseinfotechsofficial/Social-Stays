import { CheckIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { bookingSteps } from "@/data/company";

/** A stylised WhatsApp thread showing exactly what the enquiry form sends. */
function ChatPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[24rem] rounded-[28px] border border-line bg-white p-3 shadow-[0_40px_80px_-50px_rgb(29_25_19/0.6)]">
      <div className="flex items-center gap-3 rounded-t-[20px] bg-sand px-4 py-3">
        <span className="grid size-9 place-items-center rounded-full bg-gold text-white">
          <WhatsappLogoIcon className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="text-[0.9375rem] font-semibold">Social Stays</p>
          <p className="text-[0.75rem] text-ink-soft">Usually replies within 30 minutes</p>
        </div>
      </div>
      <div className="space-y-3 rounded-b-[20px] bg-sand-deep/70 px-3 py-5 text-[0.875rem] leading-relaxed">
        <div className="ml-auto max-w-[85%] rounded-[14px] rounded-tr-[4px] bg-white px-4 py-3 shadow-[0_1px_0_rgb(42_36_27/0.06)]">
          <p>Hello Social Stays, I&apos;d like to check availability.</p>
          <p className="mt-2">
            Villa: Amaltas House, Jaam Gate
            <br />
            Dates: Fri 14 Nov – Sun 16 Nov (2 nights)
            <br />
            Guests: 10
            <br />
            Occasion: Birthday
          </p>
          <p className="mt-2 text-ink-soft">Source: Instagram ad</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[0.6875rem] text-ink-soft">
            7:42 pm <CheckIcon className="size-3" />
            <CheckIcon className="-ml-2 size-3" />
          </p>
        </div>
        <div className="max-w-[85%] rounded-[14px] rounded-tl-[4px] bg-white px-4 py-3">
          <p>
            Hi Priya! Amaltas House is free on 14–16 Nov. For 10 guests it&apos;s ₹45,000 for two nights, breakfast included.
            Shall I add the birthday décor and a barbecue dinner?
          </p>
          <p className="mt-1 text-right text-[0.6875rem] text-ink-soft">7:58 pm</p>
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="section-y overflow-hidden bg-sand">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16 xl:gap-20">
        <div>
          <h2 className="type-display-l max-w-[20ch]">Booking takes one WhatsApp message</h2>
          <p className="type-lead mt-5 max-w-xl text-ink-soft">
            No accounts, no payment forms. Tell us your dates and we send one clear quote, usually within half an hour.
          </p>
          {/* A real sequence, so it is numbered; two columns keep it compact */}
          <ol className="mt-8 grid gap-x-10 sm:grid-cols-2">
            {bookingSteps.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[2.25rem_1fr] gap-3 border-t border-ink/12 py-5">
                <span className="font-display text-[1.625rem] leading-none font-medium text-gold-deep lining-nums tabular-nums">{i + 1}</span>
                <div>
                  <h3 className="font-sans text-base font-semibold">{step.title}</h3>
                  <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-soft">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <ChatPreview />
      </div>
    </section>
  );
}
