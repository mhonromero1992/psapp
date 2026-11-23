import { useState } from "react";
import { Link } from "react-router";
import { ArrowClockwise, ArrowLeft, ArrowRight, CaretDown, WarningOctagon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/States";
import { BladeMark } from "@/components/brand/BladeMark";
import { HelpLink } from "./Help";

/*
 * Page furniture for the Member App, sized for older members: rem everywhere (so the
 * Text size setting scales it), sentences at 1rem or more in ink or ink-2, targets of
 * at least 3rem.
 */

export function PageHead({
  title, helper, action, back, lead, meta, className,
}: {
  title: React.ReactNode;
  helper?: React.ReactNode;
  action?: React.ReactNode;
  back?: { to: string; label: string };
  lead?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-7 pt-1 md:mb-9", className)}>
      {back && <BackLink to={back.to} label={back.label} className="mb-2" />}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="min-w-0">
          {lead && <div className="mb-2.5">{lead}</div>}
          <h1 className="font-display text-[2rem] font-extrabold leading-[1.02] tracking-[-0.02em] [font-stretch:84%] sm:text-[2.5rem]">{title}</h1>
          {helper && <p className="mt-3 max-w-[36rem] text-[1.0625rem] leading-relaxed text-ink-2">{helper}</p>}
          {meta && <div className="mt-3.5 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {action && <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:pb-1 [&>*]:w-full md:[&>*]:w-auto">{action}</div>}
      </div>
    </header>
  );
}

export function BackLink({ to, label, className }: { to: string; label: string; className?: string }) {
  return (
    <Link to={to} className={cn("-ml-2 inline-flex min-h-12 items-center gap-2 rounded-sm px-2 text-[1rem] font-semibold text-ink-2 transition-colors hover:text-ink", className)}>
      <ArrowLeft size="1.15rem" weight="bold" aria-hidden />
      {label}
    </Link>
  );
}

/** Section heading with an optional "see all" link or action on the right. */
export function SectionHead({ title, count, to, linkLabel, action, id, className }: { title: React.ReactNode; count?: number; to?: string; linkLabel?: string; action?: React.ReactNode; id?: string; className?: string }) {
  return (
    <div className={cn("mb-3 flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1", className)}>
      <h2 id={id} className="flex items-baseline gap-2 font-display text-[1.4rem] font-bold leading-tight tracking-[-0.015em] [font-stretch:88%]">
        {title}
        {typeof count === "number" && <span className="tnum text-[1rem] font-semibold text-ink-2">{count}</span>}
      </h2>
      {to && linkLabel && (
        <Link to={to} className="group inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-xs text-[1rem] font-semibold text-primary">
          <span className="decoration-[1.5px] underline-offset-4 group-hover:underline">{linkLabel}</span>
          <ArrowRight size="1rem" weight="bold" aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      )}
      {action}
    </div>
  );
}

/** A short label over a value. */
export function Fact({ label, value, hint, className, size = "md" }: { label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode; className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[0.9375rem] font-medium leading-snug text-ink-2">{label}</dt>
      <dd className={cn("mt-1 font-semibold text-ink", size === "lg" && "font-display text-[1.5rem] font-bold leading-tight tracking-[-0.015em] [font-stretch:88%]", size === "md" && "text-[1.125rem]", size === "sm" && "text-[1.0625rem]")}>{value}</dd>
      {hint && <dd className="mt-0.5 text-[0.9375rem] leading-snug text-ink-2">{hint}</dd>}
    </div>
  );
}

/** Status pill at member-screen size; long Filipino labels wrap instead of overflowing. */
export function StatusBadge({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return <Badge tone={tone} className={cn("h-auto min-h-7 whitespace-normal rounded-[8px] px-2.5 py-1 text-[0.875rem] leading-tight", className)}>{children}</Badge>;
}

/** Empty state: what is missing, why, the next action, and a way to ask for help. */
export function Empty({ title, body, action, helpTopic, compact, className }: { title: string; body?: string; action?: React.ReactNode; helpTopic?: string; compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-4 text-center", compact ? "py-8" : "py-12", className)}>
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-sunken">
        <BladeMark size={30} className="opacity-75 grayscale-[0.35]" />
      </div>
      <p className="font-display text-[1.25rem] font-bold [font-stretch:92%]">{title}</p>
      {body && <p className="mt-1.5 max-w-sm text-[1rem] leading-relaxed text-ink-2">{body}</p>}
      {action && <div className="mt-5 w-full max-w-xs [&>*]:w-full">{action}</div>}
      {helpTopic && <HelpLink topic={helpTopic} className="mt-3" />}
    </div>
  );
}

/** Error state with retry and help, in plain words. */
export function LoadError({ onRetry, helpTopic = "Something else", className }: { onRetry: () => void; helpTopic?: string; className?: string }) {
  const t = useT();
  return (
    <div role="alert" className={cn("flex flex-col items-center rounded-lg bg-surface px-4 py-12 text-center shadow-e1", className)}>
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-negative-soft text-negative">
        <WarningOctagon size="2rem" weight="duotone" aria-hidden />
      </div>
      <p className="font-display text-[1.25rem] font-bold [font-stretch:92%]">{t("We couldn't load this", "Hindi namin ito ma-load")}</p>
      <p className="mt-1.5 max-w-sm text-[1rem] leading-relaxed text-ink-2">{t("The connection dropped while loading. Your records are safe. Please try again.", "Naputol ang koneksyon habang naglo-load. Ligtas ang iyong records. Pakisubukan ulit.")}</p>
      <Button size="lg" variant="quiet" className="mt-5" icon={<ArrowClockwise size="1.2rem" weight="bold" />} onClick={onRetry}>
        {t("Try again", "Subukan ulit")}
      </Button>
      <HelpLink topic={helpTopic} className="mt-3" />
    </div>
  );
}

/** Skeleton blocks shaped like the page that is loading. */
export function PageSkeleton({ shape = "cards" }: { shape?: "hero" | "cards" | "list" | "form" }) {
  const t = useT();
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">{t("Loading", "Naglo-load")}</span>
      {shape === "hero" && (
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-72 rounded-xl lg:col-span-7" />
          <div className="space-y-4 lg:col-span-5">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
          </div>
        </div>
      )}
      {shape === "cards" && (
        <>
          <Skeleton className="h-48 rounded-lg" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-36 rounded-lg" />
            <Skeleton className="h-36 rounded-lg" />
          </div>
        </>
      )}
      {shape === "list" && (
        <div className="space-y-4 rounded-lg bg-surface p-5 shadow-e1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full" />
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}
      {shape === "form" && (
        <>
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-80 rounded-lg" />
        </>
      )}
    </div>
  );
}

/** Lists that grow with a "Show more" button instead of pages. */
export function useShowMore(step: number) {
  const [count, setCount] = useState(step);
  return { count, more: () => setCount((c) => c + step), reset: () => setCount(step) };
}

export function ShowMoreButton({ shown, total, step, onMore, noun }: { shown: number; total: number; step: number; onMore: () => void; noun: { en: string; fil: string } }) {
  const t = useT();
  if (shown >= total) return null;
  const next = Math.min(step, total - shown);
  return (
    <div className="mt-3">
      <Button variant="quiet" size="lg" block onClick={onMore} icon={<CaretDown size="1.1rem" weight="bold" />}>
        {t(`Show ${next} more ${noun.en}`, `Ipakita ang ${next} pang ${noun.fil}`)}
      </Button>
      <p className="mt-2 text-center text-[0.9375rem] text-ink-2">{t(`Showing ${shown} of ${total}`, `${shown} sa ${total} ang ipinapakita`)}</p>
    </div>
  );
}

/** A plain table for wide screens: 1rem cells, 3.5rem rows, no sorting or paging. */
export function SimpleTable<T>({ caption, rows, rowKey, columns, className }: { caption: string; rows: T[]; rowKey: (r: T) => string; columns: { key: string; header: string; cell: (r: T) => React.ReactNode; align?: "left" | "right" }[]; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg bg-surface shadow-e1", className)}>
      <table className="w-full border-collapse text-left text-[1rem]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-surface-2">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("h-12 whitespace-nowrap px-4 text-[0.9375rem] font-semibold text-ink-2 shadow-[inset_0_-1px_0_var(--line)]", c.align === "right" && "text-right")}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="shadow-[inset_0_-1px_0_var(--line)] last:shadow-none">
              {columns.map((c) => (
                <td key={c.key} className={cn("h-14 px-4 align-middle text-ink", c.align === "right" && "text-right tnum")}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
