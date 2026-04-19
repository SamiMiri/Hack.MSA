import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useGame } from "@/context/GameContext";
import { SCENARIOS, Scenario } from "@/data/scenarios";
import { useLocation } from "wouter";
import { Info, Lock, Play } from "lucide-react";

const SCENARIO_ACCENTS = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899"];

const RATING_COLOR: Record<string, string> = {
  "You Made It": "#10B981",
  "Getting By": "#F59E0B",
  "Hard Lessons": "#EF4444",
};

function PurchaseDialog({ scenario, coins, onClose, onPurchase }: { scenario: Scenario; coins: number; onClose: () => void; onPurchase: () => void }) {
  const canAfford = coins >= (scenario.price ?? 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
      <div className="bg-card border rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-purple-100 dark:bg-purple-950/30">
          🎮
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground">{scenario.name}</h3>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mt-1">{scenario.who}</p>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{scenario.desc}</p>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3 w-full justify-center">
          <span className="text-xl">⭐</span>
          <span className="text-lg font-bold text-amber-600">{scenario.price} coins</span>
          <span className="text-sm text-muted-foreground ml-1">You have {coins}</span>
        </div>
        {!canAfford && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 rounded-xl p-3 w-full">
            <Info size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-500">Need {(scenario.price ?? 0) - coins} more coins. Complete lessons to earn them.</p>
          </div>
        )}
        <div className="flex gap-2.5 w-full">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl bg-muted font-bold text-foreground text-sm">Cancel</button>
          <button
            onClick={canAfford ? onPurchase : undefined}
            disabled={!canAfford}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-purple-600 text-white disabled:opacity-50"
          >
            {canAfford ? "Unlock Scenario" : "Not Enough Coins"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SimulatePage() {
  const { coins, purchaseScenario, isScenarioUnlocked } = useApp();
  const { chooseScenario, bestScores } = useGame();
  const [, navigate] = useLocation();
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  const freeScenarios = SCENARIOS.filter((s) => !s.premium);
  const premiumScenarios = SCENARIOS.filter((s) => s.premium);

  const handlePress = (scenario: Scenario) => {
    if (!scenario.premium || isScenarioUnlocked(scenario.id)) {
      chooseScenario(scenario.id);
      navigate("/simulator");
    } else {
      setSelectedScenario(scenario);
    }
  };

  const handlePurchase = () => {
    if (!selectedScenario) return;
    const success = purchaseScenario(selectedScenario.id, selectedScenario.price ?? 0);
    if (success) setSelectedScenario(null);
  };

  const ScenarioCard = ({ scenario, index }: { scenario: Scenario; index: number }) => {
    const accent = SCENARIO_ACCENTS[index % SCENARIO_ACCENTS.length];
    const best = bestScores[scenario.id];
    const isPremium = scenario.premium;
    const isUnlocked = !isPremium || isScenarioUnlocked(scenario.id);

    return (
      <button
        onClick={() => handlePress(scenario)}
        className={`w-full flex overflow-hidden rounded-2xl border bg-card text-left transition-all hover:shadow-md ${!isUnlocked ? "opacity-90" : ""}`}
      >
        <div className="w-1 flex-shrink-0" style={{ backgroundColor: isUnlocked ? accent : "#9ca3af" }} />
        <div className="flex-1 p-4 space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className={`text-base font-bold ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>{scenario.name}</h3>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mt-0.5">{scenario.who}</p>
            </div>
            {isUnlocked ? (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accent + "18" }}>
                <Play size={16} style={{ color: accent }} />
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-2 py-1.5 flex-shrink-0">
                <span className="text-xs">⭐</span>
                <span className="text-xs font-bold text-amber-600">{scenario.price}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{scenario.desc}</p>
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="text-xs text-muted-foreground">{scenario.estimatedTime}</span>
            {isUnlocked ? (
              best ? (
                <span className="text-xs font-bold" style={{ color: RATING_COLOR[best.rating] }}>Best: {best.rating}</span>
              ) : (
                <span className="text-xs font-semibold" style={{ color: accent }}>Play now</span>
              )
            ) : (
              <div className="flex items-center gap-1">
                <Lock size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Locked</span>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-24">
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-purple-600 mb-2">LIFE SIM</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-none">Adulting<br />Simulator</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1.5 mt-2">
            <span className="text-sm">⭐</span>
            <span className="text-sm font-bold text-amber-600">{coins}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">Make choices. Face consequences. Try to survive.</p>
      </div>

      <div className="px-4 space-y-3">
        {freeScenarios.map((s, i) => <ScenarioCard key={s.id} scenario={s} index={i} />)}
      </div>

      {premiumScenarios.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Premium Scenarios</span>
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 rounded-full px-2.5 py-1">
              <span className="text-xs">⭐</span>
              <span className="text-xs font-medium text-amber-600">Unlock with coins</span>
            </div>
          </div>
          <div className="space-y-3">
            {premiumScenarios.map((s, i) => <ScenarioCard key={s.id} scenario={s} index={freeScenarios.length + i} />)}
          </div>
        </div>
      )}

      <div className="mx-4 mt-5 flex items-center gap-2 bg-card border rounded-xl p-3">
        <Info size={14} className="text-muted-foreground flex-shrink-0" />
        <p className="text-xs text-muted-foreground">Earn ⭐ coins by completing lessons (+10) and scenarios (+20). Spend them to unlock premium content.</p>
      </div>

      {selectedScenario && (
        <PurchaseDialog scenario={selectedScenario} coins={coins} onClose={() => setSelectedScenario(null)} onPurchase={handlePurchase} />
      )}
    </div>
  );
}
