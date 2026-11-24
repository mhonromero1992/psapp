import React, {useMemo, useState} from 'react';
import {Linking, Pressable, StyleSheet, TextInput, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Button, Card, EmptyState, ErrorState, Icon, LoadingBlock, Screen, SectionHead, Txt} from '../../components/ui';
import {OFFICES} from '../../data/reference';
import type {Office} from '../../data/types';
import {useT, type TFn} from '../../lib/i18n';
import {useDB} from '../../store/db';
import {useCurrentMember, useSimulatedLoad} from '../../store/hooks';
import {toast} from '../../store/ui';
import {HelpLink} from '../shared/Help';

const ISLANDS: {en: string; fil: string; regions: string[]}[] = [
  {en: 'Luzon', fil: 'Luzon', regions: ['NCR', 'Ilocos', 'CAR', 'Cagayan Valley', 'Central Luzon', 'CALABARZON', 'Bicol']},
  {en: 'Visayas', fil: 'Visayas', regions: ['Western Visayas', 'Central Visayas', 'Eastern Visayas']},
  {en: 'Mindanao', fil: 'Mindanao', regions: ['Zamboanga Peninsula', 'Northern Mindanao', 'Davao', 'SOCCSKSARGEN', 'Caraga']},
];

/** Brand art on the night band. */
const ON_BAND_OK = '#5fd99a';

const mapsUrl = (o: Office) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.street}, ${o.city}`)}`;
const hoursText = (h: string, t: TFn) => t(h, h.replace('Mon to Fri', 'Lunes hanggang Biyernes').replace(' to ', ' hanggang '));

/** Your branch first, then every office by island group, with a search that forgives typos in case. */
export default function Branches() {
  const t = useT();
  const {colors, type} = useTheme();
  const member = useCurrentMember();
  const updateMember = useDB(s => s.updateMember);
  const load = useSimulatedLoad(350);
  const [q, setQ] = useState('');
  const mine = OFFICES.find(o => o.id === member.officeId) ?? OFFICES[0];

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    const match = (o: Office) => !s || [o.name, o.city, o.region, o.street].some(x => x.toLowerCase().includes(s));
    return ISLANDS.map(g => ({...g, offices: OFFICES.filter(o => g.regions.includes(o.region) && match(o))})).filter(g => g.offices.length > 0);
  }, [q]);

  const directions = (o: Office) =>
    Linking.openURL(mapsUrl(o)).catch(() => toast(t('Maps could not open', 'Hindi mabuksan ang Maps'), 'warn', `${o.street}, ${o.city}`));

  const choose = (o: Office) => {
    updateMember(member.id, {officeId: o.id});
    toast(t(`${o.name} is now your branch`, `${o.name} na ang iyong sangay`));
  };

  return (
    <Screen
      title={t('Branches', 'Mga sangay')}
      subtitle={t(
        'Visit any PSMBFI office from Monday to Friday. Bring a valid ID. RSO means regional service office.',
        'Bumisita sa alinmang PSMBFI office mula Lunes hanggang Biyernes. Magdala ng valid ID. Ang RSO ay regional service office.',
      )}
      helpTopic="Something else">
      {load.loading ? (
        <LoadingBlock />
      ) : load.error ? (
        <ErrorState onRetry={load.retry} helpTopic="Something else" />
      ) : (
        <>
          {/* Your branch first */}
          <Card tone="band" pad={20} style={styles.gap}>
            <View style={styles.row}>
              <Icon name="checkCircle" size={20} weight="fill" color={ON_BAND_OK} />
              <Txt variant="smallStrong" color="onBandMuted">
                {t('Your branch', 'Ang iyong sangay')}
              </Txt>
            </View>
            <Txt variant="display" color="onBand" accessibilityRole="header">
              {mine.name}
            </Txt>
            <View style={styles.rowTop}>
              <Icon name="branches" size={22} weight="duotone" color={colors.onBand} />
              <Txt variant="body" color="onBand" style={styles.flex}>
                {mine.street}, {mine.city}
              </Txt>
            </View>
            <View style={styles.rowTop}>
              <Icon name="clock" size={22} weight="duotone" color={colors.onBand} />
              <Txt variant="body" color="onBand" style={styles.flex}>
                {hoursText(mine.hours, t)}
              </Txt>
            </View>
            <Button title={t('Get directions', 'Paano pumunta')} icon="directions" variant="light" onPress={() => directions(mine)} />
          </Card>

          {/* Search: a plain field with a clear button, no filters to learn. */}
          <View style={styles.search}>
            <Txt variant="label">{t('Search branches by city or region', 'Hanapin ang sangay ayon sa lungsod o rehiyon')}</Txt>
            <View style={[styles.searchBox, {backgroundColor: colors.panel, borderColor: colors.lineStrong}]}>
              <Icon name="search" size={22} color={colors.textMuted} weight="bold" />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder={t('City or region', 'Lungsod o rehiyon')}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel={t('Search branches by city or region', 'Hanapin ang sangay ayon sa lungsod o rehiyon')}
                autoCorrect={false}
                returnKeyType="search"
                maxFontSizeMultiplier={1.6}
                style={[styles.flex, type.body, styles.searchInput, {color: colors.text}]}
              />
              {q ? (
                <Pressable onPress={() => setQ('')} accessibilityRole="button" accessibilityLabel={t('Clear the search', 'Burahin ang hinahanap')} style={({pressed}) => [styles.clear, pressed && {backgroundColor: colors.panel2}]}>
                  <Icon name="close" size={20} weight="bold" />
                </Pressable>
              ) : null}
            </View>
          </View>

          {groups.length === 0 ? (
            <Card style={styles.empty}>
              <EmptyState
                title={t(`No branch matches "${q.trim()}"`, `Walang sangay na tugma sa "${q.trim()}"`)}
                body={t('Try the name of your province or city.', 'Subukan ang pangalan ng probinsya o lungsod.')}
                action={<Button title={t('Show all branches', 'Ipakita lahat ng sangay')} variant="quiet" onPress={() => setQ('')} />}
              />
            </Card>
          ) : (
            groups.map(g => (
              <View key={g.en} style={styles.section}>
                <SectionHead title={t(g.en, g.fil)} count={g.offices.length} />
                {g.offices.map(o => {
                  const isMine = o.id === mine.id;
                  return (
                    <Card key={o.id} style={[styles.office, isMine && [styles.ring, {borderColor: colors.primary}]]}>
                      <View style={styles.gapXs}>
                        <Txt variant="heading">{o.name}</Txt>
                        <Txt variant="body" color="soft">
                          {o.street}, {o.city}
                        </Txt>
                        <Txt variant="small" color="soft">
                          {hoursText(o.hours, t)}
                        </Txt>
                      </View>
                      <Button title={t('Get directions', 'Paano pumunta')} icon="directions" variant="quiet" size="md" onPress={() => directions(o)} />
                      {isMine ? (
                        <View style={[styles.mine, {backgroundColor: colors.primarySoft}]} accessible accessibilityLabel={t('This is your branch', 'Ito ang iyong sangay')}>
                          <Icon name="checkCircle" size={20} weight="fill" color={colors.primaryText} />
                          <Txt variant="bodyStrong" color="primary">
                            {t('Your branch', 'Iyong sangay')}
                          </Txt>
                        </View>
                      ) : (
                        <Button title={t('Make this my branch', 'Gawin itong aking sangay')} variant="secondary" size="md" onPress={() => choose(o)} />
                      )}
                    </Card>
                  );
                })}
              </View>
            ))
          )}
          <View style={styles.section}>
            <HelpLink topic="Something else" />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  gap: {gap: 12},
  gapXs: {gap: 4},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8},
  rowTop: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  search: {marginTop: 26, gap: 8},
  searchBox: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, borderWidth: 1.5, borderRadius: 14, paddingLeft: 16, paddingRight: 4},
  searchInput: {paddingVertical: 12},
  clear: {width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center'},
  empty: {marginTop: 18},
  section: {marginTop: 26, gap: 12},
  office: {gap: 12},
  ring: {borderWidth: 2},
  mine: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 14},
});
