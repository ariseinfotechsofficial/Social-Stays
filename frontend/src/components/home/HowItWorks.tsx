import { CheckIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import type { SectionData } from "@/lib/content";

/** A stylised WhatsApp thread showing exactly what the enquiry form sends. */
function ChatPreview({ data, brand }: { data: SectionData; brand: string }) {
  const [first, ...rest] = data.text("chatRequest").split("\n\n");
  return (
    <div className="relative mx-auto w-full max-w-[24rem] rounded-[28px] border border-line bg-white p-3 shadow-[0_40px_80px_-50px_rgb(29_25_19/0.6)]">
      <div className="flex items-center gap-3 rounded-t-[20px] bg-sand px-4 py-3">
        <span className="grid size-9 place-items-center rounded-full bg-gold text-white">
          <WhatsappLogoIcon className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="text-[0.9375rem] font-semibold">{brand}</p>
          <p className="text-[0.75rem] text-ink-soft">{data.text("chatStatus")}</p>
        </div>
      </div>
      <div className="space-y-3 rounded-b-[20px] bg-sand-deep/70 px-3 py-5 text-[0.875rem] leading-relaxed">
        <div className="ml-auto max-w-[85%] rounded-[14px] rounded-tr-[4px] bg-white px-4 py-3 shadow-[0_1px_0_rgb(42_36_27/0.06)]">
          <p>{first}</p>
          {rest.map((para, i) => (
            <p key={i} className="mt-2 whitespace-pre-line">
              {para}
            </p>
          ))}
          {data.text("chatSource") && <p className="mt-2 text-ink-soft">{data.text("chatSource")}</p>}
          <p className="mt-1 flex items-center justify-end gap-1 text-[0.6875rem] text-ink-soft">
            {data.text("chatSentAt")} <CheckIcon className="size-3" />
            <CheckIcon className="-ml-2 size-3" />
          </p>
        </div>
        <div className="max-w-[85%] rounded-[14px] rounded-tl-[4px] bg-white px-4 py-3">
          <p className="whitespace-pre-line">{data.text("chatReply")}</p>
          <p className="mt-1 text-right text-[0.6875rem] text-ink-soft">{data.text("chatReplyAt")}</p>
        </div>
      </div>
    </div>
  );
}

export function HowItWorks({ data, brand }: { data: SectionData; brand: string }) {
  const steps = data.list<{ title: string; body: string }>("steps");
  return (
    <section className="section-y overflow-hidden bg-sand">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16 xl:gap-20">
        <div>
          <h2 className="type-display-l max-w-[20ch]">{data.text("title")}</h2>
          {data.text("intro") && <p className="type-lead mt-5 max-w-xl text-ink-soft">{data.text("intro")}</p>}
          {/* A real sequence, so it is numbered; two columns keep it compact */}
          <ol className="mt-8 grid gap-x-10 sm:grid-cols-2">
            {steps.map((step, i) => (
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
        <ChatPreview data={data} brand={brand} />
      </div>
    </section>
  );
}
