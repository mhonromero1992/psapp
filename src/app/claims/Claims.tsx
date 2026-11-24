import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useMemo} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Badge, Button, Card, EmptyState, ErrorState, Icon, LoadingBlock, money, Screen, SectionHead, Txt} from '../../components/ui';
import {BENEFIT_BY_ID, BENEFIT_TYPES} from '../../data/reference';
import type {Claim, ClaimType} from '../../data/types';
import {date} from '../../lib/format';
import {useLang, useT} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {useClaimsFor, useCurrentMember, useSimulatedLoad} from '../../store/hooks';
import {claimNext, OPEN_CLAIM} from '../shared/claims';
import {HelpLink} from '../shared/Help';
import {CLAIM_STATUS} from '../shared/status';
import {BENEFIT_FIL, BENEFIT_SCHEDULE_EN} from '../shared/text';
import {BenefitDisc, needsNewCopy, Notice, shownStatus, StageBar} from './parts';

/** Claims tab: what is in progress, what is finished, and what a member can claim. */
export default function Claims() {
  const t = useT();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const member = useCurrentMember();
  const claims = useClaimsFor(member.id);
  const load = useSimulatedLoad();

  const sorted = useMemo(() => [...claims].sort((a, b) => b.filedAt.localeCompare(a.filedAt)), [claims]);
  const open = useMemo(() => sorted.filter(c => OPEN_CLAIM.includes(c.status)), [sorted]);
  const past = useMemo(() => sorted.filter(c => !OPEN_CLAIM.includes(c.status)), [sorted]);

  return (
    <Screen
      bar="tabs"
      tabs
      onRefresh={load.retry}
      helpTopic="Claims"
      title={t('Claims', 'Mga claim')}
      subtitle={t('Money for hospital stays, injuries on duty and other covered events. File from your phone with photos of your papers.', 'Pera para sa pagka-ospital, pinsala sa tungkulin at iba pang sakop na pangyayari. Mag-file gamit ang phone at litrato ng mga papel.')}>
      <Button title={t('File a claim', 'Mag-file ng claim')} icon="claims" onPress={() => nav.navigate('ClaimNew')} testID="claims-file" />

      {load.error ? (
        <ErrorState onRetry={load.retry} helpTopic="Claims" />
      ) : load.loading ? (
        <View style={styles.loading}>
          <LoadingBlock />
        </View>
      ) : (
        <View style={styles.stack}>
          <View>
            <SectionHead title={t('In progress', 'Pinoproseso')} count={open.length} />
            {open.length === 0 ? (
              <Card>
                <EmptyState
                  title={t('No claims in progress', 'Walang claim na pinoproseso')}
                  body={t('When you file a claim, you can follow each step here.', 'Kapag nag-file ka ng claim, masusubaybayan mo rito ang bawat hakbang.')}
                  action={
                    <View style={styles.center}>
                      <HelpLink topic="Claims" />
                    </View>
                  }
                />
              </Card>
            ) : (
              <View style={styles.list}>
                {open.map(c => (
                  <OpenClaimCard key={c.id} claim={c} />
                ))}
              </View>
            )}
          </View>

          <View>
            <SectionHead title={t('Finished claims', 'Mga tapos nang claim')} count={past.length} />
            {past.length === 0 ? (
              <Card>
                <EmptyState title={t('No finished claims yet', 'Wala pang tapos na claim')} body={t('Paid and closed claims are kept here for your records.', 'Dito itinatago ang mga bayad at saradong claim para sa iyong records.')} />
              </Card>
            ) : (
              <Card pad={0} style={styles.clip}>
                {past.map((c, i) => (
                  <PastClaimRow key={c.id} claim={c} first={i === 0} />
                ))}
              </Card>
            )}
          </View>

          <View>
            <SectionHead title={t('What you can claim', 'Ano ang maaari mong i-claim')} />
            <Txt variant="body" color="soft" style={styles.note}>
              {t('Amounts are sample values to confirm with PSMBFI.', 'Sample na halaga lang ang mga amount, kukumpirmahin sa PSMBFI.')}
            </Txt>
            <Card pad={0}>
              {BENEFIT_TYPES.map((b, i) => (
                <BenefitRow key={b.id} id={b.id} first={i === 0} />
              ))}
            </Card>
          </View>

          <HelpLink topic="Claims" />
        </View>
      )}
    </Screen>
  );
}

/** An open claim: where it is on the five steps, the amount, and what happens next. */
function OpenClaimCard({claim}: {claim: Claim}) {
  const t = useT();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const b = BENEFIT_BY_ID[claim.type];
  const status = shownStatus(claim);
  const s = CLAIM_STATUS[status];
  const needs = needsNewCopy(claim);
  const name = t(b.name, b.nameFil);
  return (
    <Pressable
      onPress={() => nav.navigate('ClaimDetail', {id: claim.id})}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${t(s.en, s.fil)}, ${money(claim.amountClaimed)}, ${claim.id}`}
      accessibilityHint={t('Opens the claim details', 'Bubuksan ang detalye ng claim')}
      testID={`claim-${claim.id}`}>
      {({pressed}) => (
        <Card style={[styles.card, pressed && {backgroundColor: colors.panel2}]}>
          <View style={styles.head}>
            <BenefitDisc type={claim.type} />
            <View style={styles.headText}>
              <Txt variant="heading">{name}</Txt>
              <Txt variant="small" color="soft">
                {claim.id} · {t(`filed ${date(claim.filedAt)}`, `isinampa ${date(claim.filedAt)}`)}
              </Txt>
              <View style={styles.badge}>
                <Badge tone={s.tone} label={t(s.en, s.fil)} />
              </View>
            </View>
          </View>
          <View>
            <Txt variant="small" color="soft">
              {t('Amount claimed', 'Halagang kini-claim')}
            </Txt>
            <Txt variant="amountLarge">{money(claim.amountClaimed)}</Txt>
          </View>
          <StageBar status={status} />
          {needs ? (
            <Notice tone="warn" icon="warning" text={t('We need a new copy of a document. Open this claim to send it.', 'Kailangan namin ng bagong kopya ng isang dokumento. Buksan ang claim para ipadala ito.')} />
          ) : (
            <Txt variant="body">{claimNext({...claim, status}, t)}</Txt>
          )}
          <View style={styles.more}>
            <Txt variant="bodyStrong" color="primary">
              {t('See claim details', 'Tingnan ang detalye ng claim')}
            </Txt>
            <Icon name="forward" size={18} weight="bold" color={colors.primaryText} />
          </View>
        </Card>
      )}
    </Pressable>
  );
}

/** A paid, denied or closed claim, kept for the member's records. */
function PastClaimRow({claim, first}: {claim: Claim; first: boolean}) {
  const t = useT();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const b = BENEFIT_BY_ID[claim.type];
  const s = CLAIM_STATUS[claim.status];
  const name = t(b.name, b.nameFil);
  const ended = claim.timeline[claim.timeline.length - 1]?.at ?? claim.filedAt;
  const amount = money(claim.amountApproved ?? claim.amountClaimed);
  return (
    <Pressable
      onPress={() => nav.navigate('ClaimDetail', {id: claim.id})}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${t(s.en, s.fil)}, ${amount}, ${date(ended)}`}
      style={({pressed}) => [styles.row, !first && {borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: colors.line}, pressed && {backgroundColor: colors.panel2}]}>
      <BenefitDisc type={claim.type} size={44} muted />
      <View style={styles.headText}>
        <Txt variant="bodyStrong">{name}</Txt>
        <Txt variant="small" color="soft">
          {amount} · {date(ended)}
        </Txt>
        <View style={styles.badge}>
          <Badge tone={s.tone} label={t(s.en, s.fil)} />
        </View>
      </View>
      <Icon name="chevron" size={18} color={colors.textMuted} weight="bold" />
    </Pressable>
  );
}

/** One benefit, in plain words, with its sample schedule. */
function BenefitRow({id, first}: {id: ClaimType; first: boolean}) {
  const t = useT();
  const lang = useLang();
  const {colors} = useTheme();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const b = BENEFIT_BY_ID[id];
  const fil = BENEFIT_FIL[id];
  const short = id !== 'DEATH' && id !== 'DISABILITY';
  return (
    <View style={[styles.row, styles.top, !first && {borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: colors.line}]}>
      <BenefitDisc type={id} size={44} />
      <View style={styles.headText}>
        <Txt variant="bodyStrong">
          {t(b.name, b.nameFil)}
          {short ? (
            <Txt variant="body" color="soft">
              {` (${id})`}
            </Txt>
          ) : null}
        </Txt>
        <Txt variant="body" color="soft">
          {lang === 'fil' ? fil.description : b.description}
        </Txt>
        <Txt variant="bodyStrong" style={styles.schedule}>
          {lang === 'fil' ? fil.schedule : BENEFIT_SCHEDULE_EN[id] ?? b.schedule}
        </Txt>
        <Button
          title={t('File this claim', 'I-file ang claim na ito')}
          icon="plus"
          variant="secondary"
          size="md"
          block={false}
          onPress={() => nav.navigate('ClaimNew', {type: id})}
          accessibilityHint={t(`Starts a claim for ${b.name}`, `Magsisimula ng claim para sa ${b.nameFil}`)}
          style={styles.fileBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {marginTop: 24},
  stack: {gap: 28, marginTop: 26},
  list: {gap: 14},
  center: {alignItems: 'center'},
  clip: {overflow: 'hidden'},
  note: {marginTop: -4, marginBottom: 12},
  card: {gap: 14},
  head: {flexDirection: 'row', alignItems: 'flex-start', gap: 14},
  headText: {flex: 1, gap: 2},
  badge: {marginTop: 6},
  more: {flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28},
  row: {flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 68, paddingVertical: 14, paddingHorizontal: 16},
  top: {alignItems: 'flex-start'},
  schedule: {marginTop: 4},
  fileBtn: {marginTop: 10},
});
