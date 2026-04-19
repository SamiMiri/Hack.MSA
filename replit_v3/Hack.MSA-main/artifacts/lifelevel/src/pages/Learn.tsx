import { useState } from "react";
import { Link } from "wouter";
import { useApp } from "@/context/AppContext";
import { tracks, Track } from "@/data/tracks";
import { Lock, ChevronRight, Info, X } from "lucide-react";

const ICON_MAP: Record<string, string> = {
  "credit-card": "💳",
  "file-text": "📄",
  "shield": "🛡️",
  "home": "🏠",
  "briefcase": "💼",
  "heart": "❤️",
  "trending-up": "📈",
  "bar-chart-2": "📊",
};

function PurchaseDialog({
  track,
  coins,
  onClose,
  onPurchase,
}: {
  track: Track;
  coins: number;
  onClose: () => void;
  onPurchase: () => void;
}) {
  const canAfford = coins >= (track.price ?? 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
      <div className="bg-card border rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: track.color + "18" }}>
          {ICON_MAP[track.icon] ?? "📚"}
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground">{track.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{track.lessonsCount} lessons · Unlock to start learning</p>
        </div>

        <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3 w-full justify-center">
          <span className="text-xl">⭐</span>
          <span className="text-lg font-bold text-amber-600">{track.price} coins</span>
          <span className="text-sm text-muted-foreground ml-1">You have {coins}</span>
        </div>

        {!canAfford && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 rounded-xl p-3 w-full">
            <Info size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-500">Need {(track.price ?? 0) - coins} more coins. Complete lessons & scenarios to earn them.</p>
          </div>
        )}

        <div className="flex gap-2.5 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl bg-muted font-bold text-foreground text-sm"
          >
            Cancel
          </button>
          <button
            onClick={canAfford ? onPurchase : undefined}
            disabled={!canAfford}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
            style={{ backgroundColor: canAfford ? track.color : undefined }}
          >
            <span style={{ color: canAfford ? "#fff" : undefined }} className={!canAfford ? "text-muted-foreground" : ""}>
              {canAfford ? "Unlock Track" : "Not Enough Coins"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  const { getTrackProgress, coins, purchaseTrack, isTrackUnlocked } = useApp();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const freeTracks = tracks.filter((t) => !t.premium);
  const premiumTracks = tracks.filter((t) => t.premium);

  const handlePremiumPress = (track: Track) => {
    if (isTrackUnlocked(track.id)) return;
    setSelectedTrack(track);
  };

  const handlePurchase = () => {
    if (!selectedTrack) return;
    const success = purchaseTrack(selectedTrack.id, selectedTrack.price ?? 0);
    if (success) setSelectedTrack(null);
  };

  const TrackCard = ({ track }: { track: Track }) => {
    const progress = getTrackProgress(track.id, track.lessonsCount);
    const pct = Math.round(progress * 100);
    const done = Math.round(progress * track.lessonsCount);

    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl border bg-card">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: track.color + "18" }}
        >
          {ICON_MAP[track.icon] ?? "📚"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-foreground">{track.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">{track.subtitle}</div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: track.color }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{done}/{track.lessonsCount} lessons</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-sm font-bold" style={{ color: track.color }}>{pct}%</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto w-full bg-background pb-24">
      <div className="px-5 pt-8 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Skill Tracks</h1>
            <p className="text-sm text-muted-foreground mt-1">Pick a track and start learning life skills</p>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full px-3 py-1.5 mt-1">
            <span className="text-sm">⭐</span>
            <span className="text-sm font-bold text-amber-600">{coins}</span>
          </div>
        </div>
      </div>

      {/* Free tracks */}
      <div className="px-5 space-y-3 mt-4">
        {freeTracks.map((track) => (
          <Link key={track.id} href={`/track/${track.id}`}>
            <div className="cursor-pointer hover:shadow-sm transition-shadow">
              <TrackCard track={track} />
            </div>
          </Link>
        ))}
      </div>

      {/* Premium tracks */}
      {premiumTracks.length > 0 && (
        <div className="px-5 mt-7">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Premium Tracks</span>
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 rounded-full px-2.5 py-1">
              <span className="text-xs">⭐</span>
              <span className="text-xs font-medium text-amber-600">Unlock with coins</span>
            </div>
          </div>
          <div className="space-y-3">
            {premiumTracks.map((track) => {
              const unlocked = isTrackUnlocked(track.id);
              if (unlocked) {
                return (
                  <Link key={track.id} href={`/track/${track.id}`}>
                    <div className="cursor-pointer hover:shadow-sm transition-shadow">
                      <TrackCard track={track} />
                    </div>
                  </Link>
                );
              }
              return (
                <button
                  key={track.id}
                  onClick={() => handlePremiumPress(track)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border bg-card text-left"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: track.color + "18" }}
                  >
                    {ICON_MAP[track.icon] ?? "📚"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-foreground">{track.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{track.subtitle}</div>
                    <div className="text-xs text-muted-foreground mt-1">{track.lessonsCount} lessons</div>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-2 py-1.5">
                      <span className="text-xs">⭐</span>
                      <span className="text-xs font-bold text-amber-600">{track.price}</span>
                    </div>
                    <Lock size={13} className="text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Earn hint */}
      <div className="mx-5 mt-5 flex items-center gap-2 bg-card border rounded-xl p-3">
        <Info size={14} className="text-muted-foreground flex-shrink-0" />
        <p className="text-xs text-muted-foreground">Earn ⭐ coins by completing lessons (+10 each) and simulator scenarios (+20 each)</p>
      </div>

      {selectedTrack && (
        <PurchaseDialog
          track={selectedTrack}
          coins={coins}
          onClose={() => setSelectedTrack(null)}
          onPurchase={handlePurchase}
        />
      )}
    </div>
  );
}
