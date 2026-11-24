import {useNavigation, useRoute, type NavigationAction, type RouteProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AccessibilityInfo, ScrollView, StyleSheet, View, type LayoutChangeEvent} from 'react-native';
import {useTheme} from 'styled-components/native';
import {BladeMark, Lockup} from '../../components/brand/Brand';
import {Button, Card, Checkbox, DateField, Dialog, FieldFrame, Icon, money, MoneyField, PhotoPicker, ProgressBar, RadioCards, Screen, SelectField, SignaturePad, StepHeader, TextField, Txt, type Photo} from '../../components/ui';
import {AGENCIES, AGENCY_BY_CODE, MEP_RATE, RANKS} from '../../data/reference';
import type {AgencyCode} from '../../data/types';
import {useT} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {useDB} from '../../store/db';
import {HelpLink} from '../shared/Help';
import {nowMs} from '../shared/text';

type Relation = 'Spouse' | 'Child' | 'Parent' | 'Sibling';
interface Bene {
  key: string;
  name: string;
  relation: Relation | '';
  birthDate: string;
  share: string;
}
const RELATIONS: [Relation, string][] = [
  ['Spouse', 'Asawa'],
  ['Child', 'Anak'],
  ['Parent', 'Magulang'],
  ['Sibling', 'Kapatid'],
];
const relFil = (r: Relation | '') => RELATIONS.find(x => x[0] === r)?.[1];
const ID_TYPES = [
  ['agency', 'Agency ID (PNP, BFP, PCG and others)', 'ID ng ahensya (PNP, BFP, PCG at iba pa)'],
  ['philsys', 'PhilSys National ID', 'PhilSys National ID'],
  ['umid', 'UMID', 'UMID'],
  ['drivers', "Driver's license", "Driver's license"],
] as const;
type IdType = (typeof ID_TYPES)[number][0];

const TOTAL = 5;
const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const YEAR = new Date(nowMs()).getFullYear();
const ageOn = (iso: string) => (nowMs() - new Date(`${iso}T00:00:00`).getTime()) / (365.25 * 86400000);

/**
 * Digital enrolment in the Members Equity Plan (MEP): the membership application (MAF) and the
 * Authority to Deduct (ATD) signed on the phone, with an ID check against a selfie. One decision
 * per step, Back and Continue always at the bottom, answers kept when going back.
 */
export default function Enrol() {
  const t = useT();
  const {colors, scale} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Enrol'>>();
  const submitEnrolment = useDB(s => s.submitEnrolment);
  const initialAgency = (AGENCIES.find(a => a.code === route.params?.agency)?.code ?? '') as AgencyCode | '';

  // Scrolling: back to the top on a new step; down to the first problem on Continue.
  const scrollRef = useRef<ScrollView>(null);
  const formY = useRef(0);
  const ys = useRef<Record<string, number>>({});
  const at = (k: string) => (e: LayoutChangeEvent) => {
    ys.current[k] = e.nativeEvent.layout.y;
  };

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Step 1: about you
  const [agency, setAgency] = useState<AgencyCode | ''>(initialAgency);
  const [rank, setRank] = useState('');
  const [first, setFirst] = useState('');
  const [mi, setMi] = useState('');
  const [last, setLast] = useState('');
  const [birth, setBirth] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  // Step 2: pay and deduction
  const [unit, setUnit] = useState('');
  const [pay, setPay] = useState<number | ''>('');
  // Step 3: ID check
  const [idType, setIdType] = useState<IdType | ''>('');
  const [idPhoto, setIdPhoto] = useState<Photo[]>([]);
  const [selfie, setSelfie] = useState<Photo[]>([]);
  const [check, setCheck] = useState<'idle' | 'checking' | 'done'>('idle');
  // Step 4: beneficiaries
  const [benes, setBenes] = useState<Bene[]>([{key: 'b1', name: '', relation: '', birthDate: '', share: '100'}]);
  const [dfi, setDfi] = useState('b1');
  // Step 5: review and sign
  const [agreeMaf, setAgreeMaf] = useState(false);
  const [agreeAtd, setAgreeAtd] = useState(false);
  const [agreeDpa, setAgreeDpa] = useState(false);
  const [signed, setSigned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  // Leaving with answers filled in asks first.
  const [leaveOpen, setLeaveOpen] = useState(false);
  const leaving = useRef(false);
  const pending = useRef<NavigationAction | null>(null);

  const steps = [t('About you', 'Tungkol sa iyo'), t('Pay and deduction', 'Sahod at deduction'), t('Check your ID', 'Suriin ang ID'), t('Beneficiaries', 'Mga beneficiary'), t('Review and sign', 'Suriin at pumirma')];
  const ranksFor = (a: AgencyCode | '') => (a ? [...RANKS[a].ranks.map(([r]) => ({value: r, label: r})), ...RANKS[a].civilian.map(([r]) => ({value: r, label: r, description: t('Civilian staff', 'Sibilyang kawani')}))] : []);
  const contribution = typeof pay === 'number' ? Math.round(pay * MEP_RATE * 100) / 100 : 0;
  const shareTotal = benes.reduce((s, b) => s + (Number(b.share) || 0), 0);
  const dirty = Boolean(rank || first || last || mobile || unit || pay !== '' || idPhoto.length || selfie.length || benes.some(b => b.name));
  const idLabel = useMemo(() => ID_TYPES.find(x => x[0] === idType), [idType]);

  const clear = (k: string) => setErrors(e => (e[k] ? Object.fromEntries(Object.entries(e).filter(([key]) => key !== k)) : e));
  /** A field's change handler that also clears its error. */
  const edit =
    <T,>(set: (v: T) => void, k: string) =>
    (v: T) => {
      set(v);
      clear(k);
    };

  const go = useCallback((n: number) => {
    setErrors({});
    setStep(n);
    scrollRef.current?.scrollTo({y: 0, animated: false});
  }, []);

  // Android back and the iOS swipe: a step back inside the flow, and a question before leaving it.
  useEffect(
    () =>
      nav.addListener('beforeRemove', e => {
        if (done || leaving.current) {return;}
        if (step > 0) {
          e.preventDefault();
          go(step - 1);
          return;
        }
        if (!dirty) {return;}
        e.preventDefault();
        pending.current = e.data.action;
        setLeaveOpen(true);
      }),
    [nav, step, done, dirty, go],
  );

  const cancel = () => {
    if (!dirty) {
      leaving.current = true;
      nav.goBack();
      return;
    }
    pending.current = null;
    setLeaveOpen(true);
  };
  const leave = () => {
    leaving.current = true;
    setLeaveOpen(false);
    if (pending.current) {nav.dispatch(pending.current);}
    else {nav.goBack();}
  };

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!agency) {e.agency = t('Choose your agency.', 'Piliin ang iyong ahensya.');}
      if (!rank) {e.rank = t('Choose your rank or position.', 'Piliin ang iyong ranggo o posisyon.');}
      if (first.trim().length < 2) {e.first = t('Enter your first name.', 'Ilagay ang iyong pangalan.');}
      if (last.trim().length < 2) {e.last = t('Enter your last name.', 'Ilagay ang iyong apelyido.');}
      if (!FULL_DATE.test(birth)) {e.birth = t('Choose the month, day and year you were born.', 'Piliin ang buwan, araw at taon ng iyong kapanganakan.');}
      else {
        const age = ageOn(birth);
        if (age < 18 || age > 70) {e.birth = t('Check the year. Members are 18 to 70 years old.', 'Suriin ang taon. Ang miyembro ay 18 hanggang 70 taong gulang.');}
      }
      if (mobile.replace(/\D/g, '').length !== 11) {e.mobile = t('Enter an 11-digit mobile number, like 0917 123 4567.', 'Ilagay ang 11-digit na mobile number, gaya ng 0917 123 4567.');}
      if (email && !/^\S+@\S+\.\S+$/.test(email.trim())) {e.email = t('Write an email address with an @, or leave it blank.', 'Isulat ang email na may @, o iwanang blangko.');}
    }
    if (s === 1) {
      if (unit.trim().length < 3) {e.unit = t('Enter your unit or office.', 'Ilagay ang iyong unit o opisina.');}
      if (typeof pay !== 'number' || pay < 10000 || pay > 200000) {e.pay = t('Enter your monthly base pay, from ₱10,000 to ₱200,000. It is on your payslip.', 'Ilagay ang buwanang base pay, mula ₱10,000 hanggang ₱200,000. Nasa payslip mo ito.');}
    }
    if (s === 2) {
      if (!idType) {e.idType = t('Choose the ID you will use.', 'Piliin ang ID na gagamitin.');}
      if (idPhoto.length === 0) {e.idPhoto = t('Add a photo of the front of your ID.', 'Magdagdag ng litrato ng harap ng iyong ID.');}
      if (selfie.length === 0) {e.selfie = t('Add a photo of your face.', 'Magdagdag ng litrato ng iyong mukha.');}
      if (!e.idType && !e.idPhoto && !e.selfie && check !== 'done') {e.check = t('Tap Check my ID to compare the two photos.', 'I-tap ang Suriin ang aking ID para ikumpara ang dalawang litrato.');}
    }
    if (s === 3) {
      benes.forEach(b => {
        if (b.name.trim().length < 3) {e[`${b.key}-name`] = t('Enter the full name.', 'Ilagay ang buong pangalan.');}
        if (!b.relation) {e[`${b.key}-relation`] = t('Choose the relationship.', 'Piliin ang relasyon.');}
        if (!FULL_DATE.test(b.birthDate)) {e[`${b.key}-birth`] = t('Choose the month, day and year of birth.', 'Piliin ang buwan, araw at taon ng kapanganakan.');}
      });
      if (shareTotal !== 100) {e.shares = t(`The shares add up to ${shareTotal}%. They must add up to 100%.`, `Ang kabuuan ay ${shareTotal}%. Dapat ay 100%.`);}
    }
    if (s === 4) {
      if (!agreeMaf || !agreeAtd || !agreeDpa) {e.agree = t('Tick all three boxes to continue.', 'Lagyan ng tsek ang tatlong kahon para magpatuloy.');}
      if (!signed) {e.signature = t('Sign inside the box with your finger.', 'Pumirma sa loob ng kahon gamit ang daliri.');}
    }
    setErrors(e);
    const keys = Object.keys(e);
    if (keys.length === 0) {return true;}
    const y = ys.current[keys[0]] ?? ys.current[keys[0].split('-')[0]] ?? 0;
    scrollRef.current?.scrollTo({y: Math.max(0, formY.current + y - 12), animated: true});
    AccessibilityInfo.announceForAccessibility(
      keys.length === 1 ? t(`One answer needs fixing: ${e[keys[0]]}`, `May isang sagot na kailangang ayusin: ${e[keys[0]]}`) : t(`${keys.length} answers need fixing. The first: ${e[keys[0]]}`, `${keys.length} sagot ang kailangang ayusin. Ang una: ${e[keys[0]]}`),
    );
    return false;
  };

  const next = () => {
    if (!validate(step)) {return;}
    if (step < TOTAL - 1) {
      go(step + 1);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const res = submitEnrolment({
        firstName: first.trim(),
        middleInitial: mi.trim().slice(0, 1).toUpperCase(),
        lastName: last.trim(),
        rank,
        agency: agency as AgencyCode,
        unit: unit.trim(),
        basePay: pay as number,
        mobile: mobile.trim(),
        email: email.trim(),
        idType: idLabel?.[1] ?? idType,
        beneficiaries: benes.length,
        via: 'Member App',
      });
      setBusy(false);
      setDone(res.id);
      scrollRef.current?.scrollTo({y: 0, animated: false});
    }, 900);
  };

  const runCheck = () => {
    const e: Record<string, string> = {};
    if (!idType) {e.idType = t('Choose the ID you will use.', 'Piliin ang ID na gagamitin.');}
    if (idPhoto.length === 0) {e.idPhoto = t('Add a photo of the front of your ID.', 'Magdagdag ng litrato ng harap ng iyong ID.');}
    if (selfie.length === 0) {e.selfie = t('Add a photo of your face.', 'Magdagdag ng litrato ng iyong mukha.');}
    setErrors(e);
    if (Object.keys(e).length) {return;}
    setCheck('checking');
    setTimeout(() => {
      setCheck('done');
      AccessibilityInfo.announceForAccessibility(t('Your ID and photo match', 'Tugma ang ID at litrato'));
    }, 1800);
  };

  const setBene = (key: string, patch: Partial<Bene>) => setBenes(bs => bs.map(x => (x.key === key ? {...x, ...patch} : x)));

  if (done) {return <Success refNo={done} name={first.trim()} agency={agency as AgencyCode} contribution={contribution} />;}

  return (
    <Screen
      scrollRef={scrollRef}
      onCancel={cancel}
      helpTopic="Something else"
      footer={
        <View style={styles.footRow}>
          {step > 0 ? <Button title={t('Back', 'Bumalik')} icon={scale > 1 ? undefined : 'back'} variant="quiet" onPress={() => go(step - 1)} style={styles.footBack} /> : null}
          <Button
            title={step < TOTAL - 1 ? t('Continue', 'Magpatuloy') : t('Sign and send', 'Pumirma at ipadala')}
            iconRight={step < TOTAL - 1 ? 'forward' : undefined}
            icon={step === TOTAL - 1 ? 'check' : undefined}
            busy={busy}
            onPress={next}
            style={styles.footNext}
            testID="enrol-next"
          />
        </View>
      }>
      <StepHeader step={step} total={TOTAL} title={steps[step]} />

      {step === 0 && (
        <>
          <StepTitle title={t('Tell us about yourself', 'Sabihin sa amin ang tungkol sa iyo')} lead={t('This is your Membership Application Form (MAF). Write your name as it is on your agency ID.', 'Ito ang iyong Membership Application Form (MAF). Isulat ang pangalan gaya ng nasa ID ng ahensya.')} />
          <View style={styles.form} onLayout={e => (formY.current = e.nativeEvent.layout.y)}>
            <View onLayout={at('agency')}>
              <SelectField
                label={t('Your agency', 'Ang iyong ahensya')}
                value={agency}
                placeholder={t('Choose your agency', 'Piliin ang ahensya')}
                options={AGENCIES.map(a => ({value: a.code, label: a.name, description: a.code}))}
                onChange={v => {
                  setAgency(v);
                  clear('agency');
                  if (rank && !ranksFor(v).some(r => r.value === rank)) {setRank('');}
                }}
                error={errors.agency}
              />
            </View>
            <View onLayout={at('rank')}>
              {agency ? (
                <SelectField
                  label={t('Rank or position', 'Ranggo o posisyon')}
                  value={rank}
                  placeholder={t('Choose your rank or position', 'Piliin ang ranggo o posisyon')}
                  options={ranksFor(agency)}
                  onChange={v => {
                    setRank(v);
                    clear('rank');
                  }}
                  error={errors.rank}
                />
              ) : (
                <FieldFrame label={t('Rank or position', 'Ranggo o posisyon')} error={errors.rank}>
                  <View style={[styles.disabled, {backgroundColor: colors.panel2, borderColor: colors.line}]}>
                    <Txt variant="body" color="muted">
                      {t('Choose your agency first', 'Piliin muna ang ahensya')}
                    </Txt>
                  </View>
                </FieldFrame>
              )}
            </View>
            <View onLayout={at('first')}>
              <TextField label={t('First name', 'Pangalan')} value={first} onChangeText={edit(setFirst, 'first')} error={errors.first} autoCapitalize="words" autoComplete="name-given" textContentType="givenName" />
            </View>
            <View onLayout={at('mi')}>
              <TextField label={t('Middle initial', 'Gitnang inisyal')} optional value={mi} onChangeText={v => setMi(v.slice(0, 2))} autoCapitalize="characters" maxLength={2} autoComplete="name-middle" textContentType="middleName" />
            </View>
            <View onLayout={at('last')}>
              <TextField label={t('Last name', 'Apelyido')} value={last} onChangeText={edit(setLast, 'last')} error={errors.last} autoCapitalize="words" autoComplete="name-family" textContentType="familyName" />
            </View>
            <View onLayout={at('birth')}>
              <DateField label={t('Date of birth', 'Kaarawan')} value={birth} onChange={edit(setBirth, 'birth')} error={errors.birth} fromYear={YEAR - 70} toYear={YEAR - 18} />
            </View>
            <View onLayout={at('mobile')}>
              <TextField label={t('Mobile number', 'Mobile number')} hint="0917 123 4567" value={mobile} onChangeText={edit(setMobile, 'mobile')} error={errors.mobile} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
            </View>
            <View onLayout={at('email')}>
              <TextField label={t('Email', 'Email')} optional value={email} onChangeText={edit(setEmail, 'email')} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" />
            </View>
          </View>
        </>
      )}

      {step === 1 && (
        <>
          <StepTitle
            title={t('Your pay and monthly deduction', 'Ang iyong sahod at buwanang deduction')}
            lead={t(
              'Your payroll office deducts 3% of your base pay every month. This is the Authority to Deduct (ATD), your salary deduction. It pays for your insurance and builds your Equity Value.',
              'Ibinabawas ng payroll office ang 3% ng iyong base pay bawat buwan. Ito ang Authority to Deduct (ATD), ang salary deduction mo. Ito ang bayad sa insurance mo at nag-iipon ng iyong Equity Value.',
            )}
          />
          <View style={styles.form} onLayout={e => (formY.current = e.nativeEvent.layout.y)}>
            <View onLayout={at('unit')}>
              <TextField
                label={t('Unit or office', 'Unit o opisina')}
                hint={agency ? t(`For example: ${RANKS[agency].units[0]}`, `Halimbawa: ${RANKS[agency].units[0]}`) : undefined}
                value={unit}
                onChangeText={edit(setUnit, 'unit')}
                error={errors.unit}
                autoCapitalize="words"
              />
            </View>
            <View onLayout={at('pay')}>
              <MoneyField label={t('Monthly base pay', 'Buwanang base pay')} hint={t('Use the base pay on your latest payslip, before deductions.', 'Gamitin ang base pay sa pinakabagong payslip, bago ang mga deduction.')} value={pay} onChange={edit(setPay, 'pay')} error={errors.pay} />
            </View>
            <Card tone="band" pad={20} style={styles.gapSm}>
              <Txt variant="small" color="onBandMuted">
                {t('Your monthly contribution (3%)', 'Ang iyong buwanang kontribusyon (3%)')}
              </Txt>
              <Txt variant="figure" color="onBand" accessibilityLiveRegion="polite">
                {money(contribution)}
              </Txt>
              <Txt variant="body" color="onBandMuted">
                {agency
                  ? t(`Deducted by the ${AGENCY_BY_CODE[agency].payrollOffice} from your salary. You don't need to pay at an office.`, `Ibabawas ng ${AGENCY_BY_CODE[agency].payrollOffice} sa iyong sahod. Hindi mo na kailangang magbayad sa opisina.`)
                  : t('Deducted from your salary by your payroll office.', 'Ibabawas sa iyong sahod ng payroll office.')}
              </Txt>
            </Card>
            <View style={styles.gapSm}>
              <Txt variant="heading">{t('What your contribution gives you', 'Ang makukuha mo sa kontribusyon')}</Txt>
              {[
                [t('Life insurance', 'Life insurance'), t('For your family if you pass away', 'Para sa pamilya kung ikaw ay pumanaw')],
                [t('Hospital cash', 'Pera sa pagka-ospital'), t('A daily amount when you are confined', 'Araw-araw na halaga kapag naka-confine')],
                [t('Equity Value', 'Equity Value'), t('Savings that grow and you can borrow against', 'Ipon na lumalaki at puwedeng utangan')],
                [t('Loans', 'Loans'), t('Six loan products for members', 'Anim na uri ng loan para sa miyembro')],
              ].map(([a, b]) => (
                <Card key={a} pad={14} style={styles.benefit}>
                  <Icon name="checkCircle" size={24} weight="fill" color={colors.tones.ok.text} />
                  <View style={styles.flex}>
                    <Txt variant="bodyStrong">{a}</Txt>
                    <Txt variant="small" color="soft">
                      {b}
                    </Txt>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        </>
      )}

      {step === 2 && (
        <>
          <StepTitle
            title={t('Check your ID', 'Suriin ang iyong ID')}
            lead={t('Take a photo of your ID, then a photo of your face. We compare them so no one else can enrol in your name.', 'Kunan ng litrato ang ID, at ang iyong mukha. Ikukumpara namin para walang ibang makapag-enrol sa pangalan mo.')}
          />
          <View style={styles.form} onLayout={e => (formY.current = e.nativeEvent.layout.y)}>
            <View onLayout={at('idType')} style={styles.gapSm}>
              <Txt variant="label">{t('Which ID will you use?', 'Anong ID ang gagamitin mo?')}</Txt>
              <RadioCards
                label={t('ID type', 'Uri ng ID')}
                value={idType}
                onChange={v => {
                  setIdType(v);
                  clear('idType');
                }}
                options={ID_TYPES.map(([v, en, fil]) => ({value: v, label: t(en, fil), icon: 'id' as const}))}
              />
              <ErrorLine text={errors.idType} />
            </View>
            <View onLayout={at('idPhoto')} style={styles.gapSm}>
              <PhotoPicker
                label={t('Front of your ID', 'Harap ng iyong ID')}
                hint={t('Lay it flat in good light. All four corners must show.', 'Ilapag sa maliwanag. Dapat kita ang apat na sulok.')}
                photos={idPhoto}
                max={1}
                onChange={p => {
                  setIdPhoto(p);
                  setCheck('idle');
                  clear('idPhoto');
                }}
              />
              <ErrorLine text={errors.idPhoto} />
            </View>
            <View onLayout={at('selfie')} style={styles.gapSm}>
              <PhotoPicker
                label={t('A photo of your face', 'Litrato ng iyong mukha')}
                hint={t('Face the camera. Remove your cap and sunglasses.', 'Humarap sa camera. Tanggalin ang sumbrero at sunglasses.')}
                photos={selfie}
                max={1}
                selfie
                onChange={p => {
                  setSelfie(p);
                  setCheck('idle');
                  clear('selfie');
                }}
              />
              <ErrorLine text={errors.selfie} />
            </View>
            <View onLayout={at('check')}>
              <Card style={styles.gapSm}>
                {check === 'done' ? (
                  <View style={styles.rowTop} accessibilityLiveRegion="polite">
                    <Icon name="shield" size={32} weight="fill" color={colors.tones.ok.text} />
                    <View style={styles.flex}>
                      <Txt variant="heading">{t('Your ID and photo match', 'Tugma ang ID at litrato')}</Txt>
                      <Txt variant="body" color="soft">
                        {t('Match score 94%. A PSMBFI officer will also review it.', 'Match score 94%. Susuriin din ito ng isang PSMBFI officer.')}
                      </Txt>
                    </View>
                  </View>
                ) : check === 'checking' ? (
                  <View style={styles.gapSm} accessibilityLiveRegion="polite">
                    <View style={styles.row}>
                      <Icon name="userFocus" size={24} weight="duotone" color={colors.primaryText} />
                      <Txt variant="bodyStrong" style={styles.flex}>
                        {t('Comparing your photos', 'Ikinukumpara ang mga litrato')}
                      </Txt>
                    </View>
                    <ProgressBar value={0.7} label={t('Checking', 'Sinusuri')} />
                  </View>
                ) : (
                  <>
                    <Button title={t('Check my ID', 'Suriin ang aking ID')} icon="userFocus" variant="secondary" onPress={runCheck} />
                    <ErrorLine text={errors.check} />
                  </>
                )}
              </Card>
            </View>
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <StepTitle
            title={t('Who receives your benefits?', 'Sino ang tatanggap ng iyong benepisyo?')}
            lead={t('Add the people who will receive your insurance if something happens to you. Their shares must add up to 100%.', 'Idagdag ang mga taong tatanggap ng insurance kapag may nangyari sa iyo. Ang hatian ay dapat 100%.')}
          />
          <View style={styles.form} onLayout={e => (formY.current = e.nativeEvent.layout.y)}>
            {benes.map((b, i) => (
              <View key={b.key} onLayout={at(b.key)}>
                <Card style={styles.gap}>
                  <View style={styles.between}>
                    <Txt variant="title" style={styles.flex}>
                      {t(`Beneficiary ${i + 1}`, `Beneficiary ${i + 1}`)}
                    </Txt>
                    {benes.length > 1 ? (
                      <Button
                        title={t('Remove', 'Alisin')}
                        icon="trash"
                        variant="ghost"
                        size="md"
                        block={false}
                        onPress={() => {
                          const rest = benes.filter(x => x.key !== b.key);
                          setBenes(rest);
                          if (dfi === b.key) {setDfi(rest[0].key);}
                        }}
                      />
                    ) : null}
                  </View>
                  <TextField label={t('Full name', 'Buong pangalan')} value={b.name} onChangeText={v => {
                      setBene(b.key, {name: v});
                      clear(`${b.key}-name`);
                    }} error={errors[`${b.key}-name`]} autoCapitalize="words" />
                  <SelectField
                    label={t('Relationship', 'Relasyon')}
                    value={b.relation}
                    placeholder={t('Choose', 'Pumili')}
                    options={RELATIONS.map(([en, fil]) => ({value: en, label: t(en, fil)}))}
                    onChange={v => {
                      setBene(b.key, {relation: v});
                      clear(`${b.key}-relation`);
                    }}
                    error={errors[`${b.key}-relation`]}
                  />
                  <DateField label={t('Date of birth', 'Kaarawan')} value={b.birthDate} onChange={v => {
                      setBene(b.key, {birthDate: v});
                      clear(`${b.key}-birth`);
                    }} error={errors[`${b.key}-birth`]} fromYear={YEAR - 100} toYear={YEAR} />
                  <TextField label={t('Share (%)', 'Hati (%)')} value={b.share} onChangeText={v => {
                      setBene(b.key, {share: v.replace(/\D/g, '').slice(0, 3)});
                      clear('shares');
                    }} keyboardType="number-pad" maxLength={3} />
                </Card>
              </View>
            ))}
            <View onLayout={at('shares')} style={styles.gapSm}>
              <View style={[styles.total, {backgroundColor: shareTotal === 100 ? colors.tones.ok.bg : colors.tones.warn.bg}]} accessibilityLiveRegion="polite">
                <Icon name={shareTotal === 100 ? 'checkCircle' : 'warning'} size={22} weight="fill" color={shareTotal === 100 ? colors.tones.ok.text : colors.tones.warn.text} />
                <Txt variant="bodyStrong" color={shareTotal === 100 ? 'ok' : 'warn'} style={styles.flex}>
                  {t('Total share', 'Kabuuang hati')}: {shareTotal}% {shareTotal === 100 ? t('(complete)', '(kumpleto)') : t('(must be 100%)', '(dapat 100%)')}
                </Txt>
              </View>
              <ErrorLine text={errors.shares} />
              {benes.length < 4 ? (
                <Button
                  title={t('Add another person', 'Magdagdag ng isa pa')}
                  icon="plus"
                  variant="secondary"
                  onPress={() => setBenes(bs => [...bs, {key: `b${Date.now()}`, name: '', relation: '', birthDate: '', share: '0'}])}
                />
              ) : null}
            </View>
            <View style={styles.gapSm}>
              <Txt variant="heading">{t("Dependent's free insurance (₱50,000)", 'Libreng insurance ng dependent (₱50,000)')}</Txt>
              <Txt variant="body" color="soft">
                {t('Choose one person to be covered at no extra cost.', 'Pumili ng isang taong masasakop nang walang dagdag na bayad.')}
              </Txt>
              <RadioCards
                label={t("Dependent's free insurance", 'Libreng insurance ng dependent')}
                value={dfi}
                onChange={setDfi}
                options={benes.map((b, i) => ({value: b.key, label: b.name.trim() || t(`Beneficiary ${i + 1}`, `Beneficiary ${i + 1}`), description: b.relation ? t(b.relation, relFil(b.relation)) : undefined}))}
              />
            </View>
          </View>
        </>
      )}

      {step === 4 && (
        <>
          <StepTitle title={t('Review and sign', 'Suriin at pumirma')} lead={t('Check your details. Tap Change to fix anything.', 'Suriin ang mga detalye. I-tap ang Palitan para ayusin.')} />
          <View style={styles.form} onLayout={e => (formY.current = e.nativeEvent.layout.y)}>
            <Summary
              title={t('About you', 'Tungkol sa iyo')}
              onEdit={() => go(0)}
              rows={[
                [t('Name', 'Pangalan'), `${rank} ${first.trim()} ${mi ? `${mi.trim().slice(0, 1).toUpperCase()}. ` : ''}${last.trim()}`],
                [t('Agency', 'Ahensya'), agency ? AGENCY_BY_CODE[agency].name : ''],
                [t('Mobile number', 'Mobile number'), mobile],
              ]}
            />
            <Summary
              title={t('Pay and deduction', 'Sahod at deduction')}
              onEdit={() => go(1)}
              rows={[
                [t('Unit', 'Unit'), unit],
                [t('Base pay', 'Base pay'), typeof pay === 'number' ? money(pay) : ''],
                [t('Monthly contribution', 'Buwanang kontribusyon'), money(contribution)],
              ]}
            />
            <Summary
              title={t('ID check', 'Pagsuri ng ID')}
              onEdit={() => go(2)}
              rows={[
                [t('ID', 'ID'), idLabel ? t(idLabel[1], idLabel[2]) : ''],
                [t('Result', 'Resulta'), t('Match 94%', 'Tugma 94%')],
              ]}
            />
            <Summary
              title={t('Beneficiaries', 'Mga beneficiary')}
              onEdit={() => go(3)}
              rows={benes.map(b => [`${t(b.relation, relFil(b.relation))} · ${b.share}%${dfi === b.key ? ` · ${t('free insurance', 'libreng insurance')}` : ''}`, b.name])}
            />
            <View onLayout={at('agree')}>
              <Card style={styles.gapXs}>
                <Checkbox checked={agreeMaf} onChange={edit(setAgreeMaf, 'agree')} label={t('I apply for membership in the PSMBFI Members Equity Plan (MEP).', 'Nag-aapply ako ng membership sa PSMBFI Members Equity Plan (MEP).')} />
                <Checkbox
                  checked={agreeAtd}
                  onChange={edit(setAgreeAtd, 'agree')}
                  label={t(`I allow my payroll office to deduct 3% of my base pay (${money(contribution)}) every month.`, `Pinapayagan ko ang payroll office na ibawas ang 3% ng aking base pay (${money(contribution)}) bawat buwan.`)}
                />
                <Checkbox
                  checked={agreeDpa}
                  onChange={edit(setAgreeDpa, 'agree')}
                  label={t('I agree that PSMBFI may process my personal data for membership, loans and claims under the Data Privacy Act.', 'Pumapayag ako na gamitin ng PSMBFI ang aking personal na data para sa membership, loans at claims ayon sa Data Privacy Act.')}
                  description={t('You can withdraw this later in My profile.', 'Maaari mo itong bawiin sa Aking profile.')}
                />
                <ErrorLine text={errors.agree} />
              </Card>
            </View>
            <View onLayout={at('signature')} style={styles.gapSm}>
              <Txt variant="label">{t('Your signature', 'Ang iyong pirma')}</Txt>
              <SignaturePad onChange={v => {
                  setSigned(v);
                  if (v) {clear('signature');}
                }} label={t('Sign inside the box with your finger', 'Pumirma sa loob ng kahon gamit ang daliri')} />
              <ErrorLine text={errors.signature} />
            </View>
          </View>
        </>
      )}

      <View style={styles.help}>
        <HelpLink topic="Something else" />
      </View>

      <Dialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title={t('Leave your enrolment?', 'Iiwan ang enrolment?')}
        footer={
          <>
            <Button title={t('Keep going', 'Ituloy ang enrolment')} onPress={() => setLeaveOpen(false)} />
            <Button title={t('Leave and clear my answers', 'Umalis at burahin ang sagot')} variant="quiet" onPress={leave} />
          </>
        }>
        <Txt variant="body" color="soft">
          {t('Your answers are not saved yet. If you leave now, you will start again next time.', 'Hindi pa naka-save ang iyong mga sagot. Kung aalis ka ngayon, magsisimula ka ulit sa susunod.')}
        </Txt>
      </Dialog>
    </Screen>
  );
}

function StepTitle({title, lead}: {title: string; lead: string}) {
  return (
    <View style={styles.stepTitle}>
      <Txt variant="display" accessibilityRole="header">
        {title}
      </Txt>
      <Txt variant="body" color="soft">
        {lead}
      </Txt>
    </View>
  );
}

function ErrorLine({text}: {text?: string}) {
  const {colors} = useTheme();
  if (!text) {return null;}
  return (
    <View style={styles.row} accessibilityRole="alert">
      <Icon name="warning" size={18} weight="fill" color={colors.tones.bad.text} />
      <Txt variant="smallStrong" color="bad" style={styles.flex}>
        {text}
      </Txt>
    </View>
  );
}

function Summary({title, rows, onEdit}: {title: string; rows: string[][]; onEdit: () => void}) {
  const t = useT();
  return (
    <Card style={styles.gapSm}>
      <View style={styles.between}>
        <Txt variant="heading" style={styles.flex}>
          {title}
        </Txt>
        <Button title={t('Change', 'Palitan')} icon="pencil" variant="ghost" size="md" block={false} onPress={onEdit} accessibilityHint={t(`Goes back to ${title}`, `Babalik sa ${title}`)} />
      </View>
      {rows.map(([k, v], i) => (
        <View key={`${k}-${i}`} style={styles.sumRow}>
          <Txt variant="small" color="soft">
            {k}
          </Txt>
          <Txt variant="bodyStrong">{v}</Txt>
        </View>
      ))}
    </Card>
  );
}

function Success({refNo, name, agency, contribution}: {refNo: string; name: string; agency: AgencyCode; contribution: number}) {
  const t = useT();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const steps = [
    [t('Within 3 working days', 'Sa loob ng 3 araw ng trabaho'), t('PSMBFI checks your documents and sends your member ID number by SMS.', 'Susuriin ng PSMBFI ang iyong dokumento at ipapadala ang member ID sa SMS.')],
    [t('Within 5 working days', 'Sa loob ng 5 araw ng trabaho'), t(`The ${AGENCY_BY_CODE[agency].payrollOffice} receives your ATD (salary deduction).`, `Matatanggap ng ${AGENCY_BY_CODE[agency].payrollOffice} ang iyong ATD (salary deduction).`)],
    [t('On your next payroll', 'Sa susunod na sahod'), t(`Your first ${money(contribution)} contribution is deducted. Your cover starts.`, `Ibabawas ang unang ${money(contribution)} na kontribusyon. Magsisimula ang iyong cover.`)],
  ];
  return (
    <Screen bar="none">
      <Lockup />
      <View style={[styles.doneDisc, {backgroundColor: colors.tones.ok.bg}]}>
        <View style={styles.doneMark}>
          <BladeMark size={64} opacity={0.18} />
        </View>
        <Icon name="checkCircle" size={60} weight="fill" color={colors.tones.ok.text} />
      </View>
      <View style={styles.gapSm} accessibilityLiveRegion="polite">
        <Txt variant="display" accessibilityRole="header">
          {t(`Thank you, ${name}. Your enrolment is sent.`, `Salamat, ${name}. Naipadala na ang iyong enrolment.`)}
        </Txt>
        <Txt variant="body" color="soft">
          {t('Reference number', 'Reference number')}
        </Txt>
        <Txt variant="amountLarge" selectable>
          {refNo}
        </Txt>
      </View>
      <View style={styles.section}>
        <Txt variant="title">{t('What happens next', 'Ano ang susunod')}</Txt>
        {steps.map(([when, what], i) => (
          <View key={when} style={styles.rowTop}>
            <View style={[styles.num, {backgroundColor: colors.primary}]}>
              <Txt variant="bodyStrong" color="onPrimary">
                {String(i + 1)}
              </Txt>
            </View>
            <View style={styles.flex}>
              <Txt variant="bodyStrong">{when}</Txt>
              <Txt variant="body" color="soft">
                {what}
              </Txt>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Button title={t('Back to the start', 'Bumalik sa simula')} icon="home" onPress={() => nav.popToTop()} />
        <Button title={t('Sign in', 'Mag-sign in')} icon="key" variant="quiet" onPress={() => nav.navigate('SignIn')} />
        <HelpLink topic="Something else" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  form: {gap: 22},
  gap: {gap: 16},
  gapSm: {gap: 10},
  gapXs: {gap: 4},
  row: {flexDirection: 'row', alignItems: 'center', gap: 10},
  rowTop: {flexDirection: 'row', alignItems: 'flex-start', gap: 14},
  between: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  stepTitle: {gap: 10, marginBottom: 24},
  disabled: {minHeight: 56, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center'},
  benefit: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
  total: {flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14},
  sumRow: {gap: 1},
  help: {marginTop: 28, alignItems: 'flex-start'},
  footRow: {flexDirection: 'row', gap: 10},
  footBack: {flex: 1},
  footNext: {flex: 2},
  doneDisc: {width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', marginTop: 32, marginBottom: 24},
  doneMark: {position: 'absolute'},
  section: {marginTop: 30, gap: 14},
  num: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
});
