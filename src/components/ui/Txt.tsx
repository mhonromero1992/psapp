import React from 'react';
import {Text, type TextProps} from 'react-native';
import {useTheme} from 'styled-components/native';
import type {Palette, Tone, TypeScale} from '../../config/theme';

export type TextVariant = keyof TypeScale;
export type TextColor = 'text' | 'soft' | 'muted' | 'onBand' | 'onBandMuted' | 'primary' | 'onPrimary' | 'link' | Tone;

export function colorOf(p: Palette, c: TextColor): string {
  switch (c) {
    case 'text':
      return p.text;
    case 'soft':
      return p.textSoft;
    case 'muted':
      return p.textMuted;
    case 'onBand':
      return p.onBand;
    case 'onBandMuted':
      return p.onBandMuted;
    case 'primary':
      return p.primaryText;
    case 'onPrimary':
      return p.onPrimary;
    case 'link':
      return p.link;
    default:
      return p.tones[c].text;
  }
}

/** Text in Archivo, sized by the theme's scale, the member's Text size and the phone's font size. */
export function Txt({variant = 'body', color = 'text', style, ...rest}: TextProps & {variant?: TextVariant; color?: TextColor}) {
  const t = useTheme();
  return <Text maxFontSizeMultiplier={1.6} {...rest} style={[t.type[variant], {color: colorOf(t.colors, color)}, style]} />;
}
