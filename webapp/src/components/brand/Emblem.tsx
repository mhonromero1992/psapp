import { Link } from "react-router";
import emblem from "@/assets/psmbfi-emblem.png";
import { cn } from "@/lib/cn";

/** The real PSMBFI emblem (supplied in the proposal deck). */
export function PsmbfiEmblem({ size = 32, className }: { size?: number; className?: string }) {
  return <img src={emblem} width={size} height={size} alt="PSMBFI" className={cn("shrink-0 object-contain", className)} style={{ width: size, height: size }} />;
}

/** Product lockup: PSMBFI emblem + PS-ACCESS set in Archivo (no invented logo). */
export function Lockup({ to = "/", tone = "ink", compact = false, wordmark = true, className }: { to?: string; tone?: "ink" | "light"; compact?: boolean; wordmark?: boolean; className?: string }) {
  return (
    <Link to={to} className={cn("group inline-flex min-h-11 min-w-11 items-center gap-2.5 rounded-md", className)} aria-label="PS-ACCESS by PSMBFI, home">
      <PsmbfiEmblem size={compact ? 28 : 34} className="transition-transform duration-500 ease-out-quint group-hover:rotate-[-8deg]" />
      <span className={cn("flex flex-col whitespace-nowrap leading-none", !wordmark && "sr-only")}>
        <span className={cn("font-display text-[1.15rem] font-extrabold tracking-[-0.01em] [font-stretch:86%]", tone === "light" ? "text-white" : "text-ink")}>PS-ACCESS</span>
        {!compact && <span className={cn("mt-1 text-[0.8rem] font-semibold tracking-[0.01em]", tone === "light" ? "text-white/75" : "text-ink-3")}>by PSMBFI</span>}
      </span>
    </Link>
  );
}
