import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useEffect, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Button, Card, Dialog, Icon, OtpInput, PinField, Screen, TextField, Txt} from '../../components/ui';
import {useT} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {DEMO_MEMBER, demoUser, SAMPLE_OTP, useSession} from '../../store/session';
import {toast} from '../../store/ui';
import {HelpLink} from '../shared/Help';

const FULL = 1;

/** Accepts the member ID or the registered mobile number, in any spacing. */
function matchesMember(v: string) {
  const id = v.trim().toUpperCase().replace(/\s/g, '');
  const digits = v.replace(/\D/g, '');
  const mob = DEMO_MEMBER.mobile.replace(/\D/g, '');
  return id === DEMO_MEMBER.id || digits === mob || digits === '63' + mob.slice(1);
}

/** Fingerprint first (no typing), then member ID and 6-number PIN, then a one-time code. */
export default function SignIn() {
  const t = useT();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const pin = useSession(s => s.pin);
  const biometric = useSession(s => s.biometric);
  const signIn = useSession(s => s.signIn);
  const [account, setAccount] = useState('');
  const [pinValue, setPinValue] = useState('');
  const [errors, setErrors] = useState<{account?: string; pin?: string}>({});
  const [tries, setTries] = useState(5);
  const [busy, setBusy] = useState(false);
  const [finger, setFinger] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = () => {
    const e: typeof errors = {};
    if (!account.trim()) {e.account = t('Enter your member ID or mobile number.', 'Ilagay ang iyong member ID o mobile number.');}
    else if (!matchesMember(account)) {e.account = t("We can't find that member ID or mobile number. Check it against your membership card.", 'Hindi namin makita ang member ID o mobile number na iyan. Tingnan ang iyong membership card.');}
    if (!/^\d{6}$/.test(pinValue)) {e.pin = t('Your PIN has 6 numbers.', 'Ang iyong PIN ay may 6 na numero.');}
    else if (!e.account && pinValue !== pin) {
      const left = tries - 1;
      setTries(left);
      e.pin = t(`That PIN does not match. You have ${left} tries left.`, `Hindi tugma ang PIN. May ${left} subok ka pa.`);
    }
    setErrors(e);
    if (Object.keys(e).length) {return;}
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast(t('Code sent by SMS', 'Naipadala ang code sa SMS'), 'info', t(`Sample code for this demo: ${SAMPLE_OTP}`, `Sample code para sa demo: ${SAMPLE_OTP}`));
      nav.navigate('Verify');
    }, 650);
  };

  return (
    <Screen title={t('Sign in', 'Mag-sign in')} subtitle={t('Use your fingerprint, or your member ID and 6-number PIN.', 'Gamitin ang iyong fingerprint, o ang member ID at 6-numerong PIN.')} helpTopic="Signing in or my PIN">
      {biometric[DEMO_MEMBER.id] && (
        <Pressable onPress={() => setFinger(true)} accessibilityRole="button" accessibilityLabel={t('Sign in with fingerprint', 'Mag-sign in gamit ang fingerprint')} style={({pressed}) => [styles.finger, {backgroundColor: pressed ? colors.panel2 : colors.panel}]}>
          <View style={[styles.fingerIcon, {backgroundColor: colors.primarySoft}]}>
            <Icon name="fingerprint" size={36} weight="duotone" color={colors.primaryText} />
          </View>
          <View style={styles.flex}>
            <Txt variant="heading">{t('Sign in with fingerprint', 'Mag-sign in gamit ang fingerprint')}</Txt>
            <Txt variant="small" color="soft">
              {t('Turned on for Rowena on this phone', 'Naka-on para kay Rowena sa phone na ito')}
            </Txt>
          </View>
        </Pressable>
      )}

      <View style={styles.or}>
        <View style={[styles.rule, {backgroundColor: colors.line}]} />
        <Txt variant="smallStrong" color="muted">
          {t('or use your PIN', 'o gamitin ang PIN')}
        </Txt>
        <View style={[styles.rule, {backgroundColor: colors.line}]} />
      </View>

      <View style={styles.form}>
        <TextField label={t('Member ID or mobile number', 'Member ID o mobile number')} hint={t('Example: PSM-2012-004512 or 0917 482 1196', 'Halimbawa: PSM-2012-004512 o 0917 482 1196')} error={errors.account} value={account} onChangeText={setAccount} autoCapitalize="characters" autoCorrect={false} autoComplete="username" />
        <PinField label={t('6-number PIN', '6-numerong PIN')} value={pinValue} onChange={setPinValue} error={errors.pin} />
        <Button title={t('Continue', 'Magpatuloy')} icon="key" busy={busy} onPress={submit} testID="signin-continue" />
        <Button title={t('I forgot my PIN', 'Nakalimutan ko ang PIN')} variant="ghost" block={false} onPress={() => setForgot(true)} />
        <HelpLink topic="Signing in or my PIN" />
      </View>

      <Card tone="inset" style={[styles.sample, {backgroundColor: colors.tones.warn.bg}]}>
        <Txt variant="smallStrong" color="warn">
          {t('Sample account for this demo', 'Sample account para sa demo')}
        </Txt>
        <Txt variant="body">
          {t('Member ID', 'Member ID')} {DEMO_MEMBER.id} · PIN {pin}
        </Txt>
        <Button
          title={t('Fill in for me', 'Punan para sa akin')}
          variant="quiet"
          size="md"
          block={false}
          onPress={() => {
            setAccount(DEMO_MEMBER.id);
            setPinValue(pin);
            setErrors({});
          }}
        />
      </Card>

      <FingerprintDialog open={finger} onClose={() => setFinger(false)} onSuccess={() => signIn(demoUser())} />
      <ForgotPin open={forgot} onClose={() => setForgot(false)} />
    </Screen>
  );
}

/** Simulated device prompt: waiting, then a clear "recognized" before signing in. */
function FingerprintDialog({open, onClose, onSuccess}: {open: boolean; onClose: () => void; onSuccess: () => void}) {
  const t = useT();
  const {colors} = useTheme();
  const [ok, setOk] = useState(false);
  const pulse = useRef(new Animated.Value(0.6)).current;
  const done = useRef(onSuccess);
  done.current = onSuccess;
  useEffect(() => {
    if (!open) {
      setOk(false);
      return;
    }
    Animated.sequence([Animated.timing(pulse, {toValue: 1, duration: 600, useNativeDriver: true}), Animated.timing(pulse, {toValue: 0.6, duration: 600, useNativeDriver: true})]).start();
    const a = setTimeout(() => setOk(true), 1300);
    const b = setTimeout(() => done.current(), 2000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [open, pulse]);
  return (
    <Dialog open={open} onClose={onClose} title={t('Touch the fingerprint sensor', 'Hawakan ang fingerprint sensor')} footer={!ok ? <Button title={t('Cancel', 'Kanselahin')} variant="quiet" onPress={onClose} /> : undefined}>
      <View style={styles.fpBody} accessibilityLiveRegion="polite">
        <Animated.View style={[styles.fpDisc, {backgroundColor: ok ? colors.tones.ok.bg : colors.primarySoft, opacity: ok ? FULL : pulse}]}>
          <Icon name={ok ? 'checkCircle' : 'fingerprint'} size={64} weight={ok ? 'fill' : 'duotone'} color={ok ? colors.positive : colors.primaryText} />
        </Animated.View>
        <Txt variant="heading">{ok ? t('Fingerprint recognized', 'Nakilala ang fingerprint') : t('Waiting for your fingerprint', 'Hinihintay ang iyong fingerprint')}</Txt>
        <Txt variant="small" color="soft">
          {t('Simulated for this demo', 'Simulation para sa demo')}
        </Txt>
      </View>
    </Dialog>
  );
}

/** Reset the PIN with a code sent to the registered mobile: three short steps. */
function ForgotPin({open, onClose}: {open: boolean; onClose: () => void}) {
  const t = useT();
  const {colors} = useTheme();
  const setPin = useSession(s => s.setPin);
  const [step, setStep] = useState(0);
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!open) {
      setStep(0);
      setMobile('');
      setCode('');
      setP1('');
      setP2('');
      setErr(null);
    }
  }, [open]);
  const go = () => {
    setErr(null);
    if (step === 0) {
      if (mobile.replace(/\D/g, '') !== DEMO_MEMBER.mobile.replace(/\D/g, '')) {return setErr(t('That number is not the one on your membership record. For this demo, use 0917 482 1196.', 'Hindi iyan ang numero sa iyong record. Para sa demo, gamitin ang 0917 482 1196.'));}
      toast(t('Code sent by SMS', 'Naipadala ang code sa SMS'), 'info', t(`Sample code for this demo: ${SAMPLE_OTP}`, `Sample code para sa demo: ${SAMPLE_OTP}`));
      return setStep(1);
    }
    if (step === 1) {
      if (code !== SAMPLE_OTP) {return setErr(t('That code is not right. Check the SMS and try again.', 'Mali ang code. Tingnan ang SMS at subukan muli.'));}
      return setStep(2);
    }
    if (step === 2) {
      if (!/^\d{6}$/.test(p1)) {return setErr(t('Your new PIN needs exactly 6 numbers.', 'Ang bagong PIN ay dapat may 6 na numero.'));}
      if (/^(\d)\1{5}$/.test(p1) || p1 === '123456' || p1 === '654321') {return setErr(t('Choose a PIN that is harder to guess than repeated or counting numbers.', 'Pumili ng PIN na hindi madaling hulaan.'));}
      if (p1 !== p2) {return setErr(t('The two PINs are not the same.', 'Hindi magkapareho ang dalawang PIN.'));}
      setPin(p1);
      return setStep(3);
    }
    onClose();
  };
  const titles = [t('Reset your PIN', 'I-reset ang PIN'), t('Enter the code', 'Ilagay ang code'), t('Choose a new PIN', 'Pumili ng bagong PIN'), t('Your PIN is changed', 'Napalitan na ang PIN')];
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={titles[step]}
      footer={
        <>
          <Button title={step === 0 ? t('Send me a code', 'Padalhan ako ng code') : step === 1 ? t('Check the code', 'Suriin ang code') : step === 2 ? t('Save my new PIN', 'I-save ang bagong PIN') : t('Sign in now', 'Mag-sign in na')} onPress={go} />
          {step < 3 ? <Button title={step === 0 ? t('Cancel', 'Kanselahin') : t('Back', 'Bumalik')} variant="quiet" onPress={() => (step === 0 ? onClose() : setStep(step - 1))} /> : null}
        </>
      }>
      {step < 3 ? (
        <Txt variant="smallStrong" color="soft">
          {t(`Step ${step + 1} of 3`, `Hakbang ${step + 1} sa 3`)}
        </Txt>
      ) : null}
      {step === 0 && <TextField label={t('Your registered mobile number', 'Ang iyong rehistradong mobile number')} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" error={err} placeholder="0917 482 1196" />}
      {step === 1 && (
        <View style={styles.gap}>
          <Txt variant="body" color="soft">
            {t('We sent a 6-number code to 0917 ••• 1196.', 'Nagpadala kami ng 6-numerong code sa 0917 ••• 1196.')}
          </Txt>
          <OtpInput value={code} onChange={setCode} error={!!err} />
          {err ? (
            <Txt variant="smallStrong" color="bad">
              {err}
            </Txt>
          ) : null}
        </View>
      )}
      {step === 2 && (
        <View style={styles.gap}>
          <PinField label={t('New 6-number PIN', 'Bagong 6-numerong PIN')} value={p1} onChange={setP1} />
          <PinField label={t('Type the new PIN again', 'I-type muli ang bagong PIN')} value={p2} onChange={setP2} error={err} />
        </View>
      )}
      {step === 3 && (
        <View style={[styles.done, {backgroundColor: colors.tones.ok.bg}]}>
          <Icon name="checkCircle" size={28} weight="fill" color={colors.positive} />
          <Txt variant="body" style={styles.flex}>
            {t('Use your new PIN the next time you sign in.', 'Gamitin ang bagong PIN sa susunod na pag-sign in.')}
          </Txt>
        </View>
      )}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  finger: {flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 20, padding: 18, shadowColor: '#071b37', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: {width: 0, height: 4}, elevation: 2},
  fingerIcon: {width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center'},
  or: {flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22},
  rule: {flex: 1, height: 2},
  form: {gap: 18},
  sample: {gap: 8, marginTop: 26},
  fpBody: {alignItems: 'center', gap: 10, paddingVertical: 8},
  fpDisc: {width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 8},
  gap: {gap: 12},
  done: {flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 16, padding: 16},
});
