import Image from "next/image";
import Link from "next/link";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import type { SectionData } from "@/lib/content";

/** Splits a line into words that rise out of a mask in sequence (CSS only, runs before hydration). */
function RiseLine({ text, offset = 0 }: { text: string; offset?: number }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span key={i} className="rise-word">
          <span style={{ "--i": offset + i } as React.CSSProperties}>{word}</span>
          {" "}
        </span>
      ))}
    </>
  );
}

export function Hero({ data }: { data: SectionData }) {
  const heroPhoto = data.photo("image");
  const line1 = data.text("line1");
  const line2 = data.text("line2");
  const caption = data.text("caption");
  const captionHref = data.text("captionHref");
  const submitLabel = data.text("submitLabel", "Check availability");
  const mobileNote = data.text("mobileNote");
  return (
    <section className="relative">
      <div className="relative isolate flex items-end overflow-hidden bg-night text-white sm:min-h-[72svh] lg:min-h-[94svh]">
        {heroPhoto && (
          <Image
            src={heroPhoto.src}
            alt={heroPhoto.alt}
            fill
            preload
            sizes="100vw"
            className="hero-settle -z-10 object-cover object-[54%_center] lg:object-[60%_center]"
          />
        )}
        <div aria-hidden className="absolute inset-0 -z-10 bg-night/50 lg:bg-night/40" />

        <div className="container-page w-full pt-[7.75rem] pb-20 sm:pt-32 lg:pb-32">
          <h1 className="type-display-xl max-w-[13ch] max-lg:text-[clamp(2.75rem,11.5vw,3.75rem)] max-lg:leading-[0.98]">
            <span className="sr-only">{[line1, line2].filter(Boolean).join(" ")}</span>
            <span aria-hidden>
              <RiseLine text={line1} />
              {line2 && (
                <>
                  <br />
                  <RiseLine text={line2} offset={line1.split(" ").length} />
                </>
              )}
            </span>
          </h1>
          {data.text("intro") && (
            <p className="type-lead hero-rise mt-4 max-w-[34rem] text-white/90 [animation-delay:650ms] max-sm:max-w-[21rem] max-sm:text-[0.9688rem] lg:mt-5">{data.text("intro")}</p>
          )}
        </div>

        {caption && (
        <Link
          href={captionHref || "/villas"}
          className="hero-rise absolute right-5 bottom-6 hidden text-[0.8125rem] font-medium text-white [animation-delay:900ms] [text-shadow:0_1px_8px_rgb(0_0_0/0.45)] hover:underline hover:underline-offset-4 md:right-8 md:block lg:bottom-28 xl:right-10"
        >
          {caption}
        </Link>
        )}
      </div>

      {/* Enquiry: a compact 2×2 card overlapping the photo on phones and tablets,
          the one-line bar across the bottom of the photo on large screens */}
      <div className="container-page relative z-10 -mt-14 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:translate-y-1/2">
        <div className="hero-rise rounded-[14px] shadow-[0_24px_60px_-24px_rgb(29_25_19/0.55)] [animation-delay:800ms] lg:hidden">
          <EnquiryForm layout="compact" placement="home_hero_mobile" submitLabel={submitLabel} />
        </div>
        <div className="hero-rise hidden rounded-full shadow-[0_30px_70px_-30px_rgb(29_25_19/0.55)] [animation-delay:800ms] lg:block">
          <EnquiryForm layout="bar" placement="home_hero" submitLabel={submitLabel} />
        </div>
        {mobileNote && <p className="mt-3 text-center text-[0.8125rem] text-ink-soft lg:hidden">{mobileNote}</p>}
      </div>
    </section>
  );
}
