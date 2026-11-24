/* Domain model for PS-ACCESS. One member record is shared by every portal. */

export type AgencyCode =
  | "PNP" | "BFP" | "PCG" | "BuCor" | "BI" | "OTS" | "MMDA" | "LTO"
  | "NAMRIA" | "PPSC" | "DENR" | "NAPOLCOM" | "PDEA" | "LTFRB" | "SBMA" | "PNPA";

export interface Agency {
  code: AgencyCode;
  name: string;
  /** Mostly uniformed personnel (true) or mostly civilian (false). */
  uniformed: boolean;
  payrollOffice: string;
}

export interface Office {
  id: string; // "HO", "RSO-NCR", "RSO-07"
  name: string;
  region: string;
  city: string;
  street: string;
  hours: string;
  kind: "head" | "rso";
}

export type MemberStatus = "active" | "pending" | "lapsed" | "retired";

export interface Beneficiary {
  id: string;
  name: string;
  relation: "Spouse" | "Child" | "Parent" | "Sibling";
  birthDate: string;
  share: number; // percent
  dependentCover: boolean; // Dependent's free insurance designee
}

export interface PayoutAccount {
  id: string;
  kind: "bank" | "ewallet";
  provider: string;
  accountName: string;
  accountNo: string;
  primary: boolean;
  verified: boolean;
}

export interface Member {
  id: string; // PSM-2012-004512
  firstName: string;
  middleInitial: string;
  lastName: string;
  sex: "F" | "M";
  birthDate: string;
  rank: string;
  category: "uniformed" | "civilian";
  agency: AgencyCode;
  unit: string;
  officeId: string;
  joinedAt: string; // ISO date
  status: MemberStatus;
  basePay: number; // monthly, PHP
  mobile: string;
  email: string;
  city: string;
  province: string;
  beneficiaries: Beneficiary[];
  payoutAccounts: PayoutAccount[];
  atdOnFile: boolean;
  kycVerified: boolean;
  dpaConsentAt: string | null;
  /** Months with no ATD posting in the last 12 months. */
  missedMonths: number;
}

export interface Contribution {
  period: string; // YYYY-MM
  amount: number;
  postedAt: string;
  source: "ATD" | "Over the counter" | "Online";
  reference: string;
}

export type LoanProductId = "SLP" | "KAB" | "EML" | "CAL" | "MPL" | "POL";

export interface LoanProduct {
  id: LoanProductId;
  name: string;
  short: string;
  purpose: string;
  purposeFil: string;
  /** null means the ceiling is 90% of Equity Value (Policy Loan). */
  maxAmount: number | null;
  minAmount: number;
  rate: number; // annual
  terms: number[]; // allowed months
  processingDays: number;
  eligibility: string[];
  requirements: string[];
  /** Ribbon stripes for the product insignia. */
  ribbon: string[];
}

export type LoanStatus =
  | "submitted" | "evaluation" | "approved" | "for_release" | "released" | "paid" | "returned" | "rejected";

export interface TimelineEvent {
  at: string;
  label: string;
  by?: string;
  note?: string;
}

export interface Loan {
  id: string;
  memberId: string;
  productId: LoanProductId;
  principal: number;
  rate: number;
  termMonths: number;
  monthly: number;
  purpose: string;
  appliedAt: string;
  status: LoanStatus;
  channel: "Member App" | "Member portal" | "RSO counter";
  officeId: string;
  payoutAccountId: string | null;
  payoutLabel: string;
  releasedAt: string | null;
  paidInstallments: number;
  balance: number;
  timeline: TimelineEvent[];
  makerName: string | null;
  checkerName: string | null;
  risk: "low" | "medium" | "high";
}

export type ClaimType = "AHB" | "IHB" | "WIA" | "KIA" | "DEATH" | "DISABILITY" | "DFI" | "MER";

export interface BenefitType {
  id: ClaimType;
  name: string;
  nameFil: string;
  description: string;
  /** Sample schedule shown in the prototype. */
  schedule: string;
  documents: string[];
  filer: "member" | "beneficiary";
}

export type ClaimStatus =
  | "submitted" | "docs_review" | "evaluation" | "approved" | "for_payout" | "paid" | "returned" | "denied";

export interface ClaimDocument {
  id: string;
  name: string;
  kind: string;
  status: "received" | "verified" | "reupload";
  /** Data URL for photos the member attached in this session. */
  preview?: string;
}

export interface Claim {
  id: string;
  memberId: string;
  type: ClaimType;
  claimantName: string;
  claimantRelation: "Member" | "Spouse" | "Child" | "Parent" | "Sibling";
  incidentDate: string;
  filedAt: string;
  amountClaimed: number;
  amountApproved: number | null;
  status: ClaimStatus;
  documents: ClaimDocument[];
  timeline: TimelineEvent[];
  description: string;
  confinementDays?: number;
  hospital?: string;
  assignee: string;
  payoutLabel: string;
  officeId: string;
}

export type EnrolmentStatus = "submitted" | "id_check" | "for_approval" | "approved" | "returned";

export interface Enrolment {
  id: string;
  firstName: string;
  lastName: string;
  middleInitial: string;
  rank: string;
  agency: AgencyCode;
  unit: string;
  basePay: number;
  mobile: string;
  email: string;
  submittedAt: string;
  status: EnrolmentStatus;
  via: "Member App" | "Agency coordinator" | "RSO counter";
  idType: string;
  idMatch: number; // 0-1 face/ID match score
  mafSigned: boolean;
  atdSigned: boolean;
  beneficiaries: number;
  note?: string;
}

export type PayoutStatus = "queued" | "for_approval" | "approved" | "sent" | "settled" | "failed";

export interface Payout {
  id: string;
  memberId: string;
  memberName: string;
  kind: "Loan proceeds" | "Claim benefit" | "Refund" | "Experience refund";
  refId: string;
  amount: number;
  provider: string;
  channel: "bank" | "ewallet";
  account: string;
  status: PayoutStatus;
  batchId: string | null;
  createdAt: string;
  settledAt: string | null;
  reference: string | null;
}

export interface AppNotification {
  id: string;
  audience: "member";
  targetId: string; // member id
  title: string;
  titleFil?: string;
  body: string;
  bodyFil?: string;
  at: string;
  read: boolean;
  link: string | null;
  tone: "info" | "positive" | "caution" | "negative";
}

export interface AssistRequest {
  id: string;
  memberId: string;
  kind: "legal" | "travel";
  topic: string;
  details: string;
  preferredDate: string | null;
  status: "received" | "scheduled" | "in_progress" | "closed";
  createdAt: string;
  handler: string | null;
  nextStep: string | null;
}
