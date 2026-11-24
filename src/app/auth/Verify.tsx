import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Button, Card, Icon, OtpInput, Screen, Txt} from '../../components/ui';
import {useT} from '../../lib/i18n';
import {demoUser, SAMPLE_OTP, useSession} from '../../store/session';
import {toast} from '../../store/ui';
import {HelpLink} from '../shared/Help';

/** One-time code by SMS. No pressure: a new code can be sent after 30 seconds. */
export default function Verify() {
  const t = useT();
  const {colors} = useTheme();
  const signIn = useSession(s => s.signIn);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(30);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const verify = () => {
    if (code.length !== 6) return setError(t('Enter all 6 numbers of the code.', 'Ilagay ang lahat ng 6 na numero ng code.'));
    if (code !== SAMPLE_OTP) return setError(t('That code is not right. Check the SMS and try again.', 'Mali ang code. Tingnan ang SMS at subukan muli.'));
    setError(null);
    setBusy(true);
    setTimeout(() => signIn(demoUser()), 450);
  };

  return (
    <Screen helpTopic="Signing in or my PIN">
      <View style={[styles.disc, {backgroundColor: colors.primarySoft}]}>
        <Icon name="chat" size={36} weight="duotone" color={colors.primaryText} />
      </View>
      <View style={styles.head}>
        <Txt variant="display" accessibilityRole="header">
          {t('Enter the code we sent', 'Ilagay ang code na ipinadala namin')}
        </Txt>
        <Txt variant="body" color="soft">
          {t('We sent a 6-number code by SMS to 0917 ••• 1196.', 'Nagpadala kami ng 6-numerong code sa SMS sa 0917 ••• 1196.')}
        </Txt>
      </View>
      <OtpInput
        value={code}
        onChange={v => {
          setCode(v);
          setError(null);
        }}
        error={!!error}
      />
      {error ? (
        <Txt variant="smallStrong" color="bad" style={styles.err} accessibilityRole="alert">
          {error}
        </Txt>
      ) : null}
      <View style={styles.actions}>
        <Button title={t('Confirm and sign in', 'Kumpirmahin at mag-sign in')} icon="shield" busy={busy} onPress={verify} testID="verify-confirm" />
        <Button
          title={wait > 0 ? t(`Send a new code in ${wait} seconds`, `Magpadala ng bagong code sa loob ng ${wait} segundo`) : t('Send me a new code', 'Padalhan ako ng bagong code')}
          variant="ghost"
          disabled={wait > 0}
          onPress={() => {
            setWait(30);
            toast(t('New code sent', 'Bagong code naipadala'), 'info', t(`Sample code for this demo: ${SAMPLE_OTP}`, `Sample code para sa demo: ${SAMPLE_OTP}`));
          }}
        />
      </View>
      <Card tone="inset" style={[styles.sample, {backgroundColor: colors.tones.warn.bg}]}>
        <Txt variant="body">
          {t('Sample code for this demo:', 'Sample code para sa demo:')} <Txt variant="bodyStrong">{SAMPLE_OTP}</Txt>
        </Txt>
      </Card>
      <HelpLink topic="Signing in or my PIN" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  disc: {width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginTop: 8},
  head: {gap: 8, marginTop: 16, marginBottom: 24},
  err: {marginTop: 10},
  actions: {gap: 10, marginTop: 22},
  sample: {marginTop: 16, marginBottom: 8},
});
