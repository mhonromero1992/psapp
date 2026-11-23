import { usePrefs } from "@/store/prefs";

export type Lang = "en" | "fil";

/**
 * Inline bilingual strings: t("Apply for a loan", "Mag-apply ng loan").
 * The member app ships in Filipino and English; staff and agency portals are English.
 */
export function useT() {
  const lang = usePrefs((s) => s.lang);
  return (en: string, fil?: string) => (lang === "fil" && fil ? fil : en);
}

export function useLang() {
  return usePrefs((s) => s.lang);
}
