import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Badge, Button, Card, DateField, EmptyState, ErrorState, Icon, LoadingBlock, RadioCards, Screen, SectionHead, SelectField, Sheet, TextField, Txt, type IconName} from '../../components/ui';
import type {AssistRequest} from '../../data/types';
import {date} from '../../lib/format';
import {useLang, useT} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {useDB} from '../../store/db';
import {useCurrentMember, useSimulatedLoad} from '../../store/hooks';
import {toast} from '../../store/ui';
import {HelpLink} from '../shared/Help';
import {ASSIST_STATUS, assistText, nowMs} from '../shared/text';

type Kind = AssistRequest['kind'];

const TOPICS: Record<Kind, [string, string][]> = {
  legal: [
    ['Help with an administrative case', 'Tulong sa administrative case'],
    ['Help with a case connected to my duty', 'Tulong sa kasong may kinalaman sa tungkulin'],
    ['Affidavits and notarized papers', 'Affidavit at mga papel na kailangang notaryo'],
    ['Family or property matter', 'Usaping pampamilya o ari-arian'],
    ['Something else', 'Iba pa'],
  ],
  travel: [
    ['Travel to a court hearing', 'Biyahe papunta sa court hearing'],
    ['Official mission or new assignment', 'Opisyal na misyon o bagong assignment'],
    ['Emergency family travel', 'Biyahe dahil sa emergency ng pamilya'],
    ['Something else', 'Iba pa'],
  ],
};
const TOPIC_FIL: Record<string, string> = Object.fromEntries([...TOPICS.legal, ...TOPICS.travel]);
const KIND_ICON: Record<Kind, IconName> = {legal: 'assist', travel: 'travel'};
const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;

const localDay = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * The Legal & Travel Assistance Portal inside the app (it launched 29 Sept 2026): a member's own
 * requests first, then what the desk helps with, and a short request form in a sheet.
 */
export default function Assist() {
  const t = useT();
  const member = useCurrentMember();
  const all = useDB(s => s.assist);
  const load = useSimulatedLoad();
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<Kind | ''>('');
  const requests = useMemo(() => all.filter(a => a.memberId === member.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [all, member.id]);

  const start = (k: Kind | '') => {
    setPreset(k);
    setOpen(true);
  };

  const requestsSection = (
    <View>
      <SectionHead title={t('Your requests', 'Ang iyong mga request')} count={requests.length} />
      {requests.length === 0 ? (
        <Card>
          <EmptyState
            title={t('No requests yet', 'Wala pang request')}
            body={t('When you ask for legal or travel help, you can follow it here.', 'Kapag humingi ka ng legal o travel na tulong, masusubaybayan mo ito rito.')}
            action={
              <View style={styles.center}>
                <HelpLink topic="Something else" />
              </View>
            }
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {requests.map(r => (
            <RequestCard key={r.id} r={r} />
          ))}
        </View>
      )}
    </View>
  );
  const servicesSection = (
    <View>
      <SectionHead title={t('What the desk can help with', 'Ano ang maitutulong ng desk')} />
      <View style={styles.list}>
        <ServiceCard
          kind="legal"
          title={t('Legal assistance', 'Legal assistance')}
          body={t('Advice and help with cases connected with your duty, administrative cases, affidavits and other legal papers.', 'Payo at tulong sa mga kasong may kinalaman sa tungkulin, administrative case, affidavit at iba pang legal na papel.')}
          pickLabel={t('Ask for legal help', 'Humingi ng legal na tulong')}
          onPick={() => start('legal')}
        />
        <ServiceCard
          kind="travel"
          title={t('Travel assistance', 'Travel assistance')}
          body={t('Help with travel for court hearings, official missions and family emergencies, including bookings.', 'Tulong sa biyahe para sa court hearing, opisyal na misyon at emergency ng pamilya, kasama ang booking.')}
          pickLabel={t('Ask for travel help', 'Humingi ng tulong sa biyahe')}
          onPick={() => start('travel')}
        />
      </View>
    </View>
  );

  return (
    <Screen
      helpTopic="Something else"
      onRefresh={load.retry}
      title={t('Legal & Travel Assistance', 'Legal at Travel Assistance')}
      subtitle={t("Help from PSMBFI's Legal & Travel Desk. Since 29 Sept 2026 it is part of this app, so you use the same login.", 'Tulong mula sa Legal & Travel Desk ng PSMBFI. Mula 29 Set 2026, bahagi na ito ng app na ito kaya pareho ang iyong login.')}>
      <Button title={t('Request assistance', 'Humingi ng tulong')} icon="assist" onPress={() => start('')} testID="assist-request" />

      {load.error ? (
        <ErrorState onRetry={load.retry} helpTopic="Something else" />
      ) : load.loading ? (
        <View style={styles.loading}>
          <LoadingBlock />
        </View>
      ) : (
        <View style={styles.stack}>
          {/* An open request is what a returning member checks first; otherwise the services lead. */}
          {requests.length > 0 ? (
            <>
              {requestsSection}
              {servicesSection}
            </>
          ) : (
            <>
              {servicesSection}
              {requestsSection}
            </>
          )}
          <HelpLink topic="Something else" />
        </View>
      )}

      <RequestSheet open={open} onClose={() => setOpen(false)} preset={preset} />
    </Screen>
  );
}

function ServiceCard({kind, title, body, pickLabel, onPick}: {kind: Kind; title: string; body: string; pickLabel: string; onPick: () => void}) {
  const t = useT();
  const {colors} = useTheme();
  return (
    <Card style={styles.gap}>
      <View style={styles.iconRow}>
        <View style={[styles.disc, {backgroundColor: colors.primarySoft}]}>
          <Icon name={KIND_ICON[kind]} size={28} weight="duotone" color={colors.primaryText} />
        </View>
        <Txt variant="title" accessibilityRole="header" style={styles.flex}>
          {title}
        </Txt>
      </View>
      <Txt variant="body" color="soft">
        {body}
      </Txt>
      <View style={styles.gapSm}>
        <Txt variant="bodyStrong">{t('For example', 'Halimbawa')}</Txt>
        {TOPICS[kind].slice(0, 3).map(([en, fil]) => (
          <View key={en} style={styles.example}>
            <Icon name="checkCircle" size={20} weight="fill" color={colors.positive} />
            <Txt variant="body" color="soft" style={styles.flex}>
              {t(en, fil)}
            </Txt>
          </View>
        ))}
      </View>
      <Button title={pickLabel} icon={KIND_ICON[kind]} variant="quiet" onPress={onPick} testID={`assist-${kind}`} />
    </Card>
  );
}

function RequestCard({r}: {r: AssistRequest}) {
  const t = useT();
  const lang = useLang();
  const {colors} = useTheme();
  const s = ASSIST_STATUS[r.status];
  const topic = lang === 'fil' ? TOPIC_FIL[r.topic] ?? assistText(r.topic, lang) : r.topic;
  return (
    <Card style={styles.gap}>
      <View style={styles.head}>
        <View style={[styles.disc, {backgroundColor: colors.panel2}]}>
          <Icon name={KIND_ICON[r.kind]} size={26} weight="duotone" color={colors.textSoft} />
        </View>
        <View style={styles.headText}>
          <Txt variant="heading">{topic}</Txt>
          <Txt variant="small" color="soft">
            {r.id} · {r.kind === 'legal' ? t('Legal', 'Legal') : t('Travel', 'Travel')} · {t(`sent ${date(r.createdAt)}`, `ipinadala ${date(r.createdAt)}`)}
          </Txt>
          <View style={styles.badge}>
            <Badge tone={s.tone} label={t(s.en, s.fil)} />
          </View>
        </View>
      </View>
      <Txt variant="body">{assistText(r.details, lang)}</Txt>
      {r.nextStep ? (
        <View style={[styles.next, {backgroundColor: colors.panel2}]}>
          <Txt variant="smallStrong" color="soft">
            {t('Next step', 'Susunod na hakbang')}
          </Txt>
          <Txt variant="body">{assistText(r.nextStep, lang)}</Txt>
        </View>
      ) : null}
      <View style={styles.gapXs}>
        {r.preferredDate ? (
          <Txt variant="body" color="soft">
            {t(`Preferred date: ${date(r.preferredDate)}`, `Gustong petsa: ${date(r.preferredDate)}`)}
          </Txt>
        ) : null}
        <Txt variant="body" color="soft">
          {r.handler ? t(`Handled by: ${assistText(r.handler, lang)}`, `Humahawak: ${assistText(r.handler, lang)}`) : t('Waiting for a handler', 'Hinihintay ang hahawak')}
        </Txt>
      </View>
    </Card>
  );
}

/** The request form, then the reference number and what happens next, in the same sheet. */
function RequestSheet({open, onClose, preset}: {open: boolean; onClose: () => void; preset: Kind | ''}) {
  const t = useT();
  const lang = useLang();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const member = useCurrentMember();
  const createAssist = useDB(s => s.createAssist);
  const today = localDay(nowMs());
  const year = Number(today.slice(0, 4));
  const [kind, setKind] = useState<Kind | ''>(preset);
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [when, setWhen] = useState('');
  const [errors, setErrors] = useState<Partial<Record<'kind' | 'topic' | 'details' | 'when', string>>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<AssistRequest | null>(null);

  // Each time the sheet opens: a service card preselects its kind; a sent request starts a fresh
  // form. A draft that was only closed is kept, so a stray tap on the backdrop loses nothing.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      if (sent) {
        setSent(null);
        setDetails('');
        setWhen('');
        setKind(preset);
        setTopic('');
      } else if (preset && preset !== kind) {
        setKind(preset);
        setTopic('');
      }
      setErrors({});
    }
    wasOpen.current = open;
  }, [open, preset, sent, kind]);

  const submit = () => {
    const e: typeof errors = {};
    if (!kind) {
      e.kind = t('Choose legal or travel help.', 'Piliin kung legal o travel na tulong.');
    }
    if (kind && !topic) {
      e.topic = t('Choose what it is about.', 'Piliin kung tungkol saan.');
    }
    if (details.trim().length < 15) {
      e.details = t('Tell us a little more (at least 15 letters) so the right person calls you.', 'Magkuwento pa nang kaunti (hindi bababa sa 15 letra) para tamang tao ang tumawag sa iyo.');
    }
    if (when && !FULL_DATE.test(when)) {
      e.when = t('Choose the month, the day and the year, or clear the date.', 'Piliin ang buwan, araw at taon, o burahin ang petsa.');
    } else if (when && when < today) {
      e.when = t('Choose today or a later date.', 'Pumili ng petsa ngayon o sa susunod.');
    }
    setErrors(e);
    if (Object.keys(e).length || !kind) {
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const req = createAssist({memberId: member.id, kind, topic, details: details.trim(), preferredDate: when || null});
      setBusy(false);
      setSent(req);
      toast(t('Request sent', 'Naipadala ang request'), 'ok', req.id);
    }, 800);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={sent ? t('Request sent', 'Naipadala ang request') : t('Request assistance', 'Humingi ng tulong')}
      subtitle={sent ? undefined : t('The Legal & Travel Desk reads every request.', 'Binabasa ng Legal & Travel Desk ang bawat request.')}
      footer={
        sent ? undefined : (
          <>
            <Button title={t('Send request', 'Ipadala ang request')} icon="check" busy={busy} onPress={submit} testID="assist-send" />
            <Button title={t('Cancel', 'Kanselahin')} variant="quiet" disabled={busy} onPress={onClose} />
          </>
        )
      }>
      {sent ? (
        <View style={styles.done} accessibilityLiveRegion="polite">
          <View style={[styles.check, {backgroundColor: colors.tones.ok.bg}]}>
            <Icon name="checkCircle" size={44} weight="fill" color={colors.positive} />
          </View>
          <Txt variant="body">{t('We received your request.', 'Natanggap namin ang iyong request.')}</Txt>
          <Card tone="inset" style={styles.gapSm}>
            <Txt variant="smallStrong" color="soft">
              {t('Your reference number', 'Ang iyong reference number')}
            </Txt>
            <Txt variant="amountLarge" selectable testID="assist-ref">
              {sent.id}
            </Txt>
            <Txt variant="body" color="soft">
              {t('Keep this number. The desk will ask for it if you call.', 'Itago ang numerong ito. Hihingin ito ng desk kapag tumawag ka.')}
            </Txt>
          </Card>
          <View style={styles.gapSm}>
            <Txt variant="heading" accessibilityRole="header">
              {t('What happens next', 'Ano ang susunod')}
            </Txt>
            <Txt variant="body" color="soft">
              {sent.nextStep ? assistText(sent.nextStep, lang) : ''}
            </Txt>
          </View>
          <View style={styles.gap}>
            <Button
              title={t('Back to Home', 'Bumalik sa Home')}
              icon="home"
              onPress={() => {
                onClose();
                nav.popTo('Main', {screen: 'Home'});
              }}
              testID="assist-home"
            />
            <Button title={t('Done', 'Tapos na')} variant="quiet" onPress={onClose} testID="assist-done" />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.gap}>
            <Txt variant="label">{t('What do you need?', 'Ano ang kailangan mo?')}</Txt>
            <RadioCards
              label={t('What do you need?', 'Ano ang kailangan mo?')}
              value={kind}
              onChange={v => {
                if (v !== kind) {
                  setTopic('');
                }
                setKind(v);
                setErrors(x => ({...x, kind: undefined, topic: undefined}));
              }}
              options={[
                {value: 'legal', icon: 'assist', label: t('Legal assistance', 'Legal assistance'), description: t('Cases, affidavits, legal papers', 'Kaso, affidavit, legal na papel')},
                {value: 'travel', icon: 'travel', label: t('Travel assistance', 'Travel assistance'), description: t('Hearings, missions, emergencies', 'Hearing, misyon, emergency')},
              ]}
            />
            {errors.kind ? (
              <View style={styles.err} accessibilityRole="alert">
                <Icon name="warning" size={18} color={colors.tones.bad.text} weight="fill" />
                <Txt variant="smallStrong" color="bad" style={styles.flex}>
                  {errors.kind}
                </Txt>
              </View>
            ) : null}
          </View>
          {kind ? (
            <SelectField
              label={t('What is it about?', 'Tungkol saan?')}
              value={topic}
              placeholder={t('Choose one', 'Pumili ng isa')}
              options={TOPICS[kind].map(([en, fil]) => ({value: en, label: t(en, fil)}))}
              onChange={v => {
                setTopic(v);
                setErrors(x => ({...x, topic: undefined}));
              }}
              error={errors.topic}
            />
          ) : null}
          <TextField
            label={t('Tell us what happened or what you need', 'Ikuwento ang nangyari o ang kailangan mo')}
            hint={t('Include the place and date of a hearing if there is one.', 'Isama ang lugar at petsa ng hearing kung mayroon.')}
            value={details}
            onChangeText={v => {
              setDetails(v);
              setErrors(x => ({...x, details: undefined}));
            }}
            error={errors.details}
            multiline
            maxLength={500}
            style={styles.multi}
          />
          <View style={styles.gapSm}>
            <DateField
              label={t('Preferred date', 'Gustong petsa')}
              hint={t('When you need the help, for example the day you travel. You can leave it empty.', 'Kailan mo kailangan ang tulong, halimbawa ang araw ng biyahe. Puwedeng iwanang blangko.')}
              value={when}
              onChange={v => {
                setWhen(v);
                setErrors(x => ({...x, when: undefined}));
              }}
              error={errors.when}
              fromYear={year}
              toYear={year + 1}
            />
            {when ? (
              <Button
                title={t('Clear the date', 'Burahin ang petsa')}
                icon="close"
                variant="ghost"
                size="md"
                block={false}
                onPress={() => {
                  setWhen('');
                  setErrors(x => ({...x, when: undefined}));
                }}
              />
            ) : null}
          </View>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  center: {alignItems: 'center'},
  loading: {marginTop: 24},
  stack: {gap: 28, marginTop: 26},
  list: {gap: 14},
  gap: {gap: 12},
  gapSm: {gap: 6},
  gapXs: {gap: 2},
  iconRow: {flexDirection: 'row', alignItems: 'center', gap: 14},
  head: {flexDirection: 'row', alignItems: 'flex-start', gap: 14},
  headText: {flex: 1, gap: 2},
  badge: {marginTop: 6},
  disc: {width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center'},
  example: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  next: {borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 2},
  multi: {minHeight: 128, textAlignVertical: 'top'},
  err: {flexDirection: 'row', alignItems: 'center', gap: 8},
  done: {gap: 18, paddingBottom: 8},
  check: {width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center'},
});
