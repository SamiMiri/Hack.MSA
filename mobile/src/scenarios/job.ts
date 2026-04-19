import { Scenario } from "../types";
import { sharedEndings } from "./shared";

export const jobScenario: Scenario = {
  id: "job",
  name: "The Offer",
  who: "Dmitri Park · 24 · first salaried job",
  desc: "A 31-page offer letter. Negotiation, W-4s, benefits, a workplace issue, and the resignation packet.",
  estimatedTime: "~10 decisions",
  startMoney: 800,
  defaultName: "Dmitri Park",
  accent: "#FFA502",
  startSceneId: "intro",
  scenes: {
    intro: {
      title: "Tuesday · inbox at 4:12 PM",
      text: () => `Two years of contract work. A degree you're paying off. Lindsay from HR at Beacon Analytics emails:

"$62,000 base, benefits eligible, 3 weeks out. Sign within 48 hours."

31-page PDF: salary, 6-month probation, non-compete, arbitration, confidentiality forbidding wage discussion, relocation clause requiring 2 years.

Your current contract ends Friday.`,
      choices: [
        { label: "Sign tonight. You need the job.",
          kind: "bad", feedback: "You agreed to things you didn't read. Non-compete blocks your industry. Arbitration waives suit rights.",
          effects: { money: 5166, wellbeing: -8, addFlags: ["signed_blind", "noncompete"] }, nextId: "negotiate_outcome" },
        { label: "Ask for a week with an employment lawyer.",
          kind: "good", feedback: "Real companies grant extensions. If they pull the offer, they weren't going to treat you well.",
          effects: { wellbeing: 8 }, nextId: "negotiate_salary" },
        { label: "Counter at $72k. Point to market data.",
          kind: "good", feedback: "~60% of first offers have room. Meet-in-the-middle at $67k is common.",
          effects: { wellbeing: 6, addFlags: ["negotiated"] }, nextId: "negotiate_salary" },
        { label: "Sign, then email asking to strike the non-compete.",
          kind: "mid", feedback: "Already signed. Leverage is gone. Lindsay says 'we can discuss at review.' She won't.",
          effects: { money: 5166, wellbeing: -3, addFlags: ["signed_blind", "noncompete"] }, nextId: "negotiate_outcome" },
        { label: "Ask what total compensation is.",
          kind: "good", feedback: "Base + bonus + match + PTO + health. $62k with great benefits beats $68k without.",
          effects: { wellbeing: 10 }, nextId: "negotiate_salary" },
      ],
    },
    negotiate_salary: {
      title: "Two days later · phone call",
      text: () => `Lindsay: "$66,500 base, $3,000 signing bonus, non-compete shortened to 6 months / 50 miles. Arbitration is standard."`,
      choices: [
        { label: "Accept. Get it in writing before signing.",
          kind: "good", feedback: "Always get verbal offers in writing.",
          effects: { money: 3000, wellbeing: 7 }, nextId: "w4_benefits" },
        { label: "Push for $70k AND non-compete removal.",
          kind: "mid", feedback: "You won; you pushed past the win. $68k OR non-compete removal, not both.",
          effects: { wellbeing: 1, addFlags: ["noncompete"] }, nextId: "w4_benefits" },
        { label: "Ask to carve out arbitration for wage/hour claims.",
          kind: "good", feedback: "Sophisticated ask. Lindsay adds a 30-day opt-out period.",
          effects: { wellbeing: 5 }, nextId: "w4_benefits" },
        { label: "Accept verbally. Sign whenever.",
          kind: "mid", feedback: "Verbal offers aren't enforceable in most states.",
          effects: { wellbeing: 1 }, nextId: "w4_benefits" },
      ],
    },
    negotiate_outcome: {
      title: "Start date · signing day",
      text: () => `You signed. $62k. All clauses intact. Start in 3 weeks. Welcome kit arrives.`,
      choices: [
        { label: "Continue to paperwork...", kind: "mid", feedback: "", effects: {}, nextId: "w4_benefits" },
      ],
    },
    w4_benefits: {
      title: "Onboarding · 47 tabs of paperwork",
      text: () => `W-4, benefits (medical/dental/vision/HSA/FSA/401k), direct deposit. Jen says: "claim dependents." Amir says: "max the HSA."`,
      choices: [
        { label: "Single/no deps. 401(k) at match. HSA if HDHP. Skip upsells.",
          kind: "good", feedback: "Optimal default. HSA = triple tax benefit. Match = free money.",
          effects: { wellbeing: 12, addFlags: ["benefits_optimized", "retirement_started"] }, nextId: "first_paycheck" },
        { label: "Claim 5 dependents on W-4.",
          kind: "bad", feedback: "You don't support 5 people. Owe $6,000+ in April with penalties.",
          effects: { wellbeing: -5, law: 15, addFlags: ["w4_wrong"], schedule: [[4, "tax_surprise"]] }, nextId: "first_paycheck" },
        { label: "0% 401(k). Start later.",
          kind: "bad", feedback: "Leaving match = $3,300/year free money. 40 years = ~$400k compounded.",
          effects: { wellbeing: -5 }, nextId: "first_paycheck" },
        { label: "Max 401(k) AND HSA aggressively.",
          kind: "mid", feedback: "On $66k gross you're house-poor. 10-15% + full HSA is the sweet spot.",
          effects: { wellbeing: 2, addFlags: ["retirement_started"] }, nextId: "first_paycheck" },
        { label: "Enroll in everything HR offers.",
          kind: "mid", feedback: "Cancer + pet + identity theft = $180/mo of noise.",
          effects: { money: -180, wellbeing: -3 }, nextId: "first_paycheck" },
      ],
    },
    first_paycheck: {
      title: "Payday · two weeks in",
      text: () => `Gross $2,554, net $1,782. One line says 'CORPWELLNESS — $14.' You don't remember signing up.`,
      choices: [
        { label: "Email payroll. Ask for the source doc.",
          kind: "good", feedback: "Unauthorized deductions violate FLSA. Quietly refunded.",
          effects: { money: 14, wellbeing: 5 }, nextId: "workplace_issue" },
        { label: "Ignore it.",
          kind: "mid", feedback: "$14/week × 2 years = $1,456. Small skims add up.",
          effects: { wellbeing: -2 }, nextId: "workplace_issue" },
        { label: "Verify every line item.",
          kind: "good", feedback: "You catch state withholding to the wrong state, saving an April nightmare.",
          effects: { wellbeing: 8 }, nextId: "workplace_issue" },
        { label: "Post the stub to TikTok.",
          kind: "bad", feedback: "Full name, SSN last 4, employer. Identity thieves love first-paycheck posts.",
          effects: { wellbeing: -3, law: 3 }, nextId: "workplace_issue" },
      ],
    },
    workplace_issue: {
      title: "Four months in · a problem",
      text: () => `New manager Brett. Inappropriate comments in front of coworkers. You have worse texts.`,
      choices: [
        { label: "Document in writing. Report to HR, cc personal email.",
          kind: "good", feedback: "HR protects the company. Written reports create legal record. Retaliation is illegal.",
          effects: { wellbeing: 10, addFlags: ["documented_harassment"] }, nextId: "noncompete_test" },
        { label: "Confront Brett privately.",
          kind: "mid", feedback: "Sometimes works. Often tips him off.",
          effects: { wellbeing: -5 }, nextId: "noncompete_test" },
        { label: "Free consult with employment lawyer first.",
          kind: "good", feedback: "Most offer free intake. They tell you exactly what to document.",
          effects: { wellbeing: 8, addFlags: ["documented_harassment"] }, nextId: "noncompete_test" },
        { label: "Quit.",
          kind: "bad", feedback: "Lose income, benefits, AND the claim. Disqualifies unemployment.",
          effects: { money: -5000, wellbeing: -15 }, nextId: "ending_mid" },
        { label: "Sign HR's NDA/severance.",
          kind: "bad", feedback: "Never sign a release without a lawyer.",
          effects: { money: 3000, wellbeing: -10, addFlags: ["signed_nda"] }, nextId: "noncompete_test" },
      ],
    },
    noncompete_test: {
      title: "Fourteen months in · a better offer",
      text: () => `Vantage Data offers $82k. Better work, better team. But the non-compete.`,
      choices: [
        { label: "Employment lawyer. Written opinion on enforceability.",
          kind: "good", feedback: "Non-competes unenforceable for most workers in CA, ND, OK, MN, and increasingly elsewhere (FTC rule).",
          effects: { money: -500, wellbeing: 10, rmFlags: ["noncompete"] }, nextId: "leaving" },
        { label: "Take the job. Hope nobody notices.",
          kind: "bad", feedback: "Beacon sends cease-and-desist. Vantage rescinds. They sue.",
          effects: { money: -10000, wellbeing: -20, law: 30, addFlags: ["sued"] }, nextId: "leaving" },
        { label: "Negotiate: 6 more months for non-compete release.",
          kind: "good", feedback: "Works more often than people think.",
          effects: { wellbeing: 8, rmFlags: ["noncompete"] }, nextId: "leaving" },
        { label: "Decline. Stay put.",
          kind: "mid", feedback: "Leaving $16k/year over a probably-unenforceable clause is expensive caution.",
          effects: { wellbeing: -2 }, nextId: "leaving" },
      ],
    },
    leaving: {
      title: "Resignation day",
      text: () => `Two weeks notice. Exit packet: 'mutual release of claims' for PTO payout and final paycheck.`,
      choices: [
        { label: "Refuse to sign. Accrued PTO is legally yours.",
          kind: "good", feedback: "Most states can't withhold earned wages behind a release.",
          effects: { money: 3000, wellbeing: 8 }, nextId: "finale" },
        { label: "Sign. Whatever.",
          kind: "bad", feedback: "You waived the harassment claim AND possibly unpaid overtime.",
          effects: { money: 3000, wellbeing: -10, addFlags: ["signed_release"] }, nextId: "finale" },
        { label: "Take to a lawyer first.",
          kind: "good", feedback: "Two clauses struck. Narrower version signed.",
          effects: { money: 2700, wellbeing: 6 }, nextId: "finale" },
        { label: "Negotiate severance — leverage documented harassment.",
          kind: "good", feedback: "If documented, companies often pay 1-3 months to end cleanly.",
          effects: { money: 8000, wellbeing: 10 }, nextId: "finale" },
      ],
    },

    tax_surprise: {
      title: "April",
      text: () => `W-4 was wrong. You owe $6,400.`,
      choices: [
        { label: "IRS installment plan. File on time.",
          kind: "good", feedback: "Filing on time avoids the 5%/mo failure-to-file penalty.",
          effects: { money: -600, wellbeing: 2, law: -10, rmFlags: ["w4_wrong"] }, nextId: null },
        { label: "Ignore it.",
          kind: "bad", feedback: "Wages garnished within 18 months.",
          effects: { wellbeing: -15, law: 25 }, nextId: null },
      ],
    },

    ending_good: {
      title: "YOU NEGOTIATED",
      text: s => `${s.charName}, 26. New job, higher salary, no non-compete. A folder labeled "in case of HR" you'll never need.\n\nEvery document is negotiable until it's signed.`,
      ending: true, endingKind: "good",
    },
    ending_mid: {
      title: "SURVIVED",
      text: s => `${s.charName}, 26. Kept your head down. You're fine. You wonder if you left money on the table.\n\n(You did.)`,
      ending: true, endingKind: "mid",
    },
    ending_bad: {
      title: "SUED BY YOUR EMPLOYER",
      text: s => `${s.charName}, 26. Defending a lawsuit. Legal fees past $40k. Offer rescinded.\n\nThe non-compete probably wouldn't have held up — but you never asked.`,
      ending: true, endingKind: "bad",
    },
    ...sharedEndings,

    finale: {
      title: "Two years later",
      text: () => `Let's see how it shook out.`,
      choices: [
        { label: "Continue...", kind: "mid", feedback: "", effects: {},
          next: s => {
            if (s.flags.has("sued")) return "ending_bad";
            if (s.wellbeing >= 70 && !s.flags.has("signed_blind") && !s.flags.has("signed_release")) return "ending_good";
            return "ending_mid";
          }
        },
      ],
    },
  },
};
