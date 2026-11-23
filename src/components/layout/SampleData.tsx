import { Flask } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/Menu";

/** Honest placeholder marker (anti-slop R-38): every portal shows it. */
export function SampleDataBadge({ className }: { className?: string }) {
  return (
    <Tooltip content="This prototype runs on generated sample data. No real member records are used.">
      <span tabIndex={0} className={cn("inline-flex h-8 items-center gap-1.5 rounded-xs bg-caution-soft px-2.5 text-[0.82rem] font-bold text-caution outline-none", className)}>
        <Flask size={13} weight="bold" aria-hidden />
        Sample data
      </span>
    </Tooltip>
  );
}
