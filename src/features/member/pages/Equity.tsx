import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { DownloadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { date, peso } from "@/lib/format";
import { useLang, useT } from "@/lib/i18n";
import { AGENCY_BY_CODE } from "@/data/reference";
import { memberName } from "@/data/generate";
import type { Contribution } from "@/data/types";
import { useContributions, useCoverage, useCurrentMember, useEquity, useSimulatedLoad } from "@/store/hooks";
import { AreaChart, Legend } from "@/components/charts/AreaChart";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/motion/CountUp";
import { Ribbon } from "@/components/brand/Ribbon";
import { DeductionMeter } from "../parts/Controls";
import { downloadFile, toCsv } from "../parts/download";
import { BigSegmented } from "../parts/Form";
import { HelpLink } from "../parts/Help";
import { Fact, LoadError, PageHead, PageSkeleton, SectionHead, ShowMoreButton, SimpleTable, useShowMore } from "../parts/Page";
import { coverageDetail, monthYear } from "../parts/text";

type Range = "12m" | "5y" | "all";

const SHORT = { en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], fil: ["Ene", "Peb", "Mar", "Abr", "May", "Hun", "Hul", "Ago", "Set", "Okt", "Nob", "Dis"] };
/** "Oct ’26": short enough that axis labels do not collide on a phone. */
const axisLabel = (period: string, lang: "en" | "fil") => `${SHORT[lang][Number(period.slice(5, 7)) - 1]} ’${period.slice(2, 4)}`;

const SOURCE: Record<Contribution["source"], [string, string]> = {
  ATD: ["ATD (salary deduction)", "ATD (kaltas sa sahod)"],
  "Over the counter": ["Paid at a branch", "Binayaran sa sangay"],
  Online: ["Paid online", "Binayaran online"],
};

export default function Equity() {
  const t = useT();
  const lang = useLang();
  const member = useCurrentMember();
  const equity = useEquity(member);
  const contributions = useContributions(member);
  const coverage = useCoverage(member);
  const load = useSimulatedLoad();
  const { hash } = useLocation();
  const [range, setRange] = useState<Range>("5y");
  const list = useShowMore(12);

  const rows = useMemo(() => [...contributions].reverse(), [contributions]);
  // Point counts are chosen so the chart's axis labels never collide on a phone or a
  // desktop: every two months for 1 and 5 years, year ends (plus the latest month) for All.
  const hist = useMemo(() => {
    const h = equity?.history ?? [];
    const everyTwo = (months: number) => h.slice(-(months + 1)).filter((_, i, arr) => (arr.length - 1 - i) % 2 === 0);
    if (range === "12m") return everyTwo(12);
    if (range === "5y") return everyTwo(60);
    return h.filter((x, i) => x.period.endsWith("-12") || i === h.length - 1);
  }, [equity, range]);

  // Links to #coverage land after the simulated load, so scroll once the list exists.
  useEffect(() => {
    if (load.ready && hash === "#coverage") document.getElementById("coverage")?.scrollIntoView({ block: "start" });
  }, [load.ready, hash]);

  if (!equity) return null;
  const last = equity.history[equity.history.length - 1];
  const credited = Math.round((equity.equityValue - equity.dividends) * 100) / 100;
  const whole = Math.floor(equity.equityValue);
  const cents = Math.round((equity.equityValue - whole) * 100).toString().padStart(2, "0");
  const shown = rows.slice(0, list.count);

  const download = () => {
    const fileName = `PSMBFI-statement-${member.id}-${last.period}.csv`;
    const lines: (string | number)[][] = [
      ["PS-ACCESS contribution statement (sample values)"],
      ["Member", memberName(member)],
      ["Member ID", member.id],
      ["Agency", `${AGENCY_BY_CODE[member.agency].name}, ${member.unit}`],
      ["Statement as of", monthYear(last.period, "en")],
      ["Equity Value (PHP)", equity.equityValue.toFixed(2)],
      ["Total contributions (PHP)", equity.totalContributions.toFixed(2)],
      ["Dividends credited (PHP)", equity.dividends.toFixed(2)],
      ["Months contributed", equity.months],
      [],
      ["Period", "Source", "Amount (PHP)", "Posted", "Reference"],
      ...rows.map((c) => [c.period, c.source, c.amount.toFixed(2), c.postedAt.slice(0, 10), c.reference]),
      [],
      ["Total", "", equity.totalContributions.toFixed(2), "", ""],
    ];
    downloadFile(fileName, toCsv(lines), "text/csv;charset=utf-8");
    toast.success(t("Statement downloaded", "Na-download ang statement"), { description: fileName });
  };

  return (
    <div>
      <PageHead
        title={t("Equity Value", "Equity Value")}
        helper={t(
          "Your own share in the fund under the MEP (Members Equity Plan). It grows from the 3% of base pay you contribute every month.",
          "Ang sarili mong bahagi sa pondo sa ilalim ng MEP (Members Equity Plan). Lumalaki ito mula sa 3% ng base pay na iniaambag mo buwan-buwan.",
        )}
        action={
          <Button size="lg" icon={<DownloadSimple size="1.25rem" weight="bold" />} onClick={download} disabled={!load.ready}>
            {t("Download statement", "I-download ang statement")}
          </Button>
        }
      />

      {load.error ? (
        <LoadError onRetry={load.retry} helpTopic="Equity Value and contributions" />
      ) : load.loading ? (
        <PageSkeleton shape="cards" />
      ) : (
        <div className="grid gap-5 xl:grid-cols-12">
          {/* The number, and how it is built */}
          <section aria-labelledby="eq-hero" className="rounded-xl bg-surface p-5 shadow-e1 sm:p-7 xl:col-span-7">
            <h2 id="eq-hero" className="flex items-center gap-2.5 text-[1rem] font-semibold text-ink-2">
              <Ribbon name="member" />
              {t(`As of the ${monthYear(last.period, lang)} posting`, `Hanggang sa posting ng ${monthYear(last.period, lang)}`)}
            </h2>
            <p className="mt-4 font-display text-[min(3.1rem,14vw)] font-extrabold leading-none tracking-[-0.03em] [font-stretch:84%] sm:text-[4rem]">
              <span className="sr-only">{peso(equity.equityValue)}</span>
              <span aria-hidden className="whitespace-nowrap">
                <span className="mr-1 align-[0.36em] text-[0.46em] text-ink-2">₱</span>
                <CountUp value={whole} />
                <span className="align-[0.52em] text-[0.4em] text-ink-2">.{cents}</span>
              </span>
            </p>
            <p className="mt-3 text-[1rem] text-ink-2">{t("These are sample figures for this prototype.", "Sample na halaga lang ang mga ito sa prototype.")}</p>

            <div className="mt-7">
              <p className="text-[1.0625rem] font-semibold text-ink">{t("How your Equity Value is built", "Paano nabuo ang iyong Equity Value")}</p>
              <p className="mt-1.5 max-w-lg text-[1rem] leading-relaxed text-ink-2">
                {t("In this sample, 60% of each contribution goes to your equity and earns a 4.5% dividend each year. The rest pays for your insurance cover.", "Sa sample na ito, 60% ng bawat kontribusyon ay napupunta sa iyong equity at kumikita ng 4.5% na dibidendo kada taon. Ang natitira ay pambayad sa iyong insurance cover.")}
              </p>
              <DeductionMeter
                className="mt-4"
                total={equity.equityValue}
                caption={t("Equity Value split into contributions credited and dividends earned", "Hati ng Equity Value: kontribusyon at dibidendo")}
                parts={[
                  { key: "credited", label: t("Contributions credited", "Kontribusyong naipasok"), value: credited, color: "var(--chart-1)" },
                  { key: "dividends", label: t("Dividends earned", "Dibidendong kinita"), value: equity.dividends, color: "var(--chart-2)" },
                ]}
              />
            </div>

            <dl className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-x-5 gap-y-6 rounded-lg bg-sunken p-4 sm:p-5">
              <Fact size="lg" label={t("Total contributions", "Kabuuang kontribusyon")} value={peso(equity.totalContributions)} hint={t(`since ${monthYear(member.joinedAt.slice(0, 7), lang)}`, `mula ${monthYear(member.joinedAt.slice(0, 7), lang)}`)} />
              <Fact size="lg" label={t("Dividends credited", "Dibidendong naipasok")} value={peso(equity.dividends)} hint={t("4.5% a year (sample)", "4.5% kada taon (sample)")} />
              <Fact size="lg" label={t("Months contributed", "Buwan ng kontribusyon")} value={equity.months} hint={member.missedMonths ? t(`${member.missedMonths} missed in the last year`, `${member.missedMonths} ang hindi nabayaran nitong taon`) : t("No missed months", "Walang palya")} />
              <Fact size="lg" label={t("Each month", "Kada buwan")} value={peso(equity.monthly)} hint={t(`3% of your ${peso(member.basePay, { whole: true })} base pay`, `3% ng iyong ${peso(member.basePay, { whole: true })} base pay`)} />
            </dl>
          </section>

          {/* What the membership protects */}
          <section id="coverage" aria-labelledby="coverage-title" className="order-last scroll-mt-24 xl:order-none xl:col-span-5">
            <div className="h-full rounded-xl bg-surface shadow-e1">
              <div className="px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
                <h2 id="coverage-title" className="font-display text-[1.4rem] font-bold leading-tight tracking-[-0.015em] [font-stretch:88%]">{t("What your membership covers", "Ano ang sakop ng iyong membership")}</h2>
                <p className="mt-1.5 text-[1rem] text-ink-2">{t(`${coverage.length} benefits while your contributions are up to date.`, `${coverage.length} benepisyo habang updated ang iyong kontribusyon.`)}</p>
              </div>
              <ul className="px-2 pb-2 sm:px-3">
                {coverage.map((c, i) => (
                  <li key={c.id} className={i ? "shadow-[inset_0_1px_0_var(--line)]" : ""}>
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-3 py-3.5">
                      <div className="min-w-0 flex-1 basis-[12rem]">
                        <p className="text-[1.0625rem] font-semibold leading-snug text-ink">{t(c.label, c.labelFil)}</p>
                        <p className="mt-0.5 text-[1rem] leading-snug text-ink-2">{coverageDetail(c.id, c.detail, lang)}</p>
                      </div>
                      <p className="shrink-0 pt-0.5 text-[1.0625rem] font-semibold text-ink tnum">{c.amount !== null ? peso(c.amount, { whole: true }) : t("Per schedule", "Ayon sa schedule")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Growth chart */}
          <section aria-labelledby="growth-title" className="rounded-xl bg-surface p-5 shadow-e1 sm:p-7 xl:col-span-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h2 id="growth-title" className="font-display text-[1.4rem] font-bold leading-tight tracking-[-0.015em] [font-stretch:88%]">{t("How has your Equity Value grown?", "Paano lumaki ang iyong Equity Value?")}</h2>
                <Legend
                  className="mt-3 text-[0.9375rem]"
                  items={[
                    { label: t("Equity Value", "Equity Value"), slot: "2", kind: "rect" },
                    { label: t("Total you contributed", "Kabuuang iniambag mo"), slot: "ref", kind: "line" },
                  ]}
                />
              </div>
              <BigSegmented
                value={range}
                onValueChange={setRange}
                ariaLabel={t("How far back to show", "Gaano katagal ang ipapakita")}
                options={[
                  { value: "12m", label: t("1 year", "1 taon") },
                  { value: "5y", label: t("5 years", "5 taon") },
                  { value: "all", label: t("All", "Lahat") },
                ]}
                className="w-full md:w-[20rem]"
              />
            </div>
            {/* The chart's screen-reader table cannot shrink at large text sizes; clip it. */}
            <div className="mt-5 overflow-hidden">
            <AreaChart
              height={260}
              labels={hist.map((h) => axisLabel(h.period, lang))}
              series={[
                { key: "equity", label: t("Equity Value", "Equity Value"), slot: "2", values: hist.map((h) => h.equity), area: true },
                { key: "contributed", label: t("Total contributed", "Kabuuang iniambag"), slot: "ref", values: hist.map((h) => h.contributed) },
              ]}
              format={(v) => peso(v)}
              caption={t("Equity Value and total contributed over time", "Equity Value at kabuuang iniambag sa paglipas ng panahon")}
            />
            </div>
            <p className="mt-3 text-[1rem] text-ink-2">{t("Touch or hover the chart to read the amounts. Every month is also listed below.", "Pindutin o i-hover ang chart para mabasa ang halaga. Nakalista rin sa ibaba ang bawat buwan.")}</p>
          </section>

          {/* Ledger */}
          <section aria-labelledby="contrib-title" className="xl:col-span-12">
            <SectionHead id="contrib-title" title={t("Contributions", "Mga kontribusyon")} count={rows.length} />
            {rows.length === 0 ? null : (
              <>
                <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-lg bg-surface shadow-e1 md:hidden">
                  {shown.map((c) => (
                    <li key={c.period} className="flex min-h-[3.75rem] items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[1.0625rem] font-semibold text-ink">{monthYear(c.period, lang)}</p>
                        <p className="text-[0.9375rem] text-ink-2">
                          {t(...SOURCE[c.source])} · {t(`posted ${date(c.postedAt)}`, `na-post ${date(c.postedAt)}`)}
                        </p>
                      </div>
                      <p className="shrink-0 text-[1.0625rem] font-semibold text-ink tnum">{peso(c.amount)}</p>
                    </li>
                  ))}
                </ul>
                <SimpleTable
                  className="hidden md:block"
                  caption={t("Your monthly contributions, newest first", "Ang iyong buwanang kontribusyon, pinakabago muna")}
                  rows={shown}
                  rowKey={(c) => c.period}
                  columns={[
                    { key: "period", header: t("Month", "Buwan"), cell: (c) => <span className="font-semibold">{monthYear(c.period, lang)}</span> },
                    { key: "source", header: t("Paid through", "Paraan ng bayad"), cell: (c) => t(...SOURCE[c.source]) },
                    { key: "posted", header: t("Posted", "Na-post"), cell: (c) => date(c.postedAt) },
                    { key: "ref", header: t("Reference", "Reference"), cell: (c) => <span className="tnum text-ink-2">{c.reference}</span>, wideOnly: true },
                    { key: "amount", header: t("Amount", "Halaga"), align: "right", cell: (c) => <span className="font-semibold">{peso(c.amount)}</span> },
                  ]}
                />
                <ShowMoreButton shown={shown.length} total={rows.length} step={12} onMore={list.more} noun={{ en: "months", fil: "buwan" }} />
              </>
            )}
          </section>
        </div>
      )}
      <HelpLink topic="Equity Value and contributions" className="mt-6" />
    </div>
  );
}
