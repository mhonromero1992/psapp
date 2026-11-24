import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { niceTicks, tickLabel, useSize } from "./useSize";

export interface Series {
  key: string;
  label: string;
  /** "1" | "2" chart slot, or "ref" for a de-emphasised reference line. */
  slot: "1" | "2" | "ref";
  values: number[];
  area?: boolean;
}

/**
 * Time series: 2px lines, ~10% area wash, hairline grid, a crosshair that snaps to the
 * nearest period, one tooltip listing every series, arrow-key navigation, and a
 * screen-reader table.
 */
export function AreaChart({ labels, series, height = 240, format = (v: number) => v.toLocaleString("en-PH"), caption, className, yZero = true }: { labels: string[]; series: Series[]; height?: number; format?: (v: number) => string; caption: string; className?: string; yZero?: boolean }) {
  const t = useT();
  const periodLabel = t("Period", "Panahon");
  const [ref, { width }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");
  const pad = { t: 14, r: 16, b: 30, l: 58 };
  const w = Math.max(0, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;

  const { ticks, min, max } = useMemo(() => {
    const all = series.flatMap((s) => s.values);
    const mx = Math.max(...all, 1);
    const mn = yZero ? 0 : Math.min(...all);
    const t = niceTicks(mx - mn);
    return { ticks: t.map((v) => v + mn), min: mn, max: t[t.length - 1] + mn };
  }, [series, yZero]);

  const n = labels.length;
  const x = (i: number) => pad.l + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => pad.t + h - ((v - min) / (max - min || 1)) * h;
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const color = (slot: Series["slot"]) => (slot === "1" ? "var(--chart-1)" : slot === "2" ? "var(--chart-2)" : "var(--chart-ref)");
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 72))));

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = Math.round((px / r.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const hi = hover ?? null;
  const tipLeft = hi !== null ? Math.min(Math.max(x(hi) + 12, 8), Math.max(8, width - 196)) : 0;

  return (
    <div ref={ref} className={cn("relative w-full select-none", className)} style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={caption}
          tabIndex={0}
          className="block rounded-md outline-none focus-visible:shadow-[0_0_0_3px_var(--halo)]"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") setHover((v) => Math.min(n - 1, (v ?? -1) + 1));
            if (e.key === "ArrowLeft") setHover((v) => Math.max(0, (v ?? n) - 1));
            if (e.key === "Escape") setHover(null);
          }}
          onFocus={() => setHover((v) => v ?? n - 1)}
          onBlur={() => setHover(null)}
        >
          <defs>
            {series.filter((s) => s.area).map((s) => (
              <linearGradient key={s.key} id={`${gid}-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color(s.slot)} stopOpacity={0.16} />
                <stop offset="100%" stopColor={color(s.slot)} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={pad.l + w} y1={y(v)} y2={y(v)} stroke="var(--chart-grid)" strokeWidth={1} />
              <text x={pad.l - 10} y={y(v)} dy="0.32em" textAnchor="end" className="fill-ink-3 text-[13px] tnum">
                {tickLabel(v)}
              </text>
            </g>
          ))}
          {labels.map((l, i) =>
            // Every few labels, always the last, and never one crowding the last.
            i === n - 1 || (i % labelEvery === 0 && n - 1 - i >= Math.ceil(labelEvery * 0.75)) ? (
              <text key={l + i} x={x(i)} y={height - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="fill-ink-3 text-[13px]">
                {l}
              </text>
            ) : null,
          )}
          {series.map((s) => (
            <g key={s.key}>
              {s.area && <path d={`${path(s.values)} L${x(n - 1)},${y(min)} L${x(0)},${y(min)} Z`} fill={`url(#${gid}-${s.key})`} />}
              <path d={path(s.values)} fill="none" stroke={color(s.slot)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={x(n - 1)} cy={y(s.values[n - 1])} r={4.5} fill={color(s.slot)} stroke="var(--surface)" strokeWidth={2} />
            </g>
          ))}
          {hi !== null && (
            <g pointerEvents="none">
              <line x1={x(hi)} x2={x(hi)} y1={pad.t} y2={pad.t + h} stroke="var(--ink-3)" strokeWidth={1} opacity={0.5} />
              {series.map((s) => (
                <circle key={s.key} cx={x(hi)} cy={y(s.values[hi])} r={5} fill={color(s.slot)} stroke="var(--surface)" strokeWidth={2} />
              ))}
            </g>
          )}
          <rect x={pad.l} y={pad.t} width={w} height={h} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
        </svg>
      )}
      {hi !== null && width > 0 && (
        <div className="pointer-events-none absolute top-2 z-10 min-w-[160px] rounded-md bg-surface px-3 py-2.5 shadow-e2" style={{ left: tipLeft }} aria-hidden>
          <p className="text-[0.875rem] font-medium text-ink-2">{labels[hi]}</p>
          {series.map((s) => (
            <p key={s.key} className="mt-1 flex items-center gap-2 text-[0.9375rem]">
              <span className="h-[2px] w-3 rounded-full" style={{ background: color(s.slot) }} />
              <span className="font-semibold text-ink tnum">{format(s.values[hi])}</span>
              <span className="text-ink-2">{s.label}</span>
            </p>
          ))}
        </div>
      )}
      <div aria-live="polite" className="sr-only">
        {hi !== null ? `${labels[hi]}: ${series.map((s) => `${s.label} ${format(s.values[hi])}`).join(", ")}` : ""}
      </div>
      {/* A table cannot shrink to the 1px of sr-only, so a wrapper hides it without widening the page. */}
      <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{periodLabel}</th>
            {series.map((s) => (
              <th key={s.key} scope="col">{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={l + i}>
              <th scope="row">{l}</th>
              {series.map((s) => (
                <td key={s.key}>{format(s.values[i])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

/** Legend: rect key for areas/bars, line key for lines. Text in ink tokens. */
export function Legend({ items, className }: { items: { label: string; slot: "1" | "2" | "ref"; kind?: "line" | "rect" }[]; className?: string }) {
  const color = (slot: string) => (slot === "1" ? "var(--chart-1)" : slot === "2" ? "var(--chart-2)" : "var(--chart-ref)");
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-ink-2", className)}>
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2">
          {it.kind === "line" ? <span className="h-[2px] w-3.5 rounded-full" style={{ background: color(it.slot) }} /> : <span className="size-2.5 rounded-[3px]" style={{ background: color(it.slot) }} />}
          {it.label}
        </li>
      ))}
    </ul>
  );
}
