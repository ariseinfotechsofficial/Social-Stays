import Image from "next/image";
import badge from "@/assets/brand/logo-badge.png";
import horizontal from "@/assets/brand/logo-nav.png";
import horizontalWhite from "@/assets/brand/logo-nav-white.png";
import { cn } from "@/lib/utils";

/**
 * The supplied Social Stays logo (pin mark, wordmark and "The Collection"). The
 * "Villas • Farmstays • Homestays" line is left off because it can't be read at header size.
 * `tone="light"` shows an all-white copy for photos; switching tone cross-fades between the two.
 */
export function Logo({ tone = "dark", className, preload }: { tone?: "dark" | "light"; className?: string; preload?: boolean }) {
  return (
    <span className={cn("relative block h-14 lg:h-16", className)}>
      <Image
        src={horizontal}
        alt="Social Stays"
        preload={preload}
        sizes="220px"
        className={cn("h-full w-auto transition-opacity duration-500", tone === "light" && "opacity-0")}
      />
      <Image
        src={horizontalWhite}
        alt=""
        aria-hidden
        sizes="220px"
        className={cn("absolute inset-0 h-full w-auto transition-opacity duration-500", tone === "dark" && "opacity-0")}
      />
    </span>
  );
}

/** Round badge version of the logo, for dark grounds such as the footer. */
export function LogoBadge({ className }: { className?: string }) {
  return <Image src={badge} alt="Social Stays, the collection: villas, farmstays, homestays" sizes="160px" className={cn("h-auto w-32", className)} />;
}
