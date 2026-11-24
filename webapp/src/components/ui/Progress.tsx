import { cn } from "@/lib/cn";

/** Ribbon-style progress bar. tone sets the fill. Always paired with a text value nearby. */
export function Progress({ value, max = 1, tone = "primary", className, label }: { value: number; max?: number; tone?: "primary" | "positive" | "caution" | "negative"; className?: string; label: string }) {
  const pctVal = Math.max(0, Math.min(1, value / max));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pctVal * 100)} className={cn("h-2 w-full overflow-hidden rounded-full bg-sunken", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out-quint", tone === "primary" && "bg-primary-strong", tone === "positive" && "bg-green-600", tone === "caution" && "bg-amber-400", tone === "negative" && "bg-red-600")}
        style={{ width: `${pctVal * 100}%` }}
      />
    </div>
  );
}
