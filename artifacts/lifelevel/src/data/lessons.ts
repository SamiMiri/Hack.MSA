export type Choice = {
  id: string;
  text: string;
  isCorrect: boolean | "neutral";
  consequence: string;
};

export type Decision = {
  id: string;
  question: string;
  choices: Choice[];
};

export type Lesson = {
  id: string;
  title: string;
  category: string;
  xp: number;
  timeEstimate: string;
  intro: string;
  takeaway: string;
  decisions: Decision[];
};

export const LESSONS: Lesson[] = [
  {
    id: "lesson_1",
    title: "Your First Paycheck",
    category: "Budgeting",
    xp: 100,
    timeEstimate: "4 min",
    intro: "Your first real paycheck just hit. $1,840 after taxes from your $26/hr warehouse job. Your rent is $900. You have $200 in your account.",
    takeaway: "50/30/20 rule: 50% needs, 30% wants, 20% savings. Automate your savings if you can.",
    decisions: [
      {
        id: "l1_d1",
        question: "You open your banking app. The $1,840 looks amazing. What's your first move?",
        choices: [
          { id: "a", text: "Transfer $200 to savings immediately", isCorrect: "neutral", consequence: "Good: builds habit. It's best to pay yourself first!" },
          { id: "b", text: "Set aside rent money ($900) in a mental note", isCorrect: false, consequence: "Risky: easy to 'accidentally' spend mental money." },
          { id: "c", text: "Treat yourself first, budget later", isCorrect: false, consequence: "Bad: sets a dangerous pattern where savings never happen." },
          { id: "d", text: "Open a spreadsheet and plan every dollar", isCorrect: true, consequence: "Best: making a plan means you tell your money where to go, instead of wondering where it went." }
        ]
      },
      {
        id: "l1_d2",
        question: "Your phone bill is $85, groceries roughly $300/month. How do you split the rest?",
        choices: [
          { id: "a", text: "50% needs / 30% wants / 20% savings (the 50/30/20 rule)", isCorrect: true, consequence: "Best choice! This rule ensures your basic needs are met, you still have fun, and your future self is taken care of." },
          { id: "b", text: "Pay bills, keep the rest for fun", isCorrect: false, consequence: "A common mistake. If you don't intentionally save, you usually won't." },
          { id: "c", text: "Put everything in one account and 'just be careful'", isCorrect: false, consequence: "Risky. Relying purely on willpower is exhausting and usually fails." },
          { id: "d", text: "Ask your parents what to do", isCorrect: "neutral", consequence: "Acceptable, but you're an adult now. It's time to build your own system." }
        ]
      },
      {
        id: "l1_d3",
        question: "End of month. You have $140 left. Your friend wants you to go to a concert ($80 ticket).",
        choices: [
          { id: "a", text: "Go. Life is short", isCorrect: false, consequence: "Fun, but leaves you with no savings cushion. Emergencies don't care about concerts." },
          { id: "b", text: "Skip it and save the $140", isCorrect: "neutral", consequence: "Best for savings, but missing social time is a real cost too." },
          { id: "c", text: "Go, and sell something to replace the money", isCorrect: true, consequence: "Creative problem-solving! You get the experience and maintain your financial goals." },
          { id: "d", text: "Suggest a free alternative", isCorrect: true, consequence: "Balanced and smart. True friends will understand and still want to hang out." }
        ]
      }
    ]
  },
  {
    id: "lesson_2",
    title: "Signing Your First Lease",
    category: "Renting",
    xp: 120,
    timeEstimate: "5 min",
    intro: "You found a one-bedroom for $1,050/month. The landlord sends you a 14-page lease. You have 24 hours to sign.",
    takeaway: "Know your lease before signing. You can negotiate. Take photos. Understand your rights.",
    decisions: [
      {
        id: "l2_d1",
        question: "You open the PDF. It's dense. What do you do?",
        choices: [
          { id: "a", text: "Read the whole thing", isCorrect: "neutral", consequence: "Takes time but worth it. You spotted a clause: landlord can enter with 12-hour notice (legal minimum is 24h in most states)." },
          { id: "b", text: "Skim and sign", isCorrect: false, consequence: "You missed the entry clause and the early termination fee." },
          { id: "c", text: "Ask a friend who 'knows about leases'", isCorrect: "neutral", consequence: "Mixed: they caught the entry clause but missed the early termination fee." },
          { id: "d", text: "Google the lease terms that seem weird", isCorrect: true, consequence: "Best approach: you find the entry clause AND a $1,500 early termination fee buried in section 8." }
        ]
      },
      {
        id: "l2_d2",
        question: "The lease says 'Tenant is responsible for all maintenance up to $300.' Is this normal?",
        choices: [
          { id: "a", text: "Yes, that's standard", isCorrect: false, consequence: "Wrong: typically tenants are only responsible for lightbulbs and minor stuff." },
          { id: "b", text: "No — negotiate it out or cap at $100", isCorrect: true, consequence: "Correct! Leases are contracts, and contracts can be negotiated." },
          { id: "c", text: "Ignore it, you won't break anything", isCorrect: false, consequence: "Risky: HVAC filters, plumbing issues, etc., happen naturally." },
          { id: "d", text: "Walk away from the apartment", isCorrect: "neutral", consequence: "Extreme, but it's important to know you CAN walk away if terms are bad." }
        ]
      },
      {
        id: "l2_d3",
        question: "Security deposit is $2,100 (two months). You pay it. How do you protect yourself?",
        choices: [
          { id: "a", text: "Take timestamped video/photos of every room", isCorrect: true, consequence: "Best: undeniable evidence for getting your deposit back later." },
          { id: "b", text: "Trust that the landlord is honest", isCorrect: false, consequence: "Risky. Many landlords will try to charge you for pre-existing damage." },
          { id: "c", text: "Note damages on the move-in checklist", isCorrect: "neutral", consequence: "Good, but make sure the landlord signs it too, and keep a copy." },
          { id: "d", text: "Nothing, deal with it when you move out", isCorrect: false, consequence: "Dangerous. You'll likely lose the deposit." }
        ]
      },
      {
        id: "l2_d4",
        question: "Six months in. Your landlord texts: 'Painting the hallway Saturday. I'll stop by around 10am.' Is this legal?",
        choices: [
          { id: "a", text: "Yes", isCorrect: false, consequence: "Wrong, technically not. 24h written notice is usually required by law." },
          { id: "b", text: "No — reply asking for formal written notice", isCorrect: true, consequence: "Correct. Teaches tenant rights. Don't let them walk over you." },
          { id: "c", text: "Just leave for the day", isCorrect: "neutral", consequence: "Avoids conflict, but doesn't assert your legal rights." },
          { id: "d", text: "Call the police", isCorrect: false, consequence: "Overreaction. Handle it civilly first." }
        ]
      }
    ]
  },
  {
    id: "lesson_3",
    title: "The Credit Card Offer",
    category: "Credit",
    xp: 110,
    timeEstimate: "4 min",
    intro: "You got pre-approved for your first credit card: $1,500 limit, 24.99% APR. The welcome offer is $150 cashback if you spend $500 in the first 3 months.",
    takeaway: "APR is the most important number. Always pay your full balance. On-time payment history is the #1 credit score factor.",
    decisions: [
      {
        id: "l3_d1",
        question: "What's the first thing you should understand about this card?",
        choices: [
          { id: "a", text: "The $150 cashback offer", isCorrect: false, consequence: "It's nice, but the APR is far more important." },
          { id: "b", text: "The APR (24.99%)", isCorrect: true, consequence: "Correct: this is the annual interest rate. If you carry a balance, it's very expensive." },
          { id: "c", text: "The credit limit ($1,500)", isCorrect: "neutral", consequence: "Important for utilization, but secondary to the interest rate." },
          { id: "d", text: "The rewards points system", isCorrect: false, consequence: "Useful, but not the priority." }
        ]
      },
      {
        id: "l3_d2",
        question: "You spend $520 in month 1 to get the cashback. You can only pay $200 this month.",
        choices: [
          { id: "a", text: "Pay the $200 minimum", isCorrect: "neutral", consequence: "The remaining $320 accrues interest at ~2%/month. It costs you money." },
          { id: "b", text: "Pay it all off", isCorrect: true, consequence: "Best, but you said you only have $200. This is why you shouldn't spend money you don't have." },
          { id: "c", text: "Skip the payment", isCorrect: false, consequence: "Worst: damages credit score, triggers late fees and interest." },
          { id: "d", text: "Call and ask for a payment plan", isCorrect: false, consequence: "Credit cards don't work like that for single months." }
        ]
      },
      {
        id: "l3_d3",
        question: "Your credit score was 0. After 3 months of on-time payments, what happens?",
        choices: [
          { id: "a", text: "Goes to 720", isCorrect: false, consequence: "Unrealistic. It takes much longer to build excellent credit." },
          { id: "b", text: "Goes to around 630-670", isCorrect: true, consequence: "Realistic for new credit users with a short history." },
          { id: "c", text: "Nothing changes", isCorrect: false, consequence: "Wrong. On-time payments are the biggest factor in your score." },
          { id: "d", text: "Goes negative", isCorrect: false, consequence: "Credit scores don't go below 300." }
        ]
      },
      {
        id: "l3_d4",
        question: "A friend says 'just pay the minimum every month, it's fine.' Are they right?",
        choices: [
          { id: "a", text: "Yes", isCorrect: false, consequence: "Wrong. Paying minimums means carrying a balance and paying maximum interest." },
          { id: "b", text: "No", isCorrect: true, consequence: "Correct. The minimum is a trap — it keeps you in debt longer." },
          { id: "c", text: "It depends on your income", isCorrect: false, consequence: "Wrong framing. Interest is interest regardless of income." },
          { id: "d", text: "Only if the APR is low", isCorrect: "neutral", consequence: "Partially true, but 24.99% is never low." }
        ]
      }
    ]
  },
  {
    id: "lesson_4",
    title: "Tax Season Hits",
    category: "Taxes",
    xp: 130,
    timeEstimate: "5 min",
    intro: "It's February. Your employer sent you a W-2. A friend says 'just file online, it takes 20 minutes.' You've never filed before.",
    takeaway: "W-2 comes from employer. Standard deduction is usually best. File by April 15 or request extension.",
    decisions: [
      {
        id: "l4_d1",
        question: "What is a W-2?",
        choices: [
          { id: "a", text: "A form that tells you how much you owe", isCorrect: false, consequence: "Partly right but misleading. It just shows what happened." },
          { id: "b", text: "A statement showing your wages and taxes already withheld", isCorrect: true, consequence: "Correct. Your employer is legally required to provide this." },
          { id: "c", text: "A form you fill out yourself", isCorrect: false, consequence: "Wrong (that's the 1040)." },
          { id: "d", text: "Something only contractors get", isCorrect: false, consequence: "Wrong (contractors get 1099s)." }
        ]
      },
      {
        id: "l4_d2",
        question: "A free filing tool asks: 'Claim standard deduction or itemize?' You have no mortgage, no major donations.",
        choices: [
          { id: "a", text: "Itemize", isCorrect: false, consequence: "Wrong for most young people without major deductions. You'd lose money." },
          { id: "b", text: "Standard deduction", isCorrect: true, consequence: "Correct: Most young adults should take this flat deduction amount." },
          { id: "c", text: "Neither, skip it", isCorrect: false, consequence: "Not an option." },
          { id: "d", text: "Whatever is bigger", isCorrect: "neutral", consequence: "Right instinct, but standard is almost always bigger for you right now." }
        ]
      },
      {
        id: "l4_d3",
        question: "The tool says you get a $340 refund. Your coworker says 'I owed $600.' Why?",
        choices: [
          { id: "a", text: "You're smarter", isCorrect: false, consequence: "Wrong. Taxes aren't an IQ test." },
          { id: "b", text: "Your W-4 withholding was set higher", isCorrect: true, consequence: "Correct. You had more taxes taken from each paycheck, so you get money back." },
          { id: "c", text: "You live in a different state", isCorrect: "neutral", consequence: "Possible factor for state taxes, but withholding is the main reason." },
          { id: "d", text: "You made less money", isCorrect: "neutral", consequence: "Could contribute, but withholding is the core mechanism." }
        ]
      },
      {
        id: "l4_d4",
        question: "It's April 10 and you haven't filed. You can't finish by the April 15 deadline.",
        choices: [
          { id: "a", text: "Skip it and file next year", isCorrect: false, consequence: "Wrong: severe penalties accrue starting April 16." },
          { id: "b", text: "File for an extension", isCorrect: true, consequence: "Correct: gives you 6 more months to file (but NOT to pay what you owe)." },
          { id: "c", text: "File a partial return", isCorrect: false, consequence: "Not a real thing." },
          { id: "d", text: "Guess and submit", isCorrect: false, consequence: "Risky and can trigger an audit." }
        ]
      }
    ]
  },
  {
    id: "lesson_5",
    title: "Know Your Rights",
    category: "Law",
    xp: 150,
    timeEstimate: "5 min",
    intro: "You're driving home from work. Red and blue lights. You pull over. The officer approaches your window.",
    takeaway: "Know your rights during stops. You can politely refuse searches. Document everything with landlords. In small claims court, your evidence is your power.",
    decisions: [
      {
        id: "l5_d1",
        question: "What should you do immediately?",
        choices: [
          { id: "a", text: "Get out of the car", isCorrect: false, consequence: "Wrong and potentially escalating." },
          { id: "b", text: "Stay calm: hands visible on wheel, window down", isCorrect: true, consequence: "Correct. This de-escalates the situation and keeps everyone safe." },
          { id: "c", text: "Pull out your phone to record", isCorrect: "neutral", consequence: "You have the right, but do it carefully and after the situation is calm." },
          { id: "d", text: "Ask why you were stopped before saying anything", isCorrect: "neutral", consequence: "You can, but doing the safe basics first is better." }
        ]
      },
      {
        id: "l5_d2",
        question: "The officer asks 'Do you know why I pulled you over?' What do you say?",
        choices: [
          { id: "a", text: "'No, officer'", isCorrect: true, consequence: "Safest answer: you don't admit to anything." },
          { id: "b", text: "'I might have been going a bit fast'", isCorrect: false, consequence: "This is admissible as a confession." },
          { id: "c", text: "'I was only going 5 over'", isCorrect: false, consequence: "You just confessed to speeding." },
          { id: "d", text: "Refuse to answer", isCorrect: "neutral", consequence: "Legal, but might escalate the encounter." }
        ]
      },
      {
        id: "l5_d3",
        question: "The officer asks 'Can I search your car?' You know there's nothing illegal inside.",
        choices: [
          { id: "a", text: "'Sure, go ahead'", isCorrect: false, consequence: "You've waived your 4th Amendment rights unnecessarily." },
          { id: "b", text: "'I don't consent to searches, officer'", isCorrect: true, consequence: "Correct. Politely refuse. If they had probable cause, they wouldn't ask." },
          { id: "c", text: "'Do you have a warrant?'", isCorrect: "neutral", consequence: "You can ask this, but a simple refusal is clearer." },
          { id: "d", text: "Get out and open the trunk", isCorrect: false, consequence: "You are unnecessarily waiving your rights." }
        ]
      },
      {
        id: "l5_d4",
        question: "Back home, you get sued in small claims court by your former landlord for $1,400 in 'damages'.",
        choices: [
          { id: "a", text: "Ignore it", isCorrect: false, consequence: "Default judgment against you. You will owe the money." },
          { id: "b", text: "Respond and gather your evidence", isCorrect: true, consequence: "Correct. Your move-in photos and emails are your defense." },
          { id: "c", text: "Hire an expensive lawyer immediately", isCorrect: false, consequence: "Unnecessary. Small claims is designed to be handled without lawyers." },
          { id: "d", text: "Pay it to avoid hassle", isCorrect: false, consequence: "You may not owe this money. Don't be bullied." }
        ]
      }
    ]
  }
];