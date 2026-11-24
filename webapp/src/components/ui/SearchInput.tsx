import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export function SearchInput({ value, onChange, placeholder = "Search", className, label }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; label: string }) {
  return (
    <div className={cn("relative", className)}>
      <MagnifyingGlass size={17} weight="bold" aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
      <input type="search" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field-input pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden" />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange("")} className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-sm text-ink-3 transition-colors hover:bg-sunken hover:text-ink">
          <X size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}
