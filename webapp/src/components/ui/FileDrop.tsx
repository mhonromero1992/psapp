import { useRef, useState } from "react";
import { Camera, FilePlus, Trash } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

export interface PickedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

/**
 * Photo/document picker. On phones the camera opens directly (capture). Images get a
 * small preview; nothing leaves the browser in this prototype.
 */
export function FileDrop({ files, onChange, label, hint, accept = "image/*,application/pdf", multiple = true, capture = true, id }: { files: PickedFile[]; onChange: (f: PickedFile[]) => void; label: string; hint?: string; accept?: string; multiple?: boolean; capture?: boolean; id?: string }) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const add = async (list: FileList | null) => {
    if (!list) return;
    const picked = await Promise.all(
      Array.from(list).map(
        (f) =>
          new Promise<PickedFile>((resolve) => {
            const base = { id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`, name: f.name, size: f.size, type: f.type };
            if (!f.type.startsWith("image/")) return resolve(base);
            const reader = new FileReader();
            reader.onload = () => {
              // Downscale for a light preview.
              const img = new Image();
              img.onload = () => {
                const c = document.createElement("canvas");
                const s = Math.min(1, 320 / Math.max(img.width, img.height));
                c.width = Math.round(img.width * s);
                c.height = Math.round(img.height * s);
                c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
                resolve({ ...base, preview: c.toDataURL("image/jpeg", 0.72) });
              };
              img.onerror = () => resolve(base);
              img.src = String(reader.result);
            };
            reader.readAsDataURL(f);
          }),
      ),
    );
    onChange(multiple ? [...files, ...picked] : picked.slice(0, 1));
  };

  return (
    <div>
      <div
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
        className={cn("flex flex-col items-center gap-3 rounded-lg bg-sunken px-4 py-6 text-center transition-[background-color,box-shadow] duration-200", over && "bg-primary-soft shadow-[inset_0_0_0_2px_var(--primary)]")}
      >
        <span className="grid size-11 place-items-center rounded-full bg-surface text-primary shadow-e1">
          <Camera size={22} weight="duotone" />
        </span>
        <div>
          <p className="font-semibold text-ink">{label}</p>
          {hint && <p className="mt-0.5 text-[0.9375rem] text-ink-2">{hint}</p>}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className="btn btn-tonal" onClick={() => input.current?.click()}>
            <span className="btn-label inline-flex items-center gap-[inherit]">
              <FilePlus size={18} weight="bold" /> {t("Add photo or file", "Magdagdag ng litrato o file")}
            </span>
          </button>
        </div>
        <input id={id} ref={input} type="file" accept={accept} multiple={multiple} {...(capture ? { capture: "environment" as const } : {})} className="sr-only" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>
      {files.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((f) => (
            <li key={f.id} className="group relative overflow-hidden rounded-md bg-surface shadow-e1">
              {f.preview ? (
                <img src={f.preview} alt={t(`Preview of ${f.name}`, `Silip ng ${f.name}`)} width={320} height={200} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="grid aspect-[4/3] place-items-center bg-sunken text-[0.8rem] font-semibold text-ink-2">{f.type === "application/pdf" ? "PDF" : (f.name.split(".").pop() ?? "File").toUpperCase()}</div>
              )}
              <div className="flex flex-col gap-0.5 px-2 py-1.5">
                <span className="truncate text-[0.875rem] font-medium text-ink-2">{f.name}</span>
                <button type="button" aria-label={t(`Remove ${f.name}`, `Alisin ang ${f.name}`)} onClick={() => onChange(files.filter((x) => x.id !== f.id))} className="flex min-h-11 shrink-0 items-center gap-1 rounded-sm px-2 text-[0.875rem] font-semibold text-negative transition-colors hover:bg-negative-soft">
                  <Trash size={17} weight="bold" aria-hidden /> {t("Remove", "Alisin")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
