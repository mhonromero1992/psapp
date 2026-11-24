import { ArrowClockwise, WarningOctagon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { BladeMark } from "@/components/brand/BladeMark";
import { Button } from "./Button";

/** Empty state: says what is missing and offers the next action. */
export function EmptyState({ title, body, action, className, compact }: { title: string; body?: string; action?: React.ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "py-8" : "py-14", className)}>
      <div className="relative mb-4 grid size-16 place-items-center rounded-full bg-sunken">
        <BladeMark size={30} className="opacity-70 grayscale-[0.35]" />
      </div>
      <p className="font-display text-[1.1rem] font-bold [font-stretch:92%]">{title}</p>
      {body && <p className="mt-1 max-w-sm text-[1rem] text-ink-2">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "We couldn't load this", body = "The connection dropped while loading. Your data is safe.", onRetry, className }: { title?: string; body?: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center py-12 text-center", className)}>
      <div className="mb-4 grid size-14 place-items-center rounded-full bg-negative-soft text-negative">
        <WarningOctagon size={28} weight="duotone" />
      </div>
      <p className="font-display text-[1.1rem] font-bold [font-stretch:92%]">{title}</p>
      <p className="mt-1 max-w-sm text-[1rem] text-ink-2">{body}</p>
      {onRetry && (
        <Button variant="quiet" className="mt-5" icon={<ArrowClockwise size={16} weight="bold" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton h-4", className)} />;
}

/** Placeholder rows while a list loads. */
export function LoadingRows({ rows = 5, className, label = "Loading" }: { rows?: number; className?: string; label?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
