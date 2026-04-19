import { GameState, ModifierDef, ModifierGroup } from "./types";

export const modifierDefs: Record<string, ModifierDef> = {
  clean_record: { name: "Clean Record", neutral: true },
  juvenile_record: { name: "Sealed Juvenile Record", lawMult: 1.15 },
  criminal_record: { name: "Criminal Record", lawMult: 1.5 },

  citizen: { name: "U.S. Citizen", neutral: true },
  green_card: { name: "Permanent Resident", lawMult: 1.05 },
  f1_visa: { name: "F-1 International", lawMult: 1.3 },
  daca_recipient: { name: "DACA Recipient", lawMult: 1.2 },

  family_support: { name: "Supportive Family", neutral: true },
  estranged: { name: "Estranged from Family" },
  no_safety_net: { name: "No Safety Net" },
  caretaker: { name: "Caretaker for a Parent" },

  modest_savings: { name: "Modest Savings" },
  paycheck_to_paycheck: { name: "Paycheck to Paycheck", neutral: true },
  broke: { name: "Broke" },
  student_debt: { name: "Student Loan Debt" },

  healthy: { name: "Healthy", neutral: true },
  chronic_condition: { name: "Chronic Condition" },
  disability: { name: "Physical Disability" },
  uninsured_chronic: { name: "Chronic + Uninsured" },

  mentally_well: { name: "Mentally Well", neutral: true },
  anxiety: { name: "Anxiety Disorder" },
  depression_history: { name: "History of Depression" },
  neurodivergent: { name: "ADHD / Neurodivergent" },

  traditional_student: { name: "Traditional Student", neutral: true },
  first_gen_student: { name: "First-Generation Student" },
  returning_adult: { name: "Returning Adult Learner" },
  working_full_time: { name: "Working Full-Time" },
  homeless_history: { name: "Housing-Insecure" },

  finance_novice: { name: "No Financial Education", neutral: true },
  finance_savvy: { name: "Read a Finance Book" },
  scammed_before: { name: "Scammed Before" },
};

export const modifierGroups: ModifierGroup[] = [
  {
    id: "record", label: "Legal record", q: "Any legal trouble on your record?",
    opts: [
      { val: "clean_record", t: "No record", d: "Clean background. Hireable. Baseline." },
      { val: "juvenile_record", t: "Sealed juvenile", d: "Minor charge at 15, sealed. Law heat +15%." },
      { val: "criminal_record", t: "Misdemeanor at 17", d: "Shows on background checks. Law heat +50%." },
    ],
  },
  {
    id: "visa", label: "Citizenship", q: "What's on your paperwork?",
    opts: [
      { val: "citizen", t: "U.S. Citizen", d: "No visa restrictions." },
      { val: "green_card", t: "Permanent Resident", d: "Green card. Deportable for serious crimes." },
      { val: "f1_visa", t: "F-1 International", d: "On-campus work only, 20 hr/wk. Law heat +30%." },
      { val: "daca_recipient", t: "DACA Recipient", d: "Any arrest can jeopardize status. Law heat +20%." },
    ],
  },
  {
    id: "family", label: "Family support", q: "If things go sideways, who do you call?",
    opts: [
      { val: "family_support", t: "Supportive family", d: "Parents can bail you out once." },
      { val: "estranged", t: "Estranged from family", d: "No bailout. Slight ongoing wellbeing drain." },
      { val: "no_safety_net", t: "No safety net", d: "You're your own emergency contact. Wellbeing -1 per choice." },
      { val: "caretaker", t: "Caring for a parent", d: "-$10 and -1 wellbeing per choice." },
    ],
  },
  {
    id: "finance", label: "Financial starting point", q: "Where do you start money-wise?",
    opts: [
      { val: "modest_savings", t: "Modest savings", d: "+$500 buffer." },
      { val: "paycheck_to_paycheck", t: "Paycheck to paycheck", d: "Scenario default." },
      { val: "broke", t: "Broke", d: "-$400. Overdraft fees loom." },
      { val: "student_debt", t: "Student loans ($32k)", d: "Monthly payments grind on wellbeing." },
    ],
  },
  {
    id: "health", label: "Physical health", q: "How's your body holding up?",
    opts: [
      { val: "healthy", t: "Healthy", d: "Baseline." },
      { val: "chronic_condition", t: "Chronic condition", d: "Asthma / diabetes. -15 health start, slow drain." },
      { val: "disability", t: "Physical disability", d: "-20 health start. Fewer job options." },
      { val: "uninsured_chronic", t: "Chronic + Uninsured", d: "Worst case. Fast drain." },
    ],
  },
  {
    id: "mental", label: "Mental health", q: "What's your mental baseline?",
    opts: [
      { val: "mentally_well", t: "Mentally well", d: "Baseline." },
      { val: "anxiety", t: "Anxiety disorder", d: "-12 wellbeing start. Stress compounds." },
      { val: "depression_history", t: "Depression history", d: "-10 wellbeing start. Slow drain." },
      { val: "neurodivergent", t: "ADHD / Neurodivergent", d: "Paperwork hits harder." },
    ],
  },
  {
    id: "background", label: "Life situation", q: "What best describes you right now?",
    opts: [
      { val: "traditional_student", t: "Traditional student", d: "Baseline." },
      { val: "first_gen_student", t: "First-gen student", d: "No one to ask. Small wellbeing drain." },
      { val: "returning_adult", t: "Returning adult", d: "+$800 from working years." },
      { val: "working_full_time", t: "Working full-time", d: "+$600 but slow wellbeing drain." },
      { val: "homeless_history", t: "Housing-insecure", d: "-$300 start. Slow drain." },
    ],
  },
  {
    id: "finlit", label: "Financial literacy", q: "How prepared are you?",
    opts: [
      { val: "finance_novice", t: "No prep", d: "Baseline." },
      { val: "finance_savvy", t: "Read a finance book", d: "+5 wellbeing from confidence." },
      { val: "scammed_before", t: "Scammed before", d: "$400 lesson at 17. You're wary." },
    ],
  },
];

export function hasMod(s: GameState, key: string): boolean {
  return s.modifiers.has(key);
}

export function lawTick(s: GameState, base: number): number {
  let v = base;
  if (hasMod(s, "criminal_record")) v *= 1.5;
  if (hasMod(s, "juvenile_record")) v *= 1.15;
  if (hasMod(s, "f1_visa")) v *= 1.3;
  if (hasMod(s, "daca_recipient")) v *= 1.2;
  if (hasMod(s, "green_card")) v *= 1.05;
  return Math.round(v);
}

export function applyStartingModifiers(s: GameState) {
  const m = s.modifiers;
  if (m.has("chronic_condition")) s.health -= 15;
  if (m.has("disability")) s.health -= 20;
  if (m.has("uninsured_chronic")) { s.health -= 20; s.money = Math.round(s.money * 0.9); }
  if (m.has("anxiety")) s.wellbeing -= 12;
  if (m.has("depression_history")) s.wellbeing -= 10;
  if (m.has("modest_savings")) s.money += 500;
  if (m.has("broke")) s.money -= 400;
  if (m.has("returning_adult")) s.money += 800;
  if (m.has("working_full_time")) s.money += 600;
  if (m.has("homeless_history")) s.money -= 300;
  if (m.has("finance_savvy")) s.wellbeing += 5;
  s.health = Math.max(1, Math.min(100, s.health));
  s.wellbeing = Math.max(1, Math.min(100, s.wellbeing));
  s.money = Math.max(0, s.money);
}

export function applyPassiveDrains(s: GameState) {
  const m = s.modifiers;
  if (m.has("no_safety_net")) s.wellbeing -= 1;
  if (m.has("caretaker")) { s.money -= 10; s.wellbeing -= 1; }
  if (m.has("estranged")) s.wellbeing -= 0.5;
  if (m.has("student_debt")) s.wellbeing -= 0.5;
  if (m.has("chronic_condition")) s.health -= 0.5;
  if (m.has("disability")) s.health -= 0.3;
  if (m.has("uninsured_chronic")) s.health -= 0.8;
  if (m.has("anxiety")) s.wellbeing -= 0.5;
  if (m.has("depression_history")) s.wellbeing -= 0.4;
  if (m.has("neurodivergent")) s.wellbeing -= 0.2;
  if (m.has("first_gen_student")) s.wellbeing -= 0.3;
  if (m.has("working_full_time")) s.wellbeing -= 0.3;
  if (m.has("homeless_history")) s.wellbeing -= 0.5;
  s.health = Math.max(0, Math.round(s.health * 10) / 10);
  s.wellbeing = Math.max(0, Math.round(s.wellbeing * 10) / 10);
}
