import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Learn from "@/pages/Learn";
import Track from "@/pages/Track";
import LessonPage from "@/pages/Lesson";
import Simulate from "@/pages/Simulate";
import SimulatorGame from "@/pages/SimulatorGame";
import Tools from "@/pages/Tools";
import Progress from "@/pages/Progress";
import Settings from "@/pages/Settings";
import { BottomNav } from "@/components/BottomNav";
import { AppProvider } from "@/context/AppContext";
import { GameProvider } from "@/context/GameContext";

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground overflow-hidden">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/learn" component={Learn} />
        <Route path="/track/:id" component={Track} />
        <Route path="/lesson/:trackId/:lessonId" component={LessonPage} />
        <Route path="/simulate" component={Simulate} />
        <Route path="/simulator" component={SimulatorGame} />
        <Route path="/tools" component={Tools} />
        <Route path="/progress" component={Progress} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <GameProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </GameProvider>
        </AppProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
