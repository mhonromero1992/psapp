import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle, IdentificationCard, Plus, ShieldCheck, Trash, UserFocus, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { usePrefs } from "@/store/prefs";
import { EASE_OUT } from "@/lib/motion";
import { peso } from "@/lib/format";
import { Lockup } from "@/components/brand/Emblem";
import { BladeMark } from "@/components/brand/BladeMark";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, MoneyInput, Select } from "@/components/ui/Field";
import { Checkbox, RadioCards } from "@/components/ui/Choice";
import { Stepper } from "@/components/ui/Timeline";
import { FileDrop, type PickedFile } from "@/components/ui/FileDrop";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { Progress } from "@/components/ui/Progress";
import { LangToggle } from "@/components/layout/Toggles";
import { HelpLink, HelpProvider } from "@/features/member/parts/Help";
import { AGENCIES, AGENCY_BY_CODE, MEP_RATE, RANKS } from "@/data/reference";
import type { AgencyCode } from "@/data/types";
import { useDB } from "@/store/db";

type Bene = { key: string; name: string; relation: "Spouse" | "Child" | "Parent" | "Sibling" | ""; birthDate: string; share: string };
const RELATIONS = [
  ["Spouse", "Asawa"],
  ["Child", "Anak"],
  ["Parent", "Magulang"],
  ["Sibling", "Kapatid"],
] as const;
const ID_TYPES = [
  ["agency", "Agency ID (PNP, BFP, PCG and others)", "ID ng ahensya (PNP, BFP, PCG at iba pa)"],
  ["philsys", "PhilSys National ID", "PhilSys National ID"],
  ["umid", "UMID", "UMID"],
  ["drivers", "Driver's license", "Driver's license"],
] as const;

/**
 * Digital enrolment in the Members Equity Plan: the membership application (MAF) and
 * the Authority to Deduct (ATD) signed on a phone, with an ID check against a selfie.
 */
export default function Enrol() {
  return (
    <HelpProvider>
      <EnrolFlow />
    </HelpProvider>
  );
}

function EnrolFlow() {
  const t = useT();
  const textSize = usePrefs((s) => s.textSize);
  const reduced = useReducedMotion();
  const [params] = useSearchParams();
  const submitEnrolment = useDB((s) => s.submitEnrolment);
  const initialAgency = (AGENCIES.find((a) => a.code === params.get("agency"))?.code ?? "") as AgencyCode | "";

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Step 1
  const [agency, setAgency] = useState<AgencyCode | "">(initialAgency);
  const [rank, setRank] = useState("");
  const [first, setFirst] = useState("");
  const [mi, setMi] = useState("");
  const [last, setLast] = useState("");
  const [birth, setBirth] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  // Step 2
  const [unit, setUnit] = useState("");
  const [pay, setPay] = useState<number | "">("");
  // Step 3
  const [idType, setIdType] = useState<string>("");
  const [idPhoto, setIdPhoto] = useState<PickedFile[]>([]);
  const [selfie, setSelfie] = useState<PickedFile[]>([]);
  const [check, setCheck] = useState<"idle" | "checking" | "done">("idle");
  // Step 4
  const [benes, setBenes] = useState<Bene[]>([{ key: "b1", name: "", relation: "", birthDate: "", share: "100" }]);
  const [dfi, setDfi] = useState<string>("b1");
  // Step 5
  const [agreeMaf, setAgreeMaf] = useState(false);
  const [agreeAtd, setAgreeAtd] = useState(false);
  const [agreeDpa, setAgreeDpa] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const steps = [t("About you", "Tungkol sa iyo"), t("Pay and deduction", "Sahod at deduction"), t("Check your ID", "Suriin ang ID"), t("Beneficiaries", "Mga beneficiary"), t("Review and sign", "Suriin at pumirma")];
  const ranks = useMemo(() => (agency ? [...RANKS[agency].ranks, ...RANKS[agency].civilian].map(([r]) => r) : []), [agency]);
  const contribution = typeof pay === "number" ? Math.round(pay * MEP_RATE * 100) / 100 : 0;
  const shareTotal = benes.reduce((s, b) => s + (Number(b.share) || 0), 0);

  useEffect(() => {
    if (agency && rank && !ranks.includes(rank)) setRank("");
  }, [agency, rank, ranks]);

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!agency) e.agency = t("Choose your agency.", "Piliin ang iyong ahensya.");
      if (!rank) e.rank = t("Choose your rank or position.", "Piliin ang iyong ranggo o posisyon.");
      if (first.trim().length < 2) e.first = t("Enter your first name.", "Ilagay ang iyong pangalan.");
      if (last.trim().length < 2) e.last = t("Enter your last name.", "Ilagay ang iyong apelyido.");
      if (!birth) e.birth = t("Enter your date of birth.", "Ilagay ang iyong kaarawan.");
      else {
        const age = (Date.now() - new Date(birth).getTime()) / (365.25 * 86400000);
        if (age < 18 || age > 70) e.birth = t("Check the year. Members are 18 to 70 years old.", "Suriin ang taon. Ang miyembro ay 18 hanggang 70 taong gulang.");
      }
      if (mobile.replace(/\D/g, "").length !== 11) e.mobile = t("Enter an 11-digit mobile number, like 0917 123 4567.", "Ilagay ang 11-digit na mobile number, gaya ng 0917 123 4567.");
      if (email && !/^\S+@\S+\.\S+$/.test(email)) e.email = t("Write an email address with an @, or leave it blank.", "Isulat ang email na may @, o iwanang blangko.");
    }
    if (s === 1) {
      if (unit.trim().length < 3) e.unit = t("Enter your unit or office.", "Ilagay ang iyong unit o opisina.");
      if (typeof pay !== "number" || pay < 10000 || pay > 200000) e.pay = t("Enter your monthly base pay, from ₱10,000 to ₱200,000. It is on your payslip.", "Ilagay ang buwanang base pay, mula ₱10,000 hanggang ₱200,000. Nasa payslip mo ito.");
    }
    if (s === 2) {
      if (!idType) e.idType = t("Choose the ID you will use.", "Piliin ang ID na gagamitin.");
      if (idPhoto.length === 0) e.idPhoto = t("Add a photo of the front of your ID.", "Magdagdag ng litrato ng harap ng iyong ID.");
      if (selfie.length === 0) e.selfie = t("Add a photo of your face.", "Magdagdag ng litrato ng iyong mukha.");
      if (!e.idType && !e.idPhoto && !e.selfie && check !== "done") e.check = t("Tap Check my ID to compare the two photos.", "I-tap ang Suriin ang ID para ikumpara ang dalawang litrato.");
    }
    if (s === 3) {
      benes.forEach((b) => {
        if (b.name.trim().length < 3) e[`${b.key}-name`] = t("Enter the full name.", "Ilagay ang buong pangalan.");
        if (!b.relation) e[`${b.key}-relation`] = t("Choose the relationship.", "Piliin ang relasyon.");
        if (!b.birthDate) e[`${b.key}-birth`] = t("Enter the date of birth.", "Ilagay ang kaarawan.");
      });
      if (shareTotal !== 100) e.shares = t(`The shares add up to ${shareTotal}%. They must add up to 100%.`, `Ang kabuuan ay ${shareTotal}%. Dapat ay 100%.`);
    }
    if (s === 4) {
      if (!agreeMaf || !agreeAtd || !agreeDpa) e.agree = t("Tick all three boxes to continue.", "Lagyan ng tsek ang tatlong kahon para magpatuloy.");
      if (!signature) e.signature = t("Sign inside the box with your finger.", "Pumirma sa loob ng kahon gamit ang daliri.");
    }
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      window.setTimeout(() => document.querySelector<HTMLElement>(`[data-err="${first}"] input, [data-err="${first}"] select, [data-err="${first}"] button, #${first}`)?.focus(), 30);
      return false;
    }
    return true;
  };

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };
  const next = () => {
    if (!validate(step)) return;
    if (step < 4) return go(step + 1);
    setBusy(true);
    window.setTimeout(() => {
      const e = submitEnrolment({
        firstName: first.trim(), middleInitial: mi.trim().slice(0, 1).toUpperCase(), lastName: last.trim(), rank, agency: agency as AgencyCode, unit: unit.trim(),
        basePay: pay as number, mobile, email, idType: ID_TYPES.find((x) => x[0] === idType)?.[1] ?? idType, beneficiaries: benes.length, via: "Member App",
      });
      setBusy(false);
      setDone(e.id);
      toast.success(t("Enrolment sent", "Naipadala ang enrolment"), { description: e.id });
      window.scrollTo({ top: 0 });
    }, 900);
  };

  const runCheck = () => {
    const e: Record<string, string> = {};
    if (!idType) e.idType = t("Choose the ID you will use.", "Piliin ang ID na gagamitin.");
    if (idPhoto.length === 0) e.idPhoto = t("Add a photo of the front of your ID.", "Magdagdag ng litrato ng harap ng iyong ID.");
    if (selfie.length === 0) e.selfie = t("Add a photo of your face.", "Magdagdag ng litrato ng iyong mukha.");
    setErrors(e);
    if (Object.keys(e).length) return;
    setCheck("checking");
    window.setTimeout(() => setCheck("done"), 1800);
  };

  const err = (k: string) => errors[k];

  if (done) return <Success refNo={done} name={first} agency={agency as AgencyCode} contribution={contribution} />;

  return (
    <div className="min-h-dvh bg-bg">
      <a href="#enrol-main" className="skip-link">{t("Skip to content", "Lumaktaw sa nilalaman")}</a>
      <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-[4.25rem] max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <ButtonLink to="/" variant="ghost" size="sm" icon={<X size={18} weight="bold" />} className="-ml-2">
            {t("Cancel", "Kanselahin")}
          </ButtonLink>
          <Lockup compact wordmark={textSize === "standard"} />
          <LangToggle />
        </div>
      </header>

      <main id="enrol-main" className="mx-auto max-w-3xl px-4 pb-[calc(9rem+var(--safe-bottom))] pt-4 sm:px-6">
        <p className="text-[1rem] font-semibold text-ink-2" aria-live="polite">
          {t(`Step ${step + 1} of 5`, `Hakbang ${step + 1} sa 5`)} · {steps[step]}
        </p>
        <Stepper steps={steps} current={step} className="mt-3" />

        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.section
            key={step}
            custom={dir}
            initial={reduced ? false : { opacity: 0, x: 28 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? undefined : { opacity: 0, x: -20 * dir }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
            className="mt-7"
            aria-labelledby="step-title"
          >
            {step === 0 && (
              <>
                <StepTitle title={t("Tell us about yourself", "Sabihin sa amin ang tungkol sa iyo")} lead={t("This is your Membership Application Form (MAF). Write your name as it is on your agency ID.", "Ito ang iyong Membership Application Form (MAF). Isulat ang pangalan gaya ng nasa ID ng ahensya.")} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div data-err="agency" className="sm:col-span-2">
                    <Field label={t("Your agency", "Ang iyong ahensya")} error={err("agency")} htmlFor="agency">
                      {({ id, describedBy, invalid }) => (
                        <Select id={id} value={agency} onChange={(e) => setAgency(e.target.value as AgencyCode)} aria-describedby={describedBy} invalid={invalid} className="h-14 text-[1.05rem]">
                          <option value="">{t("Choose your agency", "Piliin ang ahensya")}</option>
                          {AGENCIES.map((a) => (
                            <option key={a.code} value={a.code}>
                              {a.code}: {a.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>
                  </div>
                  <div data-err="rank" className="sm:col-span-2">
                    <Field label={t("Rank or position", "Ranggo o posisyon")} error={err("rank")} hint={!agency ? t("Choose your agency first.", "Piliin muna ang ahensya.") : undefined} htmlFor="rank">
                      {({ id, describedBy, invalid }) => (
                        <Select id={id} value={rank} disabled={!agency} onChange={(e) => setRank(e.target.value)} aria-describedby={describedBy} invalid={invalid} className="h-14 text-[1.05rem]">
                          <option value="">{t("Choose your rank or position", "Piliin ang ranggo o posisyon")}</option>
                          {ranks.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>
                  </div>
                  <TextField k="first" label={t("First name", "Pangalan")} value={first} onChange={setFirst} error={err("first")} autoComplete="given-name" />
                  <TextField k="mi" label={t("Middle initial", "Gitnang inisyal")} value={mi} onChange={(v) => setMi(v.slice(0, 2))} optional autoComplete="additional-name" />
                  <TextField k="last" label={t("Last name", "Apelyido")} value={last} onChange={setLast} error={err("last")} autoComplete="family-name" className="sm:col-span-2" />
                  <TextField k="birth" label={t("Date of birth", "Kaarawan")} value={birth} onChange={setBirth} error={err("birth")} type="date" autoComplete="bday" />
                  <TextField k="mobile" label={t("Mobile number", "Mobile number")} value={mobile} onChange={setMobile} error={err("mobile")} inputMode="tel" autoComplete="tel" hint="0917 123 4567" />
                  <TextField k="email" label={t("Email", "Email")} value={email} onChange={setEmail} error={err("email")} optional inputMode="email" autoComplete="email" className="sm:col-span-2" />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <StepTitle title={t("Your pay and monthly deduction", "Ang iyong sahod at buwanang deduction")} lead={t("Your payroll office deducts 3% of your base pay every month. This is the Authority to Deduct (ATD). It pays for your insurance and builds your Equity Value.", "Ibinabawas ng payroll office ang 3% ng iyong base pay bawat buwan. Ito ang Authority to Deduct (ATD). Ito ang bayad sa insurance mo at nag-iipon ng iyong Equity Value.")} />
                <div className="grid gap-5">
                  <TextField k="unit" label={t("Unit or office", "Unit o opisina")} value={unit} onChange={setUnit} error={err("unit")} hint={agency ? t(`For example: ${RANKS[agency].units[0]}`, `Halimbawa: ${RANKS[agency].units[0]}`) : undefined} />
                  <div data-err="pay">
                    <Field label={t("Monthly base pay", "Buwanang base pay")} error={err("pay")} hint={t("Use the base pay on your latest payslip, before deductions.", "Gamitin ang base pay sa pinakabagong payslip, bago ang mga deduction.")} htmlFor="pay">
                      {({ id, describedBy, invalid }) => <MoneyInput id={id} value={pay} onChange={setPay} invalid={invalid} describedBy={describedBy} max={200000} className="[&_input]:h-14 [&_input]:text-[1.2rem]" />}
                    </Field>
                  </div>
                  <div className="rounded-xl bg-night p-5 text-white" aria-live="polite">
                    <p className="text-[0.95rem] text-white/75">{t("Your monthly contribution (3%)", "Ang iyong buwanang kontribusyon (3%)")}</p>
                    <p className="mt-1 font-display text-[2.6rem] font-bold leading-none tnum [font-stretch:86%]">{peso(contribution)}</p>
                    <p className="mt-3 text-[0.98rem] leading-relaxed text-white/80">
                      {agency ? t(`Deducted by the ${AGENCY_BY_CODE[agency].payrollOffice} from your salary. You don't need to pay at an office.`, `Ibabawas ng ${AGENCY_BY_CODE[agency].payrollOffice} sa iyong sahod. Hindi mo na kailangang magbayad sa opisina.`) : t("Deducted from your salary by your payroll office.", "Ibabawas sa iyong sahod ng payroll office.")}
                    </p>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {[
                      [t("Life insurance", "Life insurance"), t("For your family if you pass away", "Para sa pamilya kung ikaw ay pumanaw")],
                      [t("Hospital cash", "Pera sa pagka-ospital"), t("A daily amount when you are confined", "Araw-araw na halaga kapag naka-confine")],
                      [t("Equity Value", "Equity Value"), t("Savings that grow and you can borrow against", "Ipon na lumalaki at puwedeng utangan")],
                      [t("Loans", "Loans"), t("Six loan products for members", "Anim na uri ng loan para sa miyembro")],
                    ].map(([a, b]) => (
                      <li key={a} className="flex gap-3 rounded-lg bg-surface p-4 shadow-e1">
                        <CheckCircle size={24} weight="fill" className="shrink-0 text-positive" aria-hidden />
                        <span>
                          <span className="block font-semibold">{a}</span>
                          <span className="text-ink-2">{b}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <StepTitle title={t("Check your ID", "Suriin ang iyong ID")} lead={t("Take a photo of your ID, then a photo of your face. We compare them so no one else can enrol in your name.", "Kunan ng litrato ang ID, at ang iyong mukha. Ikukumpara namin para walang ibang makapag-enrol sa pangalan mo.")} />
                <div className="grid gap-6">
                  <div data-err="idType">
                    <p className="mb-2.5 font-semibold">{t("Which ID will you use?", "Anong ID ang gagamitin mo?")}</p>
                    <RadioCards ariaLabel={t("ID type", "Uri ng ID")} value={idType} onValueChange={setIdType} columns={2} options={ID_TYPES.map(([v, en, fil]) => ({ value: v, label: t(en, fil) }))} />
                    {err("idType") && <p className="mt-2 font-medium text-negative" role="alert">{err("idType")}</p>}
                  </div>
                  <div data-err="idPhoto">
                    <FileDrop files={idPhoto} onChange={(f) => { setIdPhoto(f); setCheck("idle"); }} multiple={false} accept="image/*" label={t("Front of your ID", "Harap ng iyong ID")} hint={t("Lay it flat in good light. All four corners must show.", "Ilapag sa maliwanag. Dapat kita ang apat na sulok.")} />
                    {err("idPhoto") && <p className="mt-2 font-medium text-negative" role="alert">{err("idPhoto")}</p>}
                  </div>
                  <div data-err="selfie">
                    <FileDrop files={selfie} onChange={(f) => { setSelfie(f); setCheck("idle"); }} multiple={false} accept="image/*" label={t("A photo of your face", "Litrato ng iyong mukha")} hint={t("Face the camera. Remove your cap and sunglasses.", "Humarap sa camera. Tanggalin ang sumbrero at sunglasses.")} />
                    {err("selfie") && <p className="mt-2 font-medium text-negative" role="alert">{err("selfie")}</p>}
                  </div>
                  <div data-err="check" className="rounded-xl bg-surface p-5 shadow-e1">
                    {check === "done" ? (
                      <div className="flex items-start gap-3" role="status">
                        <ShieldCheck size={32} weight="fill" className="shrink-0 text-positive" aria-hidden />
                        <div>
                          <p className="text-[1.1rem] font-bold">{t("Your ID and photo match", "Tugma ang ID at litrato")}</p>
                          <p className="text-ink-2">{t("Match score 94%. A PSMBFI officer will also review it.", "Match score 94%. Susuriin din ito ng isang PSMBFI officer.")}</p>
                        </div>
                      </div>
                    ) : check === "checking" ? (
                      <div role="status" aria-live="polite">
                        <p className="flex items-center gap-2.5 font-semibold"><UserFocus size={24} weight="duotone" className="text-primary" aria-hidden /> {t("Comparing your photos", "Ikinukumpara ang mga litrato")}</p>
                        <Progress value={0.7} label={t("Checking", "Sinusuri")} className="mt-3 h-2.5" />
                      </div>
                    ) : (
                      <>
                        <Button size="lg" block variant="tonal" icon={<IdentificationCard size={22} weight="duotone" />} onClick={runCheck}>
                          {t("Check my ID", "Suriin ang aking ID")}
                        </Button>
                        {err("check") && <p className="mt-2 font-medium text-negative" role="alert">{err("check")}</p>}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <StepTitle title={t("Who receives your benefits?", "Sino ang tatanggap ng iyong benepisyo?")} lead={t("Add the people who will receive your insurance if something happens to you. Their shares must add up to 100%.", "Idagdag ang mga taong tatanggap ng insurance kapag may nangyari sa iyo. Ang hatian ay dapat 100%.")} />
                <ul className="space-y-4">
                  {benes.map((b, i) => (
                    <li key={b.key} className="rounded-xl bg-surface p-4 shadow-e1 sm:p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-display text-[1.15rem] font-bold [font-stretch:90%]">{t(`Beneficiary ${i + 1}`, `Beneficiary ${i + 1}`)}</p>
                        {benes.length > 1 && (
                          <Button variant="ghost" size="sm" icon={<Trash size={18} weight="bold" />} onClick={() => setBenes(benes.filter((x) => x.key !== b.key))}>
                            {t("Remove", "Alisin")}
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextField k={`${b.key}-name`} label={t("Full name", "Buong pangalan")} value={b.name} onChange={(v) => setBenes(benes.map((x) => (x.key === b.key ? { ...x, name: v } : x)))} error={err(`${b.key}-name`)} className="sm:col-span-2" />
                        <div data-err={`${b.key}-relation`}>
                          <Field label={t("Relationship", "Relasyon")} error={err(`${b.key}-relation`)}>
                            {({ id, describedBy, invalid }) => (
                              <Select id={id} value={b.relation} onChange={(e) => setBenes(benes.map((x) => (x.key === b.key ? { ...x, relation: e.target.value as Bene["relation"] } : x)))} aria-describedby={describedBy} invalid={invalid} className="h-14 text-[1.05rem]">
                                <option value="">{t("Choose", "Pumili")}</option>
                                {RELATIONS.map(([en, fil]) => (
                                  <option key={en} value={en}>{t(en, fil)}</option>
                                ))}
                              </Select>
                            )}
                          </Field>
                        </div>
                        <TextField k={`${b.key}-birth`} label={t("Date of birth", "Kaarawan")} type="date" value={b.birthDate} onChange={(v) => setBenes(benes.map((x) => (x.key === b.key ? { ...x, birthDate: v } : x)))} error={err(`${b.key}-birth`)} />
                        <TextField k={`${b.key}-share`} label={t("Share (%)", "Hati (%)")} inputMode="numeric" value={b.share} onChange={(v) => setBenes(benes.map((x) => (x.key === b.key ? { ...x, share: v.replace(/\D/g, "").slice(0, 3) } : x)))} />
                      </div>
                    </li>
                  ))}
                </ul>
                <div data-err="shares" className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className={cn("text-[1.05rem] font-semibold", shareTotal === 100 ? "text-positive" : "text-caution")} aria-live="polite">
                    {t("Total share", "Kabuuang hati")}: <span className="tnum">{shareTotal}%</span> {shareTotal === 100 ? t("(complete)", "(kumpleto)") : t("(must be 100%)", "(dapat 100%)")}
                  </p>
                  {benes.length < 4 && (
                    <Button variant="tonal" size="lg" icon={<Plus size={20} weight="bold" />} onClick={() => setBenes([...benes, { key: `b${Date.now()}`, name: "", relation: "", birthDate: "", share: "0" }])}>
                      {t("Add another person", "Magdagdag ng isa pa")}
                    </Button>
                  )}
                </div>
                {err("shares") && <p className="mt-2 font-medium text-negative" role="alert">{err("shares")}</p>}
                <div className="mt-6">
                  <p className="mb-1 font-semibold">{t("Dependent's free insurance (₱50,000)", "Libreng insurance ng dependent (₱50,000)")}</p>
                  <p className="mb-3 text-ink-2">{t("Choose one person to be covered at no extra cost.", "Pumili ng isang taong masasakop nang walang dagdag na bayad.")}</p>
                  <RadioCards ariaLabel={t("Dependent's free insurance", "Libreng insurance ng dependent")} value={dfi} onValueChange={setDfi} options={benes.map((b, i) => ({ value: b.key, label: b.name.trim() || t(`Beneficiary ${i + 1}`, `Beneficiary ${i + 1}`), description: b.relation ? t(b.relation, RELATIONS.find((r) => r[0] === b.relation)?.[1]) : undefined }))} />
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <StepTitle title={t("Review and sign", "Suriin at pumirma")} lead={t("Check your details. Tap Edit to change anything.", "Suriin ang mga detalye. I-tap ang Baguhin para palitan.")} />
                <div className="space-y-3">
                  <Summary title={t("About you", "Tungkol sa iyo")} onEdit={() => go(0)} rows={[[t("Name", "Pangalan"), `${rank} ${first} ${mi ? mi + ". " : ""}${last}`], [t("Agency", "Ahensya"), agency ? AGENCY_BY_CODE[agency].name : ""], [t("Mobile", "Mobile"), mobile]]} />
                  <Summary title={t("Pay and deduction", "Sahod at deduction")} onEdit={() => go(1)} rows={[[t("Unit", "Unit"), unit], [t("Base pay", "Base pay"), typeof pay === "number" ? peso(pay) : ""], [t("Monthly contribution", "Buwanang kontribusyon"), peso(contribution)]]} />
                  <Summary title={t("ID check", "Pagsuri ng ID")} onEdit={() => go(2)} rows={[[t("ID", "ID"), t(ID_TYPES.find((x) => x[0] === idType)?.[1] ?? "", ID_TYPES.find((x) => x[0] === idType)?.[2])], [t("Result", "Resulta"), t("Match 94%", "Tugma 94%")]]} />
                  <Summary title={t("Beneficiaries", "Mga beneficiary")} onEdit={() => go(3)} rows={benes.map((b) => [b.name, `${t(b.relation, RELATIONS.find((r) => r[0] === b.relation)?.[1])} · ${b.share}%${dfi === b.key ? ` · ${t("free insurance", "libreng insurance")}` : ""}`])} />
                </div>
                <div data-err="agree" className="mt-7 space-y-3 rounded-xl bg-surface p-4 shadow-e1 sm:p-5">
                  <Checkbox checked={agreeMaf} onCheckedChange={setAgreeMaf} label={t("I apply for membership in the PSMBFI Members Equity Plan (MEP).", "Nag-aapply ako ng membership sa PSMBFI Members Equity Plan (MEP).")} />
                  <Checkbox checked={agreeAtd} onCheckedChange={setAgreeAtd} label={t(`I allow my payroll office to deduct 3% of my base pay (${peso(contribution)}) every month.`, `Pinapayagan ko ang payroll office na ibawas ang 3% ng aking base pay (${peso(contribution)}) bawat buwan.`)} />
                  <Checkbox checked={agreeDpa} onCheckedChange={setAgreeDpa} label={t("I agree that PSMBFI may process my personal data for membership, loans and claims under the Data Privacy Act.", "Pumapayag ako na gamitin ng PSMBFI ang aking personal na data para sa membership, loans at claims ayon sa Data Privacy Act.")} description={t("You can withdraw this later in My profile.", "Maaari mo itong bawiin sa Aking profile.")} />
                  {err("agree") && <p className="font-medium text-negative" role="alert">{err("agree")}</p>}
                </div>
                <div data-err="signature" className="mt-6">
                  <p className="mb-2.5 font-semibold">{t("Your signature", "Ang iyong pirma")}</p>
                  <SignaturePad onChange={setSignature} label={t("Sign inside the box with your finger", "Pumirma sa loob ng kahon gamit ang daliri")} />
                  {err("signature") && <p className="mt-2 font-medium text-negative" role="alert">{err("signature")}</p>}
                </div>
              </>
            )}
          </motion.section>
        </AnimatePresence>

        <HelpLink topic="Something else" className="mt-8" />
      </main>

      {/* Big, steady actions at the bottom: thumbs reach them, eyes find them. */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-bg/92 pb-[calc(0.75rem+var(--safe-bottom))] pt-3 shadow-[0_-1px_0_var(--line)] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl gap-3 px-4 sm:px-6">
          {step > 0 && (
            <Button variant="quiet" size="lg" className="flex-1 sm:flex-none" icon={<ArrowLeft size={20} weight="bold" />} onClick={() => go(step - 1)}>
              {t("Back", "Bumalik")}
            </Button>
          )}
          <Button size="lg" className="flex-[2] sm:ml-auto sm:flex-none sm:min-w-[14rem]" onClick={next} loading={busy} loadingLabel={t("Sending", "Ipinapadala")} iconRight={step < 4 ? <ArrowRight size={20} weight="bold" /> : undefined}>
            {step < 4 ? t("Continue", "Magpatuloy") : t("Sign and send", "Pumirma at ipadala")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepTitle({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="mb-6">
      <h1 id="step-title" className="font-display text-[1.9rem] font-extrabold leading-[1.05] tracking-[-0.02em] [font-stretch:84%] sm:text-[2.3rem]">{title}</h1>
      <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-ink-2">{lead}</p>
    </div>
  );
}

function TextField({ k, label, value, onChange, error, optional, type = "text", inputMode, autoComplete, hint, className }: { k: string; label: string; value: string; onChange: (v: string) => void; error?: string; optional?: boolean; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; autoComplete?: string; hint?: string; className?: string }) {
  return (
    <div data-err={k} className={className}>
      <Field label={label} error={error} optional={optional} hint={hint}>
        {({ id, describedBy, invalid }) => <Input id={id} type={type} inputMode={inputMode} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={describedBy} invalid={invalid} className="h-14 text-[1.05rem]" />}
      </Field>
    </div>
  );
}

function Summary({ title, rows, onEdit }: { title: string; rows: [string, string][]; onEdit: () => void }) {
  const t = useT();
  return (
    <section className="rounded-xl bg-surface p-4 shadow-e1 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[1.1rem] font-bold [font-stretch:92%]">{title}</h2>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          {t("Edit", "Baguhin")}
        </Button>
      </div>
      <dl className="mt-2 space-y-1.5">
        {rows.map(([k, v], i) => (
          <div key={`${k}-${i}`} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-6">
            <dt className="text-ink-2">{k}</dt>
            <dd className="font-semibold sm:text-right">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Success({ refNo, name, agency, contribution }: { refNo: string; name: string; agency: AgencyCode; contribution: number }) {
  const t = useT();
  const reduced = useReducedMotion();
  return (
    <div className="min-h-dvh bg-bg">
      <main className="mx-auto flex max-w-2xl flex-col px-5 pb-12 pt-10 sm:px-8">
        <Lockup compact />
        <motion.div initial={reduced ? false : { scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: EASE_OUT }} className="relative mt-10 grid size-24 place-items-center rounded-full bg-positive-soft">
          <BladeMark size={58} rim={false} className="absolute opacity-20" />
          <CheckCircle size={56} weight="fill" className="relative text-positive" aria-hidden />
        </motion.div>
        <h1 className="mt-6 font-display text-[2.3rem] font-extrabold leading-[1.02] tracking-[-0.02em] [font-stretch:84%]" role="status">
          {t(`Thank you, ${name}. Your enrolment is sent.`, `Salamat, ${name}. Naipadala na ang iyong enrolment.`)}
        </h1>
        <p className="mt-3 text-[1.1rem] text-ink-2">
          {t("Reference number", "Reference number")}: <span className="font-bold text-ink tnum">{refNo}</span>
        </p>
        <h2 className="mt-9 text-[1.3rem] font-bold [font-stretch:90%]">{t("What happens next", "Ano ang susunod")}</h2>
        <ol className="mt-4 space-y-4">
          {[
            [t("Within 3 working days", "Sa loob ng 3 araw ng trabaho"), t("PSMBFI checks your documents and sends your member ID number by SMS.", "Susuriin ng PSMBFI ang iyong dokumento at ipapadala ang member ID sa SMS.")],
            [t("Within 5 working days", "Sa loob ng 5 araw ng trabaho"), t(`The ${AGENCY_BY_CODE[agency].payrollOffice} receives your ATD.`, `Matatanggap ng ${AGENCY_BY_CODE[agency].payrollOffice} ang iyong ATD.`)],
            [t("On your next payroll", "Sa susunod na sahod"), t(`Your first ${peso(contribution)} contribution is deducted. Your cover starts.`, `Ibabawas ang unang ${peso(contribution)} na kontribusyon. Magsisimula ang iyong cover.`)],
          ].map(([when, what], i) => (
            <li key={i} className="flex gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-strong font-bold text-white tnum">{i + 1}</span>
              <span>
                <span className="block font-semibold">{when}</span>
                <span className="text-ink-2">{what}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/" size="lg" block className="sm:w-auto">
            {t("Back to the start", "Bumalik sa simula")}
          </ButtonLink>
          <ButtonLink to="/sign-in" variant="quiet" size="lg" block className="sm:w-auto">
            {t("Sign in", "Mag-sign in")}
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
