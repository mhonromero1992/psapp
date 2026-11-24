import React, {useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {BladeMark, Ribbon, RIBBONS} from '../../components/brand/Brand';
import {AreaChart, Button, Card, Divider, ErrorState, Icon, ListRow, LoadingBlock, money, Screen, SectionHead, Segmented, Txt, type IconName} from '../../components/ui';
import {memberName} from '../../data/generate';
import {AGENCY_BY_CODE} from '../../data/reference';
import type {Contribution} from '../../data/types';
import {date} from '../../lib/format';
import {useLang, useT} from '../../lib/i18n';
import {useContributions, useCoverage, useCurrentMember, useEquity, useSimulatedLoad} from '../../store/hooks';
import {HelpLink} from '../shared/Help';
import {coverageDetail, monthYear} from '../shared/text';
import {Figure, Meter, shareText, ShowMore, toCsv} from '../loans/parts';

type Range = '12m' | '5y' | 'all';
const STEP = 12;
const TOPIC = 'Equity Value and contributions';

const SHORT = {en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], fil: ['Ene', 'Peb', 'Mar', 'Abr', 'May', 'Hun', 'Hul', 'Ago', 'Set', 'Okt', 'Nob', 'Dis']};
/** "Oct ’26": short enough that the chart's axis labels never collide on a phone. */
const axisLabel = (period: string, lang: 'en' | 'fil') => `${SHORT[lang][Number(period.slice(5, 7)) - 1]} ’${period.slice(2, 4)}`;

const SOURCE: Record<Contribution['source'], [string, string]> = {
  ATD: ['ATD (salary deduction)', 'ATD (kaltas sa sahod)'],
  'Over the counter': ['Paid at a branch', 'Binayaran sa sangay'],
  Online: ['Paid online', 'Binayaran online'],
};

const COVER_ICON: Record<string, IconName> = {life: 'heart', kia: 'medal', add: 'wheelchair', wia: 'bandage', ahb: 'hospital', ihb: 'thermometer', dfi: 'users'};

/** Her Equity Value: the figure in plain words, how it grew, what it is made of, what it protects, every month. */
export default function Equity() {
  const t = useT();
  const lang = useLang();
  const {colors} = useTheme();
  const member = useCurrentMember();
  const equity = useEquity(member);
  const contributions = useContributions(member);
  const coverage = useCoverage(member);
  const load = useSimulatedLoad();
  const [range, setRange] = useState<Range>('5y');
  const [count, setCount] = useState(STEP);

  const rows = useMemo(() => [...contributions].reverse(), [contributions]);
  const hist = useMemo(() => {
    const h = equity?.history ?? [];
    // A year ago to now (13 points), five years, or every month since joining.
    return range === '12m' ? h.slice(-13) : range === '5y' ? h.slice(-60) : h;
  }, [equity, range]);

  const body = () => {
    if (load.error) {
      return <ErrorState onRetry={load.retry} helpTopic={TOPIC} />;
    }
    if (load.loading || !equity) {
      return <LoadingBlock />;
    }
    const last = equity.history[equity.history.length - 1];
    const credited = Math.round((equity.equityValue - equity.dividends) * 100) / 100;
    const since = monthYear(member.joinedAt.slice(0, 7), lang);
    const shown = rows.slice(0, count);

    const share = () => {
      const summary = [
        t('PS-ACCESS contribution statement (sample values)', 'Statement ng kontribusyon sa PS-ACCESS (sample na halaga)'),
        `${t('Member', 'Miyembro')}: ${memberName(member)} (${member.id})`,
        `${t('Agency', 'Ahensya')}: ${AGENCY_BY_CODE[member.agency].name}, ${member.unit}`,
        `${t('Statement as of', 'Hanggang')}: ${monthYear(last.period, lang)}`,
        `${t('Equity Value', 'Equity Value')}: ${money(equity.equityValue)}`,
        `${t('Total contributions', 'Kabuuang kontribusyon')}: ${money(equity.totalContributions)}`,
        `${t('Dividends credited', 'Dibidendong naipasok')}: ${money(equity.dividends)}`,
        `${t('Months contributed', 'Buwan ng kontribusyon')}: ${equity.months}`,
        `${t('Each month (3% of base pay)', 'Kada buwan (3% ng base pay)')}: ${money(equity.monthly)}`,
      ].join('\n');
      const csv = toCsv([
        [t('Month', 'Buwan'), t('Paid through', 'Paraan ng bayad'), t('Amount (PHP)', 'Halaga (PHP)'), t('Posted', 'Na-post'), t('Reference', 'Reference')],
        ...rows.map(c => [c.period, t(...SOURCE[c.source]), c.amount.toFixed(2), c.postedAt.slice(0, 10), c.reference]),
        [t('Total', 'Kabuuan'), '', equity.totalContributions.toFixed(2), '', ''],
      ]);
      shareText(t(`Contribution statement, ${monthYear(last.period, lang)}`, `Statement ng kontribusyon, ${monthYear(last.period, lang)}`), `${summary}\n\n${t('Contributions', 'Mga kontribusyon')}\n${csv}`, t);
    };

    return (
      <View style={styles.stack}>
        {/* The signature: the Equity Value on the night band, in plain words. */}
        <Card tone="band" pad={22} style={styles.hero}>
          <View style={styles.blades} pointerEvents="none">
            <BladeMark size={220} opacity={0.14} />
          </View>
          <View style={styles.heroHead}>
            <Ribbon stripes={RIBBONS.equity} />
            <Txt variant="smallStrong" color="onBandMuted" style={styles.shrink}>
              {t(`As of the ${monthYear(last.period, 'en')} posting`, `Hanggang sa posting ng ${monthYear(last.period, 'fil')}`)}
            </Txt>
          </View>
          <Txt variant="figure" color="onBand" style={styles.figure}>
            {money(equity.equityValue)}
          </Txt>
          <Txt variant="body" color="onBand">
            {t(
              'Your own share in the fund under the MEP (Members Equity Plan). It grows from the 3% of your base pay that is deducted every month by ATD (salary deduction).',
              'Ang sarili mong bahagi sa pondo sa ilalim ng MEP (Members Equity Plan). Lumalaki ito mula sa 3% ng iyong base pay na kinakaltas buwan-buwan sa ATD (kaltas sa sahod).',
            )}
          </Txt>
          <Txt variant="small" color="onBandMuted">
            {t('These are sample figures for this prototype.', 'Sample na halaga lang ang mga ito sa prototype.')}
          </Txt>
          <Button title={t('Share my statement', 'I-share ang aking statement')} icon="file" variant="light" onPress={share} style={styles.heroBtn} testID="equity-share" />
        </Card>

        <View>
          <SectionHead title={t('How has your Equity Value grown?', 'Paano lumaki ang iyong Equity Value?')} />
          <Card style={styles.card}>
            <Segmented
              label={t('How far back to show', 'Gaano katagal ang ipapakita')}
              value={range}
              onChange={setRange}
              options={[
                {value: '12m', label: t('12 months', '1 taon')},
                {value: '5y', label: t('5 years', '5 taon')},
                {value: 'all', label: t('All', 'Lahat')},
              ]}
            />
            <AreaChart
              labels={hist.map(h => axisLabel(h.period, lang))}
              series={[
                {key: 'equity', label: t('Equity Value', 'Equity Value'), slot: '2', values: hist.map(h => h.equity), area: true},
                {key: 'contributed', label: t('Total contributed', 'Kabuuang iniambag'), slot: 'ref', values: hist.map(h => h.contributed)},
              ]}
              format={v => money(v)}
              caption={t('Equity Value and total contributed over time', 'Equity Value at kabuuang iniambag sa paglipas ng panahon')}
            />
            <Txt variant="small" color="soft">
              {t('Touch and slide along the chart to read any month. Every month is also listed below.', 'Pindutin at i-slide sa chart para mabasa ang bawat buwan. Nakalista rin sa ibaba ang bawat buwan.')}
            </Txt>
          </Card>
        </View>

        <Card style={styles.card}>
          <View style={styles.facts}>
            <Figure label={t('Total contributions', 'Kabuuang kontribusyon')} value={money(equity.totalContributions)} hint={t(`since ${since}`, `mula ${since}`)} />
            <Figure label={t('Dividends credited', 'Dibidendong naipasok')} value={money(equity.dividends)} hint={t('4.5% a year (sample)', '4.5% kada taon (sample)')} />
            <Figure label={t('Months contributed', 'Buwan ng kontribusyon')} value={String(equity.months)} hint={member.missedMonths ? t(`${member.missedMonths} missed in the last year`, `${member.missedMonths} ang hindi nabayaran nitong taon`) : t('No missed months', 'Walang palya')} />
            <Figure label={t('Each month', 'Kada buwan')} value={money(equity.monthly)} hint={t(`3% of your ${money(member.basePay, {whole: true})} base pay`, `3% ng iyong ${money(member.basePay, {whole: true})} base pay`)} />
          </View>
          <Divider />
          <View style={styles.gap}>
            <Txt variant="heading">{t('How your Equity Value is built', 'Paano nabuo ang iyong Equity Value')}</Txt>
            <Txt variant="body" color="soft">
              {t(
                'In this sample, 60% of each contribution goes to your equity and earns a 4.5% dividend each year. The rest pays for your insurance cover.',
                'Sa sample na ito, 60% ng bawat kontribusyon ay napupunta sa iyong equity at kumikita ng 4.5% na dibidendo kada taon. Ang natitira ay pambayad sa iyong insurance cover.',
              )}
            </Txt>
            <Meter
              total={equity.equityValue}
              parts={[
                {key: 'credited', label: t('Contributions credited', 'Kontribusyong naipasok'), value: credited, color: colors.chart1},
                {key: 'dividends', label: t('Dividends earned', 'Dibidendong kinita'), value: equity.dividends, color: colors.chart2},
              ]}
            />
          </View>
        </Card>

        <View>
          <SectionHead title={t('What your membership covers', 'Ano ang sakop ng iyong membership')} />
          <Txt variant="body" color="soft" style={styles.lead}>
            {t(`${coverage.length} benefits while your contributions are up to date. Amounts are sample values.`, `${coverage.length} benepisyo habang updated ang iyong kontribusyon. Sample na halaga lang ang mga amount.`)}
          </Txt>
          <Card pad={0}>
            {coverage.map((c, i) => (
              <View key={c.id}>
                {i > 0 && <Divider />}
                <View style={styles.cover} accessible accessibilityLabel={`${t(c.label, c.labelFil)}, ${c.amount !== null ? money(c.amount, {whole: true}) : t('per schedule', 'ayon sa schedule')}. ${coverageDetail(c.id, c.detail, lang)}`}>
                  <View style={[styles.coverIcon, {backgroundColor: colors.tones.ok.bg}]}>
                    <Icon name={COVER_ICON[c.id] ?? 'shield'} size={22} weight="duotone" color={colors.tones.ok.text} />
                  </View>
                  <View style={styles.flex}>
                    <View style={styles.coverTop}>
                      <Txt variant="bodyStrong" style={styles.shrink}>
                        {t(c.label, c.labelFil)}
                      </Txt>
                      <Txt variant="amount">{c.amount !== null ? money(c.amount, {whole: true}) : t('Per schedule', 'Ayon sa schedule')}</Txt>
                    </View>
                    <Txt variant="small" color="soft">
                      {coverageDetail(c.id, c.detail, lang)}
                    </Txt>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </View>

        <View>
          <SectionHead title={t('Contributions', 'Mga kontribusyon')} count={rows.length} />
          <Txt variant="body" color="soft" style={styles.lead}>
            {t('Newest first. Each one is 3% of your base pay at the time.', 'Pinakabago muna. Bawat isa ay 3% ng iyong base pay noon.')}
          </Txt>
          <Card pad={0}>
            {shown.map((c, i) => (
              <View key={c.period}>
                {i > 0 && <Divider />}
                <ListRow
                  title={monthYear(c.period, lang)}
                  subtitle={`${t(...SOURCE[c.source])} · ${t(`posted ${date(c.postedAt)}`, `na-post ${date(c.postedAt)}`)}`}
                  right={<Txt variant="amount">{money(c.amount)}</Txt>}
                />
              </View>
            ))}
          </Card>
          <ShowMore shown={shown.length} total={rows.length} step={STEP} onMore={() => setCount(n => n + STEP)} noun={['months', 'buwan']} />
        </View>

        <HelpLink topic={TOPIC} />
      </View>
    );
  };

  return (
    <Screen bar="tabs" tabs onRefresh={load.retry} helpTopic={TOPIC} title={t('Equity Value', 'Equity Value')}>
      {body()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  shrink: {flexShrink: 1},
  stack: {gap: 28},
  hero: {overflow: 'hidden', gap: 10},
  blades: {position: 'absolute', right: -60, top: -50},
  heroHead: {flexDirection: 'row', alignItems: 'center', gap: 10},
  figure: {marginTop: 2},
  heroBtn: {marginTop: 8},
  card: {gap: 16},
  facts: {flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 18},
  gap: {gap: 10},
  lead: {marginTop: -4, marginBottom: 12},
  cover: {flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 16, paddingVertical: 14, minHeight: 68},
  coverIcon: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center'},
  coverTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 12, rowGap: 2},
});
