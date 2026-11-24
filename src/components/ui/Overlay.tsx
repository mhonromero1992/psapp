import React, {useEffect, useRef} from 'react';
import {KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from 'styled-components/native';
import {useT} from '../../lib/i18n';
import {useUi} from '../../store/ui';
import {Icon} from './Icon';
import {ToastHost} from './Toast';
import {Txt} from './Txt';

let layerSeq = 0;
/** Registers an open sheet or dialog; true when it is the top-most layer (it then shows the toasts). */
function useLayer(open: boolean) {
  const id = useRef(++layerSeq).current;
  const pushModal = useUi(s => s.pushModal);
  const popModal = useUi(s => s.popModal);
  useEffect(() => {
    if (!open) {return;}
    pushModal(id);
    return () => popModal(id);
  }, [open, id, pushModal, popModal]);
  return useUi(s => s.modals[s.modals.length - 1] === id);
}

/** Bottom sheet: one task at a time, closes with the Close button, the scrim or the back button. */
export function Sheet({open, onClose, title, subtitle, children, footer}: {open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode}) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const t = useT();
  const top = useLayer(open);
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
      {top ? <ToastHost inModal /> : null}
    </Modal>
  );
}

/**
 * Centered dialog for confirmations: the amount repeated in large type before money moves. Scrolls
 * when it is taller than the screen (Extra large text), and rises above the keyboard.
 */
export function Dialog({open, onClose, title, children, footer}: {open: boolean; onClose: () => void; title: string; children?: React.ReactNode; footer?: React.ReactNode}) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const top = useLayer(open);
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.center, {backgroundColor: colors.scrim, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16}]}>
          <View style={[styles.dialog, {backgroundColor: colors.panel}]} accessibilityViewIsModal>
            <ScrollView style={styles.dialogScroll} contentContainerStyle={styles.dialogBody} keyboardShouldPersistTaps="handled" bounces={false}>
              <Txt variant="title" accessibilityRole="header">
                {title}
              </Txt>
              {children}
            </ScrollView>
            {footer ? <View style={styles.dialogFooter}>{footer}</View> : null}
          </View>
        </View>
      </KeyboardAvoidingView>
      {top ? <ToastHost inModal /> : null}
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
  dialog: {width: '100%', maxWidth: 460, maxHeight: '100%', borderRadius: 24, paddingVertical: 22},
  dialogScroll: {flexGrow: 0},
  dialogBody: {gap: 14, paddingHorizontal: 22},
  dialogFooter: {gap: 10, marginTop: 16, paddingHorizontal: 22},
});
