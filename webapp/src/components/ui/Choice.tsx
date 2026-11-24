import { Checkbox as RCheckbox, RadioGroup, Switch as RSwitch } from "radix-ui";
import { cn } from "@/lib/cn";

export function Checkbox({ checked, onCheckedChange, label, description, id, className, disabled }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: React.ReactNode; description?: React.ReactNode; id?: string; className?: string; disabled?: boolean }) {
  return (
    <label className={cn("group flex cursor-pointer items-start gap-3 rounded-md py-1", disabled && "cursor-not-allowed opacity-60", className)}>
      <RCheckbox.Root
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-[7px] bg-surface shadow-[inset_0_0_0_1.5px_var(--line-strong)] transition-[background-color,box-shadow] duration-200 data-[state=checked]:bg-primary-strong data-[state=checked]:shadow-none group-hover:shadow-[inset_0_0_0_1.5px_var(--primary)]"
      >
        <RCheckbox.Indicator>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2.5 6.2 5 8.6 9.6 3.6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </RCheckbox.Indicator>
      </RCheckbox.Root>
      <span className="min-w-0">
        <span className="block text-[1rem] font-medium leading-snug text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[0.9rem] text-ink-2">{description}</span>}
      </span>
    </label>
  );
}

export function Switch({ checked, onCheckedChange, label, description, className }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: React.ReactNode; description?: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-4 py-1", className)}>
      <span className="min-w-0">
        <span className="block text-[1rem] font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[0.9rem] text-ink-2">{description}</span>}
      </span>
      <RSwitch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="relative h-8 w-14 shrink-0 rounded-full bg-slate-400 shadow-[inset_0_1px_2px_rgb(0_0_0/0.12)] transition-colors duration-300 data-[state=checked]:bg-green-700 dark:bg-slate-700"
      >
        <RSwitch.Thumb className="block size-[1.55rem] translate-x-[0.18rem] rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)] transition-transform duration-300 ease-out-quint data-[state=checked]:translate-x-[1.77rem]" />
      </RSwitch.Root>
    </label>
  );
}

export interface RadioCardOption<T extends string> {
  value: T;
  label: React.ReactNode;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/** Selectable cards. The selected card gains a ring and a filled check, not just a color. */
export function RadioCards<T extends string>({ value, onValueChange, options, className, columns = 1, ariaLabel }: { value: T | ""; onValueChange: (v: T) => void; options: RadioCardOption<T>[]; className?: string; columns?: 1 | 2 | 3; ariaLabel: string }) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      aria-label={ariaLabel}
      className={cn("grid gap-2.5", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3", className)}
    >
      {options.map((o) => (
        <RadioGroup.Item
          key={o.value}
          value={o.value}
          disabled={o.disabled}
          className="sheen group relative flex w-full items-start gap-3 rounded-md bg-surface p-3.5 text-left shadow-[inset_0_0_0_1px_var(--line-strong)] transition-[box-shadow,background-color] duration-200 hover:shadow-[inset_0_0_0_1px_var(--primary)] data-[state=checked]:bg-primary-soft data-[state=checked]:shadow-[inset_0_0_0_2px_var(--primary)] disabled:opacity-50"
        >
          {o.icon && <span className="mt-0.5 shrink-0 text-primary">{o.icon}</span>}
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">{o.label}</span>
            {o.description && <span className="mt-0.5 block text-[0.9rem] leading-snug text-ink-2">{o.description}</span>}
          </span>
          {o.aside && <span className="shrink-0 text-right text-[0.8125rem] text-ink-2">{o.aside}</span>}
          <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full shadow-[inset_0_0_0_1.5px_var(--line-strong)] group-data-[state=checked]:bg-primary-strong group-data-[state=checked]:shadow-none">
            <svg width="10" height="10" viewBox="0 0 12 12" className="opacity-0 group-data-[state=checked]:opacity-100"><path d="M2.5 6.2 5 8.6 9.6 3.6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
