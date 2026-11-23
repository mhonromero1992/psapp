import { useEffect, useState } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router";
import { ArrowLeft, ChatCircleText, ShieldCheck } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { Lockup } from "@/components/brand/Emblem";
import { Button, ButtonLink } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { LangToggle } from "@/components/layout/Toggles";
import { useBladeNavigate } from "@/components/motion/BladeWipe";
import { HelpLink } from "@/features/member/parts/Help";
import { DEMO_MEMBER, useSession } from "@/store/session";
import { SAMPLE_OTP } from "./SignIn";

/** One-time code by SMS. No countdown pressure: a new code can be requested after 30 seconds. */
export default function Verify() {
  const t = useT();
  const wipe = useBladeNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const next = params.get("next") || "/member";
  const signIn = useSession((s) => s.signIn);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(30);

  useEffect(() => {
    if (wait <= 0) return;
    const id = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(id);
  }, [wait]);

  // Arrived without entering a PIN first: go back to sign-in.
  if (!(location.state as { ok?: boolean } | null)?.ok) return <Navigate to={`/sign-in?next=${encodeURIComponent(next)}`} replace />;

  const verify = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length !== 6) return setError(t("Enter all 6 numbers of the code.", "Ilagay ang lahat ng 6 na numero ng code."));
    if (code !== SAMPLE_OTP) return setError(t("That code is not right. Check the SMS and try again.", "Mali ang code. Tingnan ang SMS at subukan muli."));
    setError(null);
    setBusy(true);
    window.setTimeout(() => {
      const { mobile: _m, pin: _p, ...u } = DEMO_MEMBER;
      signIn(u);
      wipe(next);
    }, 500);
  };

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-5 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(var(--safe-top)+0.75rem)] sm:px-8 lg:justify-center lg:py-12">
      <div className="flex min-h-14 items-center justify-between gap-3">
        <ButtonLink to={`/sign-in?next=${encodeURIComponent(next)}`} variant="ghost" size="sm" icon={<ArrowLeft size={18} weight="bold" />} className="-ml-2">
          {t("Back", "Bumalik")}
        </ButtonLink>
        <div className="lg:hidden">
          <Lockup compact />
        </div>
        <LangToggle />
      </div>

      <span className="mt-6 grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
        <ChatCircleText size={34} weight="duotone" aria-hidden />
      </span>
      <h1 className="mt-5 font-display text-[2.3rem] font-extrabold leading-[1.02] tracking-[-0.02em] [font-stretch:84%]">{t("Enter the code we sent", "Ilagay ang code na ipinadala namin")}</h1>
      <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-2">
        {t("We sent a 6-number code by SMS to", "Nagpadala kami ng 6-numerong code sa SMS sa")} <span className="font-semibold text-ink tnum">0917 ••• 1196</span>.
      </p>

      <form onSubmit={verify} noValidate className="mt-7">
        <OtpInput value={code} onChange={(v) => { setCode(v); setError(null); }} invalid={!!error} autoFocus describedBy={error ? "otp-error" : undefined} />
        {error && (
          <p id="otp-error" className="mt-3 font-medium text-negative" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" block className="mt-6" loading={busy} loadingLabel={t("Signing you in", "Sina-sign in ka")} icon={<ShieldCheck size={21} weight="bold" />}>
          {t("Confirm and sign in", "Kumpirmahin at mag-sign in")}
        </Button>
      </form>

      <div className="mt-5">
        <Button
          variant="ghost"
          disabled={wait > 0}
          onClick={() => {
            setWait(30);
            toast(t("New code sent", "Bagong code naipadala"), { description: t(`Sample code for this demo: ${SAMPLE_OTP}`, `Sample code para sa demo: ${SAMPLE_OTP}`) });
          }}
        >
          {wait > 0 ? t(`Send a new code in ${wait} seconds`, `Magpadala ng bagong code sa loob ng ${wait} segundo`) : t("Send me a new code", "Padalhan ako ng bagong code")}
        </Button>
      </div>
      <p className="mt-4 rounded-lg bg-caution-soft p-4 text-[0.95rem] text-ink">
        {t("Sample code for this demo:", "Sample code para sa demo:")} <span className="font-bold tnum tracking-[0.15em]">{SAMPLE_OTP}</span>
      </p>
      <HelpLink topic="Signing in or my PIN" className="mt-4" />
    </div>
  );
}
