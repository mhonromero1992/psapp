import { useMemo, useState } from "react";
import { Link } from "react-router";
import { CheckCircle, Coins, FirstAidKit, HandCoins, House, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { date, maskAccount, peso } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { BANKS, EWALLETS } from "@/data/reference";
import { memberName } from "@/data/generate";
import type { Payout, PayoutAccount } from "@/data/types";
import { useDB } from "@/store/db";
import { useCurrentMember, usePayoutsFor, useSimulatedLoad } from "@/store/hooks";
import { PAYOUT_STATUS } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog, Sheet } from "@/components/ui/Dialog";
import { Input, Select } from "@/components/ui/Field";
import { AccountMark } from "../parts/Bits";
import { useMemberActor } from "../parts/download";
import { BigSegmented, MField } from "../parts/Form";
import { HelpLink } from "../parts/Help";
import { Empty, LoadError, PageHead, PageSkeleton, SectionHead, ShowMoreButton, StatusBadge, useShowMore, WRAP_BTN } from "../parts/Page";

type Kind = PayoutAccount["kind"];
type FormErrors = Partial<Record<"provider" | "name" | "number", string>>;

export default function Payouts() {
  const t = useT();
  const member = useCurrentMember();
  const payouts = usePayoutsFor(member.id);
  const updateMember = useDB((s) => s.updateMember);
  const actor = useMemberActor(member);
  const load = useSimulatedLoad();
  const list = useShowMore(8);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirm, setConfirm] = useState<PayoutAccount | null>(null);

  const accounts = member.payoutAccounts;
  const primary = accounts.find((a) => a.primary);
  const others = accounts.filter((a) => !a.primary);
  const history = useMemo(() => [...payouts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [payouts]);
  const shown = history.slice(0, list.count);

  const makePrimary = (acct: PayoutAccount) => {
    updateMember(member.id, { payoutAccounts: accounts.map((a) => ({ ...a, primary: a.id === acct.id })) }, actor);
    setConfirm(null);
    toast.success(t(`${acct.provider} is now your primary account`, `${acct.provider} na ang iyong primary account`), { description: t("New loan money and benefits will go there.", "Doon na ipapadala ang bagong pera mula sa loan at benepisyo.") });
  };

  return (
    <div>
      <PageHead
        title={t("Payouts", "Payouts")}
        helper={t("Where PSMBFI sends your loan money and benefits. Accounts must be in your name.", "Kung saan ipinapadala ng PSMBFI ang pera mula sa loan at benepisyo. Dapat nasa pangalan mo ang account.")}
        action={
          <Button size="lg" icon={<Plus size="1.25rem" weight="bold" />} onClick={() => setSheetOpen(true)}>
            {t("Add an account", "Magdagdag ng account")}
          </Button>
        }
      />

      {load.error ? (
        <LoadError onRetry={load.retry} helpTopic="Payouts" />
      ) : load.loading ? (
        <PageSkeleton shape="cards" />
      ) : (
        <div className="grid gap-10 xl:grid-cols-12 xl:gap-6">
          <section aria-labelledby="accounts-title" className="xl:col-span-5">
            <SectionHead id="accounts-title" title={t("Your accounts", "Ang iyong mga account")} count={accounts.length} />
            {accounts.length === 0 ? (
              <div className="rounded-lg bg-surface shadow-e1">
                <Empty title={t("No payout account yet", "Wala pang payout account")} body={t("Add a bank account or e-wallet in your name so we can send money to you faster.", "Magdagdag ng bank account o e-wallet na nasa pangalan mo para mas mabilis naming maipadala ang pera.")} action={<Button size="lg" onClick={() => setSheetOpen(true)}>{t("Add an account", "Magdagdag ng account")}</Button>} helpTopic="Payouts" />
              </div>
            ) : (
              <div className="space-y-3">
                {primary && (
                  <article className="rounded-xl bg-surface p-5 shadow-e2 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <AccountMark account={primary} />
                      <StatusBadge tone="brand">{t("Primary account", "Primary account")}</StatusBadge>
                    </div>
                    <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink">{t("Loan money and benefits go to this account.", "Dito ipinapadala ang pera mula sa loan at mga benepisyo.")}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[1rem] text-ink-2">
                      <span>{primary.accountName}</span>
                      {primary.verified ? <StatusBadge tone="positive">{t("Verified", "Verified")}</StatusBadge> : <StatusBadge tone="caution">{t("Being checked", "Sinusuri pa")}</StatusBadge>}
                    </p>
                  </article>
                )}
                {others.map((a) => (
                  <article key={a.id} className="rounded-xl bg-surface p-5 shadow-e1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <AccountMark account={a} />
                      {a.verified ? <StatusBadge tone="positive">{t("Verified", "Verified")}</StatusBadge> : <StatusBadge tone="caution">{t("Being checked", "Sinusuri pa")}</StatusBadge>}
                    </div>
                    <p className="mt-3 text-[1rem] text-ink-2">{a.accountName}</p>
                    {a.verified ? (
                      <Button variant="quiet" size="lg" block className={`mt-4 ${WRAP_BTN}`} onClick={() => setConfirm(a)}>
                        {t("Make this my primary account", "Gawin itong primary account")}
                      </Button>
                    ) : (
                      <p className="mt-3 rounded-md bg-sunken px-4 py-3 text-[1rem] text-ink">{t("We check new accounts within 1 working day. You can make it primary after that.", "Sinusuri namin ang bagong account sa loob ng 1 araw ng trabaho. Pagkatapos noon, puwede mo na itong gawing primary.")}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="history-title" className="xl:col-span-7">
            <SectionHead id="history-title" title={t("Money sent to you", "Perang ipinadala sa iyo")} count={history.length} />
            {history.length === 0 ? (
              <div className="rounded-lg bg-surface shadow-e1">
                <Empty title={t("No payouts yet", "Wala pang payout")} body={t("Loan money and claim benefits we send you will be listed here.", "Ililista rito ang perang ipinadala namin mula sa loan at claim.")} helpTopic="Payouts" />
              </div>
            ) : (
              <>
                <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-lg bg-surface shadow-e1">
                  {shown.map((p) => (
                    <li key={p.id}>
                      <PayoutRow p={p} />
                    </li>
                  ))}
                </ul>
                <ShowMoreButton shown={shown.length} total={history.length} step={8} onMore={list.more} noun={{ en: "payouts", fil: "payout" }} />
              </>
            )}
            <HelpLink topic="Payouts" className="mt-6" />
          </section>
        </div>
      )}

      <Dialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={confirm ? t(`Make ${confirm.provider} your primary account?`, `Gawing primary account ang ${confirm.provider}?`) : ""}
        footer={
          <>
            <Button variant="quiet" size="lg" className={WRAP_BTN} onClick={() => setConfirm(null)}>
              {t("Cancel", "Kanselahin")}
            </Button>
            <Button size="lg" className={WRAP_BTN} onClick={() => confirm && makePrimary(confirm)}>
              {t("Yes, make it primary", "Oo, gawing primary")}
            </Button>
          </>
        }
      >
        {confirm && (
          <div className="space-y-3">
            <p className="text-[1.0625rem] leading-relaxed text-ink">{t(`From now on, loan money and benefits will be sent to ${confirm.provider} ${maskAccount(confirm.accountNo)}.`, `Mula ngayon, ipapadala ang pera mula sa loan at benepisyo sa ${confirm.provider} ${maskAccount(confirm.accountNo)}.`)}</p>
            <p className="rounded-md bg-sunken px-4 py-3 text-[1rem] text-ink-2">{t("Money already on the way is not affected.", "Hindi apektado ang perang naipapadala na.")}</p>
          </div>
        )}
      </Dialog>

      <AddAccountSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}

const KIND: Record<Payout["kind"], [string, string]> = {
  "Loan proceeds": ["Loan money", "Pera mula sa loan"],
  "Claim benefit": ["Claim benefit", "Benepisyo mula sa claim"],
  Refund: ["Refund", "Refund"],
  "Experience refund": ["Experience refund", "Experience refund"],
};
/** Plain words for payout states (the shared labels are back-office terms). */
const PAYOUT_WORDS: Record<Payout["status"], [string, string]> = {
  queued: ["Waiting to be sent", "Naghihintay ipadala"],
  for_approval: ["Waiting for approval", "Naghihintay ng approval"],
  approved: ["Approved", "Aprubado"],
  sent: ["Sent", "Naipadala"],
  settled: ["In your account", "Nasa account mo na"],
  failed: ["Did not go through", "Hindi natuloy"],
};

function PayoutRow({ p }: { p: Payout }) {
  const t = useT();
  const st = PAYOUT_STATUS[p.status];
  const Icon = p.kind === "Loan proceeds" ? HandCoins : p.kind === "Claim benefit" ? FirstAidKit : Coins;
  const to = p.refId.startsWith("LN-") ? `/member/loans/${p.refId}` : p.refId.startsWith("CL-") ? `/member/claims/${p.refId}` : null;
  const inner = (
    <>
      <span className={cn("mt-0.5 grid size-11 shrink-0 place-items-center rounded-full", p.kind === "Loan proceeds" ? "bg-primary-soft text-primary" : "bg-positive-soft text-positive")}>
        <Icon size="1.35rem" weight="duotone" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-[1.0625rem] font-semibold leading-snug text-ink">{t(...KIND[p.kind])}</span>
          <span className="text-[1.125rem] font-bold text-ink tnum">{peso(p.amount)}</span>
        </span>
        <span className="mt-0.5 block text-[0.9375rem] text-ink-2 tnum">
          {p.refId} · {date(p.settledAt ?? p.createdAt)}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="text-[0.9375rem] text-ink-2 tnum">
            {t("To", "Sa")} {p.provider} {maskAccount(p.account || "0000")}
          </span>
          <StatusBadge tone={st.tone}>{t(...PAYOUT_WORDS[p.status])}</StatusBadge>
        </span>
      </span>
    </>
  );
  const cls = "flex min-h-[3.75rem] items-start gap-3.5 px-4 py-4 sm:px-5";
  return to ? (
    <Link to={to} className={cn(cls, "transition-colors hover:bg-surface-2")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function AddAccountSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const member = useCurrentMember();
  const updateMember = useDB((s) => s.updateMember);
  const actor = useMemberActor(member);
  const [kind, setKind] = useState<Kind>("bank");
  const [provider, setProvider] = useState("");
  const [name, setName] = useState(memberName(member));
  const [number, setNumber] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<PayoutAccount | null>(null);

  const reset = () => {
    setKind("bank");
    setProvider("");
    setName(memberName(member));
    setNumber("");
    setErrors({});
    setAdded(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = number.replace(/\D/g, "");
    const errs: FormErrors = {};
    if (!provider) errs.provider = kind === "bank" ? t("Choose your bank.", "Piliin ang iyong bangko.") : t("Choose your e-wallet.", "Piliin ang iyong e-wallet.");
    if (!name.trim()) errs.name = t("Enter the name on the account.", "Ilagay ang pangalan sa account.");
    else if (!name.toLowerCase().includes(member.lastName.toLowerCase())) errs.name = t(`The account must be in your name, ${memberName(member)}.`, `Dapat nasa pangalan mo ang account, ${memberName(member)}.`);
    if (kind === "bank" && (digits.length < 10 || digits.length > 16)) errs.number = t("Enter your account number: 10 to 16 digits, numbers only.", "Ilagay ang account number: 10 hanggang 16 na numero.");
    if (kind === "ewallet" && !/^09\d{9}$/.test(digits)) errs.number = t("Enter the 11-digit mobile number of your e-wallet, like 0917 123 4567.", "Ilagay ang 11-digit na mobile number ng e-wallet, gaya ng 0917 123 4567.");
    if (!errs.number && member.payoutAccounts.some((a) => a.provider === provider && a.accountNo.replace(/\D/g, "") === digits)) errs.number = t("This account is already on your list.", "Nasa listahan mo na ang account na ito.");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    window.setTimeout(() => {
      const accountNo = kind === "ewallet" ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}` : digits.replace(/(\d{4})(?=\d)/g, "$1 ");
      const acct: PayoutAccount = { id: `ACC-${Date.now().toString(36).toUpperCase()}`, kind, provider, accountName: name.trim(), accountNo, primary: member.payoutAccounts.length === 0, verified: false };
      updateMember(member.id, { payoutAccounts: [...member.payoutAccounts, acct] }, actor);
      setBusy(false);
      setAdded(acct);
      toast.success(t("Account added", "Naidagdag ang account"), { description: `${provider} ${maskAccount(accountNo)}` });
    }, 700);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) window.setTimeout(reset, 300);
      }}
      title={added ? t("Account added", "Naidagdag ang account") : t("Add a payout account", "Magdagdag ng payout account")}
      footer={
        added ? undefined : (
          <>
            <Button variant="quiet" size="lg" className={WRAP_BTN} onClick={() => onOpenChange(false)}>
              {t("Cancel", "Kanselahin")}
            </Button>
            <Button size="lg" className={WRAP_BTN} type="submit" form="add-account" loading={busy} loadingLabel={t("Adding", "Idinadagdag")}>
              {t("Add account", "Idagdag ang account")}
            </Button>
          </>
        )
      }
    >
      {added ? (
        <div role="status" className="pb-2">
          <span className="grid size-14 place-items-center rounded-full bg-positive-soft text-positive">
            <CheckCircle size="2rem" weight="fill" aria-hidden />
          </span>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink">{t(`We added ${added.provider} ${maskAccount(added.accountNo)} to your payout accounts.`, `Naidagdag namin ang ${added.provider} ${maskAccount(added.accountNo)} sa iyong mga payout account.`)}</p>
          <h3 className="mt-6 text-[1.125rem] font-bold">{t("What happens next", "Ano ang susunod")}</h3>
          <p className="mt-1.5 text-[1.0625rem] leading-relaxed text-ink-2">{t("We check that the account is in your name within 1 working day. After that you can make it your primary account.", "Titingnan namin kung nasa pangalan mo ang account sa loob ng 1 araw ng trabaho. Pagkatapos noon, puwede mo na itong gawing primary account.")}</p>
          <div className="mt-6 flex flex-col gap-3 [&>*]:h-auto [&>*]:min-h-[var(--btn-h)] [&>*]:whitespace-normal [&>*]:py-2.5">
            <ButtonLink to="/member" size="lg" icon={<House size="1.25rem" weight="bold" />} onClick={() => onOpenChange(false)}>
              {t("Back to Home", "Bumalik sa Home")}
            </ButtonLink>
            <Button variant="quiet" size="lg" onClick={() => onOpenChange(false)}>
              {t("Done", "Tapos na")}
            </Button>
          </div>
        </div>
      ) : (
        <form id="add-account" onSubmit={submit} noValidate className="space-y-5">
          <div>
            <p className="mb-2 text-[1rem] font-semibold">{t("Type of account", "Uri ng account")}</p>
            <BigSegmented
              value={kind}
              onValueChange={(v) => {
                setKind(v);
                setProvider("");
                setNumber("");
                setErrors({});
              }}
              ariaLabel={t("Type of account", "Uri ng account")}
              options={[
                { value: "bank", label: t("Bank account", "Bank account") },
                { value: "ewallet", label: t("E-wallet", "E-wallet") },
              ]}
            />
          </div>
          <MField label={kind === "bank" ? t("Bank", "Bangko") : t("E-wallet", "E-wallet")} error={errors.provider}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} value={provider} onChange={(e) => setProvider(e.target.value)} aria-describedby={describedBy} invalid={invalid} className="text-[1.0625rem]">
                <option value="">{kind === "bank" ? t("Choose your bank", "Piliin ang bangko") : t("Choose your e-wallet", "Piliin ang e-wallet")}</option>
                {(kind === "bank" ? BANKS : EWALLETS).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            )}
          </MField>
          <MField label={t("Name on the account", "Pangalan sa account")} error={errors.name} hint={t("It must be your own account. We cannot send money to other people.", "Dapat sarili mong account ito. Hindi kami makakapagpadala sa ibang tao.")}>
            {({ id, describedBy, invalid }) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} aria-describedby={describedBy} invalid={invalid} autoComplete="name" className="text-[1.0625rem]" />}
          </MField>
          <MField label={kind === "bank" ? t("Account number", "Account number") : t("Mobile number of the e-wallet", "Mobile number ng e-wallet")} error={errors.number} hint={kind === "bank" ? t("Numbers only, as printed on your passbook or ATM card.", "Numero lang, ayon sa passbook o ATM card.") : t("For example 0917 123 4567.", "Halimbawa 0917 123 4567.")}>
            {({ id, describedBy, invalid }) => <Input id={id} value={number} onChange={(e) => setNumber(e.target.value)} inputMode="numeric" aria-describedby={describedBy} invalid={invalid} autoComplete="off" className="text-[1.0625rem] tnum" />}
          </MField>
        </form>
      )}
    </Sheet>
  );
}
