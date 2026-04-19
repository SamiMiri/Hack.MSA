export type ChoiceKind = "good" | "bad" | "mid";

export interface Effects {
  money?: number;
  health?: number;
  wellbeing?: number;
  law?: number;
  addFlags?: string[];
  rmFlags?: string[];
  schedule?: [number, string][];
}

export interface Choice {
  label: string;
  kind: ChoiceKind;
  feedback: string;
  effects?: Effects;
  nextId?: string | null;
  next?: (state: GameState) => string;
}

export interface Scene {
  title: string;
  text: (state: GameState) => string;
  choices?: Choice[];
  ending?: boolean;
  endingKind?: ChoiceKind;
}

export interface Scenario {
  id: string;
  name: string;
  who: string;
  desc: string;
  estimatedTime: string;
  startMoney: number;
  startSceneId: string;
  defaultName: string;
  accent: string;
  scenes: Record<string, Scene>;
}

export interface GameState {
  scenarioId: string;
  charName: string;
  modifiers: Set<string>;
  health: number;
  wellbeing: number;
  money: number;
  law: number;
  flags: Set<string>;
  pending: { turn: number; sceneId: string }[];
  turn: number;
  notebook: NotebookEntry[];
  currentSceneId: string;
  resumeStack: string[];
  gameOver: boolean;
  forcedEndId?: string;
}

export interface NotebookEntry {
  turn: number;
  sceneTitle: string;
  sceneSnippet: string;
  pickedLabel: string;
  feedback: string;
  kind: ChoiceKind;
  others: string[];
}

export interface ModifierDef {
  name: string;
  neutral?: boolean;
  lawMult?: number;
}

export interface ModifierGroup {
  id: string;
  label: string;
  q: string;
  opts: { val: string; t: string; d: string }[];
}

export interface EducationReason {
  kind: ChoiceKind;
  text: string;
}

export interface EducationLesson {
  t: string;
  d: string;
}

export interface EducationPack {
  lessons: EducationLesson[];
  analyze: (state: GameState) => EducationReason[];
}
