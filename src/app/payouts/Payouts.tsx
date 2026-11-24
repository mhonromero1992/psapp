import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTheme} from 'styled-components/native';
import {Badge, Button, Card, Dialog, Divider, EmptyState, ErrorState, Icon, LoadingBlock, money, Screen, SectionHead, Segmented, SelectField, Sheet, TextField, Txt, type IconName} from '../../components/ui';
import {memberName} from '../../data/generate';
import {BANKS, EWALLETS} from '../../data/reference';
import type {Payout, PayoutAccount} from '../../data/types';
import {date, maskAccount} from '../../lib/format';
import {useT} from '../../lib/i18n';
import type {RootStackParamList} from '../../navigations/types';
import {useDB} from '../../store/db';
import {useCurrentMember, usePayoutsFor, useSimulatedLoad} from '../../store/hooks';
import {toast} from '../../store/ui';
import {HelpLink} from '../shared/Help';
import {PAYOUT_STATUS} from '../shared/status';
import {AccountMark, Note, ShowMore, SuccessView} from '../loans/parts';

const STEP = 8;

const KIND: Record<Payout['kind'], [string, string]> = {
  'Loan proceeds': ['Loan money', 'Pera mula sa loan'],
  'Claim benefit': ['Claim benefit', 'Benepisyo mula sa claim'],
  Refund: ['Refund', 'Refund'],
  'Experience refund': ['Experience refund', 'Experience refund'],
};
const KIND_ICON: Record<Payout['kind'], IconName> = {'Loan proceeds': 'coins', 'Claim benefit': 'hospital', Refund: 'receipt', 'Experience refund': 'receipt'};

/** Where PSMBFI sends her money: her accounts (and which one is primary), then every payout. */
export default function Payouts() {
  const t = useT();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const member = useCurrentMember();
  const payouts = usePayoutsFor(member.id);
  const updateMember = useDB(s => s.updateMember);
  const load = useSimulatedLoad();
  const [count, setCount] = useState(STEP);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirm, setConfirm] = useState<PayoutAccount | null>(null);

  const accounts = member.payoutAccounts;
  const primary = accounts.find(a => a.primary);
  const others = accounts.filter(a => !a.primary);
  const history = useMemo(() => [...payouts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [payouts]);
  const shown = history.slice(0, count);

  const makePrimary = (acct: PayoutAccount) => {
    updateMember(member.id, {payoutAccounts: accounts.map(a => ({...a, primary: a.id === acct.id}))});
    setConfirm(null);
    toast(t(`${acct.provider} is now your primary account`, `${acct.provider} na ang iyong primary account`), 'ok', t('New loan money and benefits will go there.', 'Doon na ipapadala ang bagong pera mula sa loan at benepisyo.'));
  };

  const open = (p: Payout) => {
    if (p.refId.startsWith('LN-')) {
      nav.navigate('LoanDetail', {id: p.refId});
    } else if (p.refId.startsWith('CL-')) {
      nav.navigate('ClaimDetail', {id: p.refId});
    }
  };

  return (
    <Screen helpTopic="Payouts" onRefresh={load.retry} title={t('Payouts', 'Payouts')} subtitle={t('Where PSMBFI sends your loan money and benefits. Accounts must be in your name.', 'Kung saan ipinapadala ng PSMBFI ang pera mula sa loan at benepisyo. Dapat nasa pangalan mo ang account.')}>
      <Button title={t('Add an account', 'Magdagdag ng account')} icon="plus" onPress={() => setSheetOpen(true)} testID="payouts-add" />

      {load.error ? (
        <ErrorState onRetry={load.retry} helpTopic="Payouts" />
      ) : load.loading ? (
        <View style={styles.top}>
          <LoadingBlock />
        </View>
      ) : (
        <View style={styles.stack}>
          <View>
            <SectionHead title={t('Your accounts', 'Ang iyong mga account')} count={accounts.length} />
            {accounts.length === 0 ? (
              <Card>
                <EmptyState
                  title={t('No payout account yet', 'Wala pang payout account')}
                  body={t('Add a bank account or e-wallet in your name so we can send money to you faster. Until then, we prepare a cheque at your branch.', 'Magdagdag ng bank account o e-wallet na nasa pangalan mo para mas mabilis naming maipadala ang pera. Habang wala pa, naghahanda kami ng cheke sa iyong sangay.')}
                  action={<HelpLink topic="Payouts" />}
                />
              </Card>
            ) : (
              <View style={styles.list}>
                {primary ? (
                  <Card style={styles.card}>
                    <View style={styles.rowBetween}>
                      <AccountMark account={primary} />
                      <Badge tone="info" label={t('Primary account', 'Primary account')} />
                    </View>
                    <Txt variant="body">{t('Loan money and benefits go to this account.', 'Dito ipinapadala ang pera mula sa loan at mga benepisyo.')}</Txt>
                    <View style={styles.nameRow}>
                      <Txt variant="small" color="soft" style={styles.shrink}>
                        {primary.accountName}
                      </Txt>
                      <VerifiedBadge verified={primary.verified} />
                    </View>
                  </Card>
                ) : null}
                {others.map(a => (
                  <Card key={a.id} style={styles.card}>
                    <View style={styles.rowBetween}>
                      <AccountMark account={a} />
                      <VerifiedBadge verified={a.verified} />
                    </View>
                    <Txt variant="small" color="soft">
                      {a.accountName}
                    </Txt>
                    {a.verified ? (
                      <Button title={t('Make this my primary account', 'Gawin itong primary account')} variant="quiet" onPress={() => setConfirm(a)} testID={`primary-${a.id}`} />
                    ) : (
                      <Note tone="info">{t('We check new accounts within 1 working day. You can make it primary after that.', 'Sinusuri namin ang bagong account sa loob ng 1 araw ng trabaho. Pagkatapos noon, puwede mo na itong gawing primary.')}</Note>
                    )}
                  </Card>
                ))}
              </View>
            )}
          </View>

          <View>
            <SectionHead title={t('Money sent to you', 'Perang ipinadala sa iyo')} count={history.length} />
            {history.length === 0 ? (
              <Card>
                <EmptyState title={t('No payouts yet', 'Wala pang payout')} body={t('Loan money and claim benefits we send you will be listed here.', 'Ililista rito ang perang ipinadala namin mula sa loan at claim.')} action={<HelpLink topic="Payouts" />} />
              </Card>
            ) : (
              <>
                <Card pad={0}>
                  {shown.map((p, i) => (
                    <View key={p.id}>
                      {i > 0 && <Divider />}
                      <PayoutRow p={p} onOpen={() => open(p)} />
                    </View>
                  ))}
                </Card>
                <ShowMore shown={shown.length} total={history.length} step={STEP} onMore={() => setCount(c => c + STEP)} noun={['payouts', 'payout']} />
              </>
            )}
          </View>

          <HelpLink topic="Payouts" />
        </View>
      )}

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm ? t(`Make ${confirm.provider} your primary account?`, `Gawing primary account ang ${confirm.provider}?`) : ''}
        footer={
          <>
            <Button title={t('Yes, make it primary', 'Oo, gawing primary')} icon="check" onPress={() => confirm && makePrimary(confirm)} testID="primary-confirm" />
            <Button title={t('Cancel', 'Kanselahin')} variant="quiet" onPress={() => setConfirm(null)} />
          </>
        }>
        {confirm ? (
          <View style={styles.gap}>
            <Txt variant="body">{t(`From now on, loan money and benefits will be sent to ${confirm.provider} ${maskAccount(confirm.accountNo)}.`, `Mula ngayon, ipapadala ang pera mula sa loan at benepisyo sa ${confirm.provider} ${maskAccount(confirm.accountNo)}.`)}</Txt>
            <Note tone="info">{t('Money already on the way is not affected.', 'Hindi apektado ang perang naipapadala na.')}</Note>
          </View>
        ) : null}
      </Dialog>

      <AddAccountSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </Screen>
  );
}

/**
 * One payout, roomy at large text: the amount and its status first, then what it was and when,
 * then where it went. Loan money and claim benefits open their loan or claim.
 */
function PayoutRow({p, onOpen}: {p: Payout; onOpen: () => void}) {
  const t = useT();
  const {colors} = useTheme();
  const st = PAYOUT_STATUS[p.status];
  const linked = p.refId.startsWith('LN-') || p.refId.startsWith('CL-');
  const loan = p.kind === 'Loan proceeds';
  const when = date(p.settledAt ?? p.createdAt);
  const to = `${t('To', 'Sa')} ${p.provider} ${maskAccount(p.account || '0000')}`;
  const body = (
    <>
      <View style={[styles.rowIcon, {backgroundColor: loan ? colors.primarySoft : colors.tones.ok.bg}]}>
        <Icon name={KIND_ICON[p.kind]} size={24} weight="duotone" color={loan ? colors.primaryText : colors.tones.ok.text} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Txt variant="bodyStrong">{money(p.amount)}</Txt>
          <Badge tone={st.tone} label={t(st.en, st.fil)} />
        </View>
        <Txt variant="small" color="soft">
          {t(...KIND[p.kind])} · {when}
        </Txt>
        <Txt variant="small" color="soft">
          {to}
        </Txt>
      </View>
      {linked ? <Icon name="chevron" size={18} color={colors.textMuted} weight="bold" /> : null}
    </>
  );
  const label = `${money(p.amount)}, ${t(st.en, st.fil)}. ${t(...KIND[p.kind])}, ${when}. ${to}. ${p.refId}`;
  if (!linked) {
    return (
      <View style={styles.row} accessible accessibilityLabel={label}>
        {body}
      </View>
    );
  }
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={loan ? t('Opens the loan', 'Bubuksan ang loan') : t('Opens the claim', 'Bubuksan ang claim')} style={({pressed}) => [styles.row, pressed && {backgroundColor: colors.panel2}]}>
      {body}
    </Pressable>
  );
}

function VerifiedBadge({verified}: {verified: boolean}) {
  const t = useT();
  return verified ? <Badge tone="ok" label={t('Verified', 'Verified')} /> : <Badge tone="warn" label={t('Being checked', 'Sinusuri pa')} />;
}

type Kind = PayoutAccount['kind'];
type FormErrors = Partial<Record<'provider' | 'name' | 'number', string>>;

/** Add a bank account or e-wallet in her own name, then a success view with what happens next. */
function AddAccountSheet({open, onClose}: {open: boolean; onClose: () => void}) {
  const t = useT();
  const member = useCurrentMember();
  const updateMember = useDB(s => s.updateMember);
  const [kind, setKind] = useState<Kind>('bank');
  const [provider, setProvider] = useState('');
  const [name, setName] = useState(memberName(member));
  const [number, setNumber] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<PayoutAccount | null>(null);

  // A fresh form each time the sheet opens.
  useEffect(() => {
    if (open) {
      setKind('bank');
      setProvider('');
      setName(memberName(member));
      setNumber('');
      setErrors({});
      setAdded(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const clear = (k: keyof FormErrors) => setErrors(e => (e[k] ? {...e, [k]: undefined} : e));

  const submit = () => {
    const digits = number.replace(/\D/g, '');
    const e: FormErrors = {};
    if (!provider) {
      e.provider = kind === 'bank' ? t('Choose your bank.', 'Piliin ang iyong bangko.') : t('Choose your e-wallet.', 'Piliin ang iyong e-wallet.');
    }
    if (!name.trim()) {
      e.name = t('Enter the name on the account.', 'Ilagay ang pangalan sa account.');
    } else if (!name.toLowerCase().includes(member.lastName.toLowerCase())) {
      e.name = t(`The account must be in your name, ${memberName(member)}.`, `Dapat nasa pangalan mo ang account, ${memberName(member)}.`);
    }
    if (kind === 'bank' && (digits.length < 10 || digits.length > 16)) {
      e.number = t('Enter your account number: 10 to 16 numbers, numbers only.', 'Ilagay ang account number: 10 hanggang 16 na numero.');
    }
    if (kind === 'ewallet' && !/^09\d{9}$/.test(digits)) {
      e.number = t('Enter the 11-number mobile number of your e-wallet, like 0917 123 4567.', 'Ilagay ang 11-numerong mobile number ng e-wallet, gaya ng 0917 123 4567.');
    }
    if (!e.number && member.payoutAccounts.some(a => a.provider === provider && a.accountNo.replace(/\D/g, '') === digits)) {
      e.number = t('This account is already on your list.', 'Nasa listahan mo na ang account na ito.');
    }
    setErrors(e);
    if (Object.keys(e).length) {
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const accountNo = kind === 'ewallet' ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}` : digits.replace(/(\d{4})(?=\d)/g, '$1 ');
      const acct: PayoutAccount = {id: `ACC-${Date.now().toString(36).toUpperCase()}`, kind, provider, accountName: name.trim(), accountNo, primary: member.payoutAccounts.length === 0, verified: false};
      updateMember(member.id, {payoutAccounts: [...member.payoutAccounts, acct]});
      setBusy(false);
      setAdded(acct);
    }, 700);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('Add a payout account', 'Magdagdag ng payout account')}
      subtitle={added ? undefined : t('Loan money and benefits can only go to an account in your name.', 'Sa account lang na nasa pangalan mo maipapadala ang pera mula sa loan at benepisyo.')}
      footer={
        added ? undefined : (
          <>
            <Button title={t('Add account', 'Idagdag ang account')} icon="plus" busy={busy} onPress={submit} testID="account-submit" />
            <Button title={t('Cancel', 'Kanselahin')} variant="quiet" disabled={busy} onPress={onClose} />
          </>
        )
      }>
      {added ? (
        <SuccessView
          title={t('Account added', 'Naidagdag ang account')}
          body={t(`We added ${added.provider} ${maskAccount(added.accountNo)} to your payout accounts.`, `Naidagdag namin ang ${added.provider} ${maskAccount(added.accountNo)} sa iyong mga payout account.`)}
          refLabel={t('Your reference number', 'Ang iyong reference number')}
          refId={added.id}
          next={[
            {title: t('We check the account', 'Susuriin namin ang account'), body: t('Within 1 working day we confirm that the account is in your name.', 'Sa loob ng 1 araw ng trabaho, titiyakin naming nasa pangalan mo ang account.')},
            {
              title: added.primary ? t('It is your primary account', 'Ito ang iyong primary account') : t('Make it your primary account if you like', 'Gawin itong primary account kung gusto mo'),
              body: added.primary
                ? t('Loan money and benefits go here once it is checked.', 'Dito ipapadala ang pera mula sa loan at benepisyo kapag nasuri na.')
                : t('After it is checked, tap "Make this my primary account" here in Payouts.', 'Kapag nasuri na, i-tap ang "Gawin itong primary account" dito sa Payouts.'),
            },
          ]}
          secondary={<Button title={t('Done', 'Tapos na')} icon="check" variant="quiet" onPress={onClose} testID="account-done" />}
          helpTopic="Payouts"
          onHome={onClose}
        />
      ) : (
        <>
          <View style={styles.gap}>
            <Txt variant="label">{t('Type of account', 'Uri ng account')}</Txt>
            <Segmented
              label={t('Type of account', 'Uri ng account')}
              value={kind}
              onChange={v => {
                setKind(v);
                setProvider('');
                setNumber('');
                setErrors({});
              }}
              options={[
                {value: 'bank', label: t('Bank account', 'Bank account')},
                {value: 'ewallet', label: t('E-wallet', 'E-wallet')},
              ]}
            />
          </View>
          <SelectField
            label={kind === 'bank' ? t('Bank', 'Bangko') : t('E-wallet', 'E-wallet')}
            value={provider}
            placeholder={kind === 'bank' ? t('Choose your bank', 'Piliin ang bangko') : t('Choose your e-wallet', 'Piliin ang e-wallet')}
            options={(kind === 'bank' ? BANKS : EWALLETS).map(b => ({value: b as string, label: b}))}
            onChange={v => {
              setProvider(v);
              clear('provider');
            }}
            error={errors.provider}
          />
          <TextField
            label={t('Name on the account', 'Pangalan sa account')}
            value={name}
            onChangeText={v => {
              setName(v);
              clear('name');
            }}
            error={errors.name}
            hint={t('It must be your own account. We cannot send money to other people.', 'Dapat sarili mong account ito. Hindi kami makakapagpadala sa ibang tao.')}
            autoComplete="name"
            autoCapitalize="words"
          />
          <TextField
            label={kind === 'bank' ? t('Account number', 'Account number') : t('Mobile number of the e-wallet', 'Mobile number ng e-wallet')}
            value={number}
            onChangeText={v => {
              setNumber(v);
              clear('number');
            }}
            error={errors.number}
            hint={kind === 'bank' ? t('Numbers only, as printed on your passbook or ATM card.', 'Numero lang, ayon sa passbook o ATM card.') : t('For example 0917 123 4567.', 'Halimbawa 0917 123 4567.')}
            keyboardType={kind === 'bank' ? 'number-pad' : 'phone-pad'}
            autoComplete="off"
            testID="account-number"
          />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  shrink: {flexShrink: 1},
  top: {marginTop: 22},
  stack: {gap: 30, marginTop: 26},
  list: {gap: 14},
  card: {gap: 12},
  gap: {gap: 10},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap'},
  nameRow: {flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap'},
  row: {flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 68, paddingVertical: 14, paddingHorizontal: 16},
  rowIcon: {width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  rowBody: {flex: 1, gap: 2},
  rowTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 10, rowGap: 4},
});
