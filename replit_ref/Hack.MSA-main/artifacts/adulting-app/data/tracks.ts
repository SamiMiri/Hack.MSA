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
              options: [
                "Monthly rent",
                "Netflix subscription",
                "Groceries",
                "Car insurance",
              ],
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
];

export const getTrack = (id: string): Track | undefined =>
  tracks.find((t) => t.id === id);

export const getLesson = (trackId: string, lessonId: string): Lesson | undefined =>
  getTrack(trackId)?.lessons.find((l) => l.id === lessonId);
