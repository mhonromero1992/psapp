import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CheckCircle, Fingerprint, Info, Key } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { EASE_OUT } from "@/lib/motion";
import { Lockup } from "@/components/brand/Emblem";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Choice";
import { OtpInput } from "@/components/ui/OtpInput";
import { LangToggle } from "@/components/layout/Toggles";
import { useBladeNavigate } from "@/components/motion/BladeWipe";
import { HelpLink } from "@/features/member/parts/Help";
import { DEMO_MEMBER, useSession } from "@/store/session";

export const SAMPLE_OTP = "482913";

/** Accepts the member ID or the registered mobile number, in any spacing. */
function matchesMember(v: string) {
  const id = v.trim().toUpperCase().replace(/\s/g, "");
  const digits = v.replace(/\D/g, "");
  return id === DEMO_MEMBER.id || digits === DEMO_MEMBER.mobile.replace(/\D/g, "") || digits === "63" + DEMO_MEMBER.mobile.replace(/\D/g, "").slice(1);
}

export default function SignIn() {
  const t = useT();
  const navigate = useNavigate();
  const wipe = useBladeNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/member";
  const pin = useSession((s) => s.pin);
  const biometric = useSession((s) => s.biometric);
  const signIn = useSession((s) => s.signIn);
  const user = useSession((s) => s.user);

  const [account, setAccount] = useState("");
  const [pinValue, setPinValue] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [errors, setErrors] = useState<{ account?: string; pin?: string }>({});
  const [tries, setTries] = useState(5);
  const [busy, setBusy] = useState(false);
  const [finger, setFinger] = useState(false);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!account.trim()) errs.account = t("Enter your member ID or mobile number.", "Ilagay ang iyong member ID o mobile number.");
    else if (!matchesMember(account)) errs.account = t("We can't find that member ID or mobile number. Check it against your membership card.", "Hindi namin makita ang member ID o mobile number na iyan. Tingnan ang iyong membership card.");
    if (!/^\d{6}$/.test(pinValue)) errs.pin = t("Your PIN has 6 numbers.", "Ang iyong PIN ay may 6 na numero.");
    else if (!errs.account && pinValue !== pin) {
      const left = tries - 1;
      setTries(left);
      errs.pin = t(`That PIN does not match. You have ${left} tries left.`, `Hindi tugma ang PIN. May ${left} subok ka pa.`);
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(errs.account ? "signin-account" : "signin-pin")?.focus();
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      toast(t("Code sent by SMS", "Naipadala ang code sa SMS"), { description: t(`Sample code for this demo: ${SAMPLE_OTP}`, `Sample code para sa demo: ${SAMPLE_OTP}`) });
      navigate(`/sign-in/verify?next=${encodeURIComponent(next)}`, { state: { ok: true } });
    }, 650);
  };

  const fingerprintSignIn = () => {
    setFinger(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-5 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(var(--safe-top)+0.75rem)] sm:px-8 lg:justify-center lg:py-12">
      <div className="flex min-h-14 items-center justify-between gap-3">
        <ButtonLink to="/" variant="ghost" size="sm" icon={<ArrowLeft size={18} weight="bold" />} className="-ml-2">
          {t("Back", "Bumalik")}
        </ButtonLink>
        <div className="lg:hidden">
          <Lockup compact />
        </div>
        <LangToggle />
      </div>

      <h1 className="mt-6 font-display text-[2.3rem] font-extrabold leading-none tracking-[-0.02em] [font-stretch:84%]">{t("Sign in", "Mag-sign in")}</h1>
      <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-2">{t("Use your fingerprint, or your member ID and 6-number PIN.", "Gamitin ang iyong fingerprint, o ang member ID at 6-numerong PIN.")}</p>

      {biometric[DEMO_MEMBER.id] && (
        <button
          type="button"
          onClick={fingerprintSignIn}
          className="sheen mt-6 flex min-h-[5.5rem] w-full items-center gap-4 rounded-xl bg-surface px-5 text-left shadow-e1 transition-shadow hover:shadow-e2"
        >
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Fingerprint size={34} weight="duotone" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-[1.12rem] font-bold">{t("Sign in with fingerprint", "Mag-sign in gamit ang fingerprint")}</span>
            <span className="mt-0.5 block text-[0.92rem] text-ink-2">{t("Turned on for Rowena on this phone", "Naka-on para kay Rowena sa phone na ito")}</span>
          </span>
        </button>
      )}

      <div className="my-6 flex items-center gap-3 text-[0.9rem] font-semibold text-ink-3" aria-hidden>
        <span className="h-px flex-1 bg-line-strong" />
        {t("or use your PIN", "o gamitin ang PIN")}
        <span className="h-px flex-1 bg-line-strong" />
      </div>

      <form onSubmit={submit} noValidate className="space-y-5">
        <Field label={t("Member ID or mobile number", "Member ID o mobile number")} hint={t("Example: PSM-2012-004512 or 0917 482 1196", "Halimbawa: PSM-2012-004512 o 0917 482 1196")} error={errors.account} htmlFor="signin-account">
          {({ id, describedBy, invalid }) => (
            <Input id={id} autoComplete="username" autoCapitalize="characters" value={account} onChange={(e) => setAccount(e.target.value)} aria-describedby={describedBy} invalid={invalid} className="h-14 text-[1.12rem]" />
          )}
        </Field>
        <Field label={t("6-number PIN", "6-numerong PIN")} error={errors.pin} htmlFor="signin-pin">
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
              aria-describedby={describedBy}
              invalid={invalid}
              className="h-14 text-[1.4rem] tracking-[0.4em] tnum"
            />
          )}
        </Field>
        <Checkbox checked={showPin} onCheckedChange={setShowPin} label={t("Show my PIN", "Ipakita ang PIN")} />
        <Button type="submit" size="lg" block loading={busy} loadingLabel={t("Checking", "Sinusuri")} icon={<Key size={20} weight="bold" />}>
          {t("Continue", "Magpatuloy")}
        </Button>
      </form>

      <div className="mt-5 flex flex-col items-start gap-1">
        <button type="button" onClick={() => setForgot(true)} className="inline-flex min-h-12 items-center rounded-sm px-1 text-[1rem] font-semibold text-primary underline decoration-[1.5px] underline-offset-4">
          {t("I forgot my PIN", "Nakalimutan ko ang PIN")}
        </button>
        <HelpLink topic="Signing in or my PIN" />
      </div>

      <aside className="mt-6 rounded-lg bg-caution-soft p-4" aria-label={t("Sample account for this demo", "Sample account para sa demo")}>
        <p className="flex items-center gap-2 font-semibold text-caution">
          <Info size={20} weight="fill" aria-hidden /> {t("Sample account for this demo", "Sample account para sa demo")}
        </p>
        <p className="mt-1.5 text-[0.95rem] text-ink">
          {t("Member ID", "Member ID")} <span className="font-semibold tnum">{DEMO_MEMBER.id}</span> · PIN <span className="font-semibold tnum">{pin}</span>
        </p>
        <Button
          variant="quiet"
          size="sm"
          className="mt-3"
          onClick={() => {
            setAccount(DEMO_MEMBER.id);
            setPinValue(pin);
            setErrors({});
          }}
        >
          {t("Fill in for me", "Punan para sa akin")}
        </Button>
      </aside>

      <FingerprintDialog
        open={finger}
        onOpenChange={setFinger}
        onSuccess={() => {
          const { mobile: _m, pin: _p, ...u } = DEMO_MEMBER;
          signIn(u);
          wipe(next);
        }}
      />
      <ForgotPinDialog open={forgot} onOpenChange={setForgot} />
    </div>
  );
}

/** Simulated device prompt: the phone's own fingerprint sheet, then a clear "recognized". */
function FingerprintDialog({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void }) {
  const t = useT();
  const [state, setState] = useState<"waiting" | "ok">("waiting");
  const done = useRef(onSuccess);
  done.current = onSuccess;
  const close = useRef(onOpenChange);
  close.current = onOpenChange;
  useEffect(() => {
    if (!open) {
      setState("waiting");
      return;
    }
    const a = window.setTimeout(() => setState("ok"), 1300);
    const b = window.setTimeout(() => {
      close.current(false);
      done.current();
    }, 2100);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t("Touch the fingerprint sensor", "Hawakan ang fingerprint sensor")} size="sm">
      <div className="flex flex-col items-center py-4 text-center" role="status" aria-live="polite">
        <div className={cn("relative grid size-28 place-items-center rounded-full transition-colors duration-500", state === "ok" ? "bg-positive-soft text-positive" : "bg-primary-soft text-primary")}>
          <AnimatePresence mode="wait" initial={false}>
            {state === "ok" ? (
              <motion.span key="ok" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35, ease: EASE_OUT }}>
                <CheckCircle size={64} weight="fill" aria-hidden />
              </motion.span>
            ) : (
              <motion.span key="fp" initial={{ opacity: 0 }} animate={{ opacity: [0.55, 1, 0.55] }} transition={{ duration: 1.3, ease: "easeInOut" }}>
                <Fingerprint size={64} weight="duotone" aria-hidden />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-5 text-[1.12rem] font-semibold">{state === "ok" ? t("Fingerprint recognized", "Nakilala ang fingerprint") : t("Waiting for your fingerprint", "Hinihintay ang iyong fingerprint")}</p>
        <p className="mt-1 text-ink-2">{t("Simulated for this demo", "Simulation para sa demo")}</p>
      </div>
    </Dialog>
  );
}

/** Reset the PIN with a code sent to the registered mobile. Three short steps. */
function ForgotPinDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const setPin = useSession((s) => s.setPin);
  const [step, setStep] = useState(0);
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) window.setTimeout(() => { setStep(0); setMobile(""); setCode(""); setP1(""); setP2(""); setErr(null); }, 250);
  }, [open]);

  const go = () => {
    setErr(null);
    if (step === 0) {
      if (mobile.replace(/\D/g, "") !== DEMO_MEMBER.mobile.replace(/\D/g, "")) return setErr(t("That number is not the one on your membership record. For this demo, use 0917 482 1196.", "Hindi iyan ang numero sa iyong record. Para sa demo, gamitin ang 0917 482 1196."));
      toast(t("Code sent by SMS", "Naipadala ang code sa SMS"), { description: t(`Sample code for this demo: ${SAMPLE_OTP}`, `Sample code para sa demo: ${SAMPLE_OTP}`) });
      return setStep(1);
    }
    if (step === 1) {
      if (code !== SAMPLE_OTP) return setErr(t("That code is not right. Check the SMS and try again.", "Mali ang code. Tingnan ang SMS at subukan muli."));
      return setStep(2);
    }
    if (step === 2) {
      if (!/^\d{6}$/.test(p1)) return setErr(t("Your new PIN needs exactly 6 numbers.", "Ang bagong PIN ay dapat may 6 na numero."));
      if (/^(\d)\1{5}$/.test(p1) || p1 === "123456" || p1 === "654321") return setErr(t("Choose a PIN that is harder to guess than repeated or counting numbers.", "Pumili ng PIN na hindi madaling hulaan."));
      if (p1 !== p2) return setErr(t("The two PINs are not the same.", "Hindi magkapareho ang dalawang PIN."));
      setPin(p1);
      return setStep(3);
    }
    onOpenChange(false);
  };

  const titles = [t("Reset your PIN", "I-reset ang PIN"), t("Enter the code", "Ilagay ang code"), t("Choose a new PIN", "Pumili ng bagong PIN"), t("Your PIN is changed", "Napalitan na ang PIN")];
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={titles[step]}
      description={step < 3 ? t(`Step ${step + 1} of 3`, `Hakbang ${step + 1} sa 3`) : undefined}
      footer={
        <>
          {step > 0 && step < 3 && (
            <Button variant="quiet" size="lg" onClick={() => { setErr(null); setStep(step - 1); }}>
              {t("Back", "Bumalik")}
            </Button>
          )}
          <Button size="lg" onClick={go}>
            {step === 0 ? t("Send me a code", "Padalhan ako ng code") : step === 1 ? t("Check the code", "Suriin ang code") : step === 2 ? t("Save my new PIN", "I-save ang bagong PIN") : t("Sign in now", "Mag-sign in na")}
          </Button>
        </>
      }
    >
      {step === 0 && (
        <Field label={t("Your registered mobile number", "Ang iyong rehistradong mobile number")} error={err}>
          {({ id, describedBy, invalid }) => <Input id={id} inputMode="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} aria-describedby={describedBy} invalid={invalid} className="h-14 text-[1.12rem] tnum" placeholder="0917 482 1196" />}
        </Field>
      )}
      {step === 1 && (
        <div>
          <p className="mb-4 text-ink-2">{t("We sent a 6-number code to 0917 ••• 1196.", "Nagpadala kami ng 6-numerong code sa 0917 ••• 1196.")}</p>
          <OtpInput value={code} onChange={setCode} invalid={!!err} autoFocus />
          {err && <p className="mt-3 font-medium text-negative" role="alert">{err}</p>}
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <Field label={t("New 6-number PIN", "Bagong 6-numerong PIN")}>
            {({ id }) => <Input id={id} type="password" inputMode="numeric" maxLength={6} value={p1} onChange={(e) => setP1(e.target.value.replace(/\D/g, ""))} className="h-14 text-[1.4rem] tracking-[0.4em]" />}
          </Field>
          <Field label={t("Type the new PIN again", "I-type muli ang bagong PIN")} error={err}>
            {({ id, describedBy, invalid }) => <Input id={id} type="password" inputMode="numeric" maxLength={6} value={p2} onChange={(e) => setP2(e.target.value.replace(/\D/g, ""))} aria-describedby={describedBy} invalid={invalid} className="h-14 text-[1.4rem] tracking-[0.4em]" />}
          </Field>
        </div>
      )}
      {step === 3 && (
        <div className="flex items-start gap-3 rounded-lg bg-positive-soft p-4" role="status">
          <CheckCircle size={28} weight="fill" className="shrink-0 text-positive" aria-hidden />
          <p className="text-[1.02rem]">{t("Use your new PIN the next time you sign in.", "Gamitin ang bagong PIN sa susunod na pag-sign in.")}</p>
        </div>
      )}
    </Dialog>
  );
}
