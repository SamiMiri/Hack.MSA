import { useGame } from "@/context/GameContext";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";

const RATING_COLOR: Record<string, string> = {
  "You Made It": "#10B981",
  "Getting By": "#F59E0B",
  "Hard Lessons": "#EF4444",
};

const RATING_EMOJI: Record<string, string> = {
  "You Made It": "🎉",
  "Getting By": "😤",
  "Hard Lessons": "💀",
};

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs font-bold text-foreground">{typeof value === "number" && value > 100 ? `$${value.toLocaleString()}` : value}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function SimulatorGamePage() {
  const { gamePhase, currentScenario, currentSceneId, stats, flags, pendingFeedback, bestScores, continueGame, returnToMenu, replayScenario, makeChoice, calculateRating } = useGame();
  const { addCoins } = useApp();
  const [, navigate] = useLocation();

  if (!currentScenario || gamePhase === "idle") {
    navigate("/simulate");
    return null;
  }

  const currentScene = currentScenario.scenes[currentSceneId];

  if (gamePhase === "ended" && currentScene) {
    const rating = calculateRating(flags, stats.score);
    return (
      <div className="flex-1 flex flex-col bg-background pb-8">
        <div className="px-5 pt-6 pb-4 flex items-center gap-3">
          <button onClick={() => { returnToMenu(); navigate("/simulate"); }} className="text-muted-foreground">
            <ArrowLeft size={22} />
          </button>
          <span className="font-bold text-foreground">{currentScenario.name}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          <div className="text-center py-6">
            <div className="text-6xl mb-4">{RATING_EMOJI[rating] ?? "🏁"}</div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">{currentScene.endingTitle ?? rating}</h2>
            <p className="text-sm text-muted-foreground mb-4">{currentScene.text}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-white" style={{ backgroundColor: RATING_COLOR[rating] }}>
              {rating}
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-4 space-y-3 mb-5">
            <h3 className="font-bold text-foreground">Final Stats</h3>
            <StatBar label="Money" value={stats.money} max={5000} color="#10B981" />
            <StatBar label="Score" value={stats.score} max={100} color="#7C3AED" />
            <StatBar label="Knowledge" value={stats.knowledge} max={50} color="#0EA5E9" />
            <StatBar label="Stress" value={stats.stress} max={100} color="#EF4444" />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <div className="font-bold text-amber-700 dark:text-amber-400">+20 coins earned</div>
                <div className="text-xs text-amber-600 dark:text-amber-500">Completing a scenario</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 flex flex-col gap-2.5">
          <button
            onClick={() => { addCoins(20); replayScenario(); }}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 bg-purple-600"
          >
            <RotateCcw size={18} />
            Try Again
          </button>
          <button onClick={() => { addCoins(20); returnToMenu(); navigate("/simulate"); }} className="w-full py-4 rounded-2xl font-bold bg-muted text-foreground">
            Back to Scenarios
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === "consequence" && pendingFeedback) {
    const kindColor = pendingFeedback.kind === "good" ? "#10B981" : pendingFeedback.kind === "bad" ? "#EF4444" : "#F59E0B";
    return (
      <div className="flex-1 flex flex-col bg-background">
        <div className="px-5 pt-6 pb-4 flex items-center gap-3">
          <span className="font-bold text-foreground">{currentScenario.name}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center px-5 gap-5">
          <div className="bg-card border-2 rounded-2xl p-5 space-y-3" style={{ borderColor: kindColor }}>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: kindColor }}>
              {pendingFeedback.kind === "good" ? "✓ Good Call" : pendingFeedback.kind === "bad" ? "✗ Rough Choice" : "~ Could Go Either Way"}
            </div>
            <p className="text-sm font-bold text-foreground">"{pendingFeedback.choiceLabel}"</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{pendingFeedback.text}</p>
          </div>
        </div>
        <div className="px-5 pb-8 pt-2">
          <button onClick={continueGame} className="w-full py-4 rounded-2xl font-bold text-white bg-purple-600">
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (!currentScene) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <button onClick={() => { returnToMenu(); navigate("/simulate"); }} className="text-primary font-semibold">Back to scenarios</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => { returnToMenu(); navigate("/simulate"); }} className="text-muted-foreground">
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-muted-foreground">{currentScenario.name}</span>
          <div className="w-5" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "💵", value: `$${stats.money.toLocaleString()}` },
            { label: "🎯", value: `${stats.score}` },
            { label: "🧠", value: `${stats.knowledge}` },
            { label: "😰", value: `${stats.stress}%` },
          ].map((s) => (
            <div key={s.label} className="bg-muted rounded-xl p-2 text-center">
              <div className="text-base">{s.label}</div>
              <div className="text-xs font-bold text-foreground mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scene */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        <AnimatePresence mode="wait">
          <motion.div key={currentSceneId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h3 className="text-xs font-bold tracking-widest uppercase text-purple-600 mb-2">{currentScene.title}</h3>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{currentScene.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Choices */}
      <div className="px-5 pb-8 pt-2 space-y-2.5 flex-shrink-0">
        {currentScene.choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => makeChoice(choice, currentScene.title)}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all hover:shadow-sm font-medium text-sm text-foreground
              ${choice.kind === "good" ? "border-green-200 dark:border-green-900 hover:border-green-400" :
                choice.kind === "bad" ? "border-red-200 dark:border-red-900 hover:border-red-400" :
                "border-border hover:border-amber-400"}`}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}
