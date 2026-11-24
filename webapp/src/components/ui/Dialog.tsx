import { Dialog as RDialog } from "radix-ui";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/** Modal dialog: Escape closes, focus is trapped and returned. */
export function Dialog({ open, onOpenChange, title, description, children, footer, size = "md" }: { open: boolean; onOpenChange: (v: boolean) => void; title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode; footer?: React.ReactNode; size?: "sm" | "md" | "lg" }) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-night/45 backdrop-blur-[3px] data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <RDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-surface p-5 shadow-e3 outline-none sm:p-7 data-[state=open]:animate-[dialog-in_260ms_cubic-bezier(0.22,1,0.36,1)]",
            size === "sm" && "max-w-md",
            size === "md" && "max-w-lg",
            size === "lg" && "max-w-2xl",
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <RDialog.Title className="font-display text-[1.35rem] font-bold [font-stretch:90%]">{title}</RDialog.Title>
              {description ? <RDialog.Description className="mt-1 text-[0.9rem] text-ink-3">{description}</RDialog.Description> : <RDialog.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</RDialog.Description>}
            </div>
            <RDialog.Close className="btn btn-ghost btn-icon btn-sm -mr-2 -mt-1" aria-label="Close">
              <X size={18} weight="bold" />
            </RDialog.Close>
          </div>
          {children}
          {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/** Side sheet on desktop, bottom sheet on phones. */
export function Sheet({ open, onOpenChange, title, description, children, footer, width = "md" }: { open: boolean; onOpenChange: (v: boolean) => void; title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode; footer?: React.ReactNode; width?: "md" | "lg" }) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-night/40 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <RDialog.Content
          className={cn(
            "fixed z-50 flex flex-col bg-surface shadow-e3 outline-none",
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-xl data-[state=open]:animate-[sheet-up_320ms_cubic-bezier(0.22,1,0.36,1)]",
            "md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:rounded-l-xl md:rounded-tr-none md:data-[state=open]:animate-[sheet-left_320ms_cubic-bezier(0.22,1,0.36,1)]",
            width === "md" ? "md:w-[460px]" : "md:w-[640px]",
          )}
        >
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line-strong md:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4 md:px-6 md:pt-6">
            <div className="min-w-0">
              <RDialog.Title className="font-display text-[1.3rem] font-bold [font-stretch:90%]">{title}</RDialog.Title>
              {description ? <RDialog.Description className="mt-1 text-[0.875rem] text-ink-3">{description}</RDialog.Description> : <RDialog.Description className="sr-only">Details</RDialog.Description>}
            </div>
            <RDialog.Close className="btn btn-ghost btn-icon btn-sm -mr-2" aria-label="Close">
              <X size={18} weight="bold" />
            </RDialog.Close>
          </div>
          <div className="scroll-quiet flex-1 overflow-y-auto px-5 pb-5 md:px-6">{children}</div>
          {footer && <div className="flex flex-col-reverse gap-2 px-5 pb-[calc(1rem+var(--safe-bottom))] pt-3 shadow-[0_-1px_0_var(--line)] sm:flex-row sm:justify-end md:px-6">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
