import { format, parseISO } from "date-fns";
import type { Quote } from "@/lib/booking";
import { cn, formatINR } from "@/lib/utils";

type Pricing = Quote["pricing"];

function Row({ label, value, strong, muted, className }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean; muted?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", strong && "font-semibold text-ink", muted && "text-ink-soft", className)}>
      <dt>{label}</dt>
      <dd className="shrink-0 tabular-nums">{value}</dd>
    </div>
  );
}

/** Nightly rates grouped by price, e.g. "₹22,500 × 2 nights (Weekend)" */
function nightGroups(nightly: Pricing["nightly"]) {
  const groups: { price: number; label: string; count: number }[] = [];
  for (const n of nightly) {
    const g = groups.find((x) => x.price === n.price && x.label === n.label);
    if (g) g.count++;
    else groups.push({ price: n.price, label: n.label, count: 1 });
  }
  return groups;
}

/** The price breakdown shown on the booking card, at checkout and on the booking page */
export function PriceSummary({
  pricing,
  addOns = [],
  plan,
  compact,
  paid,
  refunded,
}: {
  pricing: Pricing;
  addOns?: { title: string; amount: number; onRequest: boolean; qty?: number }[];
  plan?: { mode: "advance" | "full"; advancePercent: number; dueNow: number; balanceDueDate?: string };
  compact?: boolean;
  paid?: number;
  refunded?: number;
}) {
  return (
    <dl className="space-y-2 text-[0.9375rem]">
      {nightGroups(pricing.nightly).map((g) => (
        <Row
          key={`${g.price}-${g.label}`}
          label={
            <>
              {formatINR(g.price)} × {g.count} night{g.count === 1 ? "" : "s"}
              {g.label && <span className="text-ink-soft"> · {g.label}</span>}
            </>
          }
          value={formatINR(g.price * g.count)}
        />
      ))}
      {pricing.extraGuests > 0 && <Row label={`${pricing.extraGuestCount} extra guest${pricing.extraGuestCount === 1 ? "" : "s"}`} value={formatINR(pricing.extraGuests)} />}
      {!compact &&
        addOns.map((a) => (
          <Row key={a.title} label={`${a.title}${a.qty && a.qty > 1 ? ` × ${a.qty}` : ""}`} value={a.onRequest ? "Quoted later" : formatINR(a.amount)} muted={a.onRequest} />
        ))}
      {compact && pricing.addOns > 0 && <Row label="Add-ons" value={formatINR(pricing.addOns)} />}
      {pricing.discount > 0 && <Row label={`Discount${pricing.couponCode ? ` (${pricing.couponCode})` : ""}`} value={`− ${formatINR(pricing.discount)}`} className="text-success" />}
      {pricing.gstPercent > 0 && (
        <Row label={`GST ${pricing.gstPercent}%${pricing.gstInclusive ? " (included)" : ""}`} value={formatINR(pricing.gst)} muted={pricing.gstInclusive} />
      )}
      <Row label="Total" value={formatINR(pricing.total)} strong className="border-t border-line pt-3 text-base" />
      {paid !== undefined && paid > 0 && <Row label="Paid" value={formatINR(paid)} muted />}
      {refunded !== undefined && refunded > 0 && <Row label="Refunded" value={formatINR(refunded)} muted />}
      {plan && plan.mode === "advance" && paid === undefined && (
        <>
          <Row label={`Pay now (${plan.advancePercent}%)`} value={formatINR(plan.dueNow)} strong />
          <Row
            label={`Balance${plan.balanceDueDate ? `, due ${format(parseISO(plan.balanceDueDate), "d MMM")}` : ""}`}
            value={formatINR(pricing.total - plan.dueNow)}
            muted
          />
        </>
      )}
      {pricing.securityDeposit > 0 && !compact && (
        <p className="pt-1 text-[0.8125rem] text-ink-soft">Plus a refundable security deposit of {formatINR(pricing.securityDeposit)}, collected before check-in.</p>
      )}
    </dl>
  );
}
