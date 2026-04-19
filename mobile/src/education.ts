import { EducationPack, GameState } from "./types";

export const EDUCATION: Record<string, EducationPack> = {
  taxes: {
    lessons: [
      { t: "File on time, even if you can't pay", d: "The failure-to-file penalty is 5%/month (up to 25%). The failure-to-pay penalty is 0.5%/month. Filing late is ten times worse than paying late." },
      { t: "Cash income still counts", d: "Side gigs, Venmo tips, tutoring — over $400 is reportable. IRS has automated matching for W-2s and 1099s; any audit surfaces cash." },
      { t: "Stay on a parent's insurance until 26", d: "ACA lets you stay on a parent's employer plan until 26. Low income usually qualifies for Medicaid. 'Health sharing ministries' aren't insurance." },
      { t: "Your W-4 is not set-and-forget", d: "Claiming 'exempt' when you aren't = owing thousands in April. For most single workers: single, no dependents, no adjustments is correct." },
      { t: "Build credit before you need it", d: "Secured card + paying in full every month = fastest legit way to a 700+ score. Authorized-user on a parent's card also works." },
      { t: "Never skip a 401(k) match", d: "Employer match is a 100% instant return. Starting at 19 vs 30 is worth ~$300k by retirement." },
      { t: "Federal agents: lawyer first, talk later", d: "Lying to an IRS or FBI agent is a separate felony (18 USC 1001). Voluntary disclosure reduces penalties. Fleeing escalates everything." },
      { t: "Money mule schemes end in charges", d: "Anyone asking to 'deposit checks' for a cut = wire fraud and laundering. Report to your bank's fraud line." },
    ],
    analyze: (s: GameState) => {
      const r: { kind: "good" | "bad" | "mid"; text: string }[] = [];
      if (s.flags.has("filed_honestly")) r.push({ kind: "good", text: "You filed an honest return including your cash income. Biggest risk-reducer in the scenario." });
      else if (s.flags.has("underreported")) r.push({ kind: "mid", text: "W-2-only return. Usually ignored, but evasion on the cash income." });
      else if (s.flags.has("didnt_file")) r.push({ kind: "bad", text: "You never filed. Failure-to-file penalties are ten times worse than failure-to-pay." });
      if (s.flags.has("tax_fraud")) r.push({ kind: "bad", text: "Fake-dependents fraud is caught at ~98% rate by IRS matching." });
      if (s.flags.has("insured")) r.push({ kind: "good", text: "You got real health insurance. One uninsured ER visit wipes out a year's savings." });
      if (s.flags.has("fake_insurance")) r.push({ kind: "bad", text: "'MediSave Plus' is a health-sharing ministry, not insurance. Unregulated." });
      if (s.flags.has("no_insurance_car")) r.push({ kind: "bad", text: "Driving uninsured is a misdemeanor in most states." });
      if (s.flags.has("evaded_police")) r.push({ kind: "bad", text: "Fleeing a traffic stop upgrades every other problem you had." });
      if (s.flags.has("money_mule")) r.push({ kind: "bad", text: "Mule schemes are federal wire fraud. One deposit is enough." });
      if (s.flags.has("felony_record")) r.push({ kind: "bad", text: "A felony record follows every future application." });
      if (s.flags.has("fugitive")) r.push({ kind: "bad", text: "Fleeing made it a federal fugitive problem. Never works." });
      if (s.flags.has("building_credit")) r.push({ kind: "good", text: "Building credit at 19 pays off for 40 years of loans and leases." });
      if (s.flags.has("retirement_started")) r.push({ kind: "good", text: "Taking the 401(k) match is worth ~$300k by retirement vs starting at 30." });
      if (s.law >= 50) r.push({ kind: "bad", text: `Final Law heat: ${Math.round(s.law)}%. Multiple risky choices stacked into enforcement risk.` });
      else if (s.law <= 15) r.push({ kind: "good", text: "Law heat stayed low — you kept every interaction clean." });
      return r;
    },
  },

  lease: {
    lessons: [
      { t: "Never pay before a showing", d: "Real landlords take application fees AFTER a tour, usually by check or card. Zelle to a personal account = scam. Reverse-image search the photos." },
      { t: "Read every clause — take it home", d: "Any legit landlord will let you take the lease home. Mandatory renter's insurance is normal. 'Tenant pays landlord's legal fees' is predatory." },
      { t: "Security deposits are capped by law", d: "Most states cap at 1–2 months' rent. 'First, last, and two months' is illegal in most places." },
      { t: "Document everything in writing", d: "Certified mail, emails, photos with timestamps. Verbal complaints are worth nothing in court." },
      { t: "Warranty of habitability is a real right", d: "Mold, no heat, no water — landlords must fix. Withholding rent requires escrow; just not paying = eviction." },
      { t: "Fight for your deposit", d: "Most states require itemized receipts within 14–30 days. Small claims court is designed for this — $75 filing fee, no lawyer needed." },
      { t: "Unauthorized occupants = eviction risk", d: "Most leases cap guests at 14 days. Add a roommate via written notice, not in secret." },
    ],
    analyze: (s: GameState) => {
      const r: { kind: "good" | "bad" | "mid"; text: string }[] = [];
      if (s.flags.has("scammed")) r.push({ kind: "bad", text: "You paid Greg before the showing. Every rental scam uses urgency + upfront payment." });
      else r.push({ kind: "good", text: "You didn't pay before the showing. That instinct shuts down 95% of rental scams." });
      if (s.flags.has("read_lease")) r.push({ kind: "good", text: "You read the lease. Saves young renters more money than any other habit." });
      if (s.flags.has("bad_lease")) r.push({ kind: "bad", text: "You signed without reading. Hidden clauses cost you every month." });
      if (s.flags.has("documented_repair")) r.push({ kind: "good", text: "You documented the mold in writing. Habitability cases are decided on paper trails." });
      if (s.flags.has("got_deposit")) r.push({ kind: "good", text: "You fought for your deposit. Most renters eat this loss." });
      if (s.flags.has("eviction_record")) r.push({ kind: "bad", text: "An eviction on record means no rental approval for 7 years." });
      if (s.flags.has("illegal_sublease")) r.push({ kind: "bad", text: "Illegal subletting makes you an eviction risk AND a tax evader." });
      return r;
    },
  },

  job: {
    lessons: [
      { t: "Everything is negotiable before signing", d: "~60% of first offers have room. After signing, leverage vanishes. Always ask for time to review." },
      { t: "Total comp > base salary", d: "$62k with good benefits can out-earn $68k without. Always ask for the full breakdown." },
      { t: "Read non-competes carefully", d: "Unenforceable for most workers in CA, ND, OK, MN and increasingly elsewhere (FTC rule). Even where valid, most are overbroad." },
      { t: "Arbitration isn't always final", d: "Some carve out wage/hour claims. Some add 30-day opt-outs. Ask. Never sign an exit release without a lawyer." },
      { t: "HR protects the company, not you", d: "Document harassment in writing, cc personal email, call an employment lawyer for free intake. Retaliation is illegal — you need a paper trail." },
      { t: "Optimize your W-4 on day one", d: "For most single workers: single, no dependents, no adjustments. Fake dependents = owing thousands in April plus penalties." },
      { t: "HSAs are the best tax-advantaged account", d: "Triple tax benefit: pre-tax in, tax-free growth, tax-free out for medical. Only on High Deductible Health Plans." },
      { t: "Audit every paycheck", d: "Payroll errors happen constantly. Unauthorized deductions violate FLSA. Wrong-state withholding is a common expensive mistake." },
      { t: "Verbal offers aren't offers", d: "Until it's in writing, it didn't happen. Never leave a current job on a phone call." },
    ],
    analyze: (s: GameState) => {
      const r: { kind: "good" | "bad" | "mid"; text: string }[] = [];
      if (s.flags.has("signed_blind")) r.push({ kind: "bad", text: "You signed a 31-page offer without reading. Non-compete, arbitration, and confidentiality are now binding." });
      else if (s.flags.has("negotiated")) r.push({ kind: "good", text: "You negotiated before signing. Thousands in comp for one uncomfortable conversation." });
      if (s.flags.has("benefits_optimized")) r.push({ kind: "good", text: "Benefits optimized. Thousands per year + $300k+ compounded by retirement." });
      if (s.flags.has("w4_wrong")) r.push({ kind: "bad", text: "Fake dependents on W-4 = underpayment penalties. A 60-second fix costs years." });
      if (s.flags.has("documented_harassment")) r.push({ kind: "good", text: "You documented harassment in writing. That paper trail gave you leverage at exit." });
      if (s.flags.has("signed_nda")) r.push({ kind: "bad", text: "You signed an HR release without a lawyer. Likely waived claims worth more than the payment." });
      if (s.flags.has("signed_release")) r.push({ kind: "bad", text: "Exit release signed without review. PTO and final wages are legally yours without signing anything." });
      if (s.flags.has("sued")) r.push({ kind: "bad", text: "You took the competitor job without checking enforceability. Cease-and-desist killed the offer." });
      return r;
    },
  },
};
