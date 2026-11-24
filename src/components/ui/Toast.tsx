import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from 'styled-components/native';
import {useUi, type ToastItem} from '../../store/ui';
import {Icon} from './Icon';
import {Txt} from './Txt';

/** Short confirmations at the top, readable for five seconds, announced to screen readers. */
export function ToastHost() {
  const toasts = useUi(s => s.toasts);
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.host, {top: insets.top + 8}]}>
      {toasts.map(t => (
        <ToastCard key={t.id} item={t} />
      ))}
    </View>
  );
}

function ToastCard({item}: {item: ToastItem}) {
  const {colors} = useTheme();
  const dismiss = useUi(s => s.dismiss);
  const y = useRef(new Animated.Value(-20)).current;
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([Animated.spring(y, {toValue: 0, useNativeDriver: true, bounciness: 0, speed: 16}), Animated.timing(o, {toValue: 1, duration: 200, useNativeDriver: true})]).start();
  }, [y, o]);
  const tone = colors.tones[item.tone];
  return (
    <Animated.View style={[styles.card, {backgroundColor: colors.panel, transform: [{translateY: y}], opacity: o}]}>
      <Pressable onPress={() => dismiss(item.id)} accessibilityRole="button" accessibilityLabel={item.body ? `${item.title}. ${item.body}. Dismiss` : `${item.title}. Dismiss`} style={styles.row}>
        <View style={[styles.icon, {backgroundColor: tone.bg}]}>
          <Icon name={item.tone === 'ok' ? 'checkCircle' : item.tone === 'bad' ? 'warning' : 'info'} size={22} color={tone.text} weight="fill" />
        </View>
        <View style={styles.flex}>
          <Txt variant="bodyStrong">{item.title}</Txt>
          {item.body ? (
            <Txt variant="small" color="soft">
              {item.body}
            </Txt>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {position: 'absolute', left: 12, right: 12, gap: 8, zIndex: 100},
  card: {borderRadius: 18, shadowColor: '#071b37', shadowOpacity: 0.22, shadowRadius: 22, shadowOffset: {width: 0, height: 10}, elevation: 8},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14},
  icon: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  flex: {flex: 1},
});
