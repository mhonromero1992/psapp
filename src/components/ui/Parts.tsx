import React from 'react';
import {Pressable, StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import {useTheme} from 'styled-components/native';
import type {Tone} from '../../config/theme';
import {Icon, type IconName} from './Icon';
import {Txt} from './Txt';

/** A surface: separated by material and depth, not borders. */
export function Card({children, style, tone = 'panel', pad = 18}: {children: React.ReactNode; style?: StyleProp<ViewStyle>; tone?: 'panel' | 'band' | 'inset'; pad?: number}) {
  const {colors, radii} = useTheme();
  return (
    <View
      style={[
        {borderRadius: radii.card, padding: pad, backgroundColor: tone === 'band' ? colors.band : tone === 'inset' ? colors.panel2 : colors.panel},
        tone === 'panel' && (colors.scheme === 'light' ? styles.shadow : styles.edge),
        tone === 'panel' && colors.scheme === 'dark' && {borderColor: colors.line},
        style,
      ]}>
      {children}
    </View>
  );
}

/** A section heading with an optional action on the right. */
export function SectionHead({title, action, count}: {title: string; action?: React.ReactNode; count?: number}) {
  return (
    <View style={styles.sectionHead}>
      <Txt variant="title" accessibilityRole="header" style={styles.flex}>
        {title}
        {typeof count === 'number' ? <Txt variant="bodyStrong" color="muted">{`  ${count}`}</Txt> : null}
      </Txt>
      {action}
    </View>
  );
}

/** A tappable two-line list row: at least 64dp, the whole row is the target. */
export function ListRow({title, subtitle, icon, right, onPress, accessibilityHint, tone}: {title: string; subtitle?: string; icon?: IconName; right?: React.ReactNode; onPress?: () => void; accessibilityHint?: string; tone?: Tone}) {
  const {colors} = useTheme();
  const body = (
    <>
      {icon && (
        <View style={[styles.rowIcon, {backgroundColor: tone ? colors.tones[tone].bg : colors.primarySoft}]}>
          <Icon name={icon} size={24} weight="duotone" color={tone ? colors.tones[tone].text : colors.primaryText} />
        </View>
      )}
      <View style={styles.flex}>
        <Txt variant="bodyStrong">{title}</Txt>
        {subtitle ? <Txt variant="small" color="soft">{subtitle}</Txt> : null}
      </View>
      {right}
      {onPress && !right ? <Icon name="chevron" size={18} color={colors.textMuted} weight="bold" /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title} accessibilityHint={accessibilityHint} style={({pressed}) => [styles.row, pressed && {backgroundColor: colors.panel2}]}>
      {body}
    </Pressable>
  );
}

export function Divider() {
  const {colors} = useTheme();
  return <View style={{height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.line}} />;
}

/** A real status label with a shape cue, so colour is never the only signal. */
export function Badge({tone = 'neutral', label}: {tone?: Tone; label: string}) {
  const {colors} = useTheme();
  const t = colors.tones[tone];
  const glyph: IconName = tone === 'ok' ? 'check' : tone === 'warn' ? 'warning' : tone === 'bad' ? 'close' : 'info';
  return (
    <View style={[styles.badge, {backgroundColor: t.bg}]} accessible accessibilityLabel={label}>
      {tone !== 'neutral' && <Icon name={glyph} size={14} color={t.text} weight="bold" />}
      <Txt variant="smallStrong" style={{color: t.text}}>
        {label}
      </Txt>
    </View>
  );
}

/** Peso amount with tabular figures. */
export function money(n: number, opts: {whole?: boolean; sign?: boolean} = {}) {
  const abs = Math.abs(n);
  const body = abs.toLocaleString('en-PH', {minimumFractionDigits: opts.whole ? 0 : 2, maximumFractionDigits: opts.whole ? 0 : 2});
  return `${n < 0 ? '−' : opts.sign && n > 0 ? '+' : ''}₱${body}`;
}

/** Progress, always paired with words nearby. */
export function ProgressBar({value, max = 1, tone = 'primary', label}: {value: number; max?: number; tone?: 'primary' | 'positive'; label: string}) {
  const {colors} = useTheme();
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{min: 0, max: 100, now: Math.round(pct * 100)}} style={[styles.track, {backgroundColor: colors.panel2}]}>
      <View style={{width: `${pct * 100}%`, height: '100%', borderRadius: 999, backgroundColor: tone === 'positive' ? colors.positive : colors.primary}} />
    </View>
  );
}

/** Initials only: no invented photos. */
export function Avatar({name, size = 40}: {name: string; size?: number}) {
  const parts = name.replace(/[^A-Za-zÑñ .-]/g, '').split(/\s+/).filter(Boolean);
  const initials = ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  const palette = [['#e3edf9', '#0d4486'], ['#e2f4ea', '#006b31'], ['#fbe5e6', '#9b1015']];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [bg, fg] = palette[h % palette.length];
  return (
    <View style={{width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center'}} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Txt variant="smallStrong" style={{color: fg, fontSize: size * 0.38, lineHeight: size * 0.46}}>
        {initials}
      </Txt>
    </View>
  );
}

/** Label above, value below: the building block of detail screens. */
export function Fact({label, value, big}: {label: string; value: string; big?: boolean}) {
  return (
    <View style={styles.fact}>
      <Txt variant="small" color="soft">
        {label}
      </Txt>
      <Txt variant={big ? 'amountLarge' : 'amount'}>{value}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {shadowColor: '#071b37', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: {width: 0, height: 4}, elevation: 2},
  edge: {borderWidth: StyleSheet.hairlineWidth * 2},
  sectionHead: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, minHeight: 44},
  flex: {flex: 1},
  row: {flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 68, paddingVertical: 12, paddingHorizontal: 16},
  rowIcon: {width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  badge: {flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8},
  track: {height: 10, borderRadius: 999, overflow: 'hidden'},
  fact: {gap: 2, flex: 1, minWidth: 130},
});
