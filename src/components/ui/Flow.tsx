import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {useT} from '../../lib/i18n';
import {Icon} from './Icon';
import {Txt} from './Txt';

/** "Step 2 of 5 · Amount" in words, with a segment bar (never colour alone: the words carry it). */
export function StepHeader({step, total, title}: {step: number; total: number; title: string}) {
  const t = useT();
  const {colors} = useTheme();
  return (
    <View style={styles.stepHead} accessible accessibilityLabel={t(`Step ${step + 1} of ${total}: ${title}`, `Hakbang ${step + 1} sa ${total}: ${title}`)}>
      <Txt variant="smallStrong" color="soft">
        {t(`Step ${step + 1} of ${total}`, `Hakbang ${step + 1} sa ${total}`)} · {title}
      </Txt>
      <View style={styles.segs}>
        {Array.from({length: total}).map((_, i) => (
          <View key={i} style={[styles.seg, {backgroundColor: i < step ? colors.positive : i === step ? colors.primary : colors.panel2}]} />
        ))}
      </View>
    </View>
  );
}

export interface HistoryEvent {
  at: string;
  label: string;
  note?: string;
  by?: string;
}

/** Vertical history: done steps filled with a check, upcoming steps hollow. */
export function History({events, upcoming = [], format}: {events: HistoryEvent[]; upcoming?: string[]; format: (iso: string) => string}) {
  const {colors} = useTheme();
  const last = events.length - 1;
  return (
    <View>
      {events.map((e, i) => (
        <View key={`${e.label}-${i}`} style={styles.item}>
          <View style={styles.rail}>
            <View style={[styles.node, {backgroundColor: colors.positive}]}>
              <Icon name="check" size={13} color="#fff" weight="bold" />
            </View>
            {(i < last || upcoming.length > 0) && <View style={[styles.line, {backgroundColor: colors.positive, opacity: 0.4}]} />}
          </View>
          <View style={styles.flex}>
            <Txt variant={i === last ? 'bodyStrong' : 'body'}>{e.label}</Txt>
            <Txt variant="small" color="soft">
              {format(e.at)}
              {e.by ? ` · ${e.by}` : ''}
            </Txt>
            {e.note ? (
              <View style={[styles.note, {backgroundColor: colors.panel2}]}>
                <Txt variant="small">{e.note}</Txt>
              </View>
            ) : null}
          </View>
        </View>
      ))}
      {upcoming.map((u, i) => (
        <View key={u} style={styles.item}>
          <View style={styles.rail}>
            <View style={[styles.node, {borderWidth: 2, borderColor: colors.lineStrong}]} />
            {i < upcoming.length - 1 && <View style={[styles.line, {backgroundColor: colors.line}]} />}
          </View>
          <Txt variant="body" color="soft" style={styles.flex}>
            {u}
          </Txt>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, paddingBottom: 18},
  stepHead: {gap: 10, marginBottom: 18},
  segs: {flexDirection: 'row', gap: 6},
  seg: {flex: 1, height: 6, borderRadius: 3},
  item: {flexDirection: 'row', gap: 14},
  rail: {width: 22, alignItems: 'center'},
  node: {width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 2},
  line: {flex: 1, width: 2, borderRadius: 1, marginTop: 4},
  note: {borderRadius: 12, padding: 12, marginTop: 8},
});
