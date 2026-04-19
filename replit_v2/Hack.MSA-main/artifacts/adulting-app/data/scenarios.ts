export interface SceneChoice {
  id: string;
  label: string;
  kind: 'good' | 'bad' | 'meh';
  feedback: string;
  deltaKnowledge?: number;
  deltaScore?: number;
  deltaMoney?: number;
  deltaStress?: number;
  addFlags?: string[];
  removeFlags?: string[];
  scheduleEvent?: { turnsFromNow: number; sceneId: string };
  nextId: string | null;
  dynamicNext?: (flags: Set<string>, score: number) => string;
}

export interface Scene {
  id: string;
  title: string;
  text: string;
  choices: SceneChoice[];
  isEnding?: boolean;
  endingKind?: 'good' | 'bad' | 'meh';
  endingTitle?: string;
}

export interface Scenario {
  id: string;
  name: string;
  who: string;
  desc: string;
  estimatedTime: string;
  startMoney: number;
  startSceneId: string;
  scenes: Record<string, Scene>;
  premium?: boolean;
  price?: number;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "taxes",
    name: "Tax Season",
    who: "Joe Walker · 19 · Walmart cashier",
    desc: "It's almost April 15th. A W-2, some cash gigs, and a choice about whether to tell the truth. Opens into insurance, a traffic stop, jury duty, credit, and a job promotion.",
    estimatedTime: "~12 decisions",
    startMoney: 1560,
    startSceneId: "intro",
    scenes: {
      intro: {
        id: "intro",
        title: "April 14th · 11:47 PM",
        text: "You are Joe Walker. Nineteen. You've been a part-time cashier at the Walmart on Route 9 for fourteen months. Your mom keeps texting you links to 'how to do your taxes' TikToks. Your roommate Dev is asleep on the couch with a half-eaten burrito on his chest.\n\nOn your laptop, sixteen tabs are open. One of them is flashing an ad: 'GET YOUR REFUND IN 24 HOURS — NO QUESTIONS ASKED.'\n\nYou pull the crumpled W-2 out of a drawer. $1,560. That's the official number. You also did $400 of lawn work for Mr. Pell across the street last summer — cash, no paperwork. There's a Venmo from your cousin's wedding you sort of DJ'd for ($250). And you sold an old gaming PC on Facebook Marketplace for $600.\n\nTomorrow is the federal deadline. Your dad called you 'a grown man now' at Thanksgiving and you've been trying to figure out what that means ever since.\n\nWhat do you do tonight?",
        choices: [
          {
            id: "c1", label: "Go to IRS Free File. Report the W-2 plus the $400 lawn cash. Skip the PC (personal item sold at a loss) and the $250 gift-ish DJ money.",
            kind: 'good',
            feedback: "Free File is legit for incomes under ~$79k. Cash gigs over $400 require reporting. Selling personal items at a loss is generally not taxable. Nicely threaded.",
            deltaKnowledge: 4, deltaScore: 12,
            addFlags: ["filed_honestly"],
            nextId: "w4_fix"
          },
          {
            id: "c2", label: "File the W-2 only. The cash jobs are invisible. Who's gonna check?",
            kind: 'meh',
            feedback: "The IRS has matching software for W-2s and 1099s — not for cash. Technically tax evasion on $400, usually ignored. Usually.",
            deltaKnowledge: 1, deltaScore: 2,
            addFlags: ["underreported", "irs_risk"],
            nextId: "w4_fix"
          },
          {
            id: "c3", label: "Use TurboTax 'Free Edition.' It keeps asking for $89 upgrades; click through.",
            kind: 'meh',
            feedback: "TurboTax Free Edition is famously narrow — any side income usually forces an upgrade. You paid $89 to file a return that should've been free.",
            deltaMoney: -89, deltaKnowledge: 1, deltaScore: 2,
            addFlags: ["paid_turbotax"],
            nextId: "w4_fix"
          },
          {
            id: "c4", label: "Drive to the strip-mall 'Rapid Refund' place. $200 fee, refund advance same day.",
            kind: 'meh',
            feedback: "Refund advance loans eat fees and often over-withhold. On a ~$200 refund you basically broke even to pay someone to file a 1040-EZ.",
            deltaMoney: -200, deltaScore: 3,
            addFlags: ["paid_preparer"],
            nextId: "w4_fix"
          },
          {
            id: "c5", label: "Don't file. You barely made anything. Taxes are for people with real money.",
            kind: 'bad',
            feedback: "Failure-to-file penalty is 5%/month up to 25%, plus interest. Worse: you probably had a refund, which you forfeit after 3 years. The IRS is patient.",
            deltaStress: 25, deltaScore: -10,
            addFlags: ["didnt_file", "irs_risk"],
            scheduleEvent: { turnsFromNow: 3, sceneId: "irs_letter" },
            nextId: "skipped_filing"
          },
          {
            id: "c6", label: "Let your uncle 'file for you.' He says claiming three fake kids = $6k refund. 70/30 split.",
            kind: 'bad',
            feedback: "That's straight-up fraud. The refund will be huge. So will the federal charges. Your name, your return, your problem.",
            deltaMoney: 6000, deltaStress: 15, deltaScore: -20,
            addFlags: ["tax_fraud", "irs_risk"],
            scheduleEvent: { turnsFromNow: 2, sceneId: "irs_visit" },
            nextId: "fraud_refund"
          }
        ]
      },
      w4_fix: {
        id: "w4_fix", title: "Two days later — the break room at Walmart",
        text: "Your manager Rhonda slides a W-4 across the lunch table. 'You filled this out last year as EXEMPT. That's why nothing was withheld. Refile it or I have to bump your withholding to single-zero.'\n\nYou don't really know what any of those words mean.",
        choices: [
          { id: "c1", label: "Fill it out honestly. Single, no dependents, no adjustments.", kind: 'good', feedback: "Correct default for most 19-year-olds. Withholding now = no giant surprise bill later.", deltaKnowledge: 3, deltaScore: 6, addFlags: ["w4_correct"], nextId: "refund" },
          { id: "c2", label: "Claim 'EXEMPT' again so more cash hits your paycheck.", kind: 'bad', feedback: "You're only truly exempt if you had zero liability last year AND expect zero this year. Claiming it falsely = underpayment penalties.", deltaScore: -4, addFlags: ["w4_exempt"], scheduleEvent: { turnsFromNow: 4, sceneId: "owe_irs" }, nextId: "refund" },
          { id: "c3", label: "Ask Rhonda what it even means before signing.", kind: 'good', feedback: "Asking before signing is always worth 30 seconds of feeling dumb. Rhonda's done this for 22 years.", deltaKnowledge: 4, deltaScore: 7, addFlags: ["w4_correct"], nextId: "refund" },
          { id: "c4", label: "Copy what Dev put on his. He seems to know things.", kind: 'meh', feedback: "Dev claims four dependents and he has zero. You'll figure it out in April.", deltaScore: -1, addFlags: ["w4_wrong"], nextId: "refund" }
        ]
      },
      refund: {
        id: "refund", title: "A week later",
        text: "A $112 refund lands in your account. Not life-changing — but it's yours. Dev waves an envelope in your face.\n\n'Bro. Open enrollment. You're still on your mom's insurance till 26, right?'\n\nYou're 19. You actually don't remember.",
        choices: [
          { id: "c1", label: "Call your mom. Confirm you're on her employer plan.", kind: 'good', feedback: "ACA lets you stay on a parent's plan until 26. Two-minute call, zero dollars.", deltaKnowledge: 2, deltaScore: 8, addFlags: ["insured"], nextId: "car_trouble" },
          { id: "c2", label: "Sign up for a $40/mo 'MediSave Plus' ad from Instagram.", kind: 'bad', feedback: "That's a health-sharing ministry, not insurance. Not regulated. Denies claims routinely.", deltaMoney: -40, deltaScore: -5, addFlags: ["fake_insurance"], nextId: "car_trouble" },
          { id: "c3", label: "Skip it. You're young and invincible.", kind: 'meh', feedback: "One ER visit wipes that logic out. But statistically, you might get lucky.", deltaScore: -2, addFlags: ["uninsured"], nextId: "car_trouble" },
          { id: "c4", label: "Enroll in a marketplace Bronze plan — $0 premium with subsidies at your income.", kind: 'good', feedback: "At your AGI you'd actually qualify for Medicaid in most states. Bronze works too. Smart move.", deltaKnowledge: 3, deltaScore: 9, addFlags: ["insured"], nextId: "car_trouble" }
        ]
      },
      skipped_filing: {
        id: "skipped_filing", title: "Three weeks later",
        text: "You didn't file. Nothing has happened. You got away with it. Clearly.\n\nYour buddy offers you a used 2009 Civic for $2,000 cash.",
        choices: [
          { id: "c1", label: "Buy it. Register it. Get liability insurance (~$90/mo).", kind: 'good', feedback: "Liability is legally required in 48 states. You did it right.", deltaMoney: -2090, deltaScore: 6, addFlags: ["has_car", "insured_car"], nextId: "car_trouble" },
          { id: "c2", label: "Buy it. Skip insurance. Skip registration. Drive anyway.", kind: 'bad', feedback: "Driving uninsured is a misdemeanor in most states. Unregistered is a ticket waiting to happen.", deltaMoney: -2000, deltaScore: -8, addFlags: ["has_car", "no_insurance_car"], scheduleEvent: { turnsFromNow: 2, sceneId: "traffic_stop" }, nextId: "car_trouble" },
          { id: "c3", label: "Pass. Can't afford it right now.", kind: 'meh', feedback: "Responsible but limits your job options.", deltaScore: 1, nextId: "car_trouble" }
        ]
      },
      fraud_refund: {
        id: "fraud_refund", title: "Two weeks later",
        text: "$6,000 hit your account. Your uncle wants his $2,000 cut. You feel like a king. A very nervous king.",
        choices: [
          { id: "c1", label: "Pay him. Blow the rest on a PS5, sneakers, DoorDash.", kind: 'bad', feedback: "Spent evidence is still evidence.", deltaMoney: -5500, deltaStress: 10, nextId: "car_trouble" },
          { id: "c2", label: "Pay him. Stash the rest. Pretend it didn't happen.", kind: 'meh', feedback: "You still committed fraud. Hiding it doesn't undo it.", deltaMoney: -2000, deltaStress: 5, nextId: "car_trouble" },
          { id: "c3", label: "Call the IRS. Admit the fraud. Offer to pay it back.", kind: 'good', feedback: "Voluntary disclosure massively reduces penalties. Brave call.", deltaMoney: -6000, deltaKnowledge: 5, deltaScore: 12, removeFlags: ["tax_fraud", "irs_risk"], nextId: "car_trouble" }
        ]
      },
      car_trouble: {
        id: "car_trouble", title: "A month later · Tuesday 7:42 AM",
        text: "You're running late. Light turns yellow. You gun it. Blue lights. Immediately.\n\n'License and registration.'",
        choices: [
          { id: "c1", label: "Hand them over calmly. 'Yes sir, no sir.' Take the ticket.", kind: 'good', feedback: "Polite compliance + signing the ticket (not an admission) is the playbook. Fight it in court if you want.", deltaMoney: -175, deltaKnowledge: 1, deltaScore: 4, nextId: "jury_duty" },
          { id: "c2", label: "Argue. 'The light was clearly still yellow.' Demand a supervisor.", kind: 'meh', feedback: "Your rights exist, but roadside is the worst venue to exercise them.", deltaMoney: -175, deltaStress: 8, deltaScore: -2, nextId: "jury_duty" },
          { id: "c3", label: "Speed off. You've seen movies.", kind: 'bad', feedback: "Felony evading. You've also just upgraded every other flag you have.", deltaStress: 40, deltaScore: -25, addFlags: ["evaded_police"], scheduleEvent: { turnsFromNow: 1, sceneId: "warrant" }, nextId: "jury_duty" },
          { id: "c4", label: "Consent to a full vehicle search to 'prove you have nothing to hide.'", kind: 'meh', feedback: "You aren't obligated to consent. 'I do not consent to searches' is a full sentence.", deltaMoney: -175, deltaKnowledge: 2, deltaScore: 1, nextId: "jury_duty" }
        ]
      },
      jury_duty: {
        id: "jury_duty", title: "Six weeks later",
        text: "A stiff envelope: JURY SUMMONS. Report Monday at 8 AM or face contempt.",
        choices: [
          { id: "c1", label: "Show up. Sit in a room for 6 hours. Get dismissed.", kind: 'good', feedback: "Civic duty. Employers must legally give time off (unpaid in many states, but protected).", deltaScore: 6, deltaKnowledge: 1, nextId: "credit" },
          { id: "c2", label: "Ignore it. Trash it.", kind: 'bad', feedback: "Failure to appear = bench warrant in many jurisdictions. Fines up to $1,000.", deltaStress: 20, deltaScore: -10, addFlags: ["missed_jury"], scheduleEvent: { turnsFromNow: 2, sceneId: "warrant" }, nextId: "credit" },
          { id: "c3", label: "Request a postponement online — usually granted once.", kind: 'good', feedback: "Totally legit. Most courts allow it with a few clicks.", deltaScore: 4, deltaKnowledge: 2, nextId: "credit" },
          { id: "c4", label: "Show up dressed as a clown to get dismissed.", kind: 'meh', feedback: "You did your duty. Technically. Judge was not amused.", deltaStress: 3, deltaScore: 1, nextId: "credit" }
        ]
      },
      credit: {
        id: "credit", title: "A few months in",
        text: "Mail: 'PRE-APPROVED! 29.99% APR, $500 limit.' Also: a secured card ($200 deposit, reports to all three bureaus).",
        choices: [
          { id: "c1", label: "Secured card. Charge gas. Pay in full every month.", kind: 'good', feedback: "Fastest legit way to build credit at 19. Full payment = no interest.", deltaMoney: -200, deltaKnowledge: 3, deltaScore: 10, addFlags: ["building_credit"], nextId: "side_hustle" },
          { id: "c2", label: "29.99% card. Max it on apartment furniture.", kind: 'bad', feedback: "Minimum payments on $500 at 29.99% = years of interest. Classic trap.", deltaMoney: 500, deltaStress: 15, deltaScore: -10, addFlags: ["credit_card_debt"], nextId: "side_hustle" },
          { id: "c3", label: "Neither. Cash only forever.", kind: 'meh', feedback: "No credit history = hard to rent, hard to get a car loan. Not evil, just slow.", deltaScore: -1, nextId: "side_hustle" },
          { id: "c4", label: "Become an authorized user on your mom's 20-year-old card.", kind: 'good', feedback: "Inherits her history. Legal, effective, free.", deltaKnowledge: 2, deltaScore: 8, addFlags: ["building_credit"], nextId: "side_hustle" }
        ]
      },
      side_hustle: {
        id: "side_hustle", title: "Four months later",
        text: "Your cousin Marco wants you to 'deposit checks for him' at your bank. He'll give you 10% per check. Says it's 'invoice processing.'",
        choices: [
          { id: "c1", label: "Do it. Easy money.", kind: 'bad', feedback: "Mule scheme. Federal wire fraud + money laundering. Your account gets frozen and charges follow you.", deltaMoney: 400, deltaScore: -30, addFlags: ["money_mule"], scheduleEvent: { turnsFromNow: 2, sceneId: "fbi_visit" }, nextId: "healthcare" },
          { id: "c2", label: "Decline. Hard no.", kind: 'good', feedback: "Correct. Anyone asking to run money through your account is scamming you or using you.", deltaKnowledge: 4, deltaScore: 10, nextId: "healthcare" },
          { id: "c3", label: "Agree, 'just once' to see if it's real.", kind: 'bad', feedback: "One deposit is enough for charges. There is no 'just once.'", deltaMoney: 40, deltaScore: -20, addFlags: ["money_mule"], scheduleEvent: { turnsFromNow: 3, sceneId: "fbi_visit" }, nextId: "healthcare" },
          { id: "c4", label: "Report him to the bank's fraud line.", kind: 'good', feedback: "Harsh but right. Banks log this. You're protected.", deltaKnowledge: 3, deltaScore: 8, nextId: "healthcare" }
        ]
      },
      healthcare: {
        id: "healthcare", title: "Saturday · 2 AM",
        text: "You slice your hand open chopping onions. It won't stop bleeding.",
        choices: [
          { id: "c1", label: "Urgent care (~$150 insured / $300 uninsured).", kind: 'good', feedback: "Right choice for non-life-threatening. ER is 5–10× more.", deltaMoney: -150, deltaScore: 6, deltaKnowledge: 2, nextId: "retirement" },
          { id: "c2", label: "ER. You want the 'real' doctors.", kind: 'meh', feedback: "Stitches in ER = $1,500–$3,000. Insurance helps but deductibles exist.", deltaMoney: -500, deltaScore: -3, nextId: "retirement" },
          { id: "c3", label: "Superglue and a paper towel. YouTube said it works.", kind: 'bad', feedback: "Sometimes works. Sometimes it's a tendon infection.", deltaStress: 10, deltaScore: -4, nextId: "retirement" },
          { id: "c4", label: "Call the nurse hotline first (free with most insurance).", kind: 'good', feedback: "Triage calls are free and tell you exactly where to go. Underused.", deltaMoney: -150, deltaKnowledge: 3, deltaScore: 7, nextId: "retirement" }
        ]
      },
      retirement: {
        id: "retirement", title: "Promotion · payroll onboarding",
        text: "You got promoted. $42k/year. HR slides a 401(k) form across the desk. Employer matches 100% up to 4%.",
        choices: [
          { id: "c1", label: "Contribute 4%. Free $1,680/year in match.", kind: 'good', feedback: "Match is a 100% instant return. Not contributing is leaving cash on the table.", deltaMoney: 1680, deltaKnowledge: 5, deltaScore: 15, addFlags: ["retirement_started"], nextId: "finale" },
          { id: "c2", label: "0%. 'I'll start when I'm older.'", kind: 'bad', feedback: "Starting at 30 vs 19 costs ~$300k by retirement. Compounding is unfair.", deltaScore: -8, nextId: "finale" },
          { id: "c3", label: "15%. Max it out aggressively.", kind: 'meh', feedback: "Admirable, but on $42k your budget will hurt. 4–6% early is the sweet spot.", deltaKnowledge: 3, deltaScore: 5, addFlags: ["retirement_started"], nextId: "finale" },
          { id: "c4", label: "Ask HR about Roth vs Traditional before picking.", kind: 'good', feedback: "At low income, Roth usually wins. Asking is 80% of the battle.", deltaKnowledge: 6, deltaScore: 12, addFlags: ["retirement_started"], nextId: "finale" }
        ]
      },
      finale: {
        id: "finale", title: "Five years later",
        text: "You're 24. Let's see how it played out.",
        choices: [
          {
            id: "c1", label: "Continue...", kind: 'meh', feedback: "Let's see what happens.",
            nextId: null,
            dynamicNext: (flags, score) => {
              if (flags.has('felony_record') || flags.has('fugitive')) return 'ending_jail';
              if (score >= 60) return 'ending_good';
              return 'ending_mid';
            }
          }
        ]
      },
      irs_letter: {
        id: "irs_letter", title: "⚠ A letter arrives",
        text: "IRS Notice CP59. 'We have no record of your return.' $340 in penalties and interest.",
        choices: [
          { id: "c1", label: "File immediately. Pay. Apologize.", kind: 'good', feedback: "Penalties stop accruing the day you file. Always file, even late.", deltaMoney: -340, deltaScore: 3, removeFlags: ["didnt_file", "irs_risk"], nextId: null },
          { id: "c2", label: "Ignore it.", kind: 'bad', feedback: "The IRS does not forget. The next letter is from a Revenue Officer.", deltaStress: 20, deltaScore: -10, scheduleEvent: { turnsFromNow: 3, sceneId: "irs_visit" }, nextId: null }
        ]
      },
      irs_visit: {
        id: "irs_visit", title: "⚠ Knock knock",
        text: "Two IRS agents at your door. They know. They want to talk.",
        choices: [
          { id: "c1", label: "Cooperate. Ask for a payment plan.", kind: 'good', feedback: "Installment agreements exist. Cooperation usually avoids a criminal referral.", deltaMoney: -3000, deltaScore: 5, removeFlags: ["irs_risk", "tax_fraud"], nextId: null },
          { id: "c2", label: "Slam the door. Pack a bag. Drive to Vancouver.", kind: 'bad', feedback: "You are now a fugitive. The border has cameras.", deltaStress: 50, deltaScore: -30, addFlags: ["fugitive", "in_vancouver"], scheduleEvent: { turnsFromNow: 4, sceneId: "vancouver_knock" }, nextId: null },
          { id: "c3", label: "Lawyer up. 'I'm invoking my right to counsel.'", kind: 'good', feedback: "Textbook. A tax attorney costs $2k but can save you from prison.", deltaMoney: -2000, deltaKnowledge: 5, deltaScore: 8, removeFlags: ["irs_risk"], nextId: null }
        ]
      },
      vancouver_knock: {
        id: "vancouver_knock", title: "⚠ Vancouver · 6 months later",
        text: "You thought you were safe. RCMP has a provisional warrant. Knock at your hostel door.",
        choices: [
          { id: "c1", label: "Surrender.", kind: 'meh', feedback: "Extradition + cooperation still beats running.", deltaScore: -10, removeFlags: ["fugitive"], nextId: "ending_jail" },
          { id: "c2", label: "Run again.", kind: 'bad', feedback: "You are 19 and broke. This ends badly.", deltaScore: -30, nextId: "ending_death" }
        ]
      },
      traffic_stop: {
        id: "traffic_stop", title: "⚠ Flashing lights",
        text: "You're driving uninsured and unregistered. Routine stop.",
        choices: [
          { id: "c1", label: "Be honest. Accept the tow and tickets.", kind: 'meh', feedback: "Painful but survivable. ~$1,200 total.", deltaMoney: -1200, deltaScore: -6, removeFlags: ["no_insurance_car"], nextId: null },
          { id: "c2", label: "Flee.", kind: 'bad', feedback: "Pursuit. This escalates fast.", deltaScore: -40, addFlags: ["evaded_police"], scheduleEvent: { turnsFromNow: 1, sceneId: "warrant" }, nextId: null }
        ]
      },
      warrant: {
        id: "warrant", title: "⚠ Warrant issued",
        text: "Active warrant. Surfaces at the next stop, airport, or background check.",
        choices: [
          { id: "c1", label: "Turn yourself in with a lawyer.", kind: 'good', feedback: "Voluntary surrender with counsel = lower bail, better plea.", deltaMoney: -2000, deltaScore: 3, removeFlags: ["evaded_police", "missed_jury"], nextId: null },
          { id: "c2", label: "Keep living like nothing's wrong.", kind: 'bad', feedback: "Works until it doesn't. Usually during a routine stop.", deltaStress: 30, deltaScore: -15, scheduleEvent: { turnsFromNow: 3, sceneId: "arrest" }, nextId: null }
        ]
      },
      fbi_visit: {
        id: "fbi_visit", title: "⚠ FBI at your door",
        text: "Financial crimes task force. They have bank records, Marco's records, and your texts.",
        choices: [
          { id: "c1", label: "Cooperate. Testify against Marco.", kind: 'meh', feedback: "Cooperation agreements exist. Record stays, prison usually doesn't.", deltaScore: -15, removeFlags: ["money_mule"], addFlags: ["felony_record"], nextId: null },
          { id: "c2", label: "Say nothing. Lawyer up.", kind: 'good', feedback: "Never talk to federal agents without an attorney.", deltaMoney: -5000, deltaKnowledge: 5, deltaScore: -5, removeFlags: ["money_mule"], nextId: null },
          { id: "c3", label: "Try to explain it away.", kind: 'bad', feedback: "Lying to a federal agent is 18 USC 1001. Separate felony.", deltaScore: -25, scheduleEvent: { turnsFromNow: 1, sceneId: "arrest" }, nextId: null }
        ]
      },
      owe_irs: {
        id: "owe_irs", title: "⚠ April rolls around",
        text: "You claimed EXEMPT and nothing was withheld. You owe $1,100.",
        choices: [
          { id: "c1", label: "Set up an IRS installment plan. $92/mo.", kind: 'good', feedback: "Low-interest, automatic, saves your credit.", deltaMoney: -200, deltaScore: 2, removeFlags: ["w4_exempt"], nextId: null },
          { id: "c2", label: "Ignore it.", kind: 'bad', feedback: "Wage garnishment incoming.", deltaStress: 20, deltaScore: -10, scheduleEvent: { turnsFromNow: 3, sceneId: "irs_visit" }, nextId: null }
        ]
      },
      arrest: {
        id: "arrest", title: "⚠ Arrested",
        text: "It catches up. Handcuffs. Booking. A public defender with 80 other cases.",
        choices: [
          { id: "c1", label: "Take the plea.", kind: 'meh', feedback: "Most cases end in pleas. Better than trial without means.", deltaScore: -10, addFlags: ["felony_record"], nextId: "ending_jail" }
        ]
      },
      ending_jail: {
        id: "ending_jail", title: "HARD ENDING — Incarcerated",
        text: "Joe Walker, 20, federal inmate #48291. Out in three years with a felony record.\n\nLessons cost more when you learn them the hard way.",
        choices: [], isEnding: true, endingKind: 'bad', endingTitle: "HARD ENDING — Incarcerated"
      },
      ending_death: {
        id: "ending_death", title: "HARD ENDING — Died Fleeing",
        text: "Joe Walker, 19. Found in a ditch off Highway 1. The original fraud was $6,000.\n\nThere was always a better choice.",
        choices: [], isEnding: true, endingKind: 'bad', endingTitle: "HARD ENDING — Died Fleeing"
      },
      ending_good: {
        id: "ending_good", title: "GOOD ENDING — You Grew Up",
        text: "Joe Walker, 24. Employed. Insured. Credit score 740. Retirement compounding quietly in the background.\n\nNo one throws a parade for this. That's adulthood.",
        choices: [], isEnding: true, endingKind: 'good', endingTitle: "GOOD ENDING — You Grew Up"
      },
      ending_mid: {
        id: "ending_mid", title: "MEDIOCRE ENDING — Getting By",
        text: "Joe Walker, 24. Still renting. Still nervous about government mail. Free, employed, learning.\n\nMost people's real ending.",
        choices: [], isEnding: true, endingKind: 'meh', endingTitle: "MEDIOCRE ENDING — Getting By"
      },
      stress_ending: {
        id: "stress_ending", title: "HARD ENDING — Burnout",
        text: "You pushed too hard for too long. The stress finally caught up with you. You're taking a long break from everything to recover.",
        choices: [], isEnding: true, endingKind: 'bad', endingTitle: "HARD ENDING — Burnout"
      }
    }
  },
  {
    id: "lease",
    name: "The Lease",
    who: "Maya Chen · 22 · first apartment",
    desc: "Nine days to find an apartment in a new city. A scammer, a real lease, bad utilities, a roommate crisis, mold, and the deposit fight at the end.",
    estimatedTime: "~10 decisions",
    startMoney: 3200,
    startSceneId: "intro",
    scenes: {
      intro: {
        id: "intro", title: "August · Craigslist at 1 AM",
        text: "You are Maya Chen. Twenty-two. Three weeks out of college, one week into a $44k admin job in a city where every listing says 'COZY · CHARMING · MUST SEE.' You have $3,200 in your checking account and a U-Haul reservation for Saturday.\n\nA listing just appeared: 1BR, $1,350/mo, 'newly renovated,' 20 minutes from your office. The photos are suspiciously well-lit. The landlord, 'Greg,' will only communicate over text.\n\nGreg wants a $200 'application fee' via Zelle before he'll show you the place. 'Lots of interest,' he writes. 'Gotta filter the tire-kickers.'\n\nYour move-in deadline is in 9 days.",
        choices: [
          { id: "c1", label: "Pay the $200. He's probably legit. The listing looks nice.", kind: 'bad', feedback: "Classic rental scam. Real landlords accept app fees AFTER showings, usually by check or card, never Zelle to a personal account. That photo is from a Zillow listing in Dallas.", deltaMoney: -200, deltaStress: 15, deltaScore: -10, addFlags: ["scammed"], nextId: "real_listing" },
          { id: "c2", label: "Insist on seeing it in person first. No money up front.", kind: 'good', feedback: "Correct. Greg ghosts you within the hour. You just dodged a scam.", deltaKnowledge: 4, deltaScore: 10, nextId: "real_listing" },
          { id: "c3", label: "Reverse-image search the photos first.", kind: 'good', feedback: "The photos are from a 2019 Dallas listing. Greg is not real. You saved $200 and a weekend.", deltaKnowledge: 5, deltaScore: 12, nextId: "real_listing" },
          { id: "c4", label: "Offer $500 to 'lock it in' ahead of other applicants.", kind: 'bad', feedback: "You just got extra-scammed. Greg blocks your number after the transfer clears.", deltaMoney: -500, deltaStress: 20, deltaScore: -15, addFlags: ["scammed"], nextId: "real_listing" }
        ]
      },
      real_listing: {
        id: "real_listing", title: "Four days later — a real showing",
        text: "You tour an actual apartment with a real leasing agent at a real management company. $1,295/mo, 620 sq ft, fourth floor, two windows. There's a faint smell you can't place. The agent says 'that's just the building.'\n\nShe slides a 16-page lease across the table. Pen uncapped.",
        choices: [
          { id: "c1", label: "Read every page. Note any weird clauses. Ask about the smell.", kind: 'good', feedback: "The smell turns out to be from a unit with a plumbing issue one floor below — already scheduled for repair. You also find a 'mandatory renter's insurance ($15/mo)' clause, which is standard and fine.", deltaKnowledge: 5, deltaScore: 10, addFlags: ["read_lease"], nextId: "utilities" },
          { id: "c2", label: "Skim. Sign. You need somewhere to live.", kind: 'meh', feedback: "You missed a clause charging $75/mo for 'amenity fees' (the gym that's been closed for a year) and an automatic rent escalator.", deltaMoney: -75, deltaScore: -3, addFlags: ["bad_lease"], nextId: "utilities" },
          { id: "c3", label: "Ask to take it home overnight. Read with coffee tomorrow.", kind: 'good', feedback: "Any real landlord says yes. You catch two problem clauses and ask to strike them. Both get initialed out.", deltaKnowledge: 6, deltaScore: 12, addFlags: ["read_lease"], nextId: "utilities" },
          { id: "c4", label: "Don't sign — push back on the 'first, last, and two months deposit' ($5,180 total).", kind: 'good', feedback: "In most states, deposits over 2 months' rent are illegal. You negotiate down to first + 1 month deposit.", deltaMoney: -2590, deltaKnowledge: 4, deltaScore: 8, addFlags: ["read_lease"], nextId: "utilities" },
          { id: "c5", label: "Sign without reading. The agent seems nice.", kind: 'bad', feedback: "You agreed to pay the landlord's legal fees if HE sues YOU, and waived your right to a jury trial. Common predatory clauses in long leases.", deltaScore: -10, addFlags: ["bad_lease", "waived_rights"], nextId: "utilities" }
        ]
      },
      utilities: {
        id: "utilities", title: "Move-in day",
        text: "You signed. Keys in hand. The apartment has no electricity, no gas, no internet. A clipboard on the counter lists four companies to call. There's also a flyer: 'ENERGY SAVERS LLC — FIXED RATES FOREVER — CALL TODAY.'",
        choices: [
          { id: "c1", label: "Call the default utility company directly. Set up service. Skip the flyer.", kind: 'good', feedback: "The 'fixed rate' companies are resellers. Rates start low, balloon after 6 months. Millions of dollars of complaints at state PUCs.", deltaKnowledge: 3, deltaScore: 7, addFlags: ["smart_utilities"], nextId: "roommate" },
          { id: "c2", label: "Sign up for Energy Savers LLC — 'fixed rate forever' sounds great.", kind: 'bad', feedback: "First month: $45. Sixth month: $210 for the same usage. The contract has a $250 early termination fee.", deltaMoney: -200, deltaScore: -5, addFlags: ["utility_scam"], scheduleEvent: { turnsFromNow: 3, sceneId: "utility_bill" }, nextId: "roommate" },
          { id: "c3", label: "Set up everything on autopay immediately. One less thing.", kind: 'meh', feedback: "Autopay is fine, but checking first bills manually catches billing errors (which happen constantly).", deltaScore: 2, deltaKnowledge: 1, nextId: "roommate" },
          { id: "c4", label: "Skip internet for a month. Save money. Phone hotspot is fine.", kind: 'meh', feedback: "You blow through your data cap in 4 days on a work video call.", deltaMoney: -60, deltaStress: 5, nextId: "roommate" }
        ]
      },
      roommate: {
        id: "roommate", title: "Three weeks in",
        text: "Your college friend Priya calls in tears. She lost her job, can't make rent at her place, begs to crash on your couch 'just for a month.' Your lease allows one additional occupant with written notice to the landlord.\n\nPriya wants to stay under the radar — 'don't tell the landlord, it's only a month.'",
        choices: [
          { id: "c1", label: "Let her stay. Tell the landlord in writing. Add her to the lease.", kind: 'good', feedback: "This protects BOTH of you — Priya has tenant rights, and you're not violating your lease.", deltaKnowledge: 3, deltaScore: 8, addFlags: ["roommate_legal"], nextId: "repair" },
          { id: "c2", label: "Let her stay. Don't tell the landlord. Nobody will know.", kind: 'bad', feedback: "Unauthorized occupant clause = grounds for eviction. The landlord notices the extra car and the extra name on Amazon packages.", deltaStress: 10, deltaScore: -5, addFlags: ["lease_violation"], scheduleEvent: { turnsFromNow: 3, sceneId: "eviction_notice" }, nextId: "repair" },
          { id: "c3", label: "Let her stay 2 weeks, no longer. Written agreement.", kind: 'good', feedback: "Most leases allow guests up to 14 days without notification. Staying inside that window + writing it down = no violation.", deltaKnowledge: 4, deltaScore: 7, nextId: "repair" },
          { id: "c4", label: "Say no. You can't risk your lease.", kind: 'meh', feedback: "Harsh but defensible. You Venmo her $200 to help with a motel for the week.", deltaMoney: -200, deltaScore: 2, nextId: "repair" },
          { id: "c5", label: "Charge her $800/mo under the table. Pocket the extra.", kind: 'bad', feedback: "Now you're an illegal sublessor AND a tax evader. And Priya has no receipts if this goes south.", deltaMoney: 800, deltaScore: -12, addFlags: ["illegal_sublease", "underreported"], nextId: "repair" }
        ]
      },
      repair: {
        id: "repair", title: "Two months in · black stuff on the wall",
        text: "Mold. Bathroom ceiling. Spreading. You've had a cough for a week. Your lease says 'tenant is responsible for maintaining cleanliness' but also refers to an implied warranty of habitability.\n\nYou call the landlord. Voicemail. Text. No reply for 6 days.",
        choices: [
          { id: "c1", label: "Send a written notice via certified mail demanding repair in 14 days. Document everything.", kind: 'good', feedback: "Warranty of habitability exists in almost every state. Written notice + certified mail = the start of a paper trail that protects you in court.", deltaKnowledge: 6, deltaScore: 12, addFlags: ["documented_repair"], nextId: "deposit" },
          { id: "c2", label: "Bleach it yourself. Don't mention it again.", kind: 'bad', feedback: "You 'fixed' surface mold. The source is a leak in the wall. In six months there's structural damage the landlord will blame on YOU.", deltaStress: 10, deltaScore: -8, addFlags: ["hid_mold"], scheduleEvent: { turnsFromNow: 2, sceneId: "mold_returns" }, nextId: "deposit" },
          { id: "c3", label: "Stop paying rent until it's fixed.", kind: 'bad', feedback: "Some states allow rent withholding, but only via escrow accounts and after specific notices. Just not paying = grounds for eviction.", deltaStress: 15, deltaScore: -10, addFlags: ["withheld_rent"], scheduleEvent: { turnsFromNow: 2, sceneId: "eviction_notice" }, nextId: "deposit" },
          { id: "c4", label: "Call the city's housing code enforcement office.", kind: 'good', feedback: "Free inspector shows up within a week. Landlord is cited. Repairs happen within 72 hours.", deltaKnowledge: 5, deltaScore: 10, addFlags: ["documented_repair"], nextId: "deposit" },
          { id: "c5", label: "Pay a mold company $800 yourself and deduct from next rent.", kind: 'meh', feedback: "Repair-and-deduct is legal in some states but requires specific notice first. You might win in small claims; you might not.", deltaMoney: -800, deltaKnowledge: 2, deltaScore: 1, nextId: "deposit" }
        ]
      },
      deposit: {
        id: "deposit", title: "A year later · move-out",
        text: "Your lease is up. You cleaned. You took 50 photos and a video of every wall. The landlord emails: 'After deductions, your security deposit refund is $0. Deductions: carpet replacement ($1,400), normal cleaning ($350), paint ($600).'\n\nYour deposit was $1,295.",
        choices: [
          { id: "c1", label: "Send a demand letter citing state law. Most states require itemized receipts within 14–30 days.", kind: 'good', feedback: "Many states award DOUBLE or TRIPLE damages when a landlord fails to itemize or makes bogus deductions. Your photos are the receipts.", deltaMoney: 1295, deltaKnowledge: 5, deltaScore: 10, addFlags: ["got_deposit"], nextId: "finale" },
          { id: "c2", label: "File in small claims court. Filing fee ~$75.", kind: 'good', feedback: "Small claims is designed for this. No lawyer needed. You win $2,590 (double damages) plus your filing fee.", deltaMoney: 2515, deltaKnowledge: 6, deltaScore: 14, addFlags: ["got_deposit"], nextId: "finale" },
          { id: "c3", label: "Accept it. Landlords always do this. Move on.", kind: 'bad', feedback: "$1,295 gone because you didn't send one letter. This is the single most common money mistake young renters make.", deltaScore: -10, nextId: "finale" },
          { id: "c4", label: "Leave a scathing Google review and call it even.", kind: 'meh', feedback: "Cathartic. Not money. Also risks a defamation suit if you overstate anything.", deltaStress: 3, deltaScore: -2, nextId: "finale" }
        ]
      },
      finale: {
        id: "finale", title: "Thirteen months later",
        text: "Let's see how you landed.",
        choices: [
          {
            id: "c1", label: "Continue...", kind: 'meh', feedback: "Let's see what happens.",
            nextId: null,
            dynamicNext: (flags, score) => {
              if (flags.has('eviction_record')) return 'ending_bad';
              if (score >= 50) return 'ending_good';
              return 'ending_mid';
            }
          }
        ]
      },
      utility_bill: {
        id: "utility_bill", title: "⚠ The electric bill",
        text: "$340 for one month. The fine print says 'variable rate after promotional period.'",
        choices: [
          { id: "c1", label: "File a complaint with the state Public Utility Commission. Switch back to the default provider.", kind: 'good', feedback: "PUC complaints are free and often force refunds. Default provider has no termination fees.", deltaMoney: -100, deltaKnowledge: 3, deltaScore: 5, removeFlags: ["utility_scam"], nextId: null },
          { id: "c2", label: "Pay it and eat the loss.", kind: 'meh', feedback: "Rate keeps climbing. You pay the termination fee next month anyway.", deltaMoney: -340, deltaScore: -3, nextId: null }
        ]
      },
      mold_returns: {
        id: "mold_returns", title: "⚠ The ceiling caves",
        text: "A section of bathroom ceiling collapses. Water everywhere. Landlord blames YOU for 'failure to notify.'",
        choices: [
          { id: "c1", label: "Produce any text, email, or receipt from when you first noticed.", kind: 'good', feedback: "Even a single text with a date saves you. Landlord backs off; insurance covers it.", deltaScore: 3, removeFlags: ["hid_mold"], nextId: null },
          { id: "c2", label: "Argue verbally. No paper trail.", kind: 'bad', feedback: "Landlord sues you for $8,000 in damages. You have no evidence.", deltaMoney: -3000, deltaScore: -15, addFlags: ["sued"], nextId: null }
        ]
      },
      eviction_notice: {
        id: "eviction_notice", title: "⚠ A notice taped to your door",
        text: "3-DAY NOTICE TO CURE OR QUIT. Your lease is being terminated.",
        choices: [
          { id: "c1", label: "Contact a legal aid clinic immediately (free for low income).", kind: 'good', feedback: "Most cities have free tenant legal aid. They can halt or slow eviction in most cases.", deltaKnowledge: 5, deltaScore: 6, removeFlags: ["lease_violation", "withheld_rent"], nextId: null },
          { id: "c2", label: "Ignore it. Maybe it'll go away.", kind: 'bad', feedback: "A formal eviction on your record means you won't be approved for a lease for 7 years.", deltaStress: 40, deltaScore: -20, addFlags: ["eviction_record"], nextId: null }
        ]
      },
      ending_good: {
        id: "ending_good", title: "GOOD ENDING — You Know Your Rights",
        text: "Maya, 23. Deposit back. Credit unhurt. A notebook full of lease clauses you'll catch next time.\n\nBeing a tenant is a job. You're good at it now.",
        choices: [], isEnding: true, endingKind: 'good', endingTitle: "GOOD ENDING — You Know Your Rights"
      },
      ending_mid: {
        id: "ending_mid", title: "MEDIOCRE ENDING — Renter by Attrition",
        text: "Maya, 23. You lost some money, learned slowly, signed a new lease you didn't fully read.\n\nBut you're housed. That counts.",
        choices: [], isEnding: true, endingKind: 'meh', endingTitle: "MEDIOCRE ENDING — Renter by Attrition"
      },
      ending_bad: {
        id: "ending_bad", title: "HARD ENDING — Evicted",
        text: "Maya, 23. Eviction on record. Seven years of denied applications ahead of you.\n\nThe lease was always the most important thing in the room.",
        choices: [], isEnding: true, endingKind: 'bad', endingTitle: "HARD ENDING — Evicted"
      },
      stress_ending: {
        id: "stress_ending", title: "HARD ENDING — Burnout",
        text: "You pushed too hard for too long. The stress finally caught up with you. You're taking a long break from everything to recover.",
        choices: [], isEnding: true, endingKind: 'bad', endingTitle: "HARD ENDING — Burnout"
      }
    }
  },
  {
    id: "job",
    name: "The Offer",
    who: "Dmitri Park · 24 · first salaried job",
    desc: "A 31-page offer letter. Negotiation, W-4s, benefits, payroll errors, a workplace issue, a non-compete put to the test, and the resignation packet.",
    estimatedTime: "~11 decisions",
    startMoney: 800,
    startSceneId: "intro",
    scenes: {
      intro: {
        id: "intro", title: "Tuesday · inbox at 4:12 PM",
        text: "You are Dmitri Park. Twenty-four. Two years of contract work and a degree you're still paying off. Your phone buzzes — an email from Lindsay in HR at Beacon Analytics:\n\n'Dmitri — attached is our offer. $62,000 base, benefits eligible, target start 3 weeks out. Please sign and return within 48 hours. Excited to have you on board!'\n\nYou open the PDF. It's 31 pages. You don't remember applying to a place that sends 31-page offers.\n\nScrolling through, you spot: a salary number, a 6-month probation period, a non-compete, an arbitration clause, a 'confidentiality' section that mentions you can't discuss wages with coworkers, and a clause saying you'll be 'reimbursed' for relocation only if you stay two years.\n\nYour current contract ends Friday.",
        choices: [
          { id: "c1", label: "Sign it tonight. 48 hours is 48 hours. You need the job.", kind: 'bad', feedback: "You just agreed to things you didn't read. The non-compete alone could block you from your entire industry for a year after you leave. Arbitration waives your right to sue.", deltaScore: -12, addFlags: ["signed_blind", "noncompete", "arbitration"], deltaMoney: 5167, nextId: "negotiate_outcome" },
          { id: "c2", label: "Reply thanking them, ask for a week to review with an employment lawyer.", kind: 'good', feedback: "Real companies grant extensions. If they pull the offer over this, they weren't going to treat you well anyway.", deltaKnowledge: 5, deltaScore: 10, addFlags: ["took_time"], nextId: "negotiate_salary" },
          { id: "c3", label: "Counter at $72k. Point to market data from Levels.fyi / BLS.", kind: 'good', feedback: "~60% of first offers have negotiation room. The worst they say is 'our best is $62k.' Most common outcome: meet-in-the-middle at $67k.", deltaKnowledge: 4, deltaScore: 8, addFlags: ["negotiated"], nextId: "negotiate_salary" },
          { id: "c4", label: "Sign, but email Lindsay asking to 'strike' the non-compete.", kind: 'meh', feedback: "You already signed — your leverage is gone. Lindsay politely says 'we can discuss at your next review.' She means never.", deltaScore: -4, addFlags: ["signed_blind", "noncompete"], deltaMoney: 5167, nextId: "negotiate_outcome" },
          { id: "c5", label: "Ask what the total compensation is — base, bonus, equity, 401(k) match, PTO value.", kind: 'good', feedback: "A $62k base with a 6% match + $5k bonus + good health = $74k real. A $68k base with none of that = $68k real. Always ask for the total.", deltaKnowledge: 6, deltaScore: 11, addFlags: ["asked_total_comp"], nextId: "negotiate_salary" }
        ]
      },
      negotiate_salary: {
        id: "negotiate_salary", title: "Two days later — the phone call",
        text: "Lindsay calls. 'We can do $67,000 and we're adding an extra week of PTO.' You didn't get everything you asked for. But it's real money.",
        choices: [
          { id: "c1", label: "Accept. 'That works for me — I'm looking forward to starting.'", kind: 'good', feedback: "Clean acceptance. You got $5k more in 90 seconds. That's real.", deltaMoney: 5000, deltaKnowledge: 2, deltaScore: 8, nextId: "first_day" },
          { id: "c2", label: "Push harder — $75k or you walk.", kind: 'bad', feedback: "They say 'we'll go with our other candidate.' You just lost $67k over $8k.", deltaScore: -15, deltaStress: 20, nextId: "negotiate_outcome" },
          { id: "c3", label: "Stall. Say you need to 'think about it.' Take 4 days.", kind: 'meh', feedback: "Lindsay emails: 'We need an answer by end of day.' You accept at $67k but the relationship starts weird.", deltaMoney: 5000, deltaScore: 2, nextId: "first_day" },
          { id: "c4", label: "Ask for the non-compete to be removed. 'I work in data — this is industry-standard.'", kind: 'good', feedback: "They agree to limit the non-compete to 6 months and direct competitors only. You won something real.", deltaKnowledge: 5, deltaScore: 10, removeFlags: ["noncompete"], nextId: "first_day" }
        ]
      },
      negotiate_outcome: {
        id: "negotiate_outcome", title: "First day — you signed",
        text: "You're in. $62k. You have benefits. You also have a non-compete you haven't read the way you should have. That's a problem for future-you.",
        choices: [
          { id: "c1", label: "Get to work.", kind: 'meh', feedback: "You start your first day.", deltaKnowledge: 1, deltaScore: 1, addFlags: ["noncompete"], nextId: "first_day" }
        ]
      },
      first_day: {
        id: "first_day", title: "First day · the W-4 again",
        text: "Payroll sends a link to complete your W-4 online. There's also a benefits election: medical, dental, FSA, 401(k). You have 30 days to choose.\n\nYou are now earning money and need to decide how it gets taxed and where it goes.",
        choices: [
          { id: "c1", label: "W-4: Single, no adjustments. 401k: 6% to get the full match. Medical: mid-tier PPO. FSA: $500 contribution.", kind: 'good', feedback: "Good defaults for a first job. You're not over-withholding, you're capturing the full match, and the FSA reduces your taxable income.", deltaKnowledge: 6, deltaScore: 10, addFlags: ["benefits_smart"], nextId: "paycheck" },
          { id: "c2", label: "Leave everything at defaults. Figure it out later.", kind: 'meh', feedback: "Default W-4 withholding at single is fine. But not enrolling in 401k by default means you're not getting the match — free money unclaimed.", deltaScore: 1, nextId: "paycheck" },
          { id: "c3", label: "Claim allowances to reduce withholding as much as possible. More cash now.", kind: 'bad', feedback: "This works until April, when you owe $1,900 instead of getting a refund.", deltaScore: -5, addFlags: ["w4_aggressive"], nextId: "paycheck" },
          { id: "c4", label: "Read every benefits document. Ask HR two clarifying questions.", kind: 'good', feedback: "Boring and extremely correct. You catch that the 'free' dental plan has a $250 deductible, and elect a slightly better option for the same premium.", deltaKnowledge: 7, deltaScore: 12, addFlags: ["benefits_smart"], nextId: "paycheck" }
        ]
      },
      paycheck: {
        id: "paycheck", title: "Month 2 — first real paycheck",
        text: "Your first paycheck arrives: $2,108 net on $5,417 gross. Your friend texts: 'Dude we're going to Miami in April, $800 for flights, hotel is covered.' You have $900 in your checking account.",
        choices: [
          { id: "c1", label: "Wait until you have 3 months of expenses saved before committing to anything.", kind: 'good', feedback: "Emergency fund first. Miami will happen again. A car breakdown in month 3 will not care about your airline miles.", deltaKnowledge: 3, deltaScore: 8, nextId: "hr_issue" },
          { id: "c2", label: "Book the Miami trip. YOLO, you earned it.", kind: 'meh', feedback: "You go. It's fun. You also go into month 3 with $47 in savings and a $340 car repair you put on a credit card.", deltaMoney: -800, deltaStress: 8, deltaScore: -2, nextId: "hr_issue" },
          { id: "c3", label: "Set up automatic transfer: $400/mo to high-yield savings. Book the trip if you hit $1,200 saved first.", kind: 'good', feedback: "The right instinct: automate savings before discretionary spending. Also, a high-yield account at 5%+ makes your money work while you sleep.", deltaKnowledge: 4, deltaScore: 9, nextId: "hr_issue" },
          { id: "c4", label: "Ask a coworker what he does with his paycheck. Copy that.", kind: 'meh', feedback: "He spends $200/mo on supplements and has no savings either. You now have the same strategy.", deltaScore: -1, nextId: "hr_issue" }
        ]
      },
      hr_issue: {
        id: "hr_issue", title: "Month 4 · the break room",
        text: "Your manager Derek sends work emails at 11 PM asking for 'quick turnarounds' on Saturday mornings — unpaid. He also cc's the whole team when he critiques your work, but takes credit privately in meetings with VP.\n\nYour coworker Jess pulls you aside: 'I complained once. He made my life hell for two months.'",
        choices: [
          { id: "c1", label: "Document everything: dates, email screenshots, specifics. Build a record quietly.", kind: 'good', feedback: "Documentation is the foundation of any successful HR complaint. You are building your 'if it gets worse' file.", deltaKnowledge: 5, deltaScore: 8, addFlags: ["documented_harassment"], nextId: "noncompete_test" },
          { id: "c2", label: "Complain to HR immediately and loudly.", kind: 'bad', feedback: "Without documentation, HR talks to Derek, Derek talks to you, and nothing changes except the awkwardness. You're also now visible as a 'problem employee' to management.", deltaStress: 15, deltaScore: -5, nextId: "noncompete_test" },
          { id: "c3", label: "Ignore it. Just do the work. Don't make enemies at month 4.", kind: 'meh', feedback: "Survivable. But you're normalizing unpaid overtime, which is easier to demand from you in month 24 if you let it slide in month 4.", deltaScore: -2, nextId: "noncompete_test" },
          { id: "c4", label: "Have a direct conversation with Derek: 'I notice I'm getting Saturday requests — I want to flag that my contract is M–F. Can we align on expectations?'", kind: 'good', feedback: "Most manager problems dissolve when you name them calmly and directly. Derek's next 11 PM email is noticeably less demanding.", deltaKnowledge: 4, deltaScore: 9, nextId: "noncompete_test" }
        ]
      },
      noncompete_test: {
        id: "noncompete_test", title: "Month 11 — a new opportunity",
        text: "A recruiter reaches out. A startup offering $90k, fully remote. You'd be doing the same work, for a direct competitor to Beacon Analytics.\n\nYou remember the non-compete.",
        choices: [
          { id: "c1", label: "Get the non-compete clause reviewed by an employment attorney ($200–$300 one-time).", kind: 'good', feedback: "In your state, non-competes are only enforceable if they protect legitimate business interests AND are reasonable in scope. Yours is overbroad. The attorney writes a letter. The startup hires you anyway.", deltaMoney: -250, deltaKnowledge: 8, deltaScore: 12, nextId: "resignation" },
          { id: "c2", label: "Sign the new offer and say nothing.", kind: 'bad', feedback: "Beacon's general counsel emails your new employer on day 3. The startup rescinds your offer. You're now jobless and might be sued.", deltaScore: -20, deltaStress: 30, addFlags: ["sued"], nextId: "resignation" },
          { id: "c3", label: "Pass on the job. Non-competes are enforceable, probably.", kind: 'meh', feedback: "Probably not! Most tech/data non-competes in most states are unenforceable — but you'd have to look it up. You left $28k on the table.", deltaScore: -3, nextId: "resignation" },
          { id: "c4", label: "Negotiate your exit from Beacon first. Ask them to release you from the non-compete as part of a clean departure.", kind: 'good', feedback: "Beacon agrees to a 30-day notice period and releases you from the non-compete in writing. Clean, professional, documented.", deltaKnowledge: 6, deltaScore: 10, removeFlags: ["noncompete"], nextId: "resignation" }
        ]
      },
      resignation: {
        id: "resignation", title: "Month 11 — quitting",
        text: "Whether you're leaving or not, you're thinking about it. You review your resignation options.\n\nTwo weeks notice. You have $4,100 in savings. You haven't signed the new offer yet.",
        choices: [
          { id: "c1", label: "Give two weeks' notice in writing. Work professionally through it. Ask for a reference.", kind: 'good', feedback: "Standard and correct. References matter. Bridges matter. The data industry is smaller than it looks.", deltaKnowledge: 3, deltaScore: 10, nextId: "finale" },
          { id: "c2", label: "Ghost them. Send a text. Stop showing up.", kind: 'bad', feedback: "Derek was bad. But word travels. Your next manager at your next job may be old friends with someone here.", deltaScore: -12, deltaStress: 5, nextId: "finale" },
          { id: "c3", label: "Give 1 week notice. You can't stand it anymore.", kind: 'meh', feedback: "Understandable. Slightly frowned upon. Most people understand. Most.", deltaScore: 2, nextId: "finale" },
          { id: "c4", label: "Ask to negotiate a final week of remote work to avoid awkwardness. Then give standard notice.", kind: 'good', feedback: "Often granted. Reduces the friction of a strange last two weeks. Smart ask.", deltaKnowledge: 2, deltaScore: 7, nextId: "finale" }
        ]
      },
      finale: {
        id: "finale", title: "Two years later",
        text: "Let's see how it shook out.",
        choices: [
          {
            id: "c1", label: "Continue...", kind: 'meh', feedback: "Let's see what happens.",
            nextId: null,
            dynamicNext: (flags, score) => {
              if (flags.has('sued')) return 'ending_bad';
              if (score >= 55) return 'ending_good';
              return 'ending_mid';
            }
          }
        ]
      },
      ending_good: {
        id: "ending_good", title: "GOOD ENDING — You Negotiated",
        text: "Dmitri, 26. New job, higher salary, zero non-compete. A file folder labeled 'in case of HR' that you'll never need to open but will never delete.\n\nYou learned the real lesson: every document is negotiable until it's signed.",
        choices: [], isEnding: true, endingKind: 'good', endingTitle: "GOOD ENDING — You Negotiated"
      },
      ending_mid: {
        id: "ending_mid", title: "MEDIOCRE ENDING — Survived",
        text: "Dmitri, 26. You kept your head down. You're fine. You wonder sometimes if you left money on the table.\n\n(You did. A lot.)",
        choices: [], isEnding: true, endingKind: 'meh', endingTitle: "MEDIOCRE ENDING — Survived"
      },
      ending_bad: {
        id: "ending_bad", title: "HARD ENDING — Sued by Your Employer",
        text: "Dmitri, 26. Defending a lawsuit. Legal fees past $40k. A job offer rescinded.\n\nThe non-compete probably wouldn't have held up — but you never asked.",
        choices: [], isEnding: true, endingKind: 'bad', endingTitle: "HARD ENDING — Sued by Your Employer"
      },
      stress_ending: {
        id: "stress_ending", title: "HARD ENDING — Burnout",
        text: "You pushed too hard for too long. The stress finally caught up with you. You're taking a long break from everything to recover.",
        choices: [], isEnding: true, endingKind: 'bad', endingTitle: "HARD ENDING — Burnout"
      }
    }
  },
  {
    id: "apartment",
    name: "First Apartment",
    who: "Maya Chen · 22 · barista + part-time student",
    desc: "You need to sign a lease in 3 days. One landlord seems sketchy. One apartment smells weird. And your roommate just bailed. Branching paths through deposits, red flags, and your first rent payment.",
    estimatedTime: "~10 decisions",
    startMoney: 2200,
    startSceneId: "start",
    premium: true,
    price: 50,
    scenes: {
      start: {
        id: "start",
        title: "Saturday · 10:14 AM",
        text: "You are Maya Chen. Twenty-two. You need to be out of your parents' house by the end of the month — your mom made that very clear over dinner. You have $2,200 saved. Your best friend Priya was going to be your roommate, but she just texted you: 'sorry maya. i got a job in portland. leaving tuesday.'\n\nYou have three apartments lined up to see today. One Craigslist listing from a 'landlord' named Dave who won't show ID. One overpriced studio in a great neighborhood. One shared 2BR with a stranger named Felix, dirt cheap, smells a little like cigarettes.\n\nWhere do you start?",
        choices: [
          {
            id: "c1", label: "Tour the Craigslist apartment first — Dave says the deal won't last.",
            kind: 'bad',
            feedback: "High-pressure urgency is a classic rental scam signal. Legitimate landlords don't pressure you to decide same-day without documentation.",
            deltaStress: 10, deltaKnowledge: 2, deltaScore: -5,
            addFlags: ["dave_risk"],
            nextId: "dave_tour"
          },
          {
            id: "c2", label: "Tour the overpriced studio — good neighborhood, at least it's safe.",
            kind: 'meh',
            feedback: "Safe choice, but 'safe' costs money. Let's see what you're actually working with.",
            deltaKnowledge: 3,
            nextId: "studio_tour"
          },
          {
            id: "c3", label: "Tour the shared place with Felix first — you need to know if it's livable.",
            kind: 'good',
            feedback: "Smart. Cheapest option first. If it's tolerable, it changes your whole calculation.",
            deltaKnowledge: 4, deltaScore: 8,
            nextId: "felix_tour"
          }
        ]
      },
      dave_tour: {
        id: "dave_tour",
        title: "Dave's Apartment",
        text: "Dave shows you around a 1BR that's actually pretty nice. He says he needs first month, last month, AND a security deposit — $3,900 total — in cash or Zelle before he'll hold it.\n\n'My last tenant just left, I've had 40 people look at it.' He won't show you a lease yet — 'I'll email it tonight.'\n\nYour gut says something is off.",
        choices: [
          {
            id: "d1", label: "Pay the $3,900. The apartment is perfect and you're desperate.",
            kind: 'bad',
            feedback: "This is a rental scam. You just paid $3,900 to someone who may not own this property. Dave disappears. You have no lease, no keys, no money.",
            deltaMoney: -3900, deltaStress: 40, deltaScore: -25,
            addFlags: ["scammed_rental"],
            nextId: "scam_ending"
          },
          {
            id: "d2", label: "Ask to see his ID and proof that he owns or manages the property.",
            kind: 'good',
            feedback: "Correct move. Legitimate landlords can provide this. If they refuse, walk immediately.",
            deltaKnowledge: 5, deltaScore: 12,
            nextId: "dave_id"
          },
          {
            id: "d3", label: "Say you'll think about it and leave.",
            kind: 'meh',
            feedback: "Better than paying, but you learned nothing. Trust your instincts faster next time.",
            deltaKnowledge: 2, deltaScore: 2,
            nextId: "studio_tour"
          }
        ]
      },
      dave_id: {
        id: "dave_id",
        title: "Dave's True Colors",
        text: "Dave gets flustered. He says his ID is 'at home' and his 'management company handles the paperwork.' He says he can't show the actual deed because 'it's complicated.'\n\nHe offers to drop the deposit to $500 if you Zelle him right now.",
        choices: [
          {
            id: "di1", label: "Walk away. This is a scam.",
            kind: 'good',
            feedback: "100% correct. You just saved yourself potentially thousands. Rental fraud is the #1 Craigslist scam.",
            deltaKnowledge: 5, deltaScore: 15,
            nextId: "studio_tour"
          },
          {
            id: "di2", label: "Send $500 to hold it — that's not much risk.",
            kind: 'bad',
            feedback: "$500 gone. 'Dave' blocks you. Always verify landlord identity and property ownership before sending a single dollar.",
            deltaMoney: -500, deltaStress: 25, deltaScore: -15,
            addFlags: ["lost_deposit"],
            nextId: "studio_tour"
          }
        ]
      },
      studio_tour: {
        id: "studio_tour",
        title: "The Studio",
        text: "The studio is small but clean. Great natural light. The landlord — Jennifer — has a proper lease ready, shows you her LLC documentation, and lets you read everything.\n\nRent is $1,350/month. That's 61% of your $2,200 take-home. Way above the 30% rule, but Jennifer says she can do $1,200 if you sign a 14-month lease instead of 12.\n\nWhat do you do?",
        choices: [
          {
            id: "s1", label: "Sign the 14-month lease for $1,200 — $150 savings is worth it.",
            kind: 'meh',
            feedback: "Still 55% of your income on rent. That's tight. But $1,200 × 14 months locks you in until next fall. Make sure you want to stay here that long.",
            deltaMoney: -2400, deltaKnowledge: 3, deltaScore: 4,
            addFlags: ["studio_signed"],
            nextId: "deposit_moment"
          },
          {
            id: "s2", label: "Counter-offer $1,100/month on a 12-month lease.",
            kind: 'good',
            feedback: "Negotiating rent is completely normal. Landlords expect it. Worst case she says no.",
            deltaKnowledge: 5, deltaScore: 10,
            nextId: "negotiate_studio"
          },
          {
            id: "s3", label: "Pass — it's too expensive regardless. Go see Felix's place.",
            kind: 'good',
            feedback: "Financially smart. But have backup options before you fully commit.",
            deltaKnowledge: 3, deltaScore: 8,
            nextId: "felix_tour"
          }
        ]
      },
      negotiate_studio: {
        id: "negotiate_studio",
        title: "The Counter",
        text: "Jennifer thinks for a moment. 'I can do $1,175 on a 12-month. That's my final number.'\n\nThat's $25 more than you wanted, but $175 less than her asking price. The lease is clean, the landlord is professional, and you read every page.",
        choices: [
          {
            id: "n1", label: "Take it. $1,175 on 12 months.",
            kind: 'good',
            feedback: "Good deal. You saved $175/month compared to the original ask. Always negotiate.",
            deltaMoney: -2350, deltaKnowledge: 4, deltaScore: 15,
            addFlags: ["studio_negotiated"],
            nextId: "deposit_moment"
          },
          {
            id: "n2", label: "Push harder for $1,100. Hold your ground.",
            kind: 'meh',
            feedback: "Jennifer politely declines. You take the $1,200/14-month deal or walk. Sometimes the first counter is the best you'll get.",
            deltaKnowledge: 2, deltaScore: 2,
            nextId: "deposit_moment"
          }
        ]
      },
      felix_tour: {
        id: "felix_tour",
        title: "Felix's Place",
        text: "Felix is 24, works in logistics, seems normal. The 2BR is $1,500 total — $750 each. That's 34% of your income. Manageable.\n\nThe cigarette smell is from the previous tenant, Felix says. He's been airing it out. The landlord seems legit — she's a 55-year-old retired teacher named Carolyn who lives downstairs.\n\nBut you've never lived with a stranger.",
        choices: [
          {
            id: "f1", label: "Say yes on the spot. $750 is great and Felix seems fine.",
            kind: 'meh',
            feedback: "Financially smart, but get a roommate agreement in writing. 'Felix seems fine' has started many horror stories.",
            deltaKnowledge: 2, deltaScore: 5,
            addFlags: ["felix_place"],
            nextId: "roommate_agreement"
          },
          {
            id: "f2", label: "Ask for a few days to get references from Felix's previous roommates.",
            kind: 'good',
            feedback: "Smart. A quick reference check takes 15 minutes and can save you months of misery.",
            deltaKnowledge: 5, deltaScore: 12,
            addFlags: ["checked_felix"],
            nextId: "felix_references"
          },
          {
            id: "f3", label: "Pass — you'd rather live alone than with a stranger.",
            kind: 'meh',
            feedback: "Valid. But $750 vs $1,175 is $5,100/year. That's a meaningful difference. Consider it carefully.",
            deltaKnowledge: 2,
            nextId: "studio_tour"
          }
        ]
      },
      felix_references: {
        id: "felix_references",
        title: "The References",
        text: "Felix gives you two references. You text both. One says 'Felix is great, low-key, cleans up after himself.' The other says 'Nice guy but plays music loud late sometimes.'\n\nCarolyn the landlord walks you through the place again. Everything checks out. She shows you the lease — it's short, fair, and mentions a 'quiet hours' clause after 10pm.",
        choices: [
          {
            id: "fr1", label: "Sign. This is the right move.",
            kind: 'good',
            feedback: "You did the work. References checked, landlord verified, lease reviewed. This is how it's done.",
            deltaMoney: -1500, deltaKnowledge: 5, deltaScore: 18,
            addFlags: ["felix_place", "felix_verified"],
            nextId: "deposit_moment"
          },
          {
            id: "fr2", label: "Negotiate — ask Carolyn to lower rent to $680/each.",
            kind: 'good',
            feedback: "Nothing wrong with asking. Carolyn says she can do $720/each. You take it.",
            deltaMoney: -1440, deltaKnowledge: 4, deltaScore: 14,
            addFlags: ["felix_place", "rent_negotiated"],
            nextId: "deposit_moment"
          }
        ]
      },
      roommate_agreement: {
        id: "roommate_agreement",
        title: "Move-In Day",
        text: "You're about to sign the lease. Carolyn asks if you and Felix want to create a roommate agreement — she has a template. Felix shrugs. 'Up to you.'\n\nA roommate agreement covers: who pays what, guest policies, chores, quiet hours, and what happens if someone wants to leave early.",
        choices: [
          {
            id: "ra1", label: "Sign a roommate agreement. Cover everything.",
            kind: 'good',
            feedback: "This is the adult move. Roommate disputes are one of the most common causes of lease breaks and early move-outs. Written agreements prevent 90% of conflicts.",
            deltaKnowledge: 5, deltaScore: 15,
            addFlags: ["roommate_agreement_signed"],
            nextId: "movein_ending"
          },
          {
            id: "ra2", label: "Skip it — Felix and you will just work it out.",
            kind: 'meh',
            feedback: "Probably fine. But 'we'll figure it out' has a poor track record with shared housing. At minimum, text-message an agreement so something is documented.",
            deltaKnowledge: 2, deltaScore: 2,
            nextId: "movein_ending"
          }
        ]
      },
      deposit_moment: {
        id: "deposit_moment",
        title: "The Security Deposit",
        text: "Your new landlord asks for a $1,200 security deposit. She says she'll take it by check or cash.\n\nBefore you hand it over — do you know your rights?",
        choices: [
          {
            id: "dm1", label: "Pay it and don't worry — it's just standard.",
            kind: 'meh',
            feedback: "You paid it, but without documentation you're vulnerable. Always request a receipt AND a walkthrough checklist.",
            deltaKnowledge: 2, deltaScore: 2,
            deltaMoney: -1200,
            nextId: "walkthrough"
          },
          {
            id: "dm2", label: "Pay it, but request a written receipt and ask about the state's deposit return timeline.",
            kind: 'good',
            feedback: "Most states require landlords to return deposits within 14-30 days with an itemized list of deductions. Knowing this before you move in puts you in control.",
            deltaKnowledge: 6, deltaScore: 15,
            deltaMoney: -1200,
            nextId: "walkthrough"
          }
        ]
      },
      walkthrough: {
        id: "walkthrough",
        title: "Move-In Day",
        text: "Keys in hand. The landlord offers to do a walkthrough checklist with you — noting any existing damage before you move in.\n\nIt'll take about 20 minutes. Your friends with the moving truck are waiting outside.",
        choices: [
          {
            id: "w1", label: "Do the full walkthrough. Document everything.",
            kind: 'good',
            feedback: "This single step could save you your entire deposit when you move out. Pre-existing damage documented = not your problem when you leave.",
            deltaKnowledge: 5, deltaScore: 18,
            addFlags: ["walkthrough_done"],
            nextId: "movein_ending"
          },
          {
            id: "w2", label: "Skip it — you can tell the landlord about damage later if you notice it.",
            kind: 'bad',
            feedback: "Big mistake. 'Later' becomes he-said-she-said at move-out. When you leave, undocumented damage becomes your bill. Always do the walkthrough.",
            deltaKnowledge: 2, deltaScore: -8,
            addFlags: ["no_walkthrough"],
            nextId: "movein_ending"
          }
        ]
      },
      scam_ending: {
        id: "scam_ending",
        title: "HARD ENDING — Rental Scam",
        text: "Dave is gone. His number is disconnected. The real owner of the apartment has no idea who you are.\n\nYou're out $3,900. You have nowhere to live. And you learned — the hard way — that urgency + cash + no documentation = scam.\n\nYou find a new place two weeks later. It cost you more than money.",
        choices: [], isEnding: true, endingKind: 'bad', endingTitle: "HARD ENDING — Rental Scam"
      },
      movein_ending: {
        id: "movein_ending",
        title: "GOOD ENDING — Keys in Hand",
        text: "You did it. New apartment. Your own space.\n\nYou checked the landlord's credentials, read the lease, documented the condition at move-in, and know your deposit rights. Most people skip all of that.\n\nWelcome to your first real home.",
        choices: [], isEnding: true, endingKind: 'good', endingTitle: "GOOD ENDING — Keys in Hand"
      }
    }
  },
  {
    id: "jobday",
    name: "Job Offer Day",
    who: "Marcus Webb · 23 · recent grad in accounting",
    desc: "You have a job offer that expires in 48 hours. The salary feels low. Your benefits choices are confusing. And your current manager just hinted at a counter-offer. Navigate salary negotiation, benefits enrollment, and competing offers.",
    estimatedTime: "~10 decisions",
    startMoney: 800,
    startSceneId: "offer_arrives",
    premium: true,
    price: 50,
    scenes: {
      offer_arrives: {
        id: "offer_arrives",
        title: "Tuesday · 4:02 PM",
        text: "You are Marcus Webb. Twenty-three. Your accounting degree cost $68,000 in loans. You've been temping for seven months.\n\nThis afternoon: an email from Hendricks & Associates. Offer letter attached. $47,500 base. Benefits start day one. 48 hours to respond.\n\nYou open the PDF. You expected $50k-$55k based on your research. $47,500 feels low. But it's real. And your temp contract ends Friday.\n\nWhat do you do first?",
        choices: [
          {
            id: "c1", label: "Accept immediately — it's a real job and your contract ends Friday.",
            kind: 'meh',
            feedback: "Understandable under pressure. But you've left potential money on the table without even trying. Companies budget room for negotiation.",
            deltaScore: 2, deltaKnowledge: 1,
            addFlags: ["accepted_no_negotiate"],
            nextId: "benefits_enrollment"
          },
          {
            id: "c2", label: "Email back thanking them and ask for 48 hours to review.",
            kind: 'good',
            feedback: "Standard and professional. Always get full time to review. No legitimate employer rescind offers for asking.",
            deltaScore: 10, deltaKnowledge: 4,
            nextId: "research_salary"
          },
          {
            id: "c3", label: "Call your manager and hint you have an offer to see if they'll fight for you.",
            kind: 'meh',
            feedback: "Counter-offers are complicated — companies often expect you to leave anyway and you may end up without either job if it backfires.",
            deltaStress: 15, deltaKnowledge: 2,
            addFlags: ["told_manager"],
            nextId: "counter_offer_moment"
          }
        ]
      },
      research_salary: {
        id: "research_salary",
        title: "The Research",
        text: "You spend an hour on LinkedIn Salary, Glassdoor, and the BLS occupational data. Entry-level accountants in your city: median $52,000. $47,500 is in the 35th percentile.\n\nYou also look at the benefits package more carefully:\n• Health: HDHP ($80/mo employee contribution) + HSA seed of $500\n• 401k: 4% match, vests immediately\n• PTO: 15 days\n• Remote: 2 days/week after 90-day probation\n\nThe 4% match on $47,500 = $1,900 in free money. Total comp is closer to $51,000+.",
        choices: [
          {
            id: "r1", label: "Counter at $52,000 — market median for your role and city.",
            kind: 'good',
            feedback: "Backed by data. Professional and reasonable. This is exactly how to negotiate.",
            deltaScore: 15, deltaKnowledge: 5,
            nextId: "negotiation_response"
          },
          {
            id: "r2", label: "Counter at $58,000 — shoot high so there's room to negotiate.",
            kind: 'meh',
            feedback: "Too far above market — 23% over their offer. This can signal you don't understand the role's market value.",
            deltaKnowledge: 2, deltaScore: 2,
            nextId: "negotiation_too_high"
          },
          {
            id: "r3", label: "Decide the total comp is actually fair and accept at $47,500.",
            kind: 'good',
            feedback: "With benefits factored in, $51k+ total comp is reasonable. This is a thoughtful decision — not a weak one.",
            deltaScore: 12, deltaKnowledge: 6,
            addFlags: ["accepted_informed"],
            nextId: "benefits_enrollment"
          }
        ]
      },
      negotiation_response: {
        id: "negotiation_response",
        title: "The Counter",
        text: "You send a polished email: 'I'm very excited about this opportunity. Based on current market data for entry-level accounting roles in this area, I was expecting something closer to $52,000. Is there flexibility there?'\n\nThey come back two hours later: 'We can do $49,500. That's the top of the band for this level.'\n\nNot $52k. But $2,000 more than the original offer.",
        choices: [
          {
            id: "n1", label: "Accept $49,500. You moved it $2,000 with one email.",
            kind: 'good',
            feedback: "That's $2,000/year for a 15-minute email. Over 3 years, $6,000 in extra income. Always negotiate.",
            deltaMoney: 0, deltaScore: 18, deltaKnowledge: 4,
            addFlags: ["negotiated_up"],
            nextId: "benefits_enrollment"
          },
          {
            id: "n2", label: "Push again for $51,000 — you know the market.",
            kind: 'meh',
            feedback: "They hold firm at $49,500 and note that non-monetary benefits are also strong. Pushing past 'top of band' rarely works and can sour the relationship.",
            deltaKnowledge: 3, deltaScore: 4,
            nextId: "benefits_enrollment"
          }
        ]
      },
      negotiation_too_high: {
        id: "negotiation_too_high",
        title: "The Response",
        text: "HR replies: 'We appreciate your enthusiasm, but $58,000 is significantly above the range for this position. Our offer of $47,500 reflects the market for entry-level accounting. We hope you'll still consider the role.'\n\nThe door is still open — but you've weakened your position.",
        choices: [
          {
            id: "th1", label: "Accept $47,500 — you pushed too high and now have no leverage.",
            kind: 'meh',
            feedback: "You'd have been better off starting at $52k. But you still have the job. Learn the lesson for next time.",
            deltaScore: 4, deltaKnowledge: 4,
            nextId: "benefits_enrollment"
          },
          {
            id: "th2", label: "Counter at $51,000 with market data attached.",
            kind: 'good',
            feedback: "Recovering with research shows professionalism. They settle at $49,000. Your data saved you $1,500.",
            deltaScore: 8, deltaKnowledge: 5,
            addFlags: ["recovered_negotiation"],
            nextId: "benefits_enrollment"
          }
        ]
      },
      counter_offer_moment: {
        id: "counter_offer_moment",
        title: "Your Manager's Response",
        text: "Your manager calls you into her office. 'We've been thinking about converting you to full-time. I want to make you an offer: $44,000 with 2 weeks PTO.'\n\nThat's $3,500 less than the Hendricks offer. But it's familiar. It's easy.",
        choices: [
          {
            id: "co1", label: "Take the counter-offer. Familiarity has value.",
            kind: 'meh',
            feedback: "$44k vs $49.5k = $5,500/year less. Over 5 years that's $27,500. Familiarity is real — but so is that math.",
            deltaScore: 3, deltaKnowledge: 2,
            addFlags: ["took_counter"],
            nextId: "counter_ending"
          },
          {
            id: "co2", label: "Tell her you need to compare both offers fully before deciding.",
            kind: 'good',
            feedback: "Professional and fair. You have 48 hours. Use them.",
            deltaScore: 12, deltaKnowledge: 5,
            nextId: "research_salary"
          }
        ]
      },
      benefits_enrollment: {
        id: "benefits_enrollment",
        title: "Day One — Benefits Enrollment",
        text: "First day at Hendricks. HR walks you through benefits enrollment — you have 30 days to choose. Options:\n\nHealth: HDHP ($80/mo, $1,500 deductible) + $500 HSA seed, or PPO ($210/mo, $500 deductible).\n\nYou're 23. Generally healthy. No prescriptions. One gym injury two years ago.\n\nYou need to choose today.",
        choices: [
          {
            id: "b1", label: "Choose HDHP + HSA. Lower premium, tax-free savings account.",
            kind: 'good',
            feedback: "Smart for a healthy young adult. You save $130/month in premiums = $1,560/year. The HSA lets you invest the difference tax-free. Only bad if you have unexpected major medical needs.",
            deltaKnowledge: 6, deltaScore: 15,
            addFlags: ["chose_hdhp"],
            nextId: "retirement_choice"
          },
          {
            id: "b2", label: "Choose PPO. Lower deductible = more protection.",
            kind: 'meh',
            feedback: "More expensive monthly but more predictable costs. Fine if you value certainty over optimization. Not wrong, just costs $1,560/year more in premiums.",
            deltaKnowledge: 3, deltaScore: 5,
            nextId: "retirement_choice"
          },
          {
            id: "b3", label: "Skip enrollment for now — you have 30 days, right?",
            kind: 'bad',
            feedback: "The 30-day window seems long but it disappears. Many people forget and end up uninsured for a full year until the next open enrollment. Set a calendar alert immediately.",
            deltaStress: 15, deltaKnowledge: 2, deltaScore: -8,
            addFlags: ["forgot_enrollment"],
            nextId: "retirement_choice"
          }
        ]
      },
      retirement_choice: {
        id: "retirement_choice",
        title: "The 401k Question",
        text: "HR asks how much you want to contribute to your 401k. The employer matches 4% of salary dollar-for-dollar.\n\nSome options she lays out:\n• 0% — keep all your paycheck now\n• 4% — max out the free money match\n• 10% — aggressive savings mode",
        choices: [
          {
            id: "r1", label: "0% — I have student loans to pay, I can't afford retirement savings.",
            kind: 'bad',
            feedback: "You're leaving $1,900/year of free money on the table. Even if you only contribute 4%, the match is immediate 100% return. That beats student loan interest math in almost every case.",
            deltaScore: -10, deltaKnowledge: 3,
            addFlags: ["no_401k"],
            nextId: "job_ending"
          },
          {
            id: "r2", label: "4% — capture the full employer match.",
            kind: 'good',
            feedback: "The right move for most people. $1,900 free from your employer every year. Tax-deferred growth. Starting at 23 is enormously powerful due to compound growth.",
            deltaScore: 18, deltaKnowledge: 6,
            addFlags: ["matched_401k"],
            nextId: "job_ending"
          },
          {
            id: "r3", label: "10% — I want to build wealth aggressively.",
            kind: 'good',
            feedback: "Excellent if your budget allows. You're reducing your take-home by ~$400/month — make sure your expenses are covered. But starting high early is a great habit.",
            deltaScore: 15, deltaKnowledge: 5,
            addFlags: ["maxing_401k"],
            nextId: "job_ending"
          }
        ]
      },
      counter_ending: {
        id: "counter_ending",
        title: "MEDIOCRE ENDING — Stayed Put",
        text: "Marcus, 23. Same desk. Familiar faces. $44,000.\n\nSix months later you found out Hendricks offered the role to someone else at $52,000.\n\nYou don't regret it. But you wonder.",
        choices: [], isEnding: true, endingKind: 'meh', endingTitle: "MEDIOCRE ENDING — Stayed Put"
      },
      job_ending: {
        id: "job_ending",
        title: "GOOD ENDING — Employed & Building",
        text: "Marcus Webb, 23. Real salary. Real benefits. 401k contributions compounding.\n\nYou negotiated, you read the offer, you made an informed choice on health insurance. Most 23-year-olds don't do any of that.\n\nThe student loans are still there. But so is the plan.",
        choices: [], isEnding: true, endingKind: 'good', endingTitle: "GOOD ENDING — Employed & Building"
      }
    }
  }
];
