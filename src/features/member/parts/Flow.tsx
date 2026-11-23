import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { dateTime } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Timeline";
import { WRAP_BTN } from "./Page";
import type { TimelineEvent } from "@/data/types";

/** "Step 2 of 5: How much" in words above the numbered stepper. */
export function FlowProgress({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  const t = useT();
  return (
    <div className={cn("mb-6", className)}>
      <p className="text-[1.0625rem] font-semibold text-ink-2">
        {t(`Step ${current + 1} of ${steps.length}`, `Hakbang ${current + 1} sa ${steps.length}`)}
        <span className="text-ink">: {steps[current]}</span>
      </p>
      {/* The words above name the step. Narrow screens (or very large text) get a segmented
          bar; wide ones the numbered stepper, without its labels, which truncate at six steps. */}
      <div className="@container">
        <div className="mt-3 flex gap-1.5 @lg:hidden" aria-hidden>
          {steps.map((s, i) => (
            <span key={s} className={cn("h-2.5 flex-1 rounded-full", i < current ? "bg-green-700" : i === current ? "bg-primary-strong" : "bg-sunken shadow-[inset_0_0_0_1px_var(--line-strong)]")} />
          ))}
        </div>
        <Stepper steps={steps} current={current} className="mt-3 hidden @lg:flex [&_.truncate]:hidden" />
      </div>
    </div>
  );
}

/** Large Back and Continue at the end of a step. Continue sits on top on phones. */
export function FlowNav({ onBack, onNext, nextLabel, nextIcon, loading, backLabel }: { onBack?: () => void; onNext: () => void; nextLabel?: string; nextIcon?: React.ReactNode; loading?: boolean; backLabel?: string }) {
  const t = useT();
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <Button variant="quiet" size="lg" onClick={onBack} icon={<ArrowLeft size="1.15rem" weight="bold" />} className={cn("sm:min-w-[9rem]", WRAP_BTN)}>
          {backLabel ?? t("Back", "Bumalik")}
        </Button>
      ) : (
        <span className="hidden sm:block" />
      )}
      <Button size="lg" onClick={onNext} loading={loading} iconRight={nextIcon === undefined ? <ArrowRight size="1.15rem" weight="bold" /> : nextIcon} className={cn("sm:min-w-[12rem]", WRAP_BTN)}>
        {nextLabel ?? t("Continue", "Magpatuloy")}
      </Button>
    </div>
  );
}

/**
 * Status history at member size: what happened (1rem), when and by whom (0.9375rem,
 * ink-2), notes on a sunken plate, then the steps still ahead as hollow points.
 */
export function History({ events, upcoming = [], className }: { events: TimelineEvent[]; upcoming?: string[]; className?: string }) {
  const t = useT();
  const lastIdx = events.length - 1;
  return (
    <ol className={cn("relative", className)}>
      {events.map((e, i) => (
        <li key={`${e.label}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
          <Rail done current={i === lastIdx} last={i === lastIdx && upcoming.length === 0} />
          <div className="-mt-0.5 min-w-0 pb-1">
            <p className={cn("text-[1.0625rem] font-semibold leading-snug", i === lastIdx ? "text-ink" : "text-ink-2")}>{e.label}</p>
            <p className="mt-0.5 text-[0.9375rem] text-ink-2">
              {dateTime(e.at)}
              {e.by && <> · {e.by}</>}
            </p>
            {e.note && <p className="mt-2 rounded-md bg-sunken px-3.5 py-2.5 text-[1rem] leading-snug text-ink">{e.note}</p>}
          </div>
        </li>
      ))}
      {upcoming.map((u, i) => (
        <li key={u} className="relative flex gap-4 pb-6 last:pb-0">
          <Rail done={false} current={false} last={i === upcoming.length - 1} />
          <div className="-mt-0.5 min-w-0">
            <p className="text-[1.0625rem] font-medium leading-snug text-ink-2">{u}</p>
            {i === 0 && <p className="mt-0.5 text-[0.9375rem] font-semibold text-primary">{t("Next", "Susunod")}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Rail({ done, current, last }: { done: boolean; current: boolean; last: boolean }) {
  return (
    <div className="relative flex w-6 shrink-0 justify-center">
      <span
        className={cn(
          "relative z-10 mt-0.5 grid size-[1.3rem] place-items-center rounded-full",
          done ? "bg-green-700" : "bg-surface shadow-[inset_0_0_0_2px_var(--line-strong)]",
          current && "shadow-[0_0_0_5px_color-mix(in_oklab,var(--positive)_18%,transparent)]",
        )}
      >
        {done && (
          <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
            <path d="M2.5 6.2 5 8.6 9.6 3.6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {!last && <span aria-hidden className={cn("absolute bottom-0 top-6 w-[2px] rounded-full", done ? "bg-green-700/40" : "bg-line-strong")} />}
    </div>
  );
}
