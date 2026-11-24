import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

/** Label above, hint below, error under its own field (never color alone: an icon + text). */
export function Field({
  label, hint, error, children, className, optional, htmlFor,
}: { label: React.ReactNode; hint?: React.ReactNode; error?: string | null; children: (ids: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode; className?: string; optional?: boolean; htmlFor?: string }) {
  const auto = useId();
  const id = htmlFor ?? auto;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[0.9375rem] font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-3">(optional)</span>}
      </label>
      {children({ id, describedBy: [hintId, errId].filter(Boolean).join(" ") || undefined, invalid: !!error })}
      {hint && !error && <p id={hintId} className="text-[0.9375rem] text-ink-2">{hint}</p>}
      {error && (
        <p id={errId} className="flex items-center gap-1.5 text-[0.9375rem] font-medium text-negative" role="alert">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden><circle cx="8" cy="8" r="7" fill="currentColor" /><path d="M8 4.5v4.2M8 11.2v.3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input({ className, invalid, ...rest }, ref) {
  return <input ref={ref} className={cn("field-input", className)} aria-invalid={invalid || undefined} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea({ className, invalid, ...rest }, ref) {
  return <textarea ref={ref} className={cn("field-input", className)} aria-invalid={invalid || undefined} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(function Select({ className, invalid, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cn("field-input", className)} aria-invalid={invalid || undefined} {...rest}>
      {children}
    </select>
  );
});

/** Peso amount input: numeric keypad on phones, ₱ prefix, digits only. */
export function MoneyInput({ value, onChange, id, invalid, describedBy, min, max, className }: { value: number | ""; onChange: (v: number | "") => void; id?: string; invalid?: boolean; describedBy?: string; min?: number; max?: number; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-3">₱</span>
      <input
        id={id}
        inputMode="numeric"
        className="field-input pl-8 tnum font-semibold"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={value === "" ? "" : value.toLocaleString("en-PH")}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "");
          if (!digits) return onChange("");
          let n = Number(digits);
          if (max !== undefined) n = Math.min(n, max * 10);
          onChange(n);
        }}
        data-min={min}
      />
    </div>
  );
}
