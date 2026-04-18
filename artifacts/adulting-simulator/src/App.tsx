import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from './hooks/useGameState';
import { SCENARIOS, SceneChoice } from './data/scenarios';
import {
  Coins, Zap, BookOpen, Trophy, Play, RotateCcw,
  ArrowRight, TrendingUp, TrendingDown, Minus, ChevronRight,
  Sun, Moon, ShieldAlert
} from 'lucide-react';

function useTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('adulting-sim-theme');
    if (stored !== null) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('adulting-sim-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark(d => !d) };
}

function ThemeToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      data-testid="button-theme-toggle"
      className="fixed top-4 right-4 z-[100] w-10 h-10 rounded-xl bg-card border border-card-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait">
        {dark ? (
          <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
            <Sun className="w-5 h-5" />
          </motion.span>
        ) : (
          <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
            <Moon className="w-5 h-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function App() {
  const gameState = useGameState();
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground overflow-hidden font-sans">
      <ThemeToggle dark={dark} toggle={toggle} />
      <AnimatePresence mode="wait">
        {gameState.gameState === 'menu' && (
          <MenuScreen key="menu" {...gameState} />
        )}
        {(gameState.gameState === 'playing' || gameState.gameState === 'consequence') && (
          <GameScreen key="game" {...gameState} />
        )}
        {gameState.gameState === 'outcome' && (
          <OutcomeScreen key="outcome" {...gameState} />
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuScreen({ startGame, bestScores }: ReturnType<typeof useGameState>) {
  const ratingColor: Record<string, string> = {
    'You Made It': 'text-emerald-400',
    'Getting By': 'text-amber-400',
    'Hard Lessons': 'text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      className="flex flex-col items-center min-h-[100dvh] p-5 max-w-md mx-auto"
    >
      <div className="w-full mt-12 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <span className="text-primary text-xs font-bold uppercase tracking-widest">Life Sim</span>
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground mb-3 leading-none">
          Adulting<br />Simulator
        </h1>
        <p className="text-muted-foreground text-base">Make choices. Face consequences. Try to survive.</p>
      </div>

      <div className="w-full space-y-3">
        {SCENARIOS.map((scenario) => {
          const best = bestScores[scenario.id];
          return (
            <motion.button
              key={scenario.id}
              onClick={() => startGame(scenario.id)}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              data-testid={`scenario-card-${scenario.id}`}
              className="w-full text-left bg-card border border-card-border rounded-2xl p-5 relative overflow-hidden group"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                style={{ background: 'radial-gradient(ellipse at top left, hsl(262 83% 68% / 0.06), transparent 70%)' }}
              />
              <div className="flex flex-col gap-1 mb-3">
                <h2 className="text-xl font-bold text-foreground leading-tight">{scenario.name}</h2>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{scenario.who}</span>
              </div>
              <p className="text-sm text-foreground/80 mb-4 line-clamp-2">{scenario.desc}</p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground">{scenario.estimatedTime}</span>
                {best ? (
                  <span className={`text-sm font-bold ${ratingColor[best.rating] || 'text-primary'}`}>
                    Best: {best.rating}
                  </span>
                ) : (
                  <span className="text-sm text-primary font-medium flex items-center gap-1">
                    Play <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-muted-foreground/50">
        {SCENARIOS.length} scenarios · All choices matter
      </p>
    </motion.div>
  );
}

interface StatConfig {
  key: keyof ReturnType<typeof useGameState>['stats'];
  label: string;
  icon: React.ElementType;
  color: string;
  barColor: string;
  max?: number;
  format: 'currency' | 'number';
  invertGood?: boolean;
}

function getStatConfigs(startMoney: number): StatConfig[] {
  return [
    { key: 'money',     label: 'Cash',    icon: Coins,    color: 'text-emerald-400', barColor: 'bg-emerald-400', max: Math.max(startMoney * 3, 5000), format: 'currency' },
    { key: 'stress',    label: 'Stress',  icon: Zap,      color: 'text-red-400',     barColor: 'bg-red-400',     max: 100,  format: 'number', invertGood: true },
    { key: 'knowledge', label: 'Know',    icon: BookOpen, color: 'text-sky-400',     barColor: 'bg-sky-400',     max: 30,   format: 'number' },
    { key: 'score',     label: 'Score',   icon: Trophy,   color: 'text-violet-400',  barColor: 'bg-violet-400',  max: 80,   format: 'number' },
  ];
}

function StatRow({
  config,
  value,
  delta,
}: {
  config: StatConfig;
  value: number;
  delta?: number;
}) {
  const Icon = config.icon;
  const hasChanged = delta !== undefined && delta !== 0;
  const isReallyGood = config.invertGood ? (delta ?? 0) < 0 : (delta ?? 0) > 0;
  
  let pct = 0;
  if (config.max) {
    if (config.key === 'score') {
       pct = Math.min(100, Math.max(0, ((value + 50) / (config.max + 50)) * 100)); // Offset for negative scores visually
    } else {
       pct = Math.min(100, Math.max(0, (value / config.max) * 100));
    }
  }

  const displayValue = config.format === 'currency' ? `$${value.toLocaleString()}` : String(value);

  // Score can be negative, color it red if so
  const valueColor = config.key === 'score' && value < 0 ? 'text-red-400' : 'text-foreground';

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <div className={`flex items-center gap-1 ${config.color}`}>
          <Icon className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase tracking-wider">{config.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-sm font-black ${valueColor}`}>{displayValue}</span>
          <AnimatePresence>
            {hasChanged && (
              <motion.span
                key={`delta-${delta}`}
                initial={{ opacity: 0, y: -6, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`text-[11px] font-bold ${isReallyGood ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {(delta ?? 0) > 0 ? '+' : ''}{config.format === 'currency' ? `$${delta}` : delta}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      {config.max && (
        <div className="h-2 w-full bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${config.barColor}`}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      )}
    </div>
  );
}

const CHOICE_COLORS = [
  { base: 'bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20 hover:border-violet-400', label: 'bg-violet-500 text-white', letter: 'A' },
  { base: 'bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/20 hover:border-sky-400', label: 'bg-sky-500 text-white', letter: 'B' },
  { base: 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400', label: 'bg-emerald-500 text-white', letter: 'C' },
  { base: 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400', label: 'bg-amber-500 text-black', letter: 'D' },
];

const FLAG_DISPLAY_MAP: Record<string, string> = {
  "irs_risk": "IRS Watching",
  "fugitive": "FUGITIVE",
  "no_insurance_car": "Driving Uninsured",
  "credit_card_debt": "CC Debt",
  "money_mule": "Suspicious Activity",
  "felony_record": "Felony Record",
  "evaded_police": "Evaded Police",
  "missed_jury": "Missed Jury",
  "tax_fraud": "Tax Fraud",
  "scammed": "Got Scammed",
  "bad_lease": "Bad Lease",
  "lease_violation": "Lease Violation",
  "utility_scam": "Utility Trap",
  "eviction_record": "Eviction Record",
  "noncompete": "Non-Compete",
  "signed_blind": "Signed Blind",
  "sued": "Being Sued",
  "w4_wrong": "W-4 Wrong"
};

function GameScreen({ currentScenario, currentSceneId, stats, lastDeltas, flags, pendingFeedback, gameState, makeChoice, continueGame }: ReturnType<typeof useGameState>) {
  if (!currentScenario) return null;
  const scene = currentScenario.scenes[currentSceneId];
  if (!scene) return null;

  // Stable shuffle for choices based on scene ID
  const shuffledChoices = useMemo(() => {
    if (!scene.choices) return [];
    const choices = [...scene.choices];
    // Simple seeded shuffle using scene string
    let seed = scene.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.abs(Math.sin(seed++) * 10000) % (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return choices;
  }, [scene.id, scene.choices]);

  const statConfigs = getStatConfigs(currentScenario.startMoney);
  const visibleFlags = Array.from(flags).map(f => FLAG_DISPLAY_MAP[f]).filter(Boolean);

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-md mx-auto bg-background">
      {/* HUD */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 pt-4 pb-3">
        <div className="flex gap-3 mb-2">
          {statConfigs.slice(0, 2).map(cfg => (
            <StatRow key={cfg.key} config={cfg} value={stats[cfg.key]} delta={lastDeltas?.[cfg.key]} />
          ))}
        </div>
        <div className="flex gap-3">
          {statConfigs.slice(2, 4).map(cfg => (
            <StatRow key={cfg.key} config={cfg} value={stats[cfg.key]} delta={lastDeltas?.[cfg.key]} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {gameState === 'playing' ? (
            <motion.div
              key={`scene-${scene.id}`}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="p-5 pt-6 pb-10"
            >
              <div className="mb-6">
                <h3 data-testid="scene-title" className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  {scene.title}
                </h3>
                <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm">
                  <p data-testid="scene-text" className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                    {scene.text}
                  </p>
                </div>
              </div>

              {visibleFlags.length > 0 && (
                <div data-testid="flags-row" className="flex flex-wrap gap-2 mb-6">
                  {visibleFlags.map(f => (
                    <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold uppercase tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {!scene.isEnding && (
                <div className="space-y-3 mt-6">
                  {shuffledChoices.map((choice, i) => {
                    const colors = CHOICE_COLORS[i % CHOICE_COLORS.length];
                    return (
                      <motion.button
                        key={choice.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: i * 0.07 } }}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => makeChoice(choice)}
                        data-testid={`choice-${choice.id}`}
                        className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all duration-150 ${colors.base}`}
                      >
                        <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${colors.label}`}>
                          {colors.letter}
                        </span>
                        <span className="text-base font-medium text-foreground leading-snug pt-0.5">{choice.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`consequence-${scene.id}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="p-5 pt-7 pb-10 flex flex-col gap-5"
            >
              {pendingFeedback && (
                <div className={`bg-card border rounded-2xl p-5 relative overflow-hidden ${
                  pendingFeedback.kind === 'good' ? 'border-emerald-500/30' :
                  pendingFeedback.kind === 'bad' ? 'border-red-500/30' : 'border-amber-500/30'
                }`}>
                  <div className={`absolute top-0 left-0 bottom-0 w-1 rounded-l-2xl ${
                    pendingFeedback.kind === 'good' ? 'bg-emerald-500' :
                    pendingFeedback.kind === 'bad' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Feedback</p>
                  <p data-testid="feedback-text" className="text-lg font-medium text-foreground leading-snug">
                    {pendingFeedback.text}
                  </p>
                </div>
              )}

              {lastDeltas && (
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.entries(lastDeltas) as [keyof typeof lastDeltas, number][])
                    .filter(([, v]) => v !== undefined && v !== 0)
                    .map(([key, val]) => {
                      const cfg = statConfigs.find(s => s.key === key);
                      if (!cfg) return null;
                      const isGood = cfg.invertGood ? val < 0 : val > 0;
                      const Icon = cfg.icon;
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border ${isGood ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}
                        >
                          <Icon className={`w-5 h-5 shrink-0 ${isGood ? 'text-emerald-400' : 'text-red-400'}`} />
                          <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{cfg.label}</p>
                            <p className={`text-base font-black ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                              {val > 0 ? '+' : ''}{cfg.format === 'currency' ? `$${Math.abs(val)}` : val}
                            </p>
                          </div>
                          {isGood
                            ? <TrendingUp className="w-4 h-4 text-emerald-400 ml-auto" />
                            : <TrendingDown className="w-4 h-4 text-red-400 ml-auto" />
                          }
                        </motion.div>
                      );
                    })}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={continueGame}
                data-testid="button-continue"
                className="w-full mt-4 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OutcomeScreen({ stats, currentScenario, currentSceneId, calculateRating, flags, returnToMenu, startGame }: ReturnType<typeof useGameState>) {
  if (!currentScenario) return null;
  const scene = currentScenario.scenes[currentSceneId];
  if (!scene || !scene.isEnding) return null;

  const rating = calculateRating(flags, stats.score);

  const ratingConfig = {
    'You Made It': { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', bar: 'bg-emerald-400', icon: Trophy },
    'Getting By': { color: 'text-amber-400',  bg: 'bg-amber-400/10 border-amber-400/20',   bar: 'bg-amber-400',  icon: RotateCcw },
    'Hard Lessons': { color: 'text-red-400',   bg: 'bg-red-400/10 border-red-400/20',        bar: 'bg-red-400',    icon: Zap },
  }[rating];

  const RatingIcon = ratingConfig.icon;
  const statConfigs = getStatConfigs(currentScenario.startMoney);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-[100dvh] p-5 max-w-md mx-auto overflow-y-auto pb-10"
    >
      <div className="text-center mt-10 mb-8">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-5 border ${ratingConfig.bg}`}
        >
          <RatingIcon className={`w-10 h-10 ${ratingConfig.color}`} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Result</p>
          <h1 className={`text-5xl font-black uppercase tracking-tight leading-none mb-4 ${ratingConfig.color}`}>
            {rating}
          </h1>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-card-border rounded-2xl p-5 mb-4"
      >
        <p className="text-sm font-bold text-foreground mb-3">{scene.endingTitle}</p>
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{scene.text}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-card-border rounded-2xl p-5 mb-6"
      >
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Final Stats</p>
        <div className="space-y-4">
          {statConfigs.map((cfg) => (
            <StatRow key={cfg.key} config={cfg} value={stats[cfg.key]} />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3 mt-auto"
      >
        <button
          onClick={() => startGame(currentScenario.id)}
          data-testid="button-replay"
          className="w-full py-4 rounded-2xl bg-card border border-card-border text-foreground font-bold text-base flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Replay Scenario
        </button>
        <button
          onClick={returnToMenu}
          data-testid="button-menu"
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          <Play className="w-4 h-4" /> Pick Another
        </button>
      </motion.div>
    </motion.div>
  );
}
