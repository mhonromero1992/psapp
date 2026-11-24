import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Button, Card, Divider, LangToggle, ListRow, Screen, SectionHead, SwitchRow, TextSizeControl, ThemeChoice, Txt, type IconName} from '../../components/ui';
import {useT} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {usePrefs} from '../../store/prefs';
import {useSession} from '../../store/session';
import {HelpLink} from '../shared/Help';

type Dest = 'Payouts' | 'Assist' | 'Branches' | 'Profile' | 'Notifications';

/** Everything that is not a tab, then how the app looks for you, then sign out. */
export default function More() {
  const t = useT();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const presenter = usePrefs(s => s.presenter);
  const setPresenter = usePrefs(s => s.setPresenter);
  const signOut = useSession(s => s.signOut);
  const items: {to: Dest; icon: IconName; en: string; fil: string; sub: [string, string]}[] = [
    {to: 'Payouts', icon: 'payouts', en: 'Payouts', fil: 'Payouts', sub: ['Where we send your money', 'Kung saan namin ipinapadala ang pera']},
    {to: 'Assist', icon: 'assist', en: 'Legal & Travel Assistance', fil: 'Legal at Travel Assistance', sub: ['Ask for legal or travel help', 'Humingi ng tulong legal o travel']},
    {to: 'Branches', icon: 'branches', en: 'Branches', fil: 'Mga sangay', sub: ['Offices near you and their hours', 'Mga opisina at oras nila']},
    {to: 'Profile', icon: 'profile', en: 'My profile', fil: 'Aking profile', sub: ['Membership card, details, PIN', 'Membership card, detalye, PIN']},
    {to: 'Notifications', icon: 'bell', en: 'Notifications', fil: 'Mga abiso', sub: ['Updates on your requests', 'Mga update sa iyong mga request']},
  ];
  return (
    <Screen bar="tabs" tabs title={t('More', 'Iba pa')}>
      <Card pad={0}>
        {items.map((it, i) => (
          <View key={it.to}>
            {i > 0 && <Divider />}
            <ListRow title={t(it.en, it.fil)} subtitle={t(it.sub[0], it.sub[1])} icon={it.icon} onPress={() => nav.navigate(it.to)} />
          </View>
        ))}
      </Card>

      <View style={styles.section}>
        <SectionHead title={t('How the app looks', 'Itsura ng app')} />
        <Card style={styles.gap}>
          <Txt variant="bodyStrong">{t('Text size', 'Laki ng letra')}</Txt>
          <TextSizeControl />
          <Divider />
          <View style={styles.row}>
            <Txt variant="bodyStrong">{t('Language', 'Wika')}</Txt>
            <LangToggle />
          </View>
          <Divider />
          <Txt variant="bodyStrong">{t('Screen', 'Screen')}</Txt>
          <ThemeChoice />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHead title={t('For demos', 'Para sa demo')} />
        <Card style={styles.gapSm}>
          <SwitchRow value={presenter} onChange={setPresenter} icon="presenter" label={t('Presenter tools', 'Presenter tools')} description={t('Move a loan or claim to its next step, as PSMBFI would.', 'Ilipat ang loan o claim sa susunod na hakbang, gaya ng gagawin ng PSMBFI.')} />
          <View style={[styles.note, {backgroundColor: colors.tones.warn.bg}]}>
            <Txt variant="small" color="warn">
              {t('This prototype runs on sample data. No real member records are used.', 'Ang prototype na ito ay gumagamit ng sample data. Walang totoong record ng miyembro.')}
            </Txt>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <HelpLink topic="Something else" />
        <Button title={t('Sign out', 'Mag-sign out')} icon="signOut" variant="quiet" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {marginTop: 26, gap: 10},
  gap: {gap: 14},
  gapSm: {gap: 8},
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  note: {borderRadius: 12, padding: 12},
});
