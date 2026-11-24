import {useNavigation, useRoute, type NavigationAction, type RouteProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing, Keyboard, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Ribbon} from '../../components/brand/Brand';
import {Button, Card, Checkbox, Dialog, Divider, ErrorState, Icon, LoadingBlock, money, MoneyField, OtpInput, RadioCards, Screen, StepHeader, TextField, Txt} from '../../components/ui';
import {LOAN_PRODUCT_BY_ID, LOAN_PRODUCTS} from '../../data/reference';
import type {Loan, LoanProduct, LoanProductId} from '../../data/types';
import {amortization, maskAccount} from '../../lib/format';
import {useLang, useT} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {useDB} from '../../store/db';
import {useCurrentMember, useEquity, useLoansFor, useSimulatedLoad} from '../../store/hooks';
import {toast} from '../../store/ui';
import {HelpLink} from '../shared/Help';
import {eligibilityFor, firstDeduction, maxFor, stepFor, type Eligibility} from '../shared/loans';
import {monthYear, nowMs} from '../shared/text';
import {Chips, Meter, monthsText, Note, perYear, ReviewRow, SuccessView, workingDays} from './parts';

type Field = 'product' | 'amount' | 'term' | 'purpose' | 'calamity' | 'account' | 'consent';
type Errors = Partial<Record<Field, string>>;

const round2 = (n: number) => Math.round(n * 100) / 100;
const defaultAmount = (p: LoanProduct, max: number) => {
  const step = stepFor(p.minAmount, max);
  return Math.min(max, Math.max(p.minAmount, Math.round((p.minAmount + (max - p.minAmount) * 0.3) / step) * step));
};
const middleTerm = (p: LoanProduct) => p.terms[Math.floor((p.terms.length - 1) / 2)];

/** Round amounts between the smallest and the largest, so most members never need to type. */
const NICE = [5e3, 10e3, 15e3, 20e3, 25e3, 30e3, 40e3, 50e3, 60e3, 75e3, 100e3, 150e3, 200e3, 250e3, 300e3, 400e3, 500e3];
function quickPicks(min: number, max: number) {
  const inner = NICE.filter(v => v > min && v < max);
  const chosen = inner.length <= 3 ? inner : [0.25, 0.5, 0.75].map(f => inner[Math.round(f * (inner.length - 1))]);
  return [...new Set([min, ...chosen, max])];
}

const PURPOSES: [string, string][] = [
  ['Tuition for my child', 'Matrikula ng anak ko'],
  ['House repairs', 'Pagpapaayos ng bahay'],
  ['Hospital bills', 'Bayarin sa ospital'],
  ['Capital for a small business', 'Puhunan sa maliit na negosyo'],
  ['Family emergency', 'Emergency ng pamilya'],
];

/**
 * Apply for a loan in six short steps (type, amount, months, purpose, where to send, review), then a
 * confirmation that repeats the amount and asks for the one-time PIN. Values are kept when going back;
 * the phone's Back button also goes back one step.
 */
export default function LoanApply() {
  const t = useT();
  const lang = useLang();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'LoanApply'>>();
  const member = useCurrentMember();
  const equity = useEquity(member);
  const loans = useLoansFor(member.id);
  const applyLoan = useDB(s => s.applyLoan);
  const load = useSimulatedLoad(350);

  const months = equity?.months ?? 0;
  const equityValue = equity?.equityValue ?? 0;
  const products = useMemo(() => LOAN_PRODUCTS.map(p => ({p, max: maxFor(p, equityValue), elig: eligibilityFor(p, member, months, loans)})), [equityValue, member, months, loans]);
  const open = products.filter(x => x.elig.ok);
  const blocked = products.filter(x => !x.elig.ok);

  const requested = route.params?.product;
  const start: LoanProductId | '' = requested && products.find(x => x.p.id === requested)?.elig.ok ? requested : '';

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [productId, setProductId] = useState<LoanProductId | ''>(start);
  const [amount, setAmount] = useState<number | ''>(() => (start ? defaultAmount(LOAN_PRODUCT_BY_ID[start], maxFor(LOAN_PRODUCT_BY_ID[start], equityValue)) : ''));
  const [term, setTerm] = useState<number | ''>('');
  const [purpose, setPurpose] = useState('');
  const [calamity, setCalamity] = useState(false);
  const verified = member.payoutAccounts.filter(a => a.verified);
  const unverified = member.payoutAccounts.filter(a => !a.verified);
  const [accountId, setAccountId] = useState<string>(() => (verified.find(a => a.primary) ?? verified[0])?.id ?? '');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Loan | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const leaving = useRef(false);
  const pendingLeave = useRef<NavigationAction | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const p = productId ? LOAN_PRODUCT_BY_ID[productId] : null;
  const max = p ? maxFor(p, equityValue) : 0;
  const amt = typeof amount === 'number' ? amount : 0;
  const amountOk = !!p && amt >= p.minAmount && amt <= max;
  const months2 = typeof term === 'number' ? term : p ? middleTerm(p) : 12;
  const monthly = p && amt ? round2(amortization(amt, p.rate, months2)) : 0;
  const totalInterest = Math.max(0, round2(monthly * months2 - amt));
  const currentDeductions = useMemo(() => loans.filter(l => l.status === 'released').reduce((s, l) => s + l.monthly, 0), [loans]);
  const mep = equity?.monthly ?? round2(member.basePay * 0.03);
  const afterLoan = mep + currentDeductions + monthly;
  const account = member.payoutAccounts.find(a => a.id === accountId);
  const accountLabel = account ? `${account.provider} ${maskAccount(account.accountNo)}` : t('Cheque at your branch', 'Cheke sa iyong sangay');
  const firstPay = p ? monthYear(firstDeduction({releasedAt: null, appliedAt: new Date(nowMs()).toISOString()}, p.processingDays), lang) : '';
  const parts = member.mobile.split(' ');
  const maskedMobile = parts.length === 3 ? `${parts[0]} ••• ${parts[2]}` : maskAccount(member.mobile);

  const STEPS = [t('Loan type', 'Uri ng loan'), t('Amount', 'Halaga'), t('Months to pay', 'Ilang buwan'), t('Purpose', 'Layunin'), t('Where to send', 'Saan ipapadala'), t('Review', 'Suriin')];
  const last = step === STEPS.length - 1;

  const clear = (f: Field) => setErrors(e => (e[f] ? {...e, [f]: undefined} : e));

  const chooseProduct = (id: LoanProductId) => {
    const np = LOAN_PRODUCT_BY_ID[id];
    const nmax = maxFor(np, equityValue);
    setProductId(id);
    if (amount === '' || amount < np.minAmount || amount > nmax) {
      setAmount(defaultAmount(np, nmax));
    }
    if (term !== '' && !np.terms.includes(term)) {
      setTerm('');
    }
    setErrors({});
  };

  const validate = (s: number): Errors => {
    const e: Errors = {};
    if (s === 0 && !p) {
      e.product = t('Choose a loan to continue.', 'Pumili ng loan para magpatuloy.');
    }
    if (s === 1 && p) {
      if (amount === '') {
        e.amount = t('Enter how much you need.', 'Ilagay kung magkano ang kailangan mo.');
      } else if (amount < p.minAmount) {
        e.amount = t(`The smallest amount for this loan is ${money(p.minAmount, {whole: true})}.`, `Ang pinakamaliit na halaga para sa loan na ito ay ${money(p.minAmount, {whole: true})}.`);
      } else if (amount > max) {
        e.amount = t(`The most you can borrow is ${money(max, {whole: true})}.`, `Ang pinakamalaking mahihiram mo ay ${money(max, {whole: true})}.`);
      }
    }
    if (s === 2 && term === '') {
      e.term = t('Choose how many months you will pay.', 'Piliin kung ilang buwan mo babayaran.');
    }
    if (s === 3) {
      if (purpose.trim().length < 10) {
        e.purpose = t('Tell us in a few words what the loan is for (at least 10 letters).', 'Sabihin sa ilang salita kung para saan ang loan (hindi bababa sa 10 letra).');
      }
      if (p?.id === 'CAL' && !calamity) {
        e.calamity = t('Please confirm that you live or work in a declared calamity area.', 'Pakikumpirma na nakatira o nagtatrabaho ka sa lugar na may deklaradong kalamidad.');
      }
    }
    if (s === 4 && !accountId && verified.length > 0) {
      e.account = t('Choose where we should send the money.', 'Piliin kung saan namin ipapadala ang pera.');
    }
    if (s === 5 && !consent) {
      e.consent = t('Please tick the box to agree before you continue.', 'Paki-tsek ang kahon para sumang-ayon bago magpatuloy.');
    }
    return e;
  };

  const go = (to: number) => {
    setErrors({});
    setDir(to > step ? 1 : -1);
    setStep(to);
    scrollRef.current?.scrollTo({y: 0, animated: false});
    AccessibilityInfo.announceForAccessibility(t(`Step ${to + 1} of ${STEPS.length}: ${STEPS[to]}`, `Hakbang ${to + 1} sa ${STEPS.length}: ${STEPS[to]}`));
  };

  // The phone's Back button (and the iOS swipe) goes back one step instead of losing the answers.
  const dirty = step > 0 || purpose.trim() !== '' || term !== '';
  const goRef = useRef(go);
  goRef.current = go;
  useEffect(
    () =>
      nav.addListener('beforeRemove', e => {
        if (done || leaving.current) {
          return;
        }
        if (step > 0) {
          e.preventDefault();
          goRef.current(step - 1);
          return;
        }
        if (!dirty) {
          return;
        }
        e.preventDefault();
        pendingLeave.current = e.data.action;
        setLeaveOpen(true);
      }),
    [nav, step, done, dirty],
  );

  /** Cancel in the top bar: leave the flow, after a question if answers would be lost. */
  const cancel = () => {
    if (!dirty) {
      leaving.current = true;
      nav.goBack();
      return;
    }
    pendingLeave.current = null;
    setLeaveOpen(true);
  };
  const leave = () => {
    leaving.current = true;
    setLeaveOpen(false);
    if (pendingLeave.current) {
      nav.dispatch(pendingLeave.current);
    } else {
      nav.goBack();
    }
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    const keys = Object.keys(e) as Field[];
    if (keys.length) {
      // Errors at the end of a step (the consent, the calamity box) are scrolled into view.
      if (keys.every(k => k === 'consent' || k === 'calamity')) {
        scrollRef.current?.scrollToEnd({animated: true});
      } else {
        scrollRef.current?.scrollTo({y: 0, animated: true});
      }
      AccessibilityInfo.announceForAccessibility(e[keys[0]] ?? '');
      return;
    }
    if (!last) {
      return go(step + 1);
    }
    setPin('');
    setPinError(null);
    setConfirmOpen(true);
    toast(t('Sample PIN: 123456', 'Sample na PIN: 123456'), 'info', t('In the real app the PIN arrives by SMS. Any 6 numbers work here.', 'Sa totoong app, darating ang PIN sa SMS. Kahit anong 6 na numero ay puwede rito.'));
  };

  const submit = () => {
    if (!/^\d{6}$/.test(pin)) {
      setPinError(t('Enter all 6 numbers of the PIN.', 'Ilagay ang lahat ng 6 na numero ng PIN.'));
      return;
    }
    if (!p || typeof amount !== 'number' || typeof term !== 'number') {
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const loan = applyLoan({memberId: member.id, productId: p.id, principal: amount, termMonths: term, purpose: purpose.trim(), payoutAccountId: accountId, channel: 'Member App'});
      setBusy(false);
      setConfirmOpen(false);
      setDone(loan);
      toast(t('Application sent', 'Naipadala ang application'), 'ok', loan.id);
    }, 900);
  };

  if (done && p) {
    return (
      <Screen helpTopic="Loans">
        <SuccessView
          title={t('Application sent', 'Naipadala ang application')}
          body={t(`We received your ${p.name} application for ${money(done.principal)}.`, `Natanggap namin ang iyong application sa ${p.name} na ${money(done.principal)}.`)}
          refLabel={t('Your reference number', 'Ang iyong reference number')}
          refId={done.id}
          next={[
            {title: t('We check your application', 'Susuriin namin ang application'), body: t(`Within ${workingDays(p.processingDays, t)}. You will get a notification in this app.`, `Sa loob ng ${workingDays(p.processingDays, t)}. Makakatanggap ka ng abiso sa app na ito.`)},
            {title: t('We send the money', 'Ipapadala namin ang pera'), body: t(`Once approved, ${money(done.principal)} goes to ${done.payoutLabel}.`, `Kapag naaprubahan, ipapadala ang ${money(done.principal)} sa ${done.payoutLabel}.`)},
            {title: t('Your payments start', 'Magsisimula ang hulog'), body: t(`${money(done.monthly)} a month is deducted from your pay, starting with your ${firstPay} pay (estimate).`, `${money(done.monthly)} kada buwan ang ikakaltas sa sahod, simula sa sahod ng ${firstPay} (tantya).`)},
          ]}
          secondary={<Button title={t('View my loan', 'Tingnan ang aking loan')} icon="file" variant="quiet" onPress={() => nav.replace('LoanDetail', {id: done.id})} testID="apply-view-loan" />}
          helpTopic="Loans"
        />
      </Screen>
    );
  }

  const footer = load.ready ? (
    <View style={styles.footerRow}>
      {step > 0 ? <Button title={t('Back', 'Bumalik')} variant="quiet" block={false} style={styles.back} onPress={() => go(step - 1)} testID="apply-back" /> : null}
      <Button title={last ? t('Send application', 'Ipadala ang application') : t('Continue', 'Magpatuloy')} iconRight="forward" block={false} style={styles.continue} onPress={next} testID="apply-next" />
    </View>
  ) : undefined;

  return (
    <Screen scrollRef={scrollRef} onCancel={cancel} helpTopic="Loans" title={t('Apply for a loan', 'Mag-apply ng loan')} subtitle={step === 0 ? t('It takes about 5 minutes. You can go back and change any answer before you send it.', 'Mga 5 minuto lang ito. Puwede kang bumalik at baguhin ang sagot bago ipadala.') : undefined} footer={footer}>
      {load.error ? (
        <ErrorState onRetry={load.retry} helpTopic="Loans" />
      ) : !load.ready ? (
        <LoadingBlock />
      ) : (
        <>
          <StepHeader step={step} total={STEPS.length} title={STEPS[step]} />
          {p && step > 0 ? (
            <View style={[styles.sofar, {backgroundColor: colors.panel2}]} accessible accessibilityLabel={t(`Your loan so far: ${p.name}, ${money(amt, {whole: true})}`, `Ang iyong loan sa ngayon: ${p.name}, ${money(amt, {whole: true})}`)}>
              <Ribbon stripes={p.ribbon} />
              <Txt variant="smallStrong" style={styles.flex}>
                {p.name}
                {amt ? ` · ${money(amt, {whole: true})}` : ''}
                {step > 2 && term !== '' ? ` · ${monthsText(term, t)}` : ''}
              </Txt>
            </View>
          ) : null}

          <StepIn key={step} dir={dir}>
            {step === 0 && (
              <View style={styles.step}>
                <StepTitle title={t('Which loan do you need?', 'Anong loan ang kailangan mo?')} helper={t('Choose one. Each one shows the most you can borrow and the interest.', 'Pumili ng isa. Makikita sa bawat isa ang pinakamalaking mahihiram at ang interes.')} />
                {errors.product ? <FieldError text={errors.product} /> : null}
                <ProductPicker value={productId} onChange={chooseProduct} options={open} />
                {blocked.length > 0 ? (
                  <Card tone="inset" style={styles.gap}>
                    <Txt variant="bodyStrong">{t('Not available to you right now', 'Hindi mo pa ito ma-a-apply ngayon')}</Txt>
                    {blocked.map(x => (
                      <Txt key={x.p.id} variant="body">
                        {x.p.name}: {t(x.elig.en, x.elig.fil)}
                      </Txt>
                    ))}
                  </Card>
                ) : null}
              </View>
            )}

            {step === 1 && p && (
              <View style={styles.step}>
                <StepTitle title={t('How much do you need?', 'Magkano ang kailangan mo?')} helper={t(`${p.name}: from ${money(p.minAmount, {whole: true})} up to ${money(max, {whole: true})}.`, `${p.name}: mula ${money(p.minAmount, {whole: true})} hanggang ${money(max, {whole: true})}.`)} />
                <MoneyField
                  label={t('Loan amount', 'Halaga ng loan')}
                  value={amount}
                  onChange={v => {
                    setAmount(v);
                    clear('amount');
                  }}
                  error={errors.amount}
                  hint={p.id === 'POL' ? t('Your limit is 90% of your Equity Value.', 'Ang limit mo ay 90% ng iyong Equity Value.') : undefined}
                />
                <AmountSteppers
                  value={amt}
                  min={p.minAmount}
                  max={max}
                  step={stepFor(p.minAmount, max)}
                  onChange={v => {
                    setAmount(v);
                    clear('amount');
                  }}
                />
                <View style={styles.gap}>
                  <Txt variant="label">{t('Or tap an amount', 'O pumili ng halaga')}</Txt>
                  <Chips
                    label={t('Amounts you can choose', 'Mga halagang mapipili')}
                    options={quickPicks(p.minAmount, max).map(v => ({value: v, label: money(v, {whole: true})}))}
                    value={amount}
                    onPick={v => {
                      setAmount(v);
                      clear('amount');
                    }}
                  />
                </View>
                {amountOk ? (
                  <Note tone="info">
                    {t(
                      `About ${money(monthly)} a month if you pay over ${months2} months, with ${money(totalInterest)} interest in total. You choose the months next.`,
                      `Mga ${money(monthly)} kada buwan kung babayaran sa ${months2} buwan, at ${money(totalInterest)} ang kabuuang interes. Pipiliin mo ang buwan sa susunod.`,
                    )}
                  </Note>
                ) : null}
              </View>
            )}

            {step === 2 && p && (
              <View style={styles.step}>
                <StepTitle title={t('How many months will you pay?', 'Ilang buwan mo ito babayaran?')} helper={t('More months means a smaller amount each month, but more interest in total.', 'Mas maraming buwan, mas maliit ang buwanang hulog pero mas malaki ang kabuuang interes.')} />
                {errors.term ? <FieldError text={errors.term} /> : null}
                <RadioCards
                  label={t('Months to pay', 'Ilang buwan')}
                  value={term === '' ? '' : String(term)}
                  onChange={v => {
                    setTerm(Number(v));
                    clear('term');
                  }}
                  options={p.terms.map(m => ({value: String(m), label: monthsText(m, t), description: t(`${money(round2(amortization(amt, p.rate, m)))} a month`, `${money(round2(amortization(amt, p.rate, m)))} kada buwan`)}))}
                />
                {term !== '' ? (
                  <>
                    <Card tone="inset" style={styles.figures}>
                      <Big label={t('Each month', 'Kada buwan')} value={money(monthly)} big />
                      <Big label={t('Total interest', 'Kabuuang interes')} value={money(totalInterest)} />
                      <Big label={t('Total to pay back', 'Kabuuang babayaran')} value={money(amt + totalInterest)} />
                    </Card>
                    <View style={styles.gap}>
                      <Txt variant="heading">{t('What comes out of your pay each month', 'Ano ang ikakaltas sa sahod mo kada buwan')}</Txt>
                      <Txt variant="body" color="soft">
                        {t(`Your base pay is ${money(member.basePay)} a month. Your 3% contribution is already deducted today.`, `Ang base pay mo ay ${money(member.basePay)} kada buwan. Kinakaltas na ngayon ang iyong 3% na kontribusyon.`)}
                      </Txt>
                      <Meter
                        total={member.basePay}
                        parts={[
                          {key: 'mep', label: t('Your 3% contribution (already deducted)', 'Ang 3% na kontribusyon (kinakaltas na)'), value: mep, color: colors.chart2},
                          ...(currentDeductions > 0 ? [{key: 'current', label: t('Your current loan payments', 'Kasalukuyang hulog sa loan'), value: currentDeductions, color: colors.chartRef}] : []),
                          {key: 'new', label: t('This new loan', 'Ang bagong loan na ito'), value: monthly, color: colors.chart1},
                        ]}
                        restLabel={t('Rest of your base pay (before other payroll deductions)', 'Natitira sa base pay (bago ang ibang kaltas sa payroll)')}
                      />
                      <Txt variant="body">
                        {t(
                          `After this loan, PSMBFI would deduct ${money(afterLoan)} a month, ${Math.round((afterLoan / member.basePay) * 100)}% of your base pay.`,
                          `Pagkatapos ng loan na ito, ${money(afterLoan)} kada buwan ang ikakaltas ng PSMBFI, ${Math.round((afterLoan / member.basePay) * 100)}% ng iyong base pay.`,
                        )}
                      </Txt>
                    </View>
                  </>
                ) : null}
              </View>
            )}

            {step === 3 && p && (
              <View style={styles.step}>
                <StepTitle title={t('What is the loan for?', 'Para saan ang loan?')} helper={t('A short answer is enough. Tap one below or type your own.', 'Sapat na ang maikling sagot. Pumili sa ibaba o mag-type ng sarili mo.')} />
                <TextField
                  label={t('Purpose of the loan', 'Layunin ng loan')}
                  value={purpose}
                  onChangeText={v => {
                    setPurpose(v);
                    clear('purpose');
                  }}
                  error={errors.purpose}
                  hint={t('For example: tuition for my child, house repairs.', 'Halimbawa: matrikula ng anak, pagpapaayos ng bahay.')}
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                  textAlignVertical="top"
                  style={styles.textarea}
                />
                <Chips
                  label={t('Common reasons', 'Mga karaniwang dahilan')}
                  options={PURPOSES.map(([en, fil]) => ({value: t(en, fil), label: t(en, fil)}))}
                  value={purpose.trim()}
                  onPick={v => {
                    setPurpose(v);
                    clear('purpose');
                  }}
                />
                {p.id === 'CAL' ? (
                  <View style={[styles.calamity, {backgroundColor: colors.tones.warn.bg}]}>
                    <Checkbox
                      checked={calamity}
                      onChange={v => {
                        setCalamity(v);
                        clear('calamity');
                      }}
                      label={t('I live or work in an area under a declared state of calamity.', 'Nakatira o nagtatrabaho ako sa lugar na may deklaradong state of calamity.')}
                      description={t('Bring a certificate of residence or assignment when asked.', 'Magdala ng certificate of residence o assignment kapag hiningi.')}
                    />
                    {errors.calamity ? <FieldError text={errors.calamity} /> : null}
                  </View>
                ) : null}
              </View>
            )}

            {step === 4 && p && (
              <View style={styles.step}>
                <StepTitle title={t('Where should we send the money?', 'Saan namin ipapadala ang pera?')} helper={t('Only accounts in your name that we have checked are shown.', 'Ang mga account lang na nasa pangalan mo at na-check na namin ang ipinapakita.')} />
                {errors.account ? <FieldError text={errors.account} /> : null}
                {verified.length === 0 ? (
                  <Note tone="info">
                    {t('You have no checked payout account yet. We will prepare a cheque at your branch. You can add an account in Payouts.', 'Wala ka pang na-check na payout account. Maghahanda kami ng cheke sa iyong sangay. Puwede kang magdagdag ng account sa Payouts.')}
                  </Note>
                ) : (
                  <RadioCards
                    label={t('Payout account', 'Payout account')}
                    value={accountId}
                    onChange={v => {
                      setAccountId(v);
                      clear('account');
                    }}
                    options={verified.map(a => ({
                      value: a.id,
                      icon: a.kind === 'bank' ? 'loans' : 'payouts',
                      label: a.provider,
                      description: `${a.kind === 'bank' ? t('Bank account', 'Bank account') : t('E-wallet', 'E-wallet')} ${maskAccount(a.accountNo)}${a.primary ? `\n${t('Your primary account', 'Ang iyong primary account')}` : ''}`,
                    }))}
                  />
                )}
                {unverified.map(a => (
                  <Note key={a.id} tone="warn">
                    {t(`${a.provider} ${maskAccount(a.accountNo)} is still being checked. You can use it once it is verified.`, `Sinusuri pa ang ${a.provider} ${maskAccount(a.accountNo)}. Magagamit ito kapag na-verify na.`)}
                  </Note>
                ))}
              </View>
            )}

            {step === 5 && p && (
              <View style={styles.step}>
                <StepTitle title={t('Check your application', 'Suriin ang iyong application')} helper={t('Tap Change to fix anything. Nothing is sent until you confirm.', 'I-tap ang Baguhin para ayusin. Walang maipapadala hangga’t hindi mo kinukumpirma.')} />
                <Card pad={0}>
                  <ReviewRow label={t('Loan', 'Loan')} value={p.name} onChange={() => go(0)} />
                  <Divider />
                  <ReviewRow label={t('Amount', 'Halaga')} value={money(amt)} big onChange={() => go(1)} />
                  <Divider />
                  <ReviewRow label={t('Months to pay', 'Ilang buwan')} value={monthsText(months2, t)} onChange={() => go(2)} />
                  <Divider />
                  <ReviewRow label={t('Each month', 'Kada buwan')} value={`${money(monthly)} · ${t(`from your ${firstPay} pay`, `simula sa sahod ng ${firstPay}`)}`} />
                  <Divider />
                  <ReviewRow label={t('Interest', 'Interes')} value={`${perYear(p.rate, t)} · ${t(`${money(totalInterest)} in total`, `${money(totalInterest)} lahat`)}`} />
                  <Divider />
                  <ReviewRow label={t('Total to pay back', 'Kabuuang babayaran')} value={money(amt + totalInterest)} />
                  <Divider />
                  <ReviewRow label={t('Purpose', 'Layunin')} value={purpose.trim()} onChange={() => go(3)} />
                  <Divider />
                  <ReviewRow label={t('Money goes to', 'Ipapadala sa')} value={accountLabel} onChange={() => go(4)} />
                </Card>
                <View style={[styles.consent, {backgroundColor: colors.primarySoft}]}>
                  <Checkbox
                    checked={consent}
                    onChange={v => {
                      setConsent(v);
                      clear('consent');
                    }}
                    label={t(
                      `I agree to the loan terms. I allow PSMBFI to deduct ${money(monthly)} from my salary every month through ATD (salary deduction) until the loan is paid.`,
                      `Sumasang-ayon ako sa mga tuntunin ng loan. Pinapayagan ko ang PSMBFI na ikaltas ang ${money(monthly)} sa aking sahod buwan-buwan sa ATD (kaltas sa sahod) hanggang mabayaran ang loan.`,
                    )}
                  />
                  {errors.consent ? <FieldError text={errors.consent} /> : null}
                </View>
              </View>
            )}
          </StepIn>
          <View style={styles.help}>
            <HelpLink topic="Loans" />
          </View>
        </>
      )}

      <Dialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title={t('Leave your application?', 'Iiwan ang application?')}
        footer={
          <>
            <Button title={t('Keep going', 'Ituloy ang application')} onPress={() => setLeaveOpen(false)} />
            <Button title={t('Leave and clear my answers', 'Umalis at burahin ang sagot')} variant="quiet" onPress={leave} testID="apply-leave" />
          </>
        }>
        <Txt variant="body" color="soft">
          {t('Your answers are not sent yet. If you leave now, you will start again next time.', 'Hindi pa naipapadala ang iyong mga sagot. Kung aalis ka ngayon, magsisimula ka ulit sa susunod.')}
        </Txt>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={() => {
          if (!busy) {
            setConfirmOpen(false);
          }
        }}
        title={t('Confirm your loan', 'Kumpirmahin ang iyong loan')}
        footer={
          <>
            <Button title={t('Confirm and send', 'Kumpirmahin at ipadala')} icon="check" busy={busy} onPress={submit} testID="apply-confirm" />
            <Button title={t('Cancel', 'Kanselahin')} variant="quiet" disabled={busy} onPress={() => setConfirmOpen(false)} />
          </>
        }>
        {p ? (
          <View style={styles.gapSm}>
            <Txt variant="body" color="soft">
              {t('You are applying for', 'Ina-apply mo ang')}
            </Txt>
            <Txt variant="amountLarge">{money(amt)}</Txt>
            <Txt variant="bodyStrong">{p.name}</Txt>
            <Txt variant="body" color="soft">
              {t(`${money(monthly)} a month for ${months2} months, to ${accountLabel}`, `${money(monthly)} kada buwan sa loob ng ${months2} buwan, sa ${accountLabel}`)}
            </Txt>
            <View style={[styles.pinBox, {backgroundColor: colors.panel2}]}>
              <Txt variant="label">{t(`Enter the 6-number PIN we sent to ${maskedMobile}`, `Ilagay ang 6-numerong PIN na ipinadala namin sa ${maskedMobile}`)}</Txt>
              <OtpInput
                value={pin}
                onChange={v => {
                  setPin(v);
                  if (pinError) {
                    setPinError(null);
                  }
                  if (v.length === 6) {
                    Keyboard.dismiss();
                  }
                }}
                error={!!pinError}
              />
              {pinError ? <FieldError text={pinError} /> : null}
              <Txt variant="small" color="soft">
                {t('This is a sample. Any 6 numbers work, for example 123456.', 'Sample lang ito. Kahit anong 6 na numero ay puwede, halimbawa 123456.')}
              </Txt>
            </View>
          </View>
        ) : null}
      </Dialog>
    </Screen>
  );
}

/** Steps slide in from the direction of travel (still under reduced motion). */
function StepIn({dir, children}: {dir: 1 | -1; children: React.ReactNode}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!alive) {
        return;
      }
      if (reduced) {
        v.setValue(1);
      } else {
        Animated.timing(v, {toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true}).start();
      }
    });
    return () => {
      alive = false;
    };
  }, [v]);
  const opacity = v.interpolate({inputRange: [0, 1], outputRange: [0.3, 1]});
  const translateX = v.interpolate({inputRange: [0, 1], outputRange: [24 * dir, 0]});
  return <Animated.View style={{opacity, transform: [{translateX}]}}>{children}</Animated.View>;
}

function StepTitle({title, helper}: {title: string; helper?: string}) {
  return (
    <View style={styles.stepTitle}>
      <Txt variant="title" accessibilityRole="header">
        {title}
      </Txt>
      {helper ? (
        <Txt variant="body" color="soft">
          {helper}
        </Txt>
      ) : null}
    </View>
  );
}

function FieldError({text}: {text: string}) {
  const {colors} = useTheme();
  return (
    <View style={styles.err} accessibilityRole="alert">
      <Icon name="warning" size={18} color={colors.tones.bad.text} weight="fill" />
      <Txt variant="smallStrong" color="bad" style={styles.flex}>
        {text}
      </Txt>
    </View>
  );
}

function Big({label, value, big}: {label: string; value: string; big?: boolean}) {
  return (
    <View style={styles.big}>
      <Txt variant="small" color="soft">
        {label}
      </Txt>
      <Txt variant={big ? 'amountLarge' : 'amount'}>{value}</Txt>
    </View>
  );
}

/** Minus and plus in round steps, beside the typed amount: no tiny slider to drag. */
function AmountSteppers({value, min, max, step, onChange}: {value: number; min: number; max: number; step: number; onChange: (v: number) => void}) {
  const t = useT();
  const base = value || min;
  const down = Math.max(min, Math.ceil(base / step) * step - step);
  const up = Math.min(max, Math.max(min, Math.floor(base / step) * step + step));
  return (
    <View style={styles.steppers}>
      <Button title={`− ${money(step, {whole: true})}`} variant="quiet" size="md" block={false} style={styles.flex} disabled={base <= min} onPress={() => onChange(down)} accessibilityHint={t('Makes the amount smaller', 'Binababaan ang halaga')} />
      <Button title={`+ ${money(step, {whole: true})}`} variant="quiet" size="md" block={false} style={styles.flex} disabled={base >= max} onPress={() => onChange(up)} accessibilityHint={t('Makes the amount bigger', 'Tinataasan ang halaga')} />
    </View>
  );
}

/** The six loans as big choices, each wearing its ribbon, with the limit and any caution in words. */
function ProductPicker({value, onChange, options}: {value: LoanProductId | ''; onChange: (id: LoanProductId) => void; options: {p: LoanProduct; max: number; elig: Eligibility}[]}) {
  const t = useT();
  const {colors} = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('Loan type', 'Uri ng loan')} style={styles.options}>
      {options.map(({p, max, elig}) => {
        const on = p.id === value;
        const warn = elig.tone === 'warn' ? t(elig.en, elig.fil) : null;
        const facts = t(`Up to ${money(max, {whole: true})} · ${perYear(p.rate, t)}`, `Hanggang ${money(max, {whole: true})} · ${perYear(p.rate, t)}`);
        return (
          <Pressable
            key={p.id}
            onPress={() => onChange(p.id)}
            accessibilityRole="radio"
            accessibilityState={{checked: on}}
            accessibilityLabel={[p.name, t(p.purpose, p.purposeFil), facts, warn].filter(Boolean).join('. ')}
            testID={`pick-${p.id}`}
            style={({pressed}) => [styles.option, on ? {backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 2} : {backgroundColor: pressed ? colors.panel2 : colors.panel, borderColor: colors.line, borderWidth: 1.5}]}>
            <View style={styles.optionHead}>
              <Ribbon stripes={p.ribbon} width={34} height={12} />
              <Txt variant="bodyStrong" style={styles.flex}>
                {p.name}
              </Txt>
              <View style={[styles.radio, on ? {borderColor: colors.primary, backgroundColor: colors.primary} : {borderColor: colors.lineStrong}]}>{on ? <Icon name="check" size={15} color={colors.onPrimary} weight="bold" /> : null}</View>
            </View>
            <Txt variant="small" color="soft">
              {t(p.purpose, p.purposeFil)}
            </Txt>
            <Txt variant="smallStrong">{facts}</Txt>
            {warn ? (
              <View style={styles.warnRow}>
                <Icon name="warning" size={18} weight="fill" color={colors.tones.warn.text} />
                <Txt variant="small" color="warn" style={styles.flex}>
                  {warn}
                </Txt>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  gap: {gap: 10},
  gapSm: {gap: 6},
  step: {gap: 18},
  stepTitle: {gap: 6},
  sofar: {flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 18},
  footerRow: {flexDirection: 'row', gap: 10, alignItems: 'stretch'},
  back: {flex: 1},
  continue: {flex: 1.6},
  help: {marginTop: 22},
  err: {flexDirection: 'row', alignItems: 'center', gap: 8},
  options: {gap: 12},
  option: {borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 6},
  optionHead: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 30},
  radio: {width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  warnRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 2},
  steppers: {flexDirection: 'row', gap: 10},
  figures: {flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 14},
  big: {gap: 2, flexGrow: 1, flexBasis: 140},
  textarea: {minHeight: 104},
  calamity: {borderRadius: 16, padding: 14, gap: 6},
  consent: {borderRadius: 16, padding: 14, gap: 6},
  pinBox: {borderRadius: 16, padding: 14, gap: 12, marginTop: 8},
});
