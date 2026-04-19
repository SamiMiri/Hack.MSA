import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface UserProfile {
  stage: string;
  biggestNeed: string;
  goal: string;
  name: string;
}

export interface LessonProgress {
  trackId: string;
  lessonId: string;
  completedAt: string;
  score: number;
}

export interface BudgetItem {
  id: string;
  category: string;
  label: string;
  amount: number;
  type: "income" | "expense";
}

export interface TaxDocument {
  id: string;
  name: string;
  description: string;
  received: boolean;
  dueDate?: string;
}

export interface LeaseCheckItem {
  id: string;
  category: string;
  label: string;
  checked: boolean;
  note?: string;
}

interface AppContextType {
  onboardingComplete: boolean;
  resetApp: () => void;
  profile: UserProfile | null;
  completedLessons: LessonProgress[];
  budgetItems: BudgetItem[];
  taxDocuments: TaxDocument[];
  leaseChecklist: LeaseCheckItem[];
  coins: number;
  unlockedTracks: string[];
  unlockedScenarios: string[];
  completeOnboarding: (profile: UserProfile) => void;
  completeLesson: (progress: LessonProgress) => void;
  updateBudgetItems: (items: BudgetItem[]) => void;
  toggleTaxDocument: (id: string) => void;
  toggleLeaseItem: (id: string) => void;
  isLessonComplete: (lessonId: string) => boolean;
  getTrackProgress: (trackId: string, totalLessons: number) => number;
  addCoins: (amount: number) => void;
  purchaseTrack: (trackId: string, price: number) => boolean;
  purchaseScenario: (scenarioId: string, price: number) => boolean;
  isTrackUnlocked: (trackId: string) => boolean;
  isScenarioUnlocked: (scenarioId: string) => boolean;
}

const DEFAULT_TAX_DOCS: TaxDocument[] = [
  { id: "w2", name: "W-2 Form", description: "From your employer — arrives by Jan 31", received: false, dueDate: "Jan 31" },
  { id: "1099-nec", name: "1099-NEC", description: "From freelance/gig clients ($600+)", received: false, dueDate: "Jan 31" },
  { id: "1098-e", name: "1098-E", description: "Student loan interest statement", received: false, dueDate: "Jan 31" },
  { id: "1095-a", name: "1095-A", description: "Health insurance marketplace form", received: false, dueDate: "Jan 31" },
  { id: "ssn", name: "Social Security Number", description: "Your SSN or Individual Taxpayer ID", received: false },
  { id: "bank-info", name: "Bank Account Info", description: "Routing & account number for direct deposit refund", received: false },
  { id: "last-return", name: "Last Year's Tax Return", description: "For reference — helps catch mistakes", received: false },
];

const DEFAULT_LEASE_CHECKLIST: LeaseCheckItem[] = [
  { id: "l1", category: "Before Signing", label: "Read the entire lease (every page)", checked: false },
  { id: "l2", category: "Before Signing", label: "Check lease end date and renewal terms", checked: false },
  { id: "l3", category: "Before Signing", label: "Understand early termination fees", checked: false },
  { id: "l4", category: "Before Signing", label: "Clarify what utilities are included", checked: false },
  { id: "l5", category: "Before Signing", label: "Ask about pet policy and fees", checked: false },
  { id: "l6", category: "Before Signing", label: "Verify security deposit amount and return policy", checked: false },
  { id: "l7", category: "Move-In", label: "Do a full walkthrough and document all damage", checked: false },
  { id: "l8", category: "Move-In", label: "Take timestamped photos of every room", checked: false },
  { id: "l9", category: "Move-In", label: "Test all appliances, locks, and outlets", checked: false },
  { id: "l10", category: "Move-In", label: "Get all damage documented in writing", checked: false },
  { id: "l11", category: "Ongoing", label: "Know your landlord's maintenance contact", checked: false },
  { id: "l12", category: "Ongoing", label: "Set up rent payment reminder", checked: false },
  { id: "l13", category: "Ongoing", label: "Get renter's insurance (usually $10-15/month)", checked: false },
];

const DEFAULT_BUDGET_ITEMS: BudgetItem[] = [
  { id: "i1", category: "Income", label: "Monthly Salary (After Tax)", amount: 3000, type: "income" },
  { id: "e1", category: "Housing", label: "Rent", amount: 1100, type: "expense" },
  { id: "e2", category: "Housing", label: "Utilities", amount: 80, type: "expense" },
  { id: "e3", category: "Food", label: "Groceries", amount: 300, type: "expense" },
  { id: "e4", category: "Food", label: "Dining Out", amount: 150, type: "expense" },
  { id: "e5", category: "Transport", label: "Gas / Transit", amount: 120, type: "expense" },
  { id: "e6", category: "Subscriptions", label: "Streaming Services", amount: 45, type: "expense" },
  { id: "e7", category: "Savings", label: "Emergency Fund", amount: 200, type: "expense" },
];

const KEYS = {
  ONBOARDING: "adulting_onboarding",
  PROFILE: "adulting_profile",
  COMPLETED_LESSONS: "adulting_completed_lessons",
  BUDGET_ITEMS: "adulting_budget_items",
  TAX_DOCUMENTS: "adulting_tax_documents",
  LEASE_CHECKLIST: "adulting_lease_checklist",
  COINS: "adulting_coins",
  UNLOCKED_TRACKS: "adulting_unlocked_tracks",
  UNLOCKED_SCENARIOS: "adulting_unlocked_scenarios",
};

function get<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [onboardingComplete, setOnboardingComplete] = useState(() => !!localStorage.getItem(KEYS.ONBOARDING));
  const [profile, setProfile] = useState<UserProfile | null>(() => get(KEYS.PROFILE, null));
  const [completedLessons, setCompletedLessons] = useState<LessonProgress[]>(() => get(KEYS.COMPLETED_LESSONS, []));
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() => get(KEYS.BUDGET_ITEMS, DEFAULT_BUDGET_ITEMS));
  const [taxDocuments, setTaxDocuments] = useState<TaxDocument[]>(() => get(KEYS.TAX_DOCUMENTS, DEFAULT_TAX_DOCS));
  const [leaseChecklist, setLeaseChecklist] = useState<LeaseCheckItem[]>(() => get(KEYS.LEASE_CHECKLIST, DEFAULT_LEASE_CHECKLIST));
  const [coins, setCoins] = useState<number>(() => get(KEYS.COINS, 0));
  const [unlockedTracks, setUnlockedTracks] = useState<string[]>(() => get(KEYS.UNLOCKED_TRACKS, []));
  const [unlockedScenarios, setUnlockedScenarios] = useState<string[]>(() => get(KEYS.UNLOCKED_SCENARIOS, []));

  const completeOnboarding = useCallback((p: UserProfile) => {
    setProfile(p);
    setOnboardingComplete(true);
    localStorage.setItem(KEYS.ONBOARDING, "true");
    set(KEYS.PROFILE, p);
  }, []);

  const completeLesson = useCallback((progress: LessonProgress) => {
    setCompletedLessons((prev) => {
      const alreadyDone = prev.some((l) => l.lessonId === progress.lessonId);
      const updated = [...prev.filter((l) => l.lessonId !== progress.lessonId), progress];
      set(KEYS.COMPLETED_LESSONS, updated);
      if (!alreadyDone) {
        const earned = 10 + (progress.score >= 80 ? 5 : 0);
        setCoins((c) => {
          const next = c + earned;
          set(KEYS.COINS, next);
          return next;
        });
      }
      return updated;
    });
  }, []);

  const updateBudgetItems = useCallback((items: BudgetItem[]) => {
    setBudgetItems(items);
    set(KEYS.BUDGET_ITEMS, items);
  }, []);

  const toggleTaxDocument = useCallback((id: string) => {
    setTaxDocuments((prev) => {
      const updated = prev.map((d) => d.id === id ? { ...d, received: !d.received } : d);
      set(KEYS.TAX_DOCUMENTS, updated);
      return updated;
    });
  }, []);

  const toggleLeaseItem = useCallback((id: string) => {
    setLeaseChecklist((prev) => {
      const updated = prev.map((item) => item.id === id ? { ...item, checked: !item.checked } : item);
      set(KEYS.LEASE_CHECKLIST, updated);
      return updated;
    });
  }, []);

  const isLessonComplete = useCallback((lessonId: string) => completedLessons.some((l) => l.lessonId === lessonId), [completedLessons]);

  const getTrackProgress = useCallback((trackId: string, totalLessons: number) => {
    const done = completedLessons.filter((l) => l.trackId === trackId).length;
    return totalLessons > 0 ? done / totalLessons : 0;
  }, [completedLessons]);

  const addCoins = useCallback((amount: number) => {
    setCoins((prev) => {
      const next = prev + amount;
      set(KEYS.COINS, next);
      return next;
    });
  }, []);

  const purchaseTrack = useCallback((trackId: string, price: number): boolean => {
    if (coins < price) return false;
    const newCoins = coins - price;
    const newTracks = [...unlockedTracks, trackId];
    setCoins(newCoins);
    setUnlockedTracks(newTracks);
    set(KEYS.COINS, newCoins);
    set(KEYS.UNLOCKED_TRACKS, newTracks);
    return true;
  }, [coins, unlockedTracks]);

  const purchaseScenario = useCallback((scenarioId: string, price: number): boolean => {
    if (coins < price) return false;
    const newCoins = coins - price;
    const newScenarios = [...unlockedScenarios, scenarioId];
    setCoins(newCoins);
    setUnlockedScenarios(newScenarios);
    set(KEYS.COINS, newCoins);
    set(KEYS.UNLOCKED_SCENARIOS, newScenarios);
    return true;
  }, [coins, unlockedScenarios]);

  const isTrackUnlocked = useCallback((trackId: string) => unlockedTracks.includes(trackId), [unlockedTracks]);
  const isScenarioUnlocked = useCallback((scenarioId: string) => unlockedScenarios.includes(scenarioId), [unlockedScenarios]);

  const resetApp = useCallback(() => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    setOnboardingComplete(false);
    setProfile(null);
    setCompletedLessons([]);
    setBudgetItems(DEFAULT_BUDGET_ITEMS);
    setTaxDocuments(DEFAULT_TAX_DOCS);
    setLeaseChecklist(DEFAULT_LEASE_CHECKLIST);
    setCoins(0);
    setUnlockedTracks([]);
    setUnlockedScenarios([]);
  }, []);

  return (
    <AppContext.Provider value={{
      onboardingComplete, resetApp, profile, completedLessons, budgetItems, taxDocuments,
      leaseChecklist, coins, unlockedTracks, unlockedScenarios, completeOnboarding,
      completeLesson, updateBudgetItems, toggleTaxDocument, toggleLeaseItem,
      isLessonComplete, getTrackProgress, addCoins, purchaseTrack, purchaseScenario,
      isTrackUnlocked, isScenarioUnlocked,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
