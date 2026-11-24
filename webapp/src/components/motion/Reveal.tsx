import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/lib/motion";

/**
 * A heading-level reveal, once, when its section enters view. Use on section
 * headings only, never on every card (DESIGN.md › Motion).
 */
export function Reveal({ children, delay = 0, className, as = "div", y = 18 }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "span" | "p" | "h2" | "li"; y?: number }) {
  const reduced = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }
  return (
    <M className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -12% 0px" }} transition={{ duration: 0.7, ease: EASE_OUT, delay }}>
      {children}
    </M>
  );
}

/** Splits a line into words that rise from masks (hero and footer headlines). */
export function MaskLines({ lines, className, lineClassName, delay = 0, stagger = 0.08 }: { lines: React.ReactNode[]; className?: string; lineClassName?: string; delay?: number; stagger?: number }) {
  const reduced = useReducedMotion();
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <motion.span
            className={`block ${lineClassName ?? ""}`}
            initial={reduced ? false : { y: "105%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: delay + i * stagger }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
