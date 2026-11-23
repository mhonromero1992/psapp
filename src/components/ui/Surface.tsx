import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Elevation = 0 | 1 | 2 | 3;

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
  pad?: "none" | "sm" | "md" | "lg";
  tone?: "surface" | "sunken" | "night" | "glass";
  radius?: "md" | "lg" | "xl";
  as?: "div" | "section" | "article" | "aside" | "li";
}

/**
 * A surface separates content by material and depth, not by borders.
 * elevation 1 = resting card, 2 = raised/popover, 3 = dialog/device.
 */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { elevation = 1, pad = "md", tone = "surface", radius = "lg", as = "div", className, ...rest },
  ref,
) {
  const Tag = as as "div";
  return (
    <Tag
      ref={ref}
      className={cn(
        tone === "surface" && "bg-surface",
        tone === "sunken" && "bg-sunken",
        tone === "night" && "bg-night text-white",
        tone === "glass" && "glass",
        tone !== "glass" && elevation === 1 && "shadow-e1",
        tone !== "glass" && elevation === 2 && "shadow-e2",
        tone !== "glass" && elevation === 3 && "shadow-e3",
        radius === "md" && "rounded-md",
        radius === "lg" && "rounded-lg",
        radius === "xl" && "rounded-xl",
        pad === "sm" && "p-3 sm:p-4",
        pad === "md" && "p-4 sm:p-5",
        pad === "lg" && "p-5 sm:p-7",
        className,
      )}
      {...rest}
    />
  );
});

/** Heading row inside a surface. */
export function SurfaceHeader({ title, subtitle, action, className }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h3 className="font-display text-[1.06rem] font-bold [font-stretch:92%]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[0.84rem] text-ink-3">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
