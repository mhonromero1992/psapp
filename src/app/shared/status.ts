import type {Tone} from '../../config/theme';
import type {ClaimStatus, LoanStatus, PayoutStatus} from '../../data/types';

/** One status vocabulary for every screen, in plain words, English and Filipino. */
export const LOAN_STATUS: Record<LoanStatus, {en: string; fil: string; tone: Tone}> = {
  submitted: {en: 'Submitted', fil: 'Naisumite', tone: 'info'},
  evaluation: {en: 'Being reviewed', fil: 'Sinusuri', tone: 'info'},
  approved: {en: 'Approved', fil: 'Aprubado', tone: 'ok'},
  for_release: {en: 'Money being sent', fil: 'Ipinapadala ang pera', tone: 'warn'},
  released: {en: 'Active', fil: 'Aktibo', tone: 'ok'},
  paid: {en: 'Fully paid', fil: 'Bayad na', tone: 'neutral'},
  returned: {en: 'Needs a correction', fil: 'May aayusin', tone: 'warn'},
  rejected: {en: 'Not approved', fil: 'Hindi naaprubahan', tone: 'bad'},
};

export const CLAIM_STATUS: Record<ClaimStatus, {en: string; fil: string; tone: Tone}> = {
  submitted: {en: 'Filed', fil: 'Naisampa', tone: 'info'},
  docs_review: {en: 'Checking documents', fil: 'Sinusuri ang dokumento', tone: 'info'},
  evaluation: {en: 'Being evaluated', fil: 'Sinusuri', tone: 'info'},
  approved: {en: 'Approved', fil: 'Aprubado', tone: 'ok'},
  for_payout: {en: 'Payment being sent', fil: 'Ipinapadala ang bayad', tone: 'warn'},
  paid: {en: 'Paid', fil: 'Bayad na', tone: 'ok'},
  returned: {en: 'Needs a document', fil: 'Kulang ang dokumento', tone: 'warn'},
  denied: {en: 'Not approved', fil: 'Hindi naaprubahan', tone: 'bad'},
};

export const PAYOUT_STATUS: Record<PayoutStatus, {en: string; fil: string; tone: Tone}> = {
  queued: {en: 'Queued', fil: 'Nakapila', tone: 'neutral'},
  for_approval: {en: 'Being approved', fil: 'Inaaprubahan', tone: 'warn'},
  approved: {en: 'Approved', fil: 'Aprubado', tone: 'info'},
  sent: {en: 'Sent', fil: 'Naipadala', tone: 'info'},
  settled: {en: 'Received', fil: 'Natanggap', tone: 'ok'},
  failed: {en: 'Not sent', fil: 'Hindi naipadala', tone: 'bad'},
};
