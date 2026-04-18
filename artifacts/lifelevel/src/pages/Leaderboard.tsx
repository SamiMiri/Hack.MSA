import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { leaderboard } = useLeaderboard();

  return (
    <div className="flex-1 pb-24 overflow-y-auto w-full bg-background">
      <div className="bg-primary/5 px-4 pt-10 pb-6 border-b border-primary/10 text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">Compete with other players to stay sharp.</p>
        
        <Tabs defaultValue="all-time" className="mt-6 max-w-[250px] mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="all-time">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4 max-w-md mx-auto">
        <Card className="border-2 overflow-hidden shadow-sm">
          {leaderboard.map((user, index) => {
            const isYou = user.id === 'you';
            const isTop3 = index < 3;
            
            return (
              <div 
                key={user.id}
                className={cn(
                  "flex items-center justify-between p-4",
                  index !== leaderboard.length - 1 && "border-b border-border/50",
                  isYou && "bg-primary/10"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                    index === 0 ? "bg-yellow-100 text-yellow-700" : 
                    index === 1 ? "bg-gray-100 text-gray-600" : 
                    index === 2 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground font-medium text-base"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className={cn("font-bold text-lg", isYou && "text-primary")}>
                      {user.name}
                    </span>
                    {isYou && <span className="text-xs font-semibold text-primary/70 uppercase">Current User</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
                  <span className={cn(isTop3 && "text-foreground")}>{user.xp}</span>
                  <Star className={cn("w-4 h-4", isTop3 ? "text-secondary fill-secondary" : "")} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}