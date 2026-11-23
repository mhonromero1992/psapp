import { cn } from "@/lib/cn";

/** KPI tile: label, value, optional context line and a small visual slot (sparkline). */
export function Stat({ label, value, context, tone = "neutral", visual, className }: { label: React.ReactNode; value: React.ReactNode; context?: React.ReactNode; tone?: "neutral" | "positive" | "negative" | "caution"; visual?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <p className="text-[0.8125rem] font-semibold text-ink-3">{label}</p>
      <p className="mt-1.5 font-display text-[1.65rem] font-bold leading-none tracking-[-0.02em] [font-stretch:86%] tnum">{value}</p>
      {context && (
        <p className={cn("mt-2 text-[0.8125rem] font-medium", tone === "positive" && "text-positive", tone === "negative" && "text-negative", tone === "caution" && "text-caution", tone === "neutral" && "text-ink-3")}>{context}</p>
      )}
      {visual && <div className="mt-3">{visual}</div>}
    </div>
  );
}
