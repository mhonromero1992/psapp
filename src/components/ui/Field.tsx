import React, {useState} from 'react';
import {Pressable, StyleSheet, TextInput, View, type TextInputProps} from 'react-native';
import {useTheme} from 'styled-components/native';
import {useT} from '../../lib/i18n';
import {Icon} from './Icon';
import {Sheet} from './Overlay';
import {Txt} from './Txt';

interface FieldFrame {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
}

/** Label above, hint or error below (with an icon), never a placeholder as the label. */
export function FieldFrame({label, hint, error, optional, children}: FieldFrame & {children: React.ReactNode}) {
  const t = useT();
  const {colors} = useTheme();
  return (
    <View style={styles.frame}>
      <Txt variant="label">
        {label}
        {optional ? <Txt variant="small" color="muted">{`  (${t('optional', 'hindi kailangan')})`}</Txt> : null}
      </Txt>
      {children}
      {error ? (
        <View style={styles.err} accessibilityRole="alert">
          <Icon name="warning" size={18} color={colors.tones.bad.text} weight="fill" />
          <Txt variant="smallStrong" color="bad" style={styles.flex}>
            {error}
          </Txt>
        </View>
      ) : hint ? (
        <Txt variant="small" color="soft">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

export function TextField({label, hint, error, optional, style, ...input}: FieldFrame & TextInputProps) {
  const {colors, type} = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <FieldFrame label={label} hint={hint} error={error} optional={optional}>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={colors.textMuted}
        maxFontSizeMultiplier={1.6}
        {...input}
        onFocus={e => {
          setFocus(true);
          input.onFocus?.(e);
        }}
        onBlur={e => {
          setFocus(false);
          input.onBlur?.(e);
        }}
        style={[styles.input, type.body, {color: colors.text, backgroundColor: colors.panel, borderColor: error ? colors.tones.bad.text : focus ? colors.primary : colors.lineStrong}, style]}
      />
    </FieldFrame>
  );
}

/** PIN entry: numbers only, large and spaced, with Show PIN. */
export function PinField({label, value, onChange, error, hint}: {label: string; value: string; onChange: (v: string) => void; error?: string | null; hint?: string}) {
  const t = useT();
  const {colors, type} = useTheme();
  const [show, setShow] = useState(false);
  return (
    <FieldFrame label={label} error={error} hint={hint}>
      <View style={styles.pinRow}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={v => onChange(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          secureTextEntry={!show}
          maxLength={6}
          maxFontSizeMultiplier={1.4}
          style={[styles.input, styles.pin, type.amountLarge, {color: colors.text, backgroundColor: colors.panel, borderColor: error ? colors.tones.bad.text : colors.lineStrong}]}
        />
        <Pressable onPress={() => setShow(s => !s)} accessibilityRole="button" accessibilityLabel={show ? t('Hide my PIN', 'Itago ang PIN') : t('Show my PIN', 'Ipakita ang PIN')} style={[styles.eye, {backgroundColor: colors.panel2}]}>
          <Icon name={show ? 'lock' : 'key'} size={22} />
          <Txt variant="smallStrong">{show ? t('Hide', 'Itago') : t('Show', 'Ipakita')}</Txt>
        </Pressable>
      </View>
    </FieldFrame>
  );
}

/** Peso amount: numbers only, ₱ prefix, grouped as you type. */
export function MoneyField({label, value, onChange, error, hint}: {label: string; value: number | ''; onChange: (v: number | '') => void; error?: string | null; hint?: string}) {
  const {colors, type} = useTheme();
  return (
    <FieldFrame label={label} error={error} hint={hint}>
      <View style={[styles.moneyWrap, {backgroundColor: colors.panel, borderColor: error ? colors.tones.bad.text : colors.lineStrong}]}>
        <Txt variant="amountLarge" color="soft">
          ₱
        </Txt>
        <TextInput
          accessibilityLabel={label}
          keyboardType="number-pad"
          value={value === '' ? '' : value.toLocaleString('en-PH')}
          onChangeText={v => {
            const d = v.replace(/[^0-9]/g, '');
            onChange(d ? Number(d) : '');
          }}
          maxFontSizeMultiplier={1.4}
          style={[styles.flex, type.amountLarge, {color: colors.text, paddingVertical: 12}]}
        />
      </View>
    </FieldFrame>
  );
}

/** A list choice in a sheet: no tiny native dropdowns. */
export function SelectField<T extends string>({label, value, options, onChange, error, hint, placeholder}: FieldFrame & {value: T | ''; options: {value: T; label: string; description?: string}[]; onChange: (v: T) => void; placeholder: string}) {
  const {colors} = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value);
  return (
    <FieldFrame label={label} error={error} hint={hint}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder}`}
        style={({pressed}) => [styles.select, {backgroundColor: pressed ? colors.panel2 : colors.panel, borderColor: error ? colors.tones.bad.text : colors.lineStrong}]}>
        <Txt variant="body" color={current ? 'text' : 'muted'} style={styles.flex}>
          {current?.label ?? placeholder}
        </Txt>
        <Icon name="chevron" size={18} color={colors.textMuted} weight="bold" />
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        {options.map(o => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
              accessibilityRole="radio"
              accessibilityState={{checked: on}}
              accessibilityLabel={o.description ? `${o.label}, ${o.description}` : o.label}
              style={({pressed}) => [styles.option, {backgroundColor: on ? colors.primarySoft : pressed ? colors.panel2 : 'transparent'}]}>
              <View style={styles.flex}>
                <Txt variant="bodyStrong">{o.label}</Txt>
                {o.description ? (
                  <Txt variant="small" color="soft">
                    {o.description}
                  </Txt>
                ) : null}
              </View>
              {on ? <Icon name="checkCircle" size={24} color={colors.primaryText} weight="fill" /> : null}
            </Pressable>
          );
        })}
      </Sheet>
    </FieldFrame>
  );
}

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_FIL = ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo', 'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre'];

/** Date as three plain choices (month, day, year), no calendar grid to fight with. Value: YYYY-MM-DD. */
export function DateField({label, value, onChange, error, hint, fromYear, toYear}: FieldFrame & {value: string; onChange: (v: string) => void; fromYear: number; toYear: number}) {
  const t = useT();
  const [y, m, d] = value ? value.split('-').map(Number) : [0, 0, 0];
  const set = (ny: number, nm: number, nd: number) => {
    if (ny && nm && nd) {onChange(`${ny}-${String(nm).padStart(2, '0')}-${String(Math.min(nd, new Date(ny, nm, 0).getDate())).padStart(2, '0')}`);}
    else {onChange(ny || nm || nd ? `${ny || 0}-${nm || 0}-${nd || 0}` : '');}
  };
  const years: {value: string; label: string}[] = [];
  for (let yy = toYear; yy >= fromYear; yy--) {years.push({value: String(yy), label: String(yy)});}
  return (
    <FieldFrame label={label} error={error} hint={hint}>
      <View style={styles.dateRow}>
        <View style={styles.dateMonth}>
          <SelectField label={t('Month', 'Buwan')} value={m ? String(m) : ''} placeholder={t('Month', 'Buwan')} options={MONTHS_EN.map((en, i) => ({value: String(i + 1), label: t(en, MONTHS_FIL[i])}))} onChange={v => set(y, Number(v), d)} />
        </View>
        <View style={styles.dateDay}>
          <SelectField label={t('Day', 'Araw')} value={d ? String(d) : ''} placeholder={t('Day', 'Araw')} options={Array.from({length: 31}, (_, i) => ({value: String(i + 1), label: String(i + 1)}))} onChange={v => set(y, m, Number(v))} />
        </View>
      </View>
      <SelectField label={t('Year', 'Taon')} value={y ? String(y) : ''} placeholder={t('Year', 'Taon')} options={years} onChange={v => set(Number(v), m, d)} />
    </FieldFrame>
  );
}

const styles = StyleSheet.create({
  frame: {gap: 8},
  flex: {flex: 1},
  err: {flexDirection: 'row', alignItems: 'center', gap: 8},
  input: {minHeight: 56, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12},
  pinRow: {flexDirection: 'row', gap: 10, alignItems: 'stretch'},
  pin: {flex: 1, minWidth: 0, letterSpacing: 8},
  eye: {minWidth: 76, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 8},
  moneyWrap: {flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 60, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16},
  select: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12},
  option: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10},
  dateRow: {flexDirection: 'row', gap: 10},
  dateMonth: {flex: 3},
  dateDay: {flex: 2},
});
