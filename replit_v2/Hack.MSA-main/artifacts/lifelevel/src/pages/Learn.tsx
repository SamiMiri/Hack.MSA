import { useProgress } from "@/hooks/useProgress";
import { Link } from "wouter";
import { LESSONS } from "@/data/lessons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Learn() {
  const { completedLessons } = useProgress();

  return (
    <div className="flex-1 pb-24 overflow-y-auto w-full bg-background">
      <div className="bg-primary/5 px-4 py-8 border-b border-primary/10">
        <div className="max-w-md mx-auto">
          <Badge className="bg-primary/20 text-primary hover:bg-primary/20 mb-2 border-none">Campaign</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Adulting Basics</h1>
          <p className="text-muted-foreground">Master the fundamental skills for surviving the real world.</p>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto relative">
        {/* Connection line */}
        <div className="absolute left-8 top-8 bottom-8 w-1 bg-border/50 z-0 rounded-full" />

        <div className="space-y-6 relative z-10">
          {LESSONS.map((lesson, index) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const prevLessonId = index > 0 ? LESSONS[index - 1].id : null;
            const isLocked = prevLessonId ? !completedLessons.includes(prevLessonId) : false;
            
            const Content = (
              <Card className={cn(
                "p-4 border-2 transition-all duration-300 ml-10 relative overflow-visible",
                isCompleted ? "border-green-500/50 bg-green-500/5" : 
                isLocked ? "border-border/50 bg-muted/30 opacity-75" : 
                "border-primary shadow-sm hover:-translate-y-1 hover:shadow-md"
              )}>
                {/* Node on the line */}
                <div className={cn(
                  "absolute -left-[46px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center border-4 border-background shadow-sm",
                  isCompleted ? "bg-green-500 text-white" : 
                  isLocked ? "bg-muted text-muted-foreground" : 
                  "bg-primary text-white"
                )}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : 
                   isLocked ? <Lock className="w-4 h-4" /> : 
                   <span className="font-bold text-sm">{index + 1}</span>}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className={cn(
                      "font-semibold text-xs tracking-wide uppercase",
                      isCompleted ? "text-green-600 border-green-200" :
                      isLocked ? "text-muted-foreground border-border" :
                      "text-primary border-primary/20 bg-primary/5"
                    )}>
                      {lesson.category}
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-bold leading-tight">{lesson.title}</h3>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-secondary fill-secondary" />
                      <span>{lesson.xp} XP</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{lesson.timeEstimate}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );

            if (isLocked || isCompleted) {
              return <div key={lesson.id} data-testid={`lesson-card-${lesson.id}`}>{Content}</div>;
            }

            return (
              <Link key={lesson.id} href={`/lesson/${lesson.id}`} data-testid={`lesson-card-${lesson.id}`}>
                <div className="cursor-pointer">{Content}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}