export interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonStep {
  type: "text" | "quiz" | "scenario" | "checklist";
  title: string;
  content: string;
  quiz?: Quiz;
  checklistItems?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: number;
  description: string;
  icon: string;
  steps: LessonStep[];
}

export interface Track {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  lessonsCount: number;
  lessons: Lesson[];
  premium?: boolean;
  price?: number;
}

export const tracks: Track[] = [
  {
    id: "money",
    title: "Money & Budgeting",
    subtitle: "Build a budget that actually works",
    icon: "credit-card",
    color: "#FF6B6B",
    lessonsCount: 4,
    lessons: [
      {
        id: "money-1",
        title: "Where Does Your Money Go?",
        duration: 6,
        description: "Understand income vs expenses and why tracking matters.",
        icon: "bar-chart-2",
        steps: [
          {
            type: "text",
            title: "The Money Blindspot",
            content:
              "Most people in their 20s have no idea where 30-40% of their money actually goes. It slips away on subscriptions, impulse buys, and small daily purchases that feel invisible. The first step to financial health isn't saving more — it's knowing where you stand.\n\nIncome is every dollar coming in. Expenses are every dollar going out. The gap between them is your financial breathing room.",
          },
          {
            type: "quiz",
            title: "Quick Check",
            content: "Which of these is considered a variable expense?",
            quiz: {
              question: "Which of these is considered a variable expense?",
              options: ["Monthly rent", "Netflix subscription", "Groceries", "Car insurance"],
              correctIndex: 2,
              explanation:
                "Groceries are variable — the amount changes each month. Rent, subscriptions, and insurance are fixed costs that stay the same.",
            },
          },
          {
            type: "text",
            title: "Fixed vs Variable Costs",
            content:
              "Fixed expenses stay the same every month — rent, insurance, loan payments. Variable expenses change — groceries, gas, entertainment, dining out.\n\nKnowing this distinction helps you find where you have flexibility. You can't easily cut your rent, but you can adjust how much you spend on dining.",
          },
          {
            type: "quiz",
            title: "Test Yourself",
            content: "What's the best first step to understanding your spending?",
            quiz: {
              question: "What's the best first step to understanding your spending?",
              options: [
                "Open a savings account",
                "Review last month's bank statement",
                "Cut all subscriptions",
                "Ask your parents for help",
              ],
              correctIndex: 1,
              explanation:
                "Reviewing past spending gives you real data — not guesses. You can't change what you don't measure.",
            },
          },
        ],
      },
      {
        id: "money-2",
        title: "The 50/30/20 Rule",
        duration: 5,
        description: "A simple framework to split your income intentionally.",
        icon: "pie-chart",
        steps: [
          {
            type: "text",
            title: "The Golden Split",
            content:
              "The 50/30/20 rule is a simple budgeting framework used by millions:\n\n• 50% → Needs (rent, groceries, utilities, insurance)\n• 30% → Wants (dining, hobbies, streaming, clothes)\n• 20% → Savings & debt payoff\n\nIf you make $3,000/month after taxes: $1,500 for needs, $900 for wants, $600 for savings.",
          },
          {
            type: "scenario",
            title: "Real-Life Scenario",
            content:
              "Alex earns $2,800/month after taxes. Their rent is $1,100, groceries run $300, and utilities are $80. That's $1,480 on needs — about 53%. They spend $700 on dining, hobbies, and streaming. And they save $200/month.\n\nAlex is slightly over on needs and significantly under on savings. The fix isn't dramatic — cooking two more meals a week at home could free up $150+/month.",
          },
          {
            type: "quiz",
            title: "Apply the Rule",
            content: "You earn $2,500/month. How much should go to savings using 50/30/20?",
            quiz: {
              question: "You earn $2,500/month. How much should go to savings using 50/30/20?",
              options: ["$250", "$500", "$750", "$1,000"],
              correctIndex: 1,
              explanation:
                "20% of $2,500 = $500. Even if you can't hit this right away, having the target helps you make intentional trade-offs.",
            },
          },
          {
            type: "text",
            title: "Make It Yours",
            content:
              "The 50/30/20 rule is a starting point, not a law. Living in an expensive city might mean 60% on needs. That's okay — adjust the other categories accordingly.\n\nWhat matters is having a system. A budget you actually follow beats a perfect budget you ignore.",
          },
        ],
      },
      {
        id: "money-3",
        title: "Emergency Fund Basics",
        duration: 7,
        description: "Why every adult needs a financial safety net.",
        icon: "shield",
        steps: [
          {
            type: "text",
            title: "The Safety Net",
            content:
              "An emergency fund is money set aside specifically for unexpected expenses — car repairs, medical bills, job loss. Without one, a single bad event can send you into credit card debt that takes months or years to pay off.\n\nThe goal: 3-6 months of essential living expenses in a separate, easily accessible savings account.",
          },
          {
            type: "quiz",
            title: "Emergency Fund Quiz",
            content: "Which of these qualifies as a true emergency for your fund?",
            quiz: {
              question: "Which of these qualifies as a true emergency for your fund?",
              options: [
                "Concert tickets you forgot to budget for",
                "A surprise car repair bill",
                "A Black Friday sale on a TV you want",
                "Your friend's birthday dinner",
              ],
              correctIndex: 1,
              explanation:
                "True emergencies are unexpected, necessary expenses you couldn't plan for. Discretionary purchases belong in your regular budget.",
            },
          },
          {
            type: "text",
            title: "Building It Gradually",
            content:
              "You don't need $10,000 tomorrow. Start with a starter emergency fund of $1,000. This alone prevents most common financial emergencies from spiraling.\n\nSet up an automatic transfer of even $25-50/week to a separate savings account labeled 'Emergency Fund'. Automate it — willpower isn't reliable.\n\nHigh-yield savings accounts (HYSA) are ideal — they earn 4-5% APY instead of 0.01% at big banks.",
          },
          {
            type: "quiz",
            title: "Strategy Check",
            content: "What's the best place to keep your emergency fund?",
            quiz: {
              question: "What's the best place to keep your emergency fund?",
              options: [
                "Invested in stocks for growth",
                "In your regular checking account",
                "A high-yield savings account",
                "Cash under your mattress",
              ],
              correctIndex: 2,
              explanation:
                "A HYSA gives you easy access when needed PLUS earns competitive interest. Stocks are too volatile — imagine needing the money during a market crash.",
            },
          },
        ],
      },
      {
        id: "money-4",
        title: "Credit Score 101",
        duration: 8,
        description: "What your credit score is and how to build it.",
        icon: "trending-up",
        steps: [
          {
            type: "text",
            title: "Your Financial Reputation",
            content:
              "Your credit score (300-850) is a number that tells lenders how reliable you are with borrowed money. It affects your ability to rent an apartment, get a car loan, qualify for a mortgage, and even some job applications.\n\nThe five factors that determine your score:\n• Payment history (35%) — biggest factor\n• Credit utilization (30%) — how much of your limit you use\n• Length of credit history (15%)\n• Credit mix (10%)\n• New credit inquiries (10%)",
          },
          {
            type: "quiz",
            title: "Score Check",
            content: "What's the single biggest factor affecting your credit score?",
            quiz: {
              question: "What's the single biggest factor affecting your credit score?",
              options: [
                "How many credit cards you have",
                "Whether you pay on time",
                "Your income level",
                "How many times you've checked your score",
              ],
              correctIndex: 1,
              explanation:
                "Payment history is 35% of your score. One missed payment can drop your score 50-100 points. Set up autopay for at least the minimum payment.",
            },
          },
          {
            type: "text",
            title: "Building Credit From Scratch",
            content:
              "If you're starting with no credit history, here's the proven path:\n\n1. Get a secured credit card (you deposit $200-500 as collateral)\n2. Use it for one small recurring purchase (like Spotify)\n3. Pay it off in full every month\n4. After 6-12 months, you'll have a real credit score\n\nNever carry a balance if you can help it — credit card interest rates average 20%+.",
          },
          {
            type: "quiz",
            title: "Utilization Check",
            content: "You have a $1,000 credit limit. What's the ideal maximum to charge?",
            quiz: {
              question: "You have a $1,000 credit limit. What's the ideal maximum to charge?",
              options: ["$900", "$500", "$300", "$100"],
              correctIndex: 2,
              explanation:
                "Keep utilization under 30% of your limit — so $300 on a $1,000 card. Under 10% is even better. High utilization tanks your score even if you pay on time.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "taxes",
    title: "Taxes & Filing",
    subtitle: "File with confidence, get your money back",
    icon: "file-text",
    color: "#4ECDC4",
    lessonsCount: 4,
    lessons: [
      {
        id: "taxes-1",
        title: "How Taxes Actually Work",
        duration: 7,
        description: "The basics of income tax that school never taught you.",
        icon: "book-open",
        steps: [
          {
            type: "text",
            title: "The Tax System Explained",
            content:
              "The U.S. uses a progressive tax system — the more you earn, the higher percentage you pay, but only on the income in each bracket, not all of it.\n\nIf you earn $50,000 in 2024:\n• First $11,600 taxed at 10% = $1,160\n• Next $38,400 taxed at 12% = $4,608\n• Total tax ≈ $5,768 (effective rate ~11.5%)\n\nYou do NOT pay 22% on everything just because you're in the 22% bracket.",
          },
          {
            type: "quiz",
            title: "Bracket Check",
            content: "If you're in the 22% tax bracket, do you pay 22% on all your income?",
            quiz: {
              question: "If you're in the 22% tax bracket, do you pay 22% on all your income?",
              options: [
                "Yes, the rate applies to everything",
                "No, only income above the bracket threshold",
                "Yes, but only after deductions",
                "No, you only pay 22% on investments",
              ],
              correctIndex: 1,
              explanation:
                "Progressive taxation means you only pay 22% on the portion of income in that bracket. Lower income gets taxed at lower rates first.",
            },
          },
          {
            type: "text",
            title: "W-2 vs 1099: Know Your Form",
            content:
              "W-2: You're an employee. Your employer withholds taxes automatically from each paycheck. You'll get this form by January 31.\n\n1099: You're a contractor/freelancer. NO taxes are withheld — you're responsible for paying them yourself. If you earn $600+ from any client, they send you a 1099.\n\nFreelance work means you may need to pay quarterly estimated taxes to avoid a penalty.",
          },
          {
            type: "quiz",
            title: "Form Quiz",
            content: "You drive for a rideshare app on weekends. What form will you receive?",
            quiz: {
              question: "You drive for a rideshare app on weekends. What form will you receive?",
              options: [
                "W-2 because you work regularly",
                "1099 because you're a contractor",
                "Both W-2 and 1099",
                "No form under $5,000",
              ],
              correctIndex: 1,
              explanation:
                "Gig workers and contractors receive 1099 forms. No taxes are withheld, so you're responsible for setting aside ~25-30% of gig income for taxes.",
            },
          },
        ],
      },
      {
        id: "taxes-2",
        title: "Deductions & Credits",
        duration: 6,
        description: "Legal ways to reduce what you owe — the IRS wants you to use these.",
        icon: "scissors",
        steps: [
          {
            type: "text",
            title: "Deductions vs Credits",
            content:
              "A tax deduction reduces your taxable income. A tax credit directly reduces your tax bill — credits are more valuable.\n\nExample: You're in the 22% bracket.\n• A $1,000 deduction saves you $220\n• A $1,000 credit saves you $1,000\n\nThe most common deduction is the standard deduction ($14,600 for single filers in 2024). Most young adults take this instead of itemizing.",
          },
          {
            type: "quiz",
            title: "Credit vs Deduction",
            content: "Which is generally more valuable?",
            quiz: {
              question: "Which is generally more valuable?",
              options: [
                "A $500 tax deduction",
                "A $500 tax credit",
                "They're always equal",
                "It depends on your income",
              ],
              correctIndex: 1,
              explanation:
                "A $500 credit reduces your actual tax bill by $500. A $500 deduction reduces taxable income, saving you only $500 × your tax rate — for example, $110 in the 22% bracket.",
            },
          },
          {
            type: "text",
            title: "Credits You Might Qualify For",
            content:
              "Earned Income Tax Credit (EITC): For lower-to-middle income workers. Worth up to $632-$7,830 depending on income and family size.\n\nSaver's Credit: If you contribute to a 401k or IRA and earn under ~$38,250 (single), you get a credit of 10-50% of your contribution.\n\nStudent Loan Interest: Deduct up to $2,500 of student loan interest paid.\n\nAmerican Opportunity Credit: Up to $2,500/year for your first 4 years of college.",
          },
          {
            type: "quiz",
            title: "Student Loan Quiz",
            content: "You paid $1,800 in student loan interest. What's the maximum you can deduct?",
            quiz: {
              question: "You paid $1,800 in student loan interest. What's the maximum you can deduct?",
              options: ["$1,000", "$1,800", "$2,500", "$3,000"],
              correctIndex: 1,
              explanation:
                "You can deduct the actual interest paid, up to the $2,500 limit. Since you only paid $1,800, that's your full deduction. Every dollar helps!",
            },
          },
        ],
      },
      {
        id: "taxes-3",
        title: "Filing Step by Step",
        duration: 8,
        description: "How to actually file your taxes — from gathering docs to hitting submit.",
        icon: "check-square",
        steps: [
          {
            type: "checklist",
            title: "Documents You Need",
            content: "Gather these before you start filing. Missing documents are the #1 cause of delays.",
            checklistItems: [
              "W-2 from every employer (arrives by Jan 31)",
              "1099s from freelance/gig work",
              "Social Security Number (SSN)",
              "Bank routing & account number for direct deposit",
              "Last year's tax return (for reference)",
              "Student loan interest statement (Form 1098-E)",
              "Health insurance form (1095-A if you used marketplace)",
              "Receipts for deductible expenses",
            ],
          },
          {
            type: "text",
            title: "Free Filing Options",
            content:
              "You don't need to pay to file. Legitimate free options:\n\n• IRS Free File: If you earn under $79,000, use freefile.irs.gov for free guided software\n• IRS Direct File: Available in 25 states for simple returns — completely free from the IRS itself\n• VITA (Volunteer Income Tax Assistance): Free in-person help at community sites\n• Many states offer free filing directly through their revenue departments",
          },
          {
            type: "quiz",
            title: "Filing Deadline",
            content: "What's the typical federal tax filing deadline?",
            quiz: {
              question: "What's the typical federal tax filing deadline?",
              options: ["March 15", "April 15", "May 1", "June 15"],
              correctIndex: 1,
              explanation:
                "April 15 is the standard deadline. If it falls on a weekend or holiday, it shifts to the next business day. You can file for an extension, but you still must pay any taxes owed by April 15.",
            },
          },
          {
            type: "text",
            title: "After You File",
            content:
              "Choose direct deposit for your refund — it arrives in 10-21 days vs 6-8 weeks for a check.\n\nYou can track your refund at irs.gov/refunds (Where's My Refund?) — it updates daily.\n\nKeep copies of your tax returns for at least 3 years. The IRS generally has 3 years to audit returns, but 6 years if income is significantly underreported.",
          },
        ],
      },
      {
        id: "taxes-4",
        title: "W-4 & Withholding",
        duration: 5,
        description: "Fill out your W-4 correctly so you're not hit with a surprise bill.",
        icon: "edit-3",
        steps: [
          {
            type: "text",
            title: "What Is a W-4?",
            content:
              "When you start a job, your employer gives you a W-4 form. This tells them how much federal income tax to withhold from each paycheck.\n\nGet it right and you'll either break even at tax time or get a small refund. Get it wrong and you'll owe a big lump sum in April — or overpay all year and give the government a free loan.\n\nThe modern W-4 (redesigned in 2020) uses dollar amounts instead of allowances.",
          },
          {
            type: "quiz",
            title: "W-4 Basics",
            content: "What does the W-4 form control?",
            quiz: {
              question: "What does the W-4 form control?",
              options: [
                "Your take-home pay directly",
                "How much tax is withheld from each paycheck",
                "Your annual tax refund amount",
                "Your eligibility for tax credits",
              ],
              correctIndex: 1,
              explanation:
                "The W-4 tells your employer how much to withhold. More withholding = smaller paycheck but potential refund. Less withholding = bigger paycheck but you might owe at tax time.",
            },
          },
          {
            type: "text",
            title: "Multiple Jobs & Side Income",
            content:
              "If you have:\n• Two jobs simultaneously: Use the IRS withholding estimator or check the 'multiple jobs' box\n• Side gig income (1099): Add extra withholding on your W-4, or pay quarterly estimated taxes\n• Major life change (marriage, new dependent, big raise): Update your W-4 within 10 days\n\nYou can update your W-4 at any time — just give the new form to your HR/payroll department.",
          },
          {
            type: "quiz",
            title: "Scenario",
            content: "You got a second part-time job. What should you do with your W-4?",
            quiz: {
              question: "You got a second part-time job. What should you do with your W-4?",
              options: [
                "Nothing — the IRS adjusts it automatically",
                "Update W-4 at both jobs to reflect extra income",
                "File two separate tax returns",
                "Pay the extra taxes only if you owe over $1,000",
              ],
              correctIndex: 1,
              explanation:
                "Each employer only withholds for their portion of your income. Without updating, you may not withhold enough to cover your combined income bracket.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "housing",
    title: "Housing & Leases",
    subtitle: "Find, rent, and protect your space",
    icon: "home",
    color: "#F59E0B",
    lessonsCount: 3,
    premium: true,
    price: 75,
    lessons: [
      {
        id: "housing-1",
        title: "Apartment Hunting 101",
        duration: 7,
        description: "How to find a great apartment without getting burned.",
        icon: "search",
        steps: [
          {
            type: "text",
            title: "Start with a Budget",
            content:
              "A common rule: spend no more than 30% of your gross (pre-tax) income on rent. So if you earn $3,000/month after tax, aim for $900-$1,000 max. Many landlords require your income to be 2.5-3× the monthly rent.\n\nFactor in hidden costs: utilities ($80-200/mo), parking, renter's insurance ($10-20/mo), and application fees ($30-75 each).",
          },
          {
            type: "quiz",
            title: "Budget Check",
            content: "You earn $2,400/month after taxes. What's the maximum monthly rent you should pay?",
            quiz: {
              question: "You earn $2,400/month after taxes. What's the maximum monthly rent you should pay?",
              options: ["$480", "$720", "$1,200", "$1,500"],
              correctIndex: 1,
              explanation:
                "30% of $2,400 = $720. This keeps housing affordable and leaves room for other expenses and savings.",
            },
          },
          {
            type: "text",
            title: "Red Flags to Watch For",
            content:
              "During apartment tours, watch for:\n\n• No working locks on windows or doors\n• Water stains on ceilings or walls (mold risk)\n• Pests — even one roach means an infestation\n• Landlord won't provide references from current tenants\n• Pressure to sign immediately without reading the lease\n• No written lease — verbal agreements are nearly unenforceable\n\nTrust your gut. A landlord who's difficult before you sign will be worse after.",
          },
          {
            type: "quiz",
            title: "Red Flag Spot",
            content: "A landlord offers you $200 off first month's rent if you sign today without reading the lease. What should you do?",
            quiz: {
              question: "A landlord offers you $200 off first month's rent if you sign today without reading the lease. What should you do?",
              options: [
                "Sign it — $200 savings is worth it",
                "Ask to take 24 hours to read the full lease first",
                "Only read the rent and move-in date",
                "Have a friend skim it quickly",
              ],
              correctIndex: 1,
              explanation:
                "A lease is a legal contract — often 12-24 months of your life. Never sign without reading every page. A legitimate landlord will wait 24 hours.",
            },
          },
        ],
      },
      {
        id: "housing-2",
        title: "Reading Your Lease",
        duration: 8,
        description: "Decode the legal language before you sign anything.",
        icon: "file-text",
        steps: [
          {
            type: "text",
            title: "What Every Lease Has",
            content:
              "Every lease should spell out:\n\n• Rent amount and due date (common: 1st of month)\n• Grace period before late fees kick in (typically 3-5 days)\n• Late fee amount (often $50-100 or 5% of rent)\n• Lease term (start and end dates)\n• Security deposit amount and refund conditions\n• Rules for guests, pets, subletting\n• Who handles repairs and in what timeframe\n• Early termination fee (usually 1-2 months rent)",
          },
          {
            type: "quiz",
            title: "Lease Clause Quiz",
            content: "Your lease says 'Tenant shall not sublet without written landlord approval.' What does this mean?",
            quiz: {
              question: "Your lease says 'Tenant shall not sublet without written landlord approval.' What does this mean?",
              options: [
                "You can have friends stay over for a week",
                "You cannot let someone else take over your lease without permission",
                "You must get approval before having roommates",
                "You cannot renew the lease",
              ],
              correctIndex: 1,
              explanation:
                "Subletting means letting someone else live there and pay rent in your place. This clause means you need written landlord approval first — otherwise you're in breach of contract.",
            },
          },
          {
            type: "text",
            title: "Security Deposit Rules",
            content:
              "Security deposits are heavily regulated. Most states limit them to 1-2 months rent. Landlords must:\n\n• Return your deposit within 14-30 days of move-out (varies by state)\n• Provide an itemized list of any deductions\n• Only deduct for damages beyond 'normal wear and tear'\n\nNormal wear and tear (landlord pays): small nail holes, carpet worn from use, faded paint.\nDamage (you pay): large holes in walls, stained carpet, broken fixtures.\n\nDocument EVERYTHING with timestamped photos on move-in day.",
          },
          {
            type: "quiz",
            title: "Deposit or Not?",
            content: "After moving out, your landlord wants to deduct $300 for 'worn carpet.' Is this valid?",
            quiz: {
              question: "After moving out, your landlord wants to deduct $300 for 'worn carpet.' Is this valid?",
              options: [
                "Yes — any carpet wear is your responsibility",
                "No — normal carpet wear from living is expected and not chargeable",
                "Only if you lived there more than a year",
                "Yes, but only if they have photos",
              ],
              correctIndex: 1,
              explanation:
                "Normal carpet wear from walking and furniture is expected. Landlords cannot charge for normal wear and tear. They CAN charge for stains, burns, or damage from abuse.",
            },
          },
        ],
      },
      {
        id: "housing-3",
        title: "Moving In & Renter's Insurance",
        duration: 6,
        description: "Protect yourself from day one with the right setup.",
        icon: "shield",
        steps: [
          {
            type: "checklist",
            title: "Move-In Day Checklist",
            content: "Do this before you unpack a single box. This documentation could save you hundreds of dollars when you move out.",
            checklistItems: [
              "Film a walk-through video of every room",
              "Photograph all walls, floors, ceilings, and appliances",
              "Test every outlet, light switch, and appliance",
              "Document any existing damage in writing to landlord",
              "Get written confirmation of damage documentation",
              "Change or request new locks (your legal right in most states)",
              "Locate main water shutoff, breaker box, and HVAC controls",
              "Note utility account numbers and transfer them to your name",
            ],
          },
          {
            type: "text",
            title: "Why Renter's Insurance Is Non-Negotiable",
            content:
              "Your landlord's insurance covers the building — not your stuff. If there's a fire, flood, or break-in, you're on your own without renter's insurance.\n\nWhat it covers:\n• Your belongings (laptop, furniture, clothes, etc.)\n• Liability if someone gets hurt in your unit\n• Temporary housing if your apartment is uninhabitable\n\nCost: $10-20/month for $20,000-$30,000 in coverage. That's less than a Netflix subscription to protect everything you own.",
          },
          {
            type: "quiz",
            title: "Insurance Quiz",
            content: "Your neighbor's pipe bursts and floods your apartment, ruining your laptop. Who pays for your laptop?",
            quiz: {
              question: "Your neighbor's pipe bursts and floods your apartment, ruining your laptop. Who pays for your laptop?",
              options: [
                "Your landlord's building insurance",
                "Your neighbor's renter's insurance",
                "Your renter's insurance",
                "Nobody — that's just bad luck",
              ],
              correctIndex: 2,
              explanation:
                "Your renter's insurance covers your belongings regardless of who caused the damage. Your landlord's insurance only covers the building structure, not your personal property.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "career",
    title: "Career & Benefits",
    subtitle: "Get paid what you're worth, plus the rest",
    icon: "briefcase",
    color: "#8B5CF6",
    lessonsCount: 3,
    premium: true,
    price: 75,
    lessons: [
      {
        id: "career-1",
        title: "Reading a Job Offer",
        duration: 7,
        description: "Decode total compensation — salary is just the beginning.",
        icon: "dollar-sign",
        steps: [
          {
            type: "text",
            title: "Total Compensation vs Salary",
            content:
              "Base salary is just one part of what a job is worth. Total compensation includes:\n\n• Base salary — your guaranteed annual pay\n• Health insurance — employer often covers 70-100% of premiums\n• 401k match — free money (commonly 3-6% of salary)\n• PTO — paid time off (10-20 days is typical; 1 week = 2% of salary)\n• Bonus potential — 5-20% of salary for many roles\n• Stock options/RSUs — equity compensation (tech/startups)\n• Remote work, flexibility — hard to price but very real value\n\nA $60k job with great benefits can beat a $70k job with minimal benefits.",
          },
          {
            type: "quiz",
            title: "Offer Comparison",
            content: "Job A: $65k salary, no 401k match, pays 50% of health insurance. Job B: $60k salary, 4% 401k match, full health coverage. Which is worth more?",
            quiz: {
              question: "Job A: $65k salary, no 401k match, pays 50% of health insurance. Job B: $60k salary, 4% 401k match, full health coverage. Which is worth more?",
              options: [
                "Job A — always take the higher salary",
                "Job B — benefits close the gap significantly",
                "They're exactly equal",
                "Impossible to know without more info",
              ],
              correctIndex: 1,
              explanation:
                "4% 401k match on $60k = $2,400/year in free money. Full health coverage saves ~$2,000-4,000/year vs 50%. Job B's total comp likely exceeds Job A's despite lower salary.",
            },
          },
          {
            type: "text",
            title: "What to Review Before Signing",
            content:
              "Before accepting any offer, confirm:\n\n• Start date and onboarding process\n• At-will employment vs. contract terms\n• Non-compete clause scope (can it trap you?)\n• Vesting schedule for stock/equity (4-year cliff vesting is common)\n• PTO policy — do unused days roll over or expire?\n• Remote/hybrid expectations in writing\n• Probationary period rules\n\nNever accept a verbal offer without a written one first. Get everything in writing.",
          },
          {
            type: "quiz",
            title: "Non-Compete Check",
            content: "Your job offer includes a 2-year non-compete saying you can't work in the industry after leaving. What should you do?",
            quiz: {
              question: "Your job offer includes a 2-year non-compete saying you can't work in the industry after leaving. What should you do?",
              options: [
                "Sign it — they're never enforced",
                "Ask a lawyer to review it before signing",
                "Just cross it out and initial it",
                "It doesn't matter if it's for your first job",
              ],
              correctIndex: 1,
              explanation:
                "Non-competes can be legally binding and may limit your career options significantly. Many are overly broad. A brief legal review ($100-200) before signing a major contract is worth it.",
            },
          },
        ],
      },
      {
        id: "career-2",
        title: "Negotiating Your Salary",
        duration: 6,
        description: "How to ask for more — and actually get it.",
        icon: "trending-up",
        steps: [
          {
            type: "text",
            title: "Why You Must Negotiate",
            content:
              "First offers are almost never final. Employers expect negotiation — it's built into the process. People who negotiate their first salary earn an average of $5,000-$10,000 more per year. Compounded over a career, that's hundreds of thousands of dollars.\n\nNegotiating doesn't make you difficult. It signals that you understand your value — which is exactly what employers want in an employee.\n\nThe worst they can say is 'no' — and the offer stays on the table.",
          },
          {
            type: "text",
            title: "The Negotiation Script",
            content:
              "After receiving an offer:\n\n1. Thank them genuinely\n2. Express enthusiasm for the role\n3. Ask for 24-48 hours to review\n4. Come back with a specific counter\n\nExample: 'Thank you so much — I'm really excited about this opportunity. Based on my research and experience, I was expecting something closer to $X. Is there flexibility there?'\n\nAlways anchor with a specific number, not a range. If you say $60-65k, they hear $60k.",
          },
          {
            type: "quiz",
            title: "Negotiation Timing",
            content: "When is the best time to discuss salary?",
            quiz: {
              question: "When is the best time to discuss salary?",
              options: [
                "In the first interview before they're invested in you",
                "After they've made you an offer",
                "Before you apply so expectations are clear",
                "Only if they bring it up first",
              ],
              correctIndex: 1,
              explanation:
                "After an offer, you have maximum leverage — they've already chosen you. Before that, you're just one of many candidates. Let them commit first, then negotiate.",
            },
          },
          {
            type: "quiz",
            title: "Counter Strategy",
            content: "An employer offers $55k. You want $62k. What's the best counter?",
            quiz: {
              question: "An employer offers $55k. You want $62k. What's the best counter?",
              options: [
                "Say you want $60-65k so there's room",
                "Counter at exactly $62k with your reasoning",
                "Counter at $70k to give room to negotiate down",
                "Accept and ask for a raise in 6 months",
              ],
              correctIndex: 1,
              explanation:
                "Be specific with your number and back it with research (market data, your experience). A range signals you're flexible downward. Countering too high looks out of touch.",
            },
          },
        ],
      },
      {
        id: "career-3",
        title: "Benefits 101",
        duration: 8,
        description: "Health, retirement, and everything else HR talks about.",
        icon: "award",
        steps: [
          {
            type: "text",
            title: "Always Grab the 401k Match",
            content:
              "A 401k is a retirement savings account where contributions come out pre-tax — reducing your taxable income now. Your employer often matches contributions up to a percentage.\n\nExample: 4% match on $60k salary = $2,400 free per year.\n\nRule #1: Contribute at least enough to get the full employer match. Not doing so is leaving free money on the table — it's like turning down part of your salary.\n\nThe money grows tax-deferred until retirement (age 59½+). Starting at 22 vs 32 can mean $200,000+ difference at retirement from the same contributions.",
          },
          {
            type: "quiz",
            title: "Match Calculator",
            content: "Your employer offers a 5% 401k match on your $50,000 salary. You contribute 3%. How much free money are you leaving behind?",
            quiz: {
              question: "Your employer offers a 5% 401k match on your $50,000 salary. You contribute 3%. How much free money are you leaving behind?",
              options: ["$500", "$1,000", "$1,500", "$2,500"],
              correctIndex: 1,
              explanation:
                "The full match is 5% = $2,500. You're getting 3% = $1,500. The 2% gap = $1,000/year of free money unclaimed. Always hit the full match.",
            },
          },
          {
            type: "text",
            title: "Health Insurance at Work",
            content:
              "Open enrollment (usually once a year) is when you choose your plan. Key terms:\n\n• Premium: Monthly cost deducted from paycheck\n• Deductible: What you pay out-of-pocket before insurance kicks in\n• Copay: Fixed amount you pay per visit ($20-50 for primary care)\n• Out-of-pocket maximum: Most you'll ever pay in a year ($3,000-$8,000)\n\nHigh Deductible Health Plans (HDHP) + HSA: Lower premiums, higher deductible. Best if you're young and healthy. The HSA lets you save tax-free money for medical expenses.",
          },
          {
            type: "quiz",
            title: "Plan Selection",
            content: "You're 23, healthy, rarely go to the doctor. Which health plan type makes more sense?",
            quiz: {
              question: "You're 23, healthy, rarely go to the doctor. Which health plan type makes more sense?",
              options: [
                "Traditional PPO with a low deductible — more coverage is always better",
                "High Deductible Health Plan — save on premiums, contribute to an HSA",
                "Opt out of health insurance to save money",
                "Choose whichever plan the most people at your company use",
              ],
              correctIndex: 1,
              explanation:
                "For healthy young adults, HDHPs often save money overall — lower premiums + the tax advantages of an HSA outweigh the higher deductible you'll rarely hit. But compare the actual numbers during open enrollment.",
            },
          },
        ],
      },
    ],
  },
  {
    id: "health",
    title: "Health & Insurance",
    subtitle: "Navigate healthcare without the confusion",
    icon: "heart",
    color: "#0EA5E9",
    lessonsCount: 3,
    premium: true,
    price: 75,
    lessons: [
      {
        id: "health-1",
        title: "Health Insurance Basics",
        duration: 6,
        description: "Deductibles, copays, coinsurance — finally explained.",
        icon: "activity",
        steps: [
          {
            type: "text",
            title: "The Four Key Terms",
            content:
              "Health insurance feels complicated because of jargon. Here's the plain-English breakdown:\n\n• Premium: Your monthly payment to have the insurance at all\n• Deductible: Amount you pay out-of-pocket before insurance starts covering anything (e.g., $1,500)\n• Copay: Flat fee for specific services after the deductible ($25 for a doctor visit)\n• Coinsurance: Your share of costs AFTER the deductible (e.g., you pay 20%, insurance pays 80%)\n• Out-of-pocket maximum: The most you'll pay in one year — after this, insurance covers 100%",
          },
          {
            type: "quiz",
            title: "Deductible Check",
            content: "You have a $2,000 deductible. You get a $500 bill. How much do you pay?",
            quiz: {
              question: "You have a $2,000 deductible. You get a $500 bill. How much do you pay?",
              options: [
                "Nothing — insurance covers it",
                "$100 (20% copay)",
                "$500 — full amount, deductible not met yet",
                "$250 — insurance covers half",
              ],
              correctIndex: 2,
              explanation:
                "Until you hit your deductible, you pay all medical costs yourself. Only after you've paid $2,000 total in the year does insurance start sharing costs.",
            },
          },
          {
            type: "text",
            title: "In-Network vs Out-of-Network",
            content:
              "Insurance companies have contracts with specific doctors, hospitals, and labs. Using in-network providers = much lower costs.\n\nOut-of-network care can cost 2-5× more — and some plans won't cover it at all.\n\nBefore any non-emergency procedure:\n1. Call your insurance and verify the provider is in-network\n2. Get the procedure pre-authorized if required\n3. Ask for a cost estimate\n\nERs are the exception — go to any ER in an emergency, then sort the network issue later.",
          },
          {
            type: "quiz",
            title: "Network Knowledge",
            content: "You need an MRI. Your doctor refers you to a specialist. What should you check first?",
            quiz: {
              question: "You need an MRI. Your doctor refers you to a specialist. What should you check first?",
              options: [
                "Nothing — your doctor knows best",
                "Whether the specialist and imaging center are both in-network",
                "Only whether the specialist is in-network",
                "Just your deductible amount",
              ],
              correctIndex: 1,
              explanation:
                "The specialist AND the facility where the MRI is done must both be in-network. Many patients are surprised by large bills when only one is covered.",
            },
          },
        ],
      },
      {
        id: "health-2",
        title: "Choosing the Right Plan",
        duration: 7,
        description: "HMO vs PPO vs HDHP — pick the right one for you.",
        icon: "sliders",
        steps: [
          {
            type: "text",
            title: "The Three Main Plan Types",
            content:
              "HMO (Health Maintenance Organization):\n• Lower premiums\n• Must pick a primary care physician (PCP)\n• Need referrals to see specialists\n• Must stay in-network except emergencies\n• Best for: budget-focused people who don't need many specialists\n\nPPO (Preferred Provider Organization):\n• Higher premiums, more flexibility\n• No PCP required, no referrals needed\n• Can see out-of-network (at higher cost)\n• Best for: people with ongoing specialist care\n\nHDHP (High Deductible Health Plan):\n• Lowest premiums, highest deductible ($1,500+ single)\n• Qualifies for HSA contributions\n• Best for: healthy young adults who want lower monthly costs",
          },
          {
            type: "quiz",
            title: "Plan Matcher",
            content: "You have a chronic condition and see 3 different specialists regularly. Which plan type is best?",
            quiz: {
              question: "You have a chronic condition and see 3 different specialists regularly. Which plan type is best?",
              options: [
                "HDHP — lowest premiums",
                "HMO — requires referrals for all specialists",
                "PPO — flexible specialist access without referrals",
                "Any plan — they all work the same for specialists",
              ],
              correctIndex: 2,
              explanation:
                "PPOs let you see specialists directly without referrals. If you have frequent specialist needs, the PPO's flexibility often outweighs the higher premium.",
            },
          },
          {
            type: "text",
            title: "How to Actually Compare Plans",
            content:
              "During open enrollment, don't just look at premiums. Do this math:\n\n1. Annual premium (monthly × 12)\n2. Estimate your typical annual out-of-pocket (based on last year)\n3. Add them together for each plan option\n4. Compare the totals — not just the premium\n\nAlso check:\n• Are your current doctors in-network?\n• Is your pharmacy covered?\n• Are your regular prescriptions on the formulary (drug list)?\n\nA $50/month cheaper premium means nothing if your preferred doctor is out-of-network.",
          },
          {
            type: "quiz",
            title: "Total Cost Math",
            content: "Plan A: $200/mo premium, $500 deductible. Plan B: $150/mo premium, $2,000 deductible. You expect $800 in medical bills. Which costs less overall?",
            quiz: {
              question: "Plan A: $200/mo premium, $500 deductible. Plan B: $150/mo premium, $2,000 deductible. You expect $800 in medical bills. Which costs less overall?",
              options: [
                "Plan B — lower premium wins",
                "Plan A — $2,400 premium + $300 bills = $2,700 vs Plan B $1,800 + $800 = $2,600",
                "Plan A — $2,400 + $300 bills after deductible = $2,700 vs Plan B $1,800 + $800 bills = $2,600",
                "They're identical",
              ],
              correctIndex: 2,
              explanation:
                "Plan A: $200×12=$2,400 + $300 out-of-pocket (after $500 deductible) = $2,700. Plan B: $150×12=$1,800 + $800 (deductible not met, you pay all) = $2,600. Plan B wins — barely. Always do the full math.",
            },
          },
        ],
      },
      {
        id: "health-3",
        title: "HSA & Medical Bills",
        duration: 6,
        description: "Use an HSA to pay less, and never overpay a medical bill.",
        icon: "dollar-sign",
        steps: [
          {
            type: "text",
            title: "What Is an HSA?",
            content:
              "A Health Savings Account (HSA) is the most tax-advantaged account in existence — triple tax-free:\n\n1. Contributions are pre-tax (reduces taxable income)\n2. Growth is tax-free (invest it like a 401k)\n3. Withdrawals for medical expenses are tax-free\n\nYou can only have an HSA if you have an HDHP. 2024 contribution limits: $4,150 (self) / $8,300 (family).\n\nPro move: Pay medical bills out of pocket now, let the HSA grow invested, reimburse yourself years later — tax-free.",
          },
          {
            type: "quiz",
            title: "HSA Eligibility",
            content: "Which plan qualifies you to open and contribute to an HSA?",
            quiz: {
              question: "Which plan qualifies you to open and contribute to an HSA?",
              options: [
                "Any employer health plan",
                "PPO plans only",
                "High Deductible Health Plan (HDHP)",
                "HMO plans only",
              ],
              correctIndex: 2,
              explanation:
                "HSAs are exclusively paired with HDHPs. If your employer offers an HDHP + HSA, it's often worth considering even if the deductible feels scary — especially with employer HSA contributions.",
            },
          },
          {
            type: "text",
            title: "Never Just Pay a Medical Bill",
            content:
              "Medical bills are negotiable — always. Before paying:\n\n1. Check for billing errors (they're extremely common — 80% of bills have errors)\n2. Request an itemized bill if you just got a summary\n3. Ask if you qualify for financial assistance (charity care)\n4. Negotiate — hospitals routinely accept 40-60% less for cash payments\n5. Set up a payment plan — most hospitals offer 0% interest plans\n\nIf a bill is wrong, call and dispute it in writing. Send a certified letter.\n\nMedical debt has less impact on credit scores now, but it can still be sent to collections — don't ignore bills.",
          },
          {
            type: "quiz",
            title: "Bill Strategy",
            content: "You get a $1,200 ER bill. What's the best first step?",
            quiz: {
              question: "You get a $1,200 ER bill. What's the best first step?",
              options: [
                "Pay it immediately to avoid collections",
                "Ignore it — ER bills are rarely enforced",
                "Request an itemized bill and review for errors before paying",
                "Only pay if they threaten collections",
              ],
              correctIndex: 2,
              explanation:
                "Request an itemized bill first. ER bills commonly contain duplicate charges, incorrect codes, or services not actually received. You may owe significantly less — or nothing — after a review.",
            },
          },
        ],
      },
    ],
  },
];

export const getTrack = (id: string): Track | undefined =>
  tracks.find((t) => t.id === id);

export const getLesson = (trackId: string, lessonId: string): Lesson | undefined =>
  getTrack(trackId)?.lessons.find((l) => l.id === lessonId);

export const FREE_LESSONS_COUNT = tracks
  .filter((t) => !t.premium)
  .reduce((sum, t) => sum + t.lessonsCount, 0);
