import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CustomLevel {
  id: string;
  name: string;
  who: string;
  desc: string;
  startMoney: number;
  defaultName: string;
  startSceneId: string;
  scenes: Array<{
    id: string;
    title: string;
    text: string;
    choices?: Array<{
      label: string;
      kind: "good" | "bad" | "mid";
      feedback: string;
      effects?: {
        money?: number;
        health?: number;
        wellbeing?: number;
        law?: number;
        addFlags?: string[];
        rmFlags?: string[];
      };
      nextId?: string | null;
    }>;
    ending?: boolean;
    endingKind?: "good" | "bad" | "mid";
  }>;
  endingRules?: Array<{
    if?: {
      hasFlag?: string;
      notFlag?: string;
      lawGte?: number;
      wellbeingGte?: number;
      healthGte?: number;
      moneyGte?: number;
    };
    default?: boolean;
    to: string;
  }>;
  lessons?: Array<{ t: string; d: string }>;
  analysisRules?: Array<{
    when: {
      hasFlag?: string;
      notFlag?: string;
      lawGte?: number;
      wellbeingGte?: number;
    };
    kind: "good" | "bad" | "mid";
    text: string;
  }>;
}

const KEY = "nextsteps_levels_v1";

export async function loadLevels(): Promise<CustomLevel[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
export async function saveLevels(levels: CustomLevel[]) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(levels)); } catch {}
}
export async function upsertLevel(lvl: CustomLevel) {
  const list = await loadLevels();
  const i = list.findIndex(l => l.id === lvl.id);
  if (i >= 0) list[i] = lvl; else list.push(lvl);
  await saveLevels(list);
}
export async function removeLevel(id: string) {
  const list = await loadLevels();
  await saveLevels(list.filter(l => l.id !== id));
}
export function newLevelId() { return "lvl_" + Math.random().toString(36).slice(2, 10); }
export function newSceneId() { return "s_" + Math.random().toString(36).slice(2, 8); }

export function blankLevel(): CustomLevel {
  return {
    id: newLevelId(),
    name: "Untitled Level",
    who: "Your Character · age · role",
    desc: "One sentence summary.",
    startMoney: 1000,
    defaultName: "Alex Rivers",
    startSceneId: "intro",
    scenes: [
      { id: "intro", title: "Day 1", text: "You are {name}. The scenario begins...", choices: [
        { label: "Do the smart thing.", kind: "good", feedback: "Correct because...", effects: { wellbeing: 5, law: -5 }, nextId: "finale" },
        { label: "Do the risky thing.", kind: "bad", feedback: "Backfires because...", effects: { wellbeing: -5, law: 15 }, nextId: "finale" },
        { label: "Middle ground.", kind: "mid", feedback: "Not ideal, not disaster.", effects: {}, nextId: "finale" },
      ]},
      { id: "ending_good", title: "GOOD ENDING", text: "{name}. You made it.", ending: true, endingKind: "good" },
      { id: "ending_mid", title: "MEDIOCRE ENDING", text: "{name}. Still standing. Learned a bit.", ending: true, endingKind: "mid" },
      { id: "ending_bad", title: "BAD ENDING", text: "{name}. The cost caught up.", ending: true, endingKind: "bad" },
    ],
    endingRules: [
      { if: { lawGte: 70 }, to: "ending_bad" },
      { if: { wellbeingGte: 60 }, to: "ending_good" },
      { default: true, to: "ending_mid" },
    ],
    lessons: [{ t: "Key takeaway", d: "What the player should remember." }],
    analysisRules: [
      { when: { wellbeingGte: 70 }, kind: "good", text: "You protected your wellbeing." },
      { when: { lawGte: 50 }, kind: "bad", text: "Too much legal risk." },
    ],
  };
}

export function evalCondition(state: any, cond: any): boolean {
  if (!cond) return true;
  if (cond.hasFlag && !state.flags.has(cond.hasFlag)) return false;
  if (cond.notFlag && state.flags.has(cond.notFlag)) return false;
  if (cond.lawGte != null && state.law < cond.lawGte) return false;
  if (cond.wellbeingGte != null && state.wellbeing < cond.wellbeingGte) return false;
  if (cond.healthGte != null && state.health < cond.healthGte) return false;
  if (cond.moneyGte != null && state.money < cond.moneyGte) return false;
  return true;
}
export function evalRules(state: any, rules: any[], fallback: string): string {
  for (const r of rules || []) {
    if (r.default || evalCondition(state, r.if)) return r.to;
  }
  return fallback;
}

export function interpolate(str: string, state: any): string {
  if (!str) return "";
  return str
    .replace(/\{name\}/g, state.charName || "You")
    .replace(/\{money\}/g, String(Math.round(state.money)))
    .replace(/\{law\}/g, String(Math.round(state.law)))
    .replace(/\{wellbeing\}/g, String(Math.round(state.wellbeing)))
    .replace(/\{health\}/g, String(Math.round(state.health)));
}
