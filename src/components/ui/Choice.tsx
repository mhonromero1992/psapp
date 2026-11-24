import React from 'react';
import {Pressable, StyleSheet, Switch as RNSwitch, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Icon, type IconName} from './Icon';
import {Txt} from './Txt';

/** On/off with the whole row as the target. */
export function SwitchRow({value, onChange, label, description, icon}: {value: boolean; onChange: (v: boolean) => void; label: string; description?: string; icon?: IconName}) {
  const {colors} = useTheme();
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{checked: value}} accessibilityLabel={label} accessibilityHint={description} style={styles.row}>
      {icon ? <Icon name={icon} size={28} weight="duotone" color={colors.primaryText} /> : null}
      <View style={styles.flex}>
        <Txt variant="bodyStrong">{label}</Txt>
        {description ? (
          <Txt variant="small" color="soft">
            {description}
          </Txt>
        ) : null}
      </View>
      <RNSwitch value={value} onValueChange={onChange} trackColor={{false: colors.lineStrong, true: colors.positive}} thumbColor="#ffffff" ios_backgroundColor={colors.lineStrong} importantForAccessibility="no" accessibilityElementsHidden />
    </Pressable>
  );
}

export function Checkbox({checked, onChange, label, description}: {checked: boolean; onChange: (v: boolean) => void; label: string; description?: string}) {
  const {colors} = useTheme();
  return (
    <Pressable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{checked}} accessibilityLabel={label} style={styles.check}>
      <View style={[styles.box, {borderColor: checked ? colors.primary : colors.lineStrong, backgroundColor: checked ? colors.primary : colors.panel}]}>{checked ? <Icon name="check" size={18} color="#fff" weight="bold" /> : null}</View>
      <View style={styles.flex}>
        <Txt variant="body">{label}</Txt>
        {description ? (
          <Txt variant="small" color="soft">
            {description}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  aside?: string;
  icon?: IconName;
  disabled?: boolean;
}

/** Big selectable cards: the chosen one gets a ring and a filled check, never colour alone. */
export function RadioCards<T extends string>({value, onChange, options, label}: {value: T | ''; onChange: (v: T) => void; options: RadioOption<T>[]; label: string}) {
  const {colors} = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.cards}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            disabled={o.disabled}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{checked: on, disabled: o.disabled}}
            accessibilityLabel={[o.label, o.description, o.aside].filter(Boolean).join(', ')}
            style={({pressed}) => [
              styles.card,
              {backgroundColor: on ? colors.primarySoft : pressed ? colors.panel2 : colors.panel, borderColor: on ? colors.primary : colors.line, borderWidth: on ? 2 : 1.5, opacity: o.disabled ? 0.5 : 1},
            ]}>
            {o.icon ? <Icon name={o.icon} size={28} weight="duotone" color={colors.primaryText} /> : null}
            <View style={styles.flex}>
              <Txt variant="bodyStrong">{o.label}</Txt>
              {o.description ? (
                <Txt variant="small" color="soft">
                  {o.description}
                </Txt>
              ) : null}
            </View>
            {o.aside ? (
              <Txt variant="smallStrong" color="soft">
                {o.aside}
              </Txt>
            ) : null}
            <View style={[styles.radio, {borderColor: on ? colors.primary : colors.lineStrong}, on && {backgroundColor: colors.primary}]}>{on ? <Icon name="check" size={15} color="#fff" weight="bold" /> : null}</View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A small set of mutually exclusive modes (12 months / 5 years / All). */
export function Segmented<T extends string>({value, onChange, options, label}: {value: T; onChange: (v: T) => void; options: {value: T; label: string}[]; label: string}) {
  const {colors} = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.seg, {backgroundColor: colors.panel2}]}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} accessibilityRole="radio" accessibilityState={{checked: on}} style={[styles.segItem, on && [styles.segOn, {backgroundColor: colors.panel}]]}>
            <Txt variant="smallStrong" color={on ? 'text' : 'soft'}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  row: {flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 8},
  check: {flexDirection: 'row', alignItems: 'flex-start', gap: 14, minHeight: 52, paddingVertical: 8},
  box: {width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1},
  cards: {gap: 10},
  card: {flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, minHeight: 64},
  radio: {width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  seg: {flexDirection: 'row', padding: 4, borderRadius: 14, gap: 4},
  segItem: {flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 11, paddingHorizontal: 8},
  segOn: {shadowColor: '#071b37', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 1}, elevation: 1},
});
