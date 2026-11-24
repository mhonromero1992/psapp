import React from 'react';
import {KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from 'styled-components/native';
import {useT} from '../../lib/i18n';
import {Icon} from './Icon';
import {Txt} from './Txt';

/** Bottom sheet: one task at a time, closes with the Close button, the scrim or the back button. */
export function Sheet({open, onClose, title, subtitle, children, footer}: {open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode}) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const t = useT();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={[styles.scrim, {backgroundColor: colors.scrim}]} onPress={onClose} accessibilityLabel={t('Close', 'Isara')} accessibilityRole="button" />
        <View style={[styles.sheet, {backgroundColor: colors.panel, paddingBottom: Math.max(insets.bottom, 16)}]} accessibilityViewIsModal>
          <View style={[styles.grabber, {backgroundColor: colors.lineStrong}]} />
          <View style={styles.headRow}>
            <View style={styles.flex}>
              <Txt variant="title" accessibilityRole="header">
                {title}
              </Txt>
              {subtitle ? (
                <Txt variant="small" color="soft">
                  {subtitle}
                </Txt>
              ) : null}
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('Close', 'Isara')} style={({pressed}) => [styles.close, {backgroundColor: pressed ? colors.panel2 : 'transparent'}]}>
              <Icon name="close" size={22} weight="bold" />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Centered dialog for confirmations: the amount repeated in large type before money moves. */
export function Dialog({open, onClose, title, children, footer}: {open: boolean; onClose: () => void; title: string; children?: React.ReactNode; footer?: React.ReactNode}) {
  const {colors} = useTheme();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.center, {backgroundColor: colors.scrim}]}>
        <View style={[styles.dialog, {backgroundColor: colors.panel}]} accessibilityViewIsModal>
          <Txt variant="title" accessibilityRole="header">
            {title}
          </Txt>
          {children}
          {footer ? <View style={styles.dialogFooter}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  scrim: {...StyleSheet.absoluteFillObject},
  sheet: {position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28},
  grabber: {alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginTop: 10, opacity: 0.6},
  headRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8},
  close: {width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: -6, marginRight: -8},
  body: {paddingHorizontal: 20, paddingBottom: 16, gap: 16},
  footer: {paddingHorizontal: 20, paddingTop: 8, gap: 10},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20},
  dialog: {width: '100%', maxWidth: 460, borderRadius: 24, padding: 22, gap: 14},
  dialogFooter: {gap: 10, marginTop: 6},
});
