/** Formatting helpers. Locale is en-PH; peso amounts always use tabular figures in the UI. */
const pesoFmt = new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pesoWhole = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 });
const numFmt = new Intl.NumberFormat("en-PH");

export function peso(n: number, opts: { whole?: boolean; sign?: boolean } = {}) {
  const abs = Math.abs(n);
  const body = opts.whole ? pesoWhole.format(abs) : pesoFmt.format(abs);
  const sign = n < 0 ? "−" : opts.sign && n > 0 ? "+" : "";
  return `${sign}₱${body}`;
}

/** ₱1.2M, ₱845K, ₱9,500 */
export function pesoCompact(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000_000) return `${sign}₱${trim(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}₱${trim(abs / 1_000_000)}M`;
  if (abs >= 10_000) return `${sign}₱${trim(abs / 1_000)}K`;
  return `${sign}₱${pesoWhole.format(abs)}`;
}
function trim(v: number) {
  return v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1).replace(/\.0$/, "") : v.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
}

export const num = (n: number) => numFmt.format(n);
export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;

const dShort = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" });
const dDay = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" });
const dTime = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" });
const dMonth = new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" });
const dMonthShort = new Intl.DateTimeFormat("en-PH", { month: "short", year: "2-digit" });

export const date = (iso: string | Date) => dShort.format(new Date(iso));
export const dayMonth = (iso: string | Date) => dDay.format(new Date(iso));
export const time = (iso: string | Date) => dTime.format(new Date(iso));
export const dateTime = (iso: string | Date) => `${dShort.format(new Date(iso))}, ${dTime.format(new Date(iso))}`;
/** "2026-11" → "November 2026" */
export const monthLabel = (period: string) => dMonth.format(new Date(`${period}-01T00:00:00`));
export const monthShort = (period: string) => dMonthShort.format(new Date(`${period}-01T00:00:00`));

/** The prototype's "today". Sample data is generated relative to this date. */
export const TODAY = new Date("2026-11-23T09:30:00+08:00");

export function relative(iso: string | Date, now: Date = TODAY) {
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return date(iso);
}

export function maskAccount(acct: string) {
  const digits = acct.replace(/\s/g, "");
  return `•••• ${digits.slice(-4)}`;
}

export function initials(name: string) {
  const parts = name.replace(/[^A-Za-zÑñ .-]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Standard amortization: monthly payment for principal p, annual rate r, n months. */
export function amortization(p: number, annualRate: number, n: number) {
  if (n <= 0) return 0;
  const i = annualRate / 12;
  if (i === 0) return p / n;
  return (p * i) / (1 - Math.pow(1 + i, -n));
}
