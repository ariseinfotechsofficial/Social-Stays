"use client";

import { useState } from "react";
import { cn } from "@admin/lib/utils";

/*
 * Single-series charts for the dashboard: one brand hue (gold) on white, so no legend box;
 * the card title names the series. Values live in a visually hidden table for screen readers.
 */

const MARK = "var(--color-gold)";

const compact = (n: number) => (n >= 1e7 ? `${+(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `${+(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}K` : String(Math.round(n)));

/** Clean max for the axis: 1, 2, 2.5 or 5 × a power of ten */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 2.5, 5, 10].find((m) => m * p >= v) ?? 10) * p;
}

export type Point = { label: string; value: number; tooltip?: string };

/** Vertical columns over time, with a per-column tooltip */
export function ColumnChart({ data, height = 180, format = compact, labelEvery = 1, title }: { data: Point[]; height?: number; format?: (n: number) => string; labelEvery?: number; title: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const ticks = [0, max / 2, max];
  const W = 640;
  const padL = 36;
  const padB = 22;
  const plotW = W - padL;
  const plotH = height - padB - 8;
  const band = plotW / Math.max(1, data.length);
  const barW = Math.min(24, band - 2);
  const y = (v: number) => 8 + plotH - (v / max) * plotH;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={title} onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={padL - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-ink-soft)" className="tabular-nums">
              {format(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + i * band + (band - barW) / 2;
          const h = Math.max(0, y(0) - y(d.value));
          const r = Math.min(4, h, barW / 2);
          const top = y(d.value);
          return (
            <g key={d.label + i} onPointerEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${d.label}: ${format(d.value)}`} className="outline-none">
              {/* Hit area: the whole band, taller than the mark */}
              <rect x={padL + i * band} y={8} width={band} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${y(0)} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${y(0)} Z`}
                  fill={MARK}
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={padL + i * band + band / 2} y={height - 6} textAnchor="middle" fontSize={11} fill="var(--color-ink-soft)">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-[8px] border border-line bg-white px-3 py-2 text-[0.75rem] whitespace-nowrap shadow-lg"
          style={{ left: `${((padL + hover * band + band / 2) / W) * 100}%` }}
        >
          <p className="text-[0.875rem] font-semibold">{data[hover].tooltip ?? format(data[hover].value)}</p>
          <p className="text-ink-soft">{data[hover].label}</p>
        </div>
      )}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <th>{d.label}</th>
              <td>{d.tooltip ?? d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Ranked horizontal bars with the value at the tip */
export function BarList({ data, format = compact, title }: { data: Point[]; format?: (n: number) => string; title: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-2.5" aria-label={title}>
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3 text-[0.8125rem]" title={`${d.label}: ${format(d.value)}`}>
          <span className="truncate text-ink-soft">{d.label}</span>
          <span className="flex items-center gap-2">
            <span className={cn("h-3.5 rounded-r-[4px]")} style={{ width: `${Math.max(2, (d.value / max) * 85)}%`, background: MARK }} />
            <span className="font-semibold tabular-nums">{format(d.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
