import { Moon, Sun } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { resolveTheme, usePrefs } from "@/store/prefs";

export function ThemeToggle({ className, tone = "ink" }: { className?: string; tone?: "ink" | "light" }) {
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const isDark = resolveTheme(theme) === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      className={cn("btn btn-icon btn-sm", tone === "light" ? "btn-glass" : "btn-ghost", className)}
    >
      <span className="btn-label">{isDark ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}</span>
    </button>
  );
}

/** English / Filipino switch for the Member App. */
export function LangToggle({ className }: { className?: string }) {
  const lang = usePrefs((s) => s.lang);
  const setLang = usePrefs((s) => s.setLang);
  return (
    <div role="radiogroup" aria-label="Language" className={cn("inline-flex rounded-[10px] bg-sunken p-0.5 text-[0.78rem] font-bold", className)}>
      {(["en", "fil"] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lang === l}
          onClick={() => setLang(l)}
          className={cn("h-10 min-w-12 rounded-[8px] px-2.5 text-[0.85rem] transition-colors duration-200", lang === l ? "bg-surface text-ink shadow-e1" : "text-ink-3 hover:text-ink")}
        >
          {l === "en" ? "EN" : "FIL"}
        </button>
      ))}
    </div>
  );
}

/** Text size for older eyes: scales every rem in the app (type, spacing, touch targets). */
export function TextSizeControl({ className }: { className?: string }) {
  const size = usePrefs((s) => s.textSize);
  const setSize = usePrefs((s) => s.setTextSize);
  const lang = usePrefs((s) => s.lang);
  const opts = [
    { value: "standard" as const, glyph: "text-[15px]", en: "Standard", fil: "Karaniwan" },
    { value: "large" as const, glyph: "text-[19px]", en: "Large", fil: "Malaki" },
    { value: "xlarge" as const, glyph: "text-[23px]", en: "Extra large", fil: "Pinakamalaki" },
  ];
  return (
    <div role="radiogroup" aria-label={lang === "fil" ? "Laki ng letra" : "Text size"} className={cn("grid grid-cols-3 gap-2", className)}>
      {opts.map((o) => {
        const on = size === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setSize(o.value)}
            className={cn(
              "flex min-h-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-[14px] px-2 transition-[background-color,box-shadow,color] duration-200",
              on ? "bg-primary-soft text-primary shadow-[inset_0_0_0_2px_var(--primary)]" : "bg-sunken text-ink-2 hover:text-ink",
            )}
          >
            <span aria-hidden className={cn("font-display font-extrabold leading-none [font-stretch:90%]", o.glyph)}>A</span>
            <span className="text-[0.8rem] font-semibold leading-tight">{lang === "fil" ? o.fil : o.en}</span>
          </button>
        );
      })}
    </div>
  );
}
