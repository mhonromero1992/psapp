import React from 'react';
import {Pressable, StyleSheet, TextInput, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {FieldFrame, Icon, Txt, type IconName} from '../../components/ui';
import type {Tone} from '../../config/theme';
import type {Beneficiary, Claim, ClaimDocument, ClaimStatus, ClaimType} from '../../data/types';
import {useT} from '../../lib/i18n';
import {BENEFIT_ICON, CLAIM_STAGES, claimStage} from '../shared/claims';

/* Small pieces shared by the three claim screens (Claims, ClaimNew, ClaimDetail). */

export const DOC_STATUS: Record<ClaimDocument['status'], {en: string; fil: string; tone: Tone}> = {
  received: {en: 'Received', fil: 'Natanggap', tone: 'info'},
  verified: {en: 'Checked', fil: 'Na-check na', tone: 'ok'},
  reupload: {en: 'New copy needed', fil: 'Kailangan ng bagong kopya', tone: 'warn'},
};

export const RELATION: Record<Claim['claimantRelation'], [string, string]> = {
  Member: ['Member', 'Miyembro'],
  Spouse: ['Spouse', 'Asawa'],
  Child: ['Child', 'Anak'],
  Parent: ['Parent', 'Magulang'],
  Sibling: ['Sibling', 'Kapatid'],
};
export type Relation = Beneficiary['relation'];

/** A paper the claims team flagged: the member has to send a new copy. */
export const needsNewCopy = (c: Claim) => c.documents.some(d => d.status === 'reupload');

/** Once every flagged paper is replaced, the claim is back with the documents team. */
export function shownStatus(c: Claim): ClaimStatus {
  return c.status === 'returned' && !needsNewCopy(c) ? 'docs_review' : c.status;
}

/** "YYYY-MM-DD" of a moment, in the phone's own time zone. */
export function localDay(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The benefit's icon on a soft disc. */
export function BenefitDisc({type, size = 48, muted}: {type: ClaimType; size?: number; muted?: boolean}) {
  const {colors, scale} = useTheme();
  const s = Math.round(size * Math.min(scale, 1.2));
  return (
    <View style={[styles.disc, {width: s, height: s, borderRadius: s / 2, backgroundColor: muted ? colors.panel2 : colors.primarySoft}]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Icon name={BENEFIT_ICON[type]} size={Math.round(size * 0.5)} weight="duotone" color={muted ? colors.textSoft : colors.primaryText} />
    </View>
  );
}

/**
 * The five-step track (Filed, Documents, Evaluation, Approved, Paid) as segments, with the step
 * written out in words so colour never carries the meaning alone.
 */
export function StageBar({status}: {status: ClaimStatus}) {
  const t = useT();
  const {colors} = useTheme();
  const {current, mode} = claimStage(status);
  const total = CLAIM_STAGES.length;
  const done = current >= total;
  const stage = CLAIM_STAGES[Math.min(current, total - 1)];
  const next = !done && mode === 'active' ? CLAIM_STAGES[current + 1] : undefined;
  const words = done
    ? t(`All ${total} steps done: Paid`, `Tapos na ang ${total} hakbang: Bayad na`)
    : mode === 'blocked'
    ? t(`Step ${current + 1} of ${total}: New copy of a document needed`, `Hakbang ${current + 1} sa ${total}: Kailangan ng bagong kopya ng dokumento`)
    : mode === 'denied'
    ? t(`Stopped at step ${current + 1} of ${total}: Not approved`, `Huminto sa hakbang ${current + 1} sa ${total}: Hindi naaprubahan`)
    : t(`Step ${current + 1} of ${total}: ${stage.nextEn}`, `Hakbang ${current + 1} sa ${total}: ${stage.nextFil}`);
  const nextWords = next ? t(`Next: ${next.nextEn}`, `Susunod: ${next.nextFil}`) : null;
  const now = mode === 'blocked' ? colors.tones.warn.text : mode === 'denied' ? colors.tones.bad.text : colors.primary;
  return (
    <View style={styles.stage} accessible accessibilityLabel={nextWords ? `${words}. ${nextWords}` : words}>
      <View style={styles.segs}>
        {CLAIM_STAGES.map((s, i) => (
          <View key={s.key} style={[styles.seg, i < current ? {backgroundColor: colors.positive} : i === current ? {backgroundColor: now} : [styles.segTodo, {backgroundColor: colors.panel2, borderColor: colors.lineStrong}]]} />
        ))}
      </View>
      <Txt variant="bodyStrong">{words}</Txt>
      {nextWords ? (
        <Txt variant="small" color="soft">
          {nextWords}
        </Txt>
      ) : null}
    </View>
  );
}

/** A tinted note with an icon: a warning to act on, or a reassurance. */
export function Notice({tone, icon, text, strong = true}: {tone: Tone; icon: IconName; text: string; strong?: boolean}) {
  const {colors} = useTheme();
  return (
    <View style={[styles.notice, {backgroundColor: colors.tones[tone].bg}]}>
      <Icon name={icon} size={22} weight="fill" color={colors.tones[tone].text} />
      <Txt variant={strong ? 'bodyStrong' : 'body'} style={styles.flex}>
        {text}
      </Txt>
    </View>
  );
}

/** An error line under a group of choices (radio cards, photos), the same as a field's error. */
export function GroupError({text}: {text?: string | null}) {
  const {colors} = useTheme();
  if (!text) {
    return null;
  }
  return (
    <View style={styles.err} accessibilityRole="alert">
      <Icon name="warning" size={18} color={colors.tones.bad.text} weight="fill" />
      <Txt variant="smallStrong" color="bad" style={styles.flex}>
        {text}
      </Txt>
    </View>
  );
}

/**
 * Days in the hospital: big Fewer and More buttons around the number, which can also be typed.
 */
export function DayStepper({label, hint, error, value, onChange, max = 60}: {label: string; hint?: string; error?: string | null; value: number; onChange: (v: number) => void; max?: number}) {
  const t = useT();
  const {colors, type} = useTheme();
  const set = (v: number) => onChange(Math.max(0, Math.min(max, v)));
  const step = (delta: number, glyph: string, word: string, disabled: boolean) => (
    <Pressable
      onPress={() => set(value + delta)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={word}
      accessibilityState={{disabled}}
      style={({pressed}) => [styles.stepBtn, {backgroundColor: pressed ? colors.panel2 : colors.primarySoft}, disabled && styles.off]}>
      <Txt variant="amountLarge" color="primary">
        {glyph}
      </Txt>
      <Txt variant="smallStrong" color="primary">
        {word}
      </Txt>
    </Pressable>
  );
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      <View style={styles.stepper}>
        {step(-1, '−', t('Fewer', 'Bawasan'), value <= 0)}
        <View style={styles.stepMid}>
          <TextInput
            value={String(value)}
            onChangeText={v => {
              const d = v.replace(/\D/g, '').slice(0, 2);
              set(d ? Number(d) : 0);
            }}
            keyboardType="number-pad"
            selectTextOnFocus
            maxLength={2}
            maxFontSizeMultiplier={1.4}
            accessibilityLabel={label}
            accessibilityHint={t('Type the number of days, or use the Fewer and More buttons', 'I-type ang bilang ng araw, o gamitin ang Bawasan at Dagdagan')}
            style={[styles.stepInput, type.amountLarge, {color: colors.text, backgroundColor: colors.panel, borderColor: error ? colors.tones.bad.text : colors.lineStrong}]}
          />
          <Txt variant="small" color="soft">
            {value === 1 ? t('day', 'araw') : t('days', 'araw')}
          </Txt>
        </View>
        {step(1, '+', t('More', 'Dagdagan'), value >= max)}
      </View>
    </FieldFrame>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  disc: {alignItems: 'center', justifyContent: 'center'},
  stage: {gap: 6},
  segs: {flexDirection: 'row', gap: 5, marginBottom: 4},
  seg: {flex: 1, height: 10, borderRadius: 5},
  segTodo: {borderWidth: 1},
  notice: {flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12},
  err: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4},
  stepper: {flexDirection: 'row', alignItems: 'center', gap: 10},
  stepBtn: {minWidth: 92, minHeight: 72, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 6},
  off: {opacity: 0.45},
  stepMid: {flex: 1, alignItems: 'center', gap: 4},
  stepInput: {alignSelf: 'stretch', minHeight: 60, borderWidth: 1.5, borderRadius: 14, textAlign: 'center', paddingVertical: 8},
});
