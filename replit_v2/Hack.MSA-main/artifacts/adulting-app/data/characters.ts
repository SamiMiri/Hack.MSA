export interface CharacterOption {
  id: string;
  name: string;
  tagline: string;
  traits: string[];
  moneyMult: number;
  stressBonus: number;
  knowledgeBonus: number;
}

export const CHARACTERS: CharacterOption[] = [
  {
    id: 'student',
    name: 'Broke Student',
    tagline: 'Low on cash, high on hustle',
    traits: ['Part-time job', 'Financial aid eligible', 'Sharp learner'],
    moneyMult: 0.65,
    stressBonus: 5,
    knowledgeBonus: 5,
  },
  {
    id: 'firstgen',
    name: 'First-Gen Adult',
    tagline: 'Navigating systems no one explained',
    traits: ['No family safety net', 'High resilience', 'Learning as you go'],
    moneyMult: 0.85,
    stressBonus: 15,
    knowledgeBonus: 0,
  },
  {
    id: 'professional',
    name: 'Young Professional',
    tagline: 'Earning more, but the stakes are higher',
    traits: ['Steady paycheck', 'High expectations', 'Expensive taste'],
    moneyMult: 1.5,
    stressBonus: 10,
    knowledgeBonus: -2,
  },
];
