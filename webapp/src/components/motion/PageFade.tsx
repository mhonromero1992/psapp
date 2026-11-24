import { motion, useReducedMotion } from "motion/react";
import { useLocation } from "react-router";
import { EASE_OUT } from "@/lib/motion";

/** In-portal route transition: 240ms crossfade with a 6px rise. */
export function PageFade({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  return (
    <motion.div key={pathname} className={className} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: EASE_OUT }}>
      {children}
    </motion.div>
  );
}
