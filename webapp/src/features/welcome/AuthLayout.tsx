import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { Lockup } from "@/components/brand/Emblem";
import { PageFade } from "@/components/motion/PageFade";
import { EASE_OUT } from "@/lib/motion";
import { useT } from "@/lib/i18n";
import { HelpProvider } from "@/features/member/parts/Help";
import type { HeroSceneHandle } from "./MedalScene";
import poster from "@/assets/hero-medal.webp";

const MedalScene = lazy(() => import("./MedalScene"));

function canUseWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The service medal: a live WebGL render on capable wide screens, a baked render of
 * the same medal everywhere else (phones, reduced motion, no WebGL). The poster shows
 * first, so the words never wait for the canvas.
 */
export function MedalStage({ className, live = true }: { className?: string; live?: boolean }) {
  const reduced = useReducedMotion() ?? false;
  const handle = useRef<HeroSceneHandle>({ scroll: 0, px: 0, py: 0 });
  const [use3D, setUse3D] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUse3D(live && !reduced && window.matchMedia("(min-width: 1024px)").matches && canUseWebGL());
  }, [live, reduced]);
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div
      ref={box}
      className={className}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !box.current) return;
        const r = box.current.getBoundingClientRect();
        handle.current.px = ((e.clientX - r.left) / r.width) * 2 - 1;
        handle.current.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      }}
      onPointerLeave={() => {
        handle.current.px = 0;
        handle.current.py = 0;
      }}
    >
      <motion.div className="relative h-full w-full" initial={reduced ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: EASE_OUT }}>
        <img src={poster} alt="" width={760} height={1000} fetchPriority="high" className="absolute inset-0 h-full w-full object-contain transition-opacity duration-700" style={{ opacity: use3D && ready ? 0 : 1 }} />
        {use3D && (
          <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: ready ? 1 : 0 }}>
            <Suspense fallback={null}>
              <MedalScene handle={handle} reduced={reduced} active={visible} onReady={() => setReady(true)} />
            </Suspense>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/** Welcome, sign-in and one-time code share this frame, so the medal never reloads between them. */
export function AuthLayout() {
  const t = useT();
  return (
    <HelpProvider>
      <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(480px,0.9fr)]">
        <a href="#auth-main" className="skip-link">{t("Skip to content", "Lumaktaw sa nilalaman")}</a>
        {/* Brand panel, wide screens only */}
        <aside aria-hidden className="relative hidden overflow-hidden bg-night lg:sticky lg:top-0 lg:block lg:h-dvh">
          <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_55%_38%,rgb(16_84_164/0.55),transparent_70%)]" />
          <div className="grain" />
          <div className="absolute left-10 top-8 z-10">
            <Lockup tone="light" />
          </div>
          <MedalStage className="absolute inset-x-0 bottom-[22%] top-0" />
          <div className="absolute inset-x-10 bottom-10 z-10">
            <p className="font-display text-[clamp(2.2rem,1rem+2.4vw,3.6rem)] font-extrabold leading-[0.98] tracking-[-0.02em] text-white [font-stretch:82%]">
              Mas <span className="text-[#33c276]">sigurado.</span>
              <br />
              Mas <span className="text-[#7fb0f0]">protektado.</span>
            </p>
            <p className="mt-3 max-w-md text-[1rem] text-white/75">{t("The PSMBFI Member App for uniformed and civilian personnel of 16 public safety agencies.", "Ang PSMBFI Member App para sa uniformed at civilian personnel ng 16 na ahensya ng public safety.")}</p>
          </div>
        </aside>
        <main id="auth-main" className="relative flex min-h-dvh flex-col">
          <PageFade className="flex flex-1 flex-col">
            <Outlet />
          </PageFade>
        </main>
      </div>
    </HelpProvider>
  );
}
