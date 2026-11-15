import { BathtubIcon, BedIcon, PawPrintIcon, SwimmingPoolIcon, UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";
import type { Villa } from "@/data/types";
import { fill, getContent, labels } from "@/lib/content";

export async function VillaFacts({ villa }: { villa: Villa }) {
  const t = labels(await getContent(), "villa");
  const facts = [
    { icon: UsersThreeIcon, label: fill(t.text("factGuests", "Up to {n} guests"), { n: villa.guests.max }), note: fill(t.text("factBase", "{n} at the base price"), { n: villa.guests.base }) },
    { icon: BedIcon, label: fill(t.text("factBedrooms", "{n} bedrooms"), { n: villa.bedrooms }) },
    { icon: BathtubIcon, label: fill(t.text("factBathrooms", "{n} bathrooms"), { n: villa.bathrooms }) },
    villa.privatePool && { icon: SwimmingPoolIcon, label: t.text("factPool", "Private pool") },
    villa.petFriendly && { icon: PawPrintIcon, label: t.text("factPets", "Pets welcome") },
  ].filter(Boolean) as { icon: typeof BedIcon; label: string; note?: string }[];

  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-5 sm:flex sm:flex-wrap sm:gap-x-10">
      {facts.map(({ icon: Icon, label, note }) => (
        <li key={label} className="flex items-start gap-3">
          <Icon aria-hidden weight="light" className="mt-0.5 size-6 shrink-0 text-gold" />
          <span>
            <span className="block font-semibold">{label}</span>
            {note && <span className="block text-[0.8125rem] text-ink-soft">{note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
