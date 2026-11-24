import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Ribbon} from '../../components/brand/Brand';
import {Badge, Button, Card, Divider, EmptyState, ErrorState, History, Icon, LoadingBlock, money, ProgressBar, Screen, SectionHead, Txt} from '../../components/ui';
import {memberName} from '../../data/generate';
import {LOAN_PRODUCT_BY_ID} from '../../data/reference';
import type {Loan, LoanProduct, LoanStatus} from '../../data/types';
import {date, dateTime} from '../../lib/format';
import {useLang, useT, type TFn} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {useDB} from '../../store/db';
import {useCurrentMember, useSimulatedLoad} from '../../store/hooks';
import {HelpLink} from '../shared/Help';
import {finalDeduction, firstDeduction, loanUpcoming, nextDeduction, paidCount, scheduleFor, type ScheduleRow} from '../shared/loans';
import {LOAN_STATUS} from '../shared/status';
import {localTimeline, monthYear} from '../shared/text';
import {AccountMark, Figure, monthsText, Note, perYear, shareText, ShowMore, toCsv, workingDays} from './parts';

const STEP = 12;

/** What is happening with the loan, in one plain sentence per status. */
function headline(l: Loan, p: LoanProduct, t: TFn): [string, string] {
  const to = l.payoutLabel;
  const map: Record<LoanStatus, [string, string]> = {
    submitted: [t('We received your application', 'Natanggap namin ang iyong application'), t(`We review applications within ${workingDays(p.processingDays, t)}.`, `Sinusuri namin ang application sa loob ng ${workingDays(p.processingDays, t)}.`)],
    evaluation: [t('We are checking your application', 'Sinusuri namin ang iyong application'), t('A loans officer is looking at your records and payslip.', 'Tinitingnan ng loans officer ang iyong record at payslip.')],
    approved: [t('Your loan is approved', 'Aprubado na ang iyong loan'), t(`The money will be sent to ${to}.`, `Ipapadala ang pera sa ${to}.`)],
    for_release: [t('We are sending the money', 'Ipinapadala na namin ang pera'), t(`It goes to ${to}, usually within 1 working day.`, `Mapupunta ito sa ${to}, kadalasan sa loob ng 1 araw ng trabaho.`)],
    released: [t('Your loan is active', 'Aktibo ang iyong loan'), t('Payments are deducted from your pay every month through ATD (salary deduction).', 'Kinakaltas ang hulog sa sahod mo buwan-buwan sa ATD (kaltas sa sahod).')],
    paid: [t('This loan is fully paid', 'Bayad na nang buo ang loan na ito'), t('Thank you. There is nothing more to pay.', 'Salamat. Wala ka nang babayaran.')],
    returned: [t('Your application needs a correction', 'May kailangang itama sa iyong application'), t('Read the note below, then send the correction through your branch.', 'Basahin ang tala sa ibaba, saka ipadala ang pagtatama sa iyong sangay.')],
    rejected: [t('Your loan was not approved', 'Hindi naaprubahan ang iyong loan'), t('The reason is below. You can ask us to call you about it.', 'Nasa ibaba ang dahilan. Puwede kang humiling na tawagan ka namin tungkol dito.')],
  };
  return map[l.status];
}

/** One loan: where it is, the amounts, its history, where the money goes, and every payment. */
export default function LoanDetail() {
  const t = useT();
  const lang = useLang();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {id} = useRoute<RouteProp<RootStackParamList, 'LoanDetail'>>().params;
  const member = useCurrentMember();
  const loans = useDB(s => s.loans);
  const loan = useMemo(() => loans.find(l => l.id === id && l.memberId === member.id), [loans, id, member.id]);
  const load = useSimulatedLoad();
  const [count, setCount] = useState(STEP);

  const p = loan ? LOAN_PRODUCT_BY_ID[loan.productId] : null;
  const schedule = useMemo(() => (loan && p ? scheduleFor(loan, p.processingDays) : []), [loan, p]);

  if (load.error || load.loading || !loan || !p) {
    return (
      <Screen helpTopic="Loans" title={t('Loan details', 'Detalye ng loan')}>
        {load.error ? (
          <ErrorState onRetry={load.retry} helpTopic="Loans" />
        ) : load.loading ? (
          <LoadingBlock />
        ) : (
          <Card>
            <EmptyState
              title={t("We can't find this loan", 'Hindi namin makita ang loan na ito')}
              body={t(`There is no loan ${id} on your record. It may have a different reference number.`, `Walang loan na ${id} sa iyong record. Baka iba ang reference number nito.`)}
              action={
                <>
                  <Button title={t('Go to my loans', 'Pumunta sa aking mga loan')} icon="loans" onPress={() => nav.popTo('Main', {screen: 'Loans'})} />
                  <HelpLink topic="Loans" />
                </>
              }
            />
          </Card>
        )}
      </Screen>
    );
  }

  const s = LOAN_STATUS[loan.status];
  const [head, sub] = headline(loan, p, t);
  const paid = paidCount(loan);
  const released = loan.status === 'released';
  const estimate = !released && loan.status !== 'paid';
  const account = member.payoutAccounts.find(a => a.id === loan.payoutAccountId);
  const events = localTimeline(loan.timeline, lang);
  const upcoming = loanUpcoming(loan, p, t, lang);
  const totalInterest = Math.round(schedule.reduce((sum, r) => sum + r.interest, 0) * 100) / 100;
  const shown = schedule.slice(0, count);
  const lastNote = [...events].reverse().find(e => e.note && (loan.status === 'returned' || loan.status === 'rejected'))?.note;

  const share = () => {
    const stateWord = (r: ScheduleRow) => (r.state === 'paid' ? t('Deducted', 'Naikaltas na') : r.state === 'next' ? t('Next', 'Susunod') : estimate ? t('Estimate', 'Tantya') : t('Scheduled', 'Nakatakda'));
    const lines = [
      t('PS-ACCESS loan summary (sample values)', 'Buod ng loan sa PS-ACCESS (sample na halaga)'),
      `${t('Member', 'Miyembro')}: ${memberName(member)} (${member.id})`,
      `${t('Loan', 'Loan')}: ${p.name} ${loan.id}`,
      `${t('Status', 'Status')}: ${t(s.en, s.fil)}`,
      `${t('Applied', 'Nag-apply')}: ${date(loan.appliedAt)}`,
      `${t('Amount borrowed', 'Hiniram')}: ${money(loan.principal)}`,
      `${t('Interest', 'Interes')}: ${perYear(loan.rate, t)}`,
      `${t('Months to pay', 'Ilang buwan')}: ${loan.termMonths}`,
      `${t('Each month', 'Kada buwan')}: ${money(loan.monthly)}`,
      `${t('Payments made', 'Nabayarang hulog')}: ${paid} / ${loan.termMonths}`,
      `${t('Left to pay', 'Natitirang babayaran')}: ${money(loan.status === 'paid' ? 0 : loan.balance)}`,
      `${t('Money sent to', 'Ipinadala sa')}: ${loan.payoutLabel}`,
      `${t('Purpose', 'Layunin')}: ${loan.purpose}`,
    ].join('\n');
    const table =
      loan.status === 'rejected'
        ? ''
        : `\n\n${estimate ? t('Estimated payment schedule', 'Tantyang iskedyul ng hulog') : t('Payment schedule', 'Iskedyul ng hulog')}\n` +
          toCsv([
            [t('No.', 'Blg.'), t('Payroll month', 'Buwan ng sahod'), t('Payment (PHP)', 'Hulog (PHP)'), t('Interest (PHP)', 'Interes (PHP)'), t('Principal (PHP)', 'Principal (PHP)'), t('Balance after (PHP)', 'Balanse pagkatapos (PHP)'), t('Status', 'Status')],
            ...schedule.map(r => [r.no, r.period, r.payment.toFixed(2), r.interest.toFixed(2), r.principal.toFixed(2), r.balance.toFixed(2), stateWord(r)]),
          ]);
    shareText(t(`Loan summary ${loan.id}`, `Buod ng loan ${loan.id}`), lines + table, t);
  };

  return (
    <Screen
      helpTopic="Loans"
      lead={
        <View style={styles.lead}>
          <Ribbon stripes={p.ribbon} width={34} height={12} />
          <Txt variant="smallStrong" color="soft">
            {loan.id}
          </Txt>
        </View>
      }
      title={p.name}>
      <View style={styles.stack}>
        <View style={styles.status}>
          <View style={styles.statusRow}>
            <Badge tone={s.tone} label={t(s.en, s.fil)} />
            <Txt variant="small" color="soft">
              {t(`Applied ${date(loan.appliedAt)}`, `Nag-apply noong ${date(loan.appliedAt)}`)}
            </Txt>
          </View>
          <Txt variant="heading" accessibilityRole="header">
            {head}
          </Txt>
          <Txt variant="body" color="soft">
            {sub}
          </Txt>
          {lastNote ? <Note tone={loan.status === 'returned' ? 'warn' : 'bad'}>{lastNote}</Note> : null}
        </View>

        <Card style={styles.card}>
          <View>
            <Txt variant="smallStrong" color="soft">
              {released ? t('Left to pay', 'Natitirang babayaran') : loan.status === 'paid' ? t('Fully paid', 'Bayad na nang buo') : t('Amount you asked for', 'Halagang hiniling mo')}
            </Txt>
            <Txt variant="figure">{money(released ? loan.balance : loan.principal)}</Txt>
          </View>
          {released || loan.status === 'paid' ? (
            <View style={styles.gapSm}>
              <View style={styles.rowBetween}>
                <Txt variant="bodyStrong" style={styles.shrink}>
                  {t(`Payment ${paid} of ${loan.termMonths} made`, `Hulog ${paid} sa ${loan.termMonths} ang nabayaran`)}
                </Txt>
                <Txt variant="smallStrong" color="soft">{`${Math.round((paid / loan.termMonths) * 100)}%`}</Txt>
              </View>
              <ProgressBar value={paid} max={loan.termMonths} tone={loan.status === 'paid' ? 'positive' : 'primary'} label={t(`${paid} of ${loan.termMonths} payments made`, `${paid} sa ${loan.termMonths} hulog ang nabayaran`)} />
            </View>
          ) : null}
          <Card tone="inset" pad={14} style={styles.facts}>
            <Figure label={t('Borrowed', 'Hiniram')} value={money(loan.principal)} />
            <Figure label={estimate ? t('Each month (estimate)', 'Kada buwan (tantya)') : t('Each month', 'Kada buwan')} value={money(loan.monthly)} />
            <Figure label={t('Interest', 'Interes')} value={perYear(loan.rate, t)} hint={t(`${money(totalInterest)} in total`, `${money(totalInterest)} lahat`)} />
            <Figure label={t('Months to pay', 'Ilang buwan')} value={monthsText(loan.termMonths, t)} />
            {released ? <Figure label={t('Next deduction', 'Susunod na kaltas')} value={monthYear(nextDeduction(loan, p.processingDays), lang)} hint={t('from your pay', 'sa iyong sahod')} /> : null}
            {released || loan.status === 'paid' ? <Figure label={t('Last payment', 'Huling hulog')} value={monthYear(finalDeduction(loan, p.processingDays), lang)} /> : null}
            {estimate && loan.status !== 'rejected' ? <Figure label={t('First deduction (estimate)', 'Unang kaltas (tantya)')} value={monthYear(firstDeduction(loan, p.processingDays), lang)} /> : null}
          </Card>
        </Card>

        <View>
          <SectionHead title={t('History', 'Kasaysayan')} />
          <Card>
            <History events={events} upcoming={upcoming} format={dateTime} />
          </Card>
        </View>

        <View>
          <SectionHead title={t('Where the money goes', 'Saan ipapadala ang pera')} />
          <Card style={styles.card}>
            {account ? (
              <AccountMark account={account} />
            ) : (
              <View style={styles.statusRow}>
                <Icon name="coins" size={26} weight="duotone" color={colors.primaryText} />
                <Txt variant="bodyStrong">{loan.payoutLabel}</Txt>
              </View>
            )}
            <Txt variant="body" color="soft">
              {loan.releasedAt
                ? t(`${money(loan.principal)} was sent on ${date(loan.releasedAt)}.`, `Naipadala ang ${money(loan.principal)} noong ${date(loan.releasedAt)}.`)
                : loan.status === 'rejected'
                ? t('No money was sent because the loan was not approved.', 'Walang naipadalang pera dahil hindi naaprubahan ang loan.')
                : t('The money is sent here once the loan is approved.', 'Ipapadala rito ang pera kapag naaprubahan ang loan.')}
            </Txt>
            <Divider />
            <View style={styles.gapXs}>
              <Txt variant="smallStrong" color="soft">
                {t('What the loan is for', 'Para saan ang loan')}
              </Txt>
              <Txt variant="body">{loan.purpose}</Txt>
            </View>
          </Card>
        </View>

        {loan.status !== 'rejected' ? (
          <View>
            <SectionHead title={estimate ? t('Estimated payment schedule', 'Tantyang iskedyul ng hulog') : t('Payment schedule', 'Iskedyul ng hulog')} count={schedule.length} />
            <Txt variant="body" color="soft" style={styles.schedNote}>
              {t('Each payment is deducted from your pay through ATD (salary deduction).', 'Ikinakaltas ang bawat hulog sa sahod mo sa ATD (kaltas sa sahod).')}
            </Txt>
            <Card pad={0}>
              {shown.map((r, i) => (
                <View key={r.no}>
                  {i > 0 && <Divider />}
                  <ScheduleLine row={r} estimate={estimate} />
                </View>
              ))}
            </Card>
            <ShowMore shown={shown.length} total={schedule.length} step={STEP} onMore={() => setCount(c => c + STEP)} noun={['payments', 'hulog']} />
          </View>
        ) : null}

        <View style={styles.gap}>
          <Button title={t('Share loan summary', 'I-share ang buod ng loan')} icon="file" variant="secondary" onPress={share} testID="loan-share" />
          <Txt variant="small" color="soft">
            {t('Send it to your email or messages, or save it as a file. The amounts are sample values.', 'Ipadala sa email o messages, o i-save bilang file. Sample na halaga lang ang mga amount.')}
          </Txt>
        </View>
        <HelpLink topic="Loans" />
      </View>
    </Screen>
  );
}

/** One payment: when, how much, and whether it is already deducted. */
function ScheduleLine({row, estimate}: {row: ScheduleRow; estimate: boolean}) {
  const t = useT();
  const lang = useLang();
  const {colors} = useTheme();
  const state = row.state === 'paid' ? t('Deducted', 'Naikaltas na') : row.state === 'next' ? t('Next', 'Susunod') : estimate ? t('Estimate', 'Tantya') : t('Scheduled', 'Nakatakda');
  return (
    <View
      style={[styles.line, row.state === 'next' && {backgroundColor: colors.primarySoft}]}
      accessible
      accessibilityLabel={`${t(`Payment ${row.no}`, `Hulog ${row.no}`)}, ${monthYear(row.period, lang)}, ${money(row.payment)}, ${state}. ${t(`Balance after: ${money(row.balance)}`, `Balanse pagkatapos: ${money(row.balance)}`)}`}>
      <View style={styles.lineRow}>
        <Txt variant="bodyStrong" style={styles.shrink}>
          {t(`Payment ${row.no}`, `Hulog ${row.no}`)} · {monthYear(row.period, lang)}
        </Txt>
        <Txt variant="amount">{money(row.payment)}</Txt>
      </View>
      <View style={styles.lineRow}>
        <Txt variant="small" color="soft" style={styles.shrink}>
          {t(`Balance after: ${money(row.balance)}`, `Balanse pagkatapos: ${money(row.balance)}`)}
        </Txt>
        {row.state === 'paid' ? (
          <Badge tone="ok" label={state} />
        ) : row.state === 'next' ? (
          <Badge tone="info" label={state} />
        ) : (
          <Txt variant="small" color="soft">
            {state}
          </Txt>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  shrink: {flexShrink: 1},
  lead: {flexDirection: 'row', alignItems: 'center', gap: 10},
  stack: {gap: 26},
  status: {gap: 8, marginTop: -8},
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap'},
  card: {gap: 14},
  gap: {gap: 8},
  gapSm: {gap: 8},
  gapXs: {gap: 2},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap'},
  facts: {flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 14},
  schedNote: {marginTop: -4, marginBottom: 12},
  line: {gap: 4, minHeight: 64, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center'},
  lineRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 12, rowGap: 4, flexWrap: 'wrap'},
});
