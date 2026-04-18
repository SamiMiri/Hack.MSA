import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from './hooks/useGameState';
import { SCENARIOS } from './data/scenarios';
import {
  Coins, Zap, CreditCard, Heart, Play, RotateCcw,
  ArrowRight, TrendingUp, TrendingDown, Trophy, Minus, ChevronRight,
  Sun, Moon
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
  const difficultyColor: Record<string, string> = {
    Easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    Hard: 'text-red-400 bg-red-400/10 border-red-400/30',
  };

  const ratingColor: Record<string, string> = {
    Thriving: 'text-emerald-400',
    Surviving: 'text-amber-400',
    Struggling: 'text-red-400',
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
        {SCENARIOS.map((scenario, idx) => {
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
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-xl font-bold text-foreground leading-tight">{scenario.title}</h2>
                <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${difficultyColor[scenario.difficulty] ?? 'text-muted-foreground bg-muted border-border'}`}>
                  {scenario.difficulty}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{scenario.estimatedTime}</span>
                {best ? (
                  <span className={`text-sm font-bold ${ratingColor[best.rating]}`}>
                    Best: {best.rating}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
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
  max: number;
  format: 'currency' | 'number';
  invertGood?: boolean;
}

const STAT_CONFIGS: StatConfig[] = [
  { key: 'money',     label: 'Money',   icon: Coins,      color: 'text-emerald-400', barColor: 'bg-emerald-400', max: 4000, format: 'currency' },
  { key: 'happiness', label: 'Mood',    icon: Heart,      color: 'text-pink-400',    barColor: 'bg-pink-400',    max: 100,  format: 'number' },
  { key: 'credit',    label: 'Credit',  icon: CreditCard, color: 'text-sky-400',     barColor: 'bg-sky-400',     max: 850,  format: 'number' },
  { key: 'stress',    label: 'Stress',  icon: Zap,        color: 'text-amber-400',   barColor: 'bg-amber-400',   max: 100,  format: 'number', invertGood: true },
];

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
  const pct = Math.min(100, Math.max(0, (value / config.max) * 100));
  const displayValue = config.format === 'currency' ? `$${value.toLocaleString()}` : String(value);

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <div className={`flex items-center gap-1 ${config.color}`}>
          <Icon className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase tracking-wider">{config.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-black text-foreground">{displayValue}</span>
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
      <div className="h-2 w-full bg-white/8 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${config.barColor}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

const CHOICE_COLORS = [
  { base: 'bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20 hover:border-violet-400', label: 'bg-violet-500 text-white', letter: 'A' },
  { base: 'bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/20 hover:border-sky-400', label: 'bg-sky-500 text-white', letter: 'B' },
  { base: 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400', label: 'bg-emerald-500 text-white', letter: 'C' },
  { base: 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400', label: 'bg-amber-500 text-black', letter: 'D' },
];

function GameScreen({ currentScenario, decisionIndex, stats, lastDeltas, lastChoice, gameState, makeChoice, continueGame }: ReturnType<typeof useGameState>) {
  if (!currentScenario) return null;
  const decision = currentScenario.decisions[decisionIndex];
  const total = currentScenario.decisions.length;

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-md mx-auto bg-background">
      {/* HUD */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 pt-4 pb-3">
        <div className="flex gap-3 mb-3">
          {STAT_CONFIGS.map(cfg => (
            <StatRow
              key={cfg.key}
              config={cfg}
              value={stats[cfg.key]}
              delta={lastDeltas?.[cfg.key]}
            />
          ))}
        </div>
        <div className="w-full bg-white/6 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${((decisionIndex) / total) * 100}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{currentScenario.title}</span>
          <span className="text-[11px] text-muted-foreground font-semibold">{decisionIndex + 1} / {total}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {gameState === 'playing' ? (
            <motion.div
              key={`decision-${decision.id}`}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="p-5 pt-7 pb-10"
            >
              <p className="text-2xl font-bold text-foreground leading-snug mb-8">{decision.prompt}</p>

              <div className="space-y-3">
                {decision.choices.map((choice, i) => {
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
                      <span className="text-base font-semibold text-foreground leading-snug pt-0.5">{choice.text}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`consequence-${decision.id}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="p-5 pt-7 pb-10 flex flex-col gap-5"
            >
              <div className="bg-card border border-card-border rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary rounded-l-2xl" />
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">What happened</p>
                <p className="text-xl font-bold text-foreground leading-snug">{lastChoice?.consequenceText}</p>
              </div>

              {lastChoice && (
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.entries(lastChoice.deltas) as [string, number][])
                    .filter(([, v]) => v !== 0)
                    .map(([key, val]) => {
                      const cfg = STAT_CONFIGS.find(s => s.key === key);
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
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
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

function OutcomeScreen({ stats, currentScenario, calculateRating, history, returnToMenu, startGame }: ReturnType<typeof useGameState>) {
  if (!currentScenario) return null;
  const rating = calculateRating(stats);

  const ratingConfig = {
    Thriving: { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', bar: 'bg-emerald-400', icon: Trophy, subtitle: 'You nailed it. Genuinely.' },
    Surviving: { color: 'text-amber-400',  bg: 'bg-amber-400/10 border-amber-400/20',   bar: 'bg-amber-400',  icon: RotateCcw, subtitle: 'Could be worse. Could be better.' },
    Struggling: { color: 'text-red-400',   bg: 'bg-red-400/10 border-red-400/20',        bar: 'bg-red-400',    icon: Zap, subtitle: 'Life is hard. You\'ll learn.' },
  }[rating];

  const RatingIcon = ratingConfig.icon;

  const badChoices = history.filter(c =>
    (c.deltas.stress && c.deltas.stress > 15) ||
    (c.deltas.money && c.deltas.money < -200) ||
    (c.deltas.credit && c.deltas.credit < 0)
  ).slice(0, 3);

  const statSummary = [
    { ...STAT_CONFIGS[0], value: stats.money },
    { ...STAT_CONFIGS[1], value: stats.happiness },
    { ...STAT_CONFIGS[2], value: stats.credit },
    { ...STAT_CONFIGS[3], value: stats.stress },
  ];

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
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Final Result</p>
          <h1 className={`text-6xl font-black uppercase tracking-tight leading-none mb-2 ${ratingConfig.color}`}>
            {rating}
          </h1>
          <p className="text-muted-foreground text-base">{ratingConfig.subtitle}</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-card-border rounded-2xl p-5 mb-4"
      >
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Final Stats</p>
        <div className="space-y-4">
          {statSummary.map((s, i) => (
            <StatRow key={s.key} config={s} value={s.value} />
          ))}
        </div>
      </motion.div>

      {badChoices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-card-border rounded-2xl p-5 mb-6"
        >
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Lessons Learned</p>
          <ul className="space-y-3">
            {badChoices.map((c, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
                  <Minus className="w-3 h-3 text-amber-400" />
                </span>
                <span className="text-foreground/80 leading-relaxed">
                  <span className="font-semibold text-foreground">{c.text}</span> — {c.consequenceText}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

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
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
        <button
          onClick={returnToMenu}
          data-testid="button-menu"
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          <Play className="w-4 h-4" /> New Scenario
        </button>
      </motion.div>
    </motion.div>
  );
}
