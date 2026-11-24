import React, {useRef, useState} from 'react';
import {Image, PanResponder, Pressable, StyleSheet, TextInput, View} from 'react-native';
import {launchCamera, launchImageLibrary, type Asset} from 'react-native-image-picker';
import Svg, {Line, Path} from 'react-native-svg';
import {useTheme} from 'styled-components/native';
import {useT} from '../../lib/i18n';
import {Button} from './Button';
import {Icon} from './Icon';
import {Txt} from './Txt';

/** Six boxes over one hidden field: paste, autofill (one-time-code) and backspace all work. */
export function OtpInput({value, onChange, error}: {value: string; onChange: (v: string) => void; error?: boolean}) {
  const t = useT();
  const {colors, type} = useTheme();
  const ref = useRef<TextInput>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityRole="none" style={styles.otpRow}>
      {Array.from({length: 6}).map((_, i) => (
        <View key={i} style={[styles.otpBox, {backgroundColor: colors.panel, borderColor: error ? colors.tones.bad.text : i === value.length ? colors.primary : colors.lineStrong}]}>
          <Txt variant="amountLarge">{value[i] ?? ''}</Txt>
        </View>
      ))}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={v => onChange(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        autoFocus
        accessibilityLabel={t('6-number code', '6-numerong code')}
        style={[styles.hidden, type.body]}
      />
    </Pressable>
  );
}

/** Finger signature on screen. Reports whether something was drawn. */
export function SignaturePad({onChange, label}: {onChange: (signed: boolean) => void; label: string}) {
  const t = useT();
  const {colors} = useTheme();
  const [paths, setPaths] = useState<string[]>([]);
  const current = useRef('');
  const [, force] = useState(0);
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => {
        current.current = `M${e.nativeEvent.locationX.toFixed(1)},${e.nativeEvent.locationY.toFixed(1)}`;
        force(n => n + 1);
      },
      onPanResponderMove: e => {
        current.current += ` L${e.nativeEvent.locationX.toFixed(1)},${e.nativeEvent.locationY.toFixed(1)}`;
        force(n => n + 1);
      },
      onPanResponderRelease: () => {
        const p = current.current;
        current.current = '';
        setPaths(ps => {
          const next = [...ps, p];
          onChange(true);
          return next;
        });
      },
    }),
  ).current;
  return (
    <View style={styles.sigWrap}>
      <View {...pan.panHandlers} style={[styles.sig, {backgroundColor: colors.panel, borderColor: colors.lineStrong}]} accessible accessibilityLabel={label} accessibilityHint={t('Draw your signature with your finger', 'Iguhit ang pirma gamit ang daliri')}>
        <Svg width="100%" height="100%">
          <Line x1="8%" x2="92%" y1="78%" y2="78%" stroke={colors.line} strokeWidth={2} />
          {[...paths, current.current].filter(Boolean).map((d, i) => (
            <Path key={i} d={d} stroke={colors.text} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </Svg>
        {paths.length === 0 && !current.current ? (
          <Txt variant="small" color="muted" style={styles.sigHint}>
            {label}
          </Txt>
        ) : null}
      </View>
      <Button
        title={t('Clear signature', 'Burahin ang pirma')}
        icon="refresh"
        variant="ghost"
        block={false}
        size="md"
        onPress={() => {
          setPaths([]);
          onChange(false);
        }}
      />
    </View>
  );
}

export interface Photo {
  uri: string;
  name: string;
}

/** Take a photo or choose one: big buttons, thumbnails with Remove. */
export function PhotoPicker({label, hint, photos, onChange, max = 4, selfie}: {label: string; hint?: string; photos: Photo[]; onChange: (p: Photo[]) => void; max?: number; selfie?: boolean}) {
  const t = useT();
  const {colors} = useTheme();
  const add = (assets?: Asset[]) => {
    const got = (assets ?? []).filter(a => a.uri).map(a => ({uri: a.uri as string, name: a.fileName ?? 'photo.jpg'}));
    if (got.length) onChange([...photos, ...got].slice(0, max));
  };
  const opts = {mediaType: 'photo' as const, quality: 0.7 as const, maxWidth: 1600, maxHeight: 1600, cameraType: selfie ? ('front' as const) : ('back' as const)};
  return (
    <View style={[styles.picker, {backgroundColor: colors.panel2}]}>
      <View style={styles.pickerHead}>
        <Icon name="camera" size={26} weight="duotone" color={colors.primaryText} />
        <View style={styles.flex}>
          <Txt variant="bodyStrong">{label}</Txt>
          {hint ? (
            <Txt variant="small" color="soft">
              {hint}
            </Txt>
          ) : null}
        </View>
      </View>
      {photos.length > 0 && (
        <View style={styles.thumbs}>
          {photos.map((p, i) => (
            <View key={`${p.uri}-${i}`} style={[styles.thumb, {backgroundColor: colors.panel}]}>
              <Image source={{uri: p.uri}} style={styles.thumbImg} accessibilityLabel={t(`Photo ${i + 1}`, `Litrato ${i + 1}`)} />
              <Pressable onPress={() => onChange(photos.filter((_, j) => j !== i))} accessibilityRole="button" accessibilityLabel={t(`Remove photo ${i + 1}`, `Alisin ang litrato ${i + 1}`)} style={styles.remove}>
                <Icon name="trash" size={18} color={colors.tones.bad.text} weight="bold" />
                <Txt variant="smallStrong" color="bad">
                  {t('Remove', 'Alisin')}
                </Txt>
              </Pressable>
            </View>
          ))}
        </View>
      )}
      {photos.length < max && (
        <View style={styles.pickBtns}>
          <Button title={t('Take a photo', 'Kumuha ng litrato')} icon="camera" variant="secondary" size="md" onPress={() => launchCamera(opts, r => add(r.assets))} />
          <Button title={t('Choose from gallery', 'Pumili sa gallery')} icon="image" variant="quiet" size="md" onPress={() => launchImageLibrary({...opts, selectionLimit: max - photos.length}, r => add(r.assets))} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  otpRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 8},
  otpBox: {flex: 1, maxWidth: 56, aspectRatio: 0.82, borderWidth: 2, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  hidden: {position: 'absolute', opacity: 0, width: 1, height: 1},
  sigWrap: {gap: 6, alignItems: 'flex-end'},
  sig: {alignSelf: 'stretch', height: 170, borderWidth: 1.5, borderRadius: 16, overflow: 'hidden'},
  sigHint: {position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center'},
  picker: {borderRadius: 18, padding: 16, gap: 14},
  pickerHead: {flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  thumbs: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  thumb: {width: '47%', borderRadius: 14, overflow: 'hidden'},
  thumbImg: {width: '100%', aspectRatio: 4 / 3},
  remove: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 46},
  pickBtns: {gap: 10},
});
