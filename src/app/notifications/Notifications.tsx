import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Button, Card, EmptyState, ErrorState, Icon, LoadingBlock, Screen, SectionHead, Segmented, Txt, type IconName} from '../../components/ui';
import type {Tone} from '../../config/theme';
import type {AppNotification} from '../../data/types';
import {useLang, useT, type Lang} from '../../lib/i18n';
import {useDB} from '../../store/db';
import {useCurrentMember, useMemberNotifications, useSimulatedLoad} from '../../store/hooks';
import {toast} from '../../store/ui';
import {openLink} from '../_layout';
import {HelpLink} from '../shared/Help';
import {relTime} from '../shared/text';

type Filter = 'all' | 'new';

const TONE: Record<AppNotification['tone'], {icon: IconName; tone: Tone}> = {
  info: {icon: 'info', tone: 'info'},
  positive: {icon: 'checkCircle', tone: 'ok'},
  caution: {icon: 'warning', tone: 'warn'},
  negative: {icon: 'warning', tone: 'bad'},
};

const ACRONYMS: [RegExp, string, string][] = [
  [/\bIHB\b(?! \()/, 'IHB (illness hospitalization benefit)', 'IHB (benepisyo sa pagka-ospital dahil sa sakit)'],
  [/\bAHB\b(?! \()/, 'AHB (accident hospitalization benefit)', 'AHB (benepisyo sa pagka-ospital dahil sa aksidente)'],
  [/\bATD\b(?! \()(?!\))/, 'ATD (salary deduction)', 'ATD (kaltas sa sahod)'],
];
/** Spells out an acronym the first time it appears in a piece of text. */
function explainAcronyms(text: string, lang: Lang) {
  let out = text;
  for (const [re, en, fil] of ACRONYMS) {
    out = out.replace(re, lang === 'fil' ? fil : en);
  }
  return out;
}

/** Everything PSMBFI told the member, newest first. Tapping one marks it read and opens it. */
export default function Notifications() {
  const t = useT();
  const member = useCurrentMember();
  const notes = useMemberNotifications(member.id);
  const markAllRead = useDB(s => s.markAllRead);
  const load = useSimulatedLoad();
  const [filter, setFilter] = useState<Filter>('all');

  const sorted = useMemo(() => [...notes].sort((a, b) => b.at.localeCompare(a.at)), [notes]);
  const unread = useMemo(() => sorted.filter(n => !n.read), [sorted]);
  const read = useMemo(() => sorted.filter(n => n.read), [sorted]);

  const markAll = () => {
    markAllRead('member', member.id);
    toast(t('All notifications marked as read', 'Namarkahang nabasa ang lahat ng abiso'), 'ok');
  };

  return (
    <Screen
      helpTopic="Something else"
      onRefresh={load.retry}
      title={t('Notifications', 'Mga abiso')}
      subtitle={
        unread.length === 0
          ? t("You're all caught up.", 'Nabasa mo na lahat.')
          : unread.length === 1
          ? t('You have 1 new notification. Tap it to open it.', 'May 1 kang bagong abiso. I-tap ito para buksan.')
          : t(`You have ${unread.length} new notifications. Tap one to open it.`, `May ${unread.length} kang bagong abiso. I-tap ang isa para buksan.`)
      }>
      {load.error ? (
        <ErrorState onRetry={load.retry} helpTopic="Something else" />
      ) : load.loading ? (
        <LoadingBlock />
      ) : (
        <View style={styles.stack}>
          <Segmented
            label={t('Show', 'Ipakita')}
            value={filter}
            onChange={setFilter}
            options={[
              {value: 'all', label: t(`All (${sorted.length})`, `Lahat (${sorted.length})`)},
              {value: 'new', label: t(`New (${unread.length})`, `Bago (${unread.length})`)},
            ]}
          />

          {sorted.length === 0 ? (
            <Card>
              <EmptyState
                title={t('No notifications yet', 'Wala pang abiso')}
                body={t('We will tell you here when your loans, claims or contributions change.', 'Sasabihan ka namin dito kapag may pagbabago sa iyong loan, claim o kontribusyon.')}
                action={
                  <View style={styles.center}>
                    <HelpLink topic="Something else" />
                  </View>
                }
              />
            </Card>
          ) : filter === 'new' && unread.length === 0 ? (
            <Card>
              <EmptyState
                title={t('No new notifications', 'Walang bagong abiso')}
                body={t('You have read everything. Choose All to see older notifications.', 'Nabasa mo na lahat. Piliin ang Lahat para makita ang mga lumang abiso.')}
                action={<Button title={t('Show all notifications', 'Ipakita ang lahat ng abiso')} variant="quiet" onPress={() => setFilter('all')} />}
              />
            </Card>
          ) : (
            <>
              {unread.length > 0 ? (
                <Group
                  title={t('New', 'Bago')}
                  items={unread}
                  action={<Button title={t('Mark all as read', 'Markahang nabasa lahat')} icon="check" variant="ghost" size="md" block={false} onPress={markAll} testID="notes-mark-all" />}
                />
              ) : null}
              {filter === 'all' && read.length > 0 ? <Group title={t('Earlier', 'Nakaraan')} items={read} /> : null}
            </>
          )}

          {sorted.length > 0 ? <HelpLink topic="Something else" /> : null}
        </View>
      )}
    </Screen>
  );
}

function Group({title, items, action}: {title: string; items: AppNotification[]; action?: React.ReactNode}) {
  return (
    <View>
      <SectionHead title={title} count={items.length} action={action} />
      <Card pad={0} style={styles.clip}>
        {items.map((n, i) => (
          <NotificationRow key={n.id} n={n} first={i === 0} />
        ))}
      </Card>
    </View>
  );
}

/** One notification: tapping marks it read and opens what it is about. */
function NotificationRow({n, first}: {n: AppNotification; first: boolean}) {
  const t = useT();
  const lang = useLang();
  const {colors} = useTheme();
  const markRead = useDB(s => s.markNotificationRead);
  const tone = TONE[n.tone];
  const title = explainAcronyms(lang === 'fil' && n.titleFil ? n.titleFil : n.title, lang);
  const body = explainAcronyms(lang === 'fil' && n.bodyFil ? n.bodyFil : n.body, lang);
  const when = relTime(n.at, lang);
  return (
    <Pressable
      onPress={() => {
        if (!n.read) {
          markRead(n.id);
        }
        if (n.link) {
          openLink(n.link);
        }
      }}
      accessibilityRole="button"
      accessibilityLabel={`${n.read ? '' : t('New. ', 'Bago. ')}${title}. ${body}. ${when}`}
      testID={`note-${n.id}`}
      style={({pressed}) => [styles.row, !first && {borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: colors.line}, !n.read && {backgroundColor: colors.primarySoft}, pressed && {backgroundColor: colors.panel2}]}>
      <View style={[styles.disc, {backgroundColor: !n.read && tone.tone === 'info' ? colors.panel : colors.tones[tone.tone].bg}]}>
        <Icon name={tone.icon} size={22} weight="duotone" color={colors.tones[tone.tone].text} />
      </View>
      <View style={styles.text}>
        <Txt variant={n.read ? 'body' : 'bodyStrong'}>{title}</Txt>
        <Txt variant="body" color="soft">
          {body}
        </Txt>
        <View style={styles.when}>
          {!n.read ? (
            <>
              <View style={[styles.dot, {backgroundColor: colors.primary}]} />
              <Txt variant="smallStrong" color="primary">
                {t('New', 'Bago')}
              </Txt>
              <Txt variant="small" color="soft">
                ·
              </Txt>
            </>
          ) : null}
          <Txt variant="small" color="soft">
            {when}
          </Txt>
        </View>
      </View>
      {n.link ? (
        <View style={styles.chev}>
          <Icon name="chevron" size={18} color={colors.textMuted} weight="bold" />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: {gap: 22},
  center: {alignItems: 'center'},
  clip: {overflow: 'hidden'},
  row: {flexDirection: 'row', alignItems: 'flex-start', gap: 14, minHeight: 68, paddingVertical: 16, paddingHorizontal: 16},
  disc: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  text: {flex: 1, gap: 4},
  when: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2},
  dot: {width: 10, height: 10, borderRadius: 5},
  chev: {alignSelf: 'center'},
});
