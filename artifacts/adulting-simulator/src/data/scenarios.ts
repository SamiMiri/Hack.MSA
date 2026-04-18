export type StatType = 'money' | 'stress' | 'credit' | 'happiness';

export interface StatDeltas {
  money?: number;
  stress?: number;
  credit?: number;
  happiness?: number;
}

export interface Choice {
  id: string;
  text: string;
  consequenceText: string;
  deltas: StatDeltas;
}

export interface Decision {
  id: string;
  prompt: string;
  choices: Choice[];
}

export interface Scenario {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: string;
  startingStats: {
    money: number;
    stress: number;
    credit: number;
    happiness: number;
  };
  decisions: Decision[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'first-month-alone',
    title: 'First Month Living Alone',
    difficulty: 'Medium',
    estimatedTime: '5 mins',
    startingStats: {
      money: 2000,
      stress: 20,
      credit: 0,
      happiness: 80
    },
    decisions: [
      {
        id: 'd1',
        prompt: "Rent is due and you're $200 short. Your landlord needs the full payment by Friday.",
        choices: [
          { id: 'c1a', text: "Ask parents for money", consequenceText: "You got the cash but feel like a kid again", deltas: { money: 200, stress: 5, happiness: -10 } },
          { id: 'c1b', text: "Skip groceries this week and scrape it together", consequenceText: "Two days of ramen. Made it work. Barely.", deltas: { stress: 20, happiness: -15 } },
          { id: 'c1c', text: "Use a credit card for the $200", consequenceText: "Quick fix. Future you will deal with the bill.", deltas: { stress: 10, credit: -20, happiness: -5 } },
          { id: 'c1d', text: "Talk to landlord and negotiate a 5-day extension", consequenceText: "Landlord was cool about it. Communication works.", deltas: { stress: -5, happiness: 10 } }
        ]
      },
      {
        id: 'd2',
        prompt: "You got a bill for $340 from the ER visit you forgot about last month. No insurance.",
        choices: [
          { id: 'c2a', text: "Pay it all now", consequenceText: "Ouch. Your wallet felt that.", deltas: { money: -340, stress: 5, happiness: -10 } },
          { id: 'c2b', text: "Call and ask for a payment plan", consequenceText: "They said yes immediately. Most hospitals do.", deltas: { money: -50, stress: 10, happiness: 5 } },
          { id: 'c2c', text: "Ignore it for now", consequenceText: "Ignorance is bliss... for now.", deltas: { stress: -5, credit: -40, happiness: -5 } },
          { id: 'c2d', text: "Request itemized bill and dispute charges", consequenceText: "Saved $190 but took 2 weeks. Worth it.", deltas: { money: -150, stress: 15, happiness: 15 } }
        ]
      },
      {
        id: 'd3',
        prompt: "Your friends are going to a concert ($80 ticket). You can technically afford it but probably shouldn't.",
        choices: [
          { id: 'c3a', text: "Go. YOLO.", consequenceText: "Worth every dollar. Some things matter more.", deltas: { money: -80, happiness: 20, stress: -10 } },
          { id: 'c3b', text: "Skip it", consequenceText: "You watched their stories from your couch. Regret.", deltas: { stress: -5, happiness: -15 } },
          { id: 'c3c', text: "Go but sell old stuff to cover it", consequenceText: "The Marketplace gods provided.", deltas: { money: -30, happiness: 15, stress: 5 } },
          { id: 'c3d', text: "Invite them to a free event instead", consequenceText: "They actually loved it.", deltas: { happiness: 10, stress: -5 } }
        ]
      },
      {
        id: 'd4',
        prompt: "Monthly subscriptions: you're paying for 7 streaming services ($140/month total).",
        choices: [
          { id: 'c4a', text: "Cancel everything", consequenceText: "You lasted 3 days without Netflix.", deltas: { money: 140, happiness: -20, stress: 5 } },
          { id: 'c4b', text: "Audit and keep 2", consequenceText: "You barely miss them.", deltas: { money: 100, happiness: -5, stress: -5 } },
          { id: 'c4c', text: "Do nothing", consequenceText: "You keep meaning to deal with this...", deltas: { stress: 10 } },
          { id: 'c4d', text: "Share accounts with roommates/friends", consequenceText: "Subscription Voltron assembled.", deltas: { money: 80, happiness: 10, stress: -5 } }
        ]
      },
      {
        id: 'd5',
        prompt: "It's end of month. $150 left. What do you do?",
        choices: [
          { id: 'c5a', text: "Save all of it", consequenceText: "Future you will be grateful.", deltas: { credit: 10, happiness: -5, stress: -10 } },
          { id: 'c5b', text: "Treat yourself to a nice dinner ($60) + save rest", consequenceText: "Sustainable adulting requires rewards.", deltas: { happiness: 15, stress: -15 } },
          { id: 'c5c', text: "Buy something impulsive online at 2am", consequenceText: "Oops.", deltas: { money: -150, happiness: -10, stress: 25 } },
          { id: 'c5d', text: "Invest in a small emergency fund", consequenceText: "$150 in savings. It begins.", deltas: { credit: 20, happiness: 5, stress: -20 } }
        ]
      }
    ]
  },
  {
    id: 'job-offer',
    title: 'Job Offer Decision',
    difficulty: 'Hard',
    estimatedTime: '6 mins',
    startingStats: {
      money: 1200,
      stress: 40,
      credit: 620,
      happiness: 65
    },
    decisions: [
      {
        id: 'd1',
        prompt: "You got two job offers. Company A pays $52k/year with great culture. Company B pays $64k but has a toxic reputation.",
        choices: [
          { id: 'c1a', text: "Take Company A", consequenceText: "Culture > salary. For now.", deltas: { money: 2000, happiness: 15, stress: -10 } },
          { id: 'c1b', text: "Take Company B", consequenceText: "The money is real. So is the misery.", deltas: { money: 3000, happiness: -10, stress: 20 } },
          { id: 'c1c', text: "Negotiate Company A's salary first", consequenceText: "They met you halfway. Always ask.", deltas: { money: 2400, happiness: 10, stress: -5 } },
          { id: 'c1d', text: "Ask for more time to decide", consequenceText: "Bold move. They gave you a week.", deltas: { stress: 10, happiness: 5 } }
        ]
      },
      {
        id: 'd2',
        prompt: "First paycheck arrives. You owe $8,000 in student loans.",
        choices: [
          { id: 'c2a', text: "Make minimum payments", consequenceText: "Set it and forget it. Loans will still be there.", deltas: { stress: -5, credit: 5, happiness: 10 } },
          { id: 'c2b', text: "Aggressively overpay", consequenceText: "Debt is leaving. Slowly.", deltas: { money: -800, stress: 10, credit: 20, happiness: -5 } },
          { id: 'c2c', text: "Look into income-based repayment", consequenceText: "Payment matches income. Hidden gem.", deltas: { stress: -15, credit: 5, happiness: 15 } },
          { id: 'c2d', text: "Ignore them", consequenceText: "Enjoy the bliss while it lasts.", deltas: { credit: -30, stress: -5, happiness: 5 } }
        ]
      },
      {
        id: 'd3',
        prompt: "HR asks you to fill out a W-4. You have no idea what to do.",
        choices: [
          { id: 'c3a', text: "Claim 0 — big refund next year, bigger paycheck cut now", consequenceText: "Safe but tight.", deltas: { stress: -5, money: -200, happiness: -5 } },
          { id: 'c3b', text: "Use the IRS withholding calculator", consequenceText: "Slightly painful. Very worth it.", deltas: { stress: 5, credit: 5, happiness: 10 } },
          { id: 'c3c', text: "Claim lots of allowances to get more now", consequenceText: "Future you might owe money.", deltas: { stress: -10, happiness: 10, credit: -10 } },
          { id: 'c3d', text: "Ask a coworker who 'did accounting in college'", consequenceText: "Their advice was confidently wrong.", deltas: { stress: -5, happiness: -5 } }
        ]
      },
      {
        id: 'd4',
        prompt: "Your manager asks you to work unpaid overtime 'for the team.'",
        choices: [
          { id: 'c4a', text: "Always say yes", consequenceText: "You resent every late email.", deltas: { stress: 30, happiness: -20 } },
          { id: 'c4b', text: "Push back once politely", consequenceText: "They actually respected you more.", deltas: { stress: -10, happiness: 20 } },
          { id: 'c4c', text: "Say yes once, then set a limit", consequenceText: "Compromise. You can live with it.", deltas: { stress: 10, happiness: 5 } },
          { id: 'c4d', text: "Document it and talk to HR", consequenceText: "They stopped asking after that.", deltas: { stress: 20, happiness: 5, credit: 5 } }
        ]
      },
      {
        id: 'd5',
        prompt: "Six months in. Your emergency fund is at $0. You could start one.",
        choices: [
          { id: 'c5a', text: "Automate $200/month", consequenceText: "It grows quietly while you sleep.", deltas: { stress: -10, happiness: 5, credit: 15 } },
          { id: 'c5b', text: "Wait until you feel ready", consequenceText: "'Ready' never comes.", deltas: { stress: 5, happiness: -5 } },
          { id: 'c5c', text: "Put $1,000 in right now, deal with tight month", consequenceText: "Painful but now you're actually protected.", deltas: { money: -1000, stress: 5, happiness: -5, credit: 20 } },
          { id: 'c5d', text: "Split between savings and investments", consequenceText: "Balanced approach. Solid.", deltas: { credit: 20, stress: -5, happiness: 10 } }
        ]
      }
    ]
  }
];