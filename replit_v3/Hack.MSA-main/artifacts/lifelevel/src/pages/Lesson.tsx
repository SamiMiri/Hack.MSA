import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { tracks, LessonStep } from "@/data/tracks";
import { useApp } from "@/context/AppContext";
import { CheckCircle2, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ProgressBar({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${(current / total) * 100}%`, backgroundColor: color }}
      />
    </div>
  );
}

function TextStep({ step }: { step: LessonStep }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
      {step.content.split("\n\n").map((para, i) => (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed">{para}</p>
      ))}
    </div>
  );
}

function QuizStep({ step, onAnswer, answered }: { step: LessonStep; onAnswer: (idx: number) => void; answered: number | null }) {
  const quiz = step.quiz!;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
      <p className="text-base font-medium text-foreground">{quiz.question}</p>
      <div className="space-y-2.5">
        {quiz.options.map((opt, idx) => {
          const isSelected = answered === idx;
          const isCorrect = idx === quiz.correctIndex;
          let cls = "border-border bg-card text-foreground";
          if (answered !== null) {
            if (isCorrect) cls = "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-semibold";
            else if (isSelected) cls = "border-red-400 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400";
          }
          return (
            <button
              key={idx}
              onClick={() => answered === null && onAnswer(idx)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${cls}`}
              disabled={answered !== null}
            >
              <span className="text-sm font-medium">{opt}</span>
            </button>
          );
        })}
      </div>
      {answered !== null && (
        <div className={`p-3.5 rounded-xl border ${answered === quiz.correctIndex ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"}`}>
          <p className="text-sm text-muted-foreground">{quiz.explanation}</p>
        </div>
      )}
    </div>
  );
}

function ChecklistStep({ step }: { step: LessonStep }) {
  const items = step.checklistItems ?? [];
  const [checked, setChecked] = useState<boolean[]>(new Array(items.length).fill(false));
  const toggle = (i: number) => { const n = [...checked]; n[i] = !n[i]; setChecked(n); };
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
      <p className="text-sm text-muted-foreground">{step.content}</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <button key={i} onClick={() => toggle(i)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${checked[i] ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" : "bg-card border-border"}`}>
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${checked[i] ? "bg-green-500 border-green-500" : "border-border bg-background"}`}>
              {checked[i] && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <span className={`text-sm font-medium text-left ${checked[i] ? "line-through text-muted-foreground" : "text-foreground"}`}>{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LessonPage() {
  const { trackId, lessonId } = useParams<{ trackId: string; lessonId: string }>();
  const [, navigate] = useLocation();
  const { completeLesson, isLessonComplete } = useApp();

  const track = tracks.find((t) => t.id === trackId);
  const lesson = track?.lessons.find((l) => l.id === lessonId);

  const [stepIdx, setStepIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!track || !lesson) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Lesson not found</p></div>;
  }

  const steps = lesson.steps;
  const currentStep = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;
  const alreadyDone = isLessonComplete(lesson.id);

  const canAdvance = () => currentStep.type !== "quiz" || quizAnswer !== null;

  const handleAnswer = (idx: number) => {
    setQuizAnswer(idx);
    if (idx === currentStep.quiz?.correctIndex) setScore((s) => s + 25);
  };

  const handleNext = () => {
    if (!canAdvance()) return;
    if (isLast) {
      if (!alreadyDone) completeLesson({ trackId: track.id, lessonId: lesson.id, completedAt: new Date().toISOString(), score });
      setFinished(true);
    } else {
      setStepIdx((i) => i + 1);
      setQuizAnswer(null);
    }
  };

  if (finished) {
    const coinsEarned = 10 + (score >= 80 ? 5 : 0);
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 bg-background">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl" style={{ backgroundColor: track.color + "18" }}>🎉</div>
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-foreground mb-2">Lesson Complete!</h2>
          <p className="text-sm text-muted-foreground">{lesson.title}</p>
          {!alreadyDone && (
            <div className="mt-4 flex items-center gap-2 justify-center">
              <span className="text-lg">⭐</span>
              <span className="font-bold text-amber-600">+{coinsEarned} coins earned</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <button onClick={() => navigate(`/track/${track.id}`)} className="w-full py-4 rounded-2xl font-bold text-white" style={{ backgroundColor: track.color }}>
            Back to Track
          </button>
          <button onClick={() => navigate("/learn")} className="w-full py-4 rounded-2xl font-bold bg-muted text-foreground">
            All Tracks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4 flex-shrink-0">
        <button onClick={() => navigate(`/track/${track.id}`)} className="text-muted-foreground"><X size={22} /></button>
        <ProgressBar current={stepIdx + 1} total={steps.length} color={track.color} />
        <span className="text-xs text-muted-foreground font-medium">{stepIdx + 1}/{steps.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <AnimatePresence mode="wait">
          <motion.div key={stepIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {currentStep.type === "text" && <TextStep step={currentStep} />}
            {currentStep.type === "quiz" && <QuizStep step={currentStep} onAnswer={handleAnswer} answered={quizAnswer} />}
            {currentStep.type === "checklist" && <ChecklistStep step={currentStep} />}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="px-5 pb-8 pt-2 flex-shrink-0">
        <button onClick={handleNext} disabled={!canAdvance()} className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: track.color }}>
          {isLast ? "Complete Lesson" : "Continue"}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
