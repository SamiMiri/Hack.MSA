import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================================
// BUDGET BUILDER
// ============================================================
export type BudgetCategory = "needs" | "wants" | "savings";

export interface BudgetItem {
  id: string;
  label: string;
  category: BudgetCategory;
  amount: number; // monthly dollars
}

export interface Budget {
  income: number;      // monthly after-tax take-home
  items: BudgetItem[];
  updatedAt: number;
}

const BUDGET_KEY = "nextsteps_budget_v1";

export async function loadBudget(): Promise<Budget> {
  try {
    const raw = await AsyncStorage.getItem(BUDGET_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { income: 0, items: [], updatedAt: Date.now() };
}
export async function saveBudget(b: Budget) {
  b.updatedAt = Date.now();
  try { await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(b)); } catch {}
}
export function newBudgetItemId() { return "b_" + Math.random().toString(36).slice(2, 8); }

// Default starter categories so the tool isn't empty on first open.
export const BUDGET_STARTER_ITEMS: Omit<BudgetItem, "id">[] = [
  { label: "Rent / Housing", category: "needs", amount: 0 },
  { label: "Utilities", category: "needs", amount: 0 },
  { label: "Groceries", category: "needs", amount: 0 },
  { label: "Transportation", category: "needs", amount: 0 },
  { label: "Health insurance", category: "needs", amount: 0 },
  { label: "Phone / Internet", category: "needs", amount: 0 },
  { label: "Subscriptions", category: "wants", amount: 0 },
  { label: "Dining out", category: "wants", amount: 0 },
  { label: "Emergency fund", category: "savings", amount: 0 },
  { label: "Retirement (401k / IRA)", category: "savings", amount: 0 },
];

// ============================================================
// LEASE CHECKLIST
// ============================================================
export interface ChecklistSection {
  title: string;
  items: { id: string; label: string; note: string }[];
}

export const LEASE_CHECKLIST: ChecklistSection[] = [
  {
    title: "Before the showing",
    items: [
      { id: "scam_photos", label: "Reverse-image-search the listing photos", note: "Scammers steal photos from real listings in other cities. One Google Lens search kills most scams." },
      { id: "scam_payment", label: "Confirm no money is due before viewing", note: "Real landlords take fees AFTER touring. Zelle or wire to a personal account = scam." },
      { id: "scam_contact", label: "Got a phone number, not just email/text", note: "Scammers avoid voice. Real landlords or agents will pick up." },
    ],
  },
  {
    title: "During the showing",
    items: [
      { id: "water_pressure", label: "Ran every faucet, flushed every toilet", note: "Check for drips, slow drains, low pressure. Plumbing issues are expensive to live with." },
      { id: "outlets", label: "Tested at least 3 outlets with a phone charger", note: "Old wiring, GFCI failures, and dead circuits are common." },
      { id: "windows", label: "Opened every window", note: "Stuck / painted-shut windows are code violations in most states and fire hazards." },
      { id: "mold_check", label: "Looked under sinks, behind toilet, bathroom ceiling for mold / staining", note: "Water damage hides in corners. If you see black mold or bulging drywall, walk." },
      { id: "appliances", label: "Confirmed which appliances are included (fridge, washer/dryer, dishwasher)", note: "'Included' vs 'tenant responsibility' belongs in the lease, not a verbal agreement." },
    ],
  },
  {
    title: "In the lease itself",
    items: [
      { id: "rent_amount", label: "Monthly rent + ALL fees match what you were quoted", note: "Watch for 'amenity fees,' 'technology fees,' 'pet rent,' and automatic rent escalators." },
      { id: "deposit_cap", label: "Security deposit is within your state's legal cap", note: "Most states cap at 1–2 months' rent. 'First, last, and two months' is illegal in many places." },
      { id: "lease_term", label: "Lease term and renewal terms are clear", note: "Look for auto-renewal clauses and early-termination fees." },
      { id: "maintenance", label: "Maintenance response timeframes are defined", note: "'Reasonable time' is vague. Ask for specific windows (72h for urgent, 14 days for non-urgent)." },
      { id: "pet_terms", label: "Pet policy: deposit, rent, breed restrictions", note: "Non-refundable pet fees and monthly pet rent are common. Know before you sign." },
      { id: "guest_policy", label: "Guest / occupant policy", note: "Most leases cap guests at 14 days. Adding a roommate later requires written notice." },
      { id: "legal_fees", label: "Read the legal-fees clause", note: "Predatory leases require tenant to pay landlord's legal fees if the landlord sues. Strike this." },
      { id: "habitability", label: "Confirmed it mentions warranty of habitability or state code", note: "Almost every state requires this. Its absence isn't illegal, but it's a red flag." },
    ],
  },
  {
    title: "Before signing",
    items: [
      { id: "take_home", label: "Took the lease home to read overnight", note: "Any legit landlord will say yes. If they pressure you on the spot, walk." },
      { id: "cross_out", label: "Crossed out any clauses you won't accept and initialed", note: "Strike-through + mutual initial makes the change enforceable." },
      { id: "photos", label: "Took 50+ photos of the unit before move-in, timestamped", note: "This is your deposit insurance. Cover every wall, floor, fixture, appliance." },
      { id: "deposit_receipt", label: "Got a written receipt for security deposit", note: "Include the amount, date, and that it's refundable per state law." },
    ],
  },
];

// ============================================================
// TAX DOC TRACKER
// ============================================================
export interface TaxDocTemplate {
  id: string;
  name: string;
  fullName: string;
  deadline: string;       // display string like "Jan 31"
  deadlineSortKey: number; // day of year, for sorting
  who: string;            // "you" or who sends it
  description: string;
}

export const TAX_DOCS: TaxDocTemplate[] = [
  { id: "w2", name: "W-2", fullName: "W-2 Wage and Tax Statement",
    deadline: "Jan 31", deadlineSortKey: 31, who: "Your employer",
    description: "Issued by every W-2 employer you worked for in the tax year. Shows wages and tax withheld. Required for filing." },
  { id: "1099nec", name: "1099-NEC", fullName: "1099-NEC Nonemployee Compensation",
    deadline: "Jan 31", deadlineSortKey: 31, who: "Each client who paid you $600+ as a contractor",
    description: "Gig and freelance income $600+ per client. You owe self-employment tax on this." },
  { id: "1099k", name: "1099-K", fullName: "1099-K Payment Card / Third Party",
    deadline: "Jan 31", deadlineSortKey: 31, who: "Payment platforms (PayPal, Venmo business, etc.)",
    description: "Reports payments received via third-party platforms. Threshold is $5k for 2024, $2.5k for 2025, $600 long-term." },
  { id: "1099int", name: "1099-INT", fullName: "1099-INT Interest Income",
    deadline: "Jan 31", deadlineSortKey: 31, who: "Banks, HYSA providers",
    description: "Interest earned $10+ in the year. All interest is reportable regardless of amount." },
  { id: "1099div", name: "1099-DIV", fullName: "1099-DIV Dividends",
    deadline: "Jan 31", deadlineSortKey: 31, who: "Brokerages, mutual funds",
    description: "Dividend income from investments." },
  { id: "1099b", name: "1099-B", fullName: "1099-B Broker Proceeds",
    deadline: "Feb 15", deadlineSortKey: 46, who: "Brokerages",
    description: "Sales of stocks, ETFs, crypto. Capital gains/losses." },
  { id: "1098", name: "1098", fullName: "1098 Mortgage Interest Statement",
    deadline: "Jan 31", deadlineSortKey: 31, who: "Your mortgage lender",
    description: "Mortgage interest paid — deductible if you itemize." },
  { id: "1098t", name: "1098-T", fullName: "1098-T Tuition Statement",
    deadline: "Jan 31", deadlineSortKey: 31, who: "Your college / university",
    description: "Tuition paid. Required for American Opportunity Credit or Lifetime Learning Credit." },
  { id: "1098e", name: "1098-E", fullName: "1098-E Student Loan Interest",
    deadline: "Jan 31", deadlineSortKey: 31, who: "Your loan servicer (Nelnet, MOHELA, etc.)",
    description: "Student loan interest — up to $2,500 deductible above the line." },
  { id: "5498", name: "5498", fullName: "5498 IRA Contribution Info",
    deadline: "May 31", deadlineSortKey: 151, who: "Your IRA custodian",
    description: "Arrives AFTER you file. Shows IRA contributions made for the tax year. Useful for records." },
  { id: "1095", name: "1095-A/B/C", fullName: "Health Coverage Statement",
    deadline: "Jan 31", deadlineSortKey: 31, who: "ACA marketplace, employer, or insurer",
    description: "Health coverage proof. 1095-A is required if you got marketplace subsidies." },
];

export interface TaxDocState {
  [docId: string]: { received: boolean; notes: string };
}

const TAXDOCS_KEY = "nextsteps_taxdocs_v1";
const CHECKLIST_KEY = "nextsteps_checklist_v1";

export async function loadTaxDocs(): Promise<TaxDocState> {
  try {
    const raw = await AsyncStorage.getItem(TAXDOCS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
export async function saveTaxDocs(state: TaxDocState) {
  try { await AsyncStorage.setItem(TAXDOCS_KEY, JSON.stringify(state)); } catch {}
}

export async function loadChecklist(): Promise<Record<string, { checked: boolean; note: string }>> {
  try {
    const raw = await AsyncStorage.getItem(CHECKLIST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
export async function saveChecklist(state: Record<string, { checked: boolean; note: string }>) {
  try { await AsyncStorage.setItem(CHECKLIST_KEY, JSON.stringify(state)); } catch {}
}

// ============================================================
// BULK DATA (for export/reset in Settings)
// ============================================================
export async function exportAllData() {
  const keys = [
    "nextsteps_theme",
    "nextsteps_quiz_v1",
    "nextsteps_campaign_v1",
    "nextsteps_characters_v1",
    "nextsteps_levels_v1",
    "nextsteps_budget_v1",
    "nextsteps_taxdocs_v1",
    "nextsteps_checklist_v1",
    "nextsteps_profile_v1",
  ];
  const out: Record<string, any> = {};
  for (const k of keys) {
    try {
      const raw = await AsyncStorage.getItem(k);
      if (raw) out[k] = JSON.parse(raw);
    } catch {}
  }
  return out;
}

export async function importAllData(payload: Record<string, any>) {
  for (const [k, v] of Object.entries(payload)) {
    try { await AsyncStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch {}
  }
}

export async function resetEverything() {
  const keys = [
    "nextsteps_quiz_v1",
    "nextsteps_campaign_v1",
    "nextsteps_characters_v1",
    "nextsteps_levels_v1",
    "nextsteps_budget_v1",
    "nextsteps_taxdocs_v1",
    "nextsteps_checklist_v1",
    "nextsteps_profile_v1",
  ];
  for (const k of keys) {
    try { await AsyncStorage.removeItem(k); } catch {}
  }
}
