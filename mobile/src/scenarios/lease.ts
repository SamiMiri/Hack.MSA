import { Scenario } from "../types";
import { sharedEndings } from "./shared";

export const leaseScenario: Scenario = {
  id: "lease",
  name: "The Lease",
  who: "Maya Chen · 22 · first apartment",
  desc: "Nine days to find housing in a new city. A scammer, a real lease, utilities, a roommate, mold, and a deposit fight.",
  estimatedTime: "~10 decisions",
  startMoney: 3200,
  defaultName: "Maya Chen",
  accent: "#A29BFE",
  startSceneId: "intro",
  scenes: {
    intro: {
      title: "August · Craigslist at 1 AM",
      text: () => `Three weeks out of college, one week into a $44k admin job in a new city. You have $3,200 and a U-Haul reservation for Saturday.

A listing just appeared: 1BR, $1,350/mo, "newly renovated." The photos look well-lit. "Greg" only texts.

Greg wants $200 via Zelle before showing the place. "Lots of interest," he writes.

Move-in deadline in 9 days.`,
      choices: [
        { label: "Pay the $200. He's probably legit.",
          kind: "bad", feedback: "Classic rental scam. Real landlords take app fees AFTER a showing.",
          effects: { money: -200, wellbeing: -8 }, nextId: "real_listing" },
        { label: "Insist on seeing it in person. No money up front.",
          kind: "good", feedback: "Correct. Greg ghosts within the hour.",
          effects: { wellbeing: 8 }, nextId: "real_listing" },
        { label: "Reverse-image search the photos.",
          kind: "good", feedback: "Photos from a 2019 Dallas listing. Greg is not real.",
          effects: { wellbeing: 10 }, nextId: "real_listing" },
        { label: "Offer $500 to 'lock it in.'",
          kind: "bad", feedback: "You got extra-scammed. Greg blocks your number.",
          effects: { money: -500, wellbeing: -12 }, nextId: "real_listing" },
      ],
    },
    real_listing: {
      title: "Four days later · a real showing",
      text: () => `An actual apartment, real leasing agent. $1,295/mo, 620 sq ft. Faint smell. 16-page lease slid across the table. Pen uncapped.`,
      choices: [
        { label: "Read every page. Ask about the smell.",
          kind: "good", feedback: "Plumbing issue being fixed below. Mandatory renter's insurance clause is normal.",
          effects: { wellbeing: 10, addFlags: ["read_lease"] }, nextId: "utilities" },
        { label: "Skim. Sign. You need housing.",
          kind: "mid", feedback: "Missed a $75/mo 'amenity fee' for a gym closed since 2019.",
          effects: { money: -75, wellbeing: -3, addFlags: ["bad_lease"] }, nextId: "utilities" },
        { label: "Take it home overnight.",
          kind: "good", feedback: "Any real landlord says yes. You catch two predatory clauses; both struck.",
          effects: { wellbeing: 12, addFlags: ["read_lease"] }, nextId: "utilities" },
        { label: "Push back on 'first, last, and two months deposit' ($5,180).",
          kind: "good", feedback: "Deposits over 2 months rent are illegal in most states. Negotiate to 1 month.",
          effects: { money: -2590, wellbeing: 8, addFlags: ["read_lease"] }, nextId: "utilities" },
        { label: "Sign without reading. Agent seems nice.",
          kind: "bad", feedback: "You agreed to pay the landlord's legal fees if HE sues YOU, and waived jury trial.",
          effects: { wellbeing: -10, law: 5, addFlags: ["bad_lease"] }, nextId: "utilities" },
      ],
    },
    utilities: {
      title: "Move-in day",
      text: () => `No electricity, no gas, no internet. Clipboard with four companies. Flyer: "ENERGY SAVERS LLC — FIXED RATES FOREVER."`,
      choices: [
        { label: "Call the default utility company. Skip the flyer.",
          kind: "good", feedback: "'Fixed rate' resellers balloon after promo. Millions in PUC complaints.",
          effects: { wellbeing: 7 }, nextId: "roommate" },
        { label: "Sign up with Energy Savers.",
          kind: "bad", feedback: "Month 1: $45. Month 6: $210. $250 termination fee.",
          effects: { money: -200, wellbeing: -5, schedule: [[3, "utility_bill"]] }, nextId: "roommate" },
        { label: "Autopay everything.",
          kind: "mid", feedback: "Fine, but check first bills for errors.",
          effects: { wellbeing: 2 }, nextId: "roommate" },
        { label: "Skip internet for a month. Hotspot.",
          kind: "mid", feedback: "You blow through data in 4 days on a work video call.",
          effects: { money: -60, wellbeing: -5 }, nextId: "roommate" },
      ],
    },
    roommate: {
      title: "Three weeks in",
      text: () => `Your friend Priya calls in tears. Lost her job. Can't make rent. Begs to crash 'just for a month.' Your lease allows one additional occupant with written notice.`,
      choices: [
        { label: "Let her stay. Tell the landlord in writing.",
          kind: "good", feedback: "Protects you both. Priya has tenant rights, you don't violate the lease.",
          effects: { wellbeing: 8 }, nextId: "repair" },
        { label: "Let her stay secretly.",
          kind: "bad", feedback: "Unauthorized occupant clause = eviction grounds.",
          effects: { wellbeing: -5, law: 10, addFlags: ["lease_violation"], schedule: [[3, "eviction_notice"]] },
          nextId: "repair" },
        { label: "Let her stay 2 weeks max. Written agreement.",
          kind: "good", feedback: "Most leases allow guests up to 14 days without notification.",
          effects: { wellbeing: 7 }, nextId: "repair" },
        { label: "Say no. Venmo her $200 for a motel.",
          kind: "mid", feedback: "Harsh but defensible.",
          effects: { money: -200, wellbeing: -2 }, nextId: "repair" },
        { label: "Charge her $800/mo under the table.",
          kind: "bad", feedback: "Illegal sublessor + tax evader.",
          effects: { money: 800, wellbeing: -10, law: 15, addFlags: ["illegal_sublease"] }, nextId: "repair" },
      ],
    },
    repair: {
      title: "Two months in · black stuff on the wall",
      text: () => `Mold. Bathroom ceiling. Spreading. Cough for a week. Landlord won't reply.`,
      choices: [
        { label: "Certified mail notice. Document everything.",
          kind: "good", feedback: "Warranty of habitability exists in nearly every state. Paper trail = wins.",
          effects: { wellbeing: 12, addFlags: ["documented_repair"] }, nextId: "deposit" },
        { label: "Bleach it yourself. Don't mention it.",
          kind: "bad", feedback: "Surface covered; source is a wall leak. Structural damage will be blamed on you.",
          effects: { health: -12, wellbeing: -8, schedule: [[2, "mold_returns"]] }, nextId: "deposit" },
        { label: "Stop paying rent until fixed.",
          kind: "bad", feedback: "Withholding requires escrow. Just not paying = eviction.",
          effects: { wellbeing: -12, law: 15, addFlags: ["withheld_rent"], schedule: [[2, "eviction_notice"]] },
          nextId: "deposit" },
        { label: "Call city housing code enforcement.",
          kind: "good", feedback: "Free inspector. Landlord cited. Repairs in 72 hours.",
          effects: { wellbeing: 10, addFlags: ["documented_repair"] }, nextId: "deposit" },
        { label: "Pay a mold company $800, deduct from rent.",
          kind: "mid", feedback: "Repair-and-deduct is legal in some states with specific notice first.",
          effects: { money: -800, wellbeing: 1 }, nextId: "deposit" },
      ],
    },
    deposit: {
      title: "A year later · move-out",
      text: () => `Cleaned. 50 photos of every wall. Landlord emails: 'Deposit refund: $0. Deductions: carpet $1,400, cleaning $350, paint $600.' Your deposit was $1,295.`,
      choices: [
        { label: "Demand letter citing state law.",
          kind: "good", feedback: "Many states award DOUBLE or TRIPLE damages for bogus deductions.",
          effects: { money: 1295, wellbeing: 8, addFlags: ["got_deposit"] }, nextId: "finale" },
        { label: "Small claims court. $75 filing fee.",
          kind: "good", feedback: "No lawyer needed. You win $2,590 plus filing fee.",
          effects: { money: 2515, wellbeing: 12, addFlags: ["got_deposit"] }, nextId: "finale" },
        { label: "Accept it. Landlords always do this.",
          kind: "bad", feedback: "$1,295 gone because you didn't send one letter.",
          effects: { wellbeing: -8 }, nextId: "finale" },
        { label: "Scathing Google review, call it even.",
          kind: "mid", feedback: "Cathartic. Not money. Risks defamation if you overstate.",
          effects: { wellbeing: -2 }, nextId: "finale" },
      ],
    },

    utility_bill: {
      title: "The electric bill",
      text: () => `$340 for one month. Fine print: 'variable rate after promo.'`,
      choices: [
        { label: "File PUC complaint. Switch back to default.",
          kind: "good", feedback: "PUC complaints are free and often force refunds.",
          effects: { money: -100, wellbeing: 5 }, nextId: null },
        { label: "Pay it and eat the loss.",
          kind: "mid", feedback: "Rate keeps climbing.",
          effects: { money: -340, wellbeing: -3 }, nextId: null },
      ],
    },
    mold_returns: {
      title: "The ceiling caves",
      text: () => `Section of bathroom ceiling collapses. Landlord blames you for 'failure to notify.'`,
      choices: [
        { label: "Produce any text/email/receipt from when you first noticed.",
          kind: "good", feedback: "A single timestamped text saves you.",
          effects: { wellbeing: 3 }, nextId: null },
        { label: "Argue verbally. No paper trail.",
          kind: "bad", feedback: "Landlord sues for $8,000. You have no evidence.",
          effects: { money: -3000, wellbeing: -15, law: 15 }, nextId: null },
      ],
    },
    eviction_notice: {
      title: "Notice taped to your door",
      text: () => `3-DAY NOTICE TO CURE OR QUIT.`,
      choices: [
        { label: "Contact legal aid clinic immediately.",
          kind: "good", feedback: "Most cities have free tenant legal aid.",
          effects: { wellbeing: 5, law: -10, rmFlags: ["lease_violation", "withheld_rent"] }, nextId: null },
        { label: "Ignore it.",
          kind: "bad", feedback: "Eviction on record = no rental approval for 7 years.",
          effects: { wellbeing: -25, law: 25, addFlags: ["eviction_record"] }, nextId: null },
      ],
    },

    ending_good: {
      title: "YOU KNOW YOUR RIGHTS",
      text: s => `${s.charName}, 23. Deposit back. Credit unhurt. A notebook full of lease clauses you'll catch next time.\n\nBeing a tenant is a job. You're good at it now.`,
      ending: true, endingKind: "good",
    },
    ending_mid: {
      title: "RENTER BY ATTRITION",
      text: s => `${s.charName}, 23. Lost some money, signed a new lease you didn't fully read. But you're housed.`,
      ending: true, endingKind: "mid",
    },
    ending_bad: {
      title: "EVICTED",
      text: s => `${s.charName}, 23. Eviction on record. Seven years of denied applications.\n\nThe lease was always the most important thing in the room.`,
      ending: true, endingKind: "bad",
    },
    ...sharedEndings,

    finale: {
      title: "Thirteen months later",
      text: () => `Let's see how you landed.`,
      choices: [
        { label: "Continue...", kind: "mid", feedback: "",
          next: s => {
            if (s.flags.has("eviction_record")) return "ending_bad";
            if (s.wellbeing >= 65 && s.flags.has("got_deposit")) return "ending_good";
            return "ending_mid";
          }
        },
      ],
    },
  },
};
