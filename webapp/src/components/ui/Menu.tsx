import { DropdownMenu, Tooltip as RTooltip } from "radix-ui";
import { cn } from "@/lib/cn";

export const MenuRoot = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;

export function MenuContent({ children, align = "end", className }: { children: React.ReactNode; align?: "start" | "end" | "center"; className?: string }) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        sideOffset={8}
        className={cn("z-50 min-w-[220px] rounded-md bg-surface p-1.5 shadow-e2 outline-none data-[state=open]:animate-[pop-in_180ms_cubic-bezier(0.22,1,0.36,1)]", className)}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

export function MenuItem({ children, onSelect, icon, tone = "default", disabled }: { children: React.ReactNode; onSelect?: () => void; icon?: React.ReactNode; tone?: "default" | "negative"; disabled?: boolean }) {
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        "flex h-10 cursor-pointer select-none items-center gap-2.5 rounded-sm px-2.5 text-[0.9rem] font-medium outline-none transition-colors data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-sunken",
        tone === "negative" ? "text-negative" : "text-ink",
      )}
    >
      {icon && <span className="text-ink-3">{icon}</span>}
      {children}
    </DropdownMenu.Item>
  );
}
export const MenuSeparator = () => <DropdownMenu.Separator className="my-1 h-px bg-line" />;
export const MenuLabel = ({ children }: { children: React.ReactNode }) => <DropdownMenu.Label className="px-2.5 pb-1 pt-2 text-[0.75rem] font-semibold text-ink-3">{children}</DropdownMenu.Label>;

export function Tooltip({ content, children, side = "top" }: { content: React.ReactNode; children: React.ReactElement; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <RTooltip.Provider delayDuration={250}>
      <RTooltip.Root>
        <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
        <RTooltip.Portal>
          <RTooltip.Content side={side} sideOffset={6} className="z-50 max-w-[260px] rounded-sm bg-slate-900 px-2.5 py-1.5 text-[0.8rem] font-medium text-white shadow-e2 data-[state=delayed-open]:animate-[pop-in_160ms_ease-out] dark:bg-slate-100 dark:text-slate-900">
            {content}
          </RTooltip.Content>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
  );
}
