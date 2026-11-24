import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PresentationChart, X, FastForward } from "@phosphor-icons/react";
import { toast } from "sonner";
import { EASE_OUT } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { CLAIM_STATUS, LOAN_STATUS } from "@/components/ui/Badge";
import { usePrefs } from "@/store/prefs";
import { useDB } from "@/store/db";
import { useClaimsFor, useCurrentMember, useLoansFor } from "@/store/hooks";
import { BENEFIT_BY_ID, LOAN_PRODUCT_BY_ID } from "@/data/reference";
import type { ClaimStatus, LoanStatus } from "@/data/types";

const LOAN_NEXT: Partial<Record<LoanStatus, LoanStatus>> = { submitted: "evaluation", evaluation: "approved", approved: "for_release", for_release: "released" };
const CLAIM_NEXT: Partial<Record<ClaimStatus, ClaimStatus>> = { submitted: "docs_review", docs_review: "evaluation", evaluation: "approved", approved: "for_payout", for_payout: "paid" };

/**
 * Presenter tools (opt-in, in More): there is no back office in this prototype, so a
 * presenter can play PSMBFI's part and move a loan or claim to its next step. The
 * member then sees the new status, the notification and, at the end, the payout.
 */
export function DemoPanel() {
  const on = usePrefs((s) => s.presenter);
  const setOn = usePrefs((s) => s.setPresenter);
  const [open, setOpen] = useState(false);
  const member = useCurrentMember();
  const loans = useLoansFor(member.id);
  const claims = useClaimsFor(member.id);
  const setLoanStatus = useDB((s) => s.setLoanStatus);
  const setClaimStatus = useDB((s) => s.setClaimStatus);
  const openLoans = useMemo(() => loans.filter((l) => LOAN_NEXT[l.status]), [loans]);
  const openClaims = useMemo(() => claims.filter((c) => CLAIM_NEXT[c.status]), [claims]);

  if (!on) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="fixed bottom-[calc(6.25rem+var(--safe-bottom))] left-3 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-amber-400 px-4 text-[0.9rem] font-bold text-slate-900 shadow-e3 lg:bottom-6 lg:left-auto lg:right-6"
      >
        <PresentationChart size={20} weight="bold" aria-hidden /> Presenter
      </button>
      <AnimatePresence>
        {open && (
          <motion.section
            aria-label="Presenter tools"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="fixed inset-x-3 bottom-[calc(10rem+var(--safe-bottom))] z-40 max-h-[60vh] overflow-y-auto rounded-xl bg-surface p-4 shadow-e3 sm:left-3 sm:right-auto sm:w-[400px] lg:bottom-20 lg:left-auto lg:right-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-[1.15rem] font-bold [font-stretch:90%]">Presenter tools</p>
                <p className="text-[0.9rem] text-ink-2">Plays PSMBFI's part in the demo: moves a request to its next step.</p>
              </div>
              <button type="button" aria-label="Close presenter tools" onClick={() => setOpen(false)} className="btn btn-ghost btn-icon btn-sm">
                <span className="btn-label"><X size={18} weight="bold" /></span>
              </button>
            </div>
            <ul className="mt-4 space-y-2.5">
              {openLoans.map((l) => {
                const next = LOAN_NEXT[l.status]!;
                return (
                  <li key={l.id} className="rounded-lg bg-sunken p-3">
                    <p className="font-semibold">{LOAN_PRODUCT_BY_ID[l.productId].name} · {l.id}</p>
                    <p className="text-[0.9rem] text-ink-2">Now: {LOAN_STATUS[l.status].label}</p>
                    <Button size="sm" variant="tonal" className="mt-2" icon={<FastForward size={16} weight="bold" />} onClick={() => { setLoanStatus(l.id, next, { name: "PSMBFI Loans (demo)", role: "Presenter" }); toast(`Moved to: ${LOAN_STATUS[next].label}`); }}>
                      Move to {LOAN_STATUS[next].label.toLowerCase()}
                    </Button>
                  </li>
                );
              })}
              {openClaims.map((c) => {
                const next = CLAIM_NEXT[c.status]!;
                return (
                  <li key={c.id} className="rounded-lg bg-sunken p-3">
                    <p className="font-semibold">{BENEFIT_BY_ID[c.type].name} · {c.id}</p>
                    <p className="text-[0.9rem] text-ink-2">Now: {CLAIM_STATUS[c.status].label}</p>
                    <Button size="sm" variant="tonal" className="mt-2" icon={<FastForward size={16} weight="bold" />} onClick={() => { setClaimStatus(c.id, next, { name: "PSMBFI Claims (demo)", role: "Presenter" }); toast(`Moved to: ${CLAIM_STATUS[next].label}`); }}>
                      Move to {CLAIM_STATUS[next].label.toLowerCase()}
                    </Button>
                  </li>
                );
              })}
              {openLoans.length + openClaims.length === 0 && <li className="rounded-lg bg-sunken p-3 text-ink-2">No open loans or claims. Apply for a loan or file a claim first.</li>}
            </ul>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setOn(false); setOpen(false); }}>
              Turn off presenter tools
            </Button>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
