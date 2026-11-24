import { forwardRef } from "react";
import { Link, type LinkProps } from "react-router";
import { cn } from "@/lib/cn";
import { BladeMark } from "@/components/brand/BladeMark";

export type ButtonVariant = "primary" | "positive" | "negative" | "tonal" | "quiet" | "ghost" | "light" | "glass";
export type ButtonSize = "sm" | "md" | "lg";

interface Common {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Icon-only button. Requires aria-label. */
  iconOnly?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function classes({ variant = "primary", size = "md", block, iconOnly }: Common) {
  return cn("btn", `btn-${variant}`, size !== "md" && `btn-${size}`, block && "btn-block", iconOnly && "btn-icon");
}

function Inner({ icon, iconRight, children, loading }: Common & { loading?: boolean }) {
  return (
    <>
      <span className="btn-label inline-flex items-center gap-[inherit] transition-opacity duration-200">
        {icon}
        {children}
        {iconRight}
      </span>
      {loading && (
        <span className="btn-spinner" aria-hidden>
          <BladeMark size={20} spin rim={false} />
        </span>
      )}
    </>
  );
}

export interface ButtonProps extends Common, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  loading?: boolean;
  loadingLabel?: string;
}

/** Premium button. States: hover light-follow, press, focus halo, loading, disabled. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, block, icon, iconRight, iconOnly, loading, loadingLabel = "Working", className, children, type = "button", disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(classes({ variant, size, block, iconOnly }), className)}
      data-loading={loading ? "true" : undefined}
      aria-busy={loading || undefined}
      disabled={disabled}
      {...rest}
    >
      <Inner icon={icon} iconRight={iconRight} loading={loading}>
        {children}
      </Inner>
      {loading && <span className="sr-only" role="status">{loadingLabel}</span>}
    </button>
  );
});

export interface ButtonLinkProps extends Common, Omit<LinkProps, "children" | "className"> {}

/** Navigation styled as a button: always a real link. */
export function ButtonLink({ variant, size, block, icon, iconRight, iconOnly, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={cn(classes({ variant, size, block, iconOnly }), className)} {...rest}>
      <Inner icon={icon} iconRight={iconRight}>
        {children}
      </Inner>
    </Link>
  );
}
