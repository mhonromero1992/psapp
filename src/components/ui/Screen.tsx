import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from 'styled-components/native';
import {useT} from '../../lib/i18n';
import {useCurrentMember, useMemberNotifications} from '../../store/hooks';
import {useUi} from '../../store/ui';
import {Lockup} from '../brand/Brand';
import {Icon} from './Icon';
import {Avatar} from './Parts';
import {Txt} from './Txt';

interface ScreenProps {
  children: React.ReactNode;
  /** tabs: lockup, Help, notifications, profile. stack: Back and Help. none: no bar. */
  bar?: 'tabs' | 'stack' | 'none';
  /** Big page title at the top of the content. */
  title?: string;
  subtitle?: string;
  /** A small line above the title (a ribbon label, a reference number). */
  lead?: React.ReactNode;
  helpTopic?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Sticky actions at the bottom (flows). */
  footer?: React.ReactNode;
  scroll?: boolean;
  /** Extra space under the content for the floating tab bar. */
  tabs?: boolean;
  testID?: string;
}

export function Screen({children, bar = 'stack', title, subtitle, lead, helpTopic, onRefresh, refreshing = false, footer, scroll = true, tabs, testID}: ScreenProps) {
  const {colors, space} = useTheme();
  const insets = useSafeAreaInsets();
  const body = (
    <>
      {(title || lead) && (
        <View style={styles.head}>
          {lead}
          {title ? (
            <Txt variant="display" accessibilityRole="header">
              {title}
            </Txt>
          ) : null}
          {subtitle ? (
            <Txt variant="body" color="soft">
              {subtitle}
            </Txt>
          ) : null}
        </View>
      )}
      {children}
    </>
  );
  return (
    <SafeAreaView testID={testID} edges={['top', 'left', 'right']} style={[styles.root, {backgroundColor: colors.ground}]}>
      <StatusBar barStyle={colors.scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.ground} />
      {bar === 'tabs' && <TabsBar helpTopic={helpTopic} />}
      {bar === 'stack' && <StackBar helpTopic={helpTopic} />}
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{padding: space.gutter, paddingBottom: (tabs ? 120 : 40) + (footer ? 0 : insets.bottom)}}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined}>
            {body}
          </ScrollView>
        ) : (
          <View style={[styles.root, {padding: space.gutter}]}>{body}</View>
        )}
        {footer ? <View style={[styles.footer, {backgroundColor: colors.ground, borderTopColor: colors.line, paddingBottom: Math.max(insets.bottom, 12)}]}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HelpButton({topic}: {topic?: string}) {
  const t = useT();
  const {colors} = useTheme();
  const openHelp = useUi(s => s.openHelp);
  return (
    <Pressable onPress={() => openHelp(topic)} accessibilityRole="button" accessibilityLabel={t('Help', 'Tulong')} style={({pressed}) => [styles.help, {backgroundColor: pressed ? colors.panel2 : colors.primarySoft}]}>
      <Icon name="help" size={20} color={colors.primaryText} weight="bold" />
      <Txt variant="smallStrong" color="primary">
        {t('Help', 'Tulong')}
      </Txt>
    </Pressable>
  );
}

function TabsBar({helpTopic}: {helpTopic?: string}) {
  const t = useT();
  const {colors, scale} = useTheme();
  const nav = useNavigation<{navigate: (name: string) => void}>();
  const member = useCurrentMember();
  const notes = useMemberNotifications(member.id);
  const unread = notes.filter(n => !n.read).length;
  return (
    <View style={styles.bar}>
      <Lockup wordmark={scale <= 1} />
      <View style={styles.barRight}>
        <HelpButton topic={helpTopic} />
        <Pressable
          onPress={() => nav.navigate('Notifications')}
          accessibilityRole="button"
          accessibilityLabel={unread ? t(`Notifications, ${unread} unread`, `Mga abiso, ${unread} hindi pa nababasa`) : t('Notifications', 'Mga abiso')}
          style={({pressed}) => [styles.iconBtn, pressed && {backgroundColor: colors.panel2}]}>
          <Icon name="bell" size={25} />
          {unread > 0 && (
            <View style={[styles.dot, {borderColor: colors.ground}]}>
              <Txt variant="tab" style={styles.dotText}>
                {String(unread)}
              </Txt>
            </View>
          )}
        </Pressable>
        <Pressable onPress={() => nav.navigate('Profile')} accessibilityRole="button" accessibilityLabel={t('My profile', 'Aking profile')} style={styles.iconBtn}>
          <Avatar name={`${member.firstName} ${member.lastName}`} size={38} />
        </Pressable>
      </View>
    </View>
  );
}

function StackBar({helpTopic}: {helpTopic?: string}) {
  const t = useT();
  const {colors} = useTheme();
  const nav = useNavigation();
  return (
    <View style={styles.bar}>
      {nav.canGoBack() ? (
        <Pressable onPress={() => nav.goBack()} accessibilityRole="button" accessibilityLabel={t('Back', 'Bumalik')} style={({pressed}) => [styles.back, pressed && {backgroundColor: colors.panel2}]}>
          <Icon name="back" size={22} weight="bold" />
          <Txt variant="bodyStrong">{t('Back', 'Bumalik')}</Txt>
        </Pressable>
      ) : (
        <Lockup />
      )}
      <HelpButton topic={helpTopic} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  head: {gap: 8, marginBottom: 22, marginTop: 4},
  bar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, minHeight: 60},
  barRight: {flexDirection: 'row', alignItems: 'center', gap: 4},
  help: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 44, borderRadius: 12},
  iconBtn: {minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24},
  dot: {position: 'absolute', top: 4, right: 4, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, backgroundColor: '#c4141b', alignItems: 'center', justifyContent: 'center', borderWidth: 2},
  dotText: {color: '#fff', fontSize: 11, lineHeight: 14},
  back: {flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 10, marginLeft: -6, borderRadius: 12},
  footer: {paddingHorizontal: 18, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth * 2, gap: 10},
});
