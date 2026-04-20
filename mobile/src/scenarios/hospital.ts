import { Scenario } from "../types";
import { sharedEndings } from "./shared";

export const hospitalScenario: Scenario = {
  id: "hospital",
  name: "The ER Bill",
  who: "Marcus Webb · 23 · uninsured",
  desc: "A 3 AM kidney stone. No insurance. Navigate triage decisions, billing codes, and payment plans without going bankrupt.",
  estimatedTime: "~8 decisions",
  startMoney: 1800,
  defaultName: "Marcus Webb",
  accent: "#2ED573",
  startSceneId: "intro",
  scenes: {
    intro: {
      title: "3:14 AM · stabbing pain",
      text: () =>
`You wake up with pain on your right side like someone's screwdriver-ing you. Can't stand up straight. Nauseous. Your roommate knocks: "Should I drive you?"

You're 23, contractor at a design agency, no employer insurance. You looked at Marketplace plans last October and never finished enrolling. Bank account: $1,800.`,
      choices: [
        { label: "Call a nurse hotline first (free with most Marketplace plans; also 988, or Teladoc if you have it).",
          kind: "good",
          feedback: "Nurse hotlines triage fast. If it's a stone, they'll tell you urgent care or ER based on symptoms. Saves $1,500 if you can skip the ER.",
          effects: { wellbeing: 4, addFlags: ["triaged"] }, nextId: "choose_care" },
        { label: "Drive straight to the ER.",
          kind: "mid",
          feedback: "Kidney stones usually aren't life-threatening, but the pain is severe. ER is valid; it's also 5–10× the cost of urgent care.",
          effects: { wellbeing: -2 }, nextId: "er_visit" },
        { label: "Tough it out. Take ibuprofen and sleep.",
          kind: "bad",
          feedback: "Kidney stones can cause infection and permanent damage if they block the ureter > 48 hours. Urinary sepsis is life-threatening.",
          effects: { health: -15, wellbeing: -8, schedule: [[2, "got_worse"]] }, nextId: "choose_care" },
        { label: "Check into urgent care first; ER only if they send you.",
          kind: "good",
          feedback: "Smart escalation. Urgent care visit: ~$200 without insurance. If they suspect a stone, they'll refer you.",
          effects: { money: -200, wellbeing: 6, addFlags: ["tried_uc"] }, nextId: "choose_care" },
      ],
    },
    choose_care: {
      title: "The nurse says: CT scan needed",
      text: () =>
`Nurse confirms: pain pattern plus hematuria = probable stone. "You'll need imaging. ER is fastest but expensive; some imaging centers do walk-in CT for $300–800 cash."`,
      choices: [
        { label: "Drive to a standalone imaging center. Walk-in CT for $450.",
          kind: "good",
          feedback: "Freestanding imaging centers cost 60–80% less than hospital radiology for the same scan. Shop around when possible.",
          effects: { money: -450, wellbeing: 6 }, nextId: "billing" },
        { label: "ER. You want it over with.",
          kind: "mid",
          feedback: "ER gives you IV fluids, pain meds, imaging, discharge in ~4 hours. Bill will be $3,000–8,000.",
          effects: { wellbeing: 2 }, nextId: "er_visit" },
        { label: "Tell the nurse you can't afford care. Ask about charity programs.",
          kind: "good",
          feedback: "Nonprofit hospitals (most) are required by law to offer charity care at certain income levels. Ask before the visit, not after.",
          effects: { wellbeing: 8, addFlags: ["asked_charity"] }, nextId: "er_visit" },
      ],
    },
    er_visit: {
      title: "ER · discharge · a paper bill",
      text: () =>
`Three bags of saline, morphine, CT, and 4 hours later: stone confirmed, will pass on its own, discharged with a prescription. Bill breakdown (arrives 5 weeks later):

• Facility fee: $4,200
• Physician fee (separate): $1,800
• Radiology read: $850
• Pharmacy (morphine, toradol): $380
• "Administration fee": $425
TOTAL: $7,655 (uninsured rate)`,
      choices: [
        { label: "Request the itemized bill and compare each line to Medicare rate. Negotiate down.",
          kind: "good",
          feedback: "Uninsured rates are 2–4× Medicare rates. Asking for the itemized bill + citing Medicare rates routinely cuts bills 40–70%.",
          effects: { money: -2700, wellbeing: 10, addFlags: ["negotiated_bill"] }, nextId: "followup" },
        { label: "Apply for hospital financial assistance — you're under 300% FPL.",
          kind: "good",
          feedback: "Under the ACA, nonprofit hospitals must have financial assistance policies. You likely qualify for 80–100% forgiveness.",
          effects: { money: -600, wellbeing: 12, addFlags: ["charity_care"] }, nextId: "followup" },
        { label: "Set up a payment plan at $100/month and just pay it.",
          kind: "mid",
          feedback: "Most hospitals offer interest-free payment plans. Valid option, but you're paying rates you could have fought.",
          effects: { money: -100, wellbeing: -3 }, nextId: "followup" },
        { label: "Ignore it. The bill doesn't matter yet.",
          kind: "bad",
          feedback: "Medical debt DOES sell to collectors. Under new FICO rules, medical debt under $500 no longer affects credit — but $7,655 does.",
          effects: { wellbeing: -12, law: 10, addFlags: ["medical_collections"], schedule: [[3, "collections_call"]] }, nextId: "followup" },
      ],
    },
    followup: {
      title: "One month later · the insurance conversation",
      text: () =>
`Your pain is gone. Your bank account isn't. Open enrollment ends Dec 15. Your options:
• ACA Marketplace Bronze — subsidized premium likely $0–$75/month at your income
• "Health sharing ministry" — $89/month, unregulated
• Short-term plan — $120/month, doesn't cover pre-existing
• Skip it — you rarely get sick`,
      choices: [
        { label: "Apply on healthcare.gov. Likely free or near-free with subsidies.",
          kind: "good",
          feedback: "At your income you likely qualify for cost-sharing reductions on Silver plans too, making out-of-pocket costs minimal.",
          effects: { money: -50, wellbeing: 15, addFlags: ["insured"] }, nextId: "finale" },
        { label: "Sign up for the health sharing ministry.",
          kind: "bad",
          feedback: "Sharing ministries aren't insurance, aren't regulated, and routinely deny. You're one kidney stone away from uninsured again.",
          effects: { money: -89, wellbeing: -5, addFlags: ["fake_insurance"] }, nextId: "finale" },
        { label: "Short-term plan — the cheap headline number.",
          kind: "mid",
          feedback: "Short-term plans have 3–12 month limits, skip essential benefits, deny pre-existing conditions. Kidney stones = now a 'pre-existing condition.'",
          effects: { money: -120, wellbeing: -4, addFlags: ["thin_insurance"] }, nextId: "finale" },
        { label: "Skip it. You'll enroll later if something happens.",
          kind: "bad",
          feedback: "Open enrollment has hard deadlines (Nov 1–Dec 15/Jan 15 in most states). You can't buy coverage after you get sick — that's literally the point.",
          effects: { wellbeing: -8, addFlags: ["uninsured"] }, nextId: "finale" },
      ],
    },

    got_worse: {
      title: "⚠ Two days later · worse",
      text: () =>
`Fever 102.4°F. Vomiting. You can't keep water down. Stone blocked the ureter and it's infected.`,
      choices: [
        { label: "911. Get to the ER now.",
          kind: "good",
          feedback: "Urinary sepsis from an obstructed stone is a true emergency. This is when the ER is always worth it.",
          effects: { money: -4000, health: 8, wellbeing: -4 }, nextId: null },
        { label: "Keep toughing it out.",
          kind: "bad",
          feedback: "Sepsis has ~10% mortality. The hospital could have fixed this with a stent placement and antibiotics.",
          effects: { health: -60, wellbeing: -20 }, nextId: "ending_hospital" },
      ],
    },
    collections_call: {
      title: "⚠ Collections agent calls",
      text: () =>
`'Capital Recovery Systems' is on your phone daily. They claim you owe $9,200 (original $7,655 + 'fees' and interest).`,
      choices: [
        { label: "Request validation in writing. Many collectors can't produce it.",
          kind: "good",
          feedback: "FDCPA requires validation on request. Many accounts are dropped when challenged. Medical bills especially have documentation errors.",
          effects: { wellbeing: 6, law: -10, rmFlags: ["medical_collections"] }, nextId: null },
        { label: "Agree to a settlement at $5,000.",
          kind: "mid",
          feedback: "Collections often settle at 30–50% of face. Document everything in writing before paying.",
          effects: { money: -5000, wellbeing: -3, rmFlags: ["medical_collections"] }, nextId: null },
        { label: "Ignore the calls.",
          kind: "bad",
          feedback: "They'll sue in small-claims court. Default judgment = wage garnishment.",
          effects: { wellbeing: -15, law: 20 }, nextId: null },
      ],
    },

    ending_good: {
      title: "YOU NAVIGATED IT",
      text: s => `${s.charName}, six months later. Insured. Bill settled. No collections on your credit. You know what "facility fee" means and that it's negotiable.\n\nThe US healthcare system punishes the unprepared. You prepared.`,
      ending: true, endingKind: "good",
    },
    ending_mid: {
      title: "PAID MORE THAN YOU HAD TO",
      text: s => `${s.charName}, six months later. You paid the bill. It took a chunk. You're still uninsured or under-insured.\n\nNext time: negotiate. Always.`,
      ending: true, endingKind: "mid",
    },
    ending_bad: {
      title: "MEDICAL DEBT SPIRAL",
      text: s => `${s.charName}, six months later. $9,200+ in collections. Credit score dropped 120 points. Can't rent the apartment you wanted.\n\nOne untreated stone turned into a multi-year financial scar.`,
      ending: true, endingKind: "bad",
    },
    ...sharedEndings,

    finale: {
      title: "Six months later",
      text: () => `Let's see how the recovery went.`,
      choices: [
        { label: "Continue...", kind: "mid", feedback: "", effects: {},
          next: s => {
            if (s.flags.has("medical_collections")) return "ending_bad";
            if (s.flags.has("insured") && (s.flags.has("negotiated_bill") || s.flags.has("charity_care"))) return "ending_good";
            if (s.flags.has("insured") || s.flags.has("charity_care")) return "ending_good";
            if (s.flags.has("uninsured") || s.flags.has("fake_insurance")) return "ending_mid";
            return "ending_mid";
          }
        },
      ],
    },
  },
};
