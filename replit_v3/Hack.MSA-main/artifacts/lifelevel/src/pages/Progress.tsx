import { Link } from "wouter";
import { useApp } from "@/context/AppContext";
import { tracks, FREE_LESSONS_COUNT } from "@/data/tracks";
import { ChevronRight, BookOpen } from "lucide-react";

const MILESTONES = [
  { threshold: 1, label: "First Step", emoji: "🚩", color: "#FF6B6B" },
  { threshold: 3, label: "Getting Traction", emoji: "⚡", color: "#FFE66D" },
  { threshold: 4, label: "Halfway There", emoji: "⭐", color: "#4ECDC4" },
  { threshold: 7, label: "Almost Done", emoji: "🏆", color: "#A29BFE" },
  { threshold: FREE_LESSONS_COUNT, label: "Adulting Pro", emoji: "🛡️", color: "#2ED573" },
];

export default function ProgressPage() {
  const { completedLessons, getTrackProgress, coins } = useApp();

  const freeTracks = tracks.filter((t) => !t.premium);
  const totalLessons = FREE_LESSONS_COUNT;
  const completedCount = completedLessons.filter((cl) =>
    freeTracks.some((t) => t.id === cl.trackId)
  ).length;

  const nextMilestone = MILESTONES.find((m) => m.threshold > completedCount);
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Your Progress</h1>
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1.5">
            <span className="text-sm">⭐</span>
            <span className="text-sm font-bold text-amber-600">{coins}</span>
          </div>
        </div>
      </div>

      {/* Overall card */}
      <div className="mx-5 mt-4 rounded-2xl p-5" style={{ backgroundColor: "var(--primary)" }}>
        <div className="text-sm text-white/80 font-medium mb-1">Free Lessons Completed</div>
        <div className="text-5xl font-extrabold text-white">{completedCount}</div>
        <div className="text-sm text-white/75 mb-4">out of {totalLessons} free lessons</div>
        <div className="h-2 bg-white/30 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        {nextMilestone ? (
          <div className="text-xs text-white/85">{nextMilestone.threshold - completedCount} more to unlock "{nextMilestone.label}"</div>
        ) : (
          <div className="text-xs text-white/85">You've completed all free lessons! 🎉</div>
        )}
      </div>

      {/* Coins card */}
      <div className="mx-5 mt-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⭐</span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">Skill Coins</div>
            <div className="text-xs text-muted-foreground mt-0.5">Earn by completing lessons & scenarios · Spend in Learn & Play tabs</div>
          </div>
          <span className="text-2xl font-extrabold text-amber-600">{coins}</span>
        </div>
      </div>

      {/* Milestones */}
      <div className="px-5 mt-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Milestones</h2>
        <div className="grid grid-cols-5 gap-2">
          {MILESTONES.map((m) => {
            const unlocked = completedCount >= m.threshold;
            return (
              <div key={m.label} className="flex flex-col items-center gap-2">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all ${unlocked ? "opacity-100" : "opacity-40 grayscale"}`}
                  style={{ backgroundColor: unlocked ? m.color + "20" : undefined, borderColor: unlocked ? m.color : "var(--border)" }}
                >
                  {m.emoji}
                </div>
                <div className={`text-xs font-semibold text-center leading-tight ${unlocked ? "text-foreground" : "text-muted-foreground"}`} style={{ fontSize: 9 }}>
                  {m.label}
                </div>
                {!unlocked && <div className="text-muted-foreground" style={{ fontSize: 9 }}>{m.threshold} lessons</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Track Progress */}
      <div className="px-5 mt-7">
        <h2 className="text-xl font-bold text-foreground mb-4">Track Progress</h2>
        <div className="space-y-2.5">
          {freeTracks.map((track) => {
            const progress = getTrackProgress(track.id, track.lessonsCount);
            const done = Math.round(progress * track.lessonsCount);
            const pct = Math.round(progress * 100);
            return (
              <Link key={track.id} href={`/track/${track.id}`}>
                <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-card cursor-pointer hover:shadow-sm transition-shadow">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: track.color + "18" }}>
                    <span className="text-lg">📚</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{track.title}</div>
                    <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: track.color }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{done}/{track.lessonsCount} lessons</div>
                  </div>
                  <span className="text-base font-bold flex-shrink-0" style={{ color: track.color }}>{pct}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Completed lessons */}
      {completedLessons.length > 0 && (
        <div className="px-5 mt-7">
          <h2 className="text-xl font-bold text-foreground mb-4">Completed Lessons</h2>
          <div className="space-y-2">
            {completedLessons.slice().reverse().map((cl) => {
              const track = tracks.find((t) => t.id === cl.trackId);
              const lesson = track?.lessons.find((l) => l.id === cl.lessonId);
              if (!track || !lesson) return null;
              return (
                <div key={cl.lessonId} className="flex items-center gap-3 p-3.5 rounded-xl border bg-card">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: track.color }}>
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{lesson.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{track.title}</div>
                  </div>
                  {cl.score > 0 && (
                    <div className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0" style={{ backgroundColor: track.color + "18", color: track.color }}>
                      {cl.score}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedLessons.length === 0 && (
        <div className="mx-5 mt-7 flex flex-col items-center gap-3 p-8 rounded-2xl border bg-card">
          <BookOpen size={36} className="text-muted-foreground" />
          <div className="text-lg font-bold text-foreground">No lessons yet</div>
          <div className="text-sm text-muted-foreground text-center">Complete your first lesson to see progress here</div>
          <Link href="/learn">
            <button className="mt-2 px-6 py-3.5 rounded-2xl font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>
              Start Learning
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
