export interface OnboardingQuestion {
  id: string;
  question: string;
  icon: string;
  options: { label: string; value: string; icon: string }[];
}

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "stage",
    question: "Where are you in life right now?",
    icon: "map-pin",
    options: [
      { label: "Still in school", value: "student", icon: "book" },
      { label: "First job / just graduated", value: "new-grad", icon: "briefcase" },
      { label: "Working, figuring things out", value: "working", icon: "trending-up" },
      { label: "Moving out / living alone", value: "independent", icon: "home" },
    ],
  },
  {
    id: "biggest-need",
    question: "What's your biggest challenge right now?",
    icon: "target",
    options: [
      { label: "Managing money & budgeting", value: "money", icon: "dollar-sign" },
      { label: "Filing taxes", value: "taxes", icon: "file-text" },
      { label: "Finding & signing a lease", value: "housing", icon: "key" },
      { label: "Health insurance & benefits", value: "health", icon: "heart" },
    ],
  },
  {
    id: "goal",
    question: "What's your main financial goal?",
    icon: "award",
    options: [
      { label: "Stop living paycheck to paycheck", value: "survive", icon: "refresh-cw" },
      { label: "Build an emergency fund", value: "emergency", icon: "shield" },
      { label: "Pay off debt faster", value: "debt", icon: "minus-circle" },
      { label: "Start investing", value: "invest", icon: "bar-chart-2" },
    ],
  },
];
