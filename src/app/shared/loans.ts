/* Ported from the web version (webapp/src/features/member/parts/loans.ts). */
import type { Lang } from '@/lib/i18n';
import type { Loan, LoanProduct, LoanStatus, Member } from '@/data/types';
import type { Tone } from '@/config/theme';
import { addMonths, monthYear, periodOf, type TFn } from './text';

export const PENDING_LOAN: LoanStatus[] = ['submitted', 'evaluation', 'approved', 'for_release', 'returned'];
export const CLOSED_LOAN: LoanStatus[] = ['paid', 'rejected'];

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Installments actually deducted (sample records can overshoot the term). */
export function paidCount(l: Loan) {
  if (l.status === 'paid') {return l.termMonths;}
  if (l.status !== 'released') {return 0;}
  return Math.min(l.paidInstallments, l.termMonths);
}

/** Ceiling for a product. Policy Loan: 90% of Equity Value, rounded down to ₱100. */
export function maxFor(p: LoanProduct, equityValue: number) {
  return p.maxAmount ?? Math.max(p.minAmount, Math.floor((equityValue * 0.9) / 100) * 100);
}

/** Slider step: fine enough for the smallest products, coarse enough for the large ones. */
export function stepFor(min: number, max: number) {
  const span = max - min;
  if (span <= 60_000) {return 500;}
  if (span <= 150_000) {return 1_000;}
  return 5_000;
}

/** Payroll month of the first deduction: the month after release (or expected release). */
export function firstDeduction(l: Pick<Loan, 'releasedAt' | 'appliedAt'>, processingDays: number) {
  const release = l.releasedAt ?? new Date(new Date(l.appliedAt).getTime() + processingDays * 86_400_000).toISOString();
  return addMonths(periodOf(release), 1);
}
export const nextDeduction = (l: Loan, processingDays: number) => addMonths(firstDeduction(l, processingDays), paidCount(l));
export const finalDeduction = (l: Loan, processingDays: number) => addMonths(firstDeduction(l, processingDays), l.termMonths - 1);

export interface ScheduleRow {
  no: number;
  period: string;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
  state: 'paid' | 'next' | 'due';
}

/** Amortization schedule from the loan's own terms; the last row clears the balance. */
export function scheduleFor(l: Loan, processingDays: number): ScheduleRow[] {
  const i = l.rate / 12;
  const paid = paidCount(l);
  const first = firstDeduction(l, processingDays);
  const rows: ScheduleRow[] = [];
  // Balance after payment k = present value of the payments still to come, the same
  // rule the loan record uses, so the schedule and "Left to pay" always agree.
  const pv = (remaining: number) => (remaining <= 0 ? 0 : i === 0 ? l.monthly * remaining : (l.monthly * (1 - Math.pow(1 + i, -remaining))) / i);
  let before = l.principal;
  for (let k = 1; k <= l.termMonths; k++) {
    const after = k === l.termMonths ? 0 : round2(pv(l.termMonths - k));
    const principal = round2(before - after);
    const interest = Math.max(0, round2(l.monthly - principal));
    rows.push({ no: k, period: addMonths(first, k - 1), payment: round2(principal + interest), interest, principal, balance: after, state: k <= paid ? 'paid' : k === paid + 1 && l.status === 'released' ? 'next' : 'due' });
    before = after;
  }
  return rows;
}

export interface Eligibility {
  ok: boolean;
  tone: Tone;
  en: string;
  fil: string;
}

/** A plain-language eligibility hint for one product, from the member's own record. */
export function eligibilityFor(p: LoanProduct, m: Member, months: number, loans: Loan[]): Eligibility {
  if (m.status !== 'active') {return { ok: false, tone: 'bad', en: 'For active members only', fil: 'Para lang sa mga aktibong miyembro' };}
  const active = loans.find((l) => l.productId === p.id && l.status === 'released');
  const pending = loans.find((l) => l.productId === p.id && PENDING_LOAN.includes(l.status));
  if (p.id === 'POL') {
    if (months < 12) {return { ok: false, tone: 'bad', en: `Needs 12 months of contributions. You have ${months}.`, fil: `Kailangan ng 12 buwan ng kontribusyon. Mayroon kang ${months}.` };}
    if (active) {return { ok: false, tone: 'bad', en: 'Pay off your current Policy Loan first', fil: 'Bayaran muna ang kasalukuyan mong Policy Loan' };}
  }
  if (p.id === 'CAL') {
    return { ok: true, tone: 'warn', en: 'Only for declared calamity areas. You confirm this when you apply.', fil: 'Para lang sa lugar na may deklaradong kalamidad. Kukumpirmahin mo ito sa pag-apply.' };
  }
  const needsAtd = p.id === 'SLP' || p.id === 'MPL';
  const need = p.id === 'SLP' || p.id === 'MPL' || p.id === 'POL' ? 12 : 6;
  if (needsAtd && !m.atdOnFile) {return { ok: false, tone: 'bad', en: 'Needs an ATD on file with your agency', fil: 'Kailangan ng ATD on file sa iyong ahensya' };}
  if (months < need) {return { ok: false, tone: 'bad', en: `Needs ${need} monthly contributions. You have ${months}.`, fil: `Kailangan ng ${need} buwanang kontribusyon. Mayroon kang ${months}.` };}
  if (pending) {return { ok: true, tone: 'warn', en: `Your application ${pending.id} is still in progress`, fil: `Pinoproseso pa ang iyong application ${pending.id}` };}
  if (active) {return { ok: true, tone: 'warn', en: `You have an active ${p.name}. Its balance counts toward your take-home limit.`, fil: `May aktibo kang ${p.name}. Kasama ang balanse nito sa limit ng iyong take-home pay.` };}
  if (p.id === 'POL') {return { ok: true, tone: 'ok', en: `You qualify: ${months} months of contributions`, fil: `Pasok ka: ${months} buwan ng kontribusyon` };}
  return {
    ok: true,
    tone: 'ok',
    en: `You qualify: ${months} monthly contributions${needsAtd ? ' and ATD on file' : ''}`,
    fil: `Pasok ka: ${months} buwanang kontribusyon${needsAtd ? ' at may ATD on file' : ''}`,
  };
}

/** Steps still ahead of an unfinished loan, for the timeline. */
export function loanUpcoming(l: Loan, p: LoanProduct, t: TFn, lang: Lang): string[] {
  const account = l.payoutLabel;
  const first = monthYear(firstDeduction(l, p.processingDays), lang);
  const approval = t('Approval by a loans officer', 'Pag-apruba ng loans officer');
  const release = t(`Release to ${account}`, `I-release sa ${account}`);
  const firstPay = t(`First salary deduction, ${first} payroll`, `Unang kaltas sa sahod, ${first}`);
  switch (l.status) {
    case 'submitted':
      return [t(`Credit evaluation, within ${p.processingDays === 1 ? 'one working day' : `${p.processingDays} working days`}`, `Credit evaluation, sa loob ng ${p.processingDays === 1 ? 'isang araw' : `${p.processingDays} araw`} ng trabaho`), approval, release, firstPay];
    case 'evaluation':
      return [approval, release, firstPay];
    case 'approved':
      return [t('Release check by a second officer', 'Pagsusuri ng ikalawang opisyal bago i-release'), release, firstPay];
    case 'for_release':
      return [release, firstPay];
    case 'released': {
      const paid = paidCount(l);
      const next = monthYear(nextDeduction(l, p.processingDays), lang);
      const last = monthYear(finalDeduction(l, p.processingDays), lang);
      return [t(`Payment ${paid + 1} of ${l.termMonths}, ${next} payroll`, `Hulog ${paid + 1} sa ${l.termMonths}, ${next}`), t(`Final payment, ${last}`, `Huling hulog, ${last}`)];
    }
    case 'returned':
      return [t('Send the correction through your branch', 'Ipadala ang pagtatama sa iyong sangay'), t('Evaluation resumes', 'Itutuloy ang evaluation')];
    default:
      return [];
  }
}
