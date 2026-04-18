import { useState, useCallback, useEffect } from 'react';
import { Scenario, SCENARIOS, SceneChoice } from '../data/scenarios';
import { CharacterOption, CHARACTERS } from '../data/characters';

export type GameState = 'menu' | 'character-select' | 'playing' | 'consequence' | 'outcome';
export type OutcomeRating = 'You Made It' | 'Getting By' | 'Hard Lessons';

export interface ScoreData {
  rating: OutcomeRating;
  finalStats: { money: number; stress: number; knowledge: number; score: number };
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');
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
  const [pendingFeedback, setPendingFeedback] = useState<{ kind: 'good' | 'bad' | 'meh'; text: string; choiceLabel: string; sceneTitle: string } | null>(null);

  const [lastDeltas, setLastDeltas] = useState<{ money?: number; stress?: number; knowledge?: number; score?: number } | null>(null);
  const [bestScores, setBestScores] = useState<Record<string, ScoreData>>({});

  useEffect(() => {
    const saved = localStorage.getItem('adulting-best-scores');
    if (saved) {
      try {
        setBestScores(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse best scores');
      }
    }
  }, []);

  const chooseScenario = useCallback((scenarioId: string) => {
    setPendingScenarioId(scenarioId);
    setGameState('character-select');
  }, []);

  const confirmCharacter = useCallback((characterId: string) => {
    const scenario = SCENARIOS.find((s) => s.id === pendingScenarioId);
    if (!scenario) return;
    const char = CHARACTERS.find((c) => c.id === characterId);
    if (!char) return;

    setCurrentScenario(scenario);
    setCurrentSceneId(scenario.startSceneId);
    setMoney(Math.floor(scenario.startMoney * char.moneyMult));
    setStress(Math.max(0, Math.min(100, char.stressBonus)));
    setKnowledge(Math.max(0, char.knowledgeBonus));
    setScore(0);
    setTurn(0);
    setFlags(new Set());
    setPendingEvents([]);
    setResumeStack([]);
    setPendingFeedback(null);
    setLastDeltas(null);
    setSelectedCharacter(char);

    setGameState('playing');
  }, [pendingScenarioId]);

  const replayScenario = useCallback(() => {
    if (currentScenario) {
      setPendingScenarioId(currentScenario.id);
      setGameState('character-select');
    }
  }, [currentScenario]);

  const calculateRating = useCallback((finalFlags: Set<string>, finalScore: number): OutcomeRating => {
    if (
      finalFlags.has('felony_record') ||
      finalFlags.has('fugitive') ||
      finalFlags.has('eviction_record') ||
      finalFlags.has('sued')
    ) {
      return 'Hard Lessons';
    } else if (finalScore >= 55) {
      return 'You Made It';
    } else if (finalScore >= 30) {
      return 'Getting By';
    } else {
      return 'Hard Lessons';
    }
  }, []);

  const makeChoice = useCallback((choice: SceneChoice, sceneTitle: string) => {
    // 1. Apply deltas
    setMoney((prev) => Math.max(0, prev + (choice.deltaMoney || 0)));
    setStress((prev) => Math.max(0, Math.min(100, prev + (choice.deltaStress || 0))));
    setKnowledge((prev) => Math.max(0, prev + (choice.deltaKnowledge || 0)));
    setScore((prev) => prev + (choice.deltaScore || 0));

    setLastDeltas({
      money: choice.deltaMoney,
      stress: choice.deltaStress,
      knowledge: choice.deltaKnowledge,
      score: choice.deltaScore,
    });

    // 2. Add/remove flags
    const newFlags = new Set(flags);
    if (choice.addFlags) choice.addFlags.forEach((f) => newFlags.add(f));
    if (choice.removeFlags) choice.removeFlags.forEach((f) => newFlags.delete(f));
    setFlags(newFlags);

    // 3. Schedule events
    const newPendingEvents = [...pendingEvents];
    if (choice.scheduleEvent) {
      newPendingEvents.push({
        triggerTurn: turn + choice.scheduleEvent.turnsFromNow,
        sceneId: choice.scheduleEvent.sceneId,
      });
    }

    // 4. Set feedback
    setPendingFeedback({
      kind: choice.kind,
      text: choice.feedback,
      choiceLabel: choice.label,
      sceneTitle,
    });

    // Save choice logic for the continue step
    const nextTurn = turn + 1;
    setTurn(nextTurn);
    setPendingEvents(newPendingEvents);

    setGameState('consequence');

    // Evaluate dynamic next
    let actualNextId = choice.nextId;
    if (choice.dynamicNext) {
      actualNextId = choice.dynamicNext(newFlags, score + (choice.deltaScore || 0));
    }

    // Check pending events
    const eventToFire = newPendingEvents.find((e) => e.triggerTurn <= nextTurn);
    let nextSceneId = actualNextId;
    const newResumeStack = [...resumeStack];

    if (eventToFire) {
      setPendingEvents(newPendingEvents.filter((e) => e !== eventToFire));
      if (actualNextId) {
        newResumeStack.push(actualNextId);
      }
      nextSceneId = eventToFire.sceneId;
    } else if (!actualNextId) {
      if (newResumeStack.length > 0) {
        nextSceneId = newResumeStack.pop()!;
      } else {
        nextSceneId = 'finale';
      }
    }

    // Check stress cap
    if (stress + (choice.deltaStress || 0) >= 100) {
      nextSceneId = 'stress_ending';
    }

    setResumeStack(newResumeStack);
    setCurrentSceneId(nextSceneId || 'finale');
  }, [flags, turn, pendingEvents, resumeStack, score, stress]);

  const continueGame = useCallback(() => {
    setPendingFeedback(null);
    const scene = currentScenario?.scenes[currentSceneId];
    if (scene && scene.isEnding) {
      setGameState('outcome');

      const rating = calculateRating(flags, score);
      const newScores = { ...bestScores };
      const currentBest = newScores[currentScenario!.id];
      const scoreValue = score;
      const currentBestValue = currentBest ? currentBest.finalStats.score : -9999;

      if (scoreValue > currentBestValue) {
        const newData = { rating, finalStats: { money, stress, knowledge, score } };
        newScores[currentScenario!.id] = newData;
        setBestScores(newScores);
        localStorage.setItem('adulting-best-scores', JSON.stringify(newScores));
      }
    } else {
      setGameState('playing');
    }
  }, [currentScenario, currentSceneId, flags, score, bestScores, calculateRating, money, stress, knowledge]);

  const returnToMenu = useCallback(() => {
    setGameState('menu');
    setCurrentScenario(null);
  }, []);

  return {
    gameState,
    currentScenario,
    currentSceneId,
    pendingScenarioId,
    selectedCharacter,
    stats: { money, stress, knowledge, score },
    flags,
    bestScores,
    lastDeltas,
    pendingFeedback,
    chooseScenario,
    confirmCharacter,
    replayScenario,
    makeChoice,
    continueGame,
    returnToMenu,
    calculateRating,
  };
}
