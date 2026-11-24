import type { Agency, AgencyCode, BenefitType, LoanProduct, Office } from "./types";

/* Reference data. Agencies, benefit types and loan products come from the PS-ACCESS
   proposal and PSMBFI's published product pages. Amounts, rates and schedules are
   SAMPLE values for the prototype and must be confirmed with PSMBFI before go-live. */

export const AGENCIES: Agency[] = [
  { code: "PNP", name: "Philippine National Police", uniformed: true, payrollOffice: "PNP Finance Service" },
  { code: "BFP", name: "Bureau of Fire Protection", uniformed: true, payrollOffice: "BFP Finance Service" },
  { code: "PCG", name: "Philippine Coast Guard", uniformed: true, payrollOffice: "PCG Finance Service" },
  { code: "BuCor", name: "Bureau of Corrections", uniformed: true, payrollOffice: "BuCor Finance Division" },
  { code: "BI", name: "Bureau of Immigration", uniformed: false, payrollOffice: "BI Finance Section" },
  { code: "OTS", name: "Office for Transportation Security", uniformed: false, payrollOffice: "OTS Accounting Division" },
  { code: "MMDA", name: "Metropolitan Manila Development Authority", uniformed: false, payrollOffice: "MMDA Payroll Section" },
  { code: "LTO", name: "Land Transportation Office", uniformed: false, payrollOffice: "LTO Finance Division" },
  { code: "NAMRIA", name: "National Mapping and Resource Information Authority", uniformed: false, payrollOffice: "NAMRIA Accounting" },
  { code: "PPSC", name: "Philippine Public Safety College", uniformed: true, payrollOffice: "PPSC Finance Division" },
  { code: "DENR", name: "Department of Environment and Natural Resources", uniformed: false, payrollOffice: "DENR Payroll Unit" },
  { code: "NAPOLCOM", name: "National Police Commission", uniformed: false, payrollOffice: "NAPOLCOM Finance Service" },
  { code: "PDEA", name: "Philippine Drug Enforcement Agency", uniformed: true, payrollOffice: "PDEA Finance Service" },
  { code: "LTFRB", name: "Land Transportation Franchising and Regulatory Board", uniformed: false, payrollOffice: "LTFRB Accounting" },
  { code: "SBMA", name: "Subic Bay Metropolitan Authority", uniformed: false, payrollOffice: "SBMA Payroll" },
  { code: "PNPA", name: "Philippine National Police Academy", uniformed: true, payrollOffice: "PNPA Finance Division" },
];

export const AGENCY_BY_CODE = Object.fromEntries(AGENCIES.map((a) => [a.code, a])) as Record<AgencyCode, Agency>;

/** Sample office network. The Head Office address is PSMBFI's published street and district. */
export const OFFICES: Office[] = [
  { id: "HO", name: "Head Office", region: "NCR", city: "San Juan City", street: "Santolan Road, West Crame", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "head" },
  { id: "RSO-NCR", name: "RSO National Capital Region", region: "NCR", city: "Quezon City", street: "EDSA, Camp Crame area", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-01", name: "RSO Region I", region: "Ilocos", city: "San Fernando, La Union", street: "Quezon Avenue", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-CAR", name: "RSO Cordillera", region: "CAR", city: "Baguio City", street: "Session Road", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-02", name: "RSO Region II", region: "Cagayan Valley", city: "Tuguegarao City", street: "Bonifacio Street", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-03", name: "RSO Region III", region: "Central Luzon", city: "San Fernando, Pampanga", street: "Jose Abad Santos Avenue", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-4A", name: "RSO Region IV-A", region: "CALABARZON", city: "Calamba City", street: "National Highway, Parian", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-05", name: "RSO Region V", region: "Bicol", city: "Legazpi City", street: "Rizal Street", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-06", name: "RSO Region VI", region: "Western Visayas", city: "Iloilo City", street: "General Luna Street", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-07", name: "RSO Region VII", region: "Central Visayas", city: "Cebu City", street: "Osmeña Boulevard", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-08", name: "RSO Region VIII", region: "Eastern Visayas", city: "Tacloban City", street: "Real Street", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-09", name: "RSO Region IX", region: "Zamboanga Peninsula", city: "Zamboanga City", street: "Veterans Avenue", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-10", name: "RSO Region X", region: "Northern Mindanao", city: "Cagayan de Oro", street: "Corrales Avenue", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-11", name: "RSO Region XI", region: "Davao", city: "Davao City", street: "J.P. Laurel Avenue", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-12", name: "RSO Region XII", region: "SOCCSKSARGEN", city: "Koronadal City", street: "General Santos Drive", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
  { id: "RSO-13", name: "RSO Caraga", region: "Caraga", city: "Butuan City", street: "J.C. Aquino Avenue", hours: "Mon to Fri, 8:00 AM to 5:00 PM", kind: "rso" },
];

export const OFFICE_BY_ID = Object.fromEntries(OFFICES.map((o) => [o.id, o])) as Record<string, Office>;

const BRAND = { blue: "#1054a4", green: "#009444", red: "#ec1c24", navy: "#0a2a52", white: "#f4f6fa", gold: "#c9a227" };

/** Six loan products. Names from PSMBFI; terms are SAMPLE values for the prototype. */
export const LOAN_PRODUCTS: LoanProduct[] = [
  {
    id: "SLP",
    name: "Salary Loan Plus",
    short: "Salary Plus",
    purpose: "Education, a small business or consolidating debts, paid through salary deduction.",
    purposeFil: "Para sa pag-aaral, maliit na negosyo o pagsasama-sama ng utang, bayad sa salary deduction.",
    maxAmount: 500_000,
    minAmount: 20_000,
    rate: 0.1,
    terms: [12, 24, 36, 48, 60],
    processingDays: 5,
    eligibility: ["Active member with ATD on file", "At least 12 monthly contributions", "Net take-home pay stays within agency limits"],
    requirements: ["Latest payslip", "Valid government ID", "Signed promissory note (e-signed in app)"],
    ribbon: [BRAND.blue, BRAND.white, BRAND.blue],
  },
  {
    id: "KAB",
    name: "Kabalikat Loan",
    short: "Kabalikat",
    purpose: "A quick loan for personal or family needs, released in days.",
    purposeFil: "Mabilis na loan para sa personal o pampamilyang pangangailangan.",
    maxAmount: 50_000,
    minAmount: 5_000,
    rate: 0.1,
    terms: [6, 12, 18, 24],
    processingDays: 2,
    eligibility: ["Active member", "At least 6 monthly contributions"],
    requirements: ["Valid government ID"],
    ribbon: [BRAND.green, BRAND.blue, BRAND.green],
  },
  {
    id: "EML",
    name: "Emergency Loan",
    short: "Emergency",
    purpose: "Cash for urgent medical or family emergencies.",
    purposeFil: "Pera para sa biglaang gastusing medikal o emergency ng pamilya.",
    maxAmount: 100_000,
    minAmount: 5_000,
    rate: 0.12,
    terms: [12, 24, 36, 48],
    processingDays: 2,
    eligibility: ["Active member", "At least 6 monthly contributions"],
    requirements: ["Valid government ID", "Proof of emergency (medical abstract or similar)"],
    ribbon: [BRAND.red, BRAND.white, BRAND.red],
  },
  {
    id: "CAL",
    name: "Calamity Loan",
    short: "Calamity",
    purpose: "Low-interest help for members living or assigned in declared calamity areas.",
    purposeFil: "Mababang interes para sa mga miyembrong nakatira o naka-assign sa lugar na may deklaradong kalamidad.",
    maxAmount: 40_000,
    minAmount: 5_000,
    rate: 0.05,
    terms: [12, 24, 36],
    processingDays: 2,
    eligibility: ["Resides or assigned in a declared calamity area", "Apply within 30 days of the declaration"],
    requirements: ["Valid government ID", "Certificate of residence or assignment"],
    ribbon: [BRAND.navy, BRAND.red, BRAND.navy],
  },
  {
    id: "MPL",
    name: "Multi-Purpose Loan",
    short: "Multi-Purpose",
    purpose: "Home repairs, appliances, tuition or other planned expenses.",
    purposeFil: "Pagpapaayos ng bahay, gamit sa bahay, matrikula at iba pang planadong gastos.",
    maxAmount: 60_000,
    minAmount: 10_000,
    rate: 0.1,
    terms: [12, 24, 36, 48],
    processingDays: 3,
    eligibility: ["Active member with ATD on file", "At least 12 monthly contributions"],
    requirements: ["Latest payslip", "Valid government ID"],
    ribbon: [BRAND.green, BRAND.white, BRAND.green],
  },
  {
    id: "POL",
    name: "Policy Loan",
    short: "Policy",
    purpose: "Borrow against your own Equity Value, up to 90% of it.",
    purposeFil: "Umutang gamit ang sarili mong Equity Value, hanggang 90% nito.",
    maxAmount: null,
    minAmount: 5_000,
    rate: 0.08,
    terms: [6, 12, 18, 24],
    processingDays: 1,
    eligibility: ["At least 12 months of MEP contributions", "No unpaid Policy Loan"],
    requirements: ["Valid government ID"],
    ribbon: [BRAND.blue, BRAND.gold, BRAND.blue],
  },
];

export const LOAN_PRODUCT_BY_ID = Object.fromEntries(LOAN_PRODUCTS.map((p) => [p.id, p])) as Record<string, LoanProduct>;

/** Benefit types from the proposal (AHB, IHB, KIA, WIA, death, disability, MER) plus the dependent cover. */
export const BENEFIT_TYPES: BenefitType[] = [
  {
    id: "AHB",
    name: "Accident Hospitalization Benefit",
    nameFil: "Benepisyo sa pagka-ospital dahil sa aksidente",
    description: "Daily cash for each day confined in hospital because of an accident.",
    schedule: "₱1,000 a day, up to 10 days per confinement (sample)",
    documents: ["Hospital certificate of confinement", "Medical abstract", "Police or incident report", "Valid ID"],
    filer: "member",
  },
  {
    id: "IHB",
    name: "Illness Hospitalization Benefit",
    nameFil: "Benepisyo sa pagka-ospital dahil sa sakit",
    description: "Daily cash for each day confined in hospital because of an illness.",
    schedule: "₱500 a day, up to 10 days per confinement (sample)",
    documents: ["Hospital certificate of confinement", "Medical abstract", "Valid ID"],
    filer: "member",
  },
  {
    id: "WIA",
    name: "Wounded in Action",
    nameFil: "Nasugatan sa tungkulin",
    description: "Cash benefit for injuries sustained in the line of duty.",
    schedule: "₱50,000 major injury, ₱20,000 minor injury (sample)",
    documents: ["Spot report", "Medical certificate", "Certification from unit commander", "Valid ID"],
    filer: "member",
  },
  {
    id: "KIA",
    name: "Killed in Action",
    nameFil: "Nasawi sa tungkulin",
    description: "Benefit paid to beneficiaries when a member dies in the line of duty.",
    schedule: "Depends on rank and MEP coverage (sample)",
    documents: ["Death certificate", "Spot report", "Certification from unit commander", "Claimant's valid ID", "Proof of relationship"],
    filer: "beneficiary",
  },
  {
    id: "DEATH",
    name: "Death Benefit",
    nameFil: "Benepisyo sa pagkamatay",
    description: "Life insurance benefit paid to beneficiaries for death from any cause.",
    schedule: "Per MEP coverage (sample)",
    documents: ["Death certificate", "Claimant's valid ID", "Proof of relationship"],
    filer: "beneficiary",
  },
  {
    id: "DISABILITY",
    name: "Accidental Disablement",
    nameFil: "Kapansanan dahil sa aksidente",
    description: "Benefit for permanent disability caused by an accident.",
    schedule: "Per MEP schedule of disablement (sample)",
    documents: ["Medical certificate of disability", "Incident report", "Valid ID"],
    filer: "member",
  },
  {
    id: "DFI",
    name: "Dependent's Free Insurance",
    nameFil: "Libreng insurance ng dependent",
    description: "Life cover for the member's designated dependent while MEP membership is in good standing.",
    schedule: "₱50,000 (as stated on the membership form)",
    documents: ["Death certificate of dependent", "Proof of relationship", "Member's valid ID"],
    filer: "member",
  },
  {
    id: "MER",
    name: "Members' Experience Refund",
    nameFil: "Experience refund ng miyembro",
    description: "A refund to members drawn from the fund's net income of the preceding year.",
    schedule: "Declared yearly by the Board (sample)",
    documents: ["No documents needed when a payout account is on file"],
    filer: "member",
  },
];

export const BENEFIT_BY_ID = Object.fromEntries(BENEFIT_TYPES.map((b) => [b.id, b])) as Record<string, BenefitType>;

/** Payout channels: names only. Logos are not reproduced. */
export const BANKS = ["LANDBANK", "DBP", "BPI", "BDO", "Metrobank", "PNB", "Security Bank", "UnionBank"] as const;
export const EWALLETS = ["GCash", "Maya"] as const;

export const RANKS: Record<string, { ranks: [string, number][]; civilian: [string, number][]; units: string[] }> = {
  PNP: {
    ranks: [["Pat", 33_575], ["PCpl", 35_464], ["PSSg", 37_524], ["PMSg", 38_824], ["PSMS", 41_350], ["PCMS", 43_912], ["PEMS", 46_623], ["PLT", 52_017], ["PCPT", 59_257], ["PMAJ", 68_085]],
    civilian: [["Admin Aide IV", 21_211], ["Admin Assistant II", 25_586], ["Admin Officer II", 33_843]],
    units: ["Quezon City Police District", "Manila Police District", "Southern Police District", "Cebu City Police Office", "Davao City Police Office", "Pampanga PPO", "Laguna PPO", "Iloilo City Police Office", "Highway Patrol Group", "Police Regional Office 7"],
  },
  BFP: {
    ranks: [["FO1", 33_575], ["FO2", 35_464], ["FO3", 37_524], ["SFO1", 41_350], ["SFO2", 43_912], ["SFO3", 46_623], ["FINSP", 52_017], ["FSINSP", 59_257]],
    civilian: [["Admin Assistant III", 27_000]],
    units: ["BFP National Headquarters", "BFP NCR", "BFP Region VII", "BFP Region XI", "Quezon City Fire District", "Manila Fire District"],
  },
  PCG: {
    ranks: [["ASN", 33_575], ["SN2", 35_464], ["SN1", 37_524], ["PO3", 41_350], ["PO2", 43_912], ["PO1", 46_623], ["ENS", 52_017], ["LTJG", 59_257]],
    civilian: [["Admin Officer I", 30_000]],
    units: ["Coast Guard District NCR-Central Luzon", "Coast Guard District Central Visayas", "Coast Guard District Southeastern Mindanao", "PCG Station Manila"],
  },
  BuCor: {
    ranks: [["CO1", 33_575], ["CO2", 35_464], ["CO3", 37_524], ["SCO1", 41_350]],
    civilian: [["Admin Aide VI", 23_000]],
    units: ["New Bilibid Prison", "Correctional Institution for Women", "Davao Prison and Penal Farm"],
  },
  PDEA: {
    ranks: [["IO1", 36_619], ["IO2", 40_208], ["IO3", 45_138], ["SIO1", 51_357]],
    civilian: [["Admin Officer III", 38_413]],
    units: ["PDEA National Headquarters", "PDEA Regional Office VII", "PDEA Regional Office XI"],
  },
  PPSC: { ranks: [["Instructor I", 36_619], ["Instructor II", 40_208]], civilian: [["Admin Officer II", 33_843]], units: ["PPSC Main Campus", "National Police College"] },
  PNPA: { ranks: [["PCpl", 35_464], ["PSSg", 37_524], ["PCPT", 59_257]], civilian: [["Admin Assistant II", 25_586]], units: ["PNPA Camp Castañeda"] },
  BI: { ranks: [["Immigration Officer I", 36_619], ["Immigration Officer II", 43_030]], civilian: [["Admin Aide IV", 21_211]], units: ["NAIA Terminal 3", "Mactan-Cebu Port", "BI Main Office"] },
  OTS: { ranks: [["Security Screening Officer I", 27_000], ["Security Screening Officer II", 31_320]], civilian: [["Admin Assistant I", 23_877]], units: ["NAIA Terminal 1", "Clark International Airport", "Mactan-Cebu International Airport"] },
  MMDA: { ranks: [["Traffic Enforcer I", 21_211], ["Traffic Enforcer II", 23_877], ["Traffic Enforcer III", 27_000]], civilian: [["Admin Aide VI", 23_000]], units: ["Traffic Discipline Office", "Road Emergency Group"] },
  LTO: { ranks: [["Transportation Regulation Officer I", 27_000], ["Law Enforcement Officer I", 31_320]], civilian: [["Admin Assistant II", 25_586]], units: ["LTO Central Office", "LTO NCR East"] },
  NAMRIA: { ranks: [], civilian: [["Engineer II", 43_030], ["Cartographer II", 36_619], ["Admin Officer II", 33_843]], units: ["Mapping and Geodesy Branch", "Hydrography Branch"] },
  DENR: { ranks: [["Forest Ranger", 23_877]], civilian: [["Environmental Management Specialist II", 43_030], ["Admin Officer II", 33_843]], units: ["DENR Central Office", "CENRO Antipolo"] },
  NAPOLCOM: { ranks: [], civilian: [["Admin Officer III", 38_413], ["Attorney III", 69_963]], units: ["NAPOLCOM Central Office", "NAPOLCOM Regional Office VII"] },
  LTFRB: { ranks: [], civilian: [["Transportation Development Officer II", 36_619], ["Admin Assistant II", 25_586]], units: ["LTFRB Central Office"] },
  SBMA: { ranks: [["Law Enforcement Officer", 31_320], ["Fire Officer", 31_320]], civilian: [["Admin Officer I", 30_000]], units: ["SBMA Law Enforcement Department", "SBMA Fire Department"] },
};

/** Share of the sample membership per agency (sums to 1). */
export const AGENCY_WEIGHTS: [AgencyCode, number][] = [
  ["PNP", 0.52], ["BFP", 0.12], ["PCG", 0.08], ["BuCor", 0.05], ["PDEA", 0.03], ["BI", 0.03], ["OTS", 0.03], ["MMDA", 0.03],
  ["LTO", 0.02], ["PNPA", 0.015], ["PPSC", 0.015], ["DENR", 0.02], ["NAMRIA", 0.01], ["NAPOLCOM", 0.01], ["LTFRB", 0.01], ["SBMA", 0.01],
];

/** MEP: 3% of base pay (proposal and PSMBFI briefings). */
export const MEP_RATE = 0.03;
