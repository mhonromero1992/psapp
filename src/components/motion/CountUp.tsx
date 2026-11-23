import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

/** Counts to a value once when visible (≤1.2s). Renders the final value for reduced motion. */
export function CountUp({ value, format = (v: number) => Math.round(v).toLocaleString("en-PH"), duration = 1.1, className }: { value: number; format?: (v: number) => string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    if (!inView) return;
    const controls = animate(0, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: setDisplay });
    return () => controls.stop();
  }, [inView, value, duration, reduced]);
  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
