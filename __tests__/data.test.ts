import {loanStatusLabel} from '../src/data/generate';
import {TODAY} from '../src/lib/format';
import {LOAN_PRODUCT_BY_ID} from '../src/data/reference';
import {firstDeduction, paidCount} from '../src/app/shared/loans';
import {addMonths, periodOf} from '../src/app/shared/text';
import {useDB} from '../src/store/db';
import {DEMO_MEMBER} from '../src/store/session';

const db = () => useDB.getState();
const ME = DEMO_MEMBER.id;

describe('sample data', () => {
  test('the demo member exists with an account to receive money', () => {
    const me = db().members.find(m => m.id === ME);
    expect(me?.firstName).toBe('Rowena');
    expect(me?.payoutAccounts.length).toBeGreaterThan(0);
  });

  test("every member's beneficiary shares add up to 100%", () => {
    for (const m of db().members) {
      if (m.beneficiaries.length) {expect([m.id, m.beneficiaries.reduce((a, b) => a + b.share, 0)]).toEqual([m.id, 100]);}
    }
  });

  test('paid loans are fully paid; others never show more instalments than the term', () => {
    for (const l of db().loans) {
      if (l.status === 'paid') {expect([l.id, l.balance, l.paidInstallments]).toEqual([l.id, 0, l.termMonths]);}
      else {expect(l.paidInstallments).toBeLessThanOrEqual(l.termMonths);}
    }
  });

  test("a released loan's date is the day its history shows the release, and its payout agrees", () => {
    for (const l of db().loans.filter(x => x.releasedAt)) {
      const released = l.timeline.find(e => e.label === loanStatusLabel('released'));
      if (released) {expect([l.id, l.releasedAt]).toEqual([l.id, released.at]);}
      const payout = db().payouts.find(po => po.refId === l.id && po.kind === 'Loan proceeds');
      if (payout) {expect([l.id, payout.createdAt]).toEqual([l.id, l.releasedAt]);}
    }
  });

  test('account numbers are masked the same way everywhere', () => {
    for (const l of db().loans) {if (l.payoutLabel && !l.payoutLabel.startsWith('Cheque')) {expect(l.payoutLabel).toMatch(/ •••• \d{4}$/);}}
  });

  test("the demo member's loan payments are never ahead of the calendar", () => {
    const now = periodOf(TODAY.toISOString());
    for (const l of db().loans.filter(x => x.memberId === ME && x.status === 'released')) {
      const lastPaid = addMonths(firstDeduction(l, LOAN_PRODUCT_BY_ID[l.productId].processingDays), paidCount(l) - 1);
      expect([l.id, lastPaid <= now]).toEqual([l.id, true]);
    }
  });

  test('no loan or claim history is dated after today', () => {
    const today = TODAY.getTime();
    for (const l of db().loans) {for (const e of l.timeline) {expect(new Date(e.at).getTime()).toBeLessThanOrEqual(today);}}
    for (const c of db().claims) {for (const e of c.timeline) {expect(new Date(e.at).getTime()).toBeLessThanOrEqual(today);}}
  });
});

describe('member actions', () => {
  beforeEach(() => db().resetDemo());

  test('a loan application is saved, the member is told, and release sends the money', () => {
    const me = db().members.find(m => m.id === ME)!;
    const before = {notes: db().notifications.length, payouts: db().payouts.length};
    const loan = db().applyLoan({memberId: ME, productId: 'SLP', principal: 50000, termMonths: 12, purpose: 'School fees', payoutAccountId: me.payoutAccounts[0].id, channel: 'Member App'});
    expect(loan.id).toMatch(/^LN-2026-\d{6}$/);
    expect(loan.status).toBe('submitted');
    expect(loan.monthly).toBeGreaterThan(50000 / 12);
    expect(db().notifications.length).toBe(before.notes + 1);

    db().setLoanStatus(loan.id, 'released');
    const payout = db().payouts.find(p => p.refId === loan.id);
    expect(payout).toMatchObject({kind: 'Loan proceeds', amount: 50000, status: 'sent'});
    expect(db().payouts.length).toBe(before.payouts + 1);
  });

  test('an enrolment gets a reference number and is kept', () => {
    const e = db().submitEnrolment({firstName: 'Juan', middleInitial: 'P', lastName: 'Dela Cruz', rank: 'PMSg', agency: 'PNP', unit: 'Manila Police District', basePay: 38824, mobile: '0917 555 0101', email: '', idType: 'PhilSys National ID', beneficiaries: 1, via: 'Member App'});
    expect(e.id).toMatch(/^EN-2026-\d{5}$/);
    expect(db().enrolments[0].id).toBe(e.id);
  });

  test('changed contact details and branch stay changed', () => {
    db().updateMember(ME, {mobile: '0918 000 1111', officeId: 'RSO-07'});
    const me = db().members.find(m => m.id === ME)!;
    expect(me.mobile).toBe('0918 000 1111');
    expect(me.officeId).toBe('RSO-07');
  });

  test('reset brings back the original sample data', () => {
    db().updateMember(ME, {mobile: '0918 000 1111'});
    db().resetDemo();
    expect(db().members.find(m => m.id === ME)!.mobile).toBe(DEMO_MEMBER.mobile);
  });
});
