import React, { createContext, useCallback, useContext, useState } from "react";

export type TabName = "home" | "learn" | "simulate" | "tools" | "progress" | "settings";

export type AppScreen =
  | { name: "start" }
  | { name: "onboarding" }
  | { name: "tabs" }
  | { name: "track"; trackId: string }
  | { name: "lesson"; trackId: string; lessonId: string }
  | { name: "sim-character-select" }
  | { name: "sim-game" }
  | { name: "sim-outcome" };

interface NavContextType {
  screen: AppScreen;
  activeTab: TabName;
  navigate: (screen: AppScreen) => void;
  replace: (screen: AppScreen) => void;
  goBack: () => void;
  setActiveTab: (tab: TabName) => void;
}

const NavContext = createContext<NavContextType | null>(null);

export function NavigationProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial: AppScreen;
}) {
  const [screen, setScreen] = useState<AppScreen>(initial);
  const [history, setHistory] = useState<AppScreen[]>([]);
  const [activeTab, setActiveTab] = useState<TabName>("home");

  const navigate = useCallback((next: AppScreen) => {
    setHistory((h) => [...h, screen]);
    setScreen(next);
  }, [screen]);

  const replace = useCallback((next: AppScreen) => {
    setScreen(next);
  }, []);

  const goBack = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setScreen(prev);
      return h.slice(0, -1);
    });
  }, []);

  return (
    <NavContext.Provider value={{ screen, activeTab, navigate, replace, goBack, setActiveTab }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside NavigationProvider");
  return ctx;
}
