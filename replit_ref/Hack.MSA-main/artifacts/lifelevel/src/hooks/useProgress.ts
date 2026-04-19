import { useState, useEffect } from "react";
import { LESSONS } from "@/data/lessons";

export type StreakData = {
  count: number;
  lastDate: string | null;
};

export function useProgress() {
  const [tutorialDone, setTutorialDone] = useState<boolean>(() => {
    return localStorage.getItem("lifelevel_tutorialdone") === "true";
  });

  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("lifelevel_completedlessons") || "[]");
    } catch {
      return [];
    }
  });

  const [xp, setXp] = useState<number>(() => {
    return parseInt(localStorage.getItem("lifelevel_xp") || "0", 10);
  });

  const [streak, setStreak] = useState<StreakData>(() => {
    try {
      return JSON.parse(localStorage.getItem("lifelevel_streak") || '{"count":0,"lastDate":null}');
    } catch {
      return { count: 0, lastDate: null };
    }
  });

  // Check and update streak logic
  useEffect(() => {
    const today = new Date().toDateString();
    if (streak.lastDate && streak.lastDate !== today) {
      const lastDate = new Date(streak.lastDate);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // If it's been more than 1 day since last activity, reset streak
      if (diffDays > 1) {
        const newStreak = { count: 0, lastDate: streak.lastDate };
        setStreak(newStreak);
        localStorage.setItem("lifelevel_streak", JSON.stringify(newStreak));
      }
    }
  }, [streak]);

  const completeTutorial = () => {
    setTutorialDone(true);
    localStorage.setItem("lifelevel_tutorialdone", "true");
  };

  const addXp = (amount: number) => {
    const newXp = xp + amount;
    setXp(newXp);
    localStorage.setItem("lifelevel_xp", newXp.toString());
  };

  const completeLesson = (lessonId: string, earnedXp: number) => {
    if (!completedLessons.includes(lessonId)) {
      const newCompleted = [...completedLessons, lessonId];
      setCompletedLessons(newCompleted);
      localStorage.setItem("lifelevel_completedlessons", JSON.stringify(newCompleted));
      addXp(earnedXp);

      // Update streak
      const today = new Date().toDateString();
      let newStreakCount = streak.count;
      
      if (streak.lastDate !== today) {
        if (streak.lastDate) {
          const lastDate = new Date(streak.lastDate);
          const currentDate = new Date();
          const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            newStreakCount += 1; // Continuing streak
          } else {
            newStreakCount = 1; // Resuming after broken streak
          }
        } else {
          newStreakCount = 1; // First ever streak
        }
      }
      
      const newStreak = { count: newStreakCount, lastDate: today };
      setStreak(newStreak);
      localStorage.setItem("lifelevel_streak", JSON.stringify(newStreak));
    }
  };

  const getLessonProgress = (lessonId: string) => {
    return parseInt(localStorage.getItem(`lifelevel_lessonprogress_${lessonId}`) || "0", 10);
  };

  const saveLessonProgress = (lessonId: string, decisionIndex: number) => {
    localStorage.setItem(`lifelevel_lessonprogress_${lessonId}`, decisionIndex.toString());
  };

  const getNextLessonId = () => {
    const nextLesson = LESSONS.find(l => !completedLessons.includes(l.id));
    return nextLesson ? nextLesson.id : null;
  };

  return {
    tutorialDone,
    completeTutorial,
    completedLessons,
    xp,
    streak,
    completeLesson,
    getLessonProgress,
    saveLessonProgress,
    getNextLessonId,
    addXp
  };
}