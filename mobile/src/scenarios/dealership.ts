import { Scenario } from "../types";
import { sharedEndings } from "./shared";

export const dealershipScenario: Scenario = {
  id: "dealership",
  name: "The Dealership",
  who: "Lena Torres · 21 · first car purchase",
  desc: "You need wheels for your new job. The AutoNation salesman is smiling too much. Navigate financing, add-ons, and predatory markups.",
  estimatedTime: "~8 decisions",
  startMoney: 4800,
  defaultName: "Lena Torres",
  accent: "#0EA5E9",
  startSceneId: "intro",
  scenes: {
    intro: {
      title: "Saturday · 10:14 AM · before the lot",
      text: () =>
`You start your new job in two weeks. Bus to get there: 90 minutes each way. You have $4,800 saved and a paid-off used Sentra quote from Facebook Marketplace for $7,200. Your dad texts: "don't let them upsell you."

You pull into AutoNation. Enrique waves. "We've got a 2026 Kia K4 marked at $39,000 — payments start at $327/month!"`,
      choices: [
        { label: "Before you walk in, check KBB fair-value for the K4 and pre-qualify at your credit union online.",
          kind: "good",
          feedback: "Pre-qualifying at a credit union gives you a rate ceiling — dealers know you can walk. Credit-union car loans average ~4% below dealer-arranged financing.",
          effects: { wellbeing: 8, law: -2, addFlags: ["prepared"] }, nextId: "showroom" },
        { label: "Walk the lot. Let Enrique show you the 'best deal.'",
          kind: "mid",
          feedback: "No prep work = dealer has full information asymmetry. Not fatal, but every markup is yours to fight.",
          effects: { wellbeing: 0 }, nextId: "showroom" },
        { label: "Buy the Sentra from Marketplace instead. Skip the dealership.",
          kind: "good",
          feedback: "Private-party used is typically thousands cheaper. Inspect with a mechanic first ($100–150) and check the VIN.",
          effects: { money: -7200, wellbeing: 10, addFlags: ["bought_used"] }, nextId: "post_purchase" },
        { label: "Lease the K4 — 'only' $327/month for 3 years.",
          kind: "bad",
          feedback: "Leasing = renting. At the end you own nothing and mileage overage is $0.25/mi. $327 × 36 = $11,772 for three years of use, then you start over.",
          effects: { money: -327, wellbeing: -4, addFlags: ["leased"] }, nextId: "showroom" },
      ],
    },
    showroom: {
      title: "The sticker",
      text: () =>
`Enrique writes the "out-the-door" price on a 4-square worksheet. You see:
• K4 base: $39,000
• "PPF Charge": $8,000
• "Undercoating Charge": $5,000
• Vehicle Selling Price: $52,000

He slides it over and smiles.`,
      choices: [
        { label: "'No add-ons. MSRP only — or I walk.'",
          kind: "good",
          feedback: "PPF and undercoating are pure profit (actual cost: <$200). 'Market adjustment' stickers are legal to refuse. Walking works; dealerships have monthly quotas.",
          effects: { wellbeing: 10, addFlags: ["rejected_addons"] }, nextId: "financing" },
          { label: "Negotiate: $2k off the PPF, keep the undercoating.",
          kind: "mid",
          feedback: "You saved $2k but still paid $3k for a $150 undercoating spray. Half-win.",
          effects: { money: -3000, wellbeing: 2 }, nextId: "financing" },
        { label: "Sign. It's in the four-square so it must be standard.",
          kind: "bad",
          feedback: "Nothing on that sheet was standard. You just agreed to $13,000 of imaginary add-ons.",
          effects: { wellbeing: -10, addFlags: ["paid_addons"] }, nextId: "financing" },
        { label: "Ask to see the factory invoice.",
          kind: "good",
          feedback: "Dealers rarely show it but the request itself signals you're informed. Add-on line items usually disappear.",
          effects: { wellbeing: 6, addFlags: ["rejected_addons"] }, nextId: "financing" },
      ],
    },
    financing: {
      title: "The finance office",
      text: () =>
`Enrique hands you off to Brittney in F&I. Her screen shows:
• Cash: $0 down required
• 72 months
• 17.0% APR
• Initial payment: $1,123.11
• Balance financed: $57,806

She turns the screen so you can't see the line items and slides a pen.`,
      choices: [
        { label: "'My credit union pre-approved me at 6.9%. Match or I finance there.'",
          kind: "good",
          feedback: "72-month at 17% on $52k = ~$29,000 in interest. Same loan at 7% = $11,700. You just saved $17,000 in interest over the loan.",
          effects: { wellbeing: 14, addFlags: ["used_credit_union"] }, nextId: "warranties" },
        { label: "Sign the 17% loan. You need the car today.",
          kind: "bad",
          feedback: "Subprime auto loans > 15% APR are how most young buyers end up underwater (owing more than the car is worth) within six months.",
          effects: { wellbeing: -12, addFlags: ["subprime_loan"], schedule: [[3, "underwater"]] }, nextId: "warranties" },
        { label: "Counter at 9%. She 'tries' and comes back with 11%.",
          kind: "mid",
          feedback: "You saved real money but still paid well above credit-union rates. Know your pre-qualified rate before walking in.",
          effects: { wellbeing: 4 }, nextId: "warranties" },
        { label: "'Let me read the contract at home first.'",
          kind: "good",
          feedback: "Most states allow a cooling-off period or at minimum, taking the paperwork home. Dealers pressure you NOT to.",
          effects: { wellbeing: 8 }, nextId: "warranties" },
      ],
    },
    warranties: {
      title: "Extended warranty upsell",
      text: () =>
`Brittney slides a menu:
• GAP insurance — $995
• Extended warranty — $2,800
• Tire & wheel protection — $1,200
• Key replacement — $400
• Interior protection — $699

"These are discounted if you add them to your loan today."`,
      choices: [
        { label: "'I'll consider GAP through my insurer. Decline everything else.'",
          kind: "good",
          feedback: "GAP from your auto insurer is often $30–50/year vs $995 as a one-time dealer add-on. The rest of the menu is almost pure markup.",
          effects: { money: -50, wellbeing: 8 }, nextId: "finale" },
        { label: "Take the extended warranty only. Cars break.",
          kind: "mid",
          feedback: "Third-party warranties have ~40% claim denial rates per Consumer Reports. Cheaper to build an emergency fund for repairs.",
          effects: { money: -2800, wellbeing: -2 }, nextId: "finale" },
        { label: "Bundle everything. One monthly payment.",
          kind: "bad",
          feedback: "You rolled $6,094 of add-ons into a 72-month loan at 17% — those add-ons will actually cost $9,400 with interest.",
          effects: { money: -6094, wellbeing: -10, addFlags: ["overinsured"] }, nextId: "finale" },
        { label: "Decline all. You'll pay for repairs if they happen.",
          kind: "good",
          feedback: "Dealer add-ons are rarely worth it. Put the $3,000+ savings in a HYSA as your repair fund instead.",
          effects: { wellbeing: 10 }, nextId: "finale" },
      ],
    },
    post_purchase: {
      title: "Two weeks in",
      text: () =>
`The Sentra starts every morning. You drove it to the mechanic pre-purchase ($130); they flagged brakes needing work at 60k miles — you negotiated $300 off the price. You start your new job Monday.`,
      choices: [
        { label: "Drive to work. Life continues.",
          kind: "good",
          feedback: "The boring win. A reliable used car + inspection pre-purchase is the most financially sound car choice for most 21-year-olds.",
          effects: { wellbeing: 6 }, nextId: "finale" },
      ],
    },
    underwater: {
      title: "⚠ Three months later",
      text: () =>
`You rear-end someone at a light. K4 totaled. Insurance says market value: $38,500. Your loan balance: $56,200. You owe the bank $17,700 on a car you can't drive.`,
      choices: [
        { label: "No GAP insurance. Pay the $17,700 out of pocket or finance it onto your next car.",
          kind: "bad",
          feedback: "This is exactly why GAP exists. Rolling negative equity into a new loan = buried for years.",
          effects: { money: -17700, wellbeing: -15, law: 10 }, nextId: null },
        { label: "Thankfully you had GAP — it covers the gap. You walk away owing nothing extra.",
          kind: "good",
          feedback: "GAP is actually useful IF priced correctly (via insurer, not dealer). Works as designed here.",
          effects: { wellbeing: 4 }, nextId: null },
      ],
    },

    ending_good: {
      title: "BOUGHT SMART",
      text: s => `${s.charName}, one year later. Reliable wheels. Monthly payment under 10% of income. Credit score up because you paid on time.\n\nA car should be a tool, not a trap. You treated it like one.`,
      ending: true, endingKind: "good",
    },
    ending_mid: {
      title: "PAID A LITTLE TOO MUCH",
      text: s => `${s.charName}, one year later. You got the car. You overpaid by $4k–6k, but you're not underwater.\n\nYou'll remember this one next time.`,
      ending: true, endingKind: "mid",
    },
    ending_bad: {
      title: "UPSIDE-DOWN AND STUCK",
      text: s => `${s.charName}, one year later. Owing $51,000 on a car valued at $31,000. Monthly payment eats 28% of your take-home.\n\nEvery dealer tactic worked. Now you know what they look like.`,
      ending: true, endingKind: "bad",
    },
    ...sharedEndings,

    finale: {
      title: "Twelve months later",
      text: () => `Let's see how you drove off.`,
      choices: [
        { label: "Continue...", kind: "mid", feedback: "", effects: {},
          next: s => {
            if (s.flags.has("bought_used")) return "ending_good";
            if (s.flags.has("paid_addons") && s.flags.has("subprime_loan")) return "ending_bad";
            if (s.flags.has("subprime_loan") || s.flags.has("overinsured")) return "ending_bad";
            if (s.flags.has("used_credit_union") && s.flags.has("rejected_addons")) return "ending_good";
            return "ending_mid";
          }
        },
      ],
    },
  },
};
