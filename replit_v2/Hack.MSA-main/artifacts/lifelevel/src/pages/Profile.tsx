import { useProgress } from "@/hooks/useProgress";
import { LESSONS } from "@/data/lessons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Flame, Star, BookOpen, Crown, Settings } from "lucide-react";

export default function Profile() {
  const { xp, streak, completedLessons } = useProgress();

  const uniqueCategories = Array.from(new Set(LESSONS.map(l => l.category)));
  const completedCategories = uniqueCategories.filter(cat => {
    const categoryLessons = LESSONS.filter(l => l.category === cat);
    return categoryLessons.every(l => completedLessons.includes(l.id));
  });

  const isPremiumEligible = completedLessons.length === LESSONS.length || streak.count >= 20;

  return (
    <div className="flex-1 pb-24 overflow-y-auto w-full bg-background">
      <div className="px-4 py-8 text-center space-y-4">
        <div className="w-24 h-24 bg-primary/10 text-primary mx-auto rounded-full flex items-center justify-center text-4xl font-extrabold uppercase border-4 border-primary/20">
          U
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">You</h1>
          <p className="text-muted-foreground font-medium">LifeLevel Student</p>
        </div>
      </div>

      <div className="px-4 max-w-md mx-auto space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 border-2 flex flex-col items-center justify-center text-center space-y-2">
            <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
            <div>
              <p className="text-2xl font-bold">{streak.count}</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Day Streak</p>
            </div>
          </Card>
          <Card className="p-4 border-2 flex flex-col items-center justify-center text-center space-y-2">
            <Star className="w-8 h-8 text-secondary fill-secondary" />
            <div>
              <p className="text-2xl font-bold">{xp}</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total XP</p>
            </div>
          </Card>
        </div>

        <Card className="p-5 border-2 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Learning Progress</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-muted-foreground">Lessons Completed</span>
              <span className="font-bold">{completedLessons.length} / {LESSONS.length}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium text-muted-foreground">Skills Mastered</span>
              <span className="font-bold text-primary">{completedCategories.length} / {uniqueCategories.length}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {uniqueCategories.map(cat => {
                const isMastered = completedCategories.includes(cat);
                return (
                  <span key={cat} className={`text-xs font-bold px-2 py-1 rounded-md ${isMastered ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {cat}
                  </span>
                )
              })}
            </div>
          </div>
        </Card>

        <Card className={`p-5 border-2 shadow-sm relative overflow-hidden ${isPremiumEligible ? 'border-secondary bg-secondary/5' : 'border-border'}`}>
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isPremiumEligible ? 'bg-secondary/20 text-secondary' : 'bg-muted text-muted-foreground'}`}>
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Premium Status</h2>
                  <p className="text-sm font-semibold text-muted-foreground">{isPremiumEligible ? 'Unlocked' : 'Free Tier'}</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm font-medium">
              {isPremiumEligible 
                ? "You've proven your dedication. Enjoy access to advanced topics and custom scenarios."
                : "Complete all lessons or reach a 20-day streak to unlock Premium."}
            </p>

            <ul className="text-sm space-y-2 font-medium text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Advanced topics (investing, etc.)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Create your own scenarios
              </li>
            </ul>

            <Button className={`w-full font-bold ${isPremiumEligible ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted'}`} disabled={!isPremiumEligible}>
              {isPremiumEligible ? 'Access Premium Perks' : 'Locked'}
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}