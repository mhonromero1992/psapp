import { useId } from "react";
import { Tabs as RTabs } from "radix-ui";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { SPRING } from "@/lib/motion";

export interface TabItem<T extends string> {
  value: T;
  label: React.ReactNode;
  count?: number;
}

/** Underline tabs with a sliding indicator. Content uses RTabs.Content via TabPanel. */
export function Tabs<T extends string>({ value, onValueChange, items, children, className, listClassName, ariaLabel }: { value: T; onValueChange: (v: T) => void; items: TabItem<T>[]; children?: React.ReactNode; className?: string; listClassName?: string; ariaLabel: string }) {
  const layoutId = useId();
  return (
    <RTabs.Root value={value} onValueChange={(v) => onValueChange(v as T)} className={className}>
      <RTabs.List aria-label={ariaLabel} className={cn("scroll-quiet relative flex gap-1 overflow-x-auto", listClassName)}>
        {items.map((it) => (
          <RTabs.Trigger
            key={it.value}
            value={it.value}
            className="relative inline-flex h-11 shrink-0 items-center gap-2 rounded-sm px-3 text-[0.9rem] font-semibold text-ink-3 transition-colors duration-200 hover:text-ink data-[state=active]:text-ink"
          >
            {it.label}
            {typeof it.count === "number" && (
              <span className="tnum rounded-xs bg-sunken px-1.5 py-0.5 text-[0.72rem] font-bold text-ink-2">{it.count}</span>
            )}
            {value === it.value && (
              <motion.span layoutId={layoutId} transition={SPRING} className="absolute inset-x-2 -bottom-px h-[2.5px] rounded-full bg-primary" />
            )}
          </RTabs.Trigger>
        ))}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-line" />
      </RTabs.List>
      {children}
    </RTabs.Root>
  );
}
export const TabPanel = ({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) => (
  <RTabs.Content value={value} className={cn("outline-none", className)}>
    {children}
  </RTabs.Content>
);

/** Segmented control for small mode switches (e.g. Monthly / Yearly). */
export function Segmented<T extends string>({ value, onValueChange, options, ariaLabel, className, size = "md" }: { value: T; onValueChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; ariaLabel: string; className?: string; size?: "sm" | "md" }) {
  const layoutId = useId();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("inline-flex rounded-[12px] bg-sunken p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onValueChange(o.value)}
            className={cn("relative rounded-[9px] px-3 font-semibold transition-colors duration-200", size === "sm" ? "h-8 text-[0.8125rem]" : "h-9 text-[0.875rem]", active ? "text-ink" : "text-ink-3 hover:text-ink")}
          >
            {active && <motion.span layoutId={layoutId} transition={SPRING} className="absolute inset-0 rounded-[9px] bg-surface shadow-e1" />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
