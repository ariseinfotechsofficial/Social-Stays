import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@admin/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "icon";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-gold text-white hover:bg-gold-press",
  secondary: "border border-field bg-white text-ink hover:border-ink",
  ghost: "text-ink hover:bg-sand",
  danger: "border border-error/40 bg-white text-error hover:bg-error hover:text-white",
  dark: "bg-ink text-white hover:bg-night",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[0.8125rem]",
  md: "h-10 px-4.5 text-[0.875rem]",
  icon: "size-9 text-[0.875rem]",
};

export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) => cn(base, variants[variant], sizes[size], className);

type Props = { variant?: Variant; size?: Size; icon?: ReactNode; loading?: boolean };

export function Button({ variant, size, icon, loading, children, className, disabled, type = "button", ...props }: Props & ComponentProps<"button">) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, icon, children, className, ...props }: Props & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}
