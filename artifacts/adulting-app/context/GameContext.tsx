import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useNav } from "@/context/NavigationContext";

import { CharacterOption, CHARACTERS } from "@/data/characters";
import { SceneChoice, Scenario, SCENARIOS } from "@/data/scenarios";

export type GamePhase = "playing" | "consequence";
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
  pendingScenarioId: string | null;
  selectedCharacter: CharacterOption | null;
  stats: { money: number; stress: number; knowledge: number; score: number };
  flags: Set<string>;
  lastDeltas: { money?: number; stress?: number; knowledge?: number; score?: number } | null;
  pendingFeedback: PendingFeedback | null;
  bestScores: Record<string, ScoreData>;
  turn: number;
  chooseScenario: (scenarioId: string) => void;
  confirmCharacter: (characterId: string) => void;
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

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { navigate, replace, setActiveTab } = useNav();
  const [gamePhase, setGamePhase] = useState<GamePhase>("playing");
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string>("");
  const [pendingScenarioId, setPendingScenarioId] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterOption | null>(null);

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
  const [bestScores, setBestScores] = useState<Record<string, ScoreData>>({});

  // Refs so callbacks always have fresh values
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
  const pendingScenarioIdRef = useRef(pendingScenarioId);

  useEffect(() => { moneyRef.current = money; }, [money]);
  useEffect(() => { stressRef.current = stress; }, [stress]);
  useEffect(() => { knowledgeRef.current = knowledge; }, [knowledge]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { flagsRef.current = flags; }, [flags]);
  useEffect(() => { turnRef.current = turn; }, [turn]);
  useEffect(() => { pendingEventsRef.current = pendingEvents; }, [pendingEvents]);
  useEffect(() => { resumeStackRef.current = resumeStack; }, [resumeStack]);
  useEffect(() => { currentScenarioRef.current = currentScenario; }, [currentScenario]);
  useEffect(() => { currentSceneIdRef.current = currentSceneId; }, [currentSceneId]);
  useEffect(() => { pendingScenarioIdRef.current = pendingScenarioId; }, [pendingScenarioId]);

  useEffect(() => {
    AsyncStorage.getItem("adulting-best-scores").then((saved) => {
      if (saved) {
        try { setBestScores(JSON.parse(saved)); } catch {}
      }
    });
  }, []);

  const stats = useMemo(
    () => ({ money, stress, knowledge, score }),
    [money, stress, knowledge, score]
  );

  const calculateRating = useCallback(
    (finalFlags: Set<string>, finalScore: number): OutcomeRating => {
      if (
        finalFlags.has("felony_record") ||
        finalFlags.has("fugitive") ||
        finalFlags.has("eviction_record") ||
        finalFlags.has("sued")
      ) {
        return "Hard Lessons";
      }
      if (finalScore >= 55) return "You Made It";
      if (finalScore >= 30) return "Getting By";
      return "Hard Lessons";
    },
    []
  );

  const chooseScenario = useCallback((scenarioId: string) => {
    setPendingScenarioId(scenarioId);
    navigate({ name: "sim-character-select" });
  }, [navigate]);

  const confirmCharacter = useCallback((characterId: string) => {
    const scenarioId = pendingScenarioIdRef.current;
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;
    const char = CHARACTERS.find((c) => c.id === characterId);
    if (!char) return;

    const startMoney = Math.floor(scenario.startMoney * char.moneyMult);
    const startStress = Math.max(0, Math.min(100, char.stressBonus));
    const startKnowledge = Math.max(0, char.knowledgeBonus);

    setCurrentScenario(scenario);
    setCurrentSceneId(scenario.startSceneId);
    setMoney(startMoney);
    setStress(startStress);
    setKnowledge(startKnowledge);
    setScore(0);
    setTurn(0);
    setFlags(new Set());
    setPendingEvents([]);
    setResumeStack([]);
    setPendingFeedback(null);
    setLastDeltas(null);
    setSelectedCharacter(char);
    setGamePhase("playing");

    navigate({ name: "sim-game" });
  }, [navigate]);

  const makeChoice = useCallback((choice: SceneChoice, sceneTitle: string) => {
    const currentFlags = new Set(flagsRef.current);
    const currentTurn = turnRef.current;
    const currentPendingEvents = [...pendingEventsRef.current];
    const currentResumeStack = [...resumeStackRef.current];
    const currentStress = stressRef.current;
    const currentScore = scoreRef.current;

    const newMoney = Math.max(0, moneyRef.current + (choice.deltaMoney || 0));
    const newStress = Math.max(0, Math.min(100, currentStress + (choice.deltaStress || 0)));
    const newKnowledge = Math.max(0, knowledgeRef.current + (choice.deltaKnowledge || 0));
    const newScore = currentScore + (choice.deltaScore || 0);

    setMoney(newMoney);
    setStress(newStress);
    setKnowledge(newKnowledge);
    setScore(newScore);
    setLastDeltas({
      money: choice.deltaMoney,
      stress: choice.deltaStress,
      knowledge: choice.deltaKnowledge,
      score: choice.deltaScore,
    });

    if (choice.addFlags) choice.addFlags.forEach((f) => currentFlags.add(f));
    if (choice.removeFlags) choice.removeFlags.forEach((f) => currentFlags.delete(f));
    setFlags(new Set(currentFlags));

    const newPendingEvents = [...currentPendingEvents];
    if (choice.scheduleEvent) {
      newPendingEvents.push({
        triggerTurn: currentTurn + choice.scheduleEvent.turnsFromNow,
        sceneId: choice.scheduleEvent.sceneId,
      });
    }

    const nextTurn = currentTurn + 1;
    setTurn(nextTurn);
    setPendingFeedback({
      kind: choice.kind,
      text: choice.feedback,
      choiceLabel: choice.label,
      sceneTitle,
    });
    setGamePhase("consequence");

    let nextSceneId = choice.nextId;
    if (choice.dynamicNext) {
      nextSceneId = choice.dynamicNext(currentFlags, newScore);
    }

    const eventToFire = newPendingEvents.find((e) => e.triggerTurn <= nextTurn);
    const newResumeStack = [...currentResumeStack];

    if (eventToFire) {
      const remaining = newPendingEvents.filter((e) => e !== eventToFire);
      if (nextSceneId) newResumeStack.push(nextSceneId);
      nextSceneId = eventToFire.sceneId;
      setPendingEvents(remaining);
    } else {
      setPendingEvents(newPendingEvents);
      if (!nextSceneId) {
        if (newResumeStack.length > 0) {
          nextSceneId = newResumeStack.pop()!;
        } else {
          nextSceneId = "finale";
        }
      }
    }

    if (newStress >= 100) {
      nextSceneId = "stress_ending";
    }

    setResumeStack(newResumeStack);
    setCurrentSceneId(nextSceneId || "finale");
  }, []);

  const continueGame = useCallback(() => {
    setPendingFeedback(null);
    const scenario = currentScenarioRef.current;
    const sceneId = currentSceneIdRef.current;
    if (!scenario) return;
    const scene = scenario.scenes[sceneId];
    if (scene?.isEnding) {
      // Save best score before navigating
      const finalScore = scoreRef.current;
      const finalFlags = flagsRef.current;
      const rating = calculateRating(finalFlags, finalScore);
      setBestScores((prev) => {
        const currentBest = prev[scenario.id];
        if (!currentBest || finalScore > currentBest.finalStats.score) {
          const updated = {
            ...prev,
            [scenario.id]: {
              rating,
              finalStats: {
                money: moneyRef.current,
                stress: stressRef.current,
                knowledge: knowledgeRef.current,
                score: finalScore,
              },
            },
          };
          AsyncStorage.setItem("adulting-best-scores", JSON.stringify(updated)).catch(() => {});
          return updated;
        }
        return prev;
      });
      navigate({ name: "sim-outcome" });
    } else {
      setGamePhase("playing");
    }
  }, [calculateRating]);

  const returnToMenu = useCallback(() => {
    setCurrentScenario(null);
    setCurrentSceneId("");
    setPendingFeedback(null);
    setLastDeltas(null);
    replace({ name: "tabs" });
    setActiveTab("simulate");
  }, [replace, setActiveTab]);

  const replayScenario = useCallback(() => {
    const scenarioId = pendingScenarioIdRef.current ?? currentScenarioRef.current?.id;
    if (scenarioId) {
      setPendingScenarioId(scenarioId);
      replace({ name: "sim-character-select" });
    }
  }, [replace]);

  return (
    <GameContext.Provider
      value={{
        gamePhase,
        currentScenario,
        currentSceneId,
        pendingScenarioId,
        selectedCharacter,
        stats,
        flags,
        lastDeltas,
        pendingFeedback,
        bestScores,
        turn,
        chooseScenario,
        confirmCharacter,
        makeChoice,
        continueGame,
        returnToMenu,
        replayScenario,
        calculateRating,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
