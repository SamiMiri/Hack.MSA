import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { LESSONS, Lesson, Choice } from "@/data/lessons";
import { useProgress } from "@/hooks/useProgress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, CheckCircle2, AlertCircle, Info, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LessonScreen() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { getLessonProgress, saveLessonProgress, completeLesson } = useProgress();
  
  const lesson = LESSONS.find(l => l.id === id);
  
  const [currentStep, setCurrentStep] = useState<number>(-1); // -1 = intro, 0+ = decision index, max = complete
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [showConsequence, setShowConsequence] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (lesson) {
      const savedProgress = getLessonProgress(lesson.id);
      setCurrentStep(savedProgress);
    }
  }, [lesson, getLessonProgress]);

  if (!lesson) {
    return <div className="p-8 text-center">Lesson not found</div>;
  }

  const isIntro = currentStep === -1;
  const isComplete = currentStep >= lesson.decisions.length;
  const progressPercent = Math.max(0, Math.min(100, ((currentStep + 1) / (lesson.decisions.length + 1)) * 100));

  const handleStart = () => {
    setCurrentStep(0);
    saveLessonProgress(lesson.id, 0);
  };

  const handleChoiceSelect = (choice: Choice) => {
    if (showConsequence) return;
    setSelectedChoice(choice);
  };

  const handleConfirmChoice = () => {
    if (!selectedChoice) return;
    setShowConsequence(true);
  };

  const handleNextStep = () => {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    saveLessonProgress(lesson.id, nextStep);
    setSelectedChoice(null);
    setShowConsequence(false);
  };

  const handleFinish = () => {
    setIsFinishing(true);
    completeLesson(lesson.id, lesson.xp);
    // Add a slight delay for dramatic effect before navigating
    setTimeout(() => {
      setLocation("/learn");
    }, 1500);
  };

  const handleExit = () => {
    setLocation("/learn");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={handleExit} disabled={isFinishing} className="shrink-0 text-muted-foreground hover:text-foreground">
          <X className="w-6 h-6" />
        </Button>
        <Progress value={progressPercent} className="h-3 flex-1" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 max-w-md mx-auto w-full flex flex-col">
        <AnimatePresence mode="wait">
          {isIntro && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col justify-center gap-8"
            >
              <div className="space-y-4">
                <h1 className="text-3xl font-extrabold tracking-tight">{lesson.title}</h1>
                <p className="text-xl text-muted-foreground leading-relaxed">{lesson.intro}</p>
              </div>
              <Button size="lg" className="h-16 text-xl rounded-2xl w-full mt-auto mb-8 active-elevate-2 shadow-md font-bold" onClick={handleStart} data-testid="button-start-lesson">
                Start Scenario
              </Button>
            </motion.div>
          )}

          {!isIntro && !isComplete && lesson.decisions[currentStep] && (
            <motion.div 
              key={`step-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
            >
              <h2 className="text-2xl font-bold leading-tight">{lesson.decisions[currentStep].question}</h2>
              
              <div className="space-y-3">
                {lesson.decisions[currentStep].choices.map((choice) => {
                  const isSelected = selectedChoice?.id === choice.id;
                  
                  let cardClass = "cursor-pointer border-2 transition-all p-4 rounded-xl";
                  if (showConsequence) {
                    if (isSelected) {
                      cardClass += choice.isCorrect === true ? " border-green-500 bg-green-50" : 
                                   choice.isCorrect === false ? " border-red-500 bg-red-50" : 
                                   " border-blue-500 bg-blue-50";
                    } else {
                      cardClass += " opacity-50 border-border/50";
                    }
                  } else {
                    cardClass += isSelected ? " border-primary bg-primary/5" : " border-border hover:border-primary/50";
                  }

                  return (
                    <Card 
                      key={choice.id}
                      className={cardClass}
                      onClick={() => handleChoiceSelect(choice)}
                      data-testid={`choice-${choice.id}`}
                    >
                      <p className={`text-lg font-medium ${isSelected && !showConsequence ? 'text-primary' : ''}`}>
                        {choice.text}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {isComplete && !isFinishing && (
            <motion.div 
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col justify-center items-center gap-8 text-center"
            >
              <div className="w-32 h-32 bg-secondary/20 text-secondary rounded-full flex items-center justify-center mb-4">
                <Star className="w-16 h-16 fill-current" />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-extrabold text-primary">Lesson Complete!</h1>
                <p className="text-2xl font-bold text-muted-foreground">+{lesson.xp} XP</p>
              </div>
              
              <Card className="p-6 bg-primary/5 border-primary/20 text-left w-full mt-4">
                <h3 className="font-bold uppercase tracking-wider text-primary text-sm mb-2">Key Takeaway</h3>
                <p className="text-lg font-medium">{lesson.takeaway}</p>
              </Card>

              <Button size="lg" className="h-16 text-xl rounded-2xl w-full mt-auto mb-8 active-elevate-2 font-bold" onClick={handleFinish} data-testid="button-finish-lesson">
                Continue
              </Button>
            </motion.div>
          )}

          {isFinishing && (
             <motion.div 
             key="finishing"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="flex-1 flex items-center justify-center"
           >
             <div className="text-center space-y-4">
               <div className="animate-bounce">
                  <Star className="w-24 h-24 text-secondary fill-secondary mx-auto" />
               </div>
               <h2 className="text-2xl font-bold">Awesome job!</h2>
             </div>
           </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Area (Consequence & Action Button) */}
      {!isIntro && !isComplete && (
        <div className="border-t border-border/50 p-4 bg-background pb-safe">
          <div className="max-w-md mx-auto w-full space-y-4">
            <AnimatePresence>
              {showConsequence && selectedChoice && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl flex gap-3 ${
                    selectedChoice.isCorrect === true ? 'bg-green-100 text-green-900' :
                    selectedChoice.isCorrect === false ? 'bg-red-100 text-red-900' :
                    'bg-blue-100 text-blue-900'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {selectedChoice.isCorrect === true ? <CheckCircle2 className="w-5 h-5" /> :
                     selectedChoice.isCorrect === false ? <AlertCircle className="w-5 h-5" /> :
                     <Info className="w-5 h-5" />}
                  </div>
                  <p className="font-medium">{selectedChoice.consequence}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              size="lg" 
              className="w-full h-14 rounded-xl text-lg font-bold shadow-sm active-elevate-2 disabled:opacity-50"
              disabled={!selectedChoice}
              onClick={showConsequence ? handleNextStep : handleConfirmChoice}
              data-testid="button-lesson-action"
            >
              {showConsequence ? "Continue" : "Check Answer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}