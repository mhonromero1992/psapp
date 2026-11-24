import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import type {TextSize} from '../config/theme';
import {appStorage} from './storage';

export type Lang = 'en' | 'fil';
export type ThemePref = 'light' | 'dark' | 'system';

interface PrefsState {
  theme: ThemePref;
  lang: Lang;
  textSize: TextSize;
  /** Presenter tools: simulate PSMBFI processing during a demo. */
  presenter: boolean;
  setTheme: (t: ThemePref) => void;
  setLang: (l: Lang) => void;
  setTextSize: (t: TextSize) => void;
  setPresenter: (v: boolean) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    set => ({
      theme: 'system',
      lang: 'en',
      textSize: 'standard',
      presenter: false,
      setTheme: theme => set({theme}),
      setLang: lang => set({lang}),
      setTextSize: textSize => set({textSize}),
      setPresenter: presenter => set({presenter}),
    }),
    {name: 'psaccess.prefs', version: 1, storage: appStorage},
  ),
);
