import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { SceneChoice, Scenario, SCENARIOS } from "@/data/scenarios";

export type GamePhase = "idle" | "character" | "playing" | "consequence" | "ended";
export type OutcomeRating = "You Made It" | "Getting By" | "Hard Lessons";

export interface ScoreData {
  rating: OutcomeRating;
  finalStats: { money: number; stress: number; knowledge: number; score: number };
}

export interface PendingFeedback {
  kind: "good" | "bad" | "meh";
  text: string;
  choiceLabel: string;
  sceneTitle: string;
}

interface GameContextType {
  gamePhase: GamePhase;
  currentScenario: Scenario | null;
  currentSceneId: string;
  stats: { money: number; stress: number; knowledge: number; score: number };
  flags: Set<string>;
  lastDeltas: { money?: number; stress?: number; knowledge?: number; score?: number } | null;
  pendingFeedback: PendingFeedback | null;
  bestScores: Record<string, ScoreData>;
  turn: number;
  chooseScenario: (scenarioId: string) => void;
  makeChoice: (choice: SceneChoice, sceneTitle: string) => void;
  continueGame: () => void;
  returnToMenu: () => void;
  replayScenario: () => void;
  calculateRating: (finalFlags: Set<string>, finalScore: number) => OutcomeRating;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

function loadBestScores(): Record<string, ScoreData> {
  try {
    const saved = localStorage.getItem("adulting-best-scores");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gamePhase, setGamePhase] = useState<GamePhase>("idle");
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string>("");
  const [money, setMoney] = useState(0);
  const [stress, setStress] = useState(0);
  const [knowledge, setKnowledge] = useState(0);
  const [score, setScore] = useState(0);
  const [turn, setTurn] = useState(0);
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [pendingEvents, setPendingEvents] = useState<Array<{ triggerTurn: number; sceneId: string }>>([]);
  const [resumeStack, setResumeStack] = useState<string[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<PendingFeedback | null>(null);
  const [lastDeltas, setLastDeltas] = useState<{ money?: number; stress?: number; knowledge?: number; score?: number } | null>(null);
  const [bestScores, setBestScores] = useState<Record<string, ScoreData>>(loadBestScores);

  const moneyRef = useRef(money);
  const stressRef = useRef(stress);
  const knowledgeRef = useRef(knowledge);
  const scoreRef = useRef(score);
  const flagsRef = useRef(flags);
  const turnRef = useRef(turn);
  const pendingEventsRef = useRef(pendingEvents);
  const resumeStackRef = useRef(resumeStack);
  const currentScenarioRef = useRef(currentScenario);
  const currentSceneIdRef = useRef(currentSceneId);

  moneyRef.current = money;
  stressRef.current = stress;
  knowledgeRef.current = knowledge;
  scoreRef.current = score;
  flagsRef.current = flags;
  turnRef.current = turn;
  pendingEventsRef.current = pendingEvents;
  resumeStackRef.current = resumeStack;
  currentScenarioRef.current = currentScenario;
  currentSceneIdRef.current = currentSceneId;

  const calculateRating = useCallback((_flags: Set<string>, finalScore: number): OutcomeRating => {
    if (finalScore >= 60) return "You Made It";
    if (finalScore >= 30) return "Getting By";
    return "Hard Lessons";
  }, []);

  const startScenario = useCallback((scenario: Scenario) => {
    setCurrentScenario(scenario);
    setCurrentSceneId(scenario.startSceneId);
    setMoney(scenario.startMoney);
    setStress(0);
    setKnowledge(0);
    setScore(0);
    setTurn(0);
    setFlags(new Set());
    setPendingEvents([]);
    setResumeStack([]);
    setPendingFeedback(null);
    setLastDeltas(null);
    setGamePhase("playing");
  }, []);

  const chooseScenario = useCallback((scenarioId: string) => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (scenario) startScenario(scenario);
  }, [startScenario]);

  const makeChoice = useCallback((choice: SceneChoice, sceneTitle: string) => {
    const newMoney = Math.max(0, moneyRef.current + (choice.deltaMoney ?? 0));
    const newStress = Math.max(0, Math.min(100, stressRef.current + (choice.deltaStress ?? 0)));
    const newKnowledge = Math.max(0, knowledgeRef.current + (choice.deltaKnowledge ?? 0));
    const newScore = Math.max(0, scoreRef.current + (choice.deltaScore ?? 0));
    const newTurn = turnRef.current + 1;

    const newFlags = new Set(flagsRef.current);
    (choice.addFlags ?? []).forEach((f) => newFlags.add(f));
    (choice.removeFlags ?? []).forEach((f) => newFlags.delete(f));

    const newPendingEvents = [...pendingEventsRef.current];
    if (choice.scheduleEvent) {
      newPendingEvents.push({
        triggerTurn: newTurn + choice.scheduleEvent.turnsFromNow,
        sceneId: choice.scheduleEvent.sceneId,
      });
    }

    const deltas: { money?: number; stress?: number; knowledge?: number; score?: number } = {};
    if (choice.deltaMoney) deltas.money = choice.deltaMoney;
    if (choice.deltaStress) deltas.stress = choice.deltaStress;
    if (choice.deltaKnowledge) deltas.knowledge = choice.deltaKnowledge;
    if (choice.deltaScore) deltas.score = choice.deltaScore;

    setMoney(newMoney);
    setStress(newStress);
    setKnowledge(newKnowledge);
    setScore(newScore);
    setTurn(newTurn);
    setFlags(newFlags);
    setPendingEvents(newPendingEvents);
    setLastDeltas(deltas);

    setPendingFeedback({
      kind: choice.kind,
      text: choice.feedback,
      choiceLabel: choice.label,
      sceneTitle,
    });
    setGamePhase("consequence");

    const scenario = currentScenarioRef.current;
    if (choice.nextId && scenario) {
      const nextScene = scenario.scenes[choice.nextId];
      if (nextScene?.isEnding) {
        const rating = calculateRating(newFlags, newScore);
        const scoreData: ScoreData = {
          rating,
          finalStats: { money: newMoney, stress: newStress, knowledge: newKnowledge, score: newScore },
        };
        const newBest = { ...bestScores };
        const existing = newBest[scenario.id];
        if (!existing || newScore > existing.finalStats.score) {
          newBest[scenario.id] = scoreData;
          setBestScores(newBest);
          localStorage.setItem("adulting-best-scores", JSON.stringify(newBest));
        }
      }
    }
  }, [bestScores, calculateRating]);

  const continueGame = useCallback(() => {
    const scenario = currentScenarioRef.current;
    if (!scenario) return;

    const currentChoice = pendingFeedback;
    setPendingFeedback(null);

    const currentScene = scenario.scenes[currentSceneIdRef.current];
    const choiceObj = currentScene?.choices.find((c) => c.label === currentChoice?.choiceLabel);

    let nextSceneId: string | null = null;
    if (choiceObj) {
      if (choiceObj.dynamicNext) {
        nextSceneId = choiceObj.dynamicNext(flagsRef.current, scoreRef.current);
      } else {
        nextSceneId = choiceObj.nextId;
      }
    }

    const triggered = pendingEventsRef.current.find((e) => e.triggerTurn <= turnRef.current);
    if (triggered) {
      setPendingEvents((prev) => prev.filter((e) => e !== triggered));
      if (nextSceneId) {
        setResumeStack((prev) => [...prev, nextSceneId!]);
      }
      nextSceneId = triggered.sceneId;
    } else {
      const resumed = resumeStackRef.current[resumeStackRef.current.length - 1];
      if (resumed && !nextSceneId) {
        setResumeStack((prev) => prev.slice(0, -1));
        nextSceneId = resumed;
      }
    }

    if (!nextSceneId) {
      setGamePhase("ended");
      return;
    }

    const nextScene = scenario.scenes[nextSceneId];
    if (!nextScene) {
      setGamePhase("ended");
      return;
    }

    setCurrentSceneId(nextSceneId);

    if (nextScene.isEnding) {
      setGamePhase("ended");
    } else {
      setGamePhase("playing");
    }
  }, [pendingFeedback]);

  const returnToMenu = useCallback(() => {
    setGamePhase("idle");
    setCurrentScenario(null);
    setCurrentSceneId("");
    setPendingFeedback(null);
    setLastDeltas(null);
  }, []);

  const replayScenario = useCallback(() => {
    const scenario = currentScenarioRef.current;
    if (scenario) startScenario(scenario);
  }, [startScenario]);

  return (
    <GameContext.Provider value={{
      gamePhase, currentScenario, currentSceneId,
      stats: { money, stress, knowledge, score },
      flags, lastDeltas, pendingFeedback, bestScores, turn,
      chooseScenario, makeChoice, continueGame, returnToMenu, replayScenario, calculateRating,
    }}>
      {children}
    </GameContext.Provider>
  );
}
