import { cn } from "@/lib/cn";
import { dateTime } from "@/lib/format";
import type { TimelineEvent } from "@/data/types";

/** Vertical status history. The newest step is emphasised; upcoming steps are hollow. */
export function Timeline({ events, upcoming = [], className }: { events: TimelineEvent[]; upcoming?: string[]; className?: string }) {
  const lastIdx = events.length - 1;
  return (
    <ol className={cn("relative", className)}>
      {events.map((e, i) => (
        <li key={`${e.label}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
          <Rail done current={i === lastIdx} last={i === lastIdx && upcoming.length === 0} />
          <div className="-mt-0.5 min-w-0 pb-1">
            <p className={cn("font-semibold leading-snug", i === lastIdx ? "text-ink" : "text-ink-2")}>{e.label}</p>
            <p className="mt-0.5 text-[0.8125rem] text-ink-3">
              {dateTime(e.at)}
              {e.by && <> · {e.by}</>}
            </p>
            {e.note && <p className="mt-1.5 rounded-sm bg-sunken px-3 py-2 text-[0.875rem] text-ink-2">{e.note}</p>}
          </div>
        </li>
      ))}
      {upcoming.map((u, i) => (
        <li key={u} className="relative flex gap-4 pb-5 last:pb-0">
          <Rail done={false} current={false} last={i === upcoming.length - 1} />
          <p className="-mt-0.5 font-medium text-ink-3">{u}</p>
        </li>
      ))}
    </ol>
  );
}

function Rail({ done, current, last }: { done: boolean; current: boolean; last: boolean }) {
  return (
    <div className="relative flex w-5 shrink-0 justify-center">
      <span
        className={cn(
          "relative z-10 mt-0.5 grid size-[18px] place-items-center rounded-full",
          done ? "bg-green-700" : "bg-surface shadow-[inset_0_0_0_2px_var(--line-strong)]",
          current && "shadow-[0_0_0_5px_color-mix(in_oklab,var(--positive)_18%,transparent)]",
        )}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden>
            <path d="M2.5 6.2 5 8.6 9.6 3.6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {!last && <span aria-hidden className={cn("absolute top-5 bottom-0 w-[2px] rounded-full", done ? "bg-green-700/40" : "bg-line-strong")} />}
    </div>
  );
}

/** Horizontal stepper for wizards. Shows numbers, never color alone. */
export function Stepper({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <ol className={cn("flex items-center gap-2", className)} aria-label="Progress">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={s} className="flex min-w-0 flex-1 items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-[0.8rem] font-bold tnum transition-colors duration-300",
                state === "done" && "bg-green-700 text-white",
                state === "current" && "bg-primary-strong text-white shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_20%,transparent)]",
                state === "todo" && "bg-sunken text-ink-3",
              )}
            >
              {state === "done" ? (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2.5 6.2 5 8.6 9.6 3.6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : (
                i + 1
              )}
            </span>
            <span className={cn("hidden truncate text-[0.8125rem] font-semibold lg:block", state === "todo" ? "text-ink-3" : "text-ink")}>{s}</span>
            {i < steps.length - 1 && <span aria-hidden className={cn("h-[2px] min-w-3 flex-1 rounded-full", i < current ? "bg-green-700/50" : "bg-line-strong")} />}
            <span className="sr-only">{state === "done" ? "completed" : state === "current" ? "current step" : "not started"}</span>
          </li>
        );
      })}
    </ol>
  );
}
