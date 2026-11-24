import { useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise } from "@phosphor-icons/react";

/** E-signature canvas (pointer + touch). Emits a PNG data URL, or null when cleared. */
export function SignaturePad({ onChange, label = "Sign inside the box" }: { onChange: (dataUrl: string | null) => void; label?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const resize = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = r.width * dpr;
      c.height = r.height * dpr;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#0a1628";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg bg-surface shadow-[inset_0_0_0_1.5px_var(--line-strong)]">
        <canvas
          ref={canvas}
          aria-label={label}
          role="img"
          className="block h-40 w-full touch-none"
          onPointerDown={(e) => {
            drawing.current = true;
            last.current = pos(e);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drawing.current || !last.current) return;
            const ctx = canvas.current!.getContext("2d")!;
            const p = pos(e);
            ctx.beginPath();
            ctx.moveTo(last.current.x, last.current.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            last.current = p;
            if (empty) setEmpty(false);
          }}
          onPointerUp={() => {
            drawing.current = false;
            last.current = null;
            if (!empty) onChange(canvas.current!.toDataURL("image/png"));
          }}
        />
        <span aria-hidden className="pointer-events-none absolute inset-x-6 bottom-9 h-px bg-line-strong" />
        {empty && <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[0.8rem] text-ink-3">{label}</span>}
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            const c = canvas.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            setEmpty(true);
            onChange(null);
          }}
        >
          <span className="btn-label inline-flex items-center gap-[inherit]">
            <ArrowCounterClockwise size={15} weight="bold" /> Clear signature
          </span>
        </button>
      </div>
    </div>
  );
}
