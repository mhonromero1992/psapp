/** Shared motion vocabulary. Durations in seconds for Motion. See DESIGN.md › Motion. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
export const SPRING = { type: "spring", stiffness: 380, damping: 34, mass: 0.9 } as const;
export const SPRING_SOFT = { type: "spring", stiffness: 160, damping: 26 } as const;

export const DUR = { press: 0.09, hover: 0.18, ui: 0.24, panel: 0.36, page: 0.5, hero: 1.1 } as const;

export const fadeRise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.panel, ease: EASE_OUT } },
};
