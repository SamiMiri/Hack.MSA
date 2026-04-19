import { Choice, Effects, GameState, Scenario } from "./types";
import { applyPassiveDrains, applyStartingModifiers, lawTick } from "./modifiers";

export function freshState(scenarioId: string, startMoney: number, charName: string): GameState {
  return {
    scenarioId,
    charName,
    modifiers: new Set(),
    health: 80,
    wellbeing: 70,
    money: startMoney,
    law: 0,
    flags: new Set(),
    pending: [],
    turn: 0,
    notebook: [],
    currentSceneId: "",
    resumeStack: [],
    gameOver: false,
  };
}

export function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

export function applyEffects(s: GameState, e: Effects | undefined) {
  if (!e) return;
  if (e.money) s.money += e.money;
  if (e.health) s.health = clamp(s.health + e.health, 0, 100);
  if (e.wellbeing) s.wellbeing = clamp(s.wellbeing + e.wellbeing, 0, 100);
  if (e.law !== undefined) {
    const v = e.law > 0 ? lawTick(s, e.law) : e.law;
    s.law = clamp(s.law + v, 0, 100);
  }
  if (e.addFlags) e.addFlags.forEach(f => s.flags.add(f));
  if (e.rmFlags) e.rmFlags.forEach(f => s.flags.delete(f));
  if (e.schedule) e.schedule.forEach(([t, id]) => s.pending.push({ turn: s.turn + t, sceneId: id }));
  applyPassiveDrains(s);
  if (s.health <= 0) { s.gameOver = true; s.forcedEndId = "ending_hospital"; }
  if (s.wellbeing <= 0) { s.gameOver = true; s.forcedEndId = "ending_breakdown"; }
}

export function initScenario(scenario: Scenario, modifiers: string[]): GameState {
  const s = freshState(scenario.id, scenario.startMoney, scenario.defaultName);
  modifiers.forEach(m => s.modifiers.add(m));
  applyStartingModifiers(s);
  s.currentSceneId = scenario.startSceneId;
  return s;
}

export function shufflePickOrder<T>(arr: T[]): number[] {
  const idx = arr.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

export interface PickResult {
  delta: { money: number; health: number; wellbeing: number; law: number };
  nextSceneId: string;
}

export function pickChoice(s: GameState, choice: Choice, scenario: Scenario): PickResult {
  const before = { money: s.money, health: s.health, wellbeing: s.wellbeing, law: s.law };
  applyEffects(s, choice.effects);
  s.turn += 1;

  let nextId = choice.next ? choice.next(s) : (choice.nextId ?? null);

  // Check for scheduled event interrupt
  const dueIdx = s.pending.findIndex(p => p.turn <= s.turn);
  if (dueIdx >= 0 && nextId !== null && scenario.scenes[s.pending[dueIdx].sceneId]) {
    const due = s.pending[dueIdx];
    s.pending.splice(dueIdx, 1);
    if (nextId) s.resumeStack.push(nextId);
    nextId = due.sceneId;
  }

  if (nextId === null) {
    nextId = s.resumeStack.pop() ?? "finale";
  }

  s.currentSceneId = nextId;
  return {
    delta: {
      money: s.money - before.money,
      health: s.health - before.health,
      wellbeing: s.wellbeing - before.wellbeing,
      law: s.law - before.law,
    },
    nextSceneId: nextId,
  };
}
