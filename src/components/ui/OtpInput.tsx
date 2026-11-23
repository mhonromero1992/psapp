import { useRef } from "react";
import { cn } from "@/lib/cn";

/** Six-digit one-time PIN with paste support and auto-advance. */
export function OtpInput({ value, onChange, invalid, length = 6, autoFocus, describedBy }: { value: string; onChange: (v: string) => void; invalid?: boolean; length?: number; autoFocus?: boolean; describedBy?: string }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const setAt = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join("").slice(0, length));
  };
  return (
    <div className="flex justify-between gap-2" role="group" aria-label="One-time PIN">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          maxLength={1}
          className={cn("field-input h-14 w-full max-w-14 px-0 text-center font-display text-[1.5rem] font-bold tnum", invalid && "animate-[shake_320ms_ease-in-out]")}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (!v) return setAt(i, "");
            if (v.length > 1) {
              onChange((digits.slice(0, i).join("") + v).slice(0, length));
              refs.current[Math.min(length - 1, i + v.length)]?.focus();
              return;
            }
            setAt(i, v);
            refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            const v = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (v) {
              e.preventDefault();
              onChange(v);
              refs.current[Math.min(length - 1, v.length)]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
