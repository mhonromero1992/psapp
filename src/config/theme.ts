import {DarkTheme, DefaultTheme, type Theme as NavTheme} from '@react-navigation/native';
import type {TextStyle} from 'react-native';

/**
 * PS-ACCESS palette, from the PSMBFI emblem: green #009444, blue #1054A4, red #EC1C24, and the
 * night-blue of a dress uniform. Light and dark are both planned; every text colour below is
 * checked against its grounds to WCAG AA (4.5:1) in __tests__/theme.test.ts. White text never sits
 * on the brand green or red (3.95:1 and 4.41:1): filled buttons use the deeper steps.
 */
export const brand = {
  blue: '#1054a4',
  blueDeep: '#0d4486',
  blueSoft: '#eef4fc',
  green: '#009444',
  greenDeep: '#007a38',
  red: '#ec1c24',
  redDeep: '#c4141b',
  night: '#050f22',
  night2: '#0c1830',
  night3: '#101f3b',
  ground: '#f3f5f9',
  panel: '#ffffff',
  panel2: '#eef1f6',
  ink: '#0a1628',
  ink2: '#4b5a72',
  ink3: '#5e6b80',
  onNight: '#eaf0f8',
  onNightMuted: '#a9b6ca',
  gold: '#c9a227',
  white: '#ffffff',
};

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

export interface Palette {
  scheme: 'light' | 'dark';
  /** Screen background. */
  ground: string;
  /** Cards and sheets. */
  panel: string;
  /** Inputs, insets, pressed rows. */
  panel2: string;
  text: string;
  /** Sentences that support a heading. */
  textSoft: string;
  /** Short labels and timestamps only. */
  textMuted: string;
  line: string;
  /** Input borders and other controls that need 3:1 against their surface. */
  lineStrong: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySoft: string;
  /** Text and icons in the action colour. */
  primaryText: string;
  positive: string;
  positivePressed: string;
  /** Night band (Equity card, membership card): the same in both schemes. */
  band: string;
  onBand: string;
  onBandMuted: string;
  link: string;
  focus: string;
  scrim: string;
  chart1: string;
  chart2: string;
  chartRef: string;
  chartGrid: string;
  tones: Record<Tone, {text: string; bg: string}>;
}

export const light: Palette = {
  scheme: 'light',
  ground: brand.ground,
  panel: brand.panel,
  panel2: brand.panel2,
  text: brand.ink,
  textSoft: brand.ink2,
  textMuted: brand.ink3,
  line: 'rgba(10, 22, 40, 0.09)',
  lineStrong: '#8a96a8',
  primary: brand.blue,
  primaryPressed: brand.blueDeep,
  onPrimary: brand.white,
  primarySoft: brand.blueSoft,
  primaryText: brand.blue,
  positive: brand.greenDeep,
  positivePressed: '#006b31',
  band: brand.night,
  onBand: brand.onNight,
  onBandMuted: brand.onNightMuted,
  link: brand.blue,
  focus: brand.blue,
  scrim: 'rgba(5, 15, 34, 0.5)',
  chart1: '#1054a4',
  chart2: '#009444',
  chartRef: '#b9c2d0',
  chartGrid: 'rgba(10, 22, 40, 0.07)',
  tones: {
    ok: {text: '#006b31', bg: '#e8f7ee'},
    warn: {text: '#9a4a00', bg: '#fef3e0'},
    bad: {text: '#b0121a', bg: '#fdecec'},
    info: {text: '#0d4486', bg: '#eef4fc'},
    neutral: {text: '#4b5a72', bg: '#e9edf3'},
  },
};

export const dark: Palette = {
  scheme: 'dark',
  ground: '#061024',
  panel: brand.night2,
  panel2: brand.night3,
  text: brand.onNight,
  textSoft: brand.onNightMuted,
  textMuted: '#8593aa',
  line: 'rgba(234, 240, 248, 0.09)',
  lineStrong: '#5d7290',
  primary: '#2563be',
  primaryPressed: '#1d55a8',
  onPrimary: brand.white,
  primarySoft: 'rgba(110, 164, 236, 0.14)',
  primaryText: '#6ea4ec',
  positive: '#1f8a4c',
  positivePressed: '#18763f',
  band: '#040b1a',
  onBand: brand.onNight,
  onBandMuted: brand.onNightMuted,
  link: '#6ea4ec',
  focus: '#6ea4ec',
  scrim: 'rgba(0, 0, 0, 0.6)',
  chart1: '#4a82d0',
  chart2: '#1fa35f',
  chartRef: '#4b5a72',
  chartGrid: 'rgba(234, 240, 248, 0.08)',
  tones: {
    ok: {text: '#3ccb7f', bg: 'rgba(60, 203, 127, 0.14)'},
    warn: {text: '#f5b544', bg: 'rgba(245, 181, 68, 0.14)'},
    bad: {text: '#ff6b70', bg: 'rgba(255, 107, 112, 0.14)'},
    info: {text: '#6ea4ec', bg: 'rgba(110, 164, 236, 0.14)'},
    neutral: {text: '#a9b6ca', bg: 'rgba(169, 182, 202, 0.12)'},
  },
};

/**
 * Archivo in six static cuts (src/assets/fonts, scripts/make-fonts.py). Each file is named after its
 * PostScript name, so one fontFamily works on Android and iOS. Never set fontWeight with these.
 */
export const fonts = {
  regular: 'Archivo-Regular',
  medium: 'Archivo-Medium',
  semibold: 'Archivo-SemiBold',
  bold: 'Archivo-Bold',
  /** Headings: semi-condensed like a uniform name tape. */
  display: 'ArchivoSemiCondensed-ExtraBold',
  title: 'ArchivoSemiCondensed-Bold',
};

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

/**
 * Most members are older: body text is 17 at Standard. The member's Text size setting scales the
 * whole scale (Large 1.12x, Extra large 1.25x), on top of the phone's own font size setting.
 */
const baseType = {
  hero: {fontFamily: fonts.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.6},
  display: {fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.4},
  title: {fontFamily: fonts.title, fontSize: 21, lineHeight: 26, letterSpacing: -0.2},
  heading: {fontFamily: fonts.bold, fontSize: 18, lineHeight: 24},
  body: {fontFamily: fonts.regular, fontSize: 17, lineHeight: 25},
  bodyStrong: {fontFamily: fonts.semibold, fontSize: 17, lineHeight: 25},
  small: {fontFamily: fonts.regular, fontSize: 15, lineHeight: 21},
  smallStrong: {fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21},
  label: {fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20},
  button: {fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22},
  tab: {fontFamily: fonts.bold, fontSize: 13, lineHeight: 16},
  figure: {fontFamily: fonts.display, fontSize: 38, lineHeight: 42, letterSpacing: -0.6},
  amount: {fontFamily: fonts.semibold, fontSize: 17, lineHeight: 25, fontVariant: tabular},
  amountLarge: {fontFamily: fonts.display, fontSize: 26, lineHeight: 30, fontVariant: tabular},
} satisfies Record<string, TextStyle>;

export type TypeScale = typeof baseType;
export type TextSize = 'standard' | 'large' | 'xlarge';
export const TEXT_SCALE: Record<TextSize, number> = {standard: 1, large: 1.12, xlarge: 1.25};

function scaleType(k: number): TypeScale {
  const out = {} as TypeScale;
  (Object.keys(baseType) as (keyof TypeScale)[]).forEach(key => {
    const t = baseType[key] as TextStyle;
    (out as Record<string, TextStyle>)[key] = {...t, fontSize: Math.round((t.fontSize ?? 17) * k), lineHeight: Math.round((t.lineHeight ?? 24) * k)};
  });
  return out;
}

export const space = {xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, gutter: 18};
export const radii = {control: 12, card: 20, sheet: 28, pill: 999};
/** Every control is at least this tall (older members, gloves, a moving jeepney). */
export const TOUCH = 52;

export interface AppTheme {
  colors: Palette;
  fonts: typeof fonts;
  type: TypeScale;
  space: typeof space;
  radii: typeof radii;
  /** The member's text size multiplier, for sizes outside the type scale (icons, touch targets). */
  scale: number;
}

export const makeTheme = (scheme: 'light' | 'dark' | null | undefined, textSize: TextSize = 'standard'): AppTheme => ({
  colors: scheme === 'dark' ? dark : light,
  fonts,
  type: scaleType(TEXT_SCALE[textSize]),
  space,
  radii,
  scale: TEXT_SCALE[textSize],
});

export function navTheme(p: Palette): NavTheme {
  const base = p.scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {...base.colors, background: p.ground, card: p.panel, border: p.line, notification: brand.redDeep, primary: p.primary, text: p.text},
  };
}
