import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { appStorage } from './storage';
import { TODAY, amortization } from '@/lib/format';
import { pad } from '@/lib/random';
import { generateAll, memberName } from '@/data/generate';
import { BENEFIT_BY_ID, LOAN_PRODUCT_BY_ID } from '@/data/reference';
import type {
  AgencyCode, AppNotification, AssistRequest, Claim, ClaimDocument, ClaimStatus, ClaimType, Enrolment, Loan, LoanProductId, LoanStatus, Member, Payout,
} from '@/data/types';

/*
 * The Member App's single source of truth (sample data, persisted on the phone).
 * The demo member's loans, claims, payouts and notifications all read the same record.
 *
 * RULE for components: never return a new array/object from a selector.
 * Select a slice (s => s.loans) and derive with useMemo, or use the hooks in ./hooks.
 */

const seed = generateAll();

const nowIso = () => new Date(Math.max(Date.now(), TODAY.getTime())).toISOString();
let counter = Date.now() % 100000;
const nextId = (prefix: string) => `${prefix}-${pad(++counter % 1_000_000, 6)}`;

/** Kept for call-site compatibility; the member app does not show an audit trail. */
type Actor = { name: string; role: string; officeId?: string };

export interface NewLoanInput {
  memberId: string;
  productId: LoanProductId;
  principal: number;
  termMonths: number;
  purpose: string;
  payoutAccountId: string;
  channel: Loan['channel'];
}

export interface NewClaimInput {
  memberId: string;
  type: ClaimType;
  claimantName: string;
  claimantRelation: Claim['claimantRelation'];
  incidentDate: string;
  description: string;
  confinementDays?: number;
  hospital?: string;
  amountClaimed: number;
  documents: ClaimDocument[];
  payoutAccountId: string;
}

export interface NewEnrolmentInput {
  firstName: string;
  middleInitial: string;
  lastName: string;
  rank: string;
  agency: AgencyCode;
  unit: string;
  basePay: number;
  mobile: string;
  email: string;
  idType: string;
  beneficiaries: number;
  via: Enrolment['via'];
}

export interface CallbackRequest {
  id: string;
  memberId: string | null;
  name: string;
  mobile: string;
  topic: string;
  when: string;
  createdAt: string;
}

interface DBState {
  members: Member[];
  memberOverrides: Record<string, Partial<Member>>;
  loans: Loan[];
  claims: Claim[];
  enrolments: Enrolment[];
  payouts: Payout[];
  notifications: AppNotification[];
  assist: AssistRequest[];
  callbacks: CallbackRequest[];

  updateMember: (id: string, patch: Partial<Member>, actor?: Actor) => void;
  applyLoan: (input: NewLoanInput) => Loan;
  setLoanStatus: (id: string, status: LoanStatus, actor?: Actor, note?: string) => void;
  fileClaim: (input: NewClaimInput) => Claim;
  setClaimStatus: (id: string, status: ClaimStatus, actor?: Actor, note?: string) => void;
  setClaimDocument: (claimId: string, docId: string, status: ClaimDocument['status'], actor?: Actor, preview?: string) => void;
  submitEnrolment: (input: NewEnrolmentInput) => Enrolment;
  createAssist: (input: Omit<AssistRequest, 'id' | 'status' | 'createdAt' | 'handler' | 'nextStep'>) => AssistRequest;
  requestCallback: (input: Omit<CallbackRequest, 'id' | 'createdAt'>) => CallbackRequest;
  markNotificationRead: (id: string) => void;
  markAllRead: (audience: AppNotification['audience'], targetId: string) => void;
  resetDemo: () => void;
}

function rebuildMembers(overrides: Record<string, Partial<Member>>) {
  return seed.members.map((m) => (overrides[m.id] ? { ...m, ...overrides[m.id] } : m));
}

const initialCollections = () => ({
  memberOverrides: {} as Record<string, Partial<Member>>,
  loans: seed.loans,
  claims: seed.claims,
  enrolments: [] as Enrolment[],
  payouts: seed.payouts,
  notifications: seed.notifications,
  assist: seed.assist,
  callbacks: [] as CallbackRequest[],
});

const LOAN_LABEL: Record<LoanStatus, string> = {
  submitted: 'Application submitted',
  evaluation: 'Credit evaluation started',
  approved: 'Approved by loans officer',
  for_release: 'Sent to treasury for release',
  released: 'Proceeds released',
  paid: 'Fully paid',
  returned: 'Returned to member for correction',
  rejected: 'Application declined',
};
const CLAIM_LABEL: Record<ClaimStatus, string> = {
  submitted: 'Claim filed',
  docs_review: 'Documents under review',
  evaluation: 'Benefit evaluation',
  approved: 'Benefit approved',
  for_payout: 'Queued for payout',
  paid: 'Paid to account',
  returned: 'Returned for missing documents',
  denied: 'Claim denied',
};

const accountLabel = (m: Member | undefined, accountId: string | null) => {
  const acct = m?.payoutAccounts.find((a) => a.id === accountId) ?? m?.payoutAccounts.find((a) => a.primary);
  return acct ? `${acct.provider} ${acct.accountNo.replace(/\s/g, '').slice(-4).padStart(8, '•')}` : 'Cheque at your RSO';
};

export const useDB = create<DBState>()(
  persist(
    (set, get) => {
      const notify = (n: Omit<AppNotification, 'id' | 'at' | 'read' | 'audience'>) => {
        const full: AppNotification = { id: nextId('N'), at: nowIso(), read: false, audience: 'member', ...n };
        set((s) => ({ notifications: [full, ...s.notifications] }));
      };
      const memberById = (id: string) => get().members.find((m) => m.id === id);

      return {
        members: rebuildMembers({}),
        ...initialCollections(),

        updateMember: (id, patch) => {
          set((s) => {
            const memberOverrides = { ...s.memberOverrides, [id]: { ...s.memberOverrides[id], ...patch } };
            return { memberOverrides, members: rebuildMembers(memberOverrides) };
          });
        },

        applyLoan: (input) => {
          const p = LOAN_PRODUCT_BY_ID[input.productId];
          const m = memberById(input.memberId);
          const at = nowIso();
          const loan: Loan = {
            id: `LN-2026-${pad(2000 + get().loans.length, 6)}`,
            memberId: input.memberId,
            productId: input.productId,
            principal: input.principal,
            rate: p.rate,
            termMonths: input.termMonths,
            monthly: Math.round(amortization(input.principal, p.rate, input.termMonths) * 100) / 100,
            purpose: input.purpose,
            appliedAt: at,
            status: 'submitted',
            channel: input.channel,
            officeId: m?.officeId ?? 'HO',
            payoutAccountId: input.payoutAccountId,
            payoutLabel: accountLabel(m, input.payoutAccountId),
            releasedAt: null,
            paidInstallments: 0,
            balance: input.principal,
            timeline: [{ at, label: LOAN_LABEL.submitted, note: `Filed through the ${input.channel}` }],
            makerName: null,
            checkerName: null,
            risk: 'low',
          };
          set((s) => ({ loans: [loan, ...s.loans] }));
          notify({ targetId: input.memberId, title: `${p.name} application received`, titleFil: `Natanggap ang iyong ${p.name} application`, body: `${loan.id} · We'll review it within ${p.processingDays} working days.`, bodyFil: `${loan.id} · Susuriin namin ito sa loob ng ${p.processingDays} araw ng trabaho.`, link: `/member/loans/${loan.id}`, tone: 'info' });
          return loan;
        },

        setLoanStatus: (id, status, actor, note) => {
          const loan = get().loans.find((l) => l.id === id);
          if (!loan) {return;}
          const at = nowIso();
          set((s) => ({
            loans: s.loans.map((l) =>
              l.id === id ? { ...l, status, releasedAt: status === 'released' ? at : l.releasedAt, timeline: [...l.timeline, { at, label: LOAN_LABEL[status], by: actor?.name ?? 'PSMBFI Loans', note }] } : l,
            ),
          }));
          const p = LOAN_PRODUCT_BY_ID[loan.productId];
          if (status === 'released') {
            const m = memberById(loan.memberId);
            const acct = m?.payoutAccounts.find((a) => a.id === loan.payoutAccountId) ?? m?.payoutAccounts[0];
            if (m) {
              const po: Payout = { id: nextId('PO'), memberId: m.id, memberName: memberName(m), kind: 'Loan proceeds', refId: loan.id, amount: loan.principal, provider: acct?.provider ?? 'LANDBANK', channel: acct?.kind ?? 'bank', account: acct?.accountNo ?? '', status: 'sent', batchId: null, createdAt: at, settledAt: null, reference: `TRX${String(Date.now()).slice(-8)}` };
              set((s) => ({ payouts: [po, ...s.payouts] }));
            }
          }
          const msg: Partial<Record<LoanStatus, [string, string, AppNotification['tone']]>> = {
            evaluation: [`Your ${p.name} is being reviewed`, `Sinusuri na ang iyong ${p.name}`, 'info'],
            approved: [`Your ${p.name} is approved`, `Aprubado na ang iyong ${p.name}`, 'positive'],
            released: [`${p.name}: money sent to your account`, `${p.name}: naipadala na ang pera sa iyong account`, 'positive'],
            returned: [`Your ${p.name} needs a correction`, `May kailangang ayusin sa iyong ${p.name}`, 'caution'],
            rejected: [`Your ${p.name} was not approved`, `Hindi naaprubahan ang iyong ${p.name}`, 'negative'],
          };
          const mm = msg[status];
          if (mm) {notify({ targetId: loan.memberId, title: mm[0], titleFil: mm[1], body: note ? `${id} · ${note}` : id, link: `/member/loans/${id}`, tone: mm[2] });}
        },

        fileClaim: (input) => {
          const m = memberById(input.memberId);
          const at = nowIso();
          const claim: Claim = {
            id: `CL-2026-${pad(900 + get().claims.length, 6)}`,
            memberId: input.memberId,
            type: input.type,
            claimantName: input.claimantName,
            claimantRelation: input.claimantRelation,
            incidentDate: input.incidentDate,
            filedAt: at,
            amountClaimed: input.amountClaimed,
            amountApproved: null,
            status: 'submitted',
            documents: input.documents,
            timeline: [{ at, label: CLAIM_LABEL.submitted, note: `${input.documents.length} document${input.documents.length === 1 ? '' : 's'} attached in the Member App` }],
            description: input.description,
            confinementDays: input.confinementDays,
            hospital: input.hospital,
            assignee: 'Kristine A. Domingo',
            payoutLabel: accountLabel(m, input.payoutAccountId),
            officeId: m?.officeId ?? 'HO',
          };
          set((s) => ({ claims: [claim, ...s.claims] }));
          const b = BENEFIT_BY_ID[input.type];
          notify({ targetId: input.memberId, title: `${b.name} claim received`, titleFil: `Natanggap ang iyong claim: ${b.nameFil}`, body: `${claim.id} · We'll check your documents within 2 working days.`, bodyFil: `${claim.id} · Susuriin namin ang mga dokumento sa loob ng 2 araw ng trabaho.`, link: `/member/claims/${claim.id}`, tone: 'info' });
          return claim;
        },

        setClaimStatus: (id, status, actor, note) => {
          const claim = get().claims.find((c) => c.id === id);
          if (!claim) {return;}
          const at = nowIso();
          set((s) => ({
            claims: s.claims.map((c) =>
              c.id === id
                ? { ...c, status, amountApproved: ['approved', 'for_payout', 'paid'].includes(status) ? c.amountApproved ?? c.amountClaimed : c.amountApproved, timeline: [...c.timeline, { at, label: CLAIM_LABEL[status], by: actor?.name ?? 'PSMBFI Claims', note }] }
                : c,
            ),
          }));
          if (status === 'paid') {
            const m = memberById(claim.memberId);
            const acct = m?.payoutAccounts.find((a) => a.primary) ?? m?.payoutAccounts[0];
            if (m) {
              const po: Payout = { id: nextId('PO'), memberId: m.id, memberName: memberName(m), kind: 'Claim benefit', refId: claim.id, amount: claim.amountApproved ?? claim.amountClaimed, provider: acct?.provider ?? 'LANDBANK', channel: acct?.kind ?? 'bank', account: acct?.accountNo ?? '', status: 'sent', batchId: null, createdAt: at, settledAt: null, reference: `TRX${String(Date.now()).slice(-8)}` };
              set((s) => ({ payouts: [po, ...s.payouts] }));
            }
          }
          const msg: Partial<Record<ClaimStatus, [string, string, AppNotification['tone']]>> = {
            docs_review: ["We're checking your claim documents", 'Sinusuri na namin ang iyong mga dokumento', 'info'],
            evaluation: ['Your claim is being evaluated', 'Sinusuri na ang iyong claim', 'info'],
            approved: ['Your claim is approved', 'Aprubado na ang iyong claim', 'positive'],
            paid: ['Your claim was paid to your account', 'Naipadala na ang bayad sa iyong claim', 'positive'],
            returned: ['Your claim needs another document', 'May kulang na dokumento sa iyong claim', 'caution'],
            denied: ['Your claim was not approved', 'Hindi naaprubahan ang iyong claim', 'negative'],
          };
          const mm = msg[status];
          if (mm) {notify({ targetId: claim.memberId, title: mm[0], titleFil: mm[1], body: note ? `${id} · ${note}` : id, link: `/member/claims/${id}`, tone: mm[2] });}
        },

        setClaimDocument: (claimId, docId, status, _actor, preview) => {
          set((s) => ({ claims: s.claims.map((c) => (c.id === claimId ? { ...c, documents: c.documents.map((d) => (d.id === docId ? { ...d, status, preview: preview ?? d.preview } : d)) } : c)) }));
        },

        submitEnrolment: (input) => {
          const e: Enrolment = { id: `EN-2026-${pad(1300 + get().enrolments.length, 5)}`, ...input, submittedAt: nowIso(), status: 'submitted', idMatch: 0.94, mafSigned: true, atdSigned: true };
          set((s) => ({ enrolments: [e, ...s.enrolments] }));
          return e;
        },

        createAssist: (input) => {
          const req: AssistRequest = { ...input, id: `LT-2026-${pad(400 + get().assist.length, 5)}`, status: 'received', createdAt: nowIso(), handler: null, nextStep: 'The Legal & Travel Desk will call you within one working day.' };
          set((s) => ({ assist: [req, ...s.assist] }));
          notify({ targetId: input.memberId, title: 'Assistance request received', titleFil: 'Natanggap ang iyong request', body: `${req.id} · ${input.topic}`, link: '/member/assist', tone: 'info' });
          return req;
        },

        requestCallback: (input) => {
          const r: CallbackRequest = { ...input, id: nextId('CB'), createdAt: nowIso() };
          set((s) => ({ callbacks: [r, ...s.callbacks] }));
          if (input.memberId) {notify({ targetId: input.memberId, title: "We'll call you back", titleFil: 'Tatawagan ka namin', body: `${input.when} · about ${input.topic.toLowerCase()}`, bodyFil: `${input.when} · tungkol sa ${input.topic.toLowerCase()}`, link: null, tone: 'info' });}
          return r;
        },

        markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        markAllRead: (audience, targetId) => set((s) => ({ notifications: s.notifications.map((n) => (n.audience === audience && n.targetId === targetId ? { ...n, read: true } : n)) })),

        resetDemo: () => set({ ...initialCollections(), members: rebuildMembers({}) }),
      };
    },
    {
      name: 'psaccess.member-db',
      version: 1,
      storage: appStorage,
      partialize: (s) => ({
        memberOverrides: s.memberOverrides, loans: s.loans, claims: s.claims, enrolments: s.enrolments, payouts: s.payouts,
        notifications: s.notifications, assist: s.assist, callbacks: s.callbacks,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<DBState>;
        const merged = { ...current, ...p } as DBState;
        merged.members = rebuildMembers(merged.memberOverrides ?? {});
        return merged;
      },
    },
  ),
);
