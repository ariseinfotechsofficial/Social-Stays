import Image from "next/image";
import Link from "next/link";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import { photo } from "@/data/photos";

const heroPhoto = photo("villas/shipra-farm/01");

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

export function Hero() {
  return (
    <section className="relative">
      <div className="relative isolate flex min-h-[80svh] items-end overflow-hidden bg-night text-white lg:min-h-[94svh]">
        <Image
          src={heroPhoto.src}
          alt="Shipra Farm at dusk: a stone farmhouse with lit windows, a lawn and a long pool"
          fill
          preload
          sizes="100vw"
          className="hero-settle -z-10 object-cover object-[60%_center]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-night/40" />

        <div className="container-page w-full pt-28 pb-20 lg:pb-32">
          <h1 className="type-display-xl max-w-[13ch]">
            <span className="sr-only">Private villas, an easy drive from Indore</span>
            <span aria-hidden>
              <RiseLine text="Private villas," />
              <br />
              <RiseLine text="an easy drive from Indore" offset={2} />
            </span>
          </h1>
          <p className="type-lead hero-rise mt-5 max-w-[34rem] text-white/90 [animation-delay:650ms]">
            Whole-villa stays in Jaam Gate, Mandu, Omkareshwar and Ujjain, hosted by the families who own them.
          </p>
        </div>

        <Link
          href="/villas/shipra-farm"
          className="hero-rise absolute right-5 bottom-6 hidden text-[0.8125rem] font-medium text-white [animation-delay:900ms] [text-shadow:0_1px_8px_rgb(0_0_0/0.45)] hover:underline hover:underline-offset-4 md:right-8 md:block lg:bottom-28 xl:right-10"
        >
          Pictured: Shipra Farm, Ujjain
        </Link>
      </div>

      {/* Enquiry bar: overlaps the photo on large screens, sits just under it on phones */}
      <div className="container-page relative z-10 -mt-10 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:translate-y-1/2">
        <div className="hero-rise rounded-[6px] shadow-[0_30px_70px_-30px_rgb(29_25_19/0.55)] [animation-delay:800ms] lg:rounded-full">
          <EnquiryForm layout="bar" placement="home_hero" submitLabel="Check availability" />
        </div>
        <p className="mt-4 text-center text-[0.875rem] text-ink-soft lg:hidden">No payment to enquire. We reply on WhatsApp, usually within 30 minutes.</p>
      </div>
    </section>
  );
}
