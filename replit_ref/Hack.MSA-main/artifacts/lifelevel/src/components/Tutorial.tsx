import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/useProgress";
import { Flame, Brain, Trophy } from "lucide-react";

export function Tutorial() {
  const { tutorialDone, completeTutorial } = useProgress();
  const [step, setStep] = useState(0);

  if (tutorialDone) return null;

  const steps = [
    {
      title: "Welcome to LifeLevel",
      description: "The adulting simulator school forgot to teach you. Learn by playing through real-life scenarios.",
      icon: Brain,
      color: "text-primary"
    },
    {
      title: "Learn by playing",
      description: "Every lesson is a story. You make choices, face consequences, and earn XP for smart decisions.",
      icon: Trophy,
      color: "text-secondary"
    },
    {
      title: "Streaks keep you sharp",
      description: "Play daily to build your streak. Complete all lessons or reach a 20-day streak to unlock Premium.",
      icon: Flame,
      color: "text-orange-500"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      completeTutorial();
    }
  };

  const CurrentIcon = steps[step].icon;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md pb-safe">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center space-y-6 w-full"
          >
            <div className={`p-6 rounded-full bg-muted ${steps[step].color}`}>
              <CurrentIcon className="w-16 h-16" strokeWidth={1.5} />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">{steps[step].title}</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {steps[step].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 max-w-md mx-auto w-full space-y-4">
        <div className="flex gap-2 justify-center mb-6">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-primary" : "w-2 bg-primary/20"
              }`}
            />
          ))}
        </div>
        
        <Button 
          size="lg" 
          className="w-full text-lg h-14 rounded-2xl active-elevate-2" 
          onClick={handleNext}
          data-testid="button-tutorial-next"
        >
          {step === steps.length - 1 ? "Let's Go!" : "Continue"}
        </Button>
        
        <Button 
          variant="ghost" 
          size="lg" 
          className="w-full text-muted-foreground" 
          onClick={completeTutorial}
          data-testid="button-tutorial-skip"
        >
          Skip Tutorial
        </Button>
      </div>
    </div>
  );
}