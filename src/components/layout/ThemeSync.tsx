import { useEffect } from "react";
import { resolveTheme, TEXT_SIZE_PX, usePrefs } from "@/store/prefs";

/** Applies the theme preference to <html data-theme> and follows the OS when set to system. */
export function ThemeSync() {
  const theme = usePrefs((s) => s.theme);
  const lang = usePrefs((s) => s.lang);
  useEffect(() => {
    const apply = () => {
      const t = resolveTheme(theme);
      document.documentElement.dataset.theme = t;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#061024" : "#f3f5f9");
    };
    apply();
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    document.documentElement.lang = lang === "fil" ? "fil" : "en";
  }, [lang]);
  // Text size scales every rem in the app (type, spacing, touch targets) together.
  const textSize = usePrefs((s) => s.textSize);
  useEffect(() => {
    document.documentElement.style.fontSize = `${TEXT_SIZE_PX[textSize]}px`;
  }, [textSize]);
  return null;
}
