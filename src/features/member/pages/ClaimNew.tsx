import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { AnimatePresence } from "motion/react";
import { Bank, CheckCircle, DeviceMobile, PaperPlaneTilt, PencilSimple, User, Users } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { date, maskAccount, peso } from "@/lib/format";
import { useLang, useT } from "@/lib/i18n";
import { BENEFIT_BY_ID, BENEFIT_TYPES } from "@/data/reference";
import { memberName } from "@/data/generate";
import type { Beneficiary, Claim, ClaimDocument, ClaimType } from "@/data/types";
import type { PickedFile } from "@/components/ui/FileDrop";
import { useDB } from "@/store/db";
import { useCoverage, useCurrentMember, useSimulatedLoad } from "@/store/hooks";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox, RadioCards } from "@/components/ui/Choice";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Field";
import { StepFrame, SuccessPanel } from "../parts/Bits";
import { BENEFIT_ICON, claimAmount, incidentLabel } from "../parts/claims";
import { FlowNav, FlowProgress } from "../parts/Flow";
import { CardNote, DocUpload, FieldError, GroupLabel, MField } from "../parts/Form";
import { HelpLink } from "../parts/Help";
import { LoadError, PageHead, PageSkeleton, WRAP_BTN } from "../parts/Page";
import { BENEFIT_FIL, BENEFIT_SCHEDULE_EN, docName, nowMs } from "../parts/text";

type Errors = Partial<Record<"type" | "filer" | "date" | "hospital" | "days" | "severity" | "description" | "docs" | "account" | "certify", string>>;

const RELATION: Record<Beneficiary["relation"], [string, string]> = { Spouse: ["Spouse", "Asawa"], Child: ["Child", "Anak"], Parent: ["Parent", "Magulang"], Sibling: ["Sibling", "Kapatid"] };

const localDay = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function ClaimNew() {
  const t = useT();
  const lang = useLang();
  const [params] = useSearchParams();
  const member = useCurrentMember();
  const coverage = useCoverage(member);
  const fileClaim = useDB((s) => s.fileClaim);
  const load = useSimulatedLoad(350);
  const today = localDay(nowMs());

  const requested = params.get("type");
  const [step, setStep] = useState(0);
  const [moved, setMoved] = useState(false);
  const [type, setType] = useState<ClaimType | "">(requested && BENEFIT_BY_ID[requested] ? (requested as ClaimType) : "");
  const [filer, setFiler] = useState<string>("");
  const [incidentDate, setIncidentDate] = useState("");
  const [hospital, setHospital] = useState("");
  const [days, setDays] = useState<number | "">("");
  const [severity, setSeverity] = useState<"major" | "minor" | "">("");
  const [description, setDescription] = useState("");
  const [docs, setDocs] = useState<Record<string, PickedFile[]>>({});
  const verified = member.payoutAccounts.filter((a) => a.verified);
  const [accountId, setAccountId] = useState<string>(() => (verified.find((a) => a.primary) ?? verified[0])?.id ?? "");
  const [certify, setCertify] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Claim | null>(null);

  const b = type ? BENEFIT_BY_ID[type] : null;
  const hospitalType = type === "AHB" || type === "IHB";
  const requiredDocs = useMemo(() => (b ? b.documents.filter((d) => !d.startsWith("No documents")) : []), [b]);
  const fileCount = requiredDocs.reduce((n, d) => n + (docs[d]?.length ?? 0), 0);
  const estimate = type ? claimAmount(type, { days, severity }, coverage, member) : null;
  const claimant = filer === "member" ? { name: memberName(member), relation: "Member" as const } : (() => {
    const ben = member.beneficiaries.find((x) => x.id === filer);
    return ben ? { name: ben.name, relation: ben.relation } : null;
  })();
  const account = member.payoutAccounts.find((a) => a.id === accountId);
  const accountLabel = account ? `${account.provider} ${maskAccount(account.accountNo)}` : t("Your primary account", "Ang iyong primary account");

  const STEPS = [t("Type of claim", "Uri ng claim"), t("Who is filing", "Sino ang nagfa-file"), t("What happened", "Ano ang nangyari"), t("Documents", "Mga dokumento"), t("Where to send", "Saan ipapadala"), t("Review", "Suriin")];

  const chooseType = (v: ClaimType) => {
    setType(v);
    setErrors({});
    const nb = BENEFIT_BY_ID[v];
    if (nb.filer === "beneficiary" && filer === "member") setFiler("");
    if (nb.filer === "member" && !filer) setFiler("member");
  };

  const validate = (s: number): Errors => {
    const e: Errors = {};
    if (s === 0 && !b) e.type = t("Choose what you are claiming for.", "Piliin kung para saan ang claim.");
    if (s === 1) {
      if (!filer) e.filer = t("Choose who is filing this claim.", "Piliin kung sino ang nagfa-file ng claim.");
      else if (b?.filer === "beneficiary" && filer === "member") e.filer = t("A beneficiary files this kind of claim. Choose who is filing.", "Beneficiary ang nagfa-file ng ganitong claim. Piliin kung sino.");
    }
    if (s === 2 && b) {
      if (type !== "MER") {
        if (!incidentDate) e.date = t("Enter the date.", "Ilagay ang petsa.");
        else if (incidentDate > today) e.date = t("The date cannot be in the future.", "Hindi puwedeng petsa sa hinaharap.");
        else if (incidentDate < member.joinedAt.slice(0, 10)) e.date = t(`The date is before your membership started (${date(member.joinedAt)}).`, `Bago magsimula ang iyong membership ang petsa (${date(member.joinedAt)}).`);
      }
      if (hospitalType) {
        if (hospital.trim().length < 3) e.hospital = t("Enter the name of the hospital.", "Ilagay ang pangalan ng ospital.");
        if (days === "" || days < 1) e.days = t("Enter how many days you stayed in the hospital.", "Ilagay kung ilang araw ka sa ospital.");
        else if (days > 60) e.days = t("Please check the number of days.", "Pakisuri ang bilang ng araw.");
      }
      if (type === "WIA" && !severity) e.severity = t("Choose how serious the injury is.", "Piliin kung gaano kalubha ang pinsala.");
      if (type !== "MER" && description.trim().length < 10) e.description = t("Tell us briefly what happened (at least 10 letters).", "Ikuwento nang maikli ang nangyari (hindi bababa sa 10 letra).");
    }
    if (s === 3 && requiredDocs.length > 0 && fileCount === 0) e.docs = t("Add a photo of at least one document.", "Magdagdag ng litrato ng kahit isang dokumento.");
    if (s === 4 && verified.length > 0 && !accountId) e.account = t("Choose where we should send the money.", "Piliin kung saan namin ipapadala ang pera.");
    if (s === 5 && !certify) e.certify = t("Please tick the box to confirm before you file.", "Paki-tsek ang kahon para kumpirmahin bago mag-file.");
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
    setConfirmOpen(true);
  };

  const submit = () => {
    if (!b || !type || !claimant || !estimate) return;
    setBusy(true);
    window.setTimeout(() => {
      let n = 1;
      const documents: ClaimDocument[] = requiredDocs.flatMap((d) =>
        (docs[d] ?? []).map((f, k, all) => ({ id: `D${n++}`, name: all.length > 1 ? `${d}, page ${k + 1}` : d, kind: d.includes("ID") ? "ID" : "Document", status: "received" as const, preview: f.preview })),
      );
      const claim = fileClaim({
        memberId: member.id,
        type,
        claimantName: claimant.name,
        claimantRelation: claimant.relation,
        incidentDate: type === "MER" ? today : incidentDate,
        description: description.trim() || t("Experience refund request", "Request para sa experience refund"),
        confinementDays: hospitalType && typeof days === "number" ? days : undefined,
        hospital: hospitalType ? hospital.trim() : undefined,
        amountClaimed: estimate.amount,
        documents,
        payoutAccountId: accountId,
      });
      setBusy(false);
      setConfirmOpen(false);
      setDone(claim);
      toast.success(t("Claim filed", "Naisampa ang claim"), { description: claim.id });
    }, 900);
  };

  if (done && b) {
    return (
      <SuccessPanel
        title={t("Claim filed", "Naisampa ang claim")}
        body={t(`We received your ${b.name} claim for ${peso(done.amountClaimed)}.`, `Natanggap namin ang iyong claim (${b.nameFil}) na ${peso(done.amountClaimed)}.`)}
        refLabel={t("Your claim number", "Ang iyong claim number")}
        refId={done.id}
        next={[
          { title: t("We check your documents", "Susuriin namin ang mga dokumento"), body: t("Within 2 working days. If a photo is hard to read, we will ask for a new one in this app.", "Sa loob ng 2 araw ng trabaho. Kung malabo ang litrato, hihingi kami ng bago sa app na ito.") },
          { title: t("We decide on your claim", "Pagpapasyahan namin ang claim"), body: t("A claims officer checks the benefit. You get a notification at each step.", "Susuriin ng claims officer ang benepisyo. May abiso ka sa bawat hakbang.") },
          { title: t("We send the money", "Ipapadala namin ang pera"), body: t(`Once approved, the benefit goes to ${done.payoutLabel}.`, `Kapag naaprubahan, ipapadala ang benepisyo sa ${done.payoutLabel}.`) },
        ]}
        secondary={
          <ButtonLink to={`/member/claims/${done.id}`} variant="quiet" size="lg" className="w-full sm:w-auto">
            {t("Track this claim", "Subaybayan ang claim")}
          </ButtonLink>
        }
        helpTopic="Claims"
      />
    );
  }

  return (
    <div>
      <PageHead back={{ to: "/member/claims", label: t("Claims", "Mga claim") }} title={t("File a claim", "Mag-file ng claim")} helper={t("Have your papers ready: you will take a photo of each one. You can go back and change any answer.", "Ihanda ang mga papel: kukunan mo ng litrato ang bawat isa. Puwede kang bumalik at baguhin ang sagot.")} />

      {load.error ? (
        <LoadError onRetry={load.retry} helpTopic="Claims" />
      ) : load.loading ? (
        <PageSkeleton shape="form" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <FlowProgress steps={STEPS} current={step} />
            <div className="rounded-xl bg-surface p-5 shadow-e1 sm:p-7">
              <AnimatePresence mode="wait" initial={false}>
                {step === 0 && (
                  <StepFrame key="c0" focusOnMount={moved} title={t("What are you claiming for?", "Para saan ang claim?")} helper={t("Choose one.", "Pumili ng isa.")}>
                    <RadioCards
                      ariaLabel={t("Type of claim", "Uri ng claim")}
                      value={type}
                      onValueChange={chooseType}
                      columns={2}
                      options={BENEFIT_TYPES.map((bt) => {
                        const I = BENEFIT_ICON[bt.id];
                        return {
                          value: bt.id,
                          icon: <I size="1.6rem" weight="duotone" />,
                          label: <span className="text-[1.0625rem]">{t(bt.name, bt.nameFil)}</span>,
                          description: <CardNote>{lang === "fil" ? BENEFIT_FIL[bt.id].schedule : BENEFIT_SCHEDULE_EN[bt.id] ?? bt.schedule}</CardNote>,
                        };
                      })}
                    />
                    {errors.type && <div className="mt-3"><FieldError>{errors.type}</FieldError></div>}
                  </StepFrame>
                )}

                {step === 1 && b && (
                  <StepFrame key="c1" focusOnMount={moved} title={t("Who is filing this claim?", "Sino ang nagfa-file ng claim?")} helper={b.filer === "beneficiary" ? t("For this claim, one of the member's beneficiaries files.", "Para sa claim na ito, isa sa mga beneficiary ng miyembro ang nagfa-file.") : t("Usually you. A beneficiary can file for you if you cannot.", "Karaniwan ay ikaw. Puwedeng mag-file ang beneficiary para sa iyo kung hindi mo kaya.")}>
                    <RadioCards
                      ariaLabel={t("Who is filing", "Sino ang nagfa-file")}
                      value={filer}
                      onValueChange={(v) => {
                        setFiler(v);
                        setErrors({});
                      }}
                      options={[
                        {
                          value: "member",
                          icon: <User size="1.5rem" weight="duotone" />,
                          label: <span className="text-[1.0625rem]">{memberName(member)}</span>,
                          description: <CardNote>{b.filer === "beneficiary" ? t("The member. A beneficiary files this claim.", "Ang miyembro. Beneficiary ang nagfa-file nito.") : t("Me, the member", "Ako, ang miyembro")}</CardNote>,
                          disabled: b.filer === "beneficiary",
                        },
                        ...member.beneficiaries.map((ben) => ({
                          value: ben.id,
                          icon: <Users size="1.5rem" weight="duotone" />,
                          label: <span className="text-[1.0625rem]">{ben.name}</span>,
                          description: (
                            <CardNote>
                              {t(...RELATION[ben.relation])} · {t("beneficiary", "beneficiary")}
                              {ben.dependentCover && <span className="block">{t("Your dependent's free insurance designee", "Itinalaga para sa libreng insurance ng dependent")}</span>}
                            </CardNote>
                          ),
                        })),
                      ]}
                    />
                    {errors.filer && <div className="mt-3"><FieldError>{errors.filer}</FieldError></div>}
                  </StepFrame>
                )}

                {step === 2 && b && type && estimate && (
                  <StepFrame key="c2" focusOnMount={moved} title={t("What happened?", "Ano ang nangyari?")} helper={type === "MER" ? t("Nothing to fill in. The refund is declared by the Board each year.", "Walang kailangang punan. Idinedeklara ng Board ang refund taun-taon.") : t("Answer from your hospital or incident papers.", "Sumagot ayon sa papel mula sa ospital o insidente.")}>
                    <div className="space-y-5">
                      {type !== "MER" && (
                        <MField label={incidentLabel(type, t)} error={errors.date}>
                          {({ id, describedBy, invalid }) => <Input id={id} type="date" max={today} min={member.joinedAt.slice(0, 10)} value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} aria-describedby={describedBy} invalid={invalid} className="text-[1.0625rem]" />}
                        </MField>
                      )}
                      {hospitalType && (
                        <>
                          <MField label={t("Hospital", "Ospital")} error={errors.hospital} hint={t("As written on your certificate of confinement.", "Ayon sa nakasulat sa certificate of confinement.")}>
                            {({ id, describedBy, invalid }) => <Input id={id} value={hospital} onChange={(e) => setHospital(e.target.value)} aria-describedby={describedBy} invalid={invalid} autoComplete="off" className="text-[1.0625rem]" />}
                          </MField>
                          <MField label={t("Days in the hospital", "Ilang araw sa ospital")} error={errors.days} hint={t("Count the nights you were confined.", "Bilangin ang mga gabing naka-confine ka.")}>
                            {({ id, describedBy, invalid }) => (
                              <Input
                                id={id}
                                inputMode="numeric"
                                value={days === "" ? "" : String(days)}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                                  setDays(v ? Number(v) : "");
                                }}
                                aria-describedby={describedBy}
                                invalid={invalid}
                                className="max-w-[10rem] text-[1.0625rem] tnum"
                              />
                            )}
                          </MField>
                        </>
                      )}
                      {type === "WIA" && (
                        <div>
                          <GroupLabel>{t("How serious is the injury?", "Gaano kalubha ang pinsala?")}</GroupLabel>
                          <RadioCards
                            ariaLabel={t("How serious is the injury?", "Gaano kalubha ang pinsala?")}
                            value={severity}
                            onValueChange={(v) => {
                              setSeverity(v);
                              setErrors((e) => ({ ...e, severity: undefined }));
                            }}
                            columns={2}
                            options={[
                              { value: "major", label: <span className="text-[1.0625rem]">{t("Major injury", "Malubhang pinsala")}</span>, description: <CardNote>{peso(50_000, { whole: true })}</CardNote> },
                              { value: "minor", label: <span className="text-[1.0625rem]">{t("Minor injury", "Hindi malubha")}</span>, description: <CardNote>{peso(20_000, { whole: true })}</CardNote> },
                            ]}
                          />
                          {errors.severity && <div className="mt-2"><FieldError>{errors.severity}</FieldError></div>}
                        </div>
                      )}
                      {type !== "MER" && (
                        <MField label={t("Tell us briefly what happened", "Ikuwento nang maikli ang nangyari")} error={errors.description}>
                          {({ id, describedBy, invalid }) => <Textarea id={id} rows={3} maxLength={400} value={description} onChange={(e) => setDescription(e.target.value)} aria-describedby={describedBy} invalid={invalid} className="text-[1.0625rem]" />}
                        </MField>
                      )}
                      <div className="rounded-lg bg-positive-soft p-4" aria-live="polite">
                        <p className="text-[1rem] font-semibold text-ink-2">{t("Estimated benefit", "Tantyang benepisyo")}</p>
                        <p className="mt-1 font-display text-[2rem] font-extrabold leading-none tracking-[-0.02em] text-ink [font-stretch:86%]">{peso(estimate.amount)}</p>
                        <p className="mt-1.5 text-[1rem] text-ink-2">{t(estimate.en, estimate.fil)}</p>
                      </div>
                    </div>
                  </StepFrame>
                )}

                {step === 3 && b && (
                  <StepFrame key="c3" focusOnMount={moved} title={t("Add photos of your documents", "Magdagdag ng litrato ng mga dokumento")} helper={requiredDocs.length ? t("Take a clear photo of each paper in good light. A PDF also works.", "Kunan ng malinaw na litrato ang bawat papel sa maliwanag na lugar. Puwede rin ang PDF.") : undefined}>
                    {requiredDocs.length === 0 ? (
                      <p className="flex items-start gap-2.5 rounded-md bg-positive-soft px-4 py-3 text-[1.0625rem] text-ink">
                        <CheckCircle size="1.4rem" weight="fill" className="mt-0.5 shrink-0 text-positive" aria-hidden />
                        {docName(b.documents[0], lang)}.
                      </p>
                    ) : (
                      <>
                        <p className="mb-4 text-[1.0625rem] font-semibold text-ink" aria-live="polite">
                          {t(`${requiredDocs.filter((d) => (docs[d]?.length ?? 0) > 0).length} of ${requiredDocs.length} documents added`, `${requiredDocs.filter((d) => (docs[d]?.length ?? 0) > 0).length} sa ${requiredDocs.length} dokumento ang naidagdag`)}
                        </p>
                        <div className="space-y-3">
                          {requiredDocs.map((d) => (
                            <DocUpload key={d} label={docName(d, lang)} files={docs[d] ?? []} invalid={!!errors.docs} onChange={(f) => {
                              setDocs((prev) => ({ ...prev, [d]: f }));
                              if (f.length) setErrors((e) => ({ ...e, docs: undefined }));
                            }} />
                          ))}
                        </div>
                        {errors.docs && <div className="mt-3"><FieldError>{errors.docs}</FieldError></div>}
                        <p className="mt-4 text-[1rem] text-ink-2">{t("Missing papers can slow down your claim. Your photos stay on this phone until you file.", "Maaaring bumagal ang claim kapag may kulang na papel. Nasa phone mo lang ang mga litrato hanggang mag-file ka.")}</p>
                      </>
                    )}
                  </StepFrame>
                )}

                {step === 4 && b && (
                  <StepFrame key="c4" focusOnMount={moved} title={t("Where should we send the money?", "Saan namin ipapadala ang pera?")} helper={claimant && claimant.relation !== "Member" ? t("For claims filed by a beneficiary, PSMBFI confirms the account with the beneficiary before release.", "Para sa claim na isinampa ng beneficiary, kukumpirmahin ng PSMBFI ang account sa beneficiary bago i-release.") : t("Only accounts in your name that we have checked are shown.", "Ang mga account lang na nasa pangalan mo at na-check na namin ang ipinapakita.")}>
                    {member.payoutAccounts.length === 0 ? (
                      <p className="rounded-md bg-sunken p-4 text-[1rem] text-ink">{t("You have no payout account yet. We will prepare a cheque at your branch.", "Wala ka pang payout account. Maghahanda kami ng cheke sa iyong sangay.")}</p>
                    ) : (
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
                              {!a.verified && <span className="block font-semibold text-caution">{t("Still being checked", "Sinusuri pa")}</span>}
                            </CardNote>
                          ),
                          disabled: !a.verified,
                        }))}
                      />
                    )}
                    {errors.account && <div className="mt-3"><FieldError>{errors.account}</FieldError></div>}
                  </StepFrame>
                )}

                {step === 5 && b && type && estimate && (
                  <StepFrame key="c5" focusOnMount={moved} title={t("Check your claim", "Suriin ang iyong claim")} helper={t("Tap Change to fix anything. Nothing is sent until you confirm.", "I-tap ang Baguhin para ayusin. Walang maipapadala hangga't hindi mo kinukumpirma.")}>
                    <dl className="divide-y divide-[var(--line)] rounded-lg bg-sunken">
                      <Row label={t("Claim", "Claim")} value={t(b.name, b.nameFil)} onChange={() => go(0)} />
                      <Row label={t("Filed by", "Isinampa ni")} value={claimant ? `${claimant.name}${claimant.relation === "Member" ? "" : ` (${t(...RELATION[claimant.relation as Beneficiary["relation"]])})`}` : ""} onChange={() => go(1)} />
                      {type !== "MER" && <Row label={incidentLabel(type, t)} value={incidentDate ? date(incidentDate) : ""} onChange={() => go(2)} />}
                      {hospitalType && <Row label={t("Hospital", "Ospital")} value={`${hospital.trim()} · ${t(`${days} days`, `${days} araw`)}`} onChange={() => go(2)} />}
                      <Row label={t("Amount claimed", "Halagang kini-claim")} value={<span className="font-display text-[1.5rem] font-bold [font-stretch:88%]">{peso(estimate.amount)}</span>} />
                      {requiredDocs.length > 0 && <Row label={t("Documents", "Mga dokumento")} value={t(`${fileCount} ${fileCount === 1 ? "photo or file" : "photos or files"}`, `${fileCount} litrato o file`)} onChange={() => go(3)} />}
                      <Row label={t("Money goes to", "Ipapadala sa")} value={accountLabel} onChange={() => go(4)} />
                    </dl>
                    <div className="mt-6 rounded-lg bg-primary-soft p-4">
                      <Checkbox
                        checked={certify}
                        onCheckedChange={(v) => {
                          setCertify(v);
                          if (v) setErrors({});
                        }}
                        label={<span className="text-[1.0625rem] leading-relaxed text-ink">{t("I certify that the information and documents I gave are true and correct.", "Pinatutunayan ko na totoo at tama ang impormasyon at mga dokumentong ibinigay ko.")}</span>}
                      />
                      {errors.certify && <div className="mt-2"><FieldError>{errors.certify}</FieldError></div>}
                    </div>
                  </StepFrame>
                )}
              </AnimatePresence>

              <FlowNav
                onBack={step > 0 ? () => go(step - 1) : undefined}
                onNext={next}
                nextLabel={step === STEPS.length - 1 ? t("File this claim", "I-file ang claim") : undefined}
                nextIcon={step === STEPS.length - 1 ? <PaperPlaneTilt size="1.2rem" weight="bold" /> : undefined}
              />
            </div>
            <HelpLink topic="Claims" className="mt-5" />
          </div>

          <aside className="hidden xl:col-span-4 xl:block" aria-label={t("Your claim so far", "Ang iyong claim sa ngayon")}>
            <div className="sticky top-24 rounded-xl bg-surface p-6 shadow-e1">
              {b && type && estimate ? (
                <>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const I = BENEFIT_ICON[type];
                      return (
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                          <I size="1.4rem" weight="duotone" aria-hidden />
                        </span>
                      );
                    })()}
                    <p className="text-[1.0625rem] font-bold leading-snug">{t(b.name, b.nameFil)}</p>
                  </div>
                  <p className="mt-5 text-[0.9375rem] text-ink-2">{t("Estimated benefit", "Tantyang benepisyo")}</p>
                  <p className="font-display text-[1.9rem] font-extrabold leading-tight [font-stretch:86%]">{peso(estimate.amount)}</p>
                  <p className="text-[0.9375rem] text-ink-2">{t(estimate.en, estimate.fil)}</p>
                  {requiredDocs.length > 0 && (
                    <>
                      <p className="mt-5 text-[1rem] font-semibold">{t("Papers you will need", "Mga papel na kailangan")}</p>
                      <ul className="mt-2 space-y-1.5">
                        {requiredDocs.map((d) => {
                          const has = (docs[d]?.length ?? 0) > 0;
                          return (
                            <li key={d} className="flex items-start gap-2 text-[1rem] text-ink-2">
                              <CheckCircle size="1.2rem" weight={has ? "fill" : "regular"} className={cn("mt-0.5 shrink-0", has ? "text-positive" : "text-ink-3")} aria-hidden />
                              <span>
                                {docName(d, lang)}
                                <span className="sr-only">{has ? t(", added", ", naidagdag na") : t(", not yet added", ", hindi pa naidaragdag")}</span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </>
              ) : (
                <p className="text-[1rem] text-ink-2">{t("Choose a claim type to see the estimated benefit and the papers you need.", "Pumili ng uri ng claim para makita ang tantyang benepisyo at mga papel na kailangan.")}</p>
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
        title={t("File this claim?", "I-file ang claim na ito?")}
        footer={
          <>
            <Button variant="quiet" size="lg" className={WRAP_BTN} onClick={() => setConfirmOpen(false)} disabled={busy}>
              {t("Cancel", "Kanselahin")}
            </Button>
            <Button size="lg" className={WRAP_BTN} onClick={submit} loading={busy} loadingLabel={t("Filing", "Isinasampa")}>
              {t("File claim now", "I-file na ang claim")}
            </Button>
          </>
        }
      >
        {b && estimate && (
          <div>
            <p className="text-[1rem] text-ink-2">{t("You are claiming", "Kini-claim mo ang")}</p>
            <p className="mt-1 font-display text-[min(2.6rem,11vw)] font-extrabold leading-none tracking-[-0.02em] [font-stretch:86%]">{peso(estimate.amount)}</p>
            <p className="mt-2 text-[1.0625rem] font-semibold text-ink">{t(b.name, b.nameFil)}</p>
            <p className="text-[1rem] text-ink-2">
              {t(`To ${accountLabel} once approved`, `Sa ${accountLabel} kapag naaprubahan`)}
              {requiredDocs.length > 0 && <> · {t(`${fileCount} ${fileCount === 1 ? "document photo" : "document photos"}`, `${fileCount} litrato ng dokumento`)}</>}
            </p>
            <p className="mt-4 rounded-md bg-sunken px-4 py-3 text-[1rem] text-ink">{t("The final amount is set when your claim is approved.", "Itatakda ang huling halaga kapag naaprubahan ang claim.")}</p>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function Row({ label, value, onChange }: { label: string; value: React.ReactNode; onChange?: () => void }) {
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
