import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/i18n";

export type ThemePref = "light" | "dark" | "system";
/** Root text size. Standard is already larger than the web default because most members are older. */
export type TextSize = "standard" | "large" | "xlarge";
export const TEXT_SIZE_PX: Record<TextSize, number> = { standard: 17, large: 19, xlarge: 21 };

interface PrefsState {
  theme: ThemePref;
  lang: Lang;
  textSize: TextSize;
  /** Presenter tools: simulate PSMBFI processing during a demo. */
  presenter: boolean;
  setPresenter: (v: boolean) => void;
  setTheme: (t: ThemePref) => void;
  setLang: (l: Lang) => void;
  setTextSize: (t: TextSize) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      theme: "light",
      lang: "en",
      textSize: "standard",
      presenter: false,
      setPresenter: (presenter) => set({ presenter }),
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      setTextSize: (textSize) => set({ textSize }),
    }),
    { name: "psaccess.prefs", version: 2, migrate: (p) => ({ ...(p as object), textSize: "standard" }) as never },
  ),
);

export function resolveTheme(pref: ThemePref): "light" | "dark" {
  if (pref !== "system") return pref;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
