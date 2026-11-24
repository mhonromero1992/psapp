import { useMemo } from "react";
import { useParams } from "react-router";
import { Bank, DeviceMobile, DownloadSimple, Info, Money as MoneyIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { date, maskAccount, peso } from "@/lib/format";
import { useLang, useT } from "@/lib/i18n";
import { LOAN_PRODUCT_BY_ID } from "@/data/reference";
import { memberName } from "@/data/generate";
import { useDB } from "@/store/db";
import { useCurrentMember, useSimulatedLoad } from "@/store/hooks";
import { LOAN_STATUS } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Ribbon } from "@/components/brand/Ribbon";
import { downloadFile, toCsv } from "../parts/download";
import { History } from "../parts/Flow";
import { HelpLink } from "../parts/Help";
import { finalDeduction, firstDeduction, loanUpcoming, nextDeduction, paidCount, scheduleFor, type ScheduleRow } from "../parts/loans";
import { Empty, Fact, LoadError, PageHead, PageSkeleton, SectionHead, ShowMoreButton, SimpleTable, StatusBadge, useShowMore } from "../parts/Page";
import { localTimeline, monthYear } from "../parts/text";

export default function LoanDetail() {
  const t = useT();
  const lang = useLang();
  const { id } = useParams();
  const member = useCurrentMember();
  const loans = useDB((s) => s.loans);
  const loan = useMemo(() => loans.find((l) => l.id === id && l.memberId === member.id), [loans, id, member.id]);
  const load = useSimulatedLoad();
  const rowsShown = useShowMore(12);

  const p = loan ? LOAN_PRODUCT_BY_ID[loan.productId] : null;
  const schedule = useMemo(() => (loan && p ? scheduleFor(loan, p.processingDays) : []), [loan, p]);

  if (load.error) return <Shell><LoadError onRetry={load.retry} helpTopic="Loans" /></Shell>;
  if (load.loading) return <Shell><PageSkeleton shape="cards" /></Shell>;
  if (!loan || !p) {
    return (
      <Shell>
        <div className="rounded-lg bg-surface shadow-e1">
          <Empty
            title={t("We can't find this loan", "Hindi namin makita ang loan na ito")}
            body={t(`There is no loan ${id ?? ""} on your record. It may have a different reference number.`, `Walang loan na ${id ?? ""} sa iyong record. Baka iba ang reference number nito.`)}
            action={<ButtonLink to="/member/loans" size="lg">{t("Go to my loans", "Pumunta sa aking mga loan")}</ButtonLink>}
            helpTopic="Loans"
          />
        </div>
      </Shell>
    );
  }

  const s = LOAN_STATUS[loan.status];
  const paid = paidCount(loan);
  const released = loan.status === "released";
  const estimate = !released && loan.status !== "paid";
  const account = member.payoutAccounts.find((a) => a.id === loan.payoutAccountId);
  const events = localTimeline(loan.timeline, lang);
  const upcoming = loanUpcoming(loan, p, t, lang);
  const totalInterest = Math.round(schedule.reduce((sum, r) => sum + r.interest, 0) * 100) / 100;
  const shown = schedule.slice(0, rowsShown.count);
  const lastNote = [...loan.timeline].reverse().find((e) => e.note && (loan.status === "returned" || loan.status === "rejected"))?.note;

  const download = () => {
    const fileName = `PSMBFI-${loan.id}-summary.csv`;
    const lines: (string | number)[][] = [
      ["PS-ACCESS loan summary (sample values)"],
      ["Member", memberName(member)],
      ["Member ID", member.id],
      ["Loan", `${p.name} ${loan.id}`],
      ["Status", s.label],
      ["Applied", loan.appliedAt.slice(0, 10)],
      ["Amount borrowed (PHP)", loan.principal.toFixed(2)],
      ["Interest", `${Math.round(loan.rate * 100)}% a year`],
      ["Months", loan.termMonths],
      ["Monthly payment (PHP)", loan.monthly.toFixed(2)],
      ["Payments made", `${paid} of ${loan.termMonths}`],
      ["Balance (PHP)", loan.balance.toFixed(2)],
      ["Money sent to", loan.payoutLabel],
      ["Purpose", loan.purpose],
      [],
      [estimate ? "Estimated payment schedule" : "Payment schedule"],
      ["No.", "Payroll month", "Payment (PHP)", "Interest (PHP)", "Principal (PHP)", "Balance after (PHP)", "Status"],
      ...schedule.map((r) => [r.no, r.period, r.payment.toFixed(2), r.interest.toFixed(2), r.principal.toFixed(2), r.balance.toFixed(2), r.state === "paid" ? "Deducted" : r.state === "next" ? "Next" : "Scheduled"]),
    ];
    downloadFile(fileName, toCsv(lines), "text/csv;charset=utf-8");
    toast.success(t("Loan summary downloaded", "Na-download ang buod ng loan"), { description: fileName });
  };

  const stateBadge = (r: ScheduleRow) =>
    r.state === "paid" ? (
      <StatusBadge tone="positive">{t("Deducted", "Naikaltas na")}</StatusBadge>
    ) : r.state === "next" ? (
      <StatusBadge tone="info">{t("Next", "Susunod")}</StatusBadge>
    ) : (
      <span className="text-[0.9375rem] text-ink-2">{estimate ? t("Estimate", "Tantya") : t("Scheduled", "Nakatakda")}</span>
    );

  return (
    <div>
      <PageHead
        back={{ to: "/member/loans", label: t("Loans", "Mga loan") }}
        lead={
          <span className="flex items-center gap-2.5 text-[1rem] font-semibold text-ink-2">
            <Ribbon stripes={p.ribbon} size="lg" />
            <span className="tnum">{loan.id}</span>
          </span>
        }
        title={p.name}
        meta={
          <>
            <StatusBadge tone={s.tone}>{t(s.label, s.fil)}</StatusBadge>
            <span className="text-[1rem] text-ink-2">{t(`Applied ${date(loan.appliedAt)}`, `Nag-apply noong ${date(loan.appliedAt)}`)}</span>
          </>
        }
        action={
          <Button size="lg" variant="tonal" icon={<DownloadSimple size="1.25rem" weight="bold" />} onClick={download}>
            {t("Download loan summary", "I-download ang buod ng loan")}
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-7">
          {/* The figure that matters for this status */}
          <section aria-label={t("Loan amounts", "Mga halaga ng loan")} className="rounded-xl bg-surface p-5 shadow-e1 sm:p-7">
            {lastNote && (
              <p className={cn("mb-5 flex items-start gap-2.5 rounded-md px-4 py-3 text-[1rem] leading-snug", loan.status === "returned" ? "bg-caution-soft text-ink" : "bg-negative-soft text-ink")}>
                <Info size="1.3rem" weight="fill" className={cn("mt-0.5 shrink-0", loan.status === "returned" ? "text-caution" : "text-negative")} aria-hidden />
                <span>{lastNote}</span>
              </p>
            )}
            <p className="text-[1rem] font-semibold text-ink-2">
              {released ? t("Left to pay", "Natitirang babayaran") : loan.status === "paid" ? t("Fully paid", "Bayad na nang buo") : t("Amount you asked for", "Halagang hiniling mo")}
            </p>
            <p className="mt-1 font-display text-[min(2.6rem,12vw)] font-extrabold leading-none tracking-[-0.02em] [font-stretch:86%] sm:text-[3rem]">{peso(released ? loan.balance : loan.principal)}</p>
            {(released || loan.status === "paid") && (
              <>
                <div className="mt-5 flex items-baseline justify-between gap-3">
                  <p className="text-[1.0625rem] font-semibold text-ink">{t(`Payment ${paid} of ${loan.termMonths} made`, `Hulog ${paid} sa ${loan.termMonths} ang nabayaran`)}</p>
                  <p className="text-[1rem] font-semibold text-ink-2 tnum">{Math.round((paid / loan.termMonths) * 100)}%</p>
                </div>
                <Progress value={paid} max={loan.termMonths} tone={loan.status === "paid" ? "positive" : "primary"} className="mt-2.5 h-3" label={t(`${paid} of ${loan.termMonths} payments made`, `${paid} sa ${loan.termMonths} hulog ang nabayaran`)} />
              </>
            )}
            <dl className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-x-5 gap-y-5 rounded-lg bg-sunken p-4 sm:p-5">
              <Fact label={t("Borrowed", "Hiniram")} value={<span className="tnum">{peso(loan.principal)}</span>} />
              <Fact label={estimate ? t("Each month (estimate)", "Kada buwan (tantya)") : t("Each month", "Kada buwan")} value={<span className="tnum">{peso(loan.monthly)}</span>} />
              <Fact label={t("Interest", "Interes")} value={t(`${Math.round(loan.rate * 100)}% a year`, `${Math.round(loan.rate * 100)}% kada taon`)} hint={t(`${peso(totalInterest)} in total`, `${peso(totalInterest)} lahat`)} />
              <Fact label={t("Months to pay", "Ilang buwan")} value={t(`${loan.termMonths} months`, `${loan.termMonths} buwan`)} />
              {released && <Fact label={t("Next deduction", "Susunod na kaltas")} value={monthYear(nextDeduction(loan, p.processingDays), lang)} hint={t("deducted from your pay", "ikakaltas sa sahod")} />}
              {(released || loan.status === "paid") && <Fact label={t("Last payment", "Huling hulog")} value={monthYear(finalDeduction(loan, p.processingDays), lang)} />}
              {estimate && loan.status !== "rejected" && <Fact label={t("First deduction (estimate)", "Unang kaltas (tantya)")} value={monthYear(firstDeduction(loan, p.processingDays), lang)} />}
            </dl>
          </section>

          <section aria-labelledby="money-title" className="rounded-xl bg-surface p-5 shadow-e1 sm:p-6">
            <h2 id="money-title" className="font-display text-[1.4rem] font-bold leading-tight [font-stretch:88%]">{t("Where the money goes", "Saan ipapadala ang pera")}</h2>
            <div className="mt-4 flex items-center gap-3">
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", account?.kind === "ewallet" ? "bg-positive-soft text-positive" : "bg-primary-soft text-primary")}>
                {account?.kind === "ewallet" ? <DeviceMobile size="1.5rem" weight="duotone" aria-hidden /> : account ? <Bank size="1.5rem" weight="duotone" aria-hidden /> : <MoneyIcon size="1.5rem" weight="duotone" aria-hidden />}
              </span>
              <div className="min-w-0">
                <p className="text-[1.0625rem] font-semibold text-ink">{account ? account.provider : loan.payoutLabel}</p>
                {account && <p className="text-[0.9375rem] text-ink-2 tnum">{account.kind === "bank" ? t("Bank account", "Bank account") : t("E-wallet", "E-wallet")} {maskAccount(account.accountNo)}</p>}
              </div>
            </div>
            <p className="mt-4 text-[1rem] leading-relaxed text-ink-2">
              {loan.releasedAt
                ? t(`${peso(loan.principal)} was sent on ${date(loan.releasedAt)}.`, `Naipadala ang ${peso(loan.principal)} noong ${date(loan.releasedAt)}.`)
                : loan.status === "rejected"
                  ? t("No money was sent because the loan was not approved.", "Walang naipadalang pera dahil hindi naaprubahan ang loan.")
                  : t("The money is sent here once the loan is approved.", "Ipapadala rito ang pera kapag naaprubahan ang loan.")}
            </p>
            <h3 className="mt-6 text-[1rem] font-semibold text-ink-2">{t("What the loan is for", "Para saan ang loan")}</h3>
            <p className="mt-1 text-[1.0625rem] text-ink">{loan.purpose}</p>
          </section>
        </div>

        <div className="space-y-5 xl:col-span-5">
          <section aria-labelledby="history-title" className="rounded-xl bg-surface p-5 shadow-e1 sm:p-6">
            <h2 id="history-title" className="mb-5 font-display text-[1.4rem] font-bold leading-tight [font-stretch:88%]">{t("History", "Kasaysayan")}</h2>
            <History events={events} upcoming={upcoming} />
          </section>
        </div>
      </div>

      {/* Schedule: list on phones, a plain table on wider screens */}
      {loan.status !== "rejected" && (
        <section aria-labelledby="schedule-title" className="mt-10">
          <SectionHead id="schedule-title" title={estimate ? t("Estimated payment schedule", "Tantyang iskedyul ng hulog") : t("Payment schedule", "Iskedyul ng hulog")} count={schedule.length} />
          <p className="-mt-1 mb-3 text-[1rem] text-ink-2">{t("Each payment is deducted from your pay through ATD (salary deduction).", "Ikinakaltas ang bawat hulog sa sahod mo sa ATD (kaltas sa sahod).")}</p>
          <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-lg bg-surface shadow-e1 md:hidden">
            {shown.map((r) => (
              <li key={r.no} className={cn("flex min-h-[3.75rem] flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-4 py-3", r.state === "next" && "bg-primary-soft/50")}>
                <div className="min-w-0">
                  <p className="text-[1.0625rem] font-semibold text-ink">
                    {t(`Payment ${r.no}`, `Hulog ${r.no}`)} · {monthYear(r.period, lang)}
                  </p>
                  <p className="text-[0.9375rem] text-ink-2 tnum">{t(`Balance after: ${peso(r.balance)}`, `Balanse pagkatapos: ${peso(r.balance)}`)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[1.0625rem] font-semibold text-ink tnum">{peso(r.payment)}</span>
                  {stateBadge(r)}
                </div>
              </li>
            ))}
          </ul>
          <SimpleTable
            className="hidden md:block"
            caption={t("Payment schedule", "Iskedyul ng hulog")}
            rows={shown}
            rowKey={(r) => String(r.no)}
            columns={[
              { key: "no", header: t("No.", "Blg."), cell: (r) => <span className="tnum font-semibold">{r.no}</span> },
              { key: "month", header: t("Payroll month", "Buwan ng sahod"), cell: (r) => monthYear(r.period, lang) },
              { key: "pay", header: t("Payment", "Hulog"), align: "right", cell: (r) => <span className="font-semibold">{peso(r.payment)}</span> },
              { key: "int", header: t("Interest", "Interes"), align: "right", cell: (r) => <span className="text-ink-2">{peso(r.interest)}</span>, wideOnly: true },
              { key: "bal", header: t("Balance after", "Balanse pagkatapos"), align: "right", cell: (r) => peso(r.balance) },
              { key: "state", header: t("Status", "Status"), cell: (r) => stateBadge(r) },
            ]}
          />
          <ShowMoreButton shown={shown.length} total={schedule.length} step={12} onMore={rowsShown.more} noun={{ en: "payments", fil: "hulog" }} />
        </section>
      )}
      <HelpLink topic="Loans" className="mt-6" />
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <div>
      <PageHead back={{ to: "/member/loans", label: t("Loans", "Mga loan") }} title={t("Loan details", "Detalye ng loan")} />
      {children}
    </div>
  );
}
