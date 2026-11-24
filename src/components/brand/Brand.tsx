import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useTheme} from 'styled-components/native';
import {Txt} from '../ui/Txt';

const EMBLEM = require('../../assets/brand/emblem.png');

/** The real PSMBFI emblem (supplied in the proposal deck). Never redrawn. */
export function Emblem({size = 32}: {size?: number}) {
  return <Image source={EMBLEM} style={{width: size, height: size}} resizeMode="contain" accessibilityIgnoresInvertColors accessible accessibilityLabel="PSMBFI" />;
}

/** Product lockup: PSMBFI emblem + PS-ACCESS set in Archivo (no invented logo). */
export function Lockup({tone = 'ink', wordmark = true, size = 30}: {tone?: 'ink' | 'light'; wordmark?: boolean; size?: number}) {
  return (
    <View style={styles.lockup} accessible accessibilityLabel="PS-ACCESS by PSMBFI">
      <Emblem size={size} />
      {wordmark && (
        <Txt variant="title" color={tone === 'light' ? 'onBand' : 'text'} style={styles.word}>
          PS-ACCESS
        </Txt>
      )}
    </View>
  );
}

/**
 * Service-ribbon bar, the identity motif: each loan product and app area wears its own stripe
 * pattern, the way ribbon racks encode honours. Always a marker beside a label, never an edge stripe.
 */
export const RIBBONS = {
  brand: ['#009444', '#1054a4', '#ec1c24'],
  member: ['#009444', '#1054a4', '#009444'],
  loans: ['#1054a4', '#c9a227', '#1054a4'],
  claims: ['#ec1c24', '#f4f6fa', '#1054a4'],
  equity: ['#009444', '#f4f6fa', '#009444'],
  payouts: ['#009444', '#c9a227', '#009444'],
  assist: ['#0a2a52', '#ec1c24', '#0a2a52'],
} as const;

const RIM_LIGHT = 'rgba(10, 22, 40, 0.3)';
const RIM_DARK = 'rgba(234, 240, 248, 0.55)';

export function Ribbon({stripes = RIBBONS.brand, width = 30, height = 10}: {stripes?: readonly string[]; width?: number; height?: number}) {
  const {colors} = useTheme();
  // A rim that shows in both schemes: navy stripes vanish on the dark panel without it.
  return (
    <View style={[styles.ribbon, {width, height, borderColor: colors.scheme === 'dark' ? RIM_DARK : RIM_LIGHT}]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {stripes.map((c, i) => (
        <View key={`${c}-${i}`} style={[styles.stripe, {backgroundColor: c}]} />
      ))}
    </View>
  );
}

export function RibbonLabel({stripes, children, tone = 'ink'}: {stripes?: readonly string[]; children: string; tone?: 'ink' | 'light'}) {
  return (
    <View style={styles.ribbonLabel}>
      <Ribbon stripes={stripes} />
      <Txt variant="smallStrong" color={tone === 'light' ? 'onBandMuted' : 'soft'}>
        {children}
      </Txt>
    </View>
  );
}

/**
 * The three-blade mark: an original crescent form drawn from the emblem's blades (green, blue, red).
 * Loading spinner, empty states, success screens. Not the PSMBFI logo.
 */
export const BLADE_PATH = 'M48 6 C 74 12, 92 34, 88 60 C 86 72, 78 80, 70 82 C 76 70, 75 54, 67 42 C 61 32, 55 20, 48 6 Z';
export function BladeMark({size = 40, rim = false, opacity = 1}: {size?: number; rim?: boolean; opacity?: number}) {
  const {colors} = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity}>
      {['#009444', '#1054a4', '#ec1c24'].map((c, i) => (
        <Path key={c} d={BLADE_PATH} fill={c} stroke={rim ? colors.band : 'none'} strokeWidth={rim ? 3 : 0} strokeLinejoin="round" transform={`rotate(${i * 120} 50 52)`} />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  lockup: {flexDirection: 'row', alignItems: 'center', gap: 9},
  word: {letterSpacing: -0.2},
  ribbon: {flexDirection: 'row', borderRadius: 2, overflow: 'hidden', borderWidth: 1},
  stripe: {flex: 1},
  ribbonLabel: {flexDirection: 'row', alignItems: 'center', gap: 10},
});
