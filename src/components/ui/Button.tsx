import React, {useRef} from 'react';
import {ActivityIndicator, Animated, Pressable, StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import {useTheme} from 'styled-components/native';
import {TOUCH} from '../../config/theme';
import {Icon, type IconName} from './Icon';
import {Txt} from './Txt';

export type ButtonVariant = 'primary' | 'positive' | 'negative' | 'secondary' | 'quiet' | 'ghost' | 'light';

export interface ButtonProps {
  /** Names the action: "Apply for a loan", "File a claim". */
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  busy?: boolean;
  disabled?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  size?: 'md' | 'lg';
  /** Stretch to the parent's width (the default on phones). */
  block?: boolean;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The one button. Press: a short scale-down and a deeper fill; busy: a spinner beside the label;
 * disabled: muted, never invisible. At least 52dp tall, labels wrap rather than clip.
 */
export function Button({title, onPress, variant = 'primary', busy, disabled, icon, iconRight, size = 'lg', block = true, accessibilityHint, testID, style}: ButtonProps) {
  const {colors, scale} = useTheme();
  const off = Boolean(disabled || busy);
  const press = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(press, {toValue: v, useNativeDriver: true, speed: 40, bounciness: 0}).start();

  const fill: Record<ButtonVariant, [string, string]> = {
    primary: [colors.primary, colors.primaryPressed],
    positive: [colors.positive, colors.positivePressed],
    negative: ['#c4141b', '#a51117'],
    secondary: [colors.primarySoft, colors.primarySoft],
    quiet: [colors.panel, colors.panel2],
    ghost: ['transparent', colors.panel2],
    light: ['#ffffff', '#e3ecf8'],
  };
  const fg =
    variant === 'primary' || variant === 'positive' || variant === 'negative'
      ? colors.onPrimary
      : variant === 'secondary' || variant === 'ghost'
      ? colors.primaryText
      : variant === 'light'
      ? '#071b37'
      : colors.text;

  return (
    <Animated.View style={[{transform: [{scale: press}]}, block ? styles.block : styles.inline, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{disabled: off, busy: Boolean(busy)}}
        disabled={off}
        onPress={onPress}
        onPressIn={() => to(0.97)}
        onPressOut={() => to(1)}
        style={({pressed}) => [
          styles.base,
          {minHeight: Math.round((size === 'lg' ? TOUCH + 4 : TOUCH - 4) * Math.min(scale, 1.15)), backgroundColor: off && variant !== 'ghost' ? colors.panel2 : fill[variant][pressed ? 1 : 0]},
          variant === 'quiet' && {borderWidth: 1.5, borderColor: colors.line},
          variant === 'primary' && !off && styles.lift,
          variant === 'ghost' && styles.ghost,
        ]}>
        <View style={styles.inner}>
          {busy ? <ActivityIndicator color={off && variant !== 'ghost' ? colors.textMuted : fg} /> : icon ? <Icon name={icon} size={21} color={off ? colors.textMuted : fg} weight="bold" /> : null}
          <Txt variant="button" style={[styles.label, {color: off ? colors.textMuted : fg}]}>
            {title}
          </Txt>
          {iconRight && !busy ? <Icon name={iconRight} size={19} color={off ? colors.textMuted : fg} weight="bold" /> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: {alignSelf: 'stretch'},
  inline: {alignSelf: 'flex-start'},
  base: {borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, justifyContent: 'center'},
  lift: {shadowColor: '#1054a4', shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: {width: 0, height: 6}, elevation: 3},
  ghost: {paddingHorizontal: 12},
  inner: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap'},
  label: {textAlign: 'center'},
});
