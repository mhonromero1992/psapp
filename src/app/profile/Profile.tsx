import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useState} from 'react';
import {Pressable, Share, StyleSheet, TextInput, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Emblem, Ribbon, RIBBONS} from '../../components/brand/Brand';
import {Button, Card, Dialog, Divider, Icon, LangToggle, PinField, Screen, SectionHead, Sheet, SwitchRow, TextField, TextSizeControl, ThemeChoice, Txt} from '../../components/ui';
import {AGENCY_BY_CODE, OFFICE_BY_ID} from '../../data/reference';
import type {Beneficiary, Member} from '../../data/types';
import {date} from '../../lib/format';
import {useLang, useT} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {useDB} from '../../store/db';
import {useCurrentMember, useEquity} from '../../store/hooks';
import {useSession} from '../../store/session';
import {toast} from '../../store/ui';
import {HelpLink} from '../shared/Help';
import {monthYear} from '../shared/text';

const REL_FIL: Record<Beneficiary['relation'], string> = {Spouse: 'Asawa', Child: 'Anak', Parent: 'Magulang', Sibling: 'Kapatid'};

const STATUS: Record<Member['status'], {en: string; fil: string; ok: boolean}> = {
  active: {en: 'Active, covered', fil: 'Aktibo, may cover', ok: true},
  pending: {en: 'Waiting for approval', fil: 'Hinihintay ang approval', ok: false},
  lapsed: {en: 'Lapsed: contributions missed', fil: 'Lapsed: may hindi nahulugan', ok: false},
  retired: {en: 'Retired member', fil: 'Retiradong miyembro', ok: true},
};

/** Brand art on the night band: a light green that reads at 11:1 on it. */
const ON_BAND_OK = '#5fd99a';

/**
 * The membership card first (large enough to show at a branch counter), then contact details,
 * beneficiaries, signing in, privacy and how the app looks. Sign out and the demo reset close it.
 */
export default function Profile() {
  const t = useT();
  const lang = useLang();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const member = useCurrentMember();
  const equity = useEquity(member);
  const updateMember = useDB(s => s.updateMember);
  const resetDemo = useDB(s => s.resetDemo);
  const biometric = useSession(s => s.biometric);
  const setBiometric = useSession(s => s.setBiometric);
  const signOut = useSession(s => s.signOut);
  const [card, setCard] = useState(false);
  const [contact, setContact] = useState(false);
  const [shares, setShares] = useState(false);
  const [pin, setPin] = useState(false);
  const [reset, setReset] = useState(false);

  const agency = AGENCY_BY_CODE[member.agency];
  const office = OFFICE_BY_ID[member.officeId];
  const fullName = `${member.rank} ${member.firstName} ${member.middleInitial}. ${member.lastName}`;
  const status = STATUS[member.status];
  const fingerprint = Boolean(biometric[member.id]);

  const shareData = async () => {
    const data = {
      member,
      equity: equity ? {equityValue: equity.equityValue, totalContributions: equity.totalContributions, months: equity.months} : null,
      exportedAt: new Date().toISOString(),
      note: 'Sample data from the PS-ACCESS prototype.',
    };
    try {
      await Share.share({title: t('My PS-ACCESS data', 'Aking PS-ACCESS data'), message: JSON.stringify(data, null, 2)});
    } catch {
      toast(t('Sharing is not available on this phone', 'Hindi magagamit ang pag-share sa phone na ito'), 'warn', t('Visit your branch for a printed copy.', 'Bumisita sa sangay para sa printed na kopya.'));
    }
  };

  return (
    <Screen title={t('My profile', 'Aking profile')} subtitle={t('Your membership card, your details and how the app looks for you.', 'Ang iyong membership card, mga detalye at kung paano lumalabas ang app para sa iyo.')} helpTopic="Something else">
      {/* Membership card: large, so it can be shown at a branch counter. */}
      <Card tone="band" pad={20} style={styles.memberCard}>
        <View style={styles.cardTop}>
          <View style={styles.brandRow}>
            <Emblem size={38} />
            <View>
              <Txt variant="heading" color="onBand">
                PSMBFI
              </Txt>
              <Txt variant="small" color="onBandMuted">
                Members Equity Plan
              </Txt>
            </View>
          </View>
          <Ribbon stripes={RIBBONS.brand} width={44} height={14} />
        </View>
        <View style={styles.gapXs}>
          <Txt variant="display" color="onBand" accessibilityRole="header">
            {fullName}
          </Txt>
          <Txt variant="body" color="onBandMuted">
            {agency.name}
          </Txt>
        </View>
        <View>
          <Txt variant="small" color="onBandMuted">
            {t('Member ID', 'Member ID')}
          </Txt>
          <Txt variant="amountLarge" color="onBand" selectable>
            {member.id}
          </Txt>
        </View>
        <View style={styles.cardFacts}>
          <View style={styles.cardFact}>
            <Txt variant="small" color="onBandMuted">
              {t('Member since', 'Miyembro mula')}
            </Txt>
            <Txt variant="bodyStrong" color="onBand">
              {monthYear(member.joinedAt.slice(0, 7), lang)}
            </Txt>
          </View>
          <View style={styles.cardFact}>
            <Txt variant="small" color="onBandMuted">
              {t('Status', 'Status')}
            </Txt>
            <View style={styles.statusRow}>
              <Icon name={status.ok ? 'checkCircle' : 'warning'} size={20} weight="fill" color={status.ok ? ON_BAND_OK : colors.tones.warn.text} />
              <Txt variant="bodyStrong" style={[styles.flex, {color: status.ok ? ON_BAND_OK : colors.tones.warn.text}]}>
                {t(status.en, status.fil)}
              </Txt>
            </View>
          </View>
        </View>
        <Button title={t('Show my card at the counter', 'Ipakita ang card sa counter')} icon="id" variant="light" onPress={() => setCard(true)} />
      </Card>

      {/* Contact details */}
      <View style={styles.section}>
        <SectionHead title={t('Contact details', 'Contact details')} action={<Button title={t('Change', 'Palitan')} icon="pencil" variant="secondary" size="md" block={false} onPress={() => setContact(true)} />} />
        <Card pad={0}>
          <InfoRow label={t('Mobile number', 'Mobile number')} value={member.mobile} />
          <Divider />
          <InfoRow label={t('Email', 'Email')} value={member.email || t('Not given', 'Wala')} />
          <Divider />
          <InfoRow label={t('Unit', 'Unit')} value={member.unit} />
          <Divider />
          <InfoRow
            label={t('Your branch', 'Ang iyong sangay')}
            value={`${office.name}, ${office.city}`}
            onPress={() => nav.navigate('Branches')}
            hint={t('Opens the list of branches, where you can change it', 'Bubuksan ang listahan ng mga sangay, kung saan mo ito mapapalitan')}
          />
        </Card>
      </View>

      {/* Beneficiaries */}
      <View style={styles.section}>
        <SectionHead
          title={t('Your beneficiaries', 'Ang iyong mga beneficiary')}
          count={member.beneficiaries.length}
          action={member.beneficiaries.length > 1 ? <Button title={t('Change shares', 'Palitan ang hatian')} icon="users" variant="secondary" size="md" block={false} onPress={() => setShares(true)} /> : undefined}
        />
        <Card pad={0}>
          {member.beneficiaries.map((b, i) => (
            <View key={b.id}>
              {i > 0 && <Divider />}
              <View style={styles.bene}>
                <View style={styles.flex}>
                  <Txt variant="bodyStrong">{b.name}</Txt>
                  <Txt variant="small" color="soft">
                    {t(b.relation, REL_FIL[b.relation])}
                    {b.dependentCover ? ` · ${t('free insurance ₱50,000', 'libreng insurance ₱50,000')}` : ''}
                  </Txt>
                </View>
                <Txt variant="amountLarge" accessibilityLabel={t(`${b.share} percent share`, `${b.share} porsyentong hati`)}>
                  {`${b.share}%`}
                </Txt>
              </View>
            </View>
          ))}
        </Card>
        <Txt variant="small" color="soft">
          {t('To add or remove a beneficiary, visit your branch with their birth or marriage certificate.', 'Para magdagdag o mag-alis ng beneficiary, bumisita sa sangay dala ang birth o marriage certificate.')}
        </Txt>
      </View>

      {/* Signing in */}
      <View style={styles.section}>
        <SectionHead title={t('Signing in', 'Pag-sign in')} />
        <Card style={styles.gapSm}>
          <SwitchRow
            value={fingerprint}
            onChange={v => {
              setBiometric(member.id, v);
              toast(v ? t('Fingerprint sign-in is on', 'Naka-on ang fingerprint sign-in') : t('Fingerprint sign-in is off', 'Naka-off ang fingerprint sign-in'));
            }}
            icon="fingerprint"
            label={t('Sign in with my fingerprint', 'Mag-sign in gamit ang fingerprint')}
            description={t('No PIN to remember on this phone.', 'Hindi na kailangang tandaan ang PIN sa phone na ito.')}
          />
          <Divider />
          <View style={styles.pinRow}>
            <Icon name="key" size={28} weight="duotone" color={colors.primaryText} />
            <View style={styles.flex}>
              <Txt variant="bodyStrong">{t('6-number PIN', '6-numerong PIN')}</Txt>
              <Txt variant="small" color="soft">
                {t('Used when your fingerprint is not available.', 'Gamit kapag hindi magamit ang fingerprint.')}
              </Txt>
            </View>
          </View>
          <Button title={t('Change my PIN', 'Palitan ang PIN')} variant="quiet" onPress={() => setPin(true)} />
        </Card>
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <SectionHead title={t('Your privacy', 'Ang iyong privacy')} />
        <Card style={styles.gap}>
          <View style={styles.pinRow}>
            <Icon name="shield" size={28} weight="duotone" color={colors.tones.ok.text} />
            <View style={styles.flex}>
              <Txt variant="bodyStrong">{member.dpaConsentAt ? t('Data Privacy Act consent given', 'Nagbigay ng pahintulot sa Data Privacy Act') : t('Data Privacy Act consent not yet given', 'Wala pang pahintulot sa Data Privacy Act')}</Txt>
              <Txt variant="small" color="soft">
                {member.dpaConsentAt ? `${date(member.dpaConsentAt)} · ` : ''}
                {t('for membership, loans and claims', 'para sa membership, loans at claims')}
              </Txt>
            </View>
          </View>
          <Button title={t('Send a copy of my data', 'Magpadala ng kopya ng aking data')} icon="download" variant="quiet" onPress={shareData} />
        </Card>
      </View>

      {/* How the app looks: here too, because members look for it on their profile. */}
      <View style={styles.section}>
        <SectionHead title={t('How the app looks', 'Itsura ng app')} />
        <Card style={styles.gap}>
          <Txt variant="bodyStrong">{t('Text size', 'Laki ng letra')}</Txt>
          <TextSizeControl />
          <Divider />
          <View style={styles.between}>
            <Txt variant="bodyStrong">{t('Language', 'Wika')}</Txt>
            <LangToggle />
          </View>
          <Divider />
          <Txt variant="bodyStrong">{t('Screen', 'Screen')}</Txt>
          <ThemeChoice />
        </Card>
      </View>

      <View style={styles.section}>
        <HelpLink topic="Something else" />
        <Button title={t('Sign out', 'Mag-sign out')} icon="signOut" variant="quiet" onPress={signOut} />
        <Button title={t('Reset the sample data', 'I-reset ang sample data')} icon="refresh" variant="ghost" onPress={() => setReset(true)} />
      </View>

      <CardDialog open={card} onClose={() => setCard(false)} name={fullName} id={member.id} agency={agency.name} />
      <ContactSheet
        open={contact}
        onClose={() => setContact(false)}
        mobile={member.mobile}
        email={member.email}
        onSave={(mobile, email) => {
          updateMember(member.id, {mobile, email});
          toast(t('Contact details saved', 'Na-save ang contact details'));
        }}
      />
      <SharesSheet
        open={shares}
        onClose={() => setShares(false)}
        benes={member.beneficiaries}
        onSave={b => {
          updateMember(member.id, {beneficiaries: b});
          toast(t('Shares saved', 'Na-save ang hatian'));
        }}
      />
      <PinSheet open={pin} onClose={() => setPin(false)} />
      <Dialog
        open={reset}
        onClose={() => setReset(false)}
        title={t('Reset the sample data?', 'I-reset ang sample data?')}
        footer={
          <>
            <Button
              title={t('Reset now', 'I-reset na')}
              variant="negative"
              onPress={() => {
                resetDemo();
                setReset(false);
                toast(t('Sample data reset', 'Na-reset ang sample data'));
              }}
            />
            <Button title={t('Keep my changes', 'Huwag ituloy')} variant="quiet" onPress={() => setReset(false)} />
          </>
        }>
        <Txt variant="body" color="soft">
          {t('Loans, claims and requests you made in this demo will be cleared.', 'Mabubura ang mga loan, claim at request na ginawa mo sa demo.')}
        </Txt>
      </Dialog>
    </Screen>
  );
}

/** Label above, value below; with onPress the whole row opens something. */
function InfoRow({label, value, onPress, hint}: {label: string; value: string; onPress?: () => void; hint?: string}) {
  const {colors} = useTheme();
  const body = (
    <>
      <View style={styles.flex}>
        <Txt variant="small" color="soft">
          {label}
        </Txt>
        <Txt variant="bodyStrong">{value}</Txt>
      </View>
      {onPress ? <Icon name="chevron" size={18} weight="bold" color={colors.textMuted} /> : null}
    </>
  );
  if (!onPress) {return <View style={styles.info}>{body}</View>;}
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} accessibilityHint={hint} style={({pressed}) => [styles.info, pressed && {backgroundColor: colors.panel2}]}>
      {body}
    </Pressable>
  );
}

function CardDialog({open, onClose, name, id, agency}: {open: boolean; onClose: () => void; name: string; id: string; agency: string}) {
  const t = useT();
  const {colors} = useTheme();
  return (
    <Dialog open={open} onClose={onClose} title={t('Show this at the counter', 'Ipakita ito sa counter')} footer={<Button title={t('Done', 'Tapos na')} variant="quiet" onPress={onClose} />}>
      <View style={[styles.bigCard, {backgroundColor: colors.band}]}>
        <Emblem size={60} />
        <Txt variant="title" color="onBand" style={styles.center}>
          {name}
        </Txt>
        <Txt variant="body" color="onBandMuted" style={styles.center}>
          {agency}
        </Txt>
        <Txt variant="small" color="onBandMuted" style={styles.idLabel}>
          {t('Member ID', 'Member ID')}
        </Txt>
        <Txt variant="amountLarge" color="onBand" numberOfLines={1} adjustsFontSizeToFit style={styles.center}>
          {id}
        </Txt>
      </View>
      <Txt variant="body" color="soft">
        {t('Turn up your screen brightness so the officer can read it.', 'Lakasan ang liwanag ng screen para mabasa ng officer.')}
      </Txt>
    </Dialog>
  );
}

function ContactSheet({open, onClose, mobile, email, onSave}: {open: boolean; onClose: () => void; mobile: string; email: string; onSave: (m: string, e: string) => void}) {
  const t = useT();
  const [m, setM] = useState(mobile);
  const [e, setE] = useState(email);
  const [err, setErr] = useState<{m?: string; e?: string}>({});
  const [wasOpen, setWasOpen] = useState(open);
  // Start from the saved details each time the sheet opens.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setM(mobile);
      setE(email);
      setErr({});
    }
  }
  const save = () => {
    const x: typeof err = {};
    if (m.replace(/\D/g, '').length !== 11) {x.m = t('Enter an 11-digit mobile number, like 0917 123 4567.', 'Ilagay ang 11-digit na mobile number, gaya ng 0917 123 4567.');}
    if (e && !/^\S+@\S+\.\S+$/.test(e.trim())) {x.e = t('Write an email address with an @, or leave it blank.', 'Isulat ang email na may @, o iwanang blangko.');}
    setErr(x);
    if (Object.keys(x).length) {return;}
    onSave(m.trim(), e.trim());
    onClose();
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('Change contact details', 'Palitan ang contact details')}
      subtitle={t('We send codes and updates to this mobile number.', 'Dito namin ipinapadala ang mga code at update.')}
      footer={
        <>
          <Button title={t('Save', 'I-save')} onPress={save} />
          <Button title={t('Cancel', 'Kanselahin')} variant="quiet" onPress={onClose} />
        </>
      }>
      <TextField label={t('Mobile number', 'Mobile number')} value={m} onChangeText={setM} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" error={err.m} />
      <TextField label={t('Email', 'Email')} optional value={e} onChangeText={setE} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" autoCapitalize="none" autoCorrect={false} error={err.e} />
    </Sheet>
  );
}

function SharesSheet({open, onClose, benes, onSave}: {open: boolean; onClose: () => void; benes: Beneficiary[]; onSave: (b: Beneficiary[]) => void}) {
  const t = useT();
  const {colors, type} = useTheme();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setVals(Object.fromEntries(benes.map(b => [b.id, String(b.share)])));
      setErr(null);
    }
  }
  const valueOf = (b: Beneficiary) => Number(vals[b.id] ?? b.share) || 0;
  const total = benes.reduce((s, b) => s + valueOf(b), 0);
  const save = () => {
    if (total !== 100) {
      setErr(t(`The shares add up to ${total}%. Change them so they add up to 100%.`, `Ang kabuuan ay ${total}%. Baguhin para maging 100%.`));
      return;
    }
    onSave(benes.map(b => ({...b, share: valueOf(b)})));
    onClose();
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('Change shares', 'Palitan ang hatian')}
      subtitle={t('The shares must add up to 100%.', 'Ang hatian ay dapat 100%.')}
      footer={
        <>
          <Button title={t('Save shares', 'I-save ang hatian')} onPress={save} />
          <Button title={t('Cancel', 'Kanselahin')} variant="quiet" onPress={onClose} />
        </>
      }>
      {benes.map(b => (
        <View key={b.id} style={styles.shareRow}>
          <View style={styles.flex}>
            <Txt variant="bodyStrong">{b.name}</Txt>
            <Txt variant="small" color="soft">
              {t(b.relation, REL_FIL[b.relation])}
            </Txt>
          </View>
          <TextInput
            value={vals[b.id] ?? String(b.share)}
            onChangeText={v => {
              setVals({...vals, [b.id]: v.replace(/\D/g, '').slice(0, 3)});
              setErr(null);
            }}
            keyboardType="number-pad"
            maxLength={3}
            maxFontSizeMultiplier={1.4}
            accessibilityLabel={t(`Share for ${b.name}, in percent`, `Hati para kay ${b.name}, sa porsyento`)}
            style={[styles.shareInput, type.amountLarge, {color: colors.text, backgroundColor: colors.panel, borderColor: colors.lineStrong}]}
          />
          <Txt variant="bodyStrong">%</Txt>
        </View>
      ))}
      <View style={[styles.total, {backgroundColor: total === 100 ? colors.tones.ok.bg : colors.tones.warn.bg}]} accessibilityLiveRegion="polite">
        <Icon name={total === 100 ? 'checkCircle' : 'warning'} size={22} weight="fill" color={total === 100 ? colors.tones.ok.text : colors.tones.warn.text} />
        <Txt variant="bodyStrong" color={total === 100 ? 'ok' : 'warn'}>
          {t('Total', 'Kabuuan')}: {total}%
        </Txt>
      </View>
      {err ? (
        <Txt variant="smallStrong" color="bad" accessibilityRole="alert">
          {err}
        </Txt>
      ) : null}
    </Sheet>
  );
}

function PinSheet({open, onClose}: {open: boolean; onClose: () => void}) {
  const t = useT();
  const pin = useSession(s => s.pin);
  const setPin = useSession(s => s.setPin);
  const [cur, setCur] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState<{cur?: string; p1?: string; p2?: string}>({});
  const close = () => {
    setCur('');
    setP1('');
    setP2('');
    setErr({});
    onClose();
  };
  const save = () => {
    if (cur !== pin) {return setErr({cur: t('Your current PIN is not right.', 'Mali ang kasalukuyang PIN.')});}
    if (!/^\d{6}$/.test(p1)) {return setErr({p1: t('Your new PIN needs exactly 6 numbers.', 'Ang bagong PIN ay dapat may 6 na numero.')});}
    if (/^(\d)\1{5}$/.test(p1) || p1 === '123456' || p1 === '654321') {return setErr({p1: t('Choose a PIN that is harder to guess than repeated or counting numbers.', 'Pumili ng PIN na hindi madaling hulaan.')});}
    if (p1 !== p2) {return setErr({p2: t('The two new PINs are not the same.', 'Hindi magkapareho ang dalawang bagong PIN.')});}
    setPin(p1);
    close();
    toast(t('Your PIN is changed', 'Napalitan na ang PIN'));
  };
  return (
    <Sheet
      open={open}
      onClose={close}
      title={t('Change my PIN', 'Palitan ang PIN')}
      subtitle={t('Six numbers that are easy for you to remember and hard for others to guess.', 'Anim na numero na madali mong maaalala at mahirap hulaan ng iba.')}
      footer={
        <>
          <Button title={t('Save my new PIN', 'I-save ang bagong PIN')} onPress={save} />
          <Button title={t('Cancel', 'Kanselahin')} variant="quiet" onPress={close} />
        </>
      }>
      <PinField label={t('Current PIN', 'Kasalukuyang PIN')} value={cur} onChange={setCur} error={err.cur} />
      <PinField label={t('New 6-number PIN', 'Bagong 6-numerong PIN')} value={p1} onChange={setP1} error={err.p1} />
      <PinField label={t('Type the new PIN again', 'I-type muli ang bagong PIN')} value={p2} onChange={setP2} error={err.p2} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  center: {textAlign: 'center'},
  section: {marginTop: 28, gap: 10},
  gap: {gap: 14},
  gapSm: {gap: 8},
  gapXs: {gap: 4},
  memberCard: {gap: 18, overflow: 'hidden'},
  cardTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  brandRow: {flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1},
  cardFacts: {flexDirection: 'row', flexWrap: 'wrap', gap: 16},
  cardFact: {flexGrow: 1, flexBasis: 130, gap: 2},
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  info: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 16, paddingVertical: 12},
  bene: {flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 68, paddingHorizontal: 16, paddingVertical: 12},
  pinRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 14},
  between: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  bigCard: {borderRadius: 18, paddingVertical: 24, paddingHorizontal: 18, alignItems: 'center', gap: 6},
  idLabel: {marginTop: 14},
  shareRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  shareInput: {width: 88, minHeight: 56, borderWidth: 1.5, borderRadius: 14, textAlign: 'center', paddingVertical: 8},
  total: {flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14},
});
