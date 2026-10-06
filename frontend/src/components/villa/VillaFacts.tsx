import { BathtubIcon, BedIcon, PawPrintIcon, SwimmingPoolIcon, UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";
import type { Villa } from "@/data/types";

export function VillaFacts({ villa }: { villa: Villa }) {
  const facts = [
    { icon: UsersThreeIcon, label: `Up to ${villa.guests.max} guests`, note: `${villa.guests.base} at the base price` },
    { icon: BedIcon, label: `${villa.bedrooms} bedrooms` },
    { icon: BathtubIcon, label: `${villa.bathrooms} bathrooms` },
    villa.privatePool && { icon: SwimmingPoolIcon, label: "Private pool" },
    villa.petFriendly && { icon: PawPrintIcon, label: "Pets welcome" },
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
