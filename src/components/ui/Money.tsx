import { cn } from "@/lib/cn";

/** Peso amount with tabular figures; centavos set smaller so the whole number reads first. */
export function Money({ value, className, cents = true, sign = false, size }: { value: number; className?: string; cents?: boolean; sign?: boolean; size?: "lg" | "xl" }) {
  const neg = value < 0;
  const abs = Math.abs(value);
  const whole = Math.floor(abs).toLocaleString("en-PH");
  const frac = Math.round((abs - Math.floor(abs)) * 100).toString().padStart(2, "0");
  return (
    <span className={cn("tnum whitespace-nowrap", className)} aria-label={`${neg ? "minus " : ""}${abs.toLocaleString("en-PH", { minimumFractionDigits: 2 })} pesos`}>
      <span aria-hidden>
        {neg ? "−" : sign ? "+" : ""}
        <span className={cn(size === "xl" && "mr-0.5 text-[0.62em] align-[0.32em]", size === "lg" && "mr-0.5 text-[0.7em] align-[0.18em]")}>₱</span>
        {whole}
        {cents && <span className={cn(size ? "text-[0.55em] align-[0.38em] opacity-70" : "opacity-80")}>.{frac}</span>}
      </span>
    </span>
  );
}
