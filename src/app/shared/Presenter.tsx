import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Button, Card, Icon, Sheet, Txt} from '../../components/ui';
import {BENEFIT_BY_ID, LOAN_PRODUCT_BY_ID} from '../../data/reference';
import type {ClaimStatus, LoanStatus} from '../../data/types';
import {useDB} from '../../store/db';
import {useClaimsFor, useCurrentMember, useLoansFor} from '../../store/hooks';
import {usePrefs} from '../../store/prefs';
import {toast} from '../../store/ui';

const LOAN_NEXT: Partial<Record<LoanStatus, LoanStatus>> = {submitted: 'evaluation', evaluation: 'approved', approved: 'for_release', for_release: 'released'};
const CLAIM_NEXT: Partial<Record<ClaimStatus, ClaimStatus>> = {submitted: 'docs_review', docs_review: 'evaluation', evaluation: 'approved', approved: 'for_payout', for_payout: 'paid'};
const LOAN_WORDS: Record<LoanStatus, string> = {submitted: 'Submitted', evaluation: 'In evaluation', approved: 'Approved', for_release: 'For release', released: 'Released', paid: 'Fully paid', returned: 'Needs correction', rejected: 'Declined'};
const CLAIM_WORDS: Record<ClaimStatus, string> = {submitted: 'Filed', docs_review: 'Checking documents', evaluation: 'In evaluation', approved: 'Approved', for_payout: 'For payout', paid: 'Paid', returned: 'Needs a document', denied: 'Denied'};

/**
 * Presenter tools (opt-in, in More): there is no back office in this prototype, so a presenter can
 * play PSMBFI's part and move a loan or claim to its next step. The member then sees the new status,
 * the notification and, at the end, the payout. English only: it is for the presenter, not members.
 */
export function PresenterTools() {
  const on = usePrefs(s => s.presenter);
  const setOn = usePrefs(s => s.setPresenter);
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const member = useCurrentMember();
  const loans = useLoansFor(member.id);
  const claims = useClaimsFor(member.id);
  const setLoanStatus = useDB(s => s.setLoanStatus);
  const setClaimStatus = useDB(s => s.setClaimStatus);
  const openLoans = useMemo(() => loans.filter(l => LOAN_NEXT[l.status]), [loans]);
  const openClaims = useMemo(() => claims.filter(c => CLAIM_NEXT[c.status]), [claims]);
  if (!on) {return null;}
  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Presenter tools" style={[styles.fab, {bottom: insets.bottom + 96}]}>
        <Icon name="presenter" size={20} color="#1b1300" weight="bold" />
        <Txt variant="smallStrong" style={styles.fabText}>
          Presenter
        </Txt>
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title="Presenter tools" subtitle="Plays PSMBFI's part in the demo: moves a request to its next step.">
        {openLoans.map(l => {
          const next = LOAN_NEXT[l.status]!;
          return (
            <Card key={l.id} tone="inset" style={styles.gap}>
              <Txt variant="bodyStrong">
                {LOAN_PRODUCT_BY_ID[l.productId].name} · {l.id}
              </Txt>
              <Txt variant="small" color="soft">
                Now: {LOAN_WORDS[l.status]}
              </Txt>
              <Button title={`Move to ${LOAN_WORDS[next].toLowerCase()}`} icon="forwardStep" variant="secondary" size="md" onPress={() => { setLoanStatus(l.id, next, {name: 'PSMBFI Loans (demo)', role: 'Presenter'}); toast(`Moved to: ${LOAN_WORDS[next]}`, 'info'); }} />
            </Card>
          );
        })}
        {openClaims.map(c => {
          const next = CLAIM_NEXT[c.status]!;
          return (
            <Card key={c.id} tone="inset" style={styles.gap}>
              <Txt variant="bodyStrong">
                {BENEFIT_BY_ID[c.type].name} · {c.id}
              </Txt>
              <Txt variant="small" color="soft">
                Now: {CLAIM_WORDS[c.status]}
              </Txt>
              <Button title={`Move to ${CLAIM_WORDS[next].toLowerCase()}`} icon="forwardStep" variant="secondary" size="md" onPress={() => { setClaimStatus(c.id, next, {name: 'PSMBFI Claims (demo)', role: 'Presenter'}); toast(`Moved to: ${CLAIM_WORDS[next]}`, 'info'); }} />
            </Card>
          );
        })}
        {openLoans.length + openClaims.length === 0 ? <Txt variant="body" color="soft">No open loans or claims. Apply for a loan or file a claim first.</Txt> : null}
        <View style={styles.gap}>
          <Button title="Turn off presenter tools" variant="ghost" onPress={() => { setOn(false); setOpen(false); }} />
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  gap: {gap: 8},
  fab: {position: 'absolute', left: 14, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 16, borderRadius: 24, backgroundColor: '#f5b544', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: {width: 0, height: 4}, elevation: 6},
  fabText: {color: '#1b1300'},
});
