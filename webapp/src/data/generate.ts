import { amortization, maskAccount, TODAY } from "@/lib/format";
import { chance, int, mulberry32, pad, pick, weighted, type Rng } from "@/lib/random";
import {
  AGENCY_WEIGHTS, BANKS, BENEFIT_BY_ID, EWALLETS, LOAN_PRODUCTS, LOAN_PRODUCT_BY_ID, MEP_RATE, OFFICES, RANKS,
} from "./reference";
import type {
  AgencyCode, AppNotification, AssistRequest, Beneficiary, Claim, ClaimStatus, ClaimType,
  Contribution, Loan, LoanProductId, LoanStatus, Member, Payout, PayoutAccount, TimelineEvent,
} from "./types";

/* SAMPLE DATA. Every name, amount and record below is generated for the prototype. */

const F_FIRST = ["Rowena", "Maricel", "Jocelyn", "Analyn", "Kristine", "Lovely", "Rachelle", "Grace", "Mary Joy", "Liza", "Angelica", "Camille", "Sheila", "Jennifer", "Rose Ann", "Divina", "Aileen", "Rhea", "Marites", "Cherry", "Princess", "Janine", "Elaine", "Carmela"];
const M_FIRST = ["Jerome", "Mark Anthony", "Rodel", "Arnel", "Jayson", "Ronaldo", "Michael", "Christian", "Joel", "Ramon", "Rommel", "Dennis", "Aldrin", "Edgardo", "Noel", "Reynaldo", "Paolo", "Jericho", "Ferdinand", "Benjie", "Rogelio", "Carlo", "Junel", "Ariel", "Eduardo", "Marvin"];
const LAST = ["Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza", "Torres", "Tomas", "Andrada", "Castillo", "Flores", "Villanueva", "Ramos", "Castro", "Rivera", "Aquino", "Navarro", "Salazar", "Mercado", "Dela Cruz", "De Leon", "Gonzales", "Lopez", "Pascual", "Domingo", "Aguilar", "Manalo", "Dizon", "Soriano", "Valdez", "Fernandez", "Agustin", "Gutierrez", "Panganiban", "Macaraeg", "Lacson", "Tolentino", "Velasco", "Sarmiento", "Fajardo", "Mallari", "Pineda", "Samonte", "Cabrera", "Abrenica", "Tan", "Dimaculangan", "Bernardo", "Espiritu", "Magbanua", "Alcantara", "Quiambao", "Llamas", "Ybañez", "Cabahug", "Gallardo", "Belmonte"];
const CITIES: Record<string, [string, string][]> = {
  HO: [["San Juan City", "Metro Manila"]],
  "RSO-NCR": [["Quezon City", "Metro Manila"], ["Manila", "Metro Manila"], ["Pasig City", "Metro Manila"], ["Caloocan City", "Metro Manila"], ["Taguig City", "Metro Manila"], ["Marikina City", "Metro Manila"]],
  "RSO-01": [["San Fernando", "La Union"], ["Vigan City", "Ilocos Sur"], ["Dagupan City", "Pangasinan"]],
  "RSO-CAR": [["Baguio City", "Benguet"], ["La Trinidad", "Benguet"]],
  "RSO-02": [["Tuguegarao City", "Cagayan"], ["Santiago City", "Isabela"]],
  "RSO-03": [["San Fernando", "Pampanga"], ["Angeles City", "Pampanga"], ["Malolos City", "Bulacan"], ["Olongapo City", "Zambales"]],
  "RSO-4A": [["Calamba City", "Laguna"], ["Antipolo City", "Rizal"], ["Dasmariñas City", "Cavite"], ["Batangas City", "Batangas"]],
  "RSO-05": [["Legazpi City", "Albay"], ["Naga City", "Camarines Sur"]],
  "RSO-06": [["Iloilo City", "Iloilo"], ["Bacolod City", "Negros Occidental"]],
  "RSO-07": [["Cebu City", "Cebu"], ["Mandaue City", "Cebu"], ["Lapu-Lapu City", "Cebu"], ["Tagbilaran City", "Bohol"]],
  "RSO-08": [["Tacloban City", "Leyte"], ["Ormoc City", "Leyte"]],
  "RSO-09": [["Zamboanga City", "Zamboanga del Sur"], ["Pagadian City", "Zamboanga del Sur"]],
  "RSO-10": [["Cagayan de Oro", "Misamis Oriental"], ["Iligan City", "Lanao del Norte"]],
  "RSO-11": [["Davao City", "Davao del Sur"], ["Tagum City", "Davao del Norte"]],
  "RSO-12": [["Koronadal City", "South Cotabato"], ["General Santos City", "South Cotabato"]],
  "RSO-13": [["Butuan City", "Agusan del Norte"], ["Surigao City", "Surigao del Norte"]],
};
const OFFICE_WEIGHTS: [string, number][] = [
  ["RSO-NCR", 0.3], ["RSO-03", 0.08], ["RSO-4A", 0.1], ["RSO-07", 0.08], ["RSO-11", 0.06], ["RSO-06", 0.05], ["RSO-01", 0.04],
  ["RSO-CAR", 0.03], ["RSO-02", 0.03], ["RSO-05", 0.04], ["RSO-08", 0.03], ["RSO-09", 0.03], ["RSO-10", 0.05], ["RSO-12", 0.04], ["RSO-13", 0.04],
];
export const STAFF = {
  makers: ["Jerome T. Villanueva", "Kristine A. Domingo", "Paolo R. Samonte", "Aileen C. Fajardo", "Noel B. Quiambao"],
  checkers: ["Ma. Theresa L. Gomez", "Edgardo S. Mallari", "Cherry V. Alcantara"],
  treasury: ["Rachelle M. Navarro", "Benjie O. Espiritu"],
  accounting: ["Divina P. Llamas", "Rommel G. Abrenica"],
};

export const CURRENT_PERIOD = "2026-11";

function iso(d: Date) {
  return d.toISOString();
}
function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * 86_400_000);
}
function addMonths(period: string, n: number) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1, 2)}`;
}
export function periodsBetween(fromIso: string, toPeriod = CURRENT_PERIOD) {
  const start = fromIso.slice(0, 7);
  const out: string[] = [];
  let p = start;
  while (p <= toPeriod && out.length < 600) {
    out.push(p);
    p = addMonths(p, 1);
  }
  return out;
}
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const daysAgo = (n: number, hour = 9, min = 0) => {
  const d = addDays(TODAY, -n);
  d.setHours(hour, min, 0, 0);
  return iso(d);
};

function fullName(m: Pick<Member, "firstName" | "middleInitial" | "lastName">) {
  return `${m.firstName} ${m.middleInitial}. ${m.lastName}`;
}
export const memberName = fullName;

function mobile(r: Rng) {
  return `09${int(r, 15, 99)} ${pad(int(r, 0, 999), 3)} ${pad(int(r, 0, 9999), 4)}`;
}
function emailFor(first: string, last: string, r: Rng) {
  const f = first.toLowerCase().split(" ")[0].replace(/[^a-z]/g, "");
  const l = last.toLowerCase().replace(/[^a-z]/g, "");
  return `${f}.${l}${int(r, 1, 99)}@mail.example`;
}

/* ── Members ─────────────────────────────────────────────── */
function makeBeneficiaries(r: Rng, last: string, sex: "F" | "M", birthYear: number, memberId: string): Beneficiary[] {
  const list: Beneficiary[] = [];
  const married = chance(r, 0.78);
  if (married) {
    list.push({ id: `${memberId}-B1`, name: `${pick(r, sex === "F" ? M_FIRST : F_FIRST)} ${String.fromCharCode(65 + int(r, 0, 25))}. ${last}`, relation: "Spouse", birthDate: `${birthYear + int(r, -3, 3)}-${pad(int(r, 1, 12), 2)}-${pad(int(r, 1, 28), 2)}`, share: 50, dependentCover: true });
  }
  const kids = married ? int(r, 0, 3) : 0;
  for (let k = 0; k < kids; k++) {
    list.push({ id: `${memberId}-B${k + 2}`, name: `${pick(r, chance(r, 0.5) ? M_FIRST : F_FIRST)} ${last}`, relation: "Child", birthDate: `${birthYear + int(r, 24, 34)}-${pad(int(r, 1, 12), 2)}-${pad(int(r, 1, 28), 2)}`, share: 0, dependentCover: false });
  }
  if (list.length === 0) {
    list.push({ id: `${memberId}-B1`, name: `${pick(r, F_FIRST)} ${String.fromCharCode(65 + int(r, 0, 25))}. ${last}`, relation: "Parent", birthDate: `${birthYear - int(r, 22, 32)}-${pad(int(r, 1, 12), 2)}-${pad(int(r, 1, 28), 2)}`, share: 100, dependentCover: true });
  } else {
    const rest = 100 - list[0].share;
    const kidsList = list.slice(1);
    if (kidsList.length === 0) list[0].share = 100;
    else kidsList.forEach((b, i) => (b.share = i === kidsList.length - 1 ? rest - Math.floor(rest / kidsList.length) * (kidsList.length - 1) : Math.floor(rest / kidsList.length)));
  }
  return list;
}

function makeAccounts(r: Rng, name: string, memberId: string): PayoutAccount[] {
  const bank = pick(r, BANKS);
  const accts: PayoutAccount[] = [
    { id: `${memberId}-A1`, kind: "bank", provider: bank, accountName: name, accountNo: `${pad(int(r, 1000, 9999), 4)} ${pad(int(r, 1000, 9999), 4)} ${pad(int(r, 10, 99), 2)}`, primary: true, verified: true },
  ];
  if (chance(r, 0.6)) {
    accts.push({ id: `${memberId}-A2`, kind: "ewallet", provider: pick(r, EWALLETS), accountName: name, accountNo: `09${int(r, 15, 99)} ${pad(int(r, 0, 999), 3)} ${pad(int(r, 0, 9999), 4)}`, primary: false, verified: chance(r, 0.9) });
  }
  return accts;
}

export function generateMembers(count = 40): Member[] {
  const r = mulberry32(19970911);
  const members: Member[] = [];
  const seqByYear: Record<number, number> = {};

  // The demo member is fixed so every screen tells the same story.
  const demo: Member = {
    id: "PSM-2012-004512",
    firstName: "Rowena",
    middleInitial: "D",
    lastName: "Bautista",
    sex: "F",
    birthDate: "1986-04-17",
    rank: "PMSg",
    category: "uniformed",
    agency: "PNP",
    unit: "Quezon City Police District",
    officeId: "RSO-NCR",
    joinedAt: "2012-06-01",
    status: "active",
    basePay: 38_824,
    mobile: "0917 482 1196",
    email: "rowena.bautista@mail.example",
    city: "Quezon City",
    province: "Metro Manila",
    beneficiaries: [
      { id: "B-1", name: "Ramon C. Bautista", relation: "Spouse", birthDate: "1984-09-02", share: 50, dependentCover: true },
      { id: "B-2", name: "Andrea Bautista", relation: "Child", birthDate: "2011-01-23", share: 25, dependentCover: false },
      { id: "B-3", name: "Miguel Bautista", relation: "Child", birthDate: "2015-07-08", share: 25, dependentCover: false },
    ],
    payoutAccounts: [
      { id: "ACC-1", kind: "bank", provider: "LANDBANK", accountName: "Rowena D. Bautista", accountNo: "3456 1209 87", primary: true, verified: true },
      { id: "ACC-2", kind: "ewallet", provider: "GCash", accountName: "Rowena D. Bautista", accountNo: "0917 482 1196", primary: false, verified: true },
    ],
    atdOnFile: true,
    kycVerified: true,
    dpaConsentAt: "2026-10-02T10:14:00+08:00",
    missedMonths: 0,
  };
  members.push(demo);
  seqByYear[2012] = 4512;

  for (let i = 1; i < count; i++) {
    const agency = weighted(r, AGENCY_WEIGHTS) as AgencyCode;
    const def = RANKS[agency];
    const civilian = def.ranks.length === 0 || chance(r, 0.12);
    const [rank, pay] = civilian ? pick(r, def.civilian) : pick(r, def.ranks);
    const sex: "F" | "M" = chance(r, agency === "PNP" || agency === "BFP" ? 0.24 : 0.38) ? "F" : "M";
    const first = pick(r, sex === "F" ? F_FIRST : M_FIRST);
    const last = pick(r, LAST);
    const mi = String.fromCharCode(65 + int(r, 0, 25));
    const joinYear = weighted(r, [[2001, 1], [2004, 1.5], [2008, 2], [2011, 2.5], [2014, 3], [2017, 3.2], [2019, 3], [2021, 2.6], [2023, 2.2], [2025, 1.6], [2026, 0.6]] as [number, number][]) + int(r, 0, 2);
    const y = Math.min(joinYear, 2026);
    seqByYear[y] = (seqByYear[y] ?? int(r, 120, 900)) + int(r, 1, 9);
    const id = `PSM-${y}-${pad(seqByYear[y], 6)}`;
    const officeId = weighted(r, OFFICE_WEIGHTS);
    const [city, province] = pick(r, CITIES[officeId]);
    const birthYear = Math.max(1964, y - int(r, 21, 34));
    const status = weighted(r, [["active", 0.9], ["lapsed", 0.05], ["retired", 0.03], ["pending", 0.02]] as const);
    const name = `${first} ${mi}. ${last}`;
    members.push({
      id,
      firstName: first,
      middleInitial: mi,
      lastName: last,
      sex,
      birthDate: `${birthYear}-${pad(int(r, 1, 12), 2)}-${pad(int(r, 1, 28), 2)}`,
      rank,
      category: civilian ? "civilian" : "uniformed",
      agency,
      unit: pick(r, def.units),
      officeId,
      joinedAt: `${y}-${pad(y === 2026 ? int(r, 1, 10) : int(r, 1, 12), 2)}-01`,
      status,
      basePay: Math.round(pay * (1 + int(r, 0, 6) / 100)),
      mobile: mobile(r),
      email: emailFor(first, last, r),
      city,
      province,
      beneficiaries: makeBeneficiaries(r, last, sex, birthYear, id),
      payoutAccounts: makeAccounts(r, name, id),
      atdOnFile: status !== "pending" && chance(r, 0.97),
      kycVerified: status !== "pending" || chance(r, 0.4),
      dpaConsentAt: chance(r, 0.55) ? daysAgo(int(r, 5, 50), int(r, 8, 20), int(r, 0, 59)) : null,
      missedMonths: status === "lapsed" ? int(r, 3, 8) : chance(r, 0.06) ? int(r, 1, 2) : 0,
    });
  }
  return members;
}

/* ── Contributions, Equity Value, coverage ───────────────── */
/** Base pay in an earlier year, assuming step increases of about 4% a year (sample). */
function payAt(member: Member, period: string) {
  const yearsBack = Math.max(0, 2026 - Number(period.slice(0, 4)));
  return member.basePay / Math.pow(1.04, yearsBack);
}

export function contributionsFor(member: Member): Contribution[] {
  const r = mulberry32(hash(member.id));
  const periods = periodsBetween(member.joinedAt);
  const lastMonthsMissed = new Set<string>();
  for (let k = 0; k < member.missedMonths; k++) lastMonthsMissed.add(addMonths(CURRENT_PERIOD, -1 - k * (member.status === "lapsed" ? 1 : int(r, 2, 5))));
  return periods
    .filter((p) => p < CURRENT_PERIOD || r() < 0) // November posts after the agency remits in December
    .filter((p) => !lastMonthsMissed.has(p))
    .map((p) => {
      const amount = Math.round(payAt(member, p) * MEP_RATE * 100) / 100;
      const posted = new Date(`${addMonths(p, 1)}-${pad(int(r, 8, 16), 2)}T10:00:00+08:00`);
      return { period: p, amount, postedAt: iso(posted), source: chance(r, 0.96) ? "ATD" : "Over the counter", reference: `RM-${addMonths(p, 0).replace("-", "")}-${member.agency}` } as Contribution;
    });
}

export interface EquitySummary {
  equityValue: number;
  totalContributions: number;
  dividends: number;
  months: number;
  monthly: number;
  history: { period: string; equity: number; contributed: number }[];
}

/**
 * Sample Equity Value model: 60% of each contribution is credited to the member's
 * equity and earns a 4.5% yearly dividend, compounded monthly. Real MEP actuarial
 * rules replace this in the build.
 */
export function equityFor(member: Member): EquitySummary {
  const contribs = contributionsFor(member);
  let equity = 0;
  let total = 0;
  const monthlyRate = 0.045 / 12;
  const history: EquitySummary["history"] = [];
  for (const c of contribs) {
    equity = equity * (1 + monthlyRate) + c.amount * 0.6;
    total += c.amount;
    history.push({ period: c.period, equity: Math.round(equity * 100) / 100, contributed: Math.round(total * 100) / 100 });
  }
  const credited = contribs.reduce((s, c) => s + c.amount * 0.6, 0);
  return {
    equityValue: Math.round(equity * 100) / 100,
    totalContributions: Math.round(total * 100) / 100,
    dividends: Math.round((equity - credited) * 100) / 100,
    months: contribs.length,
    monthly: Math.round(member.basePay * MEP_RATE * 100) / 100,
    history,
  };
}

export interface CoverageLine {
  id: string;
  label: string;
  labelFil: string;
  amount: number | null;
  detail: string;
}

/** Sample coverage schedule. AHB, WIA and DFI amounts follow PSMBFI's published briefings. */
export function coverageFor(member: Member): CoverageLine[] {
  const tier = member.basePay * 12;
  return [
    { id: "life", label: "Life insurance", labelFil: "Life insurance", amount: Math.round((tier * 1.5) / 1000) * 1000, detail: "Death from any cause, paid to your beneficiaries" },
    { id: "kia", label: "Killed in action", labelFil: "Nasawi sa tungkulin", amount: Math.round((tier * 3) / 1000) * 1000, detail: "On top of life insurance, line-of-duty deaths" },
    { id: "add", label: "Accidental death and disablement", labelFil: "Aksidenteng pagkamatay at kapansanan", amount: Math.round((tier * 1) / 1000) * 1000, detail: "Per the schedule of disablement" },
    { id: "wia", label: "Wounded in action", labelFil: "Nasugatan sa tungkulin", amount: 50_000, detail: "₱50,000 major, ₱20,000 minor injury" },
    { id: "ahb", label: "Accident hospitalization", labelFil: "Pagka-ospital dahil sa aksidente", amount: 10_000, detail: "₱1,000 a day, up to 10 days" },
    { id: "ihb", label: "Illness hospitalization", labelFil: "Pagka-ospital dahil sa sakit", amount: 5_000, detail: "₱500 a day, up to 10 days" },
    { id: "dfi", label: "Dependent's free insurance", labelFil: "Libreng insurance ng dependent", amount: 50_000, detail: "For your designated dependent" },
  ];
}

/* ── Loans ──────────────────────────────────────────────── */
const LOAN_FLOW: LoanStatus[] = ["submitted", "evaluation", "approved", "for_release", "released"];
const LOAN_LABEL: Record<LoanStatus, string> = {
  submitted: "Application submitted",
  evaluation: "Credit evaluation started",
  approved: "Approved by loans officer",
  for_release: "Sent to treasury for release",
  released: "Proceeds released",
  paid: "Fully paid",
  returned: "Returned to member for correction",
  rejected: "Application declined",
};
export const loanStatusLabel = (s: LoanStatus) => LOAN_LABEL[s];

const notAfterToday = (d: Date) => (d.getTime() > TODAY.getTime() - 3_600_000 ? new Date(TODAY.getTime() - 3_600_000) : d);

function loanTimeline(appliedAt: string, status: LoanStatus, r: Rng, maker: string, checker: string): TimelineEvent[] {
  const t: TimelineEvent[] = [];
  let at = new Date(appliedAt);
  const reach = status === "paid" ? 4 : status === "returned" || status === "rejected" ? 1 : LOAN_FLOW.indexOf(status);
  for (let i = 0; i <= reach; i++) {
    const s = LOAN_FLOW[i];
    t.push({ at: iso(notAfterToday(at)), label: LOAN_LABEL[s], by: i === 0 ? undefined : i === 3 || i === 4 ? checker : maker });
    at = addDays(at, int(r, 0, 2) + (i === 0 ? 0 : 1));
    at.setHours(int(r, 9, 16), int(r, 0, 59));
  }
  if (status === "returned") t.push({ at: iso(notAfterToday(at)), label: LOAN_LABEL.returned, by: maker, note: "Please upload a clearer copy of your latest payslip." });
  if (status === "rejected") t.push({ at: iso(notAfterToday(at)), label: LOAN_LABEL.rejected, by: checker, note: "Net take-home pay would fall below the agency minimum." });
  if (status === "paid") t.push({ at: iso(notAfterToday(addDays(at, 30 * 12))), label: LOAN_LABEL.paid });
  return t;
}

export function generateLoans(members: Member[]): Loan[] {
  const r = mulberry32(6060);
  const loans: Loan[] = [];
  let seq = 1830;
  const mk = (m: Member, productId: LoanProductId, status: LoanStatus, appliedDaysAgo: number, overrides: Partial<Loan> = {}) => {
    const p = LOAN_PRODUCT_BY_ID[productId];
    const eq = productId === "POL" ? equityFor(m).equityValue * 0.9 : 0;
    const max = p.maxAmount ?? Math.max(p.minAmount, eq);
    const principal = Math.max(p.minAmount, Math.round((max * (0.25 + r() * 0.65)) / 1000) * 1000);
    const termMonths = pick(r, p.terms);
    const monthly = Math.round(amortization(principal, p.rate, termMonths) * 100) / 100;
    const appliedAt = daysAgo(appliedDaysAgo, int(r, 7, 21), int(r, 0, 59));
    const maker = pick(r, STAFF.makers);
    const checker = pick(r, STAFF.checkers);
    const released = status === "released" || status === "paid";
    const paidInstallments = status === "paid" ? termMonths : released ? Math.min(termMonths - 1, Math.floor(appliedDaysAgo / 30)) : 0;
    const acct = m.payoutAccounts.find((a) => a.primary) ?? m.payoutAccounts[0];
    const remaining = termMonths - paidInstallments;
    const i = p.rate / 12;
    const balance = status === "paid" ? 0 : released ? Math.round(((monthly * (1 - Math.pow(1 + i, -remaining))) / i) * 100) / 100 : principal;
    const loan: Loan = {
      id: `LN-${2026 - (appliedDaysAgo > 330 ? 1 : 0)}-${pad(seq++, 6)}`,
      memberId: m.id,
      productId,
      principal,
      rate: p.rate,
      termMonths,
      monthly,
      purpose: pick(r, ["Tuition for second semester", "House repairs after the typhoon", "Hospital bills", "Capital for a sari-sari store", "Motorcycle for duty commute", "Consolidating credit card debt", "Family emergency", "Appliance purchase"]),
      appliedAt,
      status,
      channel: weighted(r, [["Member App", 0.55], ["Member portal", 0.15], ["RSO counter", 0.3]] as const),
      officeId: m.officeId,
      payoutAccountId: acct?.id ?? null,
      payoutLabel: acct ? `${acct.provider} ${maskAccount(acct.accountNo)}` : "Cheque at RSO",
      releasedAt: released ? iso(addDays(new Date(appliedAt), p.processingDays + 1)) : null,
      paidInstallments,
      balance,
      timeline: loanTimeline(appliedAt, status, r, maker, checker),
      makerName: LOAN_FLOW.indexOf(status) >= 2 || released ? maker : null,
      checkerName: LOAN_FLOW.indexOf(status) >= 3 || released ? checker : null,
      risk: weighted(r, [["low", 0.7], ["medium", 0.24], ["high", 0.06]] as const),
      ...overrides,
    };
    // The release date is the day the history says the money was released (the payout uses it too).
    const releasedEvent = loan.releasedAt ? loan.timeline.find((e) => e.label === LOAN_LABEL.released) : undefined;
    if (releasedEvent) loan.releasedAt = releasedEvent.at;
    if (loan.status === "paid") {
      loan.paidInstallments = loan.termMonths;
      loan.balance = 0;
    } else if (loan.paidInstallments > loan.termMonths) {
      loan.paidInstallments = loan.termMonths - 1;
    }
    loans.push(loan);
    return loan;
  };

  // Demo member story: an active Salary Loan Plus and a fully paid Emergency Loan.
  const demo = members[0];
  mk(demo, "SLP", "released", 214, { principal: 180_000, termMonths: 36, monthly: Math.round(amortization(180_000, 0.1, 36) * 100) / 100, purpose: "Tuition and a laptop for Andrea" });
  const slp = loans[loans.length - 1];
  slp.paidInstallments = 7;
  slp.balance = Math.round(((slp.monthly * (1 - Math.pow(1 + 0.1 / 12, -(36 - 7)))) / (0.1 / 12)) * 100) / 100;
  mk(demo, "EML", "paid", 820, { principal: 40_000, termMonths: 24, monthly: Math.round(amortization(40_000, 0.12, 24) * 100) / 100, purpose: "Hospital bills" });

  for (let i = 1; i < members.length; i++) {
    const m = members[i];
    if (m.status !== "active" || !chance(r, 0.36)) continue;
    const productId = weighted(r, [["SLP", 0.34], ["KAB", 0.18], ["EML", 0.16], ["MPL", 0.14], ["POL", 0.12], ["CAL", 0.06]] as const);
    const status = weighted(r, [["released", 0.62], ["paid", 0.12], ["submitted", 0.06], ["evaluation", 0.07], ["approved", 0.04], ["for_release", 0.05], ["returned", 0.02], ["rejected", 0.02]] as const);
    const ago = status === "released" ? int(r, 20, 700) : status === "paid" ? int(r, 400, 1100) : int(r, 0, 9);
    mk(m, productId, status, ago);
  }
  return loans.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}

/* ── Claims ─────────────────────────────────────────────── */
const CLAIM_FLOW: ClaimStatus[] = ["submitted", "docs_review", "evaluation", "approved", "for_payout", "paid"];
const CLAIM_LABEL: Record<ClaimStatus, string> = {
  submitted: "Claim filed",
  docs_review: "Documents under review",
  evaluation: "Benefit evaluation",
  approved: "Benefit approved",
  for_payout: "Queued for payout",
  paid: "Paid to account",
  returned: "Returned for missing documents",
  denied: "Claim denied",
};
export const claimStatusLabel = (s: ClaimStatus) => CLAIM_LABEL[s];

function claimAmount(type: ClaimType, m: Member, r: Rng) {
  switch (type) {
    case "AHB": return 1000 * int(r, 2, 10);
    case "IHB": return 500 * int(r, 2, 10);
    case "WIA": return chance(r, 0.35) ? 50_000 : 20_000;
    case "KIA": return Math.round((m.basePay * 12 * 4.5) / 1000) * 1000;
    case "DEATH": return Math.round((m.basePay * 12 * 1.5) / 1000) * 1000;
    case "DISABILITY": return Math.round((m.basePay * 12 * 0.5) / 1000) * 1000;
    case "DFI": return 50_000;
    case "MER": return Math.round(m.basePay * 0.08);
  }
}

function claimTimeline(filedAt: string, status: ClaimStatus, r: Rng, assignee: string, checker: string): TimelineEvent[] {
  const t: TimelineEvent[] = [];
  let at = new Date(filedAt);
  const reach = status === "returned" ? 1 : status === "denied" ? 2 : CLAIM_FLOW.indexOf(status);
  for (let i = 0; i <= reach; i++) {
    t.push({ at: iso(notAfterToday(at)), label: CLAIM_LABEL[CLAIM_FLOW[i]], by: i === 0 ? undefined : i >= 3 ? checker : assignee });
    at = addDays(at, int(r, 1, 3));
    at.setHours(int(r, 9, 16), int(r, 0, 59));
  }
  if (status === "returned") t.push({ at: iso(notAfterToday(at)), label: CLAIM_LABEL.returned, by: assignee, note: "The medical abstract is unreadable. Please upload a new photo." });
  if (status === "denied") t.push({ at: iso(notAfterToday(at)), label: CLAIM_LABEL.denied, by: checker, note: "Confinement happened before the coverage start date." });
  return t;
}

const HOSPITALS = ["East Avenue Medical Center", "Philippine General Hospital", "PNP General Hospital", "Vicente Sotto Memorial Medical Center", "Southern Philippines Medical Center", "Jose B. Lingad Memorial Hospital", "Western Visayas Medical Center", "Quirino Memorial Medical Center"];

export function generateClaims(members: Member[]): Claim[] {
  const r = mulberry32(7777);
  const claims: Claim[] = [];
  let seq = 640;
  const mk = (m: Member, type: ClaimType, status: ClaimStatus, filedDaysAgo: number, overrides: Partial<Claim> = {}) => {
    const b = BENEFIT_BY_ID[type];
    const filedAt = daysAgo(filedDaysAgo, int(r, 7, 21), int(r, 0, 59));
    const assignee = pick(r, STAFF.makers);
    const checker = pick(r, STAFF.checkers);
    const claimAmt = claimAmount(type, m, r);
    const beneficiary = m.beneficiaries[0];
    const byBeneficiary = b.filer === "beneficiary";
    const days = type === "AHB" || type === "IHB" ? Math.round(claimAmt / (type === "AHB" ? 1000 : 500)) : undefined;
    const acct = m.payoutAccounts.find((a) => a.primary) ?? m.payoutAccounts[0];
    const docs = b.documents.filter((d) => !d.startsWith("No documents")).map((d, i) => ({
      id: `D${i + 1}`,
      name: d,
      kind: d.includes("ID") ? "ID" : "Document",
      status: (status === "returned" && i === 1 ? "reupload" : CLAIM_FLOW.indexOf(status) >= 2 || status === "denied" ? "verified" : "received") as "received" | "verified" | "reupload",
    }));
    const c: Claim = {
      id: `CL-2026-${pad(seq++, 6)}`,
      memberId: m.id,
      type,
      claimantName: byBeneficiary && beneficiary ? beneficiary.name : fullName(m),
      claimantRelation: byBeneficiary && beneficiary ? (beneficiary.relation as Claim["claimantRelation"]) : "Member",
      incidentDate: daysAgo(filedDaysAgo + int(r, 3, 25)).slice(0, 10),
      filedAt,
      amountClaimed: claimAmt,
      amountApproved: CLAIM_FLOW.indexOf(status) >= 3 ? claimAmt : null,
      status,
      documents: docs,
      timeline: claimTimeline(filedAt, status, r, assignee, checker),
      description: type === "AHB" ? "Motorcycle accident while responding to a call." : type === "IHB" ? "Confined for dengue fever." : type === "WIA" ? "Injured during a buy-bust operation." : type === "MER" ? "Experience refund for 2025." : "Filed by the beneficiary through the Member App.",
      confinementDays: days,
      hospital: days ? pick(r, HOSPITALS) : undefined,
      assignee,
      payoutLabel: acct ? `${acct.provider} ${maskAccount(acct.accountNo)}` : "Cheque at RSO",
      officeId: m.officeId,
      ...overrides,
    };
    claims.push(c);
    return c;
  };

  const demo = members[0];
  mk(demo, "IHB", "evaluation", 4, { description: "Confined for dengue fever, 4 days.", confinementDays: 4, amountClaimed: 2_000, hospital: "Quirino Memorial Medical Center" });
  mk(demo, "AHB", "paid", 160, { description: "Sprained ankle and wrist from a fall during a foot patrol.", confinementDays: 3, amountClaimed: 3_000, amountApproved: 3_000, hospital: "East Avenue Medical Center" });

  for (let i = 1; i < members.length; i++) {
    const m = members[i];
    if (!chance(r, 0.11)) continue;
    const type = weighted(r, [["AHB", 0.3], ["IHB", 0.32], ["WIA", 0.08], ["DEATH", 0.05], ["KIA", 0.02], ["DISABILITY", 0.04], ["DFI", 0.05], ["MER", 0.14]] as const);
    const status = weighted(r, [["paid", 0.48], ["submitted", 0.08], ["docs_review", 0.12], ["evaluation", 0.12], ["approved", 0.05], ["for_payout", 0.07], ["returned", 0.05], ["denied", 0.03]] as const);
    const ago = status === "paid" ? int(r, 15, 330) : int(r, 0, 14);
    mk(m, type, status, ago);
  }
  return claims.sort((a, b) => b.filedAt.localeCompare(a.filedAt));
}

/* ── Payouts ─────────────────────────────────────────────── */
export function generatePayouts(members: Member[], loans: Loan[], claims: Claim[]): Payout[] {
  const r = mulberry32(4242);
  const byId = new Map(members.map((m) => [m.id, m]));
  const out: Payout[] = [];
  let seq = 9120;
  const push = (m: Member, kind: Payout["kind"], refId: string, amount: number, status: Payout["status"], createdAt: string) => {
    const acct = m.payoutAccounts.find((a) => a.primary) ?? m.payoutAccounts[0];
    out.push({
      id: `PO-2026-${pad(seq++, 6)}`,
      memberId: m.id,
      memberName: fullName(m),
      kind,
      refId,
      amount,
      provider: acct?.provider ?? "LANDBANK",
      channel: acct?.kind ?? "bank",
      account: acct ? acct.accountNo : "",
      status,
      batchId: status === "queued" ? null : `PB-${createdAt.slice(0, 10).replace(/-/g, "")}-${acct?.kind === "ewallet" ? "EW" : "BK"}`,
      createdAt,
      settledAt: status === "settled" ? iso(addDays(new Date(createdAt), 1)) : null,
      reference: status === "settled" || status === "sent" ? `TRX${int(r, 10000000, 99999999)}` : null,
    });
  };
  for (const l of loans) {
    const m = byId.get(l.memberId);
    if (!m) continue;
    if (l.status === "released" || l.status === "paid") push(m, "Loan proceeds", l.id, l.principal, "settled", l.releasedAt ?? l.appliedAt);
    if (l.status === "for_release") push(m, "Loan proceeds", l.id, l.principal, "for_approval", daysAgo(int(r, 0, 1), int(r, 9, 16)));
  }
  for (const c of claims) {
    const m = byId.get(c.memberId);
    if (!m) continue;
    const amt = c.amountApproved ?? c.amountClaimed;
    if (c.status === "paid") push(m, c.type === "MER" ? "Experience refund" : "Claim benefit", c.id, amt, "settled", c.timeline[c.timeline.length - 1]?.at ?? c.filedAt);
    if (c.status === "for_payout") push(m, "Claim benefit", c.id, amt, "queued", daysAgo(int(r, 0, 2), int(r, 9, 16)));
  }
  // A failed transfer makes the exceptions view real.
  const failed = out.find((p) => p.status === "settled" && p.channel === "ewallet");
  if (failed) {
    failed.status = "failed";
    failed.settledAt = null;
    failed.reference = null;
    failed.createdAt = daysAgo(1, 14, 20);
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ── Notifications ───────────────────────────────────────── */
export function generateNotifications(): AppNotification[] {
  return [
    { id: "N-1", audience: "member", targetId: "PSM-2012-004512", title: "Your IHB claim is in evaluation", titleFil: "Sinusuri na ang iyong IHB claim", body: "CL-2026-000640 · We verified your documents. Expect a decision in 2 to 3 working days.", bodyFil: "CL-2026-000640 · Na-verify na ang iyong mga dokumento. Asahan ang desisyon sa loob ng 2 hanggang 3 araw.", at: daysAgo(1, 15, 12), read: false, link: "/member/claims", tone: "info" },
    { id: "N-2", audience: "member", targetId: "PSM-2012-004512", title: "October contribution posted", titleFil: "Naipasok na ang kontribusyon para sa Oktubre", body: "₱1,164.72 from PNP payroll (ATD). Your Equity Value is updated.", bodyFil: "₱1,164.72 mula sa PNP payroll (ATD). Na-update na ang iyong Equity Value.", at: daysAgo(9, 10, 3), read: false, link: "/member/equity", tone: "positive" },
    { id: "N-3", audience: "member", targetId: "PSM-2012-004512", title: "Salary Loan Plus: payment 7 of 36 received", titleFil: "Salary Loan Plus: natanggap ang bayad 7 sa 36", body: "Deducted through ATD. Next deduction on your December payroll.", bodyFil: "Ibinawas sa ATD. Ang susunod ay sa sahod ng Disyembre.", at: daysAgo(12, 9, 0), read: true, link: "/member/loans", tone: "info" },
    { id: "N-4", audience: "member", targetId: "PSM-2012-004512", title: "Legal & Travel Assistance is now in PS-ACCESS", titleFil: "Nasa PS-ACCESS na ang Legal & Travel Assistance", body: "Request legal help or travel assistance with the same login.", bodyFil: "Humingi ng legal o travel assistance gamit ang parehong login.", at: daysAgo(30, 8, 0), read: true, link: "/member/assist", tone: "info" },
  ];
}

export function generateAssist(): AssistRequest[] {
  return [
    { id: "LT-2026-00381", memberId: "PSM-2012-004512", kind: "travel", topic: "Travel assistance for a court hearing", details: "Hearing in Tacloban City as a witness, 4 December.", preferredDate: "2026-12-03", status: "scheduled", createdAt: daysAgo(6, 13, 30), handler: "Legal & Travel Desk", nextStep: "Flight booked, e-ticket will be sent 2 days before travel." },
  ];
}

export function generateAll() {
  const members = generateMembers();
  const loans = generateLoans(members);
  const claims = generateClaims(members);
  const payouts = generatePayouts(members, loans, claims);
  const notifications = generateNotifications();
  const assist = generateAssist();
  return { members, loans, claims, payouts, notifications, assist };
}

export { LOAN_PRODUCTS, OFFICES };
