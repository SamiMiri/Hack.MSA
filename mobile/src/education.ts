import { GameState } from "./types";

export interface QuizQuestion {
  q: string;
  choices: string[];
  correctIdx: number;
  explain: string;
}

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  reading: string;
  questions: QuizQuestion[];
}

export interface EducationPack {
  lessons: { t: string; d: string }[];
  analyze: (state: GameState) => { kind: "good" | "bad" | "mid"; text: string }[];
  quizzes: Lesson[];
}

export const EDUCATION: Record<string, EducationPack> = {
  taxes: {
    lessons: [
      { t: "File on time, even if you can't pay", d: "The failure-to-file penalty is 5%/month (up to 25%). The failure-to-pay penalty is 0.5%/month. Filing late is ten times worse than paying late." },
      { t: "Cash income still counts", d: "Side gigs, Venmo tips, tutoring — over $400 is reportable. IRS has automated matching for W-2s and 1099s; any audit surfaces cash." },
      { t: "Stay on a parent's insurance until 26", d: "ACA lets you stay on a parent's employer plan until 26. Low income usually qualifies for Medicaid. 'Health sharing ministries' aren't insurance." },
      { t: "Your W-4 is not set-and-forget", d: "Claiming 'exempt' when you aren't = owing thousands in April. For most single workers: single, no dependents, no adjustments is correct." },
      { t: "Build credit before you need it", d: "Secured card + paying in full every month = fastest legit way to a 700+ score." },
      { t: "Never skip a 401(k) match", d: "Employer match is a 100% instant return. Starting at 19 vs 30 is worth ~$300k by retirement." },
      { t: "Federal agents: lawyer first, talk later", d: "Lying to an IRS or FBI agent is a separate felony (18 USC 1001). Voluntary disclosure reduces penalties." },
    ],
    analyze: (s) => {
      const r: { kind: "good" | "bad" | "mid"; text: string }[] = [];
      if (s.flags.has("filed_honestly")) r.push({ kind: "good", text: "You filed an honest return including your cash income. Biggest risk-reducer in the scenario." });
      else if (s.flags.has("underreported")) r.push({ kind: "mid", text: "W-2-only return. Usually ignored, but evasion on the cash income." });
      else if (s.flags.has("didnt_file")) r.push({ kind: "bad", text: "You never filed. Failure-to-file penalties are ten times worse than failure-to-pay." });
      if (s.flags.has("tax_fraud")) r.push({ kind: "bad", text: "Fake-dependents fraud is caught at ~98% rate by IRS matching." });
      if (s.flags.has("insured")) r.push({ kind: "good", text: "You got real health insurance. One uninsured ER visit wipes out a year's savings." });
      if (s.flags.has("fake_insurance")) r.push({ kind: "bad", text: "'MediSave Plus' is a health-sharing ministry, not insurance." });
      if (s.flags.has("money_mule")) r.push({ kind: "bad", text: "Mule schemes are federal wire fraud. One deposit is enough." });
      if (s.flags.has("felony_record")) r.push({ kind: "bad", text: "A felony record follows every future application." });
      if (s.flags.has("building_credit")) r.push({ kind: "good", text: "Building credit at 19 pays off for 40 years of loans and leases." });
      if (s.flags.has("retirement_started")) r.push({ kind: "good", text: "Taking the 401(k) match is worth ~$300k by retirement vs starting at 30." });
      if (s.law >= 50) r.push({ kind: "bad", text: `Final Law heat: ${Math.round(s.law)}%. Multiple risky choices stacked into enforcement risk.` });
      else if (s.law <= 15) r.push({ kind: "good", text: "Law heat stayed low — you kept every interaction clean." });
      return r;
    },
    quizzes: [
      {
        id: "tax_filing_basics",
        title: "Filing 101: Penalties and Forms",
        summary: "Why filing on time matters even when broke.",
        reading: "Every year by April 15 you owe the IRS a tax return (Form 1040). There are two separate penalties if you don't comply:\n\n• Failure-to-FILE: 5% of what you owe per month, up to 25% max.\n• Failure-to-PAY: 0.5% per month.\n\nThese are ten times apart for a reason. Filing a return costs you nothing; paying it might. So the rule: always file, even if you can't pay. Then set up an IRS installment plan at irs.gov for the balance.\n\nIRS Free File is available for anyone with adjusted gross income under ~$79,000. TurboTax's 'free edition' is narrow — any 1099 or gig income usually forces an $89+ upgrade.\n\nCash income over $400 from side work is reportable. The IRS can't match cash directly, but audits can surface it and a decade-later CP2000 notice is a nightmare.",
        questions: [
          { q: "What is the failure-to-FILE penalty per month?", choices: ["0.5%", "1%", "5%", "10%"], correctIdx: 2,
            explain: "5%/month, up to 25% max. Ten times the failure-to-pay penalty — which is why you always file, even if you can't pay." },
          { q: "You made $900 doing cash lawn work. Reportable?", choices: ["Yes, over $400 is reportable", "No, only if you got a 1099", "Only if over $5,000", "Only if you're self-employed full-time"], correctIdx: 0,
            explain: "Self-employment income over $400 requires a return. The IRS rarely catches cash directly, but any audit surfaces it." },
          { q: "Best move if you owe $1,200 and have $200?", choices: ["Don't file", "File and apply for an installment plan", "Borrow from a payday lender", "Wait until you have the full amount"], correctIdx: 1,
            explain: "File on time, then set up an installment plan via irs.gov. Failure-to-file is vastly worse than failure-to-pay." },
        ],
      },
      {
        id: "w4_basics",
        title: "W-4s and Withholding",
        summary: "What the form actually does and the common traps.",
        reading: "A W-4 tells your employer how much federal income tax to withhold from each paycheck. It does NOT change your actual tax liability — it changes who holds the money until April.\n\n• Claim EXEMPT only if you truly owed $0 last year AND expect to owe $0 this year. Falsely claiming exempt = owing thousands in April with underpayment penalties.\n• For most single workers with one job: single, zero dependents, no adjustments on Step 3 or 4. This withholds roughly what you'll owe.\n• Claiming extra dependents = bigger paycheck now, but a surprise bill in April.\n\nIf you start a side hustle or get married, update your W-4 — your old one is still in effect.",
        questions: [
          { q: "What does claiming 'EXEMPT' do?", choices: ["Skips all taxes forever", "No federal withholding from paychecks", "Gives a bigger refund", "Lowers your tax rate"], correctIdx: 1,
            explain: "Exempt means zero withholding from paychecks. You still owe your actual tax bill in April — with penalties if you aren't truly exempt." },
          { q: "What's the correct default for a single person with one job and no dependents?", choices: ["Single, 0 dependents, no adjustments", "Single, claim 2 dependents", "Head of household", "Exempt"], correctIdx: 0,
            explain: "Single / zero dependents / no adjustments approximates the amount you'll owe in April." },
          { q: "You claim 5 fake dependents to get bigger paychecks. What happens in April?", choices: ["Nothing — the IRS never matches", "You owe a lot plus underpayment penalties", "You get a refund anyway", "It becomes a criminal charge immediately"], correctIdx: 1,
            explain: "W-4 adjustments don't change tax liability. You'll owe the missed withholding plus underpayment penalties." },
        ],
      },
      {
        id: "credit_basics",
        title: "Building Credit Early",
        summary: "How FICO actually works and which cards help.",
        reading: "Your FICO credit score (300–850) is used for apartments, car loans, utilities, and some jobs. Big employers like Discover and Capital One check it for underwriting.\n\nThe five components:\n• Payment history (35%) — pay on time, every time\n• Credit utilization (30%) — keep balances under 30% of your limit, ideally under 10%\n• Length of history (15%) — older is better\n• Credit mix (10%)\n• New credit (10%)\n\nThe fastest legit ways to build credit at 19:\n• Secured credit card: $200 deposit, reports to all 3 bureaus. Charge gas, pay in full monthly.\n• Authorized user on a parent's old card: inherits their history (legal, effective, free).\n\nAvoid: 29.99% APR 'pre-approved' offers, credit-repair scams, and cash advances (30%+ APR, fee from day one).",
        questions: [
          { q: "Which factor is the biggest portion of your FICO score?", choices: ["Credit mix", "New credit", "Payment history", "Length of credit"], correctIdx: 2,
            explain: "Payment history = 35% of your FICO. One 30-day late payment can drop your score 80+ points." },
          { q: "Best way for a 19-year-old with no credit to start?", choices: ["Apply for 5 high-limit cards", "Get a secured card and pay it off monthly", "Wait until you have a mortgage", "Open a store credit card"], correctIdx: 1,
            explain: "Secured cards report to all three bureaus. Charge gas, pay in full every month — done." },
          { q: "Your card has a $500 limit. What's the highest balance you should carry to stay in the 'good' utilization zone?", choices: ["$50", "$150", "$300", "$450"], correctIdx: 1,
            explain: "Utilization under 30% is the guideline; under 10% is ideal. $150 on a $500 limit = 30% exactly." },
        ],
      },
    ],
  },

  lease: {
    lessons: [
      { t: "Never pay before a showing", d: "Real landlords take application fees AFTER a tour. Zelle to a personal account = scam." },
      { t: "Read every clause — take it home", d: "Mandatory renter's insurance is normal. 'Tenant pays landlord's legal fees' is predatory." },
      { t: "Security deposits are capped by law", d: "Most states cap at 1–2 months' rent. 'First, last, and two months' is illegal in most places." },
      { t: "Document everything in writing", d: "Certified mail, emails, photos. Verbal complaints are worth nothing in court." },
      { t: "Warranty of habitability is real", d: "Mold, no heat, no water — landlords must fix. Withholding rent requires escrow." },
      { t: "Fight for your deposit", d: "Most states require itemized receipts within 14–30 days. Small claims court works." },
    ],
    analyze: (s) => {
      const r: { kind: "good" | "bad" | "mid"; text: string }[] = [];
      if (s.flags.has("scammed")) r.push({ kind: "bad", text: "You paid before the showing. Every rental scam uses urgency + upfront payment." });
      else r.push({ kind: "good", text: "You didn't pay before the showing. That instinct shuts down 95% of rental scams." });
      if (s.flags.has("read_lease")) r.push({ kind: "good", text: "You read the lease. Saves young renters more money than any other habit." });
      if (s.flags.has("bad_lease")) r.push({ kind: "bad", text: "You signed without reading. Hidden clauses cost you every month." });
      if (s.flags.has("documented_repair")) r.push({ kind: "good", text: "You documented the mold in writing. Habitability cases are decided on paper trails." });
      if (s.flags.has("got_deposit")) r.push({ kind: "good", text: "You fought for your deposit. Most renters eat this loss." });
      if (s.flags.has("eviction_record")) r.push({ kind: "bad", text: "An eviction on record means no rental approval for 7 years." });
      return r;
    },
    quizzes: [
      {
        id: "lease_red_flags",
        title: "Rental Scams and Red Flags",
        summary: "How to spot a fake listing before you wire money.",
        reading: "The modern rental scam pattern is almost universal:\n1. Listing posted on Craigslist, Facebook Marketplace, or Zillow (photos stolen from a real listing elsewhere).\n2. 'Landlord' communicates only by text or email, never phone.\n3. Urgency — 'lots of interest,' 'need to decide today.'\n4. Refuses in-person showing until you 'apply' or send money.\n5. Payment demanded via Zelle, Venmo, wire, or gift cards to a personal account.\n\nReal landlords:\n• Accept application fees AFTER you've toured the unit\n• Usually charge via check or card, not Zelle-to-person\n• Have a company name, address, and corporate payment system\n• Never ask for payment before a signed lease\n\nReverse-image-search every listing photo. Scammers almost always steal images from real listings in other cities.",
        questions: [
          { q: "A landlord wants $200 via Zelle before showing the apartment. What do you do?", choices: ["Pay — showings are hard to schedule", "Insist on an in-person showing first", "Negotiate down to $100", "Send it but keep the receipt"], correctIdx: 1,
            explain: "Any request for money before a tour is a scam. Real landlords show the unit first." },
          { q: "Best way to verify a listing is real?", choices: ["Trust the photos", "Reverse-image search the photos", "Ask for more photos", "Call a random number"], correctIdx: 1,
            explain: "Scammers steal photos from other listings. Reverse-image search will often find the original Dallas or Atlanta listing in seconds." },
          { q: "Which state cap on security deposits is most common?", choices: ["No limit", "1 month's rent", "1–2 months' rent", "6 months' rent"], correctIdx: 2,
            explain: "Most states cap deposits at 1–2 months. 'First, last, and two months' totaling 4 months is illegal in many places." },
        ],
      },
      {
        id: "lease_rights",
        title: "Tenant Rights You Probably Have",
        summary: "Warranty of habitability, repair requests, and deposits.",
        reading: "Every state except Arkansas recognizes an implied warranty of habitability — your landlord must provide:\n• Working heat, water, electricity\n• Structurally sound building\n• Remediation of mold, pests, lead paint (depending on state)\n\nIf they don't fix it:\n• Send a certified-mail repair request with photos and a reasonable deadline (usually 14 days).\n• If they still don't act: call city code enforcement (free inspection).\n• Some states allow repair-and-deduct (with specific notice).\n• Withholding rent works in some states — but ONLY via a court-supervised escrow account. Just not paying = eviction.\n\nSecurity deposits: most states require the landlord to itemize deductions within 14–30 days of move-out. Failure to itemize, or bogus deductions, can get you double or triple damages in small claims court ($75 filing fee, no lawyer needed).",
        questions: [
          { q: "Your ceiling has mold. Landlord won't respond. Best first move?", choices: ["Stop paying rent", "Send a certified-mail repair request", "Move out", "Post a bad review"], correctIdx: 1,
            explain: "Certified mail starts the paper trail. It's your proof if this ends up in court." },
          { q: "Your landlord kept $800 of your $1,000 deposit with no receipts. What do you do?", choices: ["Accept — this always happens", "Send a demand letter citing state law", "Leave a negative review", "Call the police"], correctIdx: 1,
            explain: "Most states award DOUBLE or TRIPLE damages for failure to itemize. Small claims court is designed for this." },
          { q: "Is withholding rent for repairs legal?", choices: ["Always", "Never", "Yes, via court-supervised escrow in many states", "Only if landlord agrees"], correctIdx: 2,
            explain: "Some states allow it, but only through proper escrow procedures. Just not paying = eviction grounds." },
        ],
      },
    ],
  },

  job: {
    lessons: [
      { t: "Everything is negotiable before signing", d: "~60% of first offers have room. After signing, leverage vanishes." },
      { t: "Total comp > base salary", d: "$62k with good benefits can out-earn $68k without. Ask for the full breakdown." },
      { t: "Read non-competes carefully", d: "Unenforceable for most workers in CA, ND, OK, MN and increasingly elsewhere (FTC rule)." },
      { t: "HR protects the company, not you", d: "Document harassment in writing. Retaliation is illegal — but you need a paper trail." },
      { t: "HSAs are the best tax-advantaged account", d: "Triple tax benefit. Only available on High Deductible Health Plans." },
      { t: "Verbal offers aren't offers", d: "Until it's in writing, it didn't happen." },
    ],
    analyze: (s) => {
      const r: { kind: "good" | "bad" | "mid"; text: string }[] = [];
      if (s.flags.has("signed_blind")) r.push({ kind: "bad", text: "You signed a 31-page offer without reading." });
      else if (s.flags.has("negotiated")) r.push({ kind: "good", text: "You negotiated before signing. Thousands in comp for one conversation." });
      if (s.flags.has("benefits_optimized")) r.push({ kind: "good", text: "Benefits optimized. Thousands per year plus $300k+ compounded by retirement." });
      if (s.flags.has("documented_harassment")) r.push({ kind: "good", text: "You documented harassment in writing. That paper trail gave you leverage." });
      if (s.flags.has("signed_nda")) r.push({ kind: "bad", text: "You signed an HR release without a lawyer." });
      if (s.flags.has("sued")) r.push({ kind: "bad", text: "You took the competitor job without checking enforceability." });
      return r;
    },
    quizzes: [
      {
        id: "offer_negotiation",
        title: "Reading an Offer Letter",
        summary: "What to negotiate and what's non-negotiable.",
        reading: "An offer letter is a legal document with durable consequences. Before signing:\n\n• ALWAYS ask for a week to review. 'I'd like to review with a lawyer' is legitimate and professional.\n• ~60% of first offers have negotiation room. Counter once, reasonably, with market data (Levels.fyi, BLS, Glassdoor).\n• Ask for TOTAL COMPENSATION, not just base salary. Match, HSA, PTO, bonus, equity add up fast.\n\nKey clauses to read carefully:\n• Non-compete — scope (industry, geography, duration). Unenforceable in CA, ND, OK, MN, and increasingly elsewhere via the 2024 FTC rule.\n• Arbitration — waives your right to sue in court. Sometimes carveouts exist for wage/hour claims; ask.\n• Confidentiality — legitimate for trade secrets, predatory if it forbids discussing your own wages (NLRA-protected).\n• Relocation clawback — if they pay to move you, you may owe it back if you leave within 2 years.",
        questions: [
          { q: "First offer: $62k. You expected $70k based on market data. Best move?", choices: ["Take it, you need the job", "Counter at $72k with the data", "Decline and walk away", "Accept but ask to renegotiate later"], correctIdx: 1,
            explain: "~60% of first offers have room. Counter with data; worst case they say no and you take the original." },
          { q: "The contract has a 2-year non-compete within 100 miles. Where is this likely UNENFORCEABLE?", choices: ["New York", "Texas", "California", "Florida"], correctIdx: 2,
            explain: "California has the strongest non-compete ban. ND, OK, MN also ban most non-competes. 2024 FTC rule attempted a federal ban." },
          { q: "Verbal offer on the phone at 4 PM. You're asked to resign from your current job today. Correct response?", choices: ["Resign and trust them", "Resign but email the hiring manager", "Wait for the written offer first", "Negotiate on the phone"], correctIdx: 2,
            explain: "Verbal offers are not enforceable in most states. Never leave a current job until written offer is in hand." },
        ],
      },
      {
        id: "benefits_basics",
        title: "401(k), HSA, and Payroll",
        summary: "Free money you're probably ignoring.",
        reading: "On your first salaried job the benefits menu is overwhelming. Priorities:\n\n1. 401(k) match — contribute AT LEAST enough to capture the full employer match. This is a 100% instant return. Most employers match 3–6%. Skipping it is throwing away pay.\n\n2. HSA (only on High Deductible Health Plans) — triple tax advantage:\n• Pre-tax contributions\n• Tax-free growth\n• Tax-free withdrawals for qualified medical\nMax is ~$4,150 single for 2025. Best tax-advantaged account that exists.\n\n3. Health insurance — compare premium + deductible + out-of-pocket max. Low premium isn't always cheapest if you actually get sick.\n\n4. Skip (usually): cancer insurance, pet insurance, identity theft protection, supplemental life. These are padding.\n\n5. Verify your W-4 and first paycheck carefully. Payroll errors are common: wrong state withholding, unauthorized 'wellness fees,' incorrect 401(k) percentage.",
        questions: [
          { q: "Employer matches 100% up to 4% of $60k salary. You contribute 0%. You lose...", choices: ["Nothing — you keep your paycheck", "$2,400/year in free money", "$600/year", "$240/year"], correctIdx: 1,
            explain: "4% of $60k = $2,400. Over 40 years at 7% growth that's ~$480,000 compounded. The single highest-return move in personal finance." },
          { q: "Which account has a 'triple tax advantage'?", choices: ["Traditional 401(k)", "Roth IRA", "HSA", "529"], correctIdx: 2,
            explain: "HSA: pre-tax in, tax-free growth, tax-free out for medical. No other account has all three." },
          { q: "You see a $14/week 'Corp Wellness' deduction on your paycheck. You don't remember enrolling. Correct action?", choices: ["Ignore — it's small", "Email payroll for the source documentation", "Just live with it", "Post about it online"], correctIdx: 1,
            explain: "Unauthorized deductions violate the FLSA. Payroll must produce documentation or refund. $14/week × 2 years = $1,456." },
        ],
      },
    ],
  },

  dealership: {
    lessons: [
      { t: "Pre-qualify at a credit union first", d: "Credit-union auto rates beat dealer-arranged by 3–5 points on average. Pre-qualify before you walk onto the lot." },
      { t: "Add-ons are optional, no matter what they say", d: "PPF, undercoating, nitrogen tires, VIN etching — all pure profit. Real cost is ~$200; retail is $5k–15k." },
      { t: "Lease ≠ own", d: "At end of lease you own nothing. Mileage overages are $0.20–0.25/mile. Most leases are worse than a comparable loan." },
      { t: "Refuse to finance at >10% APR", d: "Subprime auto loans are how young buyers end up underwater within months. Walk away or finance elsewhere." },
      { t: "GAP is legit — but not from the dealer", d: "Your auto insurer offers GAP at $30–50/year. Dealers sell it as a $995 one-time upcharge rolled into your loan." },
      { t: "Ignore monthly payment; focus on total cost", d: "Dealers stretch loans to 72–84 months to shrink the monthly. You pay the same car 1.5× by the end." },
    ],
    analyze: (s) => {
      const r: { kind: "good" | "bad" | "mid"; text: string }[] = [];
      if (s.flags.has("bought_used")) r.push({ kind: "good", text: "You bought a reliable used car with a pre-purchase inspection. The most financially sound choice for most 21-year-olds." });
      if (s.flags.has("prepared")) r.push({ kind: "good", text: "You walked in pre-qualified and informed. Information asymmetry neutralized." });
      if (s.flags.has("rejected_addons")) r.push({ kind: "good", text: "Rejecting add-ons at the four-square worksheet saved you thousands." });
      if (s.flags.has("paid_addons")) r.push({ kind: "bad", text: "PPF + undercoating: total profit for the dealer, minimal value to you." });
      if (s.flags.has("subprime_loan")) r.push({ kind: "bad", text: "17% APR on a 72-month auto loan is the textbook subprime trap. $17k+ in interest over the life of the loan." });
      if (s.flags.has("used_credit_union")) r.push({ kind: "good", text: "Credit-union financing at market rates saved you the classic dealer-finance markup." });
      if (s.flags.has("leased")) r.push({ kind: "mid", text: "You leased. Three years from now you'll own nothing and start over." });
      if (s.flags.has("overinsured")) r.push({ kind: "bad", text: "Rolling $6k of add-ons into a 17% loan means you're paying interest on marketing." });
      return r;
    },
    quizzes: [
      {
        id: "dealer_tactics",
        title: "How Dealerships Make Money",
        summary: "F&I, four-square worksheets, and the upsell.",
        reading: "Modern car dealerships make most of their profit NOT from the car — from the F&I (Finance & Insurance) office. Expect these tactics:\n\n• The four-square worksheet: a grid with trade-in, purchase price, down payment, and monthly payment. Dealers negotiate in the 'monthly payment' box to hide the total cost. Focus on out-the-door price instead.\n\n• 'Market adjustment' / 'ADM': bogus markup above MSRP. Always refusable.\n\n• Add-ons bundled at signing: paint protection film ($8k), undercoating ($5k), nitrogen-filled tires, VIN etching. Actual cost to dealer: $50–200 each. Profit margin: 90%+.\n\n• Dealer-arranged financing: they mark up the interest rate from what the bank offered you. If you qualify for 5% at the bank, dealer might show you 9%.\n\n• Spot delivery / 'yo-yo financing': you drive home, days later they call saying financing fell through. New loan offered at worse terms. Legal in most states; walk away.\n\n• Extended warranty at F&I: third-party warranties have ~40% claim denial rates. Manufacturer warranties are priced similarly via your mechanic later.",
        questions: [
          { q: "A dealer shows a $39k car at $52k selling price. The difference is 'PPF' and 'Undercoating.' What should you do?", choices: ["Accept — they're standard", "Negotiate them out completely", "Only accept undercoating", "Sign — they're required"], correctIdx: 1,
            explain: "PPF and undercoating are pure-profit dealer add-ons. Actual cost <$200. Refuse both; real dealers will drop them to keep the sale." },
          { q: "Pre-qualified at credit union for 6%. Dealer offers 10% 'because of your credit.' Next move?", choices: ["Take the 10% — they know better", "Show them your pre-qualification and ask them to match", "Walk out", "Pay cash"], correctIdx: 1,
            explain: "Dealer financing is frequently marked up. Show the competing offer; they'll often match or beat. If not, finance at your credit union." },
          { q: "Car payment $327/month on a lease sounds great. What's the problem?", choices: ["Nothing, it's affordable", "You own nothing at end; mileage overage is $0.20–0.25/mile", "Leases have no insurance", "Leases are illegal"], correctIdx: 1,
            explain: "Leasing is renting. Three years × $327 = $11,772 with nothing to show. Mileage overages punish heavy drivers." },
        ],
      },
      {
        id: "dealer_finance",
        title: "Loans, APR, and Being Underwater",
        summary: "Why 72-month auto loans are traps.",
        reading: "APR (Annual Percentage Rate) is the real cost of borrowing, including fees. Common dealer tricks:\n\n• Stretched loans (72, 84, 96 months): shrinks monthly payment, explodes total interest. A 72-month loan at 17% on $50k = ~$28k in interest.\n\n• 'Subprime' = above ~10% APR. If your score is fair-to-poor, dealers steer you to subprime lenders at 15–22%.\n\n• Being 'underwater' / 'upside-down': owing more on the loan than the car is worth. New cars lose 20% of value the moment you drive off. Stretched loans keep you underwater for years.\n\n• GAP insurance: covers the difference between insurance payout and loan balance if the car is totaled. Useful ONLY if you're underwater. Buy it from your auto insurer for $30–50/year, not from the dealer for $995.\n\n• Rollover negative equity: if you trade in a car while still owing, the difference rolls into your next loan. Now you're underwater before you even drive off.\n\nRule of thumb: loan term ≤ 60 months, monthly payment ≤ 10% of take-home pay, and total auto costs (loan + insurance + gas + maintenance) ≤ 20%.",
        questions: [
          { q: "A 17% APR 72-month loan on a $50k car costs you how much in interest (roughly)?", choices: ["$3,000", "$10,000", "$28,000", "$50,000"], correctIdx: 2,
            explain: "Around $28k in interest — more than half the price of the car itself. Subprime auto loans are the single most destructive product for young buyers." },
          { q: "You're 'underwater' on a $45k car after 6 months. Owing $44k, car worth $32k. What happened?", choices: ["Normal depreciation plus slow principal payoff", "You paid too much for insurance", "The car was stolen", "Your rate went up"], correctIdx: 0,
            explain: "New cars lose ~20% instantly. Stretched loans pay mostly interest for the first year, not principal. This is the classic upside-down trap." },
          { q: "Where should you buy GAP insurance?", choices: ["Dealer F&I at $995", "Auto insurer at ~$40/year", "Don't buy GAP", "Credit union only"], correctIdx: 1,
            explain: "Auto insurers sell GAP as a policy add-on for a tiny fraction of the dealer's one-time price. Same coverage." },
        ],
      },
    ],
  },

  hospital: {
    lessons: [
      { t: "Triage before the ER", d: "Nurse hotlines (often free with Marketplace plans) route you to the right setting. ER is 5–10× the cost of urgent care." },
      { t: "Urgent care handles 80% of 'emergencies'", d: "Sprains, minor cuts, infections, most pain. ~$200 uninsured vs $1,500+ at an ER." },
      { t: "Always request an itemized bill", d: "Uninsured rates are 2–4× Medicare rates. Itemized bill + Medicare comparison cuts bills 40–70%." },
      { t: "Nonprofit hospitals must offer charity care", d: "Required under the ACA. Under 300% Federal Poverty Level usually means 80–100% forgiveness. Apply BEFORE paying." },
      { t: "Open enrollment is hard-deadline", d: "Nov 1 – Jan 15 (varies by state). Miss it and you can't enroll until next year, barring 'qualifying life events.'" },
      { t: "Medical debt in collections = credit damage above $500", d: "New FICO rules ignore medical debt under $500 and paid-off debt. Anything unpaid above $500 still tanks your score." },
      { t: "Health-sharing ministries are NOT insurance", d: "Unregulated. Deny claims routinely. Not real coverage at any price." },
    ],
    analyze: (s) => {
      const r: { kind: "good" | "bad" | "mid"; text: string }[] = [];
      if (s.flags.has("triaged")) r.push({ kind: "good", text: "You called a nurse hotline first. Free, fast, and routes you to the right care setting." });
      if (s.flags.has("tried_uc")) r.push({ kind: "good", text: "Urgent care first is the right escalation ladder for most non-life-threatening issues." });
      if (s.flags.has("asked_charity")) r.push({ kind: "good", text: "Asking about charity care before treatment is how you unlock it — most patients never ask." });
      if (s.flags.has("negotiated_bill")) r.push({ kind: "good", text: "Itemized bill + Medicare comparison saved you thousands. This works at nearly every hospital." });
      if (s.flags.has("charity_care")) r.push({ kind: "good", text: "You qualified for nonprofit financial assistance. Legally required — most patients never apply." });
      if (s.flags.has("medical_collections")) r.push({ kind: "bad", text: "Medical debt in collections is the #1 reason credit scores collapse in the 20s. Fully avoidable with a payment plan." });
      if (s.flags.has("insured")) r.push({ kind: "good", text: "You enrolled in real Marketplace coverage. One ER visit per year pays for the subsidized premium many times over." });
      if (s.flags.has("fake_insurance")) r.push({ kind: "bad", text: "Health-sharing ministries aren't regulated insurance. First real claim gets denied." });
      return r;
    },
    quizzes: [
      {
        id: "care_setting",
        title: "ER vs Urgent Care vs Telehealth",
        summary: "Choose the right care setting and save thousands.",
        reading: "Health costs in the US are dramatically dependent on WHERE you go. Same problem, different bills:\n\n• Nurse hotline (often free with most insurance; 988 for mental health): $0.\n• Telehealth (Teladoc, Amwell): $0–40 visit.\n• Primary care / clinic: $100–200 uninsured.\n• Urgent care: $150–300 uninsured.\n• Freestanding imaging center (walk-in CT/X-ray): $300–800.\n• Emergency Room: $1,500–8,000+ for a simple visit.\n\nThe ER is where to go when: chest pain, stroke symptoms, severe bleeding, loss of consciousness, severe abdominal pain with fever, poisoning. Otherwise, start lower on the ladder.\n\nHospital-owned 'freestanding ERs' LOOK like urgent care but bill as emergency rooms. Check signage.\n\nKey tip: If you DO go to the ER, the physician often bills separately from the facility. Expect two bills. A third bill may come from radiology. Don't panic — they're the same visit.",
        questions: [
          { q: "You cut your finger chopping onions. Bleeding won't fully stop. Best care setting?", choices: ["ER immediately", "Urgent care", "Primary care next week", "Tough it out"], correctIdx: 1,
            explain: "Urgent care is designed for this. ~$200 uninsured vs $1,500+ at ER. Real emergency = severe bleeding that won't stop with pressure after 15 minutes; that's an ER trip." },
          { q: "What's usually FREE with a real insurance plan?", choices: ["The ER", "Specialist visits", "Nurse hotline / telehealth", "Prescriptions"], correctIdx: 2,
            explain: "Most Marketplace plans include a 24/7 nurse hotline. Many also include free telehealth for common issues. Underused." },
          { q: "You go to the ER. You get ONE bill, right?", choices: ["Yes, always", "No — usually separate bills from facility, physician, and sometimes radiology", "Only if uninsured", "Only if you don't ask"], correctIdx: 1,
            explain: "ER physicians often bill through a separate corporate entity from the facility. Radiology is a third. All are for the same visit." },
        ],
      },
      {
        id: "medical_bills",
        title: "Negotiating a Medical Bill",
        summary: "Itemized bills, charity care, and payment plans.",
        reading: "Uninsured patients are billed at 'chargemaster rates' — 2 to 4 times what insurance companies pay for identical care. Those rates are negotiable. Process:\n\n1. Request an itemized bill within 30 days. The summary bill usually doesn't show individual codes (CPT codes). You need them to check for errors.\n\n2. Look for errors — duplicate charges, upcoded services, care not received. Around 40% of hospital bills contain errors per some studies.\n\n3. Compare each line to Medicare rates (available at cms.gov or via the Healthcare Bluebook). Ask the billing office to charge Medicare rate. They often agree.\n\n4. Apply for financial assistance / charity care. ACA-compliant nonprofit hospitals (most) MUST have a policy. At 200–300% FPL you often get 80–100% forgiveness. APPLY BEFORE PAYING.\n\n5. Ask about payment plans — most hospitals offer 0% interest plans for 12–24 months. Far better than charging a credit card.\n\n6. Don't ignore the bill. After 120 days, hospitals sell to collectors. Once sold, your FICO drops and collectors add 10–30% fees.\n\nMedical debt under $500 no longer affects credit scores under new FICO rules. Anything above $500 still does.",
        questions: [
          { q: "You get a $7,655 ER bill uninsured. Best first action?", choices: ["Pay it in full to avoid collections", "Request an itemized bill and apply for financial assistance", "Ignore it", "Put it on a credit card"], correctIdx: 1,
            explain: "Itemized bill + charity care application = typical savings of 50–90%. You'll likely end up paying a fraction." },
          { q: "Nonprofit hospitals are required by law to offer what?", choices: ["Free parking", "Financial assistance policies for low-income patients", "24/7 ER access", "Discounts for seniors only"], correctIdx: 1,
            explain: "The ACA requires all nonprofit hospitals (the majority) to have written financial assistance policies. Most eligible patients never apply." },
          { q: "You ignore a $9,000 hospital bill for 6 months. What's likely?", choices: ["It gets forgiven", "It's sold to collections and hits your credit", "Nothing, because medical debt doesn't count", "The hospital forgets"], correctIdx: 1,
            explain: "Bills are typically sold after 90–120 days. Unpaid medical debt over $500 still tanks FICO scores. This is why a $50/month payment plan is worth asking for." },
        ],
      },
    ],
  },
};
