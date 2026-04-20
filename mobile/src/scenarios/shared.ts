import { Scene } from "../types";

export const sharedEndings: Record<string, Scene> = {
  ending_jail: {
    title: "INCARCERATED",
    text: s => `${s.charName}. Federal custody. Years you didn't plan to lose.\n\nLessons cost more when you learn them in court.`,
    ending: true, endingKind: "bad",
  },
  ending_fugitive: {
    title: "FUGITIVE",
    text: s => `${s.charName}. A provisional warrant. You'll be extradited.\n\nThere was always a better choice.`,
    ending: true, endingKind: "bad",
  },
  ending_hospital: {
    title: "HOSPITALIZED",
    text: s => `${s.charName}. ER. Exhaustion and untreated conditions caught up.\n\nHealth was the real stat.`,
    ending: true, endingKind: "bad",
  },
  ending_breakdown: {
    title: "BURNED OUT",
    text: s => `${s.charName}. You stopped functioning. Everything else stopped too.\n\nWellbeing is not a luxury.`,
    ending: true, endingKind: "bad",
  },
};
