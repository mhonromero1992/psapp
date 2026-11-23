import { cn } from "@/lib/cn";

export type Tone = "neutral" | "info" | "positive" | "caution" | "negative" | "brand";

const toneCls: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-2",
  info: "bg-primary-soft text-primary",
  positive: "bg-positive-soft text-positive",
  caution: "bg-caution-soft text-caution",
  negative: "bg-negative-soft text-negative",
  brand: "bg-blue-950 text-white dark:bg-blue-100 dark:text-blue-950",
};

/** A real status label (functional), with a shape cue so color is never the only signal. */
export function Badge({ tone = "neutral", children, className, dot = true }: { tone?: Tone; children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-xs px-2 text-[0.75rem] font-semibold leading-none", toneCls[tone], className)}>
      {dot && <StatusGlyph tone={tone} />}
      {children}
    </span>
  );
}

function StatusGlyph({ tone }: { tone: Tone }) {
  // Different shapes per tone: circle (info/neutral), check (positive), triangle (caution), cross (negative).
  if (tone === "positive")
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d="M2 5.2 4.1 7.2 8 2.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (tone === "caution")
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d="M5 1.5 9 8.5H1Z" fill="currentColor" />
      </svg>
    );
  if (tone === "negative")
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
        <path d="m2.5 2.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  return <span aria-hidden className="size-1.5 rounded-full bg-current" />;
}

/* Status vocabularies shared by every portal. */
import type { ClaimStatus, EnrolmentStatus, LoanStatus, PayoutStatus } from "@/data/types";

export const LOAN_STATUS: Record<LoanStatus, { label: string; fil: string; tone: Tone }> = {
  submitted: { label: "Submitted", fil: "Naisumite", tone: "info" },
  evaluation: { label: "In evaluation", fil: "Sinusuri", tone: "info" },
  approved: { label: "Approved", fil: "Aprubado", tone: "positive" },
  for_release: { label: "For release", fil: "Ire-release", tone: "caution" },
  released: { label: "Active", fil: "Aktibo", tone: "positive" },
  paid: { label: "Fully paid", fil: "Bayad na", tone: "neutral" },
  returned: { label: "Needs correction", fil: "May aayusin", tone: "caution" },
  rejected: { label: "Declined", fil: "Hindi naaprubahan", tone: "negative" },
};

export const CLAIM_STATUS: Record<ClaimStatus, { label: string; fil: string; tone: Tone }> = {
  submitted: { label: "Filed", fil: "Naisampa", tone: "info" },
  docs_review: { label: "Checking documents", fil: "Sinusuri ang dokumento", tone: "info" },
  evaluation: { label: "In evaluation", fil: "Sinusuri", tone: "info" },
  approved: { label: "Approved", fil: "Aprubado", tone: "positive" },
  for_payout: { label: "For payout", fil: "Ipapadala", tone: "caution" },
  paid: { label: "Paid", fil: "Bayad na", tone: "positive" },
  returned: { label: "Needs a document", fil: "Kulang ang dokumento", tone: "caution" },
  denied: { label: "Denied", fil: "Hindi naaprubahan", tone: "negative" },
};

export const ENROLMENT_STATUS: Record<EnrolmentStatus, { label: string; tone: Tone }> = {
  submitted: { label: "Submitted", tone: "info" },
  id_check: { label: "ID check", tone: "info" },
  for_approval: { label: "For approval", tone: "caution" },
  approved: { label: "Approved", tone: "positive" },
  returned: { label: "Returned", tone: "negative" },
};

export const PAYOUT_STATUS: Record<PayoutStatus, { label: string; tone: Tone }> = {
  queued: { label: "Queued", tone: "neutral" },
  for_approval: { label: "For approval", tone: "caution" },
  approved: { label: "Approved", tone: "info" },
  sent: { label: "Sent", tone: "info" },
  settled: { label: "Settled", tone: "positive" },
  failed: { label: "Failed", tone: "negative" },
};
