import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SavedCharacter {
  id: string;
  name: string;
  modifiers: string[];
  presetKey?: string; // if built from a preset, the key used; otherwise "custom"
  createdAt: number;
}

const KEY = "nextsteps_characters_v1";

export async function loadCharacters(): Promise<SavedCharacter[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
export async function saveCharacters(chars: SavedCharacter[]) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(chars)); } catch {}
}
export async function upsertCharacter(c: SavedCharacter) {
  const list = await loadCharacters();
  const i = list.findIndex(x => x.id === c.id);
  if (i >= 0) list[i] = c; else list.push(c);
  await saveCharacters(list);
}
export async function removeCharacter(id: string) {
  const list = await loadCharacters();
  await saveCharacters(list.filter(c => c.id !== id));
}
export function newCharacterId() { return "char_" + Math.random().toString(36).slice(2, 10); }

export interface CharacterPreset {
  key: string;
  name: string;
  desc: string;
  mods: string[];
}

// 4 presets + the "custom" sentinel handled separately in the UI.
// Criminal record removed from First-Gen Student per request.
export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    key: "first_gen",
    name: "First-Gen Student",
    desc: "Anxious, broke, no family safety net. The most common profile for students navigating adulting alone.",
    mods: ["clean_record", "citizen", "first_gen_student", "no_safety_net", "broke", "healthy", "anxiety", "finance_novice"],
  },
  {
    key: "f1",
    name: "F-1 International",
    desc: "Student visa. Limited work options. Every legal choice matters extra.",
    mods: ["clean_record", "f1_visa", "family_support", "modest_savings", "healthy", "mentally_well", "traditional_student", "finance_savvy"],
  },
  {
    key: "working_parent",
    name: "Working Parent",
    desc: "Supporting an aging parent, paycheck-to-paycheck, chronic condition untreated.",
    mods: ["clean_record", "citizen", "caretaker", "paycheck_to_paycheck", "chronic_condition", "depression_history", "working_full_time", "scammed_before"],
  },
  {
    key: "returning_adult",
    name: "Returning Adult",
    desc: "Back in school after a few years of work. Some savings, grounded mindset.",
    mods: ["clean_record", "citizen", "family_support", "modest_savings", "healthy", "mentally_well", "returning_adult", "finance_savvy"],
  },
];

export function nextCharacterName(existing: SavedCharacter[], baseName: string): string {
  const pattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s#(\\d+))?$`);
  let maxN = 0;
  let hasBase = false;
  existing.forEach(c => {
    const m = c.name.match(pattern);
    if (m) {
      if (!m[1]) hasBase = true;
      else maxN = Math.max(maxN, parseInt(m[1], 10));
    }
  });
  if (!hasBase && maxN === 0) return baseName;
  return `${baseName} #${Math.max(maxN, 1) + 1}`;
}
