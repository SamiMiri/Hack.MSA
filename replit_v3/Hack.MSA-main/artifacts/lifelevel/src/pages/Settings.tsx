import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Sun, Moon, Monitor, ChevronRight, RotateCcw, Info, User } from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  student: "Still in school",
  "new-grad": "Just graduated",
  working: "Working, figuring things out",
  independent: "Living independently",
};

type ThemeMode = "light" | "dark" | "system";

export default function SettingsPage() {
  const { profile, resetApp, coins, completedLessons } = useApp();
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem("adulting_theme") as ThemeMode) ?? "system";
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const applyTheme = (mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem("adulting_theme", mode);
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else if (mode === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  };

  const handleReset = () => {
    setShowResetConfirm(false);
    resetApp();
  };

  const themeOptions: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { mode: "light", label: "Light", Icon: Sun },
    { mode: "dark", label: "Dark", Icon: Moon },
    { mode: "system", label: "System", Icon: Monitor },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-24">
      <div className="px-5 pt-8 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Settings</h1>
      </div>

      {/* Profile card */}
      {profile && (
        <div className="mx-5 mb-4 rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: "var(--primary)" }}>
              <User size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-foreground">{profile.name || "You"}</div>
              <div className="text-sm text-muted-foreground">{STAGE_LABELS[profile.stage] ?? profile.stage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mx-5 mb-5 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border bg-card p-4 text-center">
          <div className="text-3xl font-extrabold text-foreground">{completedLessons.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Lessons Completed</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 text-center">
          <div className="text-3xl font-extrabold text-amber-600">⭐ {coins}</div>
          <div className="text-xs text-muted-foreground mt-1">Skill Coins</div>
        </div>
      </div>

      {/* Appearance */}
      <div className="px-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">APPEARANCE</p>
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="flex">
            {themeOptions.map(({ mode, label, Icon }) => (
              <button
                key={mode}
                onClick={() => applyTheme(mode)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-4 transition-all ${theme === mode ? "bg-primary/10" : ""}`}
              >
                <Icon size={20} className={theme === mode ? "text-primary" : "text-muted-foreground"} />
                <span className={`text-xs font-semibold ${theme === mode ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* About */}
      <div className="px-5 mt-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">ABOUT</p>
        <div className="rounded-2xl border bg-card overflow-hidden">
          {[
            { icon: Info, label: "Version", value: "1.0.0 · 2026.04" },
          ].map(({ icon: Icon, label, value }, i, arr) => (
            <div key={label} className={`flex items-center gap-3 px-4 py-3.5 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--primary)" + "18" }}>
                <Icon size={16} style={{ color: "var(--primary)" }} />
              </div>
              <span className="text-sm font-medium text-foreground flex-1">{label}</span>
              <span className="text-sm text-muted-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="px-5 mt-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">DANGER ZONE</p>
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-card overflow-hidden">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-950/30">
              <RotateCcw size={16} className="text-red-500" />
            </div>
            <span className="text-sm font-medium text-red-500 flex-1 text-left">Reset All Data</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 px-1">This will clear all your progress, coins, and settings.</p>
      </div>

      {/* Reset confirm dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-card rounded-t-3xl p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-xl font-bold text-foreground">Reset All Data?</h3>
            <p className="text-sm text-muted-foreground">This will permanently erase all your progress, coins, and settings. This cannot be undone.</p>
            <div className="flex gap-2.5">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3.5 rounded-2xl bg-muted font-bold text-foreground">Cancel</button>
              <button onClick={handleReset} className="flex-1 py-3.5 rounded-2xl bg-red-500 font-bold text-white">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
