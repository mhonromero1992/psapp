import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import type {TextSize} from '../../config/theme';
import {useT} from '../../lib/i18n';
import {usePrefs, type ThemePref} from '../../store/prefs';
import {Icon} from './Icon';
import {Txt} from './Txt';

/**
 * Text size for older eyes: scales the whole app's type, on top of the phone's own setting. Three
 * tiles side by side at Standard; at Large and Extra large the choices stack, so no word breaks.
 */
export function TextSizeControl() {
  const t = useT();
  const {colors, scale} = useTheme();
  const size = usePrefs(s => s.textSize);
  const setSize = usePrefs(s => s.setTextSize);
  const stacked = scale > 1;
  const opts: {value: TextSize; glyph: number; en: string; fil: string}[] = [
    {value: 'standard', glyph: 16, en: 'Standard', fil: 'Karaniwan'},
    {value: 'large', glyph: 21, en: 'Large', fil: 'Malaki'},
    {value: 'xlarge', glyph: 26, en: 'Extra large', fil: 'Pinakamalaki'},
  ];
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('Text size', 'Laki ng letra')} style={stacked ? styles.col : styles.row}>
      {opts.map(o => {
        const on = size === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => setSize(o.value)}
            accessibilityRole="radio"
            accessibilityState={{checked: on}}
            accessibilityLabel={t(o.en, o.fil)}
            style={[stacked ? styles.sizeRow : styles.size, {backgroundColor: on ? colors.primarySoft : colors.panel2, borderColor: on ? colors.primary : colors.panel2}]}>
            <View style={stacked ? styles.glyphBox : undefined}>
              <Txt variant="display" style={{fontSize: o.glyph, lineHeight: o.glyph + 4, color: on ? colors.primaryText : colors.textSoft}} allowFontScaling={false}>
                A
              </Txt>
            </View>
            <Txt variant={stacked ? 'bodyStrong' : 'smallStrong'} color={on ? 'primary' : 'soft'} numberOfLines={stacked ? undefined : 2} style={stacked ? styles.grow : styles.center}>
              {t(o.en, o.fil)}
            </Txt>
            {stacked && on ? <Icon name="checkCircle" size={24} weight="fill" color={colors.primaryText} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function LangToggle() {
  const {colors} = useTheme();
  const lang = usePrefs(s => s.lang);
  const setLang = usePrefs(s => s.setLang);
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Language / Wika" style={[styles.pill, {backgroundColor: colors.panel2}]}>
      {(['en', 'fil'] as const).map(l => (
        <Pressable key={l} onPress={() => setLang(l)} accessibilityRole="radio" accessibilityState={{checked: lang === l}} accessibilityLabel={l === 'en' ? 'English' : 'Filipino'} style={[styles.pillItem, lang === l && {backgroundColor: colors.panel}]}>
          <Txt variant="smallStrong" color={lang === l ? 'text' : 'soft'}>
            {l === 'en' ? 'EN' : 'FIL'}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}

export function ThemeChoice() {
  const t = useT();
  const {colors, scale} = useTheme();
  const theme = usePrefs(s => s.theme);
  const setTheme = usePrefs(s => s.setTheme);
  const stacked = scale > 1;
  const opts: {value: ThemePref; en: string; fil: string}[] = [
    {value: 'system', en: 'Same as phone', fil: 'Gaya ng phone'},
    {value: 'light', en: 'Light', fil: 'Maliwanag'},
    {value: 'dark', en: 'Dark', fil: 'Madilim'},
  ];
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('Screen', 'Screen')} style={[styles.pill, stacked && styles.pillCol, {backgroundColor: colors.panel2}]}>
      {opts.map(o => {
        const on = theme === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => setTheme(o.value)}
            accessibilityRole="radio"
            accessibilityState={{checked: on}}
            accessibilityLabel={t(o.en, o.fil)}
            style={[styles.pillItem, stacked ? styles.pillRow : styles.grow, on && {backgroundColor: colors.panel}]}>
            <Txt variant={stacked ? 'bodyStrong' : 'smallStrong'} color={on ? 'text' : 'soft'} numberOfLines={stacked ? undefined : 2} style={stacked ? styles.grow : styles.center}>
              {t(o.en, o.fil)}
            </Txt>
            {stacked && on ? <Icon name="checkCircle" size={22} weight="fill" color={colors.primaryText} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 8},
  col: {gap: 8},
  size: {flex: 1, minHeight: 78, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 4},
  sizeRow: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, borderRadius: 16, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 8},
  glyphBox: {width: 30, alignItems: 'center'},
  center: {textAlign: 'center'},
  pill: {flexDirection: 'row', padding: 4, borderRadius: 14, gap: 4},
  pillItem: {minHeight: 44, minWidth: 54, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 11},
  pillCol: {flexDirection: 'column'},
  pillRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 10, minHeight: 52, paddingHorizontal: 14},
  grow: {flex: 1},
});
