import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { AnimatePresence } from "motion/react";
import { Bank, DeviceMobile, PaperPlaneTilt, PencilSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { amortization, maskAccount, peso } from "@/lib/format";
import { useLang, useT } from "@/lib/i18n";
import { LOAN_PRODUCTS, LOAN_PRODUCT_BY_ID } from "@/data/reference";
import type { Loan, LoanProduct, LoanProductId } from "@/data/types";
import { useDB } from "@/store/db";
import { useCurrentMember, useEquity, useLoansFor, useSimulatedLoad } from "@/store/hooks";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox, RadioCards } from "@/components/ui/Choice";
import { Dialog } from "@/components/ui/Dialog";
import { MoneyInput, Textarea } from "@/components/ui/Field";
import { OtpInput } from "@/components/ui/OtpInput";
import { Ribbon } from "@/components/brand/Ribbon";
import { StepFrame, SuccessPanel } from "../parts/Bits";
import { DeductionMeter, RangeSlider } from "../parts/Controls";
import { FlowNav, FlowProgress } from "../parts/Flow";
import { CardNote, FieldError, GroupLabel, MField } from "../parts/Form";
import { HelpLink } from "../parts/Help";
import { eligibilityFor, firstDeduction, maxFor, stepFor } from "../parts/loans";
import { LoadError, PageHead, PageSkeleton, WRAP_BTN } from "../parts/Page";
import { monthYear, nowMs } from "../parts/text";

type Errors = Partial<Record<"product" | "amount" | "term" | "purpose" | "calamity" | "account" | "consent", string>>;

const defaultAmount = (p: LoanProduct, max: number) => {
  const step = stepFor(p.minAmount, max);
  return Math.min(max, Math.max(p.minAmount, Math.round((p.minAmount + (max - p.minAmount) * 0.3) / step) * step));
};
const middleTerm = (p: LoanProduct) => p.terms[Math.floor((p.terms.length - 1) / 2)];

export default function LoanApply() {
  const t = useT();
  const lang = useLang();
  const [params] = useSearchParams();
  const member = useCurrentMember();
  const equity = useEquity(member);
  const loans = useLoansFor(member.id);
  const applyLoan = useDB((s) => s.applyLoan);
  const load = useSimulatedLoad(350);

  const months = equity?.months ?? 0;
  const equityValue = equity?.equityValue ?? 0;
  const eligible = (p: LoanProduct) => eligibilityFor(p, member, months, loans).ok;

  const requested = params.get("product");
  const start = requested && LOAN_PRODUCT_BY_ID[requested] && eligible(LOAN_PRODUCT_BY_ID[requested]) ? (requested as LoanProductId) : "";

  const [step, setStep] = useState(0);
  const [moved, setMoved] = useState(false);
  const [productId, setProductId] = useState<LoanProductId | "">(start);
  const [amount, setAmount] = useState<number | "">(() => (start ? defaultAmount(LOAN_PRODUCT_BY_ID[start], maxFor(LOAN_PRODUCT_BY_ID[start], equityValue)) : ""));
  const [term, setTerm] = useState<number | "">("");
  const [purpose, setPurpose] = useState("");
  const [calamity, setCalamity] = useState(false);
  const verified = member.payoutAccounts.filter((a) => a.verified);
  const [accountId, setAccountId] = useState<string>(() => (verified.find((a) => a.primary) ?? verified[0])?.id ?? "");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Loan | null>(null);

  const p = productId ? LOAN_PRODUCT_BY_ID[productId] : null;
  const max = p ? maxFor(p, equityValue) : 0;
  const amt = typeof amount === "number" ? amount : 0;
  const months2 = typeof term === "number" ? term : p ? middleTerm(p) : 12;
  const monthly = p && amt ? Math.round(amortization(amt, p.rate, months2) * 100) / 100 : 0;
  const totalInterest = Math.max(0, Math.round((monthly * months2 - amt) * 100) / 100);
  const currentDeductions = useMemo(() => loans.filter((l) => l.status === "released").reduce((s, l) => s + l.monthly, 0), [loans]);
  const mep = equity?.monthly ?? Math.round(member.basePay * 0.03 * 100) / 100;
  const account = member.payoutAccounts.find((a) => a.id === accountId);
  const accountLabel = account ? `${account.provider} ${maskAccount(account.accountNo)}` : t("Cheque at your branch", "Cheke sa iyong sangay");
  const firstPay = p ? monthYear(firstDeduction({ releasedAt: null, appliedAt: new Date(nowMs()).toISOString() }, p.processingDays), lang) : "";
  const mobileParts = member.mobile.split(" ");
  const maskedMobile = mobileParts.length === 3 ? `${mobileParts[0]} ••• ${mobileParts[2]}` : maskAccount(member.mobile);

  const STEPS = [t("Loan type", "Uri ng loan"), t("Amount", "Halaga"), t("Months to pay", "Ilang buwan"), t("Purpose", "Layunin"), t("Where to send", "Saan ipapadala"), t("Review", "Suriin")];

  const chooseProduct = (id: LoanProductId) => {
    const np = LOAN_PRODUCT_BY_ID[id];
    const nmax = maxFor(np, equityValue);
    setProductId(id);
    if (amount === "" || amount < np.minAmount || amount > nmax) setAmount(defaultAmount(np, nmax));
    if (term !== "" && !np.terms.includes(term)) setTerm("");
    setErrors({});
  };

  const validate = (s: number): Errors => {
    const e: Errors = {};
    if (s === 0 && !p) e.product = t("Choose a loan to continue.", "Pumili ng loan para magpatuloy.");
    if (s === 1 && p) {
      if (amount === "") e.amount = t("Enter how much you need.", "Ilagay kung magkano ang kailangan mo.");
      else if (amount < p.minAmount) e.amount = t(`The smallest amount for this loan is ${peso(p.minAmount, { whole: true })}.`, `Ang pinakamaliit na halaga para sa loan na ito ay ${peso(p.minAmount, { whole: true })}.`);
      else if (amount > max) e.amount = t(`The most you can borrow is ${peso(max, { whole: true })}.`, `Ang pinakamalaking mahihiram mo ay ${peso(max, { whole: true })}.`);
    }
    if (s === 2 && term === "") e.term = t("Choose how many months you will pay.", "Piliin kung ilang buwan mo babayaran.");
    if (s === 3) {
      if (purpose.trim().length < 10) e.purpose = t("Tell us in a few words what the loan is for (at least 10 letters).", "Sabihin sa ilang salita kung para saan ang loan (hindi bababa sa 10 letra).");
      if (p?.id === "CAL" && !calamity) e.calamity = t("Please confirm that you live or work in a declared calamity area.", "Pakikumpirma na nakatira o nagtatrabaho ka sa lugar na may deklaradong kalamidad.");
    }
    if (s === 4 && !accountId && verified.length > 0) e.account = t("Choose where we should send the money.", "Piliin kung saan namin ipapadala ang pera.");
    if (s === 5 && !consent) e.consent = t("Please tick the box to agree before you continue.", "Paki-tsek ang kahon para sumang-ayon bago magpatuloy.");
    return e;
  };

  const go = (to: number) => {
    setErrors({});
    setMoved(true);
    setStep(to);
  };
  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < STEPS.length - 1) return go(step + 1);
    setPin("");
    setPinError(null);
    setConfirmOpen(true);
    toast.info(t("Sample PIN: 123456", "Sample na PIN: 123456"), { description: t("In the real app the PIN arrives by SMS. Any 6 digits work here.", "Sa totoong app, darating ang PIN sa SMS. Kahit anong 6 na numero ay puwede rito.") });
  };

  const submit = () => {
    if (!/^\d{6}$/.test(pin)) {
      setPinError(t("Enter all 6 digits of the PIN.", "Ilagay ang lahat ng 6 na numero ng PIN."));
      return;
    }
    if (!p || typeof amount !== "number" || typeof term !== "number") return;
    setBusy(true);
    window.setTimeout(() => {
      const loan = applyLoan({ memberId: member.id, productId: p.id, principal: amount, termMonths: term, purpose: purpose.trim(), payoutAccountId: accountId, channel: "Member App" });
      setBusy(false);
      setConfirmOpen(false);
      setDone(loan);
      toast.success(t("Application sent", "Naipadala ang application"), { description: loan.id });
    }, 900);
  };

  if (done && p) {
    return (
      <SuccessPanel
        title={t("Application sent", "Naipadala ang application")}
        body={t(`We received your ${p.name} application for ${peso(done.principal)}.`, `Natanggap namin ang iyong application sa ${p.name} na ${peso(done.principal)}.`)}
        refLabel={t("Your reference number", "Ang iyong reference number")}
        refId={done.id}
        next={[
          { title: t("We check your application", "Susuriin namin ang application"), body: t(`Within ${p.processingDays} working days. You will get a notification in this app.`, `Sa loob ng ${p.processingDays} araw ng trabaho. Makakatanggap ka ng abiso sa app na ito.`) },
          { title: t("We send the money", "Ipapadala namin ang pera"), body: t(`Once approved, ${peso(done.principal)} goes to ${done.payoutLabel}.`, `Kapag naaprubahan, ipapadala ang ${peso(done.principal)} sa ${done.payoutLabel}.`) },
          { title: t("Your payments start", "Magsisimula ang hulog"), body: t(`${peso(done.monthly)} a month is deducted from your pay, starting with your ${firstPay} pay (estimate).`, `${peso(done.monthly)} kada buwan ang ikakaltas sa sahod, simula sa sahod ng ${firstPay} (tantya).`) },
        ]}
        secondary={
          <ButtonLink to={`/member/loans/${done.id}`} variant="quiet" size="lg" className="w-full sm:w-auto">
            {t("See my application", "Tingnan ang application")}
          </ButtonLink>
        }
        helpTopic="Loans"
      />
    );
  }

  return (
    <div>
      <PageHead back={{ to: "/member/loans", label: t("Loans", "Mga loan") }} title={t("Apply for a loan", "Mag-apply ng loan")} helper={t("It takes about 5 minutes. You can go back and change any answer before you send it.", "Mga 5 minuto lang ito. Puwede kang bumalik at baguhin ang sagot bago ipadala.")} />

      {load.error ? (
        <LoadError onRetry={load.retry} helpTopic="Loans" />
      ) : load.loading ? (
        <PageSkeleton shape="form" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <FlowProgress steps={STEPS} current={step} />
            <div className="rounded-xl bg-surface p-5 shadow-e1 sm:p-7">
              <AnimatePresence mode="wait" initial={false}>
                {step === 0 && (
                  <StepFrame key="s0" focusOnMount={moved} title={t("Which loan do you need?", "Anong loan ang kailangan mo?")} helper={t("Choose one. You can read more about each loan on the Loans page.", "Pumili ng isa. Mababasa ang detalye ng bawat loan sa pahina ng Loans.")}>
                    <RadioCards
                      ariaLabel={t("Loan type", "Uri ng loan")}
                      value={productId}
                      onValueChange={(v) => chooseProduct(v)}
                      options={LOAN_PRODUCTS.map((lp) => {
                        const elig = eligibilityFor(lp, member, months, loans);
                        return {
                          value: lp.id,
                          icon: <Ribbon stripes={lp.ribbon} size="lg" className="mt-1" />,
                          label: <span className="text-[1.0625rem]">{lp.name}</span>,
                          description: (
                            <CardNote>
                              {t(lp.purpose, lp.purposeFil)}
                              <span className="mt-1 block font-semibold text-ink">
                                {t(`Up to ${peso(maxFor(lp, equityValue), { whole: true })} · ${Math.round(lp.rate * 100)}% a year`, `Hanggang ${peso(maxFor(lp, equityValue), { whole: true })} · ${Math.round(lp.rate * 100)}% kada taon`)}
                              </span>
                              {!elig.ok && <span className="mt-1 block font-semibold text-negative">{t(elig.en, elig.fil)}</span>}
                              {elig.ok && elig.tone === "caution" && <span className="mt-1 block text-caution">{t(elig.en, elig.fil)}</span>}
                            </CardNote>
                          ),
                          disabled: !elig.ok,
                        };
                      })}
                    />
                    {errors.product && <div className="mt-3"><FieldError>{errors.product}</FieldError></div>}
                  </StepFrame>
                )}

                {step === 1 && p && (
                  <StepFrame key="s1" focusOnMount={moved} title={t("How much do you need?", "Magkano ang kailangan mo?")} helper={t(`${p.name}: from ${peso(p.minAmount, { whole: true })} up to ${peso(max, { whole: true })}.`, `${p.name}: mula ${peso(p.minAmount, { whole: true })} hanggang ${peso(max, { whole: true })}.`)}>
                    <MField label={t("Loan amount", "Halaga ng loan")} error={errors.amount} hint={p.id === "POL" ? t("Your limit is 90% of your Equity Value.", "Ang limit mo ay 90% ng iyong Equity Value.") : undefined}>
                      {({ id, describedBy, invalid }) => <MoneyInput id={id} value={amount} onChange={setAmount} invalid={invalid} describedBy={describedBy} max={max} className="[&_input]:min-h-14 [&_input]:text-[1.35rem]" />}
                    </MField>
                    <RangeSlider
                      className="mt-4"
                      value={amt}
                      min={p.minAmount}
                      max={max}
                      step={stepFor(p.minAmount, max)}
                      onChange={(v) => setAmount(v)}
                      label={t("Loan amount slider", "Slider ng halaga ng loan")}
                      valueText={peso(amt, { whole: true })}
                    />
                    <div className="mt-1 flex justify-between text-[0.9375rem] text-ink-2 tnum">
                      <span>{peso(p.minAmount, { whole: true })}</span>
                      <span>{peso(max, { whole: true })}</span>
                    </div>
                    {amt >= p.minAmount && amt <= max && (
                      <p className="mt-5 rounded-md bg-primary-soft px-4 py-3 text-[1rem] leading-relaxed text-ink">
                        {t(`About ${peso(monthly)} a month if you pay over ${months2} months. You choose the months next.`, `Mga ${peso(monthly)} kada buwan kung babayaran sa ${months2} buwan. Pipiliin mo ang buwan sa susunod.`)}
                      </p>
                    )}
                  </StepFrame>
                )}

                {step === 2 && p && (
                  <StepFrame key="s2" focusOnMount={moved} title={t("How many months will you pay?", "Ilang buwan mo ito babayaran?")} helper={t("More months means a smaller amount each month, but more interest in total.", "Mas maraming buwan, mas maliit ang buwanang hulog pero mas malaki ang kabuuang interes.")}>
                    <RadioCards
                      ariaLabel={t("Months to pay", "Ilang buwan")}
                      value={term === "" ? "" : String(term)}
                      onValueChange={(v) => {
                        setTerm(Number(v));
                        setErrors({});
                      }}
                      columns={2}
                      options={p.terms.map((m) => {
                        const mo = Math.round(amortization(amt, p.rate, m) * 100) / 100;
                        return {
                          value: String(m),
                          label: <span className="text-[1.0625rem]">{t(`${m} months`, `${m} buwan`)}</span>,
                          description: (
                            <CardNote>
                              <span className="font-semibold text-ink tnum">{peso(mo)}</span> {t("a month", "kada buwan")}
                            </CardNote>
                          ),
                        };
                      })}
                    />
                    {errors.term && <div className="mt-3"><FieldError>{errors.term}</FieldError></div>}

                    {term !== "" && (
                      <div className="mt-6 space-y-5">
                        <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-4 rounded-lg bg-sunken p-4">
                          <div>
                            <dt className="text-[0.9375rem] text-ink-2">{t("Each month", "Kada buwan")}</dt>
                            <dd className="font-display text-[1.6rem] font-bold leading-tight [font-stretch:88%]">{peso(monthly)}</dd>
                          </div>
                          <div>
                            <dt className="text-[0.9375rem] text-ink-2">{t("Total interest", "Kabuuang interes")}</dt>
                            <dd className="text-[1.125rem] font-semibold tnum">{peso(totalInterest)}</dd>
                          </div>
                          <div>
                            <dt className="text-[0.9375rem] text-ink-2">{t("Total to pay back", "Kabuuang babayaran")}</dt>
                            <dd className="text-[1.125rem] font-semibold tnum">{peso(amt + totalInterest)}</dd>
                          </div>
                        </dl>
                        <div>
                          <p className="text-[1.0625rem] font-semibold text-ink">{t("What comes out of your pay each month", "Ano ang ikakaltas sa sahod mo kada buwan")}</p>
                          <p className="mt-1 text-[1rem] text-ink-2">{t(`Your base pay is ${peso(member.basePay)} a month. Your 3% contribution is already deducted today.`, `Ang base pay mo ay ${peso(member.basePay)} kada buwan. Kinakaltas na ngayon ang iyong 3% na kontribusyon.`)}</p>
                          <DeductionMeter
                            className="mt-4"
                            total={member.basePay}
                            caption={t("Base pay and PSMBFI deductions after this loan", "Base pay at mga kaltas ng PSMBFI pagkatapos ng loan na ito")}
                            restLabel={t("Rest of your base pay (before other payroll deductions)", "Natitira sa base pay (bago ang ibang kaltas sa payroll)")}
                            parts={[
                              { key: "mep", label: t("Your 3% contribution (already deducted)", "Ang 3% na kontribusyon (kinakaltas na)"), value: mep, color: "var(--chart-2)" },
                              ...(currentDeductions > 0 ? [{ key: "current", label: t("Your current loan payments", "Kasalukuyang hulog sa loan"), value: currentDeductions, color: "var(--chart-ref)" }] : []),
                              { key: "new", label: t("This new loan", "Ang bagong loan na ito"), value: monthly, color: "var(--chart-1)" },
                            ]}
                          />
                          <p className="mt-4 text-[1rem] leading-relaxed text-ink">
                            {t(
                              `After this loan, PSMBFI would deduct ${peso(mep + currentDeductions + monthly)} a month, ${Math.round(((mep + currentDeductions + monthly) / member.basePay) * 100)}% of your base pay.`,
                              `Pagkatapos ng loan na ito, ${peso(mep + currentDeductions + monthly)} kada buwan ang ikakaltas ng PSMBFI, ${Math.round(((mep + currentDeductions + monthly) / member.basePay) * 100)}% ng iyong base pay.`,
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </StepFrame>
                )}

                {step === 3 && p && (
                  <StepFrame key="s3" focusOnMount={moved} title={t("What is the loan for?", "Para saan ang loan?")} helper={t("A short answer is enough.", "Sapat na ang maikling sagot.")}>
                    <MField label={t("Purpose of the loan", "Layunin ng loan")} error={errors.purpose} hint={t("For example: tuition for my child, house repairs.", "Halimbawa: matrikula ng anak, pagpapaayos ng bahay.")}>
                      {({ id, describedBy, invalid }) => <Textarea id={id} rows={4} value={purpose} onChange={(e) => setPurpose(e.target.value)} aria-describedby={describedBy} invalid={invalid} maxLength={300} className="text-[1.0625rem]" />}
                    </MField>
                    {p.id === "CAL" && (
                      <div className="mt-6 rounded-lg bg-caution-soft p-4">
                        <Checkbox
                          checked={calamity}
                          onCheckedChange={(v) => {
                            setCalamity(v);
                            if (v) setErrors((e) => ({ ...e, calamity: undefined }));
                          }}
                          label={<span className="text-[1.0625rem] text-ink">{t("I live or work in an area under a declared state of calamity.", "Nakatira o nagtatrabaho ako sa lugar na may deklaradong state of calamity.")}</span>}
                          description={<span className="text-[1rem] text-ink-2">{t("Bring a certificate of residence or assignment when asked.", "Magdala ng certificate of residence o assignment kapag hiningi.")}</span>}
                        />
                        {errors.calamity && <div className="mt-2"><FieldError>{errors.calamity}</FieldError></div>}
                      </div>
                    )}
                  </StepFrame>
                )}

                {step === 4 && p && (
                  <StepFrame key="s4" focusOnMount={moved} title={t("Where should we send the money?", "Saan namin ipapadala ang pera?")} helper={t("Only accounts in your name that we have checked are shown.", "Ang mga account lang na nasa pangalan mo at na-check na namin ang ipinapakita.")}>
                    {member.payoutAccounts.length === 0 ? (
                      <p className="rounded-md bg-sunken p-4 text-[1rem] text-ink">{t("You have no payout account yet. We will prepare a cheque at your branch. You can add an account in Payouts.", "Wala ka pang payout account. Maghahanda kami ng cheke sa iyong sangay. Puwede kang magdagdag ng account sa Payouts.")}</p>
                    ) : (
                      <>
                        <GroupLabel id="acct-label">{t("Your payout accounts", "Ang iyong mga payout account")}</GroupLabel>
                        <RadioCards
                          ariaLabel={t("Payout account", "Payout account")}
                          value={accountId}
                          onValueChange={(v) => {
                            setAccountId(v);
                            setErrors({});
                          }}
                          options={member.payoutAccounts.map((a) => ({
                            value: a.id,
                            icon: a.kind === "bank" ? <Bank size="1.5rem" weight="duotone" /> : <DeviceMobile size="1.5rem" weight="duotone" />,
                            label: <span className="text-[1.0625rem]">{a.provider}</span>,
                            description: (
                              <CardNote>
                                {a.kind === "bank" ? t("Bank account", "Bank account") : t("E-wallet", "E-wallet")} {maskAccount(a.accountNo)}
                                {a.primary && <span className="block font-semibold text-ink">{t("Your primary account", "Ang iyong primary account")}</span>}
                                {!a.verified && <span className="block font-semibold text-caution">{t("Still being checked. You can use it once it is verified.", "Sinusuri pa. Magagamit ito kapag na-verify na.")}</span>}
                              </CardNote>
                            ),
                            disabled: !a.verified,
                          }))}
                        />
                      </>
                    )}
                    {errors.account && <div className="mt-3"><FieldError>{errors.account}</FieldError></div>}
                  </StepFrame>
                )}

                {step === 5 && p && (
                  <StepFrame key="s5" focusOnMount={moved} title={t("Check your application", "Suriin ang iyong application")} helper={t("Tap Change to fix anything. Nothing is sent until you confirm.", "I-tap ang Baguhin para ayusin. Walang maipapadala hangga't hindi mo kinukumpirma.")}>
                    <dl className="divide-y divide-[var(--line)] rounded-lg bg-sunken">
                      <ReviewRow label={t("Loan", "Loan")} value={p.name} onChange={() => go(0)} />
                      <ReviewRow label={t("Amount", "Halaga")} value={<span className="font-display text-[1.5rem] font-bold [font-stretch:88%]">{peso(amt)}</span>} onChange={() => go(1)} />
                      <ReviewRow label={t("Months to pay", "Ilang buwan")} value={t(`${months2} months`, `${months2} buwan`)} onChange={() => go(2)} />
                      <ReviewRow label={t("Each month", "Kada buwan")} value={`${peso(monthly)} · ${t(`from your ${firstPay} pay`, `simula sa sahod ng ${firstPay}`)}`} />
                      <ReviewRow label={t("Total interest", "Kabuuang interes")} value={peso(totalInterest)} />
                      <ReviewRow label={t("Total to pay back", "Kabuuang babayaran")} value={peso(amt + totalInterest)} />
                      <ReviewRow label={t("Purpose", "Layunin")} value={purpose.trim()} onChange={() => go(3)} />
                      <ReviewRow label={t("Money goes to", "Ipapadala sa")} value={accountLabel} onChange={() => go(4)} />
                    </dl>
                    <div className="mt-6 rounded-lg bg-primary-soft p-4">
                      <Checkbox
                        checked={consent}
                        onCheckedChange={(v) => {
                          setConsent(v);
                          if (v) setErrors({});
                        }}
                        label={<span className="text-[1.0625rem] leading-relaxed text-ink">{t(`I agree to the loan terms. I allow PSMBFI to deduct ${peso(monthly)} from my salary every month through ATD (salary deduction) until the loan is paid.`, `Sumasang-ayon ako sa mga tuntunin ng loan. Pinapayagan ko ang PSMBFI na ikaltas ang ${peso(monthly)} sa aking sahod buwan-buwan sa ATD (kaltas sa sahod) hanggang mabayaran ang loan.`)}</span>}
                      />
                      {errors.consent && <div className="mt-2"><FieldError>{errors.consent}</FieldError></div>}
                    </div>
                  </StepFrame>
                )}
              </AnimatePresence>

              <FlowNav
                onBack={step > 0 ? () => go(step - 1) : undefined}
                onNext={next}
                nextLabel={step === STEPS.length - 1 ? t("Send application", "Ipadala ang application") : undefined}
                nextIcon={step === STEPS.length - 1 ? <PaperPlaneTilt size="1.2rem" weight="bold" /> : undefined}
              />
            </div>
            <HelpLink topic="Loans" className="mt-5" />
          </div>

          {/* Running summary on wide screens */}
          <aside className="hidden xl:col-span-4 xl:block" aria-label={t("Your loan so far", "Ang iyong loan sa ngayon")}>
            <div className="sticky top-24 rounded-xl bg-surface p-6 shadow-e1">
              {p ? (
                <>
                  <div className="flex items-center gap-3">
                    <Ribbon stripes={p.ribbon} size="lg" />
                    <p className="text-[1.125rem] font-bold">{p.name}</p>
                  </div>
                  <dl className="mt-5 space-y-4">
                    <div>
                      <dt className="text-[0.9375rem] text-ink-2">{t("Amount", "Halaga")}</dt>
                      <dd className="font-display text-[1.8rem] font-extrabold leading-tight [font-stretch:86%]">{amt ? peso(amt) : "₱0.00"}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.9375rem] text-ink-2">{term === "" ? t("Each month (estimate)", "Kada buwan (tantya)") : t("Each month", "Kada buwan")}</dt>
                      <dd className="text-[1.25rem] font-semibold tnum">{monthly ? peso(monthly) : "₱0.00"}</dd>
                      <dd className="text-[0.9375rem] text-ink-2">{t(`for ${months2} months at ${Math.round(p.rate * 100)}% a year`, `sa loob ng ${months2} buwan, ${Math.round(p.rate * 100)}% kada taon`)}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.9375rem] text-ink-2">{t("Processing time", "Tagal ng pagproseso")}</dt>
                      <dd className="text-[1.0625rem] font-semibold">{t(`About ${p.processingDays} working ${p.processingDays === 1 ? "day" : "days"}`, `Mga ${p.processingDays} araw ng trabaho`)}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="text-[1rem] text-ink-2">{t("Choose a loan to see your monthly payment here.", "Pumili ng loan para makita rito ang buwanang hulog.")}</p>
              )}
            </div>
          </aside>
        </div>
      )}

      <Dialog
        open={confirmOpen}
        onOpenChange={(v) => {
          if (!busy) setConfirmOpen(v);
        }}
        title={t("Confirm your loan", "Kumpirmahin ang iyong loan")}
        footer={
          <>
            <Button variant="quiet" size="lg" className={WRAP_BTN} onClick={() => setConfirmOpen(false)} disabled={busy}>
              {t("Cancel", "Kanselahin")}
            </Button>
            <Button size="lg" className={WRAP_BTN} onClick={submit} loading={busy} loadingLabel={t("Sending", "Ipinapadala")}>
              {t("Confirm and send", "Kumpirmahin at ipadala")}
            </Button>
          </>
        }
      >
        {p && (
          <div>
            <p className="text-[1rem] text-ink-2">{t("You are applying for", "Ina-apply mo ang")}</p>
            <p className="mt-1 font-display text-[min(2.6rem,11vw)] font-extrabold leading-none tracking-[-0.02em] [font-stretch:86%]">{peso(amt)}</p>
            <p className="mt-2 text-[1.0625rem] font-semibold text-ink">{p.name}</p>
            <p className="text-[1rem] text-ink-2">{t(`${peso(monthly)} a month for ${months2} months, to ${accountLabel}`, `${peso(monthly)} kada buwan sa loob ng ${months2} buwan, sa ${accountLabel}`)}</p>
            <div className="mt-5 rounded-lg bg-sunken p-4">
              <p id="pin-label" className="text-[1.0625rem] font-semibold">{t(`Enter the 6-digit PIN we sent to ${maskedMobile}`, `Ilagay ang 6 na numerong PIN na ipinadala namin sa ${maskedMobile}`)}</p>
              <div className="mt-3">
                <OtpInput
                  value={pin}
                  onChange={(v) => {
                    setPin(v);
                    if (pinError) setPinError(null);
                  }}
                  invalid={!!pinError}
                  autoFocus
                  describedBy="pin-help"
                />
              </div>
              {pinError && <div className="mt-2"><FieldError>{pinError}</FieldError></div>}
              <p id="pin-help" className="mt-2 text-[1rem] text-ink-2">{t("This is a sample. Any 6 digits work, for example 123456.", "Sample lang ito. Kahit anong 6 na numero ay puwede, halimbawa 123456.")}</p>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function ReviewRow({ label, value, onChange }: { label: string; value: React.ReactNode; onChange?: () => void }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
      <div className="min-w-0 flex-1 basis-[11rem]">
        <dt className="text-[0.9375rem] text-ink-2">{label}</dt>
        <dd className="break-words text-[1.0625rem] font-semibold text-ink">{value}</dd>
      </div>
      {onChange && (
        <button type="button" onClick={onChange} className="inline-flex min-h-12 items-center gap-1.5 rounded-sm px-2 text-[1rem] font-semibold text-primary hover:underline" aria-label={t(`Change ${label.toLowerCase()}`, `Baguhin ang ${label.toLowerCase()}`)}>
          <PencilSimple size="1.1rem" weight="bold" aria-hidden />
          {t("Change", "Baguhin")}
        </button>
      )}
    </div>
  );
}
