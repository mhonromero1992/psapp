import { useState } from "react";
import { DownloadSimple, Fingerprint, IdentificationCard, Key, PencilSimple, ShieldCheck, SignOut, UsersThree, ArrowCounterClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { date, monthLabel } from "@/lib/format";
import { PsmbfiEmblem } from "@/components/brand/Emblem";
import { Ribbon } from "@/components/brand/Ribbon";
import { Button } from "@/components/ui/Button";
import { Dialog, Sheet } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Choice";
import { LangToggle, TextSizeControl, ThemeToggle } from "@/components/layout/Toggles";
import { useBladeNavigate } from "@/components/motion/BladeWipe";
import { useCurrentMember, useEquity } from "@/store/hooks";
import { useDB } from "@/store/db";
import { useSession } from "@/store/session";
import { AGENCY_BY_CODE, OFFICE_BY_ID } from "@/data/reference";
import type { Beneficiary } from "@/data/types";
import { PageHead, SectionHead } from "../parts/Page";
import { downloadFile } from "../parts/download";
import { HelpLink } from "../parts/Help";

const REL_FIL: Record<Beneficiary["relation"], string> = { Spouse: "Asawa", Child: "Anak", Parent: "Magulang", Sibling: "Kapatid" };

export default function Profile() {
  const t = useT();
  const member = useCurrentMember();
  const equity = useEquity(member);
  const updateMember = useDB((s) => s.updateMember);
  const resetDemo = useDB((s) => s.resetDemo);
  const biometric = useSession((s) => s.biometric);
  const setBiometric = useSession((s) => s.setBiometric);
  const signOut = useSession((s) => s.signOut);
  const wipe = useBladeNavigate();
  const [card, setCard] = useState(false);
  const [contact, setContact] = useState(false);
  const [shares, setShares] = useState(false);
  const [pin, setPin] = useState(false);
  const [reset, setReset] = useState(false);

  const agency = AGENCY_BY_CODE[member.agency];
  const office = OFFICE_BY_ID[member.officeId];
  const fullName = `${member.firstName} ${member.middleInitial}. ${member.lastName}`;

  return (
    <div className="pb-6">
      <PageHead title={t("My profile", "Aking profile")} helper={t("Your membership card, your details and how the app looks for you.", "Ang iyong membership card, mga detalye at kung paano lumalabas ang app para sa iyo.")} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Membership card: large, so it can be shown at an RSO counter. */}
        <section aria-labelledby="card-title" className="relative overflow-hidden rounded-xl bg-night p-5 text-white shadow-e2 sm:p-6">
          <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-[radial-gradient(closest-side,rgb(16_84_164/0.6),transparent)]" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PsmbfiEmblem size={34} />
              <span className="font-display text-[1rem] font-bold leading-tight [font-stretch:90%]">PSMBFI<br /><span className="font-semibold text-white/75">{t("Members Equity Plan", "Members Equity Plan")}</span></span>
            </div>
            <Ribbon name="brand" size="lg" />
          </div>
          <h2 id="card-title" className="relative mt-6 font-display text-[1.7rem] font-extrabold leading-tight [font-stretch:86%]">
            {member.rank} {fullName}
          </h2>
          <p className="relative mt-1 text-[1rem] text-white/80">{agency.name}</p>
          <dl className="relative mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2">
              <dt className="text-[0.875rem] text-white/70">{t("Member ID", "Member ID")}</dt>
              <dd className="font-display text-[1.55rem] font-bold tracking-[0.02em] tnum [font-stretch:92%]">{member.id}</dd>
            </div>
            <div>
              <dt className="text-[0.875rem] text-white/70">{t("Member since", "Miyembro mula")}</dt>
              <dd className="font-semibold">{monthLabel(member.joinedAt.slice(0, 7))}</dd>
            </div>
            <div>
              <dt className="text-[0.875rem] text-white/70">{t("Status", "Status")}</dt>
              <dd className="flex items-center gap-1.5 font-semibold text-[#5fd99a]"><ShieldCheck size={18} weight="fill" aria-hidden /> {t("Active, covered", "Aktibo, may cover")}</dd>
            </div>
          </dl>
          <Button variant="light" size="lg" block className="relative mt-6" icon={<IdentificationCard size={22} weight="duotone" />} onClick={() => setCard(true)}>
            {t("Show my card at the counter", "Ipakita ang card sa counter")}
          </Button>
        </section>

        {/* How the app looks: first, because it matters most to many members. */}
        <section aria-labelledby="display-title" className="rounded-xl bg-surface p-5 shadow-e1 sm:p-6">
          <h2 id="display-title" className="font-display text-[1.3rem] font-bold [font-stretch:88%]">{t("How the app looks", "Itsura ng app")}</h2>
          <p className="mt-4 mb-2.5 font-semibold">{t("Text size", "Laki ng letra")}</p>
          <TextSizeControl />
          <div className="mt-5 flex min-h-12 items-center justify-between gap-3">
            <span className="font-semibold">{t("Language", "Wika")}</span>
            <LangToggle />
          </div>
          <div className="mt-2 flex min-h-12 items-center justify-between gap-3">
            <span className="font-semibold">{t("Dark screen", "Madilim na screen")}</span>
            <ThemeToggle />
          </div>
        </section>
      </div>

      {/* Contact details */}
      <section aria-labelledby="contact-title" className="mt-8">
        <SectionHead id="contact-title" title={t("Contact details", "Contact details")} action={<Button variant="tonal" size="sm" icon={<PencilSimple size={17} weight="bold" />} onClick={() => setContact(true)}>{t("Change", "Palitan")}</Button>} />
        <dl className="overflow-hidden rounded-xl bg-surface shadow-e1">
          {[
            [t("Mobile number", "Mobile number"), member.mobile],
            [t("Email", "Email"), member.email || t("Not given", "Wala")],
            [t("Unit", "Unit"), member.unit],
            [t("Your branch", "Ang iyong sangay"), `${office.name}, ${office.city}`],
          ].map(([k, v]) => (
            <div key={k} className="flex min-h-[3.75rem] flex-col justify-center gap-0.5 px-5 py-3 shadow-[inset_0_-1px_0_var(--line)] last:shadow-none sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-ink-2">{k}</dt>
              <dd className="font-semibold tnum sm:text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Beneficiaries */}
      <section aria-labelledby="bene-title" className="mt-8">
        <SectionHead id="bene-title" title={t("Your beneficiaries", "Ang iyong mga beneficiary")} count={member.beneficiaries.length} action={<Button variant="tonal" size="sm" icon={<UsersThree size={17} weight="bold" />} onClick={() => setShares(true)}>{t("Change shares", "Palitan ang hatian")}</Button>} />
        <ul className="overflow-hidden rounded-xl bg-surface shadow-e1">
          {member.beneficiaries.map((b) => (
            <li key={b.id} className="flex min-h-[4.25rem] items-center justify-between gap-4 px-5 py-3 shadow-[inset_0_-1px_0_var(--line)] last:shadow-none">
              <span className="min-w-0">
                <span className="block font-semibold">{b.name}</span>
                <span className="block text-ink-2">
                  {t(b.relation, REL_FIL[b.relation])}
                  {b.dependentCover && <> · {t("free insurance ₱50,000", "libreng insurance ₱50,000")}</>}
                </span>
              </span>
              <span className="shrink-0 font-display text-[1.4rem] font-bold tnum [font-stretch:88%]">{b.share}%</span>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 text-ink-2">{t("To add or remove a beneficiary, visit your branch with their birth or marriage certificate.", "Para magdagdag o mag-alis ng beneficiary, bumisita sa sangay dala ang birth o marriage certificate.")}</p>
      </section>

      {/* Security */}
      <section aria-labelledby="security-title" className="mt-8">
        <SectionHead id="security-title" title={t("Signing in", "Pag-sign in")} />
        <div className="space-y-3 rounded-xl bg-surface p-5 shadow-e1">
          <div className="flex items-center gap-4">
            <Fingerprint size={30} weight="duotone" className="shrink-0 text-primary" aria-hidden />
            <Switch className="flex-1" checked={!!biometric[member.id]} onCheckedChange={(v) => { setBiometric(member.id, v); toast.success(v ? t("Fingerprint sign-in is on", "Naka-on ang fingerprint sign-in") : t("Fingerprint sign-in is off", "Naka-off ang fingerprint sign-in")); }} label={t("Sign in with my fingerprint", "Mag-sign in gamit ang fingerprint")} description={t("No PIN to remember on this phone.", "Hindi na kailangang tandaan ang PIN sa phone na ito.")} />
          </div>
          <div className="h-px bg-line" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Key size={30} weight="duotone" className="shrink-0 text-primary" aria-hidden />
              <div>
                <p className="font-semibold">{t("6-number PIN", "6-numerong PIN")}</p>
                <p className="text-ink-2">{t("Used when fingerprint is not available.", "Gamit kapag walang fingerprint.")}</p>
              </div>
            </div>
            <Button variant="quiet" size="lg" onClick={() => setPin(true)}>
              {t("Change my PIN", "Palitan ang PIN")}
            </Button>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section aria-labelledby="privacy-title" className="mt-8">
        <SectionHead id="privacy-title" title={t("Your privacy", "Ang iyong privacy")} />
        <div className="rounded-xl bg-surface p-5 shadow-e1">
          <p className="flex items-start gap-3">
            <ShieldCheck size={28} weight="duotone" className="shrink-0 text-positive" aria-hidden />
            <span>
              <span className="block font-semibold">{t("Data Privacy Act consent given", "Nagbigay ng pahintulot sa Data Privacy Act")}</span>
              <span className="block text-ink-2">{member.dpaConsentAt ? date(member.dpaConsentAt) : t("Not yet given", "Wala pa")} · {t("for membership, loans and claims", "para sa membership, loans at claims")}</span>
            </span>
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="quiet"
              size="lg"
              icon={<DownloadSimple size={20} weight="bold" />}
              onClick={() => {
                const data = { member, equity: equity ? { equityValue: equity.equityValue, totalContributions: equity.totalContributions, months: equity.months } : null, exportedAt: new Date().toISOString(), note: "Sample data from the PS-ACCESS prototype." };
                downloadFile(`PS-ACCESS_my-data_${member.id}.json`, JSON.stringify(data, null, 2), "application/json");
                toast.success(t("Your data file is downloaded", "Na-download ang iyong data"));
              }}
            >
              {t("Download my data", "I-download ang aking data")}
            </Button>
          </div>
          <HelpLink topic="Something else" className="mt-3" />
        </div>
      </section>

      {/* Sign out and the demo reset */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="quiet" size="lg" icon={<SignOut size={20} weight="bold" />} onClick={() => { signOut(); wipe("/"); }}>
          {t("Sign out", "Mag-sign out")}
        </Button>
        <Button variant="ghost" icon={<ArrowCounterClockwise size={18} weight="bold" />} onClick={() => setReset(true)}>
          {t("Reset the sample data", "I-reset ang sample data")}
        </Button>
      </div>

      <MemberCardDialog open={card} onOpenChange={setCard} name={`${member.rank} ${fullName}`} id={member.id} agency={agency.name} />
      <ContactSheet open={contact} onOpenChange={setContact} mobile={member.mobile} email={member.email} onSave={(mobile, email) => { updateMember(member.id, { mobile, email }); toast.success(t("Contact details saved", "Na-save ang contact details")); }} />
      <SharesSheet open={shares} onOpenChange={setShares} benes={member.beneficiaries} onSave={(b) => { updateMember(member.id, { beneficiaries: b }); toast.success(t("Shares saved", "Na-save ang hatian")); }} />
      <PinDialog open={pin} onOpenChange={setPin} />
      <Dialog
        open={reset}
        onOpenChange={setReset}
        title={t("Reset the sample data?", "I-reset ang sample data?")}
        description={t("Loans, claims and requests you made in this demo will be cleared.", "Mabubura ang mga loan, claim at request na ginawa mo sa demo.")}
        footer={
          <>
            <Button variant="quiet" size="lg" onClick={() => setReset(false)}>{t("Keep my changes", "Huwag ituloy")}</Button>
            <Button variant="negative" size="lg" onClick={() => { resetDemo(); setReset(false); toast.success(t("Sample data reset", "Na-reset ang sample data")); }}>{t("Reset now", "I-reset na")}</Button>
          </>
        }
      />
    </div>
  );
}

function MemberCardDialog({ open, onOpenChange, name, id, agency }: { open: boolean; onOpenChange: (v: boolean) => void; name: string; id: string; agency: string }) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t("Show this at the counter", "Ipakita ito sa counter")} size="md">
      <div className="rounded-xl bg-night p-6 text-center text-white">
        <PsmbfiEmblem size={56} className="mx-auto" />
        <p className="mt-4 font-display text-[1.6rem] font-extrabold leading-tight [font-stretch:86%]">{name}</p>
        <p className="mt-1 text-white/80">{agency}</p>
        <p className="mt-6 text-[0.95rem] text-white/70">{t("Member ID", "Member ID")}</p>
        <p className="font-display text-[2.2rem] font-bold tracking-[0.03em] tnum [font-stretch:90%]">{id}</p>
      </div>
      <p className="mt-4 text-ink-2">{t("Turn up your screen brightness so the officer can read it.", "Lakasan ang liwanag ng screen para mabasa ng officer.")}</p>
    </Dialog>
  );
}

function ContactSheet({ open, onOpenChange, mobile, email, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; mobile: string; email: string; onSave: (m: string, e: string) => void }) {
  const t = useT();
  const [m, setM] = useState(mobile);
  const [e, setE] = useState(email);
  const [err, setErr] = useState<{ m?: string; e?: string }>({});
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => { onOpenChange(v); if (v) { setM(mobile); setE(email); setErr({}); } }}
      title={t("Change contact details", "Palitan ang contact details")}
      description={t("We send codes and updates to this mobile number.", "Dito namin ipinapadala ang mga code at update.")}
      footer={
        <>
          <Button variant="quiet" size="lg" onClick={() => onOpenChange(false)}>{t("Cancel", "Kanselahin")}</Button>
          <Button
            size="lg"
            onClick={() => {
              const x: typeof err = {};
              if (m.replace(/\D/g, "").length !== 11) x.m = t("Enter an 11-digit mobile number, like 0917 123 4567.", "Ilagay ang 11-digit na mobile number, gaya ng 0917 123 4567.");
              if (e && !/^\S+@\S+\.\S+$/.test(e)) x.e = t("Write an email address with an @, or leave it blank.", "Isulat ang email na may @, o iwanang blangko.");
              setErr(x);
              if (Object.keys(x).length) return;
              onSave(m, e);
              onOpenChange(false);
            }}
          >
            {t("Save", "I-save")}
          </Button>
        </>
      }
    >
      <div className="space-y-5 pt-1">
        <Field label={t("Mobile number", "Mobile number")} error={err.m}>
          {({ id, describedBy, invalid }) => <Input id={id} inputMode="tel" autoComplete="tel" value={m} onChange={(ev) => setM(ev.target.value)} aria-describedby={describedBy} invalid={invalid} className="h-14 text-[1.1rem] tnum" />}
        </Field>
        <Field label={t("Email", "Email")} optional error={err.e}>
          {({ id, describedBy, invalid }) => <Input id={id} inputMode="email" autoComplete="email" value={e} onChange={(ev) => setE(ev.target.value)} aria-describedby={describedBy} invalid={invalid} className="h-14 text-[1.05rem]" />}
        </Field>
      </div>
    </Sheet>
  );
}

function SharesSheet({ open, onOpenChange, benes, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; benes: Beneficiary[]; onSave: (b: Beneficiary[]) => void }) {
  const t = useT();
  const [vals, setVals] = useState<Record<string, string>>({});
  const total = benes.reduce((s, b) => s + (Number(vals[b.id] ?? b.share) || 0), 0);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => { onOpenChange(v); if (v) { setVals(Object.fromEntries(benes.map((b) => [b.id, String(b.share)]))); setErr(null); } }}
      title={t("Change shares", "Palitan ang hatian")}
      description={t("The shares must add up to 100%.", "Ang hatian ay dapat 100%.")}
      footer={
        <>
          <Button variant="quiet" size="lg" onClick={() => onOpenChange(false)}>{t("Cancel", "Kanselahin")}</Button>
          <Button
            size="lg"
            onClick={() => {
              if (total !== 100) return setErr(t(`The shares add up to ${total}%. Change them so they add up to 100%.`, `Ang kabuuan ay ${total}%. Baguhin para maging 100%.`));
              onSave(benes.map((b) => ({ ...b, share: Number(vals[b.id] ?? b.share) || 0 })));
              onOpenChange(false);
            }}
          >
            {t("Save shares", "I-save ang hatian")}
          </Button>
        </>
      }
    >
      <ul className="space-y-4 pt-1">
        {benes.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-4">
            <span className="min-w-0">
              <span className="block font-semibold">{b.name}</span>
              <span className="text-ink-2">{t(b.relation, REL_FIL[b.relation])}</span>
            </span>
            <label className="flex shrink-0 items-center gap-2">
              <span className="sr-only">{t(`Share for ${b.name}`, `Hati para kay ${b.name}`)}</span>
              <input inputMode="numeric" value={vals[b.id] ?? String(b.share)} onChange={(e) => setVals({ ...vals, [b.id]: e.target.value.replace(/\D/g, "").slice(0, 3) })} className="field-input h-14 w-24 text-center text-[1.2rem] font-semibold tnum" />
              <span className="font-semibold">%</span>
            </label>
          </li>
        ))}
      </ul>
      <p className={`mt-5 text-[1.05rem] font-semibold ${total === 100 ? "text-positive" : "text-caution"}`} aria-live="polite">
        {t("Total", "Kabuuan")}: <span className="tnum">{total}%</span>
      </p>
      {err && <p className="mt-2 font-medium text-negative" role="alert">{err}</p>}
    </Sheet>
  );
}

function PinDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const pin = useSession((s) => s.pin);
  const setPin = useSession((s) => s.setPin);
  const [cur, setCur] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const field = (label: string, v: string, set: (s: string) => void, auto: string) => (
    <Field label={label}>
      {({ id }) => <Input id={id} type="password" inputMode="numeric" autoComplete={auto} maxLength={6} value={v} onChange={(e) => set(e.target.value.replace(/\D/g, ""))} className="h-14 text-[1.4rem] tracking-[0.4em]" />}
    </Field>
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => { onOpenChange(v); if (!v) { setCur(""); setP1(""); setP2(""); setErr(null); } }}
      title={t("Change my PIN", "Palitan ang PIN")}
      footer={
        <>
          <Button variant="quiet" size="lg" onClick={() => onOpenChange(false)}>{t("Cancel", "Kanselahin")}</Button>
          <Button
            size="lg"
            onClick={() => {
              if (cur !== pin) return setErr(t("Your current PIN is not right.", "Mali ang kasalukuyang PIN."));
              if (!/^\d{6}$/.test(p1)) return setErr(t("Your new PIN needs exactly 6 numbers.", "Ang bagong PIN ay dapat may 6 na numero."));
              if (/^(\d)\1{5}$/.test(p1) || p1 === "123456" || p1 === "654321") return setErr(t("Choose a PIN that is harder to guess than repeated or counting numbers.", "Pumili ng PIN na hindi madaling hulaan."));
              if (p1 !== p2) return setErr(t("The two new PINs are not the same.", "Hindi magkapareho ang dalawang bagong PIN."));
              setPin(p1);
              onOpenChange(false);
              toast.success(t("Your PIN is changed", "Napalitan na ang PIN"));
            }}
          >
            {t("Save my new PIN", "I-save ang bagong PIN")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {field(t("Current PIN", "Kasalukuyang PIN"), cur, setCur, "current-password")}
        {field(t("New 6-number PIN", "Bagong 6-numerong PIN"), p1, setP1, "new-password")}
        {field(t("Type the new PIN again", "I-type muli ang bagong PIN"), p2, setP2, "new-password")}
        {err && <p className="font-medium text-negative" role="alert">{err}</p>}
      </div>
    </Dialog>
  );
}
