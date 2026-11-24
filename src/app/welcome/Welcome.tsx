import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, Image, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from 'styled-components/native';
import {Lockup, RibbonLabel} from '../../components/brand/Brand';
import {Button, Card, LangToggle, TextSizeControl, Txt} from '../../components/ui';
import {useT} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {HelpLink} from '../shared/Help';

const MEDAL = require('../../assets/brand/medal.png');

/**
 * The first screen. Language and text size come first, because many members are older; then two
 * plain choices: sign in, or enrol as a new member. The service medal swings in once from its
 * ribbon and settles (still under reduced motion).
 */
export default function Welcome() {
  const t = useT();
  const {colors, scale} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const swing = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!alive) {return;}
      if (reduced) {
        swing.setValue(0);
        fade.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.spring(swing, {toValue: 0, useNativeDriver: true, stiffness: 60, damping: 6, mass: 1}),
        Animated.timing(fade, {toValue: 1, duration: 500, delay: 120, useNativeDriver: true}),
      ]).start();
    });
    return () => {
      alive = false;
    };
  }, [swing, fade]);

  const rotate = swing.interpolate({inputRange: [-1, 1], outputRange: ['-9deg', '9deg']});
  const drop = swing.interpolate({inputRange: [0, 1], outputRange: [0, -24], extrapolate: 'clamp'});
  const medalH = Math.min(260, 230 / Math.max(1, scale * 0.95));

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.root, {backgroundColor: colors.ground}]}>
      <StatusBar barStyle={colors.scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.ground} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <Lockup wordmark={scale <= 1} />
          <LangToggle />
        </View>

        <Animated.View style={[styles.medalWrap, {opacity: fade, transform: [{translateY: drop}, {rotate}]}, styles.pivot]}>
          <Image source={MEDAL} style={{height: medalH, width: medalH / 1.607}} resizeMode="contain" accessibilityIgnoresInvertColors accessible accessibilityLabel={t('A service medal on a ribbon in PSMBFI colours', 'Medalya sa ribbon na kulay PSMBFI')} />
        </Animated.View>

        <Animated.View style={[styles.copy, {opacity: fade}]}>
          <RibbonLabel>{t('PSMBFI Member App', 'PSMBFI Member App')}</RibbonLabel>
          <Txt variant="hero" accessibilityRole="header">
            {t('Your MEP, loans and claims ', 'Ang iyong MEP, loans at claims ')}
            <Txt variant="hero" color="primary">
              {t('in one app', 'sa iisang app')}
            </Txt>
          </Txt>
          <Txt variant="body" color="soft">
            {t(
              'See your Equity Value, apply for a loan, file a claim with photos and get your money sent to your bank or e-wallet.',
              'Tingnan ang iyong Equity Value, mag-apply ng loan, mag-file ng claim gamit ang litrato, at matanggap ang pera sa iyong bangko o e-wallet.',
            )}
          </Txt>
        </Animated.View>

        <View style={styles.actions}>
          <Button title={t('Sign in', 'Mag-sign in')} icon="key" onPress={() => nav.navigate('SignIn')} testID="welcome-sign-in" />
          <Button title={t("I'm new: enrol as a member", 'Bago ako: mag-enrol bilang miyembro')} icon="id" iconRight={scale > 1 ? undefined : 'forward'} variant="quiet" onPress={() => nav.navigate('Enrol')} />
        </View>

        <Card style={styles.sizeCard}>
          <Txt variant="bodyStrong">{t('Make the words bigger', 'Palakihin ang mga letra')}</Txt>
          <TextSizeControl />
        </Card>

        <View style={styles.foot}>
          <HelpLink topic="Signing in or my PIN" />
          <Txt variant="small" color="muted">
            {t('Prototype with sample data. No real member records are used.', 'Prototype na may sample data. Walang totoong record ng miyembro.')}
          </Txt>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {paddingHorizontal: 20, paddingBottom: 28},
  top: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 60},
  medalWrap: {alignItems: 'center', marginTop: 4},
  pivot: {transformOrigin: 'top center'},
  copy: {gap: 12, marginTop: 18},
  actions: {gap: 12, marginTop: 26},
  sizeCard: {gap: 14, marginTop: 24},
  foot: {gap: 6, marginTop: 16, alignItems: 'flex-start'},
});
