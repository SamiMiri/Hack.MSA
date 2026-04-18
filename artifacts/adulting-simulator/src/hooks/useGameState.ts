import { useState, useCallback, useEffect } from 'react';
import { Scenario, SCENARIOS, Choice } from '../data/scenarios';

export type GameState = 'menu' | 'playing' | 'consequence' | 'outcome';
export type OutcomeRating = 'Thriving' | 'Surviving' | 'Struggling';

export interface ScoreData {
  rating: OutcomeRating;
  finalStats: { money: number; stress: number; credit: number; happiness: number };
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [decisionIndex, setDecisionIndex] = useState(0);
  
  const [stats, setStats] = useState({
    money: 0,
    stress: 0,
    credit: 0,
    happiness: 0
  });

  const [lastDeltas, setLastDeltas] = useState<{money?: number, stress?: number, credit?: number, happiness?: number} | null>(null);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  
  const [history, setHistory] = useState<Choice[]>([]);
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

  const startGame = useCallback((scenarioId: string) => {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;
    
    setCurrentScenario(scenario);
    setStats({ ...scenario.startingStats });
    setDecisionIndex(0);
    setHistory([]);
    setLastDeltas(null);
    setLastChoice(null);
    setGameState('playing');
  }, []);

  const makeChoice = useCallback((choice: Choice) => {
    setLastChoice(choice);
    setLastDeltas(choice.deltas);
    setHistory(prev => [...prev, choice]);
    
    setStats(prev => ({
      money: Math.max(0, prev.money + (choice.deltas.money || 0)),
      stress: Math.max(0, Math.min(100, prev.stress + (choice.deltas.stress || 0))),
      credit: Math.max(0, Math.min(850, prev.credit + (choice.deltas.credit || 0))),
      happiness: Math.max(0, Math.min(100, prev.happiness + (choice.deltas.happiness || 0)))
    }));

    setGameState('consequence');
  }, []);

  const continueGame = useCallback(() => {
    if (!currentScenario) return;
    
    if (decisionIndex + 1 < currentScenario.decisions.length) {
      setDecisionIndex(prev => prev + 1);
      setGameState('playing');
    } else {
      // Calculate outcome
      const rating = calculateRating(stats);
      setGameState('outcome');
      
      const newScores = { ...bestScores };
      const currentBest = newScores[currentScenario.id];
      
      const scoreValue = (stats.money / 100) - stats.stress + stats.credit + stats.happiness;
      const currentBestValue = currentBest ? (currentBest.finalStats.money / 100) - currentBest.finalStats.stress + currentBest.finalStats.credit + currentBest.finalStats.happiness : -9999;
      
      if (scoreValue > currentBestValue) {
        const newData = { rating, finalStats: { ...stats } };
        newScores[currentScenario.id] = newData;
        setBestScores(newScores);
        localStorage.setItem('adulting-best-scores', JSON.stringify(newScores));
      }
    }
  }, [currentScenario, decisionIndex, stats, bestScores]);

  const calculateRating = (finalStats: typeof stats): OutcomeRating => {
    let score = 0;
    if (finalStats.money > 1000) score++;
    if (finalStats.stress < 50) score++;
    if (finalStats.credit > 600) score++;
    if (finalStats.happiness > 50) score++;

    if (score >= 3) return 'Thriving';
    if (score === 2) return 'Surviving';
    return 'Struggling';
  };

  const returnToMenu = useCallback(() => {
    setGameState('menu');
    setCurrentScenario(null);
  }, []);

  return {
    gameState,
    currentScenario,
    decisionIndex,
    stats,
    history,
    bestScores,
    lastDeltas,
    lastChoice,
    startGame,
    makeChoice,
    continueGame,
    returnToMenu,
    calculateRating
  };
}