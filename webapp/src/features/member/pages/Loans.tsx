import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowRight, CheckCircle, HandCoins, Warning, XCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { date, peso } from "@/lib/format";
import { useLang, useT } from "@/lib/i18n";
import { LOAN_PRODUCTS, LOAN_PRODUCT_BY_ID } from "@/data/reference";
import type { Loan } from "@/data/types";
import { useCurrentMember, useEquity, useLoansFor, useSimulatedLoad } from "@/store/hooks";
import { LOAN_STATUS } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Ribbon } from "@/components/brand/Ribbon";
import { RibbonRack } from "../parts/Bits";
import { HelpLink } from "../parts/Help";
import { CLOSED_LOAN, PENDING_LOAN, eligibilityFor, finalDeduction, maxFor, nextDeduction, paidCount, type Eligibility } from "../parts/loans";
import { Empty, Fact, LoadError, PageHead, PageSkeleton, SectionHead, StatusBadge } from "../parts/Page";
import { monthYear } from "../parts/text";

export default function Loans() {
  const t = useT();
  const member = useCurrentMember();
  const equity = useEquity(member);
  const loans = useLoansFor(member.id);
  const load = useSimulatedLoad();

  const sorted = useMemo(() => [...loans].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)), [loans]);
  const active = sorted.filter((l) => l.status === "released");
  const pending = sorted.filter((l) => PENDING_LOAN.includes(l.status));
  const past = sorted.filter((l) => CLOSED_LOAN.includes(l.status));
  const months = equity?.months ?? 0;

  return (
    <div>
      <PageHead
        title={t("Loans", "Mga loan")}
        helper={t("Six kinds of loans. You pay them back through ATD (salary deduction), so there is nothing to remember each month.", "Anim na uri ng loan. Binabayaran ito sa ATD (kaltas sa sahod), kaya wala kang kailangang tandaan buwan-buwan.")}
        action={
          <ButtonLink to="/member/loans/apply" size="lg" icon={<HandCoins size="1.3rem" weight="bold" />}>
            {t("Apply for a loan", "Mag-apply ng loan")}
          </ButtonLink>
        }
      />

      {load.error ? (
        <LoadError onRetry={load.retry} helpTopic="Loans" />
      ) : load.loading ? (
        <PageSkeleton shape="cards" />
      ) : (
        <>
          <section aria-labelledby="my-loans">
            <SectionHead id="my-loans" title={t("Your loans", "Ang iyong mga loan")} count={loans.length} />
            {loans.length === 0 ? (
              <div className="rounded-lg bg-surface shadow-e1">
                <Empty
                  title={t("You have no loans yet", "Wala ka pang loan")}
                  body={t("Choose a loan below to see how much you can borrow and what you would pay each month.", "Pumili ng loan sa ibaba para makita kung magkano ang mahihiram mo at ang buwanang bayad.")}
                  helpTopic="Loans"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {active.map((l) => (
                  <ActiveLoan key={l.id} loan={l} />
                ))}
                {pending.map((l) => (
                  <PendingLoan key={l.id} loan={l} />
                ))}
                {past.length > 0 && (
                  <div className="pt-4">
                    <h3 className="mb-2.5 text-[1.125rem] font-bold text-ink">{t("Finished loans", "Mga tapos nang loan")}</h3>
                    <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-lg bg-surface shadow-e1">
                      {past.map((l) => (
                        <li key={l.id}>
                          <PastLoanRow loan={l} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          <section aria-labelledby="products" className="mt-12">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <div>
                <h2 id="products" className="font-display text-[1.4rem] font-bold leading-tight tracking-[-0.015em] [font-stretch:88%]">{t("Loans you can apply for", "Mga loan na maaari mong i-apply")}</h2>
                <p className="mt-1.5 text-[1rem] text-ink-2">{t("Amounts and rates are sample values to confirm with PSMBFI.", "Sample na halaga lang ang mga amount at rate, kukumpirmahin sa PSMBFI.")}</p>
              </div>
              <RibbonRack />
            </div>
            <ul className="grid gap-3 lg:grid-cols-2">
              {LOAN_PRODUCTS.map((p) => (
                <li key={p.id}>
                  <ProductCard productId={p.id} max={maxFor(p, equity?.equityValue ?? 0)} elig={eligibilityFor(p, member, months, loans)} />
                </li>
              ))}
            </ul>
          </section>

          <HelpLink topic="Loans" className="mt-8" />
        </>
      )}
    </div>
  );
}

function ActiveLoan({ loan }: { loan: Loan }) {
  const t = useT();
  const lang = useLang();
  const p = LOAN_PRODUCT_BY_ID[loan.productId];
  const paid = paidCount(loan);
  const s = LOAN_STATUS[loan.status];
  return (
    <Link to={`/member/loans/${loan.id}`} className="sheen group block rounded-xl bg-surface p-5 shadow-e1 transition-shadow duration-300 hover:shadow-e2 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <Ribbon stripes={p.ribbon} size="lg" />
          <div className="min-w-0">
            <h3 className="text-[1.25rem] font-bold leading-snug text-ink">{p.name}</h3>
            <p className="text-[0.9375rem] text-ink-2 tnum">
              {loan.id} · {t(`${peso(loan.principal, { whole: true })} borrowed`, `${peso(loan.principal, { whole: true })} ang hiniram`)}
            </p>
          </div>
        </div>
        <StatusBadge tone={s.tone}>{t(s.label, s.fil)}</StatusBadge>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
        <div>
          <p className="text-[1rem] font-semibold text-ink-2">{t("Left to pay", "Natitirang babayaran")}</p>
          <p className="mt-1 font-display text-[2.2rem] font-extrabold leading-none tracking-[-0.02em] [font-stretch:86%]">{peso(loan.balance)}</p>
          <div className="mt-4 flex items-baseline justify-between gap-3">
            <p className="text-[1.0625rem] font-semibold text-ink">{t(`Payment ${paid} of ${loan.termMonths} made`, `Hulog ${paid} sa ${loan.termMonths} ang nabayaran`)}</p>
            <p className="text-[1rem] font-semibold text-ink-2 tnum">{Math.round((paid / loan.termMonths) * 100)}%</p>
          </div>
          <Progress value={paid} max={loan.termMonths} className="mt-2.5 h-3" label={t(`${paid} of ${loan.termMonths} payments made`, `${paid} sa ${loan.termMonths} hulog ang nabayaran`)} />
        </div>
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8.5rem),1fr))] gap-4 rounded-lg bg-sunken p-4">
          <Fact size="sm" label={t("Each month", "Kada buwan")} value={<span className="tnum">{peso(loan.monthly)}</span>} />
          <Fact size="sm" label={t("Next deduction", "Susunod na kaltas")} value={monthYear(nextDeduction(loan, p.processingDays), lang)} />
          <Fact size="sm" label={t("Last payment", "Huling hulog")} value={monthYear(finalDeduction(loan, p.processingDays), lang)} />
          <Fact size="sm" label={t("Interest", "Interes")} value={t(`${Math.round(loan.rate * 100)}% a year`, `${Math.round(loan.rate * 100)}% kada taon`)} />
        </dl>
      </div>
      <span className="mt-5 inline-flex min-h-6 items-center gap-1.5 text-[1rem] font-semibold text-primary">
        {t("See payments and details", "Tingnan ang mga hulog at detalye")}
        <ArrowRight size="1rem" weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

function PendingLoan({ loan }: { loan: Loan }) {
  const t = useT();
  const p = LOAN_PRODUCT_BY_ID[loan.productId];
  const s = LOAN_STATUS[loan.status];
  const note =
    loan.status === "returned"
      ? t("Something needs to be corrected. Open it to see what.", "May kailangang itama. Buksan ito para makita.")
      : loan.status === "for_release" || loan.status === "approved"
        ? t(`Approved. The money will be sent to ${loan.payoutLabel}.`, `Aprubado. Ipapadala ang pera sa ${loan.payoutLabel}.`)
        : t(`We review applications within ${p.processingDays} working days.`, `Sinusuri namin ang application sa loob ng ${p.processingDays} araw ng trabaho.`);
  return (
    <Link to={`/member/loans/${loan.id}`} className="sheen block rounded-lg bg-surface p-5 shadow-e1 transition-shadow duration-300 hover:shadow-e2">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <Ribbon stripes={p.ribbon} size="md" />
          <div className="min-w-0">
            <h3 className="text-[1.125rem] font-bold leading-snug text-ink">{t(`${p.name} application`, `Application sa ${p.name}`)}</h3>
            <p className="text-[0.9375rem] text-ink-2 tnum">
              {loan.id} · {peso(loan.principal, { whole: true })} · {t(`${loan.termMonths} months`, `${loan.termMonths} buwan`)}
            </p>
          </div>
        </div>
        <StatusBadge tone={s.tone}>{t(s.label, s.fil)}</StatusBadge>
      </div>
      <p className="mt-3 text-[1rem] leading-snug text-ink-2">{note}</p>
    </Link>
  );
}

function PastLoanRow({ loan }: { loan: Loan }) {
  const t = useT();
  const p = LOAN_PRODUCT_BY_ID[loan.productId];
  const s = LOAN_STATUS[loan.status];
  const ended = loan.timeline[loan.timeline.length - 1]?.at ?? loan.appliedAt;
  return (
    <Link to={`/member/loans/${loan.id}`} className="flex min-h-[3.75rem] flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-4 py-3.5 transition-colors hover:bg-surface-2 sm:px-5">
      <span className="flex min-w-0 items-center gap-3">
        <Ribbon stripes={p.ribbon} size="sm" />
        <span className="min-w-0">
          <span className="block text-[1.0625rem] font-semibold text-ink">{p.name}</span>
          <span className="block text-[0.9375rem] text-ink-2 tnum">
            {peso(loan.principal, { whole: true })} · {loan.status === "paid" ? t(`finished ${date(ended)}`, `natapos ${date(ended)}`) : date(ended)}
          </span>
        </span>
      </span>
      <StatusBadge tone={s.tone}>{t(s.label, s.fil)}</StatusBadge>
    </Link>
  );
}

const ELIG_ICON = { positive: CheckCircle, caution: Warning, negative: XCircle } as const;

function ProductCard({ productId, max, elig }: { productId: string; max: number; elig: Eligibility }) {
  const t = useT();
  const p = LOAN_PRODUCT_BY_ID[productId];
  const tone = elig.tone === "positive" || elig.tone === "caution" || elig.tone === "negative" ? elig.tone : "positive";
  const Icon = ELIG_ICON[tone];
  const longest = p.terms[p.terms.length - 1];
  const body = (
    <>
      <div className="flex items-center gap-3">
        <Ribbon stripes={p.ribbon} size="lg" />
        <h3 className="text-[1.25rem] font-bold leading-snug text-ink">{p.name}</h3>
      </div>
      <p className="mt-2.5 text-[1rem] leading-relaxed text-ink-2">{t(p.purpose, p.purposeFil)}</p>
      <dl className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))] gap-3 rounded-md bg-sunken px-4 py-3">
        <div>
          <dt className="text-[0.9375rem] text-ink-2">{t("Up to", "Hanggang")}</dt>
          <dd className="text-[1.0625rem] font-semibold text-ink tnum">{peso(max, { whole: true })}</dd>
        </div>
        <div>
          <dt className="text-[0.9375rem] text-ink-2">{t("Interest", "Interes")}</dt>
          <dd className="text-[1.0625rem] font-semibold text-ink">{t(`${Math.round(p.rate * 100)}% a year`, `${Math.round(p.rate * 100)}% kada taon`)}</dd>
        </div>
        <div>
          <dt className="text-[0.9375rem] text-ink-2">{t("Pay in up to", "Bayaran hanggang")}</dt>
          <dd className="text-[1.0625rem] font-semibold text-ink">{t(`${longest} months`, `${longest} buwan`)}</dd>
        </div>
      </dl>
      {p.id === "POL" && <p className="mt-3 text-[1rem] text-ink-2">{t("Your limit is 90% of your Equity Value.", "Ang limit mo ay 90% ng iyong Equity Value.")}</p>}
      <p className={cn("mt-3 flex items-start gap-2 text-[1rem] font-semibold leading-snug", tone === "positive" && "text-positive", tone === "caution" && "text-caution", tone === "negative" && "text-negative")}>
        <Icon size="1.25rem" weight="fill" className="mt-0.5 shrink-0" aria-hidden />
        <span>{t(elig.en, elig.fil)}</span>
      </p>
    </>
  );
  if (!elig.ok) {
    return (
      <div className="h-full rounded-lg bg-surface p-5 shadow-e1">
        {body}
        <p className="mt-4 text-[1rem] font-semibold text-ink-2">{t("Not available to you right now", "Hindi mo pa ito ma-a-apply ngayon")}</p>
      </div>
    );
  }
  return (
    <Link to={`/member/loans/apply?product=${p.id}`} className="sheen group flex h-full flex-col rounded-lg bg-surface p-5 shadow-e1 transition-shadow duration-300 hover:shadow-e2">
      {body}
      <span className="mt-auto inline-flex min-h-12 items-center gap-1.5 pt-3 text-[1.0625rem] font-semibold text-primary">
        {t(`Apply for ${p.name}`, `Mag-apply ng ${p.name}`)}
        <ArrowRight size="1.05rem" weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
