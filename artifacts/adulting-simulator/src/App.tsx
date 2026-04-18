import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from './hooks/useGameState';
import { SCENARIOS } from './data/scenarios';
import { Coins, Activity, CreditCard, Smile, ChevronRight, Play, RotateCcw, AlertCircle, ArrowRight, ShieldCheck, Frown, CheckCircle2 } from 'lucide-react';

export default function App() {
  const gameState = useGameState();

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary selection:text-primary-foreground">
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
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[100dvh] p-6 max-w-lg mx-auto"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-3 uppercase">Adulting Simulator</h1>
        <p className="text-muted-foreground text-lg">Make choices. Face consequences. Try to survive.</p>
      </div>

      <div className="w-full space-y-4">
        {SCENARIOS.map(scenario => (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            key={scenario.id}
            onClick={() => startGame(scenario.id)}
            className="group cursor-pointer bg-card border-2 border-border hover:border-primary rounded-2xl p-5 shadow-sm transition-all relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-bold group-hover:text-primary transition-colors">{scenario.title}</h2>
              <div className="bg-muted px-2 py-1 rounded text-xs font-semibold text-muted-foreground">
                {scenario.difficulty}
              </div>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <Activity className="w-4 h-4 mr-1" />
              <span>{scenario.estimatedTime}</span>
            </div>

            {bestScores[scenario.id] && (
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Best Run</span>
                <span className={`text-sm font-bold ${
                  bestScores[scenario.id].rating === 'Thriving' ? 'text-success' : 
                  bestScores[scenario.id].rating === 'Surviving' ? 'text-warning' : 'text-destructive'
                }`}>
                  {bestScores[scenario.id].rating}
                </span>
              </div>
            )}
            
            <div className="absolute right-4 bottom-5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
              <Play className="w-6 h-6 text-primary fill-primary" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function StatBar({ icon: Icon, value, label, delta, invertGoodBad = false, format = 'number' }: { icon: any, value: number, label: string, delta?: number, invertGoodBad?: boolean, format?: 'currency' | 'number' }) {
  const isPositive = delta ? delta > 0 : false;
  const isGood = invertGoodBad ? !isPositive : isPositive;
  const hasChanged = delta !== undefined && delta !== 0;

  const displayValue = format === 'currency' ? `$${value.toLocaleString()}` : value;
  const displayDelta = format === 'currency' ? `$${Math.abs(delta || 0)}` : Math.abs(delta || 0);

  return (
    <div className="flex flex-col relative overflow-hidden bg-card border border-border rounded-xl p-3 shadow-sm">
      <div className="flex items-center space-x-2 mb-1 opacity-70">
        <Icon className="w-4 h-4" />
        <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-black tracking-tight">{displayValue}</div>
      
      <AnimatePresence>
        {hasChanged && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute top-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded ${isGood ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}
          >
            {delta > 0 ? '+' : '-'}{displayDelta}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GameScreen({ currentScenario, decisionIndex, stats, lastDeltas, lastChoice, gameState, makeChoice, continueGame }: ReturnType<typeof useGameState>) {
  if (!currentScenario) return null;
  const decision = currentScenario.decisions[decisionIndex];

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-lg mx-auto bg-background relative">
      {/* HUD */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md p-4 pb-2 grid grid-cols-2 gap-2 border-b border-border">
        <StatBar icon={Coins} value={stats.money} label="Money" format="currency" delta={lastDeltas?.money} />
        <StatBar icon={Activity} value={stats.stress} label="Stress" invertGoodBad delta={lastDeltas?.stress} />
        <StatBar icon={CreditCard} value={stats.credit} label="Credit" delta={lastDeltas?.credit} />
        <StatBar icon={Smile} value={stats.happiness} label="Mood" delta={lastDeltas?.happiness} />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          {gameState === 'playing' ? (
            <motion.div 
              key={`decision-${decision.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
                Month {decisionIndex + 1} of {currentScenario.decisions.length}
              </div>
              <h2 className="text-2xl font-bold leading-snug">{decision.prompt}</h2>
              
              <div className="space-y-3 mt-8">
                {decision.choices.map((choice, i) => (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.1 } }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={choice.id}
                    onClick={() => makeChoice(choice)}
                    className="w-full text-left p-4 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <span className="font-semibold text-lg">{choice.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={`consequence-${decision.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col h-full justify-center space-y-6 pt-10"
            >
              <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">The Result</h3>
                <p className="text-2xl font-bold leading-tight">{lastChoice?.consequenceText}</p>
                
                <div className="mt-6 grid grid-cols-2 gap-2">
                  {lastChoice?.deltas.money ? (
                    <div className={`p-2 rounded font-bold text-sm ${lastChoice.deltas.money > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {lastChoice.deltas.money > 0 ? '+' : '-'}${Math.abs(lastChoice.deltas.money)} Money
                    </div>
                  ) : null}
                  {lastChoice?.deltas.stress ? (
                    <div className={`p-2 rounded font-bold text-sm ${lastChoice.deltas.stress < 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {lastChoice.deltas.stress > 0 ? '+' : '-'}{Math.abs(lastChoice.deltas.stress)} Stress
                    </div>
                  ) : null}
                  {lastChoice?.deltas.credit ? (
                    <div className={`p-2 rounded font-bold text-sm ${lastChoice.deltas.credit > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {lastChoice.deltas.credit > 0 ? '+' : '-'}{Math.abs(lastChoice.deltas.credit)} Credit
                    </div>
                  ) : null}
                  {lastChoice?.deltas.happiness ? (
                    <div className={`p-2 rounded font-bold text-sm ${lastChoice.deltas.happiness > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {lastChoice.deltas.happiness > 0 ? '+' : '-'}{Math.abs(lastChoice.deltas.happiness)} Mood
                    </div>
                  ) : null}
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={continueGame}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center shadow-md"
              >
                Continue <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OutcomeScreen({ stats, currentScenario, calculateRating, history, returnToMenu }: ReturnType<typeof useGameState>) {
  if (!currentScenario) return null;
  const rating = calculateRating(stats);

  const badChoices = history.filter(c => 
    (c.deltas.stress && c.deltas.stress > 15) || 
    (c.deltas.money && c.deltas.money < -200) || 
    (c.deltas.credit && c.deltas.credit < 0)
  ).slice(0, 2);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-[100dvh] p-6 max-w-lg mx-auto overflow-y-auto pb-24"
    >
      <div className="text-center mt-10 mb-8">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4"
        >
          {rating === 'Thriving' ? <ShieldCheck className="w-10 h-10 text-success" /> : 
           rating === 'Surviving' ? <CheckCircle2 className="w-10 h-10 text-warning" /> : 
           <Frown className="w-10 h-10 text-destructive" />}
        </motion.div>
        
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Final Evaluation</h2>
        <h1 className={`text-5xl font-black uppercase tracking-tight ${
          rating === 'Thriving' ? 'text-success' : 
          rating === 'Surviving' ? 'text-warning' : 'text-destructive'
        }`}>
          {rating}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-card border-2 border-border rounded-xl p-4 text-center">
          <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Final Savings</div>
          <div className="text-2xl font-black">${stats.money.toLocaleString()}</div>
        </div>
        <div className="bg-card border-2 border-border rounded-xl p-4 text-center">
          <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Credit Score</div>
          <div className="text-2xl font-black">{stats.credit}</div>
        </div>
        <div className="bg-card border-2 border-border rounded-xl p-4 text-center">
          <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Stress Level</div>
          <div className="text-2xl font-black">{stats.stress}%</div>
        </div>
        <div className="bg-card border-2 border-border rounded-xl p-4 text-center">
          <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Happiness</div>
          <div className="text-2xl font-black">{stats.happiness}%</div>
        </div>
      </div>

      {badChoices.length > 0 && (
        <div className="bg-destructive/5 border-2 border-destructive/20 rounded-2xl p-5 mb-8">
          <h3 className="font-bold text-destructive mb-3 flex items-center"><AlertCircle className="w-5 h-5 mr-2" /> Lessons Learned</h3>
          <ul className="space-y-3">
            {badChoices.map((c, i) => (
              <li key={i} className="text-sm font-medium text-foreground/80 leading-relaxed">
                <span className="font-bold text-destructive">Mistake:</span> Choosing "{c.text}" felt like {c.consequenceText.toLowerCase()}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto space-y-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={returnToMenu}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center shadow-md"
        >
          <RotateCcw className="w-5 h-5 mr-2" /> Play Another Scenario
        </motion.button>
      </div>
    </motion.div>
  );
}