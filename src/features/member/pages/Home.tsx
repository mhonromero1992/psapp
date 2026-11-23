import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { AirplaneTilt, ArrowRight, CaretRight, FirstAidKit, Gavel, HandCoins, MapPin, ShieldCheck, TrendUp, UserCircle, Wallet } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { peso } from "@/lib/format";
import { useLang, useT } from "@/lib/i18n";
import { EASE_OUT } from "@/lib/motion";
import { AGENCY_BY_CODE, BENEFIT_BY_ID, LOAN_PRODUCT_BY_ID } from "@/data/reference";
import type { AssistRequest, Claim, Loan } from "@/data/types";
import { useDB } from "@/store/db";
import { useClaimsFor, useCoverage, useCurrentMember, useEquity, useLoansFor, useNotificationsFor, useSimulatedLoad } from "@/store/hooks";
import { CLAIM_STATUS, LOAN_STATUS } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { BladeMark } from "@/components/brand/BladeMark";
import { Ribbon } from "@/components/brand/Ribbon";
import { CountUp } from "@/components/motion/CountUp";
import { NotificationRow } from "../parts/Bits";
import { BENEFIT_ICON, OPEN_CLAIM, claimNext } from "../parts/claims";
import { PENDING_LOAN, nextDeduction, paidCount } from "../parts/loans";
import { Empty, Fact, LoadError, PageSkeleton, SectionHead, StatusBadge } from "../parts/Page";
import { ASSIST_STATUS, assistText, monthYear, nowMs } from "../parts/text";
import { StageTracker } from "../parts/Tracker";

/* The entrance plays once per visit: coming back to Home later shows it at rest. */
let introPlayed = false;
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const rise = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } } };

const WEEKDAYS = { en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], fil: ["Linggo", "Lunes", "Martes", "Miyerkules", "Huwebes", "Biyernes", "Sabado"] };
const MONTHS = { en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], fil: ["Enero", "Pebrero", "Marso", "Abril", "Mayo", "Hunyo", "Hulyo", "Agosto", "Setyembre", "Oktubre", "Nobyembre", "Disyembre"] };

export default function Home() {
  const t = useT();
  const lang = useLang();
  const member = useCurrentMember();
  const equity = useEquity(member);
  const coverage = useCoverage(member);
  const loans = useLoansFor(member.id);
  const claims = useClaimsFor(member.id);
  const notes = useNotificationsFor("member", member.id);
  const assist = useDB((s) => s.assist);
  const load = useSimulatedLoad();
  const reduced = useReducedMotion();
  const [animateIn] = useState(() => !introPlayed && !reduced);
  useEffect(() => {
    if (load.ready) introPlayed = true;
  }, [load.ready]);

  const now = new Date(nowMs());
  const hour = now.getHours();
  const greeting = hour < 12 ? t("Good morning", "Magandang umaga") : hour < 18 ? t("Good afternoon", "Magandang hapon") : t("Good evening", "Magandang gabi");
  const today = `${WEEKDAYS[lang][now.getDay()]}, ${now.getDate()} ${MONTHS[lang][now.getMonth()]}`;

  const activeLoans = useMemo(() => loans.filter((l) => l.status === "released"), [loans]);
  const pendingLoans = useMemo(() => loans.filter((l) => PENDING_LOAN.includes(l.status)), [loans]);
  const openClaims = useMemo(() => claims.filter((c) => OPEN_CLAIM.includes(c.status)), [claims]);
  const openAssist = useMemo(() => assist.filter((a) => a.memberId === member.id && a.status !== "closed"), [assist, member.id]);
  const latest = useMemo(() => [...notes].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3), [notes]);
  const unread = notes.filter((n) => !n.read).length;

  const agency = AGENCY_BY_CODE[member.agency];
  const life = coverage.find((c) => c.id === "life");
  const happening = activeLoans.length + pendingLoans.length + openClaims.length + openAssist.length;

  return (
    <div>
      <header className="mb-6 pt-1 md:mb-8">
        <p className="text-[0.9375rem] font-medium text-ink-2">{today}</p>
        <h1 className="mt-1.5 font-display text-[2.1rem] font-extrabold leading-[1.02] tracking-[-0.02em] [font-stretch:84%] sm:text-[2.6rem]">
          {greeting}, {member.firstName}
        </h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[1rem] text-ink-2">
          <Ribbon name="member" size="sm" />
          <span>
            {member.rank} · {agency.name}
          </span>
          <span className="tnum rounded-[8px] bg-sunken px-2 py-0.5 text-[0.9375rem] font-semibold text-ink-2">{member.id}</span>
        </p>
      </header>

      {load.error ? (
        <LoadError onRetry={load.retry} helpTopic="Something else" />
      ) : load.loading || !equity ? (
        <PageSkeleton shape="hero" />
      ) : (
        <motion.div variants={stagger} initial={animateIn ? "hidden" : false} animate="show">
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
            <motion.div variants={rise} className="lg:col-span-7">
              <EquityHero equity={equity} joinedAt={member.joinedAt} className="h-full" />
            </motion.div>
            <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-5">
              <motion.div variants={rise}>
                <Link to="/member/equity#coverage" className="sheen group block rounded-lg bg-surface p-5 shadow-e1 transition-shadow duration-300 hover:shadow-e2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[1rem] font-semibold text-ink">
                        <ShieldCheck size="1.4rem" weight="duotone" className="text-positive" aria-hidden />
                        {t("You're covered", "Protektado ka")}
                      </p>
                      <p className="mt-2.5 font-display text-[2rem] font-extrabold leading-none tracking-[-0.02em] [font-stretch:86%]">{peso(life?.amount ?? 0, { whole: true })}</p>
                      <p className="mt-2 text-[1rem] leading-snug text-ink-2">{t(`life insurance for your ${member.beneficiaries.length} beneficiaries`, `life insurance para sa iyong ${member.beneficiaries.length} beneficiary`)}</p>
                    </div>
                    <div className="grid size-[5rem] shrink-0 place-items-center rounded-full bg-positive-soft text-center">
                      <span>
                        <span className="block font-display text-[1.6rem] font-extrabold leading-none text-positive [font-stretch:86%]">{coverage.length}</span>
                        <span className="block text-[0.875rem] font-semibold leading-tight text-positive">{t("benefits", "benepisyo")}</span>
                      </span>
                    </div>
                  </div>
                  <span className="mt-4 inline-flex min-h-6 items-center gap-1.5 text-[1rem] font-semibold text-primary">
                    {t("See all your coverage", "Tingnan ang lahat ng coverage")}
                    <ArrowRight size="1rem" weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </motion.div>
              <motion.div variants={rise}>
                <QuickActions />
              </motion.div>
            </div>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-5">
            <motion.section variants={rise} aria-labelledby="happening" className="lg:col-span-7">
              <SectionHead id="happening" title={t("What's happening", "Mga update sa iyo")} />
              {happening === 0 ? (
                <div className="rounded-lg bg-surface shadow-e1">
                  <Empty
                    compact
                    title={t("Nothing in progress", "Walang kasalukuyang proseso")}
                    body={t("When you apply for a loan or file a claim, you can follow it here.", "Kapag nag-apply ka ng loan o nag-file ng claim, masusubaybayan mo ito rito.")}
                    action={<ButtonLink to="/member/loans/apply" size="lg">{t("Apply for a loan", "Mag-apply ng loan")}</ButtonLink>}
                    helpTopic="Something else"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {activeLoans.map((l) => (
                    <ActiveLoanCard key={l.id} loan={l} />
                  ))}
                  {openClaims.map((c) => (
                    <OpenClaimCard key={c.id} claim={c} />
                  ))}
                  {pendingLoans.map((l) => (
                    <PendingLoanRow key={l.id} loan={l} />
                  ))}
                  {openAssist.map((a) => (
                    <AssistRow key={a.id} req={a} />
                  ))}
                </div>
              )}
            </motion.section>

            <motion.section variants={rise} aria-labelledby="latest-notes" className="lg:col-span-5">
              <SectionHead id="latest-notes" title={t("Notifications", "Mga abiso")} count={unread || undefined} to="/member/notifications" linkLabel={t("See all", "Tingnan lahat")} />
              <div className="rounded-lg bg-surface p-1.5 shadow-e1">
                {latest.length === 0 ? (
                  <Empty compact title={t("No notifications yet", "Wala pang abiso")} body={t("Updates on your loans, claims and contributions will appear here.", "Dito lalabas ang mga update sa iyong loan, claim at kontribusyon.")} />
                ) : (
                  <ul className="divide-y divide-[var(--line)]">
                    {latest.map((n) => (
                      <li key={n.id}>
                        <NotificationRow n={n} compact />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.section>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function EquityHero({ equity, joinedAt, className }: { equity: NonNullable<ReturnType<typeof useEquity>>; joinedAt: string; className?: string }) {
  const t = useT();
  const lang = useLang();
  const last = equity.history[equity.history.length - 1];
  const year = Number(last.period.slice(0, 4));
  const startOfYear = equity.history.find((h) => h.period === `${year - 1}-12`)?.equity ?? 0;
  const added = equity.equityValue - startOfYear;
  const whole = Math.floor(equity.equityValue);
  const cents = Math.round((equity.equityValue - whole) * 100).toString().padStart(2, "0");
  return (
    <section aria-labelledby="equity-hero" className={cn("relative isolate overflow-hidden rounded-xl bg-night p-5 text-white shadow-e2 sm:p-7 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07),var(--e2)]", className)}>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(90%_80%_at_100%_0%,rgb(16_84_164/0.42),transparent_62%)]" />
      <BladeMark size={360} rim={false} className="pointer-events-none absolute -right-28 -top-28 -z-10 size-[21rem] rotate-[14deg] opacity-[0.13] sm:-right-16" />
      <div className="grain" aria-hidden />

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 id="equity-hero" className="flex items-center gap-2.5 font-display text-[1.125rem] font-semibold text-white [font-stretch:92%]">
          <Ribbon name="member" />
          {t("Your Equity Value", "Ang iyong Equity Value")}
        </h2>
        <span className="text-[0.9375rem] text-white/75">{t(`As of ${monthYear(last.period, lang)}`, `Hanggang ${monthYear(last.period, lang)}`)}</span>
      </div>

      <p className="mt-5 font-display text-[min(3rem,13.5vw)] font-extrabold leading-none tracking-[-0.03em] [font-stretch:84%] sm:text-[3.75rem]">
        <span className="sr-only">{peso(equity.equityValue)}</span>
        <span aria-hidden className="whitespace-nowrap">
          <span className="mr-1 align-[0.36em] text-[0.48em] text-white/75">₱</span>
          <CountUp value={whole} />
          <span className="align-[0.5em] text-[0.42em] text-white/70">.{cents}</span>
        </span>
      </p>
      <p className="mt-4 inline-flex items-center gap-2 rounded-[8px] bg-white/10 px-3 py-1.5 text-[0.9375rem] font-semibold text-green-300">
        <TrendUp size="1.1rem" weight="bold" aria-hidden />
        {t(`${peso(added)} added since January`, `${peso(added)} ang nadagdag mula Enero`)}
      </p>

      <dl className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,8.5rem),1fr))] gap-x-4 gap-y-4 pt-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]">
        <div>
          <dt className="text-[0.9375rem] text-white/75">{t("Monthly contribution", "Buwanang kontribusyon")}</dt>
          <dd className="mt-1 text-[1.2rem] font-semibold tnum">{peso(equity.monthly)}</dd>
          <dd className="text-[0.9375rem] leading-snug text-white/75">{t("3% of base pay, by ATD (salary deduction)", "3% ng base pay, sa ATD (kaltas sa sahod)")}</dd>
        </div>
        <div>
          <dt className="text-[0.9375rem] text-white/75">{t("Months contributed", "Buwan ng kontribusyon")}</dt>
          <dd className="mt-1 text-[1.2rem] font-semibold tnum">{equity.months}</dd>
          <dd className="text-[0.9375rem] text-white/75">{t(`since ${monthYear(joinedAt.slice(0, 7), lang)}`, `mula ${monthYear(joinedAt.slice(0, 7), lang)}`)}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <ButtonLink to="/member/equity" variant="light" size="lg" iconRight={<ArrowRight size="1.1rem" weight="bold" />}>
          {t("View statement", "Tingnan ang statement")}
        </ButtonLink>
        <span className="text-[0.875rem] text-white/70">{t("Sample figures", "Sample na halaga")}</span>
      </div>
    </section>
  );
}

interface Action {
  to: string;
  icon: Icon;
  en: string;
  fil: string;
  subEn?: string;
  subFil?: string;
}
const PRIMARY_ACTIONS: Action[] = [
  { to: "/member/loans/apply", icon: HandCoins, en: "Apply for a loan", fil: "Mag-apply ng loan", subEn: "Six kinds of loans", subFil: "Anim na uri ng loan" },
  { to: "/member/claims/new", icon: FirstAidKit, en: "File a claim", fil: "Mag-file ng claim", subEn: "Send photos of papers", subFil: "Magpadala ng litrato" },
];
const MORE_ACTIONS: Action[] = [
  { to: "/member/payouts", icon: Wallet, en: "Payouts", fil: "Payouts" },
  { to: "/member/assist", icon: Gavel, en: "Legal & Travel", fil: "Legal at Travel" },
  { to: "/member/branches", icon: MapPin, en: "Branches", fil: "Mga sangay" },
  { to: "/member/profile", icon: UserCircle, en: "My profile", fil: "Aking profile" },
];

function QuickActions() {
  const t = useT();
  return (
    <nav aria-label={t("Quick actions", "Mabilisang aksyon")}>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-3">
        {PRIMARY_ACTIONS.map((a) => {
          const I = a.icon;
          return (
            <li key={a.to}>
              <Link to={a.to} className="sheen flex h-full min-h-[7.5rem] flex-col justify-between gap-3 rounded-lg bg-primary-soft p-4 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_10%,transparent)] transition-[background-color] duration-200 hover:bg-[color-mix(in_oklab,var(--primary-soft)_80%,var(--primary)_10%)]">
                <I size="2rem" weight="duotone" aria-hidden />
                <span>
                  <span className="block font-display text-[1.2rem] font-bold leading-tight text-ink [font-stretch:90%]">{t(a.en, a.fil)}</span>
                  {a.subEn && <span className="mt-1 block text-[0.9375rem] leading-snug text-ink-2">{t(a.subEn, a.subFil)}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ul className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2.5">
        {MORE_ACTIONS.map((a) => {
          const I = a.icon;
          return (
            <li key={a.to}>
              <Link to={a.to} className="sheen flex h-full min-h-[3.75rem] items-center gap-3 rounded-lg bg-surface px-3.5 py-2.5 shadow-e1 transition-shadow duration-200 hover:shadow-e2">
                <I size="1.6rem" weight="duotone" className="shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1 text-[1rem] font-semibold leading-tight text-ink">{t(a.en, a.fil)}</span>
                <CaretRight size="1rem" weight="bold" className="shrink-0 text-ink-2" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ActiveLoanCard({ loan }: { loan: Loan }) {
  const t = useT();
  const lang = useLang();
  const p = LOAN_PRODUCT_BY_ID[loan.productId];
  const paid = paidCount(loan);
  const s = LOAN_STATUS[loan.status];
  return (
    <Link to={`/member/loans/${loan.id}`} className="sheen block rounded-lg bg-surface p-5 shadow-e1 transition-shadow duration-300 hover:shadow-e2">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <Ribbon stripes={p.ribbon} size="lg" />
          <div className="min-w-0">
            <p className="text-[1.0625rem] font-semibold leading-snug text-ink">{p.name}</p>
            <p className="text-[0.9375rem] text-ink-2 tnum">{loan.id}</p>
          </div>
        </div>
        <StatusBadge tone={s.tone}>{t(s.label, s.fil)}</StatusBadge>
      </div>
      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="font-display text-[1.55rem] font-bold leading-none tracking-[-0.015em] [font-stretch:88%]">{t(`Payment ${paid} of ${loan.termMonths}`, `Hulog ${paid} sa ${loan.termMonths}`)}</p>
        <p className="text-[1rem] font-semibold text-ink-2 tnum">{Math.round((paid / loan.termMonths) * 100)}%</p>
      </div>
      <Progress value={paid} max={loan.termMonths} className="mt-3 h-2.5" label={t(`${paid} of ${loan.termMonths} payments made`, `${paid} sa ${loan.termMonths} hulog ang nabayaran`)} />
      <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,8.5rem),1fr))] gap-4">
        <Fact size="sm" label={t("Left to pay", "Natitirang babayaran")} value={<span className="tnum">{peso(loan.balance)}</span>} />
        <Fact size="sm" label={t("Each month", "Kada buwan")} value={<span className="tnum">{peso(loan.monthly)}</span>} />
      </dl>
      <p className="mt-4 rounded-md bg-sunken px-3.5 py-2.5 text-[1rem] text-ink">
        {t("Next salary deduction:", "Susunod na kaltas sa sahod:")} <span className="font-semibold">{monthYear(nextDeduction(loan, p.processingDays), lang)}</span>
      </p>
    </Link>
  );
}

function OpenClaimCard({ claim }: { claim: Claim }) {
  const t = useT();
  const b = BENEFIT_BY_ID[claim.type];
  const I = BENEFIT_ICON[claim.type];
  const s = CLAIM_STATUS[claim.status];
  return (
    <Link to={`/member/claims/${claim.id}`} className="sheen block rounded-lg bg-surface p-5 shadow-e1 transition-shadow duration-300 hover:shadow-e2">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <I size="1.4rem" weight="duotone" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <p className="text-[1.0625rem] font-semibold leading-snug text-ink">{t(b.name, b.nameFil)}</p>
            <StatusBadge tone={s.tone}>{t(s.label, s.fil)}</StatusBadge>
          </div>
          <p className="mt-0.5 text-[0.9375rem] text-ink-2 tnum">
            {claim.id} · {peso(claim.amountClaimed, { whole: true })}
          </p>
        </div>
      </div>
      <StageTracker claim={claim} size="sm" className="mt-5" />
      <p className="mt-3.5 text-[1rem] leading-snug text-ink-2">{claimNext(claim, t)}</p>
    </Link>
  );
}

function PendingLoanRow({ loan }: { loan: Loan }) {
  const t = useT();
  const p = LOAN_PRODUCT_BY_ID[loan.productId];
  const s = LOAN_STATUS[loan.status];
  return (
    <Link to={`/member/loans/${loan.id}`} className="sheen flex min-h-[3.75rem] flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg bg-surface px-5 py-4 shadow-e1 transition-shadow duration-300 hover:shadow-e2">
      <span className="flex min-w-0 items-center gap-3">
        <Ribbon stripes={p.ribbon} size="md" />
        <span className="min-w-0">
          <span className="block text-[1.0625rem] font-semibold leading-snug text-ink">{t(`${p.name} application`, `Application sa ${p.name}`)}</span>
          <span className="block text-[0.9375rem] text-ink-2 tnum">
            {loan.id} · {peso(loan.principal, { whole: true })}
          </span>
        </span>
      </span>
      <StatusBadge tone={s.tone}>{t(s.label, s.fil)}</StatusBadge>
    </Link>
  );
}

function AssistRow({ req }: { req: AssistRequest }) {
  const t = useT();
  const lang = useLang();
  const s = ASSIST_STATUS[req.status];
  const I = req.kind === "travel" ? AirplaneTilt : Gavel;
  return (
    <Link to="/member/assist" className="sheen flex items-start gap-3.5 rounded-lg bg-surface px-5 py-4 shadow-e1 transition-shadow duration-300 hover:shadow-e2">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sunken text-ink-2">
        <I size="1.35rem" weight="duotone" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <span className="text-[1.0625rem] font-semibold leading-snug text-ink">{assistText(req.topic, lang)}</span>
          <StatusBadge tone={s.tone}>{t(s.en, s.fil)}</StatusBadge>
        </span>
        {req.nextStep && <span className="mt-1.5 block text-[1rem] leading-snug text-ink-2">{assistText(req.nextStep, lang)}</span>}
      </span>
    </Link>
  );
}
