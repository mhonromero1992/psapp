import { cn } from "@/lib/cn";
import { peso } from "@/lib/format";

/**
 * Range slider styled to the system: 8px track with a blue fill, a 28px thumb, a
 * 44px touch row, and the focus halo on the thumb. Native input, so keyboard and
 * screen readers work as usual.
 */
export function RangeSlider({ value, min, max, step, onChange, label, valueText, className }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string; valueText: string; className?: string }) {
  const clamped = Math.min(max, Math.max(min, value || min));
  const pct = max > min ? (clamped - min) / (max - min) : 0;
  return (
    <div className={cn("relative h-12", className)}>
      <div aria-hidden className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-sunken shadow-[inset_0_1px_2px_rgb(7_27_55/0.08)]">
        <div className="h-full rounded-full bg-primary-strong" style={{ width: `calc(${pct * 100}% + ${(0.5 - pct) * 2.25}rem)` }} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        aria-label={label}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "absolute inset-0 h-12 w-full cursor-pointer appearance-none bg-transparent focus-visible:shadow-none",
          "[&::-webkit-slider-runnable-track]:h-12 [&::-webkit-slider-runnable-track]:bg-transparent",
          "[&::-webkit-slider-thumb]:mt-[0.375rem] [&::-webkit-slider-thumb]:size-9 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgb(7_27_55/0.12),0_2px_6px_rgb(7_27_55/0.28)] [&::-webkit-slider-thumb]:transition-transform active:[&::-webkit-slider-thumb]:scale-110",
          "[&:focus-visible::-webkit-slider-thumb]:shadow-[0_0_0_2px_var(--bg),0_0_0_5px_var(--halo)]",
          "[&::-moz-range-track]:h-12 [&::-moz-range-track]:bg-transparent",
          "[&::-moz-range-thumb]:size-9 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_0_0_1px_rgb(7_27_55/0.12),0_2px_6px_rgb(7_27_55/0.28)]",
          "[&:focus-visible::-moz-range-thumb]:shadow-[0_0_0_2px_var(--bg),0_0_0_5px_var(--halo)]",
        )}
      />
    </div>
  );
}

export interface MeterPart {
  key: string;
  label: string;
  value: number;
  /** A chart token: var(--chart-1), var(--chart-2), var(--chart-ref). */
  color: string;
  note?: string;
}

/**
 * Thin segmented bar of one whole (base pay) with a legend list that carries every
 * figure, so no number is printed inside a segment that might not fit.
 */
export function DeductionMeter({ total, parts, restLabel, caption, className }: { total: number; parts: MeterPart[]; restLabel?: string; caption: string; className?: string }) {
  const used = parts.reduce((s, p) => s + p.value, 0);
  const rest = Math.max(0, total - used);
  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="sr-only">{caption}</figcaption>
      <div aria-hidden className="flex h-3.5 w-full gap-[2px] overflow-hidden rounded-full">
        {parts
          .filter((p) => p.value > 0)
          .map((p) => (
            <span key={p.key} className="h-full min-w-[3px] transition-[width] duration-500 ease-out-quint first:rounded-l-full last:rounded-r-full" style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
          ))}
        {restLabel && <span className="h-full flex-1 rounded-r-full bg-[var(--chart-track)]" />}
      </div>
      <ul className="mt-4 space-y-2.5 text-[1rem]">
        {parts.map((p) => (
          <li key={p.key} className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 items-start gap-2.5">
              <span aria-hidden className="mt-[0.3rem] size-3 shrink-0 rounded-[3px]" style={{ background: p.color }} />
              <span className="min-w-0 text-ink-2">
                {p.label}
                {p.note && <span className="block text-[0.9375rem] text-ink-2">{p.note}</span>}
              </span>
            </span>
            <span className="tnum shrink-0 font-semibold text-ink">{peso(p.value)}</span>
          </li>
        ))}
        {restLabel && (
        <li className="flex items-start justify-between gap-3">
          <span className="flex items-start gap-2.5">
            <span aria-hidden className="mt-[0.3rem] size-3 shrink-0 rounded-[3px] bg-[var(--chart-track)] shadow-[inset_0_0_0_1px_var(--line-strong)]" />
            <span className="text-ink-2">{restLabel}</span>
          </span>
          <span className="tnum shrink-0 font-semibold text-ink">{peso(rest)}</span>
        </li>
        )}
      </ul>
    </figure>
  );
}
