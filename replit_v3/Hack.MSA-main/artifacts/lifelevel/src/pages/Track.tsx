import { Link, useParams } from "wouter";
import { tracks } from "@/data/tracks";
import { useApp } from "@/context/AppContext";
import { ArrowLeft, CheckCircle2, Clock, ChevronRight } from "lucide-react";

const ICON_MAP: Record<string, string> = {
  "credit-card": "💳",
  "file-text": "📄",
  "shield": "🛡️",
  "home": "🏠",
  "briefcase": "💼",
  "heart": "❤️",
  "trending-up": "📈",
  "bar-chart-2": "📊",
  "book-open": "📖",
  "dollar-sign": "💵",
  "percent": "💯",
  "zap": "⚡",
  "users": "👥",
  "star": "⭐",
};

export default function TrackPage() {
  const { id } = useParams<{ id: string }>();
  const track = tracks.find((t) => t.id === id);
  const { isLessonComplete, getTrackProgress } = useApp();

  if (!track) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Track not found</p>
      </div>
    );
  }

  const progress = getTrackProgress(track.id, track.lessonsCount);
  const pct = Math.round(progress * 100);
  const done = Math.round(progress * track.lessonsCount);

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/learn">
          <button className="flex items-center gap-1.5 text-sm font-semibold mb-5" style={{ color: "var(--primary)" }}>
            <ArrowLeft size={16} />
            Back
          </button>
        </Link>

        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: track.color + "18" }}
          >
            {ICON_MAP[track.icon] ?? "📚"}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">{track.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{track.subtitle}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: track.color }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/80 font-medium">Progress</span>
            <span className="text-sm font-bold text-white">{done}/{track.lessonsCount} lessons</span>
          </div>
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          {pct === 100 && (
            <div className="mt-2 text-center text-sm font-bold text-white">Track Complete! 🎉</div>
          )}
        </div>
      </div>

      {/* Lessons */}
      <div className="px-5 space-y-3">
        {track.lessons.map((lesson, i) => {
          const isComplete = isLessonComplete(lesson.id);
          return (
            <Link key={lesson.id} href={`/lesson/${track.id}/${lesson.id}`}>
              <div
                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm
                  ${isComplete ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" : "bg-card"}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 font-bold
                    ${isComplete ? "bg-green-500 text-white" : ""}`}
                  style={!isComplete ? { backgroundColor: track.color + "18" } : undefined}
                >
                  {isComplete ? <CheckCircle2 size={20} className="text-white" /> : (ICON_MAP[lesson.icon] ?? (i + 1))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm ${isComplete ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {lesson.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{lesson.description}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={11} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{lesson.duration} min</span>
                    {isComplete && <span className="text-xs text-green-600 font-semibold ml-2">✓ Done</span>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
