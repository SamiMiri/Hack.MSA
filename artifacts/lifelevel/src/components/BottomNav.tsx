import { Link, useLocation } from "wouter";
import { Home, BookOpen, Gamepad2, Wrench, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const MAIN_TABS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/learn", label: "Learn", icon: BookOpen },
  { path: "/simulate", label: "Play", icon: Gamepad2 },
  { path: "/tools", label: "Tools", icon: Wrench },
  { path: "/progress", label: "Progress", icon: BarChart2 },
];

const HIDDEN_PATHS = ["/lesson/", "/simulator", "/track/"];

export function BottomNav() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  if (HIDDEN_PATHS.some((p) => location.startsWith(p))) {
    return null;
  }

  return (
    <>
      {moreOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
          <div className="fixed bottom-16 right-3 z-50 bg-card border rounded-2xl shadow-xl overflow-hidden min-w-[180px]">
            <Link href="/settings" onClick={() => setMoreOpen(false)}>
              <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--primary)" + "18" }}>
                  <Settings size={16} style={{ color: "var(--primary)" }} />
                </div>
                <span className="text-sm font-semibold text-foreground">Settings</span>
              </div>
            </Link>
          </div>
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {MAIN_TABS.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);

            return (
              <Link key={item.path} href={item.path}>
                <div className={cn(
                  "flex flex-col items-center justify-center w-14 gap-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </div>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "flex flex-col items-center justify-center w-14 gap-1 transition-colors",
              moreOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="grid grid-cols-2 gap-0.5 w-5 h-5 items-center justify-center">
              <div className={cn("w-2 h-2 rounded-sm", moreOpen ? "bg-primary" : "bg-current")} />
              <div className={cn("w-2 h-2 rounded-sm", moreOpen ? "bg-primary" : "bg-current")} />
              <div className={cn("w-2 h-2 rounded-sm", moreOpen ? "bg-primary" : "bg-current")} />
              <div className={cn("w-2 h-2 rounded-sm", moreOpen ? "bg-primary" : "bg-current")} />
            </div>
            <span className="text-[10px] font-semibold">More</span>
          </button>
        </div>
      </div>
    </>
  );
}
