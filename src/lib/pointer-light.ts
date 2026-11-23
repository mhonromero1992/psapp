/**
 * One delegated listener feeds --mx/--my to every .btn and .sheen surface,
 * so the light-follow highlight needs no per-component hooks.
 */
let installed = false;
export function installPointerLight() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  let frame = 0;
  let last: PointerEvent | null = null;
  const apply = () => {
    frame = 0;
    if (!last) return;
    const target = last.target as Element | null;
    const el = target?.closest?.(".btn, .sheen") as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${last.clientX - r.left}px`);
    el.style.setProperty("--my", `${last.clientY - r.top}px`);
  };
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    },
    { passive: true },
  );
}
