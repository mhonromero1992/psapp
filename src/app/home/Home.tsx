import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useMemo} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {BladeMark, Ribbon, RIBBONS} from '../../components/brand/Brand';
import {Badge, Button, Card, ErrorState, Icon, LoadingBlock, money, ProgressBar, Screen, SectionHead, Txt, type IconName} from '../../components/ui';
import {AGENCY_BY_CODE, BENEFIT_BY_ID, LOAN_PRODUCT_BY_ID} from '../../data/reference';
import {useLang, useT} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {useDB} from '../../store/db';
import {useClaimsFor, useCoverage, useCurrentMember, useEquity, useLoansFor, useMemberNotifications, useSimulatedLoad} from '../../store/hooks';
import {openLink} from '../_layout';
import {StageBar} from '../claims/parts';
import {OPEN_CLAIM} from '../shared/claims';
import {nextDeduction, paidCount, PENDING_LOAN} from '../shared/loans';
import {RiseIn} from '../shared/RiseIn';
import {CLAIM_STATUS, LOAN_STATUS} from '../shared/status';
import {ASSIST_STATUS, assistText, monthYear, nowMs, relTime} from '../shared/text';

/** Brand art on the night band: a light green that reads at 11:1 on it. */
const ON_BAND_OK = '#5fd99a';

const WEEKDAYS = {en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], fil: ['Linggo', 'Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes', 'Sabado']};
const MONTHS = {en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], fil: ['Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo', 'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre']};

export default function Home() {
  const t = useT();
  const lang = useLang();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const member = useCurrentMember();
  const equity = useEquity(member);
  const coverage = useCoverage(member);
  const loans = useLoansFor(member.id);
  const claims = useClaimsFor(member.id);
  const notes = useMemberNotifications(member.id);
  const assist = useDB(s => s.assist);
  const markRead = useDB(s => s.markNotificationRead);
  const load = useSimulatedLoad();

  const now = new Date(nowMs());
  const hour = now.getHours();
  const greeting = hour < 12 ? t('Good morning', 'Magandang umaga') : hour < 18 ? t('Good afternoon', 'Magandang hapon') : t('Good evening', 'Magandang gabi');
  const today = `${WEEKDAYS[lang][now.getDay()]}, ${now.getDate()} ${MONTHS[lang][now.getMonth()]}`;

  const active = useMemo(() => loans.filter(l => l.status === 'released'), [loans]);
  const pending = useMemo(() => loans.filter(l => PENDING_LOAN.includes(l.status)), [loans]);
  const openClaims = useMemo(() => claims.filter(c => OPEN_CLAIM.includes(c.status)), [claims]);
  const openAssist = useMemo(() => assist.filter(a => a.memberId === member.id && a.status !== 'closed'), [assist, member.id]);
  const latest = useMemo(() => [...notes].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3), [notes]);
  const life = coverage.find(c => c.id === 'life');
  const lastYear = equity?.history.find(h => h.period === '2025-12');
  const addedThisYear = equity && lastYear ? equity.equityValue - lastYear.equity : 0;
  const asOf = equity?.history[equity.history.length - 1]?.period;

  const actions: {icon: IconName; en: string; fil: string; go: () => void}[] = [
    {icon: 'loans', en: 'Apply for a loan', fil: 'Mag-apply ng loan', go: () => nav.navigate('LoanApply')},
    {icon: 'claims', en: 'File a claim', fil: 'Mag-file ng claim', go: () => nav.navigate('ClaimNew')},
    {icon: 'payouts', en: 'Payouts', fil: 'Payouts', go: () => nav.navigate('Payouts')},
    {icon: 'assist', en: 'Legal & Travel', fil: 'Legal at Travel', go: () => nav.navigate('Assist')},
    {icon: 'branches', en: 'Branches', fil: 'Mga sangay', go: () => nav.navigate('Branches')},
    {icon: 'profile', en: 'My profile', fil: 'Aking profile', go: () => nav.navigate('Profile')},
  ];

  return (
    <Screen bar="tabs" tabs onRefresh={load.retry} refreshing={false}>
      <View style={styles.head}>
        <Txt variant="small" color="soft">
          {today}
        </Txt>
        <Txt variant="display" accessibilityRole="header">
          {greeting}, {member.firstName}
        </Txt>
        <View style={styles.idRow}>
          <Ribbon stripes={RIBBONS.member} />
          <Txt variant="small" color="soft">
            {member.rank} · {AGENCY_BY_CODE[member.agency].code}
          </Txt>
          <View style={[styles.chip, {backgroundColor: colors.panel2}]}>
            <Txt variant="smallStrong" color="soft">
              {member.id}
            </Txt>
          </View>
        </View>
      </View>

      {load.error ? (
        <ErrorState onRetry={load.retry} />
      ) : load.loading || !equity ? (
        <LoadingBlock />
      ) : (
        <View style={styles.stack}>
          {/* The signature: Equity Value on the night band. */}
          <RiseIn id="home-equity" index={0}>
            <Card tone="band" pad={22} style={styles.equity}>
              <View style={styles.blades} pointerEvents="none">
                <BladeMark size={220} opacity={0.14} />
              </View>
              <View style={styles.eqHead}>
                <Ribbon stripes={RIBBONS.equity} />
                <Txt variant="bodyStrong" color="onBand">
                  {t('Your Equity Value', 'Ang iyong Equity Value')}
                </Txt>
              </View>
              <Txt variant="small" color="onBandMuted">
                {asOf ? t(`As of ${monthYear(asOf, 'en')}`, `Hanggang ${monthYear(asOf, 'fil')}`) : ''}
              </Txt>
              <Txt variant="figure" color="onBand" style={styles.figure} accessibilityLabel={`${money(equity.equityValue)}`}>
                {money(equity.equityValue)}
              </Txt>
              {addedThisYear > 0 && (
                <View style={styles.added}>
                  <Icon name="trend" size={18} color={ON_BAND_OK} weight="bold" />
                  <Txt variant="smallStrong" style={styles.onBandOk}>
                    {t(`${money(addedThisYear)} added since January`, `${money(addedThisYear)} nadagdag mula Enero`)}
                  </Txt>
                </View>
              )}
              <View style={styles.eqRule} />
              <View style={styles.eqFacts}>
                <View style={styles.flex}>
                  <Txt variant="small" color="onBandMuted">
                    {t('Monthly contribution', 'Buwanang kontribusyon')}
                  </Txt>
                  <Txt variant="amount" color="onBand">
                    {money(equity.monthly)}
                  </Txt>
                  <Txt variant="small" color="onBandMuted">
                    {t('3% of base pay, by ATD (salary deduction)', '3% ng base pay, sa ATD (salary deduction)')}
                  </Txt>
                </View>
                <View style={styles.flex}>
                  <Txt variant="small" color="onBandMuted">
                    {t('Months contributed', 'Buwan ng kontribusyon')}
                  </Txt>
                  <Txt variant="amount" color="onBand">
                    {String(equity.months)}
                  </Txt>
                </View>
              </View>
              <Button title={t('View statement', 'Tingnan ang statement')} variant="light" iconRight="forward" block={false} onPress={() => nav.navigate('Main', {screen: 'Equity'})} style={styles.eqBtn} />
            </Card>
          </RiseIn>

          <RiseIn id="home-cover" index={1}>
            <Pressable onPress={() => nav.navigate('Main', {screen: 'Equity'})} accessibilityRole="button" accessibilityLabel={t(`You're covered. ${money(life?.amount ?? 0, {whole: true})} life insurance. See all your coverage`, `Protektado ka. ${money(life?.amount ?? 0, {whole: true})} life insurance. Tingnan ang lahat ng coverage`)}>
              <Card style={styles.cover}>
                <View style={styles.flex}>
                  <View style={styles.coverHead}>
                    <Icon name="shield" size={24} weight="duotone" color={colors.positive} />
                    <Txt variant="bodyStrong">{t("You're covered", 'Protektado ka')}</Txt>
                  </View>
                  <Txt variant="amountLarge">{money(life?.amount ?? 0, {whole: true})}</Txt>
                  <Txt variant="small" color="soft">
                    {t(`life insurance for your ${member.beneficiaries.length} beneficiaries`, `life insurance para sa iyong ${member.beneficiaries.length} beneficiary`)}
                  </Txt>
                  <Txt variant="smallStrong" color="primary">
                    {t('See all your coverage', 'Tingnan ang lahat ng coverage')}
                  </Txt>
                </View>
                <View style={[styles.disc, {backgroundColor: colors.tones.ok.bg}]}>
                  <Txt variant="amountLarge" color="ok">
                    {String(coverage.length)}
                  </Txt>
                  <Txt variant="smallStrong" color="ok">
                    {t('benefits', 'benepisyo')}
                  </Txt>
                </View>
              </Card>
            </Pressable>
          </RiseIn>

          <RiseIn id="home-actions" index={2}>
            <SectionHead title={t('What do you need today?', 'Ano ang kailangan mo ngayon?')} />
            <View style={styles.grid}>
              {actions.map(a => (
                <Pressable key={a.en} onPress={a.go} accessibilityRole="button" accessibilityLabel={t(a.en, a.fil)} style={({pressed}) => [styles.tile, {backgroundColor: pressed ? colors.panel2 : colors.panel}, colors.scheme === 'light' ? styles.tileShadow : {borderWidth: 1, borderColor: colors.line}]}>
                  <View style={[styles.tileIcon, {backgroundColor: colors.primarySoft}]}>
                    <Icon name={a.icon} size={28} weight="duotone" color={colors.primaryText} />
                  </View>
                  <Txt variant="bodyStrong">{t(a.en, a.fil)}</Txt>
                </Pressable>
              ))}
            </View>
          </RiseIn>

          {active.length + pending.length + openClaims.length + openAssist.length > 0 && (
            <RiseIn id="home-happening" index={3}>
              <SectionHead title={t("What's happening", 'Mga nangyayari')} />
              <View style={styles.stackSm}>
                {active.map(l => {
                  const p = LOAN_PRODUCT_BY_ID[l.productId];
                  const paid = paidCount(l);
                  return (
                    <Pressable key={l.id} onPress={() => nav.navigate('LoanDetail', {id: l.id})} accessibilityRole="button" accessibilityLabel={t(`${p.name}, payment ${paid} of ${l.termMonths}`, `${p.name}, bayad ${paid} sa ${l.termMonths}`)}>
                      <Card style={styles.gap}>
                        <View style={styles.rowBetween}>
                          <View style={styles.titleRow}>
                            <Ribbon stripes={p.ribbon} />
                            <Txt variant="bodyStrong">{p.name}</Txt>
                          </View>
                          <Badge tone={LOAN_STATUS[l.status].tone} label={t(LOAN_STATUS[l.status].en, LOAN_STATUS[l.status].fil)} />
                        </View>
                        <Txt variant="body">
                          {t(`Payment ${paid} of ${l.termMonths}`, `Bayad ${paid} sa ${l.termMonths}`)} · {money(l.monthly)} {t('a month', 'kada buwan')}
                        </Txt>
                        <ProgressBar value={paid} max={l.termMonths} label={t('Loan paid so far', 'Nabayaran na')} />
                        <Txt variant="small" color="soft">
                          {t(`Next deduction: your ${monthYear(nextDeduction(l, p.processingDays), 'en')} payroll`, `Susunod na bawas: sahod ng ${monthYear(nextDeduction(l, p.processingDays), 'fil')}`)}
                        </Txt>
                      </Card>
                    </Pressable>
                  );
                })}
                {pending.map(l => (
                  <Pressable key={l.id} onPress={() => nav.navigate('LoanDetail', {id: l.id})} accessibilityRole="button" accessibilityLabel={`${LOAN_PRODUCT_BY_ID[l.productId].name}, ${t(LOAN_STATUS[l.status].en, LOAN_STATUS[l.status].fil)}`}>
                    <Card style={styles.gap}>
                      <View style={styles.rowBetween}>
                        <Txt variant="bodyStrong">{LOAN_PRODUCT_BY_ID[l.productId].name}</Txt>
                        <Badge tone={LOAN_STATUS[l.status].tone} label={t(LOAN_STATUS[l.status].en, LOAN_STATUS[l.status].fil)} />
                      </View>
                      <Txt variant="body" color="soft">
                        {money(l.principal, {whole: true})} · {l.id}
                      </Txt>
                    </Card>
                  </Pressable>
                ))}
                {openClaims.map(c => {
                  return (
                    <Pressable key={c.id} onPress={() => nav.navigate('ClaimDetail', {id: c.id})} accessibilityRole="button" accessibilityLabel={`${BENEFIT_BY_ID[c.type].name}, ${t(CLAIM_STATUS[c.status].en, CLAIM_STATUS[c.status].fil)}`}>
                      <Card style={styles.gap}>
                        {/* Long benefit names: the status sits under the name, never squeezing it. */}
                        <View style={styles.gapXs}>
                          <Txt variant="bodyStrong">{t(BENEFIT_BY_ID[c.type].name, BENEFIT_BY_ID[c.type].nameFil)}</Txt>
                          <Badge tone={CLAIM_STATUS[c.status].tone} label={t(CLAIM_STATUS[c.status].en, CLAIM_STATUS[c.status].fil)} />
                        </View>
                        <StageBar status={c.status} />
                        <Txt variant="small" color="soft">
                          {c.id} · {money(c.amountClaimed)}
                        </Txt>
                      </Card>
                    </Pressable>
                  );
                })}
                {openAssist.map(a => (
                  <Pressable key={a.id} onPress={() => nav.navigate('Assist')} accessibilityRole="button" accessibilityLabel={assistText(a.topic, lang)}>
                    <Card style={styles.gap}>
                      <View style={styles.rowBetween}>
                        <View style={styles.titleRow}>
                          <Icon name={a.kind === 'travel' ? 'travel' : 'assist'} size={22} weight="duotone" color={colors.primaryText} />
                          <Txt variant="bodyStrong" style={styles.flex}>
                            {assistText(a.topic, lang)}
                          </Txt>
                        </View>
                      </View>
                      <Badge tone={ASSIST_STATUS[a.status].tone} label={t(ASSIST_STATUS[a.status].en, ASSIST_STATUS[a.status].fil)} />
                      {a.nextStep ? (
                        <Txt variant="small" color="soft">
                          {assistText(a.nextStep, lang)}
                        </Txt>
                      ) : null}
                    </Card>
                  </Pressable>
                ))}
              </View>
            </RiseIn>
          )}

          <RiseIn id="home-notes" index={4}>
            <SectionHead title={t('Latest updates', 'Mga bagong abiso')} action={<Button title={t('See all', 'Tingnan lahat')} variant="ghost" size="md" block={false} onPress={() => nav.navigate('Notifications')} />} />
            <Card pad={0}>
              {latest.map((n, i) => (
                <Pressable
                  key={n.id}
                  onPress={() => {
                    markRead(n.id);
                    openLink(n.link);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${n.read ? '' : t('New. ', 'Bago. ')}${t(n.title, n.titleFil)}`}
                  style={({pressed}) => [styles.note, i > 0 && {borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: colors.line}, pressed && {backgroundColor: colors.panel2}]}>
                  <View style={[styles.dot, !n.read && {backgroundColor: colors.primary}]} />
                  <View style={styles.flex}>
                    <Txt variant={n.read ? 'body' : 'bodyStrong'}>{t(n.title, n.titleFil)}</Txt>
                    <Txt variant="small" color="soft">
                      {relTime(n.at, lang)}
                    </Txt>
                  </View>
                </Pressable>
              ))}
            </Card>
          </RiseIn>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gapXs: {gap: 6},
  onBandOk: {color: ON_BAND_OK},
  flex: {flex: 1},
  head: {gap: 6, marginBottom: 20, marginTop: 4},
  idRow: {flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4},
  chip: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8},
  stack: {gap: 22},
  stackSm: {gap: 12},
  gap: {gap: 8},
  equity: {overflow: 'hidden', gap: 6},
  blades: {position: 'absolute', right: -60, top: -50},
  eqHead: {flexDirection: 'row', alignItems: 'center', gap: 10},
  figure: {marginTop: 6},
  added: {flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginTop: 4},
  eqRule: {height: 1, marginVertical: 12, backgroundColor: 'rgba(255,255,255,0.12)'},
  eqFacts: {flexDirection: 'row', gap: 16, flexWrap: 'wrap'},
  eqBtn: {marginTop: 14},
  cover: {flexDirection: 'row', alignItems: 'center', gap: 14},
  coverHead: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6},
  disc: {width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center'},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  tile: {width: '47.5%', flexGrow: 1, minHeight: 112, borderRadius: 18, padding: 14, gap: 10, justifyContent: 'space-between'},
  tileShadow: {shadowColor: '#071b37', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: {width: 0, height: 4}, elevation: 2},
  tileIcon: {width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap'},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1},
  note: {flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 16, paddingVertical: 12},
  dot: {width: 10, height: 10, borderRadius: 5},
});
