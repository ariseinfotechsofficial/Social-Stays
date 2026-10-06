import { RevealImage } from "@/components/motion/Reveal";
import { photo } from "@/data/photos";

const principles = [
  {
    title: "Only your group",
    body: "Every booking is the whole villa. No shared pool, no strangers at breakfast.",
  },
  {
    title: "Hosted by the owners",
    body: "The families who built these homes cook for you, and know the area better than any guidebook.",
  },
  {
    title: "Visited before listed",
    body: "Someone from our team stays at every villa before it joins the collection.",
  },
  {
    title: "One chat to book",
    body: "Dates, meals and décor arranged in a single WhatsApp conversation.",
  },
];

export function Principles() {
  return (
    <section className="section-y pt-14 lg:pt-36">
      <div className="container-page grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-stretch lg:gap-16 xl:gap-20">
        <div className="lg:py-4">
          <h2 className="type-display-l max-w-[20ch]">Book the whole place. Bring everyone.</h2>
          <p className="type-lead mt-5 max-w-xl text-ink-soft">
            Social Stays is a small collection of private villas and farmhouses within two and a half hours of Indore,
            for the weekends when the family, the college gang or the whole team wants to be under one roof.
          </p>
          <dl className="mt-7 grid grid-cols-2 gap-x-5 sm:gap-x-10">
            {principles.map((p) => (
              <div key={p.title} className="border-t border-line py-5">
                <dt className="font-display text-[1.1875rem] leading-snug font-medium sm:text-[1.375rem]">{p.title}</dt>
                <dd className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-soft sm:text-[0.9375rem]">{p.body}</dd>
              </div>
            ))}
          </dl>
        </div>
        {/* Matches the height of the text column on large screens, so neither side leaves a gap */}
        <RevealImage
          photo={photo("occasions/friends")}
          sizes="(min-width: 1024px) 45vw, 100vw"
          from="right"
          className="aspect-[4/3] w-full lg:aspect-auto lg:min-h-[28rem]"
        />
      </div>
    </section>
  );
}
