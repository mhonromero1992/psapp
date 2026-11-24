import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useMemo} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Ribbon} from '../../components/brand/Brand';
import {Badge, Button, Card, Divider, EmptyState, ErrorState, Fact, Icon, ListRow, LoadingBlock, money, ProgressBar, Screen, SectionHead, Txt} from '../../components/ui';
import {LOAN_PRODUCT_BY_ID, LOAN_PRODUCTS} from '../../data/reference';
import type {Loan, LoanProduct} from '../../data/types';
import {date} from '../../lib/format';
import {useLang, useT} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {useCurrentMember, useEquity, useLoansFor, useSimulatedLoad} from '../../store/hooks';
import {HelpLink} from '../shared/Help';
import {CLOSED_LOAN, eligibilityFor, finalDeduction, maxFor, nextDeduction, paidCount, PENDING_LOAN, type Eligibility} from '../shared/loans';
import {LOAN_STATUS} from '../shared/status';
import {monthYear} from '../shared/text';
import {monthsText, perYear, RibbonRack, workingDays} from './parts';

/** Her loans first (active, in progress, finished), then the six products she can apply for. */
export default function Loans() {
  const t = useT();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const member = useCurrentMember();
  const equity = useEquity(member);
  const loans = useLoansFor(member.id);
  const load = useSimulatedLoad();

  const sorted = useMemo(() => [...loans].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)), [loans]);
  const active = useMemo(() => sorted.filter(l => l.status === 'released'), [sorted]);
  const pending = useMemo(() => sorted.filter(l => PENDING_LOAN.includes(l.status)), [sorted]);
  const past = useMemo(() => sorted.filter(l => CLOSED_LOAN.includes(l.status)), [sorted]);
  const months = equity?.months ?? 0;
  const open = (id: string) => nav.navigate('LoanDetail', {id});

  return (
    <Screen
      bar="tabs"
      tabs
      onRefresh={load.retry}
      helpTopic="Loans"
      title={t('Loans', 'Mga loan')}
      subtitle={t('Six kinds of loans. You pay them back through ATD (salary deduction), so there is nothing to remember each month.', 'Anim na uri ng loan. Binabayaran ito sa ATD (kaltas sa sahod), kaya wala kang kailangang tandaan buwan-buwan.')}>
      <Button title={t('Apply for a loan', 'Mag-apply ng loan')} icon="loans" onPress={() => nav.navigate('LoanApply')} testID="loans-apply" />

      {load.error ? (
        <ErrorState onRetry={load.retry} helpTopic="Loans" />
      ) : load.loading ? (
        <View style={styles.top}>
          <LoadingBlock />
        </View>
      ) : (
        <View style={styles.stack}>
          <View>
            <SectionHead title={t('Your loans', 'Ang iyong mga loan')} count={loans.length} />
            {loans.length === 0 ? (
              <Card>
                <EmptyState
                  title={t('You have no loans yet', 'Wala ka pang loan')}
                  body={t('Choose a loan below to see how much you can borrow and what you would pay each month.', 'Pumili ng loan sa ibaba para makita kung magkano ang mahihiram mo at ang buwanang bayad.')}
                  action={<HelpLink topic="Loans" />}
                />
              </Card>
            ) : (
              <View style={styles.list}>
                {active.map(l => (
                  <ActiveLoan key={l.id} loan={l} onOpen={() => open(l.id)} />
                ))}
                {pending.length > 0 && (
                  <Txt variant="heading" accessibilityRole="header" style={styles.subHead}>
                    {t('In progress', 'Pinoproseso')}
                  </Txt>
                )}
                {pending.map(l => (
                  <PendingLoan key={l.id} loan={l} onOpen={() => open(l.id)} />
                ))}
                {past.length > 0 && (
                  <>
                    <Txt variant="heading" accessibilityRole="header" style={styles.subHead}>
                      {t('Finished loans', 'Mga tapos nang loan')}
                    </Txt>
                    <Card pad={0}>
                      {past.map((l, i) => (
                        <View key={l.id}>
                          {i > 0 && <Divider />}
                          <PastLoanRow loan={l} onOpen={() => open(l.id)} />
                        </View>
                      ))}
                    </Card>
                  </>
                )}
              </View>
            )}
          </View>

          <View>
            <View style={styles.productsHead}>
              <View style={styles.flex}>
                <Txt variant="title" accessibilityRole="header">
                  {t('Loans you can apply for', 'Mga loan na maaari mong i-apply')}
                </Txt>
              </View>
              <RibbonRack />
            </View>
            <Txt variant="small" color="soft" style={styles.sample}>
              {t('Amounts and rates are sample values to confirm with PSMBFI.', 'Sample na halaga lang ang mga amount at rate, kukumpirmahin sa PSMBFI.')}
            </Txt>
            <View style={styles.list}>
              {LOAN_PRODUCTS.map(p => (
                <ProductCard key={p.id} p={p} max={maxFor(p, equity?.equityValue ?? 0)} elig={eligibilityFor(p, member, months, loans)} onApply={() => nav.navigate('LoanApply', {product: p.id})} />
              ))}
            </View>
          </View>

          <HelpLink topic="Loans" />
        </View>
      )}
    </Screen>
  );
}

function ActiveLoan({loan, onOpen}: {loan: Loan; onOpen: () => void}) {
  const t = useT();
  const lang = useLang();
  const {colors} = useTheme();
  const p = LOAN_PRODUCT_BY_ID[loan.productId];
  const paid = paidCount(loan);
  const s = LOAN_STATUS[loan.status];
  const pct = Math.round((paid / loan.termMonths) * 100);
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={t(`${p.name}, active. ${money(loan.balance)} left to pay. Payment ${paid} of ${loan.termMonths} made.`, `${p.name}, aktibo. ${money(loan.balance)} ang natitira. Hulog ${paid} sa ${loan.termMonths} ang nabayaran.`)}
      accessibilityHint={t('Opens payments and details', 'Binubuksan ang mga hulog at detalye')}
      style={({pressed}) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.titleRow}>
            <Ribbon stripes={p.ribbon} width={34} height={12} />
            <Txt variant="title" style={styles.shrink}>
              {p.name}
            </Txt>
          </View>
          <Badge tone={s.tone} label={t(s.en, s.fil)} />
        </View>
        <Txt variant="small" color="soft">
          {loan.id} · {t(`${money(loan.principal, {whole: true})} borrowed`, `${money(loan.principal, {whole: true})} ang hiniram`)}
        </Txt>
        <View style={styles.balance}>
          <Txt variant="smallStrong" color="soft">
            {t('Left to pay', 'Natitirang babayaran')}
          </Txt>
          <Txt variant="amountLarge">{money(loan.balance)}</Txt>
        </View>
        <View style={styles.rowBetween}>
          <Txt variant="bodyStrong" style={styles.shrink}>
            {t(`Payment ${paid} of ${loan.termMonths} made`, `Hulog ${paid} sa ${loan.termMonths} ang nabayaran`)}
          </Txt>
          <Txt variant="smallStrong" color="soft">
            {`${pct}%`}
          </Txt>
        </View>
        <ProgressBar value={paid} max={loan.termMonths} label={t(`${paid} of ${loan.termMonths} payments made`, `${paid} sa ${loan.termMonths} hulog ang nabayaran`)} />
        <Card tone="inset" pad={14} style={styles.facts}>
          <Fact label={t('Each month', 'Kada buwan')} value={money(loan.monthly)} />
          <Fact label={t('Next deduction', 'Susunod na kaltas')} value={monthYear(nextDeduction(loan, p.processingDays), lang)} />
          <Fact label={t('Last payment', 'Huling hulog')} value={monthYear(finalDeduction(loan, p.processingDays), lang)} />
          <Fact label={t('Interest', 'Interes')} value={perYear(loan.rate, t)} />
        </Card>
        <View style={styles.link}>
          <Txt variant="bodyStrong" color="primary">
            {t('See payments and details', 'Tingnan ang mga hulog at detalye')}
          </Txt>
          <Icon name="forward" size={18} weight="bold" color={colors.primaryText} />
        </View>
      </Card>
    </Pressable>
  );
}

function PendingLoan({loan, onOpen}: {loan: Loan; onOpen: () => void}) {
  const t = useT();
  const {colors} = useTheme();
  const p = LOAN_PRODUCT_BY_ID[loan.productId];
  const s = LOAN_STATUS[loan.status];
  const note =
    loan.status === 'returned'
      ? t('Something needs to be corrected. Open it to see what.', 'May kailangang itama. Buksan ito para makita.')
      : loan.status === 'for_release' || loan.status === 'approved'
      ? t(`Approved. The money will be sent to ${loan.payoutLabel}.`, `Aprubado. Ipapadala ang pera sa ${loan.payoutLabel}.`)
      : t(`We review applications within ${workingDays(p.processingDays, t)}.`, `Sinusuri namin ang application sa loob ng ${workingDays(p.processingDays, t)}.`);
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${t(`${p.name} application`, `Application sa ${p.name}`)}, ${t(s.en, s.fil)}. ${note}`} style={({pressed}) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Ribbon stripes={p.ribbon} width={34} height={12} />
          <Txt variant="heading" style={styles.shrink}>
            {t(`${p.name} application`, `Application sa ${p.name}`)}
          </Txt>
        </View>
        <Badge tone={s.tone} label={t(s.en, s.fil)} />
        <Txt variant="small" color="soft">
          {loan.id} · {money(loan.principal, {whole: true})} · {monthsText(loan.termMonths, t)}
        </Txt>
        <Txt variant="body">{note}</Txt>
        <View style={styles.link}>
          <Txt variant="bodyStrong" color="primary">
            {t('See where it is', 'Tingnan kung nasaan na')}
          </Txt>
          <Icon name="forward" size={18} weight="bold" color={colors.primaryText} />
        </View>
      </Card>
    </Pressable>
  );
}

/** A finished loan in plain words ("Fully paid on 29 Aug"), so the row stays roomy at large text. */
function PastLoanRow({loan, onOpen}: {loan: Loan; onOpen: () => void}) {
  const t = useT();
  const p = LOAN_PRODUCT_BY_ID[loan.productId];
  const s = LOAN_STATUS[loan.status];
  const ended = date(loan.timeline[loan.timeline.length - 1]?.at ?? loan.appliedAt);
  return <ListRow title={p.name} subtitle={`${money(loan.principal, {whole: true})} · ${t(`${s.en} on ${ended}`, `${s.fil} noong ${ended}`)}`} icon={loan.status === 'paid' ? 'checkCircle' : 'loans'} tone={s.tone} onPress={onOpen} />;
}

/** One product, worn like a ribbon: what it is for, the limits, and whether she can apply now. */
function ProductCard({p, max, elig, onApply}: {p: LoanProduct; max: number; elig: Eligibility; onApply: () => void}) {
  const t = useT();
  const longest = p.terms[p.terms.length - 1];
  const reason = t(elig.en, elig.fil).replace(/^(You qualify|Pasok ka): /, '');
  const badge = !elig.ok ? t('Not available yet', 'Hindi pa puwede') : elig.tone === 'ok' ? t('You qualify', 'Pasok ka') : t('You can apply', 'Puwede kang mag-apply');
  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <Ribbon stripes={p.ribbon} width={34} height={12} />
        <Txt variant="title" style={styles.shrink}>
          {p.name}
        </Txt>
      </View>
      <Txt variant="body" color="soft">
        {t(p.purpose, p.purposeFil)}
      </Txt>
      <Card tone="inset" pad={14} style={styles.facts}>
        <Fact label={t('Up to', 'Hanggang')} value={money(max, {whole: true})} />
        <Fact label={t('Interest', 'Interes')} value={perYear(p.rate, t)} />
        <Fact label={t('Pay in up to', 'Bayaran hanggang')} value={monthsText(longest, t)} />
      </Card>
      {p.id === 'POL' ? (
        <Txt variant="small" color="soft">
          {t('Your limit is 90% of your Equity Value.', 'Ang limit mo ay 90% ng iyong Equity Value.')}
        </Txt>
      ) : null}
      <View style={styles.elig}>
        <Badge tone={elig.ok ? elig.tone : 'bad'} label={badge} />
        <Txt variant="small">{reason}</Txt>
      </View>
      {elig.ok ? <Button title={t('Apply for this loan', 'Mag-apply sa loan na ito')} variant="secondary" iconRight="forward" onPress={onApply} accessibilityHint={p.name} testID={`apply-${p.id}`} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  shrink: {flexShrink: 1},
  top: {marginTop: 22},
  stack: {gap: 30, marginTop: 26},
  list: {gap: 14},
  subHead: {marginTop: 10},
  card: {gap: 10},
  pressed: {opacity: 0.86},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap'},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1},
  balance: {gap: 2, marginTop: 6},
  facts: {flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 14, marginTop: 4},
  link: {flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32, marginTop: 2},
  productsHead: {flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6},
  sample: {marginBottom: 14},
  elig: {gap: 8, marginTop: 2},
});
