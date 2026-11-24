import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from 'styled-components/native';
import {Icon, type IconName} from '../components/ui/Icon';
import {Txt} from '../components/ui/Txt';
import {useT} from '../lib/i18n';

const TABS: Record<string, {icon: IconName; en: string; fil: string}> = {
  Home: {icon: 'home', en: 'Home', fil: 'Home'},
  Equity: {icon: 'equity', en: 'Equity', fil: 'Equity'},
  Loans: {icon: 'loans', en: 'Loans', fil: 'Loans'},
  Claims: {icon: 'claims', en: 'Claims', fil: 'Claims'},
  More: {icon: 'more', en: 'More', fil: 'Iba pa'},
};

/** A floating bar of five labelled tabs: big icons, words always shown, the current tab filled. */
export function TabBar({state, navigation}: BottomTabBarProps) {
  const t = useT();
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, {paddingBottom: Math.max(insets.bottom, 10)}]}>
      <View style={[styles.bar, {backgroundColor: colors.panel, borderColor: colors.line}]} accessibilityRole="tablist">
        {state.routes.map((route, i) => {
          const on = state.index === i;
          const tab = TABS[route.name];
          const label = t(tab.en, tab.fil);
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{selected: on}}
              accessibilityLabel={label}
              onPress={() => {
                const e = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
                if (!on && !e.defaultPrevented) {navigation.navigate(route.name);}
              }}
              style={({pressed}) => [styles.tab, on && {backgroundColor: colors.primarySoft}, pressed && !on && {backgroundColor: colors.panel2}]}>
              <Icon name={tab.icon} size={26} weight={on ? 'duotone' : 'regular'} color={on ? colors.primaryText : colors.textSoft} />
              <Txt variant="tab" color={on ? 'primary' : 'soft'} numberOfLines={1}>
                {label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 10},
  bar: {flexDirection: 'row', borderRadius: 26, padding: 6, gap: 2, borderWidth: StyleSheet.hairlineWidth * 2, shadowColor: '#071b37', shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: {width: 0, height: 8}, elevation: 10},
  tab: {flex: 1, minHeight: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 2},
});
