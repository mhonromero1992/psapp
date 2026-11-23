import { cn } from "@/lib/cn";
import { dayMonth } from "@/lib/format";
import { useLang, useT } from "@/lib/i18n";
import type { Claim } from "@/data/types";
import { CLAIM_STAGES, claimStage } from "./claims";
import { localTimeline } from "./text";

const Check = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
    <path d="M2.5 6.2 5 8.6 9.6 3.6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FIL_MONTHS = ["Ene", "Peb", "Mar", "Abr", "May", "Hun", "Hul", "Ago", "Set", "Okt", "Nob", "Dis"];
function dayMonthLocal(iso: string, lang: string) {
  if (lang !== "fil") return dayMonth(iso);
  const d = new Date(iso);
  return `${d.getDate()} ${FIL_MONTHS[d.getMonth()]}`;
}

/**
 * Five-stage claim track (Filed, Documents, Evaluation, Approved, Paid).
 * Wide containers get nodes with labels and dates; narrow ones (phones) get five
 * segments with the step spelled out, so no label is ever truncated. Done stages
 * carry a check, the current one a ring, a blocked one a triangle and a denied one
 * a cross: state never depends on colour alone.
 */
export function StageTracker({ claim, size = "md", className }: { claim: Claim; size?: "sm" | "md"; className?: string }) {
  const t = useT();
  const lang = useLang();
  const { current, mode } = claimStage(claim.status);
  const events = localTimeline(claim.timeline, "en");
  const node = size === "md" ? "size-8" : "size-7";
  const done = current >= CLAIM_STAGES.length;
  const stage = CLAIM_STAGES[Math.min(current, CLAIM_STAGES.length - 1)];
  const nextStage = CLAIM_STAGES[current + 1];

  const summary = done
    ? t("All 5 steps done · Paid", "Tapos ang 5 hakbang · Bayad na")
    : mode === "blocked"
      ? t(`Step ${current + 1} of 5 · Re-upload needed`, `Hakbang ${current + 1} sa 5 · Kailangang i-upload muli`)
      : mode === "denied"
        ? t(`Stopped at step ${current + 1} · Denied`, `Huminto sa hakbang ${current + 1} · Hindi naaprubahan`)
        : t(`Step ${current + 1} of 5 · ${stage.en}`, `Hakbang ${current + 1} sa 5 · ${stage.fil}`);

  return (
    <div className={cn("@container", className)}>
      {/* Narrow: segments + words */}
      <div className="@lg:hidden">
        <div className="flex gap-1" aria-hidden>
          {CLAIM_STAGES.map((s, i) => (
            <span
              key={s.key}
              className={cn(
                "h-2.5 flex-1 rounded-full",
                i < current && "bg-green-700",
                i === current && mode === "active" && "bg-primary-strong",
                i === current && mode === "blocked" && "bg-amber-400",
                i === current && mode === "denied" && "bg-red-700",
                i > current && "bg-sunken shadow-[inset_0_0_0_1px_var(--line-strong)]",
              )}
            />
          ))}
        </div>
        <p className="mt-2.5 text-[1rem] font-semibold leading-snug text-ink">{summary}</p>
        {!done && mode === "active" && nextStage && <p className="mt-0.5 text-[0.9375rem] text-ink-2">{t(`Next: ${nextStage.en}`, `Susunod: ${nextStage.fil}`)}</p>}
      </div>

      {/* Wide: nodes, labels, dates */}
      <ol className="hidden grid-cols-5 @lg:grid" aria-label={t("Claim progress", "Progreso ng claim")}>
        {CLAIM_STAGES.map((s, i) => {
          const state = i < current ? "done" : i === current ? mode : "todo";
          const at = events.find((e) => e.label === s.event)?.at;
          const stateText =
            state === "done" ? t("done", "tapos na") : state === "active" ? t("current step", "kasalukuyang hakbang") : state === "blocked" ? t("needs your action", "kailangan ng aksyon mo") : state === "denied" ? t("denied", "hindi naaprubahan") : t("not yet", "hindi pa");
          return (
            <li key={s.key} className="relative flex min-w-0 flex-col items-center text-center" aria-current={state === "active" || state === "blocked" ? "step" : undefined}>
              {i > 0 && <span aria-hidden className={cn("absolute right-1/2 h-[2px] w-full rounded-full", size === "md" ? "top-[0.95rem]" : "top-[0.82rem]", i <= current ? "bg-green-700/55" : "bg-line-strong")} />}
              <span
                className={cn(
                  "relative z-10 grid shrink-0 place-items-center rounded-full",
                  node,
                  state === "done" && "bg-green-700",
                  state === "active" && "bg-primary-strong shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_22%,transparent)]",
                  state === "blocked" && "bg-amber-400 shadow-[0_0_0_4px_color-mix(in_oklab,var(--caution)_22%,transparent)]",
                  state === "denied" && "bg-red-700",
                  state === "todo" && "bg-surface shadow-[inset_0_0_0_2px_var(--line-strong)]",
                )}
              >
                {state === "done" && <Check />}
                {state === "active" && <span aria-hidden className="size-2 rounded-full bg-white" />}
                {state === "blocked" && (
                  <svg width="11" height="11" viewBox="0 0 10 10" aria-hidden>
                    <path d="M5 1.5 9 8.5H1Z" fill="#3a2200" />
                  </svg>
                )}
                {state === "denied" && (
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                    <path d="m2.5 2.5 5 5m0-5-5 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              <span className={cn("mt-2 block w-full truncate px-0.5 text-[0.9375rem] font-semibold", state === "todo" ? "text-ink-2" : "text-ink")}>
                {state === "blocked" ? t("Re-upload", "I-upload muli") : state === "denied" ? t("Denied", "Hindi pasado") : t(s.en, s.fil)}
              </span>
              {size === "md" && <span className="block min-h-[1.3rem] text-[0.875rem] text-ink-2 tnum">{at && state !== "todo" ? dayMonthLocal(at, lang) : ""}</span>}
              <span className="sr-only">, {stateText}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
