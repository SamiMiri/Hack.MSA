import { useProgress } from "./useProgress";
import { MOCK_LEADERBOARD, LeaderboardEntry } from "@/data/leaderboard";
import { useMemo } from "react";

export function useLeaderboard() {
  const { xp } = useProgress();

  const leaderboard = useMemo(() => {
    const you: LeaderboardEntry = {
      id: "you",
      name: "You",
      xp: xp
    };

    const combined = [...MOCK_LEADERBOARD, you];
    combined.sort((a, b) => b.xp - a.xp);
    return combined;
  }, [xp]);

  return {
    leaderboard
  };
}