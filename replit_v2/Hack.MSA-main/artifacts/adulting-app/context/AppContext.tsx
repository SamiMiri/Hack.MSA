import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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
  resetApp: () => Promise<void>;
  profile: UserProfile | null;
  completedLessons: LessonProgress[];
  budgetItems: BudgetItem[];
  taxDocuments: TaxDocument[];
  leaseChecklist: LeaseCheckItem[];
  coins: number;
  unlockedTracks: string[];
  unlockedScenarios: string[];
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  completeLesson: (progress: LessonProgress) => Promise<void>;
  updateBudgetItems: (items: BudgetItem[]) => Promise<void>;
  toggleTaxDocument: (id: string) => Promise<void>;
  toggleLeaseItem: (id: string) => Promise<void>;
  isLessonComplete: (lessonId: string) => boolean;
  getTrackProgress: (trackId: string, totalLessons: number) => number;
  addCoins: (amount: number) => Promise<void>;
  purchaseTrack: (trackId: string, price: number) => Promise<boolean>;
  purchaseScenario: (scenarioId: string, price: number) => Promise<boolean>;
  isTrackUnlocked: (trackId: string) => boolean;
  isScenarioUnlocked: (scenarioId: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_TAX_DOCS: TaxDocument[] = [
  {
    id: "w2",
    name: "W-2 Form",
    description: "From your employer — arrives by Jan 31",
    received: false,
    dueDate: "Jan 31",
  },
  {
    id: "1099-nec",
    name: "1099-NEC",
    description: "From freelance/gig clients ($600+)",
    received: false,
    dueDate: "Jan 31",
  },
  {
    id: "1098-e",
    name: "1098-E",
    description: "Student loan interest statement",
    received: false,
    dueDate: "Jan 31",
  },
  {
    id: "1095-a",
    name: "1095-A",
    description: "Health insurance marketplace form",
    received: false,
    dueDate: "Jan 31",
  },
  {
    id: "ssn",
    name: "Social Security Number",
    description: "Your SSN or Individual Taxpayer ID",
    received: false,
  },
  {
    id: "bank-info",
    name: "Bank Account Info",
    description: "Routing & account number for direct deposit refund",
    received: false,
  },
  {
    id: "last-return",
    name: "Last Year's Tax Return",
    description: "For reference — helps catch mistakes",
    received: false,
  },
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

const STORAGE_KEYS = {
  ONBOARDING: "@adulting_onboarding",
  PROFILE: "@adulting_profile",
  COMPLETED_LESSONS: "@adulting_completed_lessons",
  BUDGET_ITEMS: "@adulting_budget_items",
  TAX_DOCUMENTS: "@adulting_tax_documents",
  LEASE_CHECKLIST: "@adulting_lease_checklist",
  COINS: "@adulting_coins",
  UNLOCKED_TRACKS: "@adulting_unlocked_tracks",
  UNLOCKED_SCENARIOS: "@adulting_unlocked_scenarios",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [completedLessons, setCompletedLessons] = useState<LessonProgress[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(DEFAULT_BUDGET_ITEMS);
  const [taxDocuments, setTaxDocuments] = useState<TaxDocument[]>(DEFAULT_TAX_DOCS);
  const [leaseChecklist, setLeaseChecklist] = useState<LeaseCheckItem[]>(DEFAULT_LEASE_CHECKLIST);
  const [coins, setCoins] = useState(0);
  const [unlockedTracks, setUnlockedTracks] = useState<string[]>([]);
  const [unlockedScenarios, setUnlockedScenarios] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [onb, prof, lessons, budget, taxes, lease, savedCoins, savedTracks, savedScenarios] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_LESSONS),
        AsyncStorage.getItem(STORAGE_KEYS.BUDGET_ITEMS),
        AsyncStorage.getItem(STORAGE_KEYS.TAX_DOCUMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.LEASE_CHECKLIST),
        AsyncStorage.getItem(STORAGE_KEYS.COINS),
        AsyncStorage.getItem(STORAGE_KEYS.UNLOCKED_TRACKS),
        AsyncStorage.getItem(STORAGE_KEYS.UNLOCKED_SCENARIOS),
      ]);
      if (onb) setOnboardingComplete(true);
      if (prof) setProfile(JSON.parse(prof));
      if (lessons) setCompletedLessons(JSON.parse(lessons));
      if (budget) setBudgetItems(JSON.parse(budget));
      if (taxes) setTaxDocuments(JSON.parse(taxes));
      if (lease) setLeaseChecklist(JSON.parse(lease));
      if (savedCoins) setCoins(parseInt(savedCoins, 10));
      if (savedTracks) setUnlockedTracks(JSON.parse(savedTracks));
      if (savedScenarios) setUnlockedScenarios(JSON.parse(savedScenarios));
    })();
  }, []);

  const completeOnboarding = useCallback(async (p: UserProfile) => {
    setProfile(p);
    setOnboardingComplete(true);
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, "true");
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(p));
  }, []);

  const completeLesson = useCallback(
    async (progress: LessonProgress) => {
      const alreadyDone = completedLessons.some((l) => l.lessonId === progress.lessonId);
      const updated = [
        ...completedLessons.filter((l) => l.lessonId !== progress.lessonId),
        progress,
      ];
      setCompletedLessons(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(updated));

      if (!alreadyDone) {
        const earned = 10 + (progress.score >= 80 ? 5 : 0);
        const newCoins = coins + earned;
        setCoins(newCoins);
        await AsyncStorage.setItem(STORAGE_KEYS.COINS, String(newCoins));
      }
    },
    [completedLessons, coins]
  );

  const updateBudgetItems = useCallback(async (items: BudgetItem[]) => {
    setBudgetItems(items);
    await AsyncStorage.setItem(STORAGE_KEYS.BUDGET_ITEMS, JSON.stringify(items));
  }, []);

  const toggleTaxDocument = useCallback(
    async (id: string) => {
      const updated = taxDocuments.map((d) =>
        d.id === id ? { ...d, received: !d.received } : d
      );
      setTaxDocuments(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.TAX_DOCUMENTS, JSON.stringify(updated));
    },
    [taxDocuments]
  );

  const toggleLeaseItem = useCallback(
    async (id: string) => {
      const updated = leaseChecklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      setLeaseChecklist(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.LEASE_CHECKLIST, JSON.stringify(updated));
    },
    [leaseChecklist]
  );

  const isLessonComplete = useCallback(
    (lessonId: string) => completedLessons.some((l) => l.lessonId === lessonId),
    [completedLessons]
  );

  const getTrackProgress = useCallback(
    (trackId: string, totalLessons: number) => {
      const done = completedLessons.filter((l) => l.trackId === trackId).length;
      return totalLessons > 0 ? done / totalLessons : 0;
    },
    [completedLessons]
  );

  const addCoins = useCallback(async (amount: number) => {
    setCoins((prev) => {
      const next = prev + amount;
      AsyncStorage.setItem(STORAGE_KEYS.COINS, String(next));
      return next;
    });
  }, []);

  const purchaseTrack = useCallback(
    async (trackId: string, price: number): Promise<boolean> => {
      if (coins < price) return false;
      const newCoins = coins - price;
      const newTracks = [...unlockedTracks, trackId];
      setCoins(newCoins);
      setUnlockedTracks(newTracks);
      await AsyncStorage.setItem(STORAGE_KEYS.COINS, String(newCoins));
      await AsyncStorage.setItem(STORAGE_KEYS.UNLOCKED_TRACKS, JSON.stringify(newTracks));
      return true;
    },
    [coins, unlockedTracks]
  );

  const purchaseScenario = useCallback(
    async (scenarioId: string, price: number): Promise<boolean> => {
      if (coins < price) return false;
      const newCoins = coins - price;
      const newScenarios = [...unlockedScenarios, scenarioId];
      setCoins(newCoins);
      setUnlockedScenarios(newScenarios);
      await AsyncStorage.setItem(STORAGE_KEYS.COINS, String(newCoins));
      await AsyncStorage.setItem(STORAGE_KEYS.UNLOCKED_SCENARIOS, JSON.stringify(newScenarios));
      return true;
    },
    [coins, unlockedScenarios]
  );

  const isTrackUnlocked = useCallback(
    (trackId: string) => unlockedTracks.includes(trackId),
    [unlockedTracks]
  );

  const isScenarioUnlocked = useCallback(
    (scenarioId: string) => unlockedScenarios.includes(scenarioId),
    [unlockedScenarios]
  );

  const resetApp = useCallback(async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
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
    <AppContext.Provider
      value={{
        onboardingComplete,
        resetApp,
        profile,
        completedLessons,
        budgetItems,
        taxDocuments,
        leaseChecklist,
        coins,
        unlockedTracks,
        unlockedScenarios,
        completeOnboarding,
        completeLesson,
        updateBudgetItems,
        toggleTaxDocument,
        toggleLeaseItem,
        isLessonComplete,
        getTrackProgress,
        addCoins,
        purchaseTrack,
        purchaseScenario,
        isTrackUnlocked,
        isScenarioUnlocked,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
