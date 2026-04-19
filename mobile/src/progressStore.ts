import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState } from "./types";

// Quiz scores: { [trackId]: { [quizId]: 0-100 } }
// Campaign scores: { [scenarioId]: { best: 0-100, plays: n, lastScore: n } }

export interface QuizScores { [trackId: string]: { [quizId: string]: number } }
export interface CampaignScores { [scenarioId: string]: { best: number; plays: number; lastScore: number } }

const QUIZ_KEY = "nextsteps_quiz_v1";
const CAMPAIGN_KEY = "nextsteps_campaign_v1";

export async function loadQuizScores(): Promise<QuizScores> {
  try {
    const raw = await AsyncStorage.getItem(QUIZ_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
export async function saveQuizScore(trackId: string, quizId: string, score: number) {
  const scores = await loadQuizScores();
  if (!scores[trackId]) scores[trackId] = {};
  const prev = scores[trackId][quizId] ?? 0;
  scores[trackId][quizId] = Math.max(prev, Math.round(score));
  try { await AsyncStorage.setItem(QUIZ_KEY, JSON.stringify(scores)); } catch {}
  return scores;
}
export async function loadCampaignScores(): Promise<CampaignScores> {
  try {
    const raw = await AsyncStorage.getItem(CAMPAIGN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
export async function saveCampaignScore(scenarioId: string, score: number): Promise<CampaignScores> {
  const all = await loadCampaignScores();
  const prev = all[scenarioId] || { best: 0, plays: 0, lastScore: 0 };
  all[scenarioId] = {
    best: Math.max(prev.best, Math.round(score)),
    plays: prev.plays + 1,
    lastScore: Math.round(score),
  };
  try { await AsyncStorage.setItem(CAMPAIGN_KEY, JSON.stringify(all)); } catch {}
  return all;
}

// Compute a campaign run's score out of 100 from final state + ending kind.
// Good endings cap high; bad endings cap low. Stats move within the band.
export function computeCampaignScore(state: GameState, endingKind: "good" | "bad" | "mid"): number {
  const base = endingKind === "good" ? 80 : endingKind === "mid" ? 55 : 25;
  const wellbeingBonus = Math.round((state.wellbeing - 50) * 0.15); // -7 to +7
  const lawPenalty = Math.round(state.law * 0.2);                   // 0 to -20
  const healthBonus = Math.round((state.health - 50) * 0.1);        // -5 to +5
  const raw = base + wellbeingBonus + healthBonus - lawPenalty;
  return Math.max(0, Math.min(100, raw));
}

// Overall completion % — counts built-in lessons + built-in campaigns ONLY.
// Custom levels don't inflate (or dilute) a player's official completion number.
export function computeOverallPercent(
  quiz: QuizScores,
  campaigns: CampaignScores,
  totalQuizCount: number,
  builtInScenarioIds: string[]
): number {
  const items: number[] = [];
  Object.values(quiz).forEach(track => Object.values(track).forEach(s => items.push(s)));
  const missingQuizzes = Math.max(0, totalQuizCount - items.length);
  for (let i = 0; i < missingQuizzes; i++) items.push(0);

  builtInScenarioIds.forEach(id => items.push(campaigns[id]?.best ?? 0));

  if (items.length === 0) return 0;
  const sum = items.reduce((a, b) => a + b, 0);
  return Math.round(sum / items.length);
}

export async function resetAllProgress() {
  try {
    await AsyncStorage.removeItem(QUIZ_KEY);
    await AsyncStorage.removeItem(CAMPAIGN_KEY);
  } catch {}
}
