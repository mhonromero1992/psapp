import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {useT} from '../../lib/i18n';
import {useUi} from '../../store/ui';
import {BladeMark} from '../brand/Brand';
import {Button} from './Button';
import {Icon} from './Icon';
import {Txt} from './Txt';

/** Empty: what is missing, and the next step. */
export function EmptyState({title, body, action}: {title: string; body?: string; action?: React.ReactNode}) {
  const {colors} = useTheme();
  return (
    <View style={styles.center}>
      <View style={[styles.disc, {backgroundColor: colors.panel2}]}>
        <BladeMark size={36} opacity={0.75} />
      </View>
      <Txt variant="heading" style={styles.text}>
        {title}
      </Txt>
      {body ? (
        <Txt variant="body" color="soft" style={styles.text}>
          {body}
        </Txt>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

/** Error: plain cause, a retry, and a person to call. */
export function ErrorState({onRetry, helpTopic}: {onRetry: () => void; helpTopic?: string}) {
  const t = useT();
  const {colors} = useTheme();
  const openHelp = useUi(s => s.openHelp);
  return (
    <View style={styles.center} accessibilityRole="alert">
      <View style={[styles.disc, {backgroundColor: colors.tones.bad.bg}]}>
        <Icon name="warning" size={34} color={colors.tones.bad.text} weight="duotone" />
      </View>
      <Txt variant="heading" style={styles.text}>
        {t("We couldn't load this", 'Hindi namin ito ma-load')}
      </Txt>
      <Txt variant="body" color="soft" style={styles.text}>
        {t('The signal dropped while loading. Your records are safe.', 'Nawala ang signal habang naglo-load. Ligtas ang iyong mga record.')}
      </Txt>
      <View style={styles.action}>
        <Button title={t('Try again', 'Subukan muli')} icon="refresh" variant="quiet" onPress={onRetry} />
        <Button title={t('Ask us to call you', 'Tatawagan ka namin')} icon="phone" variant="ghost" onPress={() => openHelp(helpTopic)} />
      </View>
    </View>
  );
}

/** Loading: soft placeholder blocks in the shape of what is coming. */
export function Skeleton({height = 18, width = '100%', radius = 8}: {height?: number; width?: number | `${number}%`; radius?: number}) {
  const {colors} = useTheme();
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, {toValue: 1, duration: 700, useNativeDriver: true}), Animated.timing(pulse, {toValue: 0.5, duration: 700, useNativeDriver: true})]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return <Animated.View style={{height, width, borderRadius: radius, backgroundColor: colors.panel2, opacity: pulse}} />;
}

export function LoadingBlock({rows = 3}: {rows?: number}) {
  const t = useT();
  return (
    <View style={styles.loading} accessible accessibilityLabel={t('Loading', 'Naglo-load')} accessibilityRole="progressbar">
      <Skeleton height={150} radius={20} />
      {Array.from({length: rows}).map((_, i) => (
        <View key={i} style={styles.loadRow}>
          <Skeleton height={46} width={46} radius={14} />
          <View style={styles.flex}>
            <Skeleton height={16} width="60%" />
            <View style={styles.gap} />
            <Skeleton height={14} width="85%" />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {alignItems: 'center', paddingVertical: 36, paddingHorizontal: 8, gap: 8},
  disc: {width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 6},
  text: {textAlign: 'center'},
  action: {marginTop: 12, alignSelf: 'stretch', gap: 8},
  loading: {gap: 18},
  loadRow: {flexDirection: 'row', alignItems: 'center', gap: 14},
  flex: {flex: 1},
  gap: {height: 8},
});
