import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "light" | "dark";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full font-sans font-semibold tracking-[0.01em] whitespace-nowrap transition-[background-color,color,border-color,box-shadow] duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-gold text-white hover:bg-gold-press",
  outline: "border border-ink/80 text-ink hover:bg-ink hover:text-white",
  light: "border border-white/70 text-white backdrop-blur-[2px] hover:bg-white hover:text-ink",
  dark: "bg-ink text-white hover:bg-night",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-[0.875rem]",
  md: "h-12 px-6 text-[0.9375rem]",
  lg: "h-14 px-8 text-base",
};

export const buttonClasses = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(base, variants[variant], sizes[size], className);

type Shared = { variant?: Variant; size?: Size; icon?: ReactNode; children: ReactNode };

/** Label slides up and is replaced from below on hover — a quieter take on the portfolio flip link. */
function Label({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <>
      {icon}
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-500 ease-out-expo group-hover/btn:-translate-y-full">{children}</span>
        <span aria-hidden className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-out-expo group-hover/btn:translate-y-0">
          {children}
        </span>
      </span>
    </>
  );
}

export function Button({ variant, size, icon, children, className, ...props }: Shared & ComponentProps<"button">) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props}>
      <Label icon={icon}>{children}</Label>
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  children,
  className,
  ...props
}: Shared & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      <Label icon={icon}>{children}</Label>
    </Link>
  );
}

export function TextLink({ className, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link className={cn("link-draw inline-flex items-center gap-2 font-semibold text-gold-deep hover:text-gold-press", className)} {...props}>
      {children}
    </Link>
  );
}
