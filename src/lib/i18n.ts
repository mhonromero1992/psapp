import {usePrefs} from '../store/prefs';

export type {Lang} from '../store/prefs';
export type TFn = (en: string, fil?: string) => string;

/** Inline bilingual strings: t("Apply for a loan", "Mag-apply ng loan"). */
export function useT(): TFn {
  const lang = usePrefs(s => s.lang);
  return (en: string, fil?: string) => (lang === 'fil' && fil ? fil : en);
}

export function useLang() {
  return usePrefs(s => s.lang);
}
