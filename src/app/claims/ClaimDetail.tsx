import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useMemo, useState} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Badge, Button, Card, Divider, EmptyState, ErrorState, History, Icon, LoadingBlock, money, PhotoPicker, Screen, SectionHead, Txt, type Photo} from '../../components/ui';
import {BENEFIT_BY_ID} from '../../data/reference';
import type {Claim, ClaimDocument, ClaimStatus} from '../../data/types';
import {date, dateTime, maskAccount} from '../../lib/format';
import {useLang, useT, type TFn} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {useDB} from '../../store/db';
import {useCurrentMember, usePayoutsFor, useSimulatedLoad} from '../../store/hooks';
import {toast} from '../../store/ui';
import {claimNext, claimUpcoming, incidentLabel} from '../shared/claims';
import {HelpLink} from '../shared/Help';
import {CLAIM_STATUS} from '../shared/status';
import {docName, localTimeline} from '../shared/text';
import {BenefitDisc, DOC_STATUS, RELATION, shownStatus, StageBar} from './parts';

/** The plain-words status line at the top of a claim. */
function headline(status: ClaimStatus, t: TFn) {
  switch (status) {
    case 'submitted':
    case 'docs_review':
      return t('We are checking your documents', 'Sinusuri namin ang iyong mga dokumento');
    case 'evaluation':
      return t('Your claim is being evaluated', 'Sinusuri ang iyong claim');
    case 'approved':
      return t('Your claim is approved', 'Aprubado na ang iyong claim');
    case 'for_payout':
      return t('Your payment is being sent', 'Ipinapadala na ang iyong bayad');
    case 'paid':
      return t('Your claim is paid', 'Bayad na ang iyong claim');
    case 'returned':
      return t('Waiting for a new copy of a document', 'Hinihintay ang bagong kopya ng dokumento');
    case 'denied':
      return t('Your claim was not approved', 'Hindi naaprubahan ang iyong claim');
  }
}

/** One claim: where it is, the money, the papers (with a new copy when one is asked for), and its history. */
export default function ClaimDetail() {
  const t = useT();
  const lang = useLang();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {params} = useRoute<RouteProp<RootStackParamList, 'ClaimDetail'>>();
  const id = params?.id ?? '';
  const member = useCurrentMember();
  const claims = useDB(s => s.claims);
  const setClaimDocument = useDB(s => s.setClaimDocument);
  const payouts = usePayoutsFor(member.id);
  const claim = useMemo(() => claims.find(c => c.id === id && c.memberId === member.id), [claims, id, member.id]);
  const load = useSimulatedLoad();
  const [replacement, setReplacement] = useState<Record<string, Photo[]>>({});
  const [justSent, setJustSent] = useState<string[]>([]);
  const [sending, setSending] = useState<string | null>(null);

  if (load.error || load.loading || !claim) {
    return (
      <Screen helpTopic="Claims" title={t('Claim details', 'Detalye ng claim')}>
        {load.error ? (
          <ErrorState onRetry={load.retry} helpTopic="Claims" />
        ) : load.loading ? (
          <LoadingBlock />
        ) : (
          <Card>
            <EmptyState
              title={t("We can't find this claim", 'Hindi namin makita ang claim na ito')}
              body={t(`There is no claim ${id} on your record. Check the claim number and try again.`, `Walang claim na ${id} sa iyong record. Pakisuri ang claim number at subukan ulit.`)}
              action={
                <>
                  <Button title={t('Go to my claims', 'Pumunta sa aking mga claim')} icon="claims" onPress={() => nav.popTo('Main', {screen: 'Claims'})} />
                  <View style={styles.center}>
                    <HelpLink topic="Claims" />
                  </View>
                </>
              }
            />
          </Card>
        )}
      </Screen>
    );
  }

  const b = BENEFIT_BY_ID[claim.type];
  const needs = claim.documents.filter(d => d.status === 'reupload');
  const status = shownStatus(claim);
  const shown: Claim = {...claim, status};
  const s = CLAIM_STATUS[status];
  const account = member.payoutAccounts.find(a => claim.payoutLabel.startsWith(a.provider) && claim.payoutLabel.endsWith(a.accountNo.replace(/\s/g, '').slice(-4)));
  const payout = payouts.find(p => p.refId === claim.id);
  const returnedNote = [...claim.timeline].reverse().find(e => e.label === 'Returned for missing documents')?.note;
  const relation = claim.claimantRelation === 'Member' ? t('Member', 'Miyembro') : t(`${RELATION[claim.claimantRelation][0]}, beneficiary`, `${RELATION[claim.claimantRelation][1]}, beneficiary`);

  const send = (doc: ClaimDocument) => {
    const photo = replacement[doc.id]?.[0];
    if (!photo) {
      return;
    }
    setSending(doc.id);
    setTimeout(() => {
      setClaimDocument(claim.id, doc.id, 'received', undefined, photo.uri);
      setSending(null);
      setJustSent(x => [...x, doc.id]);
      toast(t('New copy sent', 'Naipadala ang bagong kopya'), 'ok', t('We will check it within 2 working days.', 'Susuriin namin ito sa loob ng 2 araw ng trabaho.'));
    }, 700);
  };

  return (
    <Screen
      helpTopic="Claims"
      lead={
        <View style={styles.lead}>
          <BenefitDisc type={claim.type} size={36} />
          <Txt variant="smallStrong" color="soft" selectable>
            {claim.id}
          </Txt>
        </View>
      }
      title={t(b.name, b.nameFil)}>
      <View style={styles.meta}>
        <Badge tone={s.tone} label={t(s.en, s.fil)} />
        <Txt variant="body" color="soft">
          {t(`Filed ${date(claim.filedAt)}`, `Isinampa noong ${date(claim.filedAt)}`)}
        </Txt>
      </View>

      <View style={styles.stack}>
        {/* A paper needs a new copy: the one thing to do on this screen. */}
        {needs.length > 0 ? (
          <Card style={[styles.gap, {backgroundColor: colors.tones.warn.bg}]}>
            <View style={styles.iconRow}>
              <Icon name="warning" size={26} weight="fill" color={colors.tones.warn.text} />
              <Txt variant="title" accessibilityRole="header" style={styles.flex}>
                {t('We need a new copy of a paper', 'Kailangan namin ng bagong kopya ng isang papel')}
              </Txt>
            </View>
            {returnedNote ? <Txt variant="body">{localTimeline([{at: claim.filedAt, label: '', note: returnedNote}], lang)[0].note}</Txt> : null}
            {needs.map(d => {
              const photos = replacement[d.id] ?? [];
              return (
                <View key={d.id} style={styles.gap}>
                  <PhotoPicker label={docName(d.name, lang)} hint={t('Take a new, clear photo in good light.', 'Kumuha ng bago at malinaw na litrato sa maliwanag na lugar.')} photos={photos} max={1} onChange={p => setReplacement(r => ({...r, [d.id]: p}))} />
                  <Button title={t('Send the new copy', 'Ipadala ang bagong kopya')} icon="check" disabled={!photos.length} busy={sending === d.id} onPress={() => send(d)} testID={`send-${d.id}`} />
                </View>
              );
            })}
          </Card>
        ) : justSent.length > 0 ? (
          <Card style={[styles.gap, {backgroundColor: colors.tones.ok.bg}]}>
            <View style={styles.iconRow} accessibilityLiveRegion="polite">
              <Icon name="checkCircle" size={26} weight="fill" color={colors.positive} />
              <Txt variant="title" accessibilityRole="header" style={styles.flex}>
                {t('Thank you. We received the new copy.', 'Salamat. Natanggap namin ang bagong kopya.')}
              </Txt>
            </View>
            <Txt variant="body">
              {t(`What happens next: we check it within 2 working days and tell you in this app. Your claim number is ${claim.id}.`, `Susunod: susuriin namin ito sa loob ng 2 araw ng trabaho at sasabihan ka sa app na ito. Ang claim number mo ay ${claim.id}.`)}
            </Txt>
            <Button title={t('Back to Home', 'Bumalik sa Home')} icon="home" onPress={() => nav.popTo('Main', {screen: 'Home'})} />
          </Card>
        ) : null}

        <Card style={styles.gap}>
          <Txt variant="title" accessibilityRole="header">
            {headline(status, t)}
          </Txt>
          <StageBar status={status} />
          <Txt variant="body" color="soft">
            {claimNext(shown, t)}
          </Txt>
        </Card>

        <Card style={styles.gapLg}>
          <View style={styles.amounts}>
            <View style={styles.amount}>
              <Txt variant="small" color="soft">
                {t('Amount claimed', 'Halagang kini-claim')}
              </Txt>
              <Txt variant="amountLarge">{money(claim.amountClaimed)}</Txt>
            </View>
            <View style={styles.amount}>
              <Txt variant="small" color="soft">
                {t('Amount approved', 'Halagang inaprubahan')}
              </Txt>
              {claim.amountApproved !== null ? (
                <Txt variant="amountLarge">{money(claim.amountApproved)}</Txt>
              ) : (
                <Txt variant="bodyStrong" style={styles.notYet}>
                  {claim.status === 'denied' ? t('None, not approved', 'Wala, hindi naaprubahan') : t('Not decided yet', 'Hindi pa napagpapasyahan')}
                </Txt>
              )}
            </View>
          </View>
          <Divider />
          <View style={styles.gap}>
            <Detail label={t('Filed by', 'Isinampa ni')} value={`${claim.claimantName} (${relation})`} />
            {claim.type !== 'MER' ? <Detail label={incidentLabel(claim.type, t)} value={date(claim.incidentDate)} /> : null}
            {claim.hospital ? <Detail label={t('Hospital', 'Ospital')} value={claim.hospital} /> : null}
            {claim.confinementDays !== undefined ? <Detail label={t('Days in the hospital', 'Ilang araw sa ospital')} value={claim.confinementDays === 1 ? t('1 day', '1 araw') : t(`${claim.confinementDays} days`, `${claim.confinementDays} araw`)} /> : null}
            <Detail label={t('What happened', 'Ano ang nangyari')} value={claim.description} plain />
          </View>
        </Card>

        <View>
          <SectionHead title={t('Your documents', 'Ang iyong mga dokumento')} count={claim.documents.length} />
          {claim.documents.length === 0 ? (
            <Card>
              <Txt variant="body" color="soft">
                {t('No documents were needed for this claim.', 'Walang kinailangang dokumento sa claim na ito.')}
              </Txt>
            </Card>
          ) : (
            <Card pad={0} style={styles.clip}>
              {claim.documents.map((d, i) => (
                <DocRow key={d.id} doc={d} first={i === 0} />
              ))}
            </Card>
          )}
        </View>

        <View>
          <SectionHead title={t('History', 'Kasaysayan')} />
          <Card>
            <History events={localTimeline(claim.timeline, lang)} upcoming={claimUpcoming(shown, t)} format={dateTime} />
          </Card>
        </View>

        <View>
          <SectionHead title={t('Where the money goes', 'Saan ipapadala ang pera')} />
          <Card style={styles.gap}>
            <View style={styles.iconRow}>
              <View style={[styles.acctDisc, {backgroundColor: account?.kind === 'ewallet' ? colors.tones.ok.bg : colors.primarySoft}]}>
                <Icon name={account?.kind === 'ewallet' ? 'payouts' : 'loans'} size={24} weight="duotone" color={account?.kind === 'ewallet' ? colors.tones.ok.text : colors.primaryText} />
              </View>
              <View style={styles.flex}>
                <Txt variant="bodyStrong">{account ? account.provider : claim.payoutLabel}</Txt>
                {account ? (
                  <Txt variant="small" color="soft">
                    {account.kind === 'bank' ? t('Bank account', 'Bank account') : t('E-wallet', 'E-wallet')} {maskAccount(account.accountNo)}
                  </Txt>
                ) : null}
              </View>
            </View>
            <Txt variant="body" color="soft">
              {payout && (payout.status === 'settled' || payout.status === 'sent')
                ? t(
                    `${money(payout.amount)} was sent on ${date(payout.settledAt ?? payout.createdAt)}${payout.reference ? `, reference ${payout.reference}` : ''}.`,
                    `Naipadala ang ${money(payout.amount)} noong ${date(payout.settledAt ?? payout.createdAt)}${payout.reference ? `, reference ${payout.reference}` : ''}.`,
                  )
                : claim.status === 'denied'
                ? t('No money is sent because the claim was not approved.', 'Walang ipapadalang pera dahil hindi naaprubahan ang claim.')
                : t('The benefit is sent here once your claim is approved.', 'Ipapadala rito ang benepisyo kapag naaprubahan ang claim.')}
            </Txt>
          </Card>
        </View>

        <HelpLink topic="Claims" />
      </View>
    </Screen>
  );
}

/** Label above, value below. */
function Detail({label, value, plain}: {label: string; value: string; plain?: boolean}) {
  return (
    <View>
      <Txt variant="small" color="soft">
        {label}
      </Txt>
      <Txt variant={plain ? 'body' : 'bodyStrong'}>{value}</Txt>
    </View>
  );
}

/** A paper with its photo (when it was taken on this phone) and where it stands. */
function DocRow({doc, first}: {doc: ClaimDocument; first: boolean}) {
  const t = useT();
  const lang = useLang();
  const {colors, scale} = useTheme();
  const st = DOC_STATUS[doc.status];
  const name = docName(doc.name, lang);
  const size = Math.round(60 * Math.min(scale, 1.2));
  return (
    <View style={[styles.docRow, !first && {borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: colors.line}]} accessible accessibilityLabel={`${name}, ${t(st.en, st.fil)}`}>
      {doc.preview ? (
        <Image source={{uri: doc.preview}} style={[styles.thumb, {width: size, height: size, backgroundColor: colors.panel2}]} resizeMode="cover" accessibilityLabel={t(`Photo of ${doc.name}`, `Litrato ng ${name}`)} />
      ) : (
        <View style={[styles.thumb, styles.center, {width: size, height: size, backgroundColor: colors.panel2}]}>
          <Icon name="file" size={26} weight="duotone" color={colors.textSoft} />
        </View>
      )}
      <View style={styles.docText}>
        <Txt variant="bodyStrong">{name}</Txt>
        <Badge tone={st.tone} label={t(st.en, st.fil)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  center: {alignItems: 'center', justifyContent: 'center'},
  clip: {overflow: 'hidden'},
  lead: {flexDirection: 'row', alignItems: 'center', gap: 10},
  meta: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: -8, marginBottom: 22},
  stack: {gap: 24},
  gap: {gap: 12},
  gapLg: {gap: 16},
  iconRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  amounts: {flexDirection: 'row', flexWrap: 'wrap', gap: 16},
  amount: {flex: 1, minWidth: 150, gap: 2},
  notYet: {marginTop: 4},
  acctDisc: {width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center'},
  docRow: {flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 68, paddingVertical: 12, paddingHorizontal: 16},
  thumb: {borderRadius: 12},
  docText: {flex: 1, gap: 6},
});
