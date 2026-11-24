import { cn } from "@/lib/cn";

/**
 * The three-blade mark: an original form drawn from the PSMBFI emblem's language
 * (curved, tapered blades in green, blue and red with a dark cloisonné rim),
 * arranged as a turning triad. It is NOT the PSMBFI logo; the real emblem is
 * used as an image (see Emblem.tsx).
 */
export const BLADE_PATH = "M48 6 C 74 12, 92 34, 88 60 C 86 72, 78 80, 70 82 C 76 70, 75 54, 67 42 C 61 32, 55 20, 48 6 Z";
export const BLADE_COLORS = ["#009444", "#1054a4", "#ec1c24"] as const;

export function BladeMark({ size = 40, className, spin = false, rim = true, title }: { size?: number; className?: string; spin?: boolean; rim?: boolean; title?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn(spin && "animate-[spin_1.1s_linear_infinite] motion-reduce:animate-none", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {BLADE_COLORS.map((c, i) => (
        <path
          key={c}
          d={BLADE_PATH}
          fill={c}
          stroke={rim ? "#06122a" : "none"}
          strokeWidth={rim ? 3 : 0}
          strokeLinejoin="round"
          transform={`rotate(${i * 120} 50 52)`}
        />
      ))}
    </svg>
  );
}

/** Small loading indicator built from the same three blades. */
export function BladeSpinner({ size = 18, className, label = "Loading" }: { size?: number; className?: string; label?: string }) {
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex", className)}>
      <BladeMark size={size} spin rim={false} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
