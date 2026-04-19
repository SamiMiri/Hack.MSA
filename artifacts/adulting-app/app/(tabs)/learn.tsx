import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackCard } from "@/components/TrackCard";
import { useApp } from "@/context/AppContext";
import { tracks, Track } from "@/data/tracks";
import { useColors } from "@/hooks/useColors";

function PurchaseModal({
  track,
  coins,
  visible,
  onClose,
  onPurchase,
}: {
  track: Track | null;
  coins: number;
  visible: boolean;
  onClose: () => void;
  onPurchase: () => void;
}) {
  const colors = useColors();
  if (!track) return null;
  const canAfford = coins >= (track.price ?? 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.modalIcon, { backgroundColor: track.color + "18" }]}>
            <Feather name={track.icon as any} size={28} color={track.color} />
          </View>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{track.title}</Text>
          <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
            {track.lessonsCount} lessons · Unlock to start learning
          </Text>

          <View style={[styles.modalPriceRow, { backgroundColor: colors.muted, borderRadius: 12 }]}>
            <Text style={styles.coinIconLg}>⭐</Text>
            <Text style={[styles.modalPrice, { color: "#D97706" }]}>{track.price} coins</Text>
            <Text style={[styles.modalBalance, { color: colors.mutedForeground }]}>
              You have {coins}
            </Text>
          </View>

          {!canAfford && (
            <View style={[styles.modalWarning, { backgroundColor: "#FF6B6B18" }]}>
              <Feather name="alert-circle" size={14} color="#FF6B6B" />
              <Text style={[styles.modalWarningText, { color: "#FF6B6B" }]}>
                Need {(track.price ?? 0) - coins} more coins. Complete lessons & scenarios to earn them.
              </Text>
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.muted }]}
              onPress={onClose}
            >
              <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                { backgroundColor: canAfford ? track.color : colors.border },
              ]}
              onPress={canAfford ? onPurchase : undefined}
              disabled={!canAfford}
            >
              <Text style={[styles.modalBtnText, { color: canAfford ? "#fff" : colors.mutedForeground }]}>
                {canAfford ? "Unlock Track" : "Not Enough Coins"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getTrackProgress, coins, purchaseTrack, isTrackUnlocked } = useApp();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const freeTracks = tracks.filter((t) => !t.premium);
  const premiumTracks = tracks.filter((t) => t.premium);

  const handlePremiumPress = (track: Track) => {
    if (isTrackUnlocked(track.id)) {
      router.push(`/track/${track.id}` as any);
    } else {
      setSelectedTrack(track);
    }
  };

  const handlePurchase = async () => {
    if (!selectedTrack) return;
    const success = await purchaseTrack(selectedTrack.id, selectedTrack.price ?? 0);
    if (success) {
      setSelectedTrack(null);
      Alert.alert("Unlocked!", `${selectedTrack.title} is now available.`);
    } else {
      Alert.alert("Not enough coins", "Complete more lessons and scenarios to earn coins.");
    }
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: topInset + 16 }}>
          <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.headerSection}>
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.title, { color: colors.foreground }]}>Skill Tracks</Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  Pick a track and start learning life skills
                </Text>
              </View>
              <View style={[styles.coinBadge, { backgroundColor: "#FFE66D20", borderColor: "#FFE66D50" }]}>
                <Text style={styles.coinIcon}>⭐</Text>
                <Text style={[styles.coinCount, { color: "#D97706" }]}>{coins}</Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.tracks}>
            {freeTracks.map((track, i) => (
              <Animated.View key={track.id} entering={FadeInDown.delay(80 + i * 100).springify()}>
                <TrackCard
                  track={track}
                  progress={getTrackProgress(track.id, track.lessonsCount)}
                  onPress={() => router.push(`/track/${track.id}` as any)}
                />
              </Animated.View>
            ))}
          </View>

          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.premiumSection}
          >
            <View style={styles.premiumHeader}>
              <Text style={[styles.premiumLabel, { color: colors.mutedForeground }]}>
                PREMIUM TRACKS
              </Text>
              <View style={[styles.coinBadgeSmall, { backgroundColor: "#FFE66D18" }]}>
                <Text style={styles.coinIconSm}>⭐</Text>
                <Text style={[styles.coinCountSm, { color: "#D97706" }]}>Unlock with coins</Text>
              </View>
            </View>

            {premiumTracks.map((track, i) => {
              const unlocked = isTrackUnlocked(track.id);
              return (
                <Animated.View key={track.id} entering={FadeInDown.delay(360 + i * 80).springify()}>
                  {unlocked ? (
                    <TrackCard
                      track={track}
                      progress={getTrackProgress(track.id, track.lessonsCount)}
                      onPress={() => router.push(`/track/${track.id}` as any)}
                    />
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.lockedCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                      onPress={() => handlePremiumPress(track)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.lockedIconWrap, { backgroundColor: track.color + "18" }]}>
                        <Feather name={track.icon as any} size={22} color={track.color} />
                      </View>
                      <View style={styles.lockedInfo}>
                        <Text style={[styles.lockedTitle, { color: colors.foreground }]}>
                          {track.title}
                        </Text>
                        <Text style={[styles.lockedSub, { color: colors.mutedForeground }]}>
                          {track.subtitle}
                        </Text>
                        <Text style={[styles.lockedCount, { color: colors.mutedForeground }]}>
                          {track.lessonsCount} lessons
                        </Text>
                      </View>
                      <View style={styles.lockedRight}>
                        <View style={[styles.lockBadge, { backgroundColor: "#FFE66D20", borderColor: "#FFE66D50" }]}>
                          <Text style={styles.coinIconXs}>⭐</Text>
                          <Text style={[styles.lockPrice, { color: "#D97706" }]}>{track.price}</Text>
                        </View>
                        <Feather name="lock" size={14} color={colors.mutedForeground} style={{ marginTop: 4 }} />
                      </View>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              );
            })}
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(560).springify()}
            style={[styles.earnHint, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="info" size={14} color={colors.mutedForeground} />
            <Text style={[styles.earnHintText, { color: colors.mutedForeground }]}>
              Earn ⭐ coins by completing lessons (+10 each) and simulator scenarios (+20 each)
            </Text>
          </Animated.View>
        </View>
      </ScrollView>

      <PurchaseModal
        track={selectedTrack}
        coins={coins}
        visible={!!selectedTrack}
        onClose={() => setSelectedTrack(null)}
        onPurchase={handlePurchase}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { paddingHorizontal: 20, marginBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  title: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular" },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  coinIcon: { fontSize: 14 },
  coinCount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  tracks: { paddingHorizontal: 20 },
  premiumSection: { paddingHorizontal: 20, marginTop: 24 },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  premiumLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  coinBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  coinIconSm: { fontSize: 11 },
  coinCountSm: { fontSize: 11, fontFamily: "Inter_500Medium" },
  lockedCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 14,
  },
  lockedIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedInfo: { flex: 1 },
  lockedTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 2 },
  lockedSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 4 },
  lockedCount: { fontSize: 12, fontFamily: "Inter_500Medium" },
  lockedRight: { alignItems: "center", gap: 4 },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  coinIconXs: { fontSize: 10 },
  lockPrice: { fontSize: 12, fontFamily: "Inter_700Bold" },
  earnHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 20,
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  earnHintText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    gap: 14,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  modalPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
    justifyContent: "center",
  },
  coinIconLg: { fontSize: 20 },
  modalPrice: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalBalance: { fontSize: 13, fontFamily: "Inter_400Regular", marginLeft: 4 },
  modalWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    width: "100%",
  },
  modalWarningText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  modalActions: { flexDirection: "row", gap: 10, width: "100%", marginTop: 4 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  modalBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
