import { useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { Camera, FilePdf, Trash, WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { SPRING } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { WRAP_BTN } from "./Page";
import type { PickedFile } from "@/components/ui/FileDrop";

/*
 * Form pieces sized for older members: 1rem labels, hints and errors at 0.9375rem in
 * ink-2 (never the muted grey), and touch targets of at least 3rem.
 */

export function MField({
  label, hint, error, optional, children, className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  optional?: boolean;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
  className?: string;
}) {
  const t = useT();
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-[1rem] font-semibold leading-snug text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-2">{t("(optional)", "(hindi kailangan)")}</span>}
      </label>
      {children({ id, describedBy: [hintId, errId].filter(Boolean).join(" ") || undefined, invalid: !!error })}
      {hint && !error && (
        <p id={hintId} className="text-[1rem] leading-snug text-ink-2">
          {hint}
        </p>
      )}
      {error && <FieldError id={errId}>{error}</FieldError>}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-2 text-[1rem] font-semibold leading-snug text-negative">
      <WarningCircle size="1.25rem" weight="fill" className="mt-px shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** A group label for choices that are not a single input (radio cards, uploads). */
export function GroupLabel({ id, children, hint }: { id?: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p id={id} className="text-[1rem] font-semibold leading-snug text-ink">
        {children}
      </p>
      {hint && <p className="mt-1 text-[1rem] leading-snug text-ink-2">{hint}</p>}
    </div>
  );
}

/** Larger text for RadioCards descriptions and asides (the shared card sets them small). */
export const CardNote = ({ children }: { children: React.ReactNode }) => <span className="mt-1 block text-[1rem] leading-snug text-ink-2">{children}</span>;

/** Segmented choice with 3rem targets and a sliding indicator. */
export function BigSegmented<T extends string>({ value, onValueChange, options, ariaLabel, className }: { value: T; onValueChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; ariaLabel: string; className?: string }) {
  const layoutId = useId();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("flex rounded-[14px] bg-sunken p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onValueChange(o.value)}
            className={cn("relative min-h-12 flex-1 rounded-[11px] px-3 text-[1rem] font-semibold transition-colors duration-200", active ? "text-ink" : "text-ink-2 hover:text-ink")}
          >
            {active && <motion.span layoutId={layoutId} transition={SPRING} className="absolute inset-0 rounded-[11px] bg-surface shadow-e1" />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Photo and document upload ─────────────────────────────── */

async function readFiles(list: FileList): Promise<PickedFile[]> {
  return Promise.all(
    Array.from(list).map(
      (f) =>
        new Promise<PickedFile>((resolve) => {
          const base = { id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`, name: f.name, size: f.size, type: f.type };
          if (!f.type.startsWith("image/")) return resolve(base);
          const reader = new FileReader();
          reader.onload = () => {
            const img = new Image();
            img.onload = () => {
              // A light preview: nothing leaves the browser in this prototype.
              const c = document.createElement("canvas");
              const s = Math.min(1, 360 / Math.max(img.width, img.height));
              c.width = Math.max(1, Math.round(img.width * s));
              c.height = Math.max(1, Math.round(img.height * s));
              c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
              resolve({ ...base, preview: c.toDataURL("image/jpeg", 0.72) });
            };
            img.onerror = () => resolve(base);
            img.src = String(reader.result);
          };
          reader.onerror = () => resolve(base);
          reader.readAsDataURL(f);
        }),
    ),
  );
}

/**
 * One document slot: a large "Add a photo" button (the phone offers the camera or the
 * gallery), drag and drop on desktop, previews with a labelled Remove button.
 */
export function DocUpload({ label, hint, files, onChange, multiple = true, invalid, className }: { label: string; hint?: string; files: PickedFile[]; onChange: (f: PickedFile[]) => void; multiple?: boolean; invalid?: boolean; className?: string }) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const labelId = useId();
  const add = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const picked = await readFiles(list);
    onChange(multiple ? [...files, ...picked] : picked.slice(0, 1));
  };
  const done = files.length > 0;
  return (
    <div
      className={cn("rounded-lg bg-surface p-4 shadow-e1 transition-[box-shadow,background-color] duration-200 sm:p-5", over && "bg-primary-soft shadow-[inset_0_0_0_2px_var(--primary)]", invalid && !done && "shadow-[inset_0_0_0_2px_var(--negative)]", className)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        add(e.dataTransfer.files);
      }}
    >
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-full text-[0.95rem] font-bold", done ? "bg-green-700 text-white" : "bg-sunken text-ink-2")} aria-hidden>
          {done ? (
            <svg width="14" height="14" viewBox="0 0 12 12">
              <path d="M2.5 6.2 5 8.6 9.6 3.6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <Camera size="1.2rem" weight="duotone" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p id={labelId} className="text-[1rem] font-semibold leading-snug text-ink">
            {label}
          </p>
          <p className="mt-0.5 text-[0.9375rem] leading-snug text-ink-2">
            {done ? t(`${files.length} ${files.length === 1 ? "file" : "files"} added`, `${files.length} file ang naidagdag`) : hint ?? t("A clear photo or a PDF", "Malinaw na litrato o PDF")}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,7rem),1fr))] gap-2.5">
          {files.map((f) => (
            <li key={f.id} className="overflow-hidden rounded-md bg-sunken">
              {f.preview ? (
                <img src={f.preview} alt={t(`Photo: ${f.name}`, `Litrato: ${f.name}`)} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="grid aspect-[4/3] place-items-center text-ink-2">
                  <span className="flex flex-col items-center gap-1 text-[0.9375rem] font-semibold">
                    <FilePdf size="2rem" weight="duotone" aria-hidden />
                    PDF
                  </span>
                </div>
              )}
              <div className="px-2.5 pb-2 pt-1.5">
                <p className="truncate text-[0.875rem] text-ink-2">{f.name}</p>
                <button
                  type="button"
                  onClick={() => onChange(files.filter((x) => x.id !== f.id))}
                  className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-sm px-1 text-[0.9375rem] font-semibold text-negative"
                  aria-label={t(`Remove ${f.name}`, `Alisin ang ${f.name}`)}
                >
                  <Trash size="1.1rem" weight="bold" aria-hidden />
                  {t("Remove", "Alisin")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button variant="tonal" size="lg" block className={cn("mt-4", WRAP_BTN)} onClick={() => input.current?.click()} aria-describedby={labelId} icon={<Camera size="1.35rem" weight="bold" />}>
        {done ? t("Add another photo", "Magdagdag pa ng litrato") : t("Add a photo or file", "Magdagdag ng litrato o file")}
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
