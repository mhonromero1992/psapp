import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const PALETTE = [
  ["#e3edf9", "#0d4486"],
  ["#e2f4ea", "#006b31"],
  ["#fbe5e6", "#9b1015"],
  ["#e8ebf1", "#33425a"],
];

/** Initials only: no invented photos (anti-slop R-23). */
export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [bg, fg] = PALETTE[h % PALETTE.length];
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-display font-bold [font-stretch:90%]", className)}
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}
