import { cn } from "@/lib/utils";

/**
 * Flat redraw of the Social Stays mark: the location pin ring, sun, house with
 * glass front, leaf sprig and the road between two hills. Single colour (currentColor).
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="8 8 104 130"
      className={cn("h-auto", className)}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d="M13 73.1 A50 50 0 1 1 107 73.1" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <circle cx="50" cy="36" r="10.5" />
      <path d="M22 66.5 L86 50.5 L86.6 54.4 L23 69.6 Z" />
      <path
        fillRule="evenodd"
        d="M36 66.2 L80 55.4 L80 80 L36 80 Z M40 69.5 L45.5 69.5 L45.5 80 L40 80 Z M50 65.36 L55.5 64.01 L55.5 77.5 L50 77.5 Z M56.9 63.67 L62.4 62.32 L62.4 77.5 L56.9 77.5 Z M63.8 61.97 L69.3 60.62 L69.3 77.5 L63.8 77.5 Z M70.7 60.28 L76.2 58.93 L76.2 77.5 L70.7 77.5 Z"
      />
      <path d="M91 81 L91 39" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M91 38 C87 34 87.5 28 91 24 C94.5 28 95 34 91 38 Z" />
      <path d="M90 50 C83.5 50 80 45.5 79 40 C84.5 40 89 43.5 90 50 Z" />
      <path d="M92 50 C98.5 50 102 45.5 103 40 C97.5 40 93 43.5 92 50 Z" />
      <path d="M90 63 C83.5 63 80 58.5 79 53 C84.5 53 89 56.5 90 63 Z" />
      <path d="M92 63 C98.5 63 102 58.5 103 53 C97.5 53 93 56.5 92 63 Z" />
      <path d="M10.6 74 C30 74 50 78 61 87 C58 102 60 118 60.5 135 C44 120 22 99 10.6 74 Z" />
      <path d="M65 85 C78 80 94 79 109.4 76 C101 92 88 106 73 117 C70 106 68 95 65 85 Z" />
    </svg>
  );
}

/** Mark + wordmark lockup. `tone` sets the colour; the mark is always the brand gold on light grounds. */
export function Logo({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn("w-7 shrink-0 transition-colors duration-500", tone === "light" ? "text-white" : "text-gold")} />
      <span
        className={cn(
          "font-display text-[1.3rem] leading-none font-medium tracking-[0.14em] uppercase transition-colors duration-500",
          tone === "light" ? "text-white" : "text-ink",
        )}
      >
        Social Stays
      </span>
    </span>
  );
}
