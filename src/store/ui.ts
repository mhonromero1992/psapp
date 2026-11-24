import {AccessibilityInfo} from 'react-native';
import {create} from 'zustand';
import type {Tone} from '../config/theme';

export interface ToastItem {
  id: number;
  title: string;
  body?: string;
  tone: Tone;
}

interface UiState {
  toasts: ToastItem[];
  helpOpen: boolean;
  helpTopic: string;
  /** Open sheets and dialogs, last on top. Toasts show on the top one (a Modal covers the app). */
  modals: number[];
  pushModal: (id: number) => void;
  popModal: (id: number) => void;
  push: (t: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: number) => void;
  openHelp: (topic?: string) => void;
  closeHelp: () => void;
}

let seq = 0;
export const useUi = create<UiState>()(set => ({
  toasts: [],
  helpOpen: false,
  helpTopic: 'Something else',
  modals: [],
  pushModal: id => set(s => ({modals: [...s.modals.filter(m => m !== id), id]})),
  popModal: id => set(s => ({modals: s.modals.filter(m => m !== id)})),
  push: t => {
    const id = ++seq;
    set(s => ({toasts: [...s.toasts.slice(-2), {...t, id}]}));
    AccessibilityInfo.announceForAccessibility(t.body ? `${t.title}. ${t.body}` : t.title);
    setTimeout(() => set(s => ({toasts: s.toasts.filter(x => x.id !== id)})), 5000);
  },
  dismiss: id => set(s => ({toasts: s.toasts.filter(x => x.id !== id)})),
  openHelp: topic => set(s => ({helpOpen: true, helpTopic: topic ?? s.helpTopic})),
  closeHelp: () => set({helpOpen: false}),
}));

export const toast = (title: string, tone: Tone = 'ok', body?: string) => useUi.getState().push({title, body, tone});
