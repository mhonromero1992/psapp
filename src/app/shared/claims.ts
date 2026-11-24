/* Ported from the web version (webapp/src/features/member/parts/claims.ts). */
import type { IconName } from "@/components/ui/Icon";
import { peso } from "@/lib/format";
import type { CoverageLine } from "@/data/generate";
import type { Claim, ClaimStatus, ClaimType, Member } from "@/data/types";
import type { TFn } from "./text";

export const BENEFIT_ICON: Record<ClaimType, IconName> = {
  AHB: "hospital",
  IHB: "thermometer",
  WIA: "bandage",
  KIA: "medal",
  DEATH: "heart",
  DISABILITY: "wheelchair",
  DFI: "users",
  MER: "coins",
};

export const OPEN_CLAIM: ClaimStatus[] = ["submitted", "docs_review", "evaluation", "approved", "for_payout", "returned"];

export const CLAIM_STAGES = [
  { key: "filed", en: "Filed", fil: "Naisampa", event: "Claim filed", nextEn: "Filing", nextFil: "Pag-file" },
  { key: "docs", en: "Documents", fil: "Dokumento", event: "Documents under review", nextEn: "Document check", nextFil: "Pagsusuri ng dokumento" },
  { key: "eval", en: "Evaluation", fil: "Pagsusuri", event: "Benefit evaluation", nextEn: "Evaluation", nextFil: "Pagsusuri" },
  { key: "approved", en: "Approved", fil: "Aprubado", event: "Benefit approved", nextEn: "Approval", nextFil: "Pag-apruba" },
  { key: "paid", en: "Paid", fil: "Bayad na", event: "Paid to account", nextEn: "Payment to your account", nextFil: "Pagpapadala ng bayad" },
] as const;

/** Where a claim sits on the five-stage track, and whether it is moving, blocked or ended. */
export function claimStage(status: ClaimStatus): { current: number; mode: "active" | "blocked" | "denied" } {
  switch (status) {
    case "submitted":
    case "docs_review":
      return { current: 1, mode: "active" };
    case "evaluation":
      return { current: 2, mode: "active" };
    case "approved":
    case "for_payout":
      return { current: 4, mode: "active" };
    case "paid":
      return { current: 5, mode: "active" };
    case "returned":
      return { current: 1, mode: "blocked" };
    case "denied":
      return { current: 2, mode: "denied" };
  }
}

/** One short line on what happens next for an open claim. */
export function claimNext(c: Claim, t: TFn) {
  switch (c.status) {
    case "submitted":
      return t("We check your documents within 2 working days.", "Susuriin namin ang mga dokumento sa loob ng 2 araw ng trabaho.");
    case "docs_review":
      return t("We are checking your documents now.", "Sinusuri na namin ang iyong mga dokumento.");
    case "evaluation":
      return t("Documents verified. Expect a decision in 2 to 3 working days.", "Na-verify na ang mga dokumento. Asahan ang desisyon sa loob ng 2 hanggang 3 araw.");
    case "approved":
      return t("Approved. Your payout is being prepared.", "Aprubado na. Inihahanda na ang iyong payout.");
    case "for_payout":
      return t(`Payout to ${c.payoutLabel} is waiting for final approval.`, `Hinihintay na lang ang final approval ng payout sa ${c.payoutLabel}.`);
    case "returned":
      return t("One document needs a new copy. Upload it to continue.", "May isang dokumentong kailangang palitan. I-upload ito para magtuloy.");
    case "paid":
      return t(`Paid to ${c.payoutLabel}.`, `Naipadala sa ${c.payoutLabel}.`);
    case "denied":
      return t("This claim was denied. See the reason in the history.", "Hindi naaprubahan ang claim na ito. Tingnan ang dahilan sa history.");
  }
}

/** Steps still ahead, for the timeline. */
export function claimUpcoming(c: Claim, t: TFn): string[] {
  const payout = t(`Payout to ${c.payoutLabel}`, `Payout sa ${c.payoutLabel}`);
  switch (c.status) {
    case "submitted":
      return [t("Documents check, within 2 working days", "Pagsusuri ng dokumento, sa loob ng 2 araw"), t("Benefit evaluation", "Pagsusuri ng benepisyo"), t("Approval", "Pag-apruba"), payout];
    case "docs_review":
      return [t("Benefit evaluation", "Pagsusuri ng benepisyo"), t("Approval", "Pag-apruba"), payout];
    case "evaluation":
      return [t("Approval", "Pag-apruba"), payout];
    case "approved":
      return [t("Payout approval by a second officer", "Pag-apruba ng payout ng ikalawang opisyal"), payout];
    case "for_payout":
      return [payout];
    case "returned":
      return [t("Upload the requested document", "I-upload ang hinihinging dokumento"), t("Documents check", "Pagsusuri ng dokumento"), t("Benefit evaluation", "Pagsusuri ng benepisyo"), payout];
    default:
      return [];
  }
}

export interface ClaimInputs {
  days: number | "";
  severity: "major" | "minor" | "";
}

/** Sample schedule for the amount claimed, with the arithmetic spelled out. */
export function claimAmount(type: ClaimType, inp: ClaimInputs, coverage: CoverageLine[], member: Member): { amount: number; en: string; fil: string } {
  const cov = (id: string) => coverage.find((c) => c.id === id)?.amount ?? 0;
  const days = typeof inp.days === "number" ? inp.days : 0;
  switch (type) {
    case "AHB":
    case "IHB": {
      const rate = type === "AHB" ? 1_000 : 500;
      const counted = Math.min(10, Math.max(0, days));
      const capped = days > 10;
      return {
        amount: counted * rate,
        en: days ? `${counted} ${counted === 1 ? "day" : "days"} × ${peso(rate, { whole: true })}${capped ? " (capped at 10 days)" : ""}` : `${peso(rate, { whole: true })} a day, up to 10 days`,
        fil: days ? `${counted} araw × ${peso(rate, { whole: true })}${capped ? " (hanggang 10 araw lang)" : ""}` : `${peso(rate, { whole: true })} kada araw, hanggang 10 araw`,
      };
    }
    case "WIA":
      if (inp.severity === "major") return { amount: 50_000, en: "Major injury, fixed amount", fil: "Malubhang pinsala, takdang halaga" };
      if (inp.severity === "minor") return { amount: 20_000, en: "Minor injury, fixed amount", fil: "Hindi malubhang pinsala, takdang halaga" };
      return { amount: 0, en: "Choose how serious the injury is", fil: "Piliin kung gaano kalubha ang pinsala" };
    case "DFI":
      return { amount: 50_000, en: "Fixed amount on your membership form", fil: "Takdang halaga ayon sa membership form" };
    case "KIA":
      return { amount: cov("kia"), en: "Your killed-in-action coverage", fil: "Ang iyong killed-in-action coverage" };
    case "DEATH":
      return { amount: cov("life"), en: "Your life insurance coverage", fil: "Ang iyong life insurance coverage" };
    case "DISABILITY":
      return { amount: cov("add"), en: "Up to your disablement cover; the final amount follows the schedule", fil: "Hanggang sa iyong disablement cover; ang huling halaga ay ayon sa schedule" };
    case "MER":
      return { amount: Math.round(member.basePay * 0.08), en: "Sample estimate; the Board declares the refund yearly", fil: "Sample na tantya; idinedeklara ng Board ang refund taun-taon" };
  }
}

/** Field label for the incident date, by benefit. */
export function incidentLabel(type: ClaimType, t: TFn) {
  switch (type) {
    case "AHB":
    case "DISABILITY":
      return t("Date of the accident", "Petsa ng aksidente");
    case "IHB":
      return t("Date you were admitted", "Petsa ng pagka-admit");
    case "WIA":
      return t("Date of the injury", "Petsa ng pagkasugat");
    case "KIA":
    case "DEATH":
      return t("Date of death", "Petsa ng pagkamatay");
    case "DFI":
      return t("Date of the dependent's death", "Petsa ng pagkamatay ng dependent");
    case "MER":
      return t("Refund year", "Taon ng refund");
  }
}
