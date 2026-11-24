/*
 * Pieces shared by the Loans, Equity and Payouts screens (all owned by this feature).
 * Ported from the web version's parts (Bits, Controls, download), rewritten for React Native.
 */
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, Easing, Pressable, Share, StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {BladeMark, Ribbon} from '../../components/brand/Brand';
import {Button, Card, Icon, money, Txt} from '../../components/ui';
import {LOAN_PRODUCTS} from '../../data/reference';
import type {PayoutAccount} from '../../data/types';
import {maskAccount} from '../../lib/format';
import {useT, type TFn} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {toast} from '../../store/ui';
import {HelpLink} from '../shared/Help';

/* ── Words ─────────────────────────────────────────────────── */

/** "10% a year" / "10% kada taon" */
export const perYear = (rate: number, t: TFn) => t(`${Math.round(rate * 100)}% a year`, `${Math.round(rate * 100)}% kada taon`);
/** "24 months" / "24 buwan" */
export const monthsText = (n: number, t: TFn) => t(`${n} ${n === 1 ? 'month' : 'months'}`, `${n} buwan`);
/** "2 working days" / "2 araw ng trabaho" */
export const workingDays = (n: number, t: TFn) => t(`${n} working ${n === 1 ? 'day' : 'days'}`, `${n} araw ng trabaho`);

/* ── Sharing (statements and summaries) ────────────────────── */

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
/** Plain CSV lines, readable as text and pasteable into a spreadsheet. */
export const toCsv = (rows: (string | number)[][]) => rows.map(r => r.map(cell).join(',')).join('\n');

/** Opens the phone's share sheet (email, Messenger, Viber, Files). A plain message if it cannot open. */
export async function shareText(title: string, message: string, t: TFn) {
  try {
    await Share.share({title, message}, {dialogTitle: title, subject: title});
  } catch {
    toast(t('Sharing did not open', 'Hindi nagbukas ang pag-share'), 'bad', t('Please try again. You can also ask your branch for a printed copy.', 'Subukan muli. Puwede ka ring humingi ng printed na kopya sa iyong sangay.'));
  }
}

/* ── Success view ──────────────────────────────────────────── */

/** The three blades settle around a check, once. Still under reduced motion. */
function SuccessMark() {
  const {colors} = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!alive) {
        return;
      }
      if (reduced) {
        v.setValue(1);
      } else {
        Animated.timing(v, {toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true}).start();
      }
    });
    return () => {
      alive = false;
    };
  }, [v]);
  const rotate = v.interpolate({inputRange: [0, 1], outputRange: ['-120deg', '0deg']});
  const scale = v.interpolate({inputRange: [0, 1], outputRange: [0.7, 1]});
  const pop = v.interpolate({inputRange: [0, 0.45, 1], outputRange: [0.4, 0.4, 1]});
  const show = v.interpolate({inputRange: [0, 0.45, 1], outputRange: [0, 0, 1]});
  return (
    <View style={styles.mark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.markBlades, {opacity: v, transform: [{rotate}, {scale}]}]}>
        <BladeMark size={92} />
      </Animated.View>
      <Animated.View style={[styles.markDisc, {backgroundColor: colors.panel, opacity: show, transform: [{scale: pop}]}]}>
        <Icon name="check" size={26} weight="bold" color={colors.positive} />
      </Animated.View>
    </View>
  );
}

export interface NextStep {
  title: string;
  body: string;
}

/**
 * After any submission: a check, the reference number, what happens next and when, and a big
 * "Back to Home". `secondary` is an extra button (View my loan, Done).
 */
export function SuccessView({title, body, refLabel, refId, next, secondary, helpTopic, onHome}: {title: string; body: string; refLabel: string; refId: string; next: NextStep[]; secondary?: React.ReactNode; helpTopic: string; onHome?: () => void}) {
  const t = useT();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  return (
    <View style={styles.success}>
      <SuccessMark />
      <View style={styles.successHead} accessibilityLiveRegion="polite">
        <Txt variant="display" accessibilityRole="header">
          {title}
        </Txt>
        <Txt variant="body" color="soft">
          {body}
        </Txt>
      </View>
      <Card tone="inset" style={styles.ref}>
        <Txt variant="smallStrong" color="soft">
          {refLabel}
        </Txt>
        <Txt variant="amountLarge" selectable>
          {refId}
        </Txt>
        <Txt variant="small" color="soft">
          {t('Keep this number. Our staff will ask for it if you call.', 'Itago ang numerong ito. Hihingin ito ng aming staff kapag tumawag ka.')}
        </Txt>
      </Card>
      <Txt variant="title" accessibilityRole="header" style={styles.nextHead}>
        {t('What happens next', 'Ano ang susunod')}
      </Txt>
      <View style={styles.nextList}>
        {next.map((n, i) => (
          <View key={n.title} style={styles.nextRow}>
            <View style={[styles.nextNo, {backgroundColor: colors.primarySoft}]}>
              <Txt variant="bodyStrong" color="primary">
                {String(i + 1)}
              </Txt>
            </View>
            <View style={styles.flex}>
              <Txt variant="bodyStrong">{n.title}</Txt>
              <Txt variant="body" color="soft">
                {n.body}
              </Txt>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.actions}>
        <Button
          title={t('Back to Home', 'Bumalik sa Home')}
          icon="home"
          onPress={() => {
            onHome?.();
            nav.navigate('Main', {screen: 'Home'});
          }}
        />
        {secondary}
      </View>
      <HelpLink topic={helpTopic} />
    </View>
  );
}

/* ── Small building blocks ─────────────────────────────────── */

/** Bank or e-wallet: a labelled icon, the provider and the masked number (never the full number). */
export function AccountMark({account}: {account: Pick<PayoutAccount, 'kind' | 'provider' | 'accountNo'>}) {
  const t = useT();
  const {colors} = useTheme();
  const bank = account.kind === 'bank';
  return (
    <View style={styles.acct}>
      <View style={[styles.acctIcon, {backgroundColor: bank ? colors.primarySoft : colors.tones.ok.bg}]}>
        <Icon name={bank ? 'loans' : 'payouts'} size={24} weight="duotone" color={bank ? colors.primaryText : colors.tones.ok.text} />
      </View>
      <View style={styles.flex}>
        <Txt variant="bodyStrong">{account.provider}</Txt>
        <Txt variant="small" color="soft">
          {bank ? t('Bank account', 'Bank account') : t('E-wallet', 'E-wallet')} {maskAccount(account.accountNo)}
        </Txt>
      </View>
    </View>
  );
}

/** Label over value, with an optional short line under it (a hint, a date). */
export function Figure({label, value, hint, big}: {label: string; value: string; hint?: string; big?: boolean}) {
  return (
    <View style={styles.figure}>
      <Txt variant="small" color="soft">
        {label}
      </Txt>
      <Txt variant={big ? 'amountLarge' : 'amount'}>{value}</Txt>
      {hint ? (
        <Txt variant="small" color="soft">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

/** One line of a review list: what was chosen, and a Change link that goes back to that step. */
export function ReviewRow({label, value, big, onChange}: {label: string; value: string; big?: boolean; onChange?: () => void}) {
  const t = useT();
  const {colors} = useTheme();
  return (
    <View style={styles.review}>
      <View style={styles.flex}>
        <Txt variant="small" color="soft">
          {label}
        </Txt>
        <Txt variant={big ? 'amountLarge' : 'bodyStrong'}>{value}</Txt>
      </View>
      {onChange ? (
        <Pressable onPress={onChange} accessibilityRole="button" accessibilityLabel={t(`Change: ${label}`, `Baguhin: ${label}`)} style={({pressed}) => [styles.change, pressed && {backgroundColor: colors.panel2}]}>
          <Icon name="pencil" size={18} weight="bold" color={colors.primaryText} />
          <Txt variant="smallStrong" color="primary">
            {t('Change', 'Baguhin')}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Big tappable amounts or phrases: one tap instead of typing. */
export function Chips<T extends string | number>({options, value, onPick, label}: {options: {value: T; label: string}[]; value?: T | ''; onPick: (v: T) => void; label: string}) {
  const {colors} = useTheme();
  return (
    <View style={styles.chips} accessibilityLabel={label}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onPick(o.value)}
            accessibilityRole="button"
            accessibilityState={{selected: on}}
            accessibilityLabel={o.label}
            style={({pressed}) => [styles.chip, {backgroundColor: on ? colors.primarySoft : pressed ? colors.panel2 : colors.panel, borderColor: on ? colors.primary : colors.lineStrong}]}>
            {on ? <Icon name="check" size={16} weight="bold" color={colors.primaryText} /> : null}
            <Txt variant="bodyStrong" color={on ? 'primary' : 'text'}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export interface MeterPart {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * One whole (base pay, Equity Value) as a thin segmented bar, with every figure in the legend below
 * (no number is printed inside a segment that might not fit).
 */
export function Meter({total, parts, restLabel}: {total: number; parts: MeterPart[]; restLabel?: string}) {
  const {colors} = useTheme();
  const used = parts.reduce((s, p) => s + p.value, 0);
  const rest = Math.max(0, total - used);
  const share = (v: number) => `${Math.max(0.6, Math.min(100, (v / Math.max(1, total)) * 100))}%` as const;
  return (
    <View style={styles.meter}>
      <View style={[styles.meterBar, {backgroundColor: colors.panel2}]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {parts
          .filter(p => p.value > 0)
          .map(p => (
            <View key={p.key} style={[styles.meterSeg, {width: share(p.value), backgroundColor: p.color}]} />
          ))}
      </View>
      {parts.map(p => (
        <View key={p.key} style={styles.legendRow}>
          <View style={[styles.swatch, {backgroundColor: p.color}]} />
          <Txt variant="small" color="soft" style={styles.flex}>
            {p.label}
          </Txt>
          <Txt variant="smallStrong">{money(p.value)}</Txt>
        </View>
      ))}
      {restLabel ? (
        <View style={styles.legendRow}>
          <View style={[styles.swatch, {backgroundColor: colors.panel2, borderColor: colors.lineStrong}, styles.swatchRing]} />
          <Txt variant="small" color="soft" style={styles.flex}>
            {restLabel}
          </Txt>
          <Txt variant="smallStrong">{money(rest)}</Txt>
        </View>
      ) : null}
    </View>
  );
}

/** "Showing 12 of 173" and a big button for the next batch (no endless scrolling). */
export function ShowMore({shown, total, step, onMore, noun}: {shown: number; total: number; step: number; onMore: () => void; noun: [string, string]}) {
  const t = useT();
  if (shown >= total) {
    return null;
  }
  const n = Math.min(step, total - shown);
  return (
    <View style={styles.more}>
      <Txt variant="small" color="soft">
        {t(`Showing ${shown} of ${total}`, `Ipinapakita ang ${shown} sa ${total}`)}
      </Txt>
      <Button title={t(`Show ${n} more ${noun[0]}`, `Ipakita ang ${n} pang ${noun[1]}`)} icon="plus" variant="quiet" onPress={onMore} />
    </View>
  );
}

/** The six product ribbons mounted like a uniform's ribbon rack (decorative). */
export function RibbonRack() {
  return (
    <View style={styles.rack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {LOAN_PRODUCTS.map(p => (
        <Ribbon key={p.id} stripes={p.ribbon} width={26} height={9} />
      ))}
    </View>
  );
}

/** A short coloured note with an icon (never colour alone). */
export function Note({tone, children}: {tone: 'warn' | 'bad' | 'info' | 'ok'; children: string}) {
  const {colors} = useTheme();
  const c = colors.tones[tone];
  return (
    <View style={[styles.note, {backgroundColor: c.bg}]}>
      <Icon name={tone === 'ok' ? 'checkCircle' : tone === 'info' ? 'info' : 'warning'} size={22} weight="fill" color={c.text} />
      <Txt variant="body" style={styles.flex}>
        {children}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  success: {gap: 18, paddingTop: 4},
  successHead: {gap: 8},
  mark: {width: 92, height: 92, alignItems: 'center', justifyContent: 'center'},
  markBlades: {position: 'absolute', top: 0, left: 0},
  markDisc: {width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: '#071b37', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: {width: 0, height: 3}, elevation: 3},
  ref: {gap: 4},
  nextHead: {marginTop: 6},
  nextList: {gap: 16},
  nextRow: {flexDirection: 'row', gap: 14, alignItems: 'flex-start'},
  nextNo: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  actions: {gap: 10, marginTop: 8},
  acct: {flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1},
  acctIcon: {width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center'},
  figure: {gap: 2, flexGrow: 1, flexBasis: 130},
  review: {flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, minHeight: 64},
  change: {flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 52, paddingHorizontal: 12, borderRadius: 12, marginRight: -6},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  chip: {flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 52, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2},
  meter: {gap: 10},
  meterBar: {flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', gap: 2, marginBottom: 4},
  meterSeg: {height: '100%'},
  legendRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  swatch: {width: 14, height: 14, borderRadius: 4},
  swatchRing: {borderWidth: 1},
  more: {gap: 8, marginTop: 12, alignItems: 'stretch'},
  rack: {flexDirection: 'row', flexWrap: 'wrap', width: 84, gap: 3},
  note: {flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, padding: 14},
});
