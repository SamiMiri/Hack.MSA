import { loadCampaignScores, loadQuizScores } from "./progressStore";
import { loadLevels } from "./levelStore";

export interface PointsBreakdown {
  total: number;
  campaignPoints: number;
  lessonPoints: number;
  customPoints: number;
  campaignsCounted: number;
  lessonsCounted: number;
  customsCounted: number;
}

// Total points used for leaderboards (INCLUDES custom-level scores).
export async function computeTotalPoints(): Promise<PointsBreakdown> {
  const quiz = await loadQuizScores();
  const camp = await loadCampaignScores();
  const levels = await loadLevels();
  const customIds = new Set(levels.map(l => l.id));

  let lessonPoints = 0, lessonsCounted = 0;
  Object.values(quiz).forEach(track =>
    Object.values(track).forEach(s => { lessonPoints += s; lessonsCounted++; })
  );

  let campaignPoints = 0, campaignsCounted = 0;
  let customPoints = 0, customsCounted = 0;
  Object.entries(camp).forEach(([id, entry]) => {
    if (customIds.has(id)) {
      customPoints += entry.best;
      customsCounted++;
    } else {
      campaignPoints += entry.best;
      campaignsCounted++;
    }
  });

  return {
    total: lessonPoints + campaignPoints + customPoints,
    campaignPoints, lessonPoints, customPoints,
    campaignsCounted, lessonsCounted, customsCounted,
  };
}
