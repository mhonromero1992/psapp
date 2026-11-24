import {useNavigation, type NavigationAction} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AccessibilityInfo, StyleSheet, View, type LayoutChangeEvent, type ScrollView} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Button, Card, Checkbox, DateField, Dialog, Divider, ErrorState, Icon, LoadingBlock, money, PhotoPicker, RadioCards, Screen, StepHeader, TextField, Txt, type Photo, type RadioOption} from '../../components/ui';
import {memberName} from '../../data/generate';
import {BENEFIT_BY_ID, BENEFIT_TYPES} from '../../data/reference';
import type {Claim, ClaimDocument, ClaimType} from '../../data/types';
import {date, maskAccount} from '../../lib/format';
import {useLang, useT} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {useDB} from '../../store/db';
import {useCoverage, useCurrentMember, useSimulatedLoad} from '../../store/hooks';
import {toast} from '../../store/ui';
import {BENEFIT_ICON, claimAmount, incidentLabel} from '../shared/claims';
import {HelpLink} from '../shared/Help';
import {BENEFIT_FIL, BENEFIT_SCHEDULE_EN, docName, nowMs} from '../shared/text';
import {DayStepper, GroupError, localDay, Notice, RELATION} from './parts';

type Field = 'type' | 'filer' | 'date' | 'hospital' | 'days' | 'severity' | 'description' | 'docs' | 'account' | 'certify';
type Errors = Partial<Record<Field, string>>;

const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Errors shown under a group of cards: scroll so the cards above stay in view too. */
const BELOW: Field[] = ['type', 'filer', 'account'];

/**
 * File a claim in six calm steps: the benefit, who files, what happened, photos of the papers,
 * where the money goes, and a review. Answers are kept when going back; nothing is sent until
 * the member confirms the amount.
 */
export default function ClaimNew() {
  const t = useT();
  const lang = useLang();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const member = useCurrentMember();
  const coverage = useCoverage(member);
  const fileClaim = useDB(s => s.fileClaim);
  const load = useSimulatedLoad(350);
  const today = localDay(nowMs());
  const joined = member.joinedAt.slice(0, 10);

  // Scrolling: back to the top on a new step; down to the first problem on Continue.
  const scrollRef = useRef<ScrollView>(null);
  const formY = useRef(0);
  const ys = useRef<Record<string, number>>({});
  const at = (k: string) => (e: LayoutChangeEvent) => {
    ys.current[k] = e.nativeEvent.layout.y;
  };

  const [step, setStep] = useState(0);
  const [type, setType] = useState<ClaimType | ''>('');
  const [filer, setFiler] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [hospital, setHospital] = useState('');
  const [days, setDays] = useState(0);
  const [severity, setSeverity] = useState<'major' | 'minor' | ''>('');
  const [description, setDescription] = useState('');
  const [docs, setDocs] = useState<Record<string, Photo[]>>({});
  const verified = member.payoutAccounts.filter(a => a.verified);
  const [accountId, setAccountId] = useState(() => (verified.find(a => a.primary) ?? verified[0])?.id ?? '');
  const [certify, setCertify] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Claim | null>(null);
  // Leaving with answers filled in asks first.
  const [leaveOpen, setLeaveOpen] = useState(false);
  const leaving = useRef(false);
  const pending = useRef<NavigationAction | null>(null);

  const b = type ? BENEFIT_BY_ID[type] : null;
  const hospitalType = type === 'AHB' || type === 'IHB';
  const requiredDocs = useMemo(() => (b ? b.documents.filter(d => !d.startsWith('No documents')) : []), [b]);
  const missingDocs = requiredDocs.filter(d => !(docs[d]?.length ?? 0));
  const fileCount = requiredDocs.reduce((n, d) => n + (docs[d]?.length ?? 0), 0);
  const estimate = type ? claimAmount(type, {days, severity}, coverage, member) : null;
  const ben = member.beneficiaries.find(x => x.id === filer);
  const claimant = filer === 'member' ? {name: memberName(member), relation: 'Member' as const} : ben ? {name: ben.name, relation: ben.relation} : null;
  const account = member.payoutAccounts.find(a => a.id === accountId);
  const accountLabel = account ? `${account.provider} ${maskAccount(account.accountNo)}` : member.payoutAccounts.length ? t('Your primary account', 'Ang iyong primary account') : t('A cheque at your branch', 'Cheke sa iyong sangay');
  const dirty = Boolean(type || incidentDate || hospital || days || severity || description || Object.values(docs).some(p => p.length) || certify);

  const STEPS = [t('Type of claim', 'Uri ng claim'), t('Who is filing', 'Sino ang nagfa-file'), t('What happened', 'Ano ang nangyari'), t('Documents', 'Mga dokumento'), t('Where to send', 'Saan ipapadala'), t('Review', 'Suriin')];
  const last = step === STEPS.length - 1;

  const go = useCallback((n: number) => {
    setErrors({});
    setStep(n);
    scrollRef.current?.scrollTo({y: 0, animated: false});
  }, []);

  // Android back and the iOS swipe: a step back inside the flow, and a question before leaving it.
  useEffect(
    () =>
      nav.addListener('beforeRemove', e => {
        if (done || leaving.current) {
          return;
        }
        if (step > 0) {
          e.preventDefault();
          go(step - 1);
          return;
        }
        if (!dirty) {
          return;
        }
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
    if (pending.current) {
      nav.dispatch(pending.current);
    } else {
      nav.goBack();
    }
  };

  const clear = (k: Field) => setErrors(e => (e[k] ? {...e, [k]: undefined} : e));

  const chooseType = (v: ClaimType) => {
    setType(v);
    clear('type');
    const nb = BENEFIT_BY_ID[v];
    if (nb.filer === 'beneficiary' && filer === 'member') {
      setFiler('');
    }
    if (nb.filer === 'member' && !filer) {
      setFiler('member');
    }
  };

  const validate = (s: number): Errors => {
    const e: Errors = {};
    if (s === 0 && !b) {
      e.type = t('Choose what you are claiming for.', 'Piliin kung para saan ang claim.');
    }
    if (s === 1) {
      if (!filer) {
        e.filer = t('Choose who is filing this claim.', 'Piliin kung sino ang nagfa-file ng claim.');
      } else if (b?.filer === 'beneficiary' && filer === 'member') {
        e.filer = t('A beneficiary files this kind of claim. Choose who is filing.', 'Beneficiary ang nagfa-file ng ganitong claim. Piliin kung sino.');
      }
    }
    if (s === 2 && b) {
      if (type !== 'MER') {
        if (!incidentDate) {
          e.date = t('Choose the date.', 'Piliin ang petsa.');
        } else if (!FULL_DATE.test(incidentDate)) {
          e.date = t('Choose the month, the day and the year.', 'Piliin ang buwan, araw at taon.');
        } else if (incidentDate > today) {
          e.date = t('The date cannot be in the future.', 'Hindi puwedeng petsa sa hinaharap.');
        } else if (incidentDate < joined) {
          e.date = t(`The date is before your membership started (${date(member.joinedAt)}).`, `Bago magsimula ang iyong membership ang petsa (${date(member.joinedAt)}).`);
        }
      }
      if (hospitalType) {
        if (hospital.trim().length < 3) {
          e.hospital = t('Enter the name of the hospital.', 'Ilagay ang pangalan ng ospital.');
        }
        if (days < 1) {
          e.days = t('Tap More to add the days you stayed in the hospital.', 'I-tap ang Dagdagan para ilagay kung ilang araw ka sa ospital.');
        } else if (days > 60) {
          e.days = t('Please check the number of days.', 'Pakisuri ang bilang ng araw.');
        }
      }
      if (type === 'WIA' && !severity) {
        e.severity = t('Choose how serious the injury is.', 'Piliin kung gaano kalubha ang pinsala.');
      }
      if (type !== 'MER' && description.trim().length < 10) {
        e.description = t('Tell us briefly what happened (at least 10 letters).', 'Ikuwento nang maikli ang nangyari (hindi bababa sa 10 letra).');
      }
    }
    if (s === 3 && missingDocs.length > 0) {
      e.docs =
        missingDocs.length === 1
          ? t('Add a photo of each document. 1 still needs a photo.', 'Magdagdag ng litrato ng bawat dokumento. 1 pa ang walang litrato.')
          : t(`Add a photo of each document. ${missingDocs.length} still need a photo.`, `Magdagdag ng litrato ng bawat dokumento. ${missingDocs.length} pa ang walang litrato.`);
    }
    if (s === 4 && verified.length > 0 && !accountId) {
      e.account = t('Choose where we should send the money.', 'Piliin kung saan namin ipapadala ang pera.');
    }
    if (s === 5 && !certify) {
      e.certify = t('Please tick the box to confirm before you file.', 'Paki-tsek ang kahon para kumpirmahin bago mag-file.');
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    const keys = Object.keys(e) as Field[];
    if (keys.length) {
      const k = keys[0];
      const y = ys.current[k === 'docs' ? `doc:${missingDocs[0]}` : k] ?? 0;
      scrollRef.current?.scrollTo({y: Math.max(0, formY.current + y - (BELOW.includes(k) ? 280 : 12)), animated: true});
      AccessibilityInfo.announceForAccessibility(
        keys.length === 1 ? t(`One answer needs fixing: ${e[k]}`, `May isang sagot na kailangang ayusin: ${e[k]}`) : t(`${keys.length} answers need fixing. The first: ${e[k]}`, `${keys.length} sagot ang kailangang ayusin. Ang una: ${e[k]}`),
      );
      return;
    }
    if (!last) {
      go(step + 1);
      return;
    }
    setConfirmOpen(true);
  };

  const submit = () => {
    if (!b || !type || !claimant || !estimate) {
      return;
    }
    setBusy(true);
    setTimeout(() => {
      let n = 1;
      const documents: ClaimDocument[] = requiredDocs.flatMap(d =>
        (docs[d] ?? []).map((f, k, all) => ({id: `D${n++}`, name: all.length > 1 ? `${d}, page ${k + 1}` : d, kind: d.includes('ID') ? 'ID' : 'Document', status: 'received' as const, preview: f.uri})),
      );
      const claim = fileClaim({
        memberId: member.id,
        type,
        claimantName: claimant.name,
        claimantRelation: claimant.relation,
        incidentDate: type === 'MER' ? today : incidentDate,
        description: description.trim() || t('Experience refund request', 'Request para sa experience refund'),
        confinementDays: hospitalType ? days : undefined,
        hospital: hospitalType ? hospital.trim() : undefined,
        amountClaimed: estimate.amount,
        documents,
        payoutAccountId: accountId,
      });
      setBusy(false);
      setConfirmOpen(false);
      setDone(claim);
      toast(t('Claim filed', 'Naisampa ang claim'), 'ok', claim.id);
    }, 900);
  };

  if (done) {
    return (
      <Screen key="done" helpTopic="Claims">
        <Filed claim={done} onHome={() => nav.navigate('Main', {screen: 'Home'})} onTrack={() => nav.replace('ClaimDetail', {id: done.id})} />
      </Screen>
    );
  }

  if (load.error || load.loading) {
    return (
      <Screen helpTopic="Claims" title={t('File a claim', 'Mag-file ng claim')}>
        {load.error ? <ErrorState onRetry={load.retry} helpTopic="Claims" /> : <LoadingBlock />}
      </Screen>
    );
  }

  const heads: [string, string | undefined][] = [
    [t('What are you claiming for?', 'Para saan ang claim?'), t('Choose one. Have your papers ready: you will take a photo of each one.', 'Pumili ng isa. Ihanda ang mga papel: kukunan mo ng litrato ang bawat isa.')],
    [
      t('Who is filing this claim?', 'Sino ang nagfa-file ng claim?'),
      b?.filer === 'beneficiary'
        ? t("For this claim, one of the member's beneficiaries files.", 'Para sa claim na ito, isa sa mga beneficiary ng miyembro ang nagfa-file.')
        : t('Usually you. A beneficiary can file for you if you cannot.', 'Karaniwan ay ikaw. Puwedeng mag-file ang beneficiary para sa iyo kung hindi mo kaya.'),
    ],
    [t('What happened?', 'Ano ang nangyari?'), type === 'MER' ? t('Nothing to fill in. The refund is declared by the Board each year.', 'Walang kailangang punan. Idinedeklara ng Board ang refund taun-taon.') : t('Answer from your hospital or incident papers.', 'Sumagot ayon sa papel mula sa ospital o insidente.')],
    [t('Add photos of your documents', 'Magdagdag ng litrato ng mga dokumento'), requiredDocs.length ? t('Take a clear photo of each paper in good light.', 'Kunan ng malinaw na litrato ang bawat papel sa maliwanag na lugar.') : undefined],
    [
      t('Where should we send the money?', 'Saan namin ipapadala ang pera?'),
      claimant && claimant.relation !== 'Member'
        ? t('For claims filed by a beneficiary, PSMBFI confirms the account with the beneficiary before release.', 'Para sa claim na isinampa ng beneficiary, kukumpirmahin ng PSMBFI ang account sa beneficiary bago i-release.')
        : t('Only accounts in your name that we have checked are shown.', 'Ang mga account lang na nasa pangalan mo at na-check na namin ang ipinapakita.'),
    ],
    [t('Check your claim', 'Suriin ang iyong claim'), t('Tap Change to fix anything. Nothing is sent until you confirm.', "I-tap ang Baguhin para ayusin. Walang maipapadala hangga't hindi mo kinukumpirma.")],
  ];

  const typeOptions: RadioOption<ClaimType>[] = BENEFIT_TYPES.map(bt => ({
    value: bt.id,
    label: t(bt.name, bt.nameFil),
    description: lang === 'fil' ? BENEFIT_FIL[bt.id].schedule : BENEFIT_SCHEDULE_EN[bt.id] ?? bt.schedule,
    icon: BENEFIT_ICON[bt.id],
  }));
  const filerOptions: RadioOption<string>[] = [
    {
      value: 'member',
      label: memberName(member),
      description: b?.filer === 'beneficiary' ? t('The member. A beneficiary files this claim.', 'Ang miyembro. Beneficiary ang nagfa-file nito.') : t('Me, the member', 'Ako, ang miyembro'),
      icon: 'profile',
      disabled: b?.filer === 'beneficiary',
    },
    ...member.beneficiaries.map(x => ({
      value: x.id,
      label: x.name,
      description: [`${t(...RELATION[x.relation])} · beneficiary`, x.dependentCover ? t("Your dependent's free insurance designee", 'Itinalaga para sa libreng insurance ng dependent') : ''].filter(Boolean).join('\n'),
      icon: 'users' as const,
    })),
  ];
  const accountOptions: RadioOption<string>[] = member.payoutAccounts.map(a => ({
    value: a.id,
    label: a.provider,
    icon: a.kind === 'bank' ? 'loans' : 'payouts',
    description: [`${a.kind === 'bank' ? t('Bank account', 'Bank account') : t('E-wallet', 'E-wallet')} ${maskAccount(a.accountNo)}`, a.primary ? t('Your primary account', 'Ang iyong primary account') : '', a.verified ? '' : t('Still being checked', 'Sinusuri pa')].filter(Boolean).join('\n'),
    disabled: !a.verified,
  }));
  const dayWords = (n: number) => (n === 1 ? t('1 day', '1 araw') : t(`${n} days`, `${n} araw`));
  const photoWords = (n: number) => (n === 1 ? t('1 photo', '1 litrato') : t(`${n} photos`, `${n} litrato`));

  return (
    <Screen
      scrollRef={scrollRef}
      onCancel={cancel}
      helpTopic="Claims"
      lead={<StepHeader step={step} total={STEPS.length} title={STEPS[step]} />}
      title={heads[step][0]}
      subtitle={heads[step][1]}
      footer={
        <View style={styles.footRow}>
          {step > 0 ? <Button title={t('Back', 'Bumalik')} icon="back" variant="quiet" onPress={() => go(step - 1)} style={styles.backBtn} testID="claim-back" /> : null}
          <Button title={last ? t('File this claim', 'I-file ang claim') : t('Continue', 'Magpatuloy')} icon={last ? 'check' : undefined} iconRight={last ? undefined : 'forward'} onPress={next} style={styles.nextBtn} testID="claim-next" />
        </View>
      }>
      <View
        onLayout={e => {
          formY.current = e.nativeEvent.layout.y;
        }}>
        {step === 0 && (
          <View style={styles.gap}>
            <RadioCards label={STEPS[0]} value={type} onChange={chooseType} options={typeOptions} />
            <View onLayout={at('type')}>
              <GroupError text={errors.type} />
            </View>
          </View>
        )}

        {step === 1 && b && (
          <View style={styles.gap}>
            <RadioCards
              label={STEPS[1]}
              value={filer}
              onChange={v => {
                setFiler(v);
                clear('filer');
              }}
              options={filerOptions}
            />
            <View onLayout={at('filer')}>
              <GroupError text={errors.filer} />
            </View>
          </View>
        )}

        {step === 2 && b && type && estimate && (
          <View style={styles.form}>
            {type !== 'MER' && (
              <View onLayout={at('date')}>
                <DateField
                  label={incidentLabel(type, t)}
                  value={incidentDate}
                  onChange={v => {
                    setIncidentDate(v);
                    clear('date');
                  }}
                  error={errors.date}
                  fromYear={Number(joined.slice(0, 4))}
                  toYear={Number(today.slice(0, 4))}
                />
              </View>
            )}
            {hospitalType && (
              <>
                <View onLayout={at('hospital')}>
                  <TextField
                    label={t('Hospital', 'Ospital')}
                    hint={t('As written on your certificate of confinement.', 'Ayon sa nakasulat sa certificate of confinement.')}
                    value={hospital}
                    onChangeText={v => {
                      setHospital(v);
                      clear('hospital');
                    }}
                    error={errors.hospital}
                    autoCapitalize="words"
                    autoComplete="off"
                  />
                </View>
                <View onLayout={at('days')}>
                  <DayStepper
                    label={t('Days in the hospital', 'Ilang araw sa ospital')}
                    hint={t('Count the nights you were confined. The benefit counts up to 10 days.', 'Bilangin ang mga gabing naka-confine ka. Hanggang 10 araw ang binabayaran.')}
                    value={days}
                    onChange={v => {
                      setDays(v);
                      clear('days');
                    }}
                    error={errors.days}
                  />
                </View>
              </>
            )}
            {type === 'WIA' && (
              <View style={styles.gap} onLayout={at('severity')}>
                <Txt variant="label">{t('How serious is the injury?', 'Gaano kalubha ang pinsala?')}</Txt>
                <RadioCards
                  label={t('How serious is the injury?', 'Gaano kalubha ang pinsala?')}
                  value={severity}
                  onChange={v => {
                    setSeverity(v);
                    clear('severity');
                  }}
                  options={[
                    {value: 'major', label: t('Major injury', 'Malubhang pinsala'), description: money(50_000, {whole: true})},
                    {value: 'minor', label: t('Minor injury', 'Hindi malubha'), description: money(20_000, {whole: true})},
                  ]}
                />
                <GroupError text={errors.severity} />
              </View>
            )}
            <Card tone="inset" style={[styles.estimate, {backgroundColor: colors.tones.ok.bg}]}>
              <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`${t('Estimated benefit', 'Tantyang benepisyo')}: ${money(estimate.amount)}. ${t(estimate.en, estimate.fil)}`}>
                <Txt variant="smallStrong" color="soft">
                  {t('Estimated benefit', 'Tantyang benepisyo')}
                </Txt>
                <Txt variant="amountLarge">{money(estimate.amount)}</Txt>
                <Txt variant="body" color="soft">
                  {t(estimate.en, estimate.fil)}
                </Txt>
              </View>
            </Card>
            {type !== 'MER' && (
              <View onLayout={at('description')}>
                <TextField
                  label={t('Tell us briefly what happened', 'Ikuwento nang maikli ang nangyari')}
                  value={description}
                  onChangeText={v => {
                    setDescription(v);
                    clear('description');
                  }}
                  error={errors.description}
                  multiline
                  maxLength={400}
                  style={styles.multi}
                />
              </View>
            )}
          </View>
        )}

        {step === 3 && b && (
          <View style={styles.form}>
            {requiredDocs.length === 0 ? (
              <Notice tone="ok" icon="checkCircle" text={`${docName(b.documents[0], lang)}.`} strong={false} />
            ) : (
              <>
                <Txt variant="bodyStrong" accessibilityLiveRegion="polite">
                  {t(`${requiredDocs.length - missingDocs.length} of ${requiredDocs.length} documents added`, `${requiredDocs.length - missingDocs.length} sa ${requiredDocs.length} dokumento ang naidagdag`)}
                </Txt>
                {requiredDocs.map(d => {
                  const photos = docs[d] ?? [];
                  return (
                    <View key={d} style={styles.gapSm} onLayout={at(`doc:${d}`)}>
                      <PhotoPicker
                        label={docName(d, lang)}
                        hint={photos.length ? t(`${photoWords(photos.length)} added`, `${photoWords(photos.length)} ang naidagdag`) : t('A clear photo in good light', 'Malinaw na litrato sa maliwanag na lugar')}
                        photos={photos}
                        onChange={p => {
                          setDocs(prev => ({...prev, [d]: p}));
                          if (p.length && missingDocs.length <= 1) {
                            clear('docs');
                          }
                        }}
                      />
                      {errors.docs && photos.length === 0 ? <GroupError text={t('Add a photo of this document.', 'Magdagdag ng litrato ng dokumentong ito.')} /> : null}
                    </View>
                  );
                })}
                <Txt variant="body" color="soft">
                  {t('Missing papers can slow down your claim. Your photos stay on this phone until you file.', 'Maaaring bumagal ang claim kapag may kulang na papel. Nasa phone mo lang ang mga litrato hanggang mag-file ka.')}
                </Txt>
              </>
            )}
          </View>
        )}

        {step === 4 && b && (
          <View style={styles.gap}>
            {member.payoutAccounts.length === 0 ? (
              <Notice tone="neutral" icon="info" text={t('You have no payout account yet. We will prepare a cheque at your branch.', 'Wala ka pang payout account. Maghahanda kami ng cheke sa iyong sangay.')} strong={false} />
            ) : (
              <RadioCards
                label={t('Payout account', 'Payout account')}
                value={accountId}
                onChange={v => {
                  setAccountId(v);
                  clear('account');
                }}
                options={accountOptions}
              />
            )}
            <View onLayout={at('account')}>
              <GroupError text={errors.account} />
            </View>
          </View>
        )}

        {step === 5 && b && type && estimate && (
          <View style={styles.form}>
            <Card tone="inset" pad={0}>
              <ReviewRow label={t('Claim', 'Claim')} value={t(b.name, b.nameFil)} onChange={() => go(0)} first />
              <ReviewRow label={t('Filed by', 'Isinampa ni')} value={claimant ? `${claimant.name}${claimant.relation === 'Member' ? '' : ` (${t(...RELATION[claimant.relation])})`}` : ''} onChange={() => go(1)} />
              {type !== 'MER' && <ReviewRow label={incidentLabel(type, t)} value={incidentDate ? date(incidentDate) : ''} onChange={() => go(2)} />}
              {hospitalType && <ReviewRow label={t('Hospital', 'Ospital')} value={hospital.trim()} onChange={() => go(2)} />}
              {hospitalType && <ReviewRow label={t('Days in the hospital', 'Ilang araw sa ospital')} value={dayWords(days)} onChange={() => go(2)} />}
              {type === 'WIA' && <ReviewRow label={t('How serious', 'Gaano kalubha')} value={severity === 'major' ? t('Major injury', 'Malubhang pinsala') : t('Minor injury', 'Hindi malubha')} onChange={() => go(2)} />}
              {requiredDocs.length > 0 && <ReviewRow label={t('Documents', 'Mga dokumento')} value={photoWords(fileCount)} onChange={() => go(3)} />}
              <ReviewRow label={t('Money goes to', 'Ipapadala sa')} value={accountLabel} onChange={() => go(4)} />
              <ReviewRow label={t('Amount claimed', 'Halagang kini-claim')} value={money(estimate.amount)} big />
            </Card>
            <View onLayout={at('certify')}>
              <Card tone="inset" style={[styles.gap, {backgroundColor: colors.primarySoft}]}>
                <Checkbox
                  checked={certify}
                  onChange={v => {
                    setCertify(v);
                    if (v) {
                      clear('certify');
                    }
                  }}
                  label={t('I certify that the information and documents I gave are true and correct.', 'Pinatutunayan ko na totoo at tama ang impormasyon at mga dokumentong ibinigay ko.')}
                />
                <GroupError text={errors.certify} />
              </Card>
            </View>
          </View>
        )}
      </View>

      <View style={styles.help}>
        <HelpLink topic="Claims" />
      </View>

      <Dialog
        open={confirmOpen}
        onClose={() => {
          if (!busy) {
            setConfirmOpen(false);
          }
        }}
        title={t('File this claim?', 'I-file ang claim na ito?')}
        footer={
          <>
            <Button title={t('File claim now', 'I-file na ang claim')} icon="check" busy={busy} onPress={submit} testID="claim-confirm" />
            <Button title={t('Cancel', 'Kanselahin')} variant="quiet" disabled={busy} onPress={() => setConfirmOpen(false)} />
          </>
        }>
        {b && estimate ? (
          <View style={styles.gapSm}>
            <Txt variant="body" color="soft">
              {t('You are claiming', 'Kini-claim mo ang')}
            </Txt>
            <Txt variant="amountLarge">{money(estimate.amount)}</Txt>
            <Txt variant="bodyStrong">{t(b.name, b.nameFil)}</Txt>
            <Txt variant="body" color="soft">
              {t(`To ${accountLabel} once approved.`, `Sa ${accountLabel} kapag naaprubahan.`)}
            </Txt>
            {requiredDocs.length > 0 ? (
              <Txt variant="body" color="soft">
                {t(`${photoWords(fileCount)} of your documents attached.`, `${photoWords(fileCount)} ng iyong mga dokumento ang nakalakip.`)}
              </Txt>
            ) : null}
            <View style={styles.dialogNote}>
              <Notice tone="neutral" icon="info" text={t('The final amount is set when your claim is approved.', 'Itatakda ang huling halaga kapag naaprubahan ang claim.')} strong={false} />
            </View>
          </View>
        ) : null}
      </Dialog>

      <Dialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title={t('Leave this claim?', 'Iiwan ang claim na ito?')}
        footer={
          <>
            <Button title={t('Keep going', 'Ituloy ang claim')} onPress={() => setLeaveOpen(false)} />
            <Button title={t('Leave and clear my answers', 'Umalis at burahin ang sagot')} variant="quiet" onPress={leave} testID="claim-leave" />
          </>
        }>
        <Txt variant="body" color="soft">
          {t('Your answers and photos are not sent yet. If you leave now, you will start again next time.', 'Hindi pa naipapadala ang iyong mga sagot at litrato. Kung aalis ka ngayon, magsisimula ka ulit sa susunod.')}
        </Txt>
      </Dialog>
    </Screen>
  );
}

/** One line of the review: what was answered, and a way back to change it. */
function ReviewRow({label, value, onChange, big, first}: {label: string; value: string; onChange?: () => void; big?: boolean; first?: boolean}) {
  const t = useT();
  return (
    <>
      {first ? null : <Divider />}
      <View style={styles.reviewRow}>
        <View style={styles.flex}>
          <Txt variant="small" color="soft">
            {label}
          </Txt>
          <Txt variant={big ? 'amountLarge' : 'bodyStrong'}>{value}</Txt>
        </View>
        {onChange ? <Button title={t('Change', 'Baguhin')} icon="pencil" variant="ghost" size="md" block={false} onPress={onChange} accessibilityHint={t(`Change: ${label}`, `Baguhin: ${label}`)} /> : null}
      </View>
    </>
  );
}

/** Filed: the check, the claim number, what happens next and when, and the way home. */
function Filed({claim, onHome, onTrack}: {claim: Claim; onHome: () => void; onTrack: () => void}) {
  const t = useT();
  const {colors} = useTheme();
  const b = BENEFIT_BY_ID[claim.type];
  const steps = [
    {title: t('We check your documents', 'Susuriin namin ang mga dokumento'), body: t('Within 2 working days. If a photo is hard to read, we will ask for a new one in this app.', 'Sa loob ng 2 araw ng trabaho. Kung malabo ang litrato, hihingi kami ng bago sa app na ito.')},
    {title: t('We decide on your claim', 'Pagpapasyahan namin ang claim'), body: t('A claims officer checks the benefit. You get a notification at each step.', 'Susuriin ng claims officer ang benepisyo. May abiso ka sa bawat hakbang.')},
    {title: t('We send the money', 'Ipapadala namin ang pera'), body: t(`Once approved, the benefit goes to ${claim.payoutLabel}.`, `Kapag naaprubahan, ipapadala ang benepisyo sa ${claim.payoutLabel}.`)},
  ];
  return (
    <View style={styles.done} accessibilityLiveRegion="polite">
      <View style={[styles.check, {backgroundColor: colors.tones.ok.bg}]}>
        <Icon name="checkCircle" size={52} weight="fill" color={colors.positive} />
      </View>
      <View style={styles.gapSm}>
        <Txt variant="display" accessibilityRole="header">
          {t('Claim filed', 'Naisampa ang claim')}
        </Txt>
        <Txt variant="body" color="soft">
          {t(`We received your ${b.name} claim for ${money(claim.amountClaimed)}.`, `Natanggap namin ang iyong claim (${b.nameFil}) na ${money(claim.amountClaimed)}.`)}
        </Txt>
      </View>
      <Card tone="inset" style={styles.gapSm}>
        <Txt variant="smallStrong" color="soft">
          {t('Your claim number', 'Ang iyong claim number')}
        </Txt>
        <Txt variant="amountLarge" selectable testID="claim-ref">
          {claim.id}
        </Txt>
        <Txt variant="body" color="soft">
          {t('Keep this number. Our staff will ask for it if you call.', 'Itago ang numerong ito. Hihingin ito ng aming staff kapag tumawag ka.')}
        </Txt>
      </Card>
      <View style={styles.gap}>
        <Txt variant="title" accessibilityRole="header">
          {t('What happens next', 'Ano ang susunod')}
        </Txt>
        {steps.map((s, i) => (
          <View key={s.title} style={styles.nextRow}>
            <View style={[styles.num, {backgroundColor: colors.primarySoft}]}>
              <Txt variant="bodyStrong" color="primary">
                {String(i + 1)}
              </Txt>
            </View>
            <View style={styles.flex}>
              <Txt variant="bodyStrong">{s.title}</Txt>
              <Txt variant="body" color="soft">
                {s.body}
              </Txt>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.gap}>
        <Button title={t('Back to Home', 'Bumalik sa Home')} icon="home" onPress={onHome} testID="claim-home" />
        <Button title={t('Track my claim', 'Subaybayan ang aking claim')} icon="claims" variant="quiet" onPress={onTrack} testID="claim-track" />
      </View>
      <HelpLink topic="Claims" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  gap: {gap: 12},
  gapSm: {gap: 6},
  form: {gap: 22},
  help: {marginTop: 18},
  multi: {minHeight: 128, textAlignVertical: 'top'},
  estimate: {gap: 4},
  dialogNote: {marginTop: 8},
  footRow: {flexDirection: 'row', gap: 10},
  backBtn: {flex: 1},
  nextBtn: {flex: 1.7},
  reviewRow: {flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 64, paddingLeft: 16, paddingRight: 6, paddingVertical: 10},
  done: {gap: 22, paddingTop: 8},
  check: {width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center'},
  nextRow: {flexDirection: 'row', gap: 14, alignItems: 'flex-start'},
  num: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
});
