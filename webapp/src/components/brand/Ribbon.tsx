import { cn } from "@/lib/cn";

/**
 * Service-ribbon bar: the identity motif. Uniformed members wear ribbon racks where
 * stripe patterns encode an honour; here each module and loan product gets its own
 * stripe pattern. Used as a marker, never as a decorative edge stripe.
 */
export const RIBBONS = {
  brand: ["#009444", "#1054a4", "#ec1c24"],
  membership: ["#1054a4", "#f4f6fa", "#009444", "#f4f6fa", "#1054a4"],
  claims: ["#ec1c24", "#f4f6fa", "#1054a4"],
  loans: ["#1054a4", "#c9a227", "#1054a4"],
  remittance: ["#0a2a52", "#009444", "#0a2a52"],
  accounting: ["#0a2a52", "#f4f6fa", "#0a2a52", "#f4f6fa", "#0a2a52"],
  treasury: ["#009444", "#c9a227", "#009444"],
  budget: ["#1054a4", "#0a2a52", "#1054a4"],
  hr: ["#009444", "#f4f6fa", "#ec1c24", "#f4f6fa", "#009444"],
  procurement: ["#c9a227", "#0a2a52", "#c9a227"],
  reports: ["#0a2a52", "#ec1c24", "#1054a4", "#009444", "#0a2a52"],
  approvals: ["#ec1c24", "#0a2a52", "#ec1c24"],
  audit: ["#0a2a52", "#c9a227", "#0a2a52", "#c9a227", "#0a2a52"],
  agency: ["#1054a4", "#ec1c24", "#1054a4"],
  member: ["#009444", "#1054a4", "#009444"],
} as const;

export type RibbonName = keyof typeof RIBBONS;

export function Ribbon({ name = "brand", stripes, className, size = "md" }: { name?: RibbonName; stripes?: readonly string[]; className?: string; size?: "sm" | "md" | "lg" }) {
  const s = stripes ?? RIBBONS[name];
  const w = 100 / s.length;
  const bg = `linear-gradient(90deg, ${s.map((c, i) => `${c} ${i * w}% ${(i + 1) * w}%`).join(", ")})`;
  const dims = size === "sm" ? "w-[22px] h-[8px]" : size === "lg" ? "w-[44px] h-[14px]" : "w-[30px] h-[10px]";
  return <span aria-hidden className={cn("ribbon", dims, className)} style={{ backgroundImage: bg }} />;
}

/** A small label set beside its ribbon. Replaces uppercase eyebrow pills. */
export function RibbonLabel({ name = "brand", children, className, tone = "ink" }: { name?: RibbonName; children: React.ReactNode; className?: string; tone?: "ink" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-display text-[0.9rem] font-semibold [font-stretch:92%]", tone === "light" ? "text-white/85" : "text-ink-2", className)}>
      <Ribbon name={name} />
      {children}
    </span>
  );
}
