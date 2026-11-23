import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router";
import { EASE_IN_OUT } from "@/lib/motion";

/**
 * Portal-to-portal transition: three blades (green, blue, red) sweep across the
 * screen, the route changes under cover, and the blades sweep off. ~650ms.
 * Skipped entirely under reduced motion.
 */
type WipeFn = (to: string) => void;
const WipeCtx = createContext<WipeFn | null>(null);

export function BladeWipeProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const target = useRef<string | null>(null);

  const wipe = useCallback<WipeFn>(
    (to) => {
      if (reduced) {
        navigate(to);
        window.scrollTo(0, 0);
        return;
      }
      target.current = to;
      setActive(true);
    },
    [navigate, reduced],
  );

  const colors = ["#009444", "#1054a4", "#ec1c24"];
  return (
    <WipeCtx.Provider value={wipe}>
      {children}
      <AnimatePresence>
        {active && (
          <motion.div key="wipe" className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-hidden>
            {colors.map((c, i) => (
              <motion.div
                key={c}
                className="absolute -inset-y-[20%] left-[-30%] w-[160%] origin-left"
                style={{ background: i === 2 ? "#050f22" : c, transform: "skewX(-14deg)" }}
                initial={{ x: "-110%" }}
                animate={{ x: "0%" }}
                exit={{ x: "110%" }}
                transition={{ duration: 0.42, delay: i * 0.07, ease: EASE_IN_OUT }}
                onAnimationComplete={() => {
                  if (i === 2 && target.current) {
                    const to = target.current;
                    target.current = null;
                    navigate(to);
                    window.scrollTo(0, 0);
                    requestAnimationFrame(() => setActive(false));
                  }
                }}
              >
                {i === 2 && (
                  <div className="absolute inset-0 grid place-items-center" style={{ transform: "skewX(14deg)" }}>
                    <svg width="56" height="56" viewBox="0 0 100 100" className="animate-[spin_1.1s_linear_infinite]">
                      {["#009444", "#1054a4", "#ec1c24"].map((bc, bi) => (
                        <path key={bc} d="M48 6 C 74 12, 92 34, 88 60 C 86 72, 78 80, 70 82 C 76 70, 75 54, 67 42 C 61 32, 55 20, 48 6 Z" fill={bc} transform={`rotate(${bi * 120} 50 52)`} />
                      ))}
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </WipeCtx.Provider>
  );
}

/** Navigate with the blade wipe (falls back to a plain navigation). */
export function useBladeNavigate() {
  const ctx = useContext(WipeCtx);
  const navigate = useNavigate();
  return ctx ?? ((to: string) => navigate(to));
}
