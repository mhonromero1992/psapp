import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { Bank, CheckCircle, Copy, DeviceMobile, House, Info, Warning, WarningOctagon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { maskAccount } from "@/lib/format";
import { useLang, useT } from "@/lib/i18n";
import { EASE_OUT } from "@/lib/motion";
import { BladeMark } from "@/components/brand/BladeMark";
import { Ribbon } from "@/components/brand/Ribbon";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LOAN_PRODUCTS } from "@/data/reference";
import type { AppNotification, PayoutAccount } from "@/data/types";
import { useDB } from "@/store/db";
import { HelpLink } from "./Help";
import { relTime } from "./text";

/* ── Wizard step frame ─────────────────────────────────────── */

/**
 * One step of a flow. When the step changes because of the member, focus moves to its
 * heading (announced by screen readers) and the step slides in gently.
 */
export function StepFrame({ title, helper, focusOnMount, children }: { title: string; helper?: React.ReactNode; focusOnMount: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!focusOnMount) return;
    ref.current?.focus({ preventScroll: true });
    const top = ref.current?.getBoundingClientRect().top ?? 0;
    if (top < 90 || top > window.innerHeight * 0.55) window.scrollTo({ top: Math.max(0, window.scrollY + top - 170) });
  }, [focusOnMount]);
  return (
    <motion.section initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28, ease: EASE_OUT }}>
      <h2 ref={ref} tabIndex={-1} className="font-display text-[1.6rem] font-bold leading-tight tracking-[-0.015em] outline-none [font-stretch:88%]">
        {title}
      </h2>
      {helper && <p className="mt-2 text-[1.0625rem] leading-relaxed text-ink-2">{helper}</p>}
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}

/* ── Success screen ────────────────────────────────────────── */

/**
 * After any submission: the blades turn into place around a check that draws itself,
 * the reference number in large type, what happens next and when, and a big
 * "Back to Home". Static under reduced motion.
 */
export function SuccessPanel({ title, body, refLabel, refId, next, secondary, helpTopic }: { title: string; body: string; refLabel: string; refId: string; next: { title: string; body: string }[]; secondary?: React.ReactNode; helpTopic?: string }) {
  const t = useT();
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(refId);
      toast.success(t("Reference number copied", "Nakopya ang reference number"), { description: refId });
    } catch {
      toast.error(t("This device blocked copying. Please write the number down.", "Hindi pinayagan ng device ang pagkopya. Pakisulat ang numero."), { description: refId });
    }
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36, ease: EASE_OUT }} className="mx-auto max-w-2xl">
      <div className="rounded-xl bg-surface p-5 shadow-e2 sm:p-9">
        <SuccessMark />
        <h1 ref={ref} tabIndex={-1} className="mt-5 font-display text-[2rem] font-extrabold leading-[1.02] tracking-[-0.02em] outline-none [font-stretch:84%] sm:text-[2.4rem]">
          {title}
        </h1>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink-2">{body}</p>

        <div className="mt-6 rounded-lg bg-sunken p-4">
          <p className="text-[0.9375rem] font-semibold text-ink-2">{refLabel}</p>
          <p className="mt-1 break-all font-display text-[1.6rem] font-bold leading-tight tracking-[-0.01em] tnum [font-stretch:90%]">{refId}</p>
          <p className="mt-1 text-[0.9375rem] text-ink-2">{t("Keep this number. Our staff will ask for it if you call.", "Itago ang numerong ito. Hihingin ito ng aming staff kapag tumawag ka.")}</p>
          <Button variant="quiet" size="lg" className="mt-3 w-full sm:w-auto" onClick={copy} icon={<Copy size="1.2rem" weight="bold" />}>
            {t("Copy the number", "Kopyahin ang numero")}
          </Button>
        </div>

        <h2 className="mt-8 font-display text-[1.3rem] font-bold [font-stretch:90%]">{t("What happens next", "Ano ang susunod")}</h2>
        <ol className="mt-4 space-y-5">
          {next.map((n, i) => (
            <li key={n.title} className="flex gap-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-[1rem] font-bold text-primary tnum">{i + 1}</span>
              <div className="min-w-0 pt-1">
                <p className="text-[1.0625rem] font-semibold leading-snug text-ink">{n.title}</p>
                <p className="mt-1 text-[1rem] leading-relaxed text-ink-2">{n.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse sm:justify-start">
          <ButtonLink to="/member" size="lg" icon={<House size="1.25rem" weight="bold" />} className="w-full sm:w-auto">
            {t("Back to Home", "Bumalik sa Home")}
          </ButtonLink>
          {secondary}
        </div>
        {helpTopic && <HelpLink topic={helpTopic} className="mt-4" />}
      </div>
    </motion.div>
  );
}

function SuccessMark() {
  const reduced = useReducedMotion();
  return (
    <span className="relative grid size-[5.25rem] place-items-center" aria-hidden>
      <motion.span
        className="absolute inset-0"
        initial={reduced ? false : { rotate: -120, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 210, damping: 22, mass: 0.9 }}
      >
        <BladeMark size={84} className="size-full" />
      </motion.span>
      <motion.span
        className="relative grid size-[2.6rem] place-items-center rounded-full bg-surface shadow-e2"
        initial={reduced ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: reduced ? 0 : 0.22, duration: 0.3, ease: EASE_OUT }}
      >
        <svg viewBox="0 0 24 24" className="size-[1.6rem]">
          <motion.path
            d="M6 12.6 10.2 16.6 18 8"
            fill="none"
            stroke="var(--positive)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: reduced ? 0 : 0.42, duration: 0.5, ease: EASE_OUT }}
          />
        </svg>
      </motion.span>
    </span>
  );
}

/* ── Notifications ─────────────────────────────────────────── */

const TONE_ICON = { info: Info, positive: CheckCircle, caution: Warning, negative: WarningOctagon } as const;
const TONE_CLS = {
  info: "bg-primary-soft text-primary",
  positive: "bg-positive-soft text-positive",
  caution: "bg-caution-soft text-caution",
  negative: "bg-negative-soft text-negative",
} as const;

/** One notification: tapping marks it read and opens its link. */
export function NotificationRow({ n, compact }: { n: AppNotification; compact?: boolean }) {
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const markRead = useDB((s) => s.markNotificationRead);
  const Icon = TONE_ICON[n.tone];
  const title = lang === "fil" && n.titleFil ? n.titleFil : n.title;
  const body = lang === "fil" && n.bodyFil ? n.bodyFil : n.body;
  return (
    <button
      type="button"
      onClick={() => {
        if (!n.read) markRead(n.id);
        if (n.link) navigate(n.link);
      }}
      className={cn(
        "group flex min-h-[3.75rem] w-full items-start gap-3.5 text-left transition-colors duration-200 hover:bg-surface-2 active:bg-sunken",
        compact ? "rounded-md px-3 py-3.5" : "px-4 py-4 sm:px-5",
        !n.read && !compact && "bg-primary-soft/40",
      )}
    >
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", TONE_CLS[n.tone])}>
        <Icon size="1.35rem" weight="duotone" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[1.0625rem] leading-snug", n.read ? "font-medium text-ink-2" : "font-bold text-ink")}>{title}</span>
        <span className={cn("mt-1 block text-[1rem] leading-snug text-ink-2", compact && "line-clamp-2")}>{body}</span>
        <span className="mt-1.5 flex items-center gap-2 text-[0.875rem] text-ink-2">
          {!n.read && (
            <>
              <span aria-hidden className="size-2.5 rounded-full bg-primary" />
              <span className="font-semibold text-primary">{t("New", "Bago")}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <time dateTime={n.at}>{relTime(n.at, lang)}</time>
        </span>
      </span>
    </button>
  );
}

/* ── Payout account mark ───────────────────────────────────── */

export function AccountMark({ account, size = "md" }: { account: Pick<PayoutAccount, "kind" | "provider" | "accountNo">; size?: "sm" | "md" }) {
  const t = useT();
  const Icon = account.kind === "bank" ? Bank : DeviceMobile;
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className={cn("grid shrink-0 place-items-center rounded-full", size === "md" ? "size-12" : "size-10", account.kind === "bank" ? "bg-primary-soft text-primary" : "bg-positive-soft text-positive")}>
        <Icon size={size === "md" ? "1.5rem" : "1.25rem"} weight="duotone" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[1.0625rem] font-semibold text-ink">{account.provider}</span>
        <span className="block text-[0.9375rem] text-ink-2 tnum">
          {account.kind === "bank" ? t("Bank account", "Bank account") : t("E-wallet", "E-wallet")} {maskAccount(account.accountNo)}
        </span>
      </span>
    </span>
  );
}

/* ── Ribbon rack ───────────────────────────────────────────── */

/** The six product ribbons mounted like a uniform's ribbon rack (decorative). */
export function RibbonRack({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("inline-grid grid-cols-3 gap-[3px] rounded-[4px] p-[3px]", className)}>
      {LOAN_PRODUCTS.map((p) => (
        <Ribbon key={p.id} stripes={p.ribbon} size="md" />
      ))}
    </span>
  );
}
