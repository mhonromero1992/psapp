import React, {useEffect, useState} from 'react';
import {Linking, StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Button, Card, Icon, RadioCards, SelectField, Sheet, TextField, Txt} from '../../components/ui';
import {OFFICE_BY_ID} from '../../data/reference';
import {useT} from '../../lib/i18n';
import {useDB} from '../../store/db';
import {useCurrentMember} from '../../store/hooks';
import {useSession} from '../../store/session';
import {toast, useUi} from '../../store/ui';

const TOPICS: [string, string][] = [
  ['Loans', 'Loans'],
  ['Claims', 'Claims'],
  ['Equity Value and contributions', 'Equity Value at kontribusyon'],
  ['Payouts', 'Payouts'],
  ['Signing in or my PIN', 'Pag-sign in o PIN'],
  ['Something else', 'Iba pa'],
];

/**
 * Help is always one tap away (the Help button on every screen). Most members are older, so the
 * first option is a person: we call you back. Then the member's own branch, then short tips.
 */
export function HelpSheet() {
  const t = useT();
  const {colors} = useTheme();
  const open = useUi(s => s.helpOpen);
  const topicFromUi = useUi(s => s.helpTopic);
  const close = useUi(s => s.closeHelp);
  const signedIn = !!useSession(s => s.user);
  const fallback = useCurrentMember();
  const member = signedIn ? fallback : null;
  const requestCallback = useDB(s => s.requestCallback);
  const office = OFFICE_BY_ID[member?.officeId ?? 'HO'] ?? OFFICE_BY_ID.HO;

  const [topic, setTopic] = useState(topicFromUi);
  const [when, setWhen] = useState<'afternoon' | 'morning' | ''>('');
  const [mobile, setMobile] = useState(member?.mobile ?? '');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<{when?: string; mobile?: string; name?: string}>({});
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTopic(topicFromUi);
      setMobile(member?.mobile ?? '');
    } else {
      setSent(null);
      setWhen('');
      setErrors({});
    }
  }, [open, topicFromUi, member?.mobile]);

  const submit = () => {
    const e: typeof errors = {};
    if (!when) {e.when = t('Choose a time for our call.', 'Pumili ng oras para sa tawag.');}
    if (!member && name.trim().length < 3) {e.name = t('Enter your full name.', 'Ilagay ang iyong buong pangalan.');}
    if (mobile.replace(/\D/g, '').length !== 11) {e.mobile = t('Enter an 11-digit mobile number, like 0917 123 4567.', 'Ilagay ang 11-digit na mobile number, gaya ng 0917 123 4567.');}
    setErrors(e);
    if (Object.keys(e).length) {return;}
    setBusy(true);
    setTimeout(() => {
      const label = when === 'morning' ? t('Tomorrow morning', 'Bukas ng umaga') : t('This afternoon', 'Mamayang hapon');
      requestCallback({memberId: member?.id ?? null, name: member ? `${member.firstName} ${member.lastName}` : name.trim(), mobile, topic, when: label});
      setBusy(false);
      setSent(label);
      toast(t('Call back requested', 'Na-request na ang tawag'), 'ok', `${label} · ${mobile}`);
    }, 700);
  };

  return (
    <Sheet open={open} onClose={close} title={t('Need help?', 'Kailangan ng tulong?')} subtitle={t('We can call you, or you can visit your branch.', 'Maaari ka naming tawagan, o bumisita sa iyong sangay.')}>
      {sent ? (
        <Card tone="inset" style={styles.gap}>
          <Icon name="checkCircle" size={40} color={colors.positive} weight="fill" />
          <Txt variant="title">{t("We'll call you", 'Tatawagan ka namin')}</Txt>
          <Txt variant="body">
            {sent}, {t('on', 'sa')} {mobile}. {t('A PSMBFI member services officer will call about', 'Tatawag ang isang member services officer ng PSMBFI tungkol sa')} {topic.toLowerCase()}.
          </Txt>
          <Button title={t('Close', 'Isara')} variant="quiet" onPress={close} />
        </Card>
      ) : (
        <>
          <View style={styles.titleRow}>
            <Icon name="phone" size={26} weight="duotone" color={colors.primaryText} />
            <Txt variant="heading">{t('Ask us to call you', 'Hilingin na tawagan ka')}</Txt>
          </View>
          <SelectField label={t('What is it about?', 'Tungkol saan?')} value={topic} placeholder={t('Choose a topic', 'Pumili ng paksa')} options={TOPICS.map(([en, fil]) => ({value: en, label: t(en, fil)}))} onChange={setTopic} />
          <View style={styles.gap}>
            <Txt variant="label">{t('When should we call?', 'Kailan ka namin tatawagan?')}</Txt>
            <RadioCards
              label={t('When should we call?', 'Kailan ka namin tatawagan?')}
              value={when}
              onChange={setWhen}
              options={[
                {value: 'afternoon', label: t('This afternoon', 'Mamayang hapon'), description: '1:00 to 5:00 PM'},
                {value: 'morning', label: t('Tomorrow morning', 'Bukas ng umaga'), description: '8:00 AM to 12:00 NN'},
              ]}
            />
            {errors.when ? (
              <Txt variant="smallStrong" color="bad">
                {errors.when}
              </Txt>
            ) : null}
          </View>
          {!member && <TextField label={t('Your full name', 'Iyong buong pangalan')} value={name} onChangeText={setName} error={errors.name} autoComplete="name" />}
          <TextField label={t('Mobile number', 'Mobile number')} value={mobile} onChangeText={setMobile} error={errors.mobile} keyboardType="phone-pad" autoComplete="tel" />
          <Button title={t('Request a call back', 'Humiling ng tawag')} icon="phone" busy={busy} onPress={submit} />

          <View style={[styles.titleRow, styles.section]}>
            <Icon name="branches" size={26} weight="duotone" color={colors.primaryText} />
            <Txt variant="heading">{member ? t('Visit your branch', 'Bumisita sa iyong sangay') : t('Visit the head office', 'Bumisita sa head office')}</Txt>
          </View>
          <Card tone="inset" style={styles.gapSm}>
            <Txt variant="bodyStrong">{office.name}</Txt>
            <Txt variant="body" color="soft">
              {office.street}, {office.city}
            </Txt>
            <Txt variant="body" color="soft">
              {t(office.hours, office.hours.replace('Mon to Fri', 'Lunes hanggang Biyernes'))}
            </Txt>
            <Button
              title={t('Get directions', 'Paano pumunta')}
              icon="directions"
              variant="secondary"
              size="md"
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${office.street}, ${office.city}`)}`)}
            />
          </Card>

          <View style={[styles.titleRow, styles.section]}>
            <Icon name="lightbulb" size={26} weight="duotone" color={colors.primaryText} />
            <Txt variant="heading">{t('Tips', 'Mga tip')}</Txt>
          </View>
          <View style={styles.gapSm}>
            <Txt variant="body" color="soft">
              {t('Make the words bigger in More, under Text size.', 'Palakihin ang mga letra sa Iba pa, sa Laki ng letra.')}
            </Txt>
            <Txt variant="body" color="soft">
              {t("Sign in with your fingerprint so you don't need to type your PIN.", 'Mag-sign in gamit ang fingerprint para hindi na mag-type ng PIN.')}
            </Txt>
            <Txt variant="body" color="soft">
              {t('Tap FIL at the top to read the app in Filipino.', 'I-tap ang EN para basahin ang app sa English.')}
            </Txt>
          </View>
        </>
      )}
    </Sheet>
  );
}

/** A plain link that opens Help: at the end of every flow and on empty and error states. */
export function HelpLink({topic}: {topic?: string}) {
  const t = useT();
  const openHelp = useUi(s => s.openHelp);
  return <Button title={t('Need help? Ask us to call you', 'Kailangan ng tulong? Tatawagan ka namin')} icon="claims" variant="ghost" block={false} size="md" onPress={() => openHelp(topic)} />;
}

const styles = StyleSheet.create({
  gap: {gap: 10},
  gapSm: {gap: 6},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  section: {marginTop: 14},
});
