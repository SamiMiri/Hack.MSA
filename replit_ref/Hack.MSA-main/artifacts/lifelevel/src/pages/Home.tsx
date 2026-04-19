import { useProgress } from "@/hooks/useProgress";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LESSONS } from "@/data/lessons";
import { Flame, Star, ChevronRight, Trophy } from "lucide-react";

export default function Home() {
  const { xp, streak, completedLessons, getNextLessonId } = useProgress();
  const { leaderboard } = useLeaderboard();

  const totalLessons = LESSONS.length;
  const completedCount = completedLessons.length;
  const progressPercent = (completedCount / totalLessons) * 100;
  
  const nextLessonId = getNextLessonId();
  const nextLesson = nextLessonId ? LESSONS.find(l => l.id === nextLessonId) : null;

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="flex-1 pb-24 overflow-y-auto w-full">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-orange-500 font-bold text-lg">
          <Flame className="w-5 h-5 fill-current" />
          <span data-testid="text-streak-count">{streak.count}</span>
        </div>
        <div className="flex items-center gap-1.5 text-secondary font-bold text-lg">
          <Star className="w-5 h-5 fill-current" />
          <span data-testid="text-xp-total">{xp}</span>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight mb-4">Adulting Basics</h2>
          <Card className="p-5 border-2 shadow-sm relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Campaign Progress</p>
                  <p className="text-xl font-bold">{completedCount}/{totalLessons} Lessons</p>
                </div>
              </div>
              
              <Progress value={progressPercent} className="h-3" />
              
              {nextLesson ? (
                <div className="pt-2">
                  <Link href={`/lesson/${nextLesson.id}`}>
                    <Button size="lg" className="w-full h-14 rounded-xl text-lg font-bold shadow-sm active-elevate-2 group" data-testid="button-continue-learning">
                      Continue Learning
                      <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="pt-2">
                  <Button size="lg" className="w-full h-14 rounded-xl text-lg font-bold shadow-sm bg-green-500 hover:bg-green-600 text-white" disabled data-testid="button-campaign-complete">
                    Campaign Complete!
                  </Button>
                </div>
              )}
            </div>
            {/* Decorative background element */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl z-0" />
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-secondary" />
              Leaderboard Preview
            </h2>
            <Link href="/leaderboard" className="text-sm font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          
          <Card className="border-2 overflow-hidden shadow-sm">
            {top3.map((user, index) => (
              <div 
                key={user.id}
                className={`flex items-center justify-between p-4 ${index !== top3.length - 1 ? 'border-b border-border/50' : ''} ${user.id === 'you' ? 'bg-primary/5' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                      index === 1 ? 'bg-gray-100 text-gray-600' : 
                      index === 2 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}
                  >
                    {index + 1}
                  </div>
                  <span className={`font-medium ${user.id === 'you' ? 'text-primary font-bold' : ''}`}>
                    {user.name}
                  </span>
                </div>
                <span className="font-bold text-muted-foreground">{user.xp} XP</span>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}