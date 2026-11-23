import { useState } from "react";
import { cn } from "@/lib/cn";
import { barPath, columnPath, niceTicks, tickLabel, useSize } from "./useSize";

/**
 * Ranked horizontal bars, one hue (slot 1). Value at the tip in ink; the optional
 * reference (e.g. expected) shows as a light track behind the bar.
 */
export function BarList({ items, format = (v: number) => v.toLocaleString("en-PH"), caption, className, max: maxProp }: { items: { label: string; value: number; ref?: number; note?: string }[]; format?: (v: number) => string; caption: string; className?: string; max?: number }) {
  const max = maxProp ?? Math.max(...items.map((i) => Math.max(i.value, i.ref ?? 0)), 1);
  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="sr-only">{caption}</figcaption>
      <ul className="flex flex-col gap-3">
        {items.map((it) => (
          <li key={it.label} className="grid grid-cols-[minmax(84px,32%)_1fr_auto] items-center gap-3">
            <span className="truncate text-[0.8125rem] font-medium text-ink-2" title={it.label}>{it.label}</span>
            <span className="relative h-[14px]">
              {it.ref !== undefined && <span className="absolute inset-y-0 left-0 rounded-r-[4px] bg-[var(--chart-track)]" style={{ width: `${(it.ref / max) * 100}%` }} />}
              <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 14" aria-hidden>
                <path d={barPath(0, 0, Math.max(0.6, (it.value / max) * 100), 14, 3)} fill="var(--chart-1)" vectorEffect="non-scaling-stroke" />
              </svg>
            </span>
            <span className="tnum min-w-[4.5rem] text-right text-[0.8125rem] font-semibold text-ink">{format(it.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/**
 * Columns over periods. Up to two series side by side (slot 1, slot 2 or "ref").
 * Each column is its own hit target with a hover/focus tooltip.
 */
export function ColumnChart({ labels, series, height = 220, format = (v: number) => v.toLocaleString("en-PH"), caption, className }: { labels: string[]; series: { key: string; label: string; slot: "1" | "2" | "ref"; values: number[] }[]; height?: number; format?: (v: number) => string; caption: string; className?: string }) {
  const [ref, { width }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { t: 12, r: 8, b: 26, l: 44 };
  const w = Math.max(0, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;
  const n = labels.length;
  const all = series.flatMap((s) => s.values);
  const ticks = niceTicks(Math.max(...all, 1));
  const max = ticks[ticks.length - 1];
  const band = w / Math.max(1, n);
  const groupW = Math.min(band * 0.62, series.length * 24 + (series.length - 1) * 2);
  const barW = (groupW - (series.length - 1) * 2) / series.length;
  const y = (v: number) => pad.t + h - (v / max) * h;
  const color = (slot: string) => (slot === "1" ? "var(--chart-1)" : slot === "2" ? "var(--chart-2)" : "var(--chart-ref)");
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 56))));

  return (
    <div ref={ref} className={cn("relative w-full", className)} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={caption} className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={pad.l + w} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth={1} />
              <text x={pad.l - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-3 text-[11px] tnum">{tickLabel(t)}</text>
            </g>
          ))}
          {labels.map((l, i) => {
            const gx = pad.l + band * i + (band - groupW) / 2;
            return (
              <g key={l + i}>
                {hover === i && <rect x={pad.l + band * i + 2} y={pad.t} width={band - 4} height={h} rx={6} fill="var(--chart-hover)" />}
                {series.map((s, si) => {
                  const v = s.values[i] ?? 0;
                  return <path key={s.key} d={columnPath(gx + si * (barW + 2), y(v), barW, pad.t + h - y(v), 4)} fill={color(s.slot)} />;
                })}
                {(i % labelEvery === 0 || i === n - 1) && (
                  <text x={pad.l + band * i + band / 2} y={height - 8} textAnchor="middle" className="fill-ink-3 text-[11px]">{l}</text>
                )}
                <rect
                  x={pad.l + band * i}
                  y={pad.t}
                  width={band}
                  height={h}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${l}: ${series.map((s) => `${s.label} ${format(s.values[i] ?? 0)}`).join(", ")}`}
                  className="outline-none"
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <div className="pointer-events-none absolute top-0 z-10 min-w-[150px] rounded-md bg-surface px-3 py-2.5 shadow-e2" style={{ left: Math.min(Math.max(pad.l + band * hover + band / 2 - 75, 0), width - 170) }} aria-hidden>
          <p className="text-[0.75rem] font-medium text-ink-3">{labels[hover]}</p>
          {series.map((s) => (
            <p key={s.key} className="mt-1 flex items-center gap-2 text-[0.8125rem]">
              <span className="h-[2px] w-3 rounded-full" style={{ background: color(s.slot) }} />
              <span className="font-semibold text-ink tnum">{format(s.values[hover] ?? 0)}</span>
              <span className="text-ink-3">{s.label}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** 12-point sparkline in the de-emphasis hue, the current point in the accent. */
export function Sparkline({ values, width = 120, height = 32, className, label }: { values: number[]; width?: number; height?: number; className?: string; label: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const n = values.length;
  const x = (i: number) => 3 + (i / Math.max(1, n - 1)) * (width - 6);
  const y = (v: number) => 4 + (1 - (v - min) / (max - min || 1)) * (height - 8);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} className={className} role="img" aria-label={label}>
      <path d={d} fill="none" stroke="var(--chart-ref)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(n - 1)} cy={y(values[n - 1])} r={4} fill="var(--chart-1)" stroke="var(--surface)" strokeWidth={2} />
    </svg>
  );
}

/** Tall segmented bar: one whole split into ≤6 parts, share printed inside when it fits. */
export function SegmentedBar({ parts, caption, className, format = (v: number) => v.toLocaleString("en-PH") }: { parts: { label: string; value: number; color: string; ink?: "light" | "dark" }[]; caption: string; className?: string; format?: (v: number) => string }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="sr-only">{caption}</figcaption>
      <div className="flex h-7 w-full gap-[2px]" role="list">
        {parts.filter((p) => p.value > 0).map((p) => {
          const share = p.value / total;
          return (
            <div key={p.label} role="listitem" tabIndex={0} aria-label={`${p.label}: ${format(p.value)}, ${(share * 100).toFixed(0)}%`} title={`${p.label}: ${format(p.value)}`} className="flex min-w-[3px] items-center overflow-hidden rounded-[4px] px-2 outline-none transition-[filter] hover:brightness-110 focus-visible:shadow-[0_0_0_3px_var(--halo)]" style={{ width: `${share * 100}%`, background: p.color }}>
              {share > 0.09 && <span className={cn("text-[0.75rem] font-bold tnum", p.ink === "dark" ? "text-slate-900" : "text-white")}>{(share * 100).toFixed(0)}%</span>}
            </div>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.8125rem] text-ink-2">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-[3px]" style={{ background: p.color }} />
            {p.label}
            <span className="tnum font-semibold text-ink">{format(p.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
