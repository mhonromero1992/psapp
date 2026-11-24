/* Ported from the web version (webapp/src/features/member/parts/text.ts). */
import type { Lang } from "@/lib/i18n";
import { TODAY, date } from "@/lib/format";
import type { AssistRequest, ClaimType, TimelineEvent } from "@/data/types";
import type { Tone } from "@/config/theme";

/* Bilingual helpers for the Member App. Reference data ships in English; the
   Filipino lines below keep every visible string translatable. */

export type TFn = (en: string, fil?: string) => string;

const MONTHS: Record<Lang, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  fil: ["Enero", "Pebrero", "Marso", "Abril", "Mayo", "Hunyo", "Hulyo", "Agosto", "Setyembre", "Oktubre", "Nobyembre", "Disyembre"],
};

/** "2026-12" plus n months. */
export function addMonths(period: string, n: number) {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Calendar month of an ISO timestamp in Philippine time. */
export function periodOf(iso: string) {
  const d = new Date(new Date(iso).getTime() + 8 * 3_600_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** "December 2026" / "Disyembre 2026" */
export function monthYear(period: string, lang: Lang) {
  const [y, m] = period.split("-").map(Number);
  return `${MONTHS[lang][m - 1]} ${y}`;
}

/** The prototype clock: never earlier than the sample data's "today". */
export const nowMs = () => Math.max(Date.now(), TODAY.getTime());

export function relTime(iso: string, lang: Lang) {
  const diff = (nowMs() - new Date(iso).getTime()) / 1000;
  const fil = lang === "fil";
  if (diff < 60) return fil ? "ngayon lang" : "just now";
  if (diff < 3600) return fil ? `${Math.floor(diff / 60)} min ang nakalipas` : `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return fil ? `${Math.floor(diff / 3600)} oras ang nakalipas` : `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) {
    const d = Math.floor(diff / 86400);
    return fil ? `${d} araw ang nakalipas` : `${d} ${d === 1 ? "day" : "days"} ago`;
  }
  return date(iso);
}

/* ── Timeline labels and notes ─────────────────────────────── */
const TIMELINE_FIL: Record<string, string> = {
  "Application submitted": "Naisumite ang application",
  "Credit evaluation started": "Sinimulan ang credit evaluation",
  "Approved by loans officer": "Inaprubahan ng loans officer",
  "Sent to treasury for release": "Ipinasa sa treasury para i-release",
  "Proceeds released": "Nai-release na ang pera",
  "Fully paid": "Bayad na nang buo",
  "Returned to member for correction": "Ibinalik sa iyo para itama",
  "Application declined": "Hindi naaprubahan ang application",
  "Claim filed": "Naisampa ang claim",
  "Documents under review": "Sinusuri ang mga dokumento",
  "Benefit evaluation": "Sinusuri ang benepisyo",
  "Benefit approved": "Naaprubahan ang benepisyo",
  "Queued for payout": "Nakapila para sa payout",
  "Paid to account": "Naipadala sa iyong account",
  "Returned for missing documents": "Ibinalik dahil may kulang na dokumento",
  "Claim denied": "Hindi naaprubahan ang claim",
};
const NOTE_FIL: Record<string, string> = {
  "Released by checker": "Ni-release ng checker",
  "Payout approved by checker": "Inaprubahan ng checker ang payout",
  "Please upload a clearer copy of your latest payslip.": "Paki-upload ang mas malinaw na kopya ng iyong pinakabagong payslip.",
  "Net take-home pay would fall below the agency minimum.": "Bababa sa minimum ng ahensya ang iyong net take-home pay.",
  "The medical abstract is unreadable. Please upload a new photo.": "Hindi mabasa ang medical abstract. Paki-upload ng bagong litrato.",
  "Confinement happened before the coverage start date.": "Nangyari ang confinement bago magsimula ang coverage.",
};

function noteFil(note: string) {
  if (NOTE_FIL[note]) return NOTE_FIL[note];
  const filed = note.match(/^Filed through the (.+)$/);
  if (filed) return `Isinumite sa ${filed[1]}`;
  const docs = note.match(/^(\d+) documents? attached in the Member App$/);
  if (docs) return `${docs[1]} dokumento ang inilakip sa Member App`;
  return note;
}

/**
 * Localised timeline. Sample events dated after "now" (a quirk of the generator)
 * are shown at the current time so the history never reads as the future.
 */
export function localTimeline(events: TimelineEvent[], lang: Lang): TimelineEvent[] {
  const now = nowMs();
  return events.map((e) => ({
    ...e,
    at: new Date(e.at).getTime() > now ? new Date(now).toISOString() : e.at,
    label: lang === "fil" ? TIMELINE_FIL[e.label] ?? e.label : e.label,
    note: e.note && lang === "fil" ? noteFil(e.note) : e.note,
  }));
}

/* ── Benefits ──────────────────────────────────────────────── */
export const BENEFIT_FIL: Record<ClaimType, { description: string; schedule: string }> = {
  AHB: { description: "Arawang cash para sa bawat araw na naka-confine ka sa ospital dahil sa aksidente.", schedule: "₱1,000 kada araw, hanggang 10 araw bawat confinement (sample)" },
  IHB: { description: "Arawang cash para sa bawat araw na naka-confine ka sa ospital dahil sa sakit.", schedule: "₱500 kada araw, hanggang 10 araw bawat confinement (sample)" },
  WIA: { description: "Cash benefit para sa pinsalang natamo habang nasa tungkulin.", schedule: "₱50,000 sa malubhang pinsala, ₱20,000 sa hindi malubha (sample)" },
  KIA: { description: "Benepisyong ibinibigay sa mga beneficiary kapag nasawi ang miyembro habang nasa tungkulin.", schedule: "Depende sa ranggo at sa iyong MEP (Members Equity Plan) coverage (sample)" },
  DEATH: { description: "Life insurance na ibinibigay sa mga beneficiary sa pagkamatay dahil sa anumang dahilan.", schedule: "Ayon sa MEP coverage (sample)" },
  DISABILITY: { description: "Benepisyo para sa permanenteng kapansanan dahil sa aksidente.", schedule: "Ayon sa MEP schedule of disablement (sample)" },
  DFI: { description: "Life cover para sa iyong itinalagang dependent habang maayos ang iyong MEP membership.", schedule: "₱50,000 (ayon sa membership form)" },
  MER: { description: "Refund para sa mga miyembro mula sa net income ng pondo noong nakaraang taon.", schedule: "Idinedeklara taun-taon ng Board (sample)" },
};

/** Display fixes for reference text that still mentions back-office screens or unexplained acronyms. */
export const BENEFIT_SCHEDULE_EN: Partial<Record<ClaimType, string>> = {
  KIA: "Depends on rank and your MEP (Members Equity Plan) coverage (sample)",
};

const DOC_FIL: Record<string, string> = {
  "Hospital certificate of confinement": "Certificate of confinement mula sa ospital",
  "Medical abstract": "Medical abstract",
  "Police or incident report": "Police o incident report",
  "Valid ID": "Valid ID",
  "Spot report": "Spot report",
  "Medical certificate": "Medical certificate",
  "Certification from unit commander": "Sertipikasyon mula sa unit commander",
  "Death certificate": "Death certificate",
  "Claimant's valid ID": "Valid ID ng claimant",
  "Proof of relationship": "Patunay ng relasyon",
  "Medical certificate of disability": "Medical certificate ng kapansanan",
  "Incident report": "Incident report",
  "Death certificate of dependent": "Death certificate ng dependent",
  "Member's valid ID": "Valid ID ng miyembro",
  "No documents needed when a payout account is on file": "Walang kailangang dokumento kung may payout account ka na",
};
/** Document names, including "page 2" suffixes added when a file has several photos. */
export function docName(name: string, lang: Lang) {
  if (lang !== "fil") return name;
  const page = name.match(/^(.*), page (\d+)$/);
  if (page) return `${DOC_FIL[page[1]] ?? page[1]}, pahina ${page[2]}`;
  return DOC_FIL[name] ?? name;
}


/* ── Coverage ──────────────────────────────────────────────── */
const COVERAGE_DETAIL_FIL: Record<string, string> = {
  life: "Pagkamatay sa anumang dahilan, ibibigay sa iyong mga beneficiary",
  kia: "Dagdag sa life insurance, para sa pagkasawi habang nasa tungkulin",
  add: "Ayon sa schedule of disablement",
  wia: "₱50,000 sa malubha, ₱20,000 sa hindi malubhang pinsala",
  ahb: "₱1,000 kada araw, hanggang 10 araw",
  ihb: "₱500 kada araw, hanggang 10 araw",
  dfi: "Para sa iyong itinalagang dependent",
};
export const coverageDetail = (id: string, detail: string, lang: Lang) => (lang === "fil" ? COVERAGE_DETAIL_FIL[id] ?? detail : detail);

/* ── Legal & Travel Assistance ─────────────────────────────── */
export const ASSIST_STATUS: Record<AssistRequest["status"], { en: string; fil: string; tone: Tone }> = {
  received: { en: "Received", fil: "Natanggap", tone: "info" },
  scheduled: { en: "Scheduled", fil: "Naka-schedule", tone: "ok" },
  in_progress: { en: "In progress", fil: "Inaasikaso", tone: "info" },
  closed: { en: "Closed", fil: "Sarado", tone: "neutral" },
};
const ASSIST_FIL: Record<string, string> = {
  "Travel assistance for a court hearing": "Travel assistance para sa court hearing",
  "Hearing in Tacloban City as a witness, 4 December.": "Hearing sa Tacloban City bilang saksi, 4 Disyembre.",
  "Flight booked, e-ticket will be sent 2 days before travel.": "Naka-book na ang flight. Ipapadala ang e-ticket 2 araw bago ang biyahe.",
  "The Legal & Travel Desk will call you within one working day.": "Tatawagan ka ng Legal & Travel Desk sa loob ng isang araw ng trabaho.",
  "Legal & Travel Desk": "Legal & Travel Desk",
};
export const assistText = (s: string, lang: Lang) => (lang === "fil" ? ASSIST_FIL[s] ?? s : s);
