import { Link } from "wouter";
import { useApp } from "@/context/AppContext";
import { tracks } from "@/data/tracks";
import { CreditCard, Home as HomeIcon, FileText, DollarSign, Mail, ChevronRight, BookOpen, Gamepad2 } from "lucide-react";

const DEADLINES = [
  { id: "1", label: "Tax filing deadline", date: "Apr 15", icon: FileText, color: "#4ECDC4" },
  { id: "2", label: "Q1 estimated taxes (self-employed)", date: "Apr 15", icon: DollarSign, color: "#FF6B6B" },
  { id: "3", label: "W-2s & 1099s should arrive", date: "Jan 31", icon: Mail, color: "#A29BFE" },
];

const QUICK_TOOLS = [
  { icon: "sliders", label: "Budget", color: "#FF6B6B", href: "/tools?tab=budget" },
  { icon: "home", label: "Lease Checklist", color: "#A29BFE", href: "/tools?tab=lease" },
  { icon: "file-text", label: "Tax Doc Tracker", color: "#4ECDC4", href: "/tools?tab=tax" },
];

const ICON_MAP: Record<string, string> = {
  "credit-card": "💳",
  "file-text": "📄",
  "shield": "🛡️",
  "home": "🏠",
  "briefcase": "💼",
  "heart": "❤️",
  "trending-up": "📈",
};

export default function HomePage() {
  const { completedLessons, getTrackProgress, profile } = useApp();

  const totalLessons = tracks.reduce((sum, t) => sum + t.lessonsCount, 0);
  const completedCount = completedLessons.length;
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const greetings: Record<string, string> = {
    student: "Still in school",
    "new-grad": "Just graduated",
    working: "Working it out",
    independent: "Living independently",
  };

  return (
    <div className="flex-1 overflow-y-auto w-full bg-background pb-24">
      {/* Hero */}
      <div className="px-5 pt-8 pb-4">
        <p className="text-sm font-medium text-muted-foreground mb-1">
          {profile?.stage ? greetings[profile.stage] ?? "Welcome" : "Welcome back"}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-5">
          Let's get adulting
        </h1>

        {/* Stats card */}
        <div className="rounded-2xl p-5 mb-1" style={{ background: "var(--primary)" }}>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-white">{completedCount}</div>
              <div className="text-xs text-white/75 mt-1">Lessons done</div>
            </div>
            <div className="w-px h-9 bg-white/25" />
            <div className="text-center">
              <div className="text-3xl font-extrabold text-white">{overallPct}%</div>
              <div className="text-xs text-white/75 mt-1">Overall progress</div>
            </div>
            <div className="w-px h-9 bg-white/25" />
            <div className="text-center">
              <div className="text-3xl font-extrabold text-white">{tracks.length}</div>
              <div className="text-xs text-white/75 mt-1">Skill tracks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Skill Tracks */}
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">Skill Tracks</h2>
          <Link href="/learn" className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
            See all
          </Link>
        </div>
        <div className="space-y-3">
          {tracks.filter((t) => !t.premium).slice(0, 3).map((track) => {
            const progress = getTrackProgress(track.id, track.lessonsCount);
            const pct = Math.round(progress * 100);
            const done = Math.round(progress * track.lessonsCount);
            return (
              <Link key={track.id} href={`/track/${track.id}`}>
                <div className="flex items-center gap-3 p-4 rounded-2xl border bg-card cursor-pointer hover:shadow-sm transition-shadow">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: track.color + "18" }}
                  >
                    {ICON_MAP[track.icon] ?? "📚"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-foreground truncate">{track.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{track.subtitle}</div>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: track.color }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{done}/{track.lessonsCount} lessons</div>
                  </div>
                  <div className="text-sm font-bold flex-shrink-0" style={{ color: track.color }}>{pct}%</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="px-5 pt-6">
        <h2 className="text-xl font-bold text-foreground mb-3">Upcoming Deadlines</h2>
        <div className="rounded-2xl border bg-card overflow-hidden">
          {DEADLINES.map((d, i) => {
            const Icon = d.icon;
            return (
              <div key={d.id}>
                <div className="flex items-center gap-3 p-3.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: d.color + "18" }}
                  >
                    <Icon size={16} style={{ color: d.color }} />
                  </div>
                  <div className="flex-1 text-sm font-medium text-foreground">{d.label}</div>
                  <div
                    className="px-2.5 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: d.color + "18", color: d.color }}
                  >
                    {d.date}
                  </div>
                </div>
                {i < DEADLINES.length - 1 && <div className="h-px bg-border mx-3.5" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Tools */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">Quick Tools</h2>
          <Link href="/tools" className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
            See all
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Budget", color: "#FF6B6B", href: "/tools", emoji: "💰" },
            { label: "Lease Checklist", color: "#A29BFE", href: "/tools", emoji: "🏠" },
            { label: "Tax Doc Tracker", color: "#4ECDC4", href: "/tools", emoji: "📄" },
          ].map((tool) => (
            <Link key={tool.label} href={tool.href}>
              <div className="flex flex-col items-center gap-2 p-3.5 rounded-2xl border bg-card cursor-pointer hover:shadow-sm transition-shadow">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: tool.color + "18" }}
                >
                  {tool.emoji}
                </div>
                <span className="text-xs font-semibold text-foreground text-center leading-tight">{tool.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
