import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

const PRIMARY = "#7C3AED";

const FLAG_DISPLAY_MAP: Record<string, string> = {
  irs_risk: "IRS Watching",
  fugitive: "FUGITIVE",
  no_insurance_car: "Driving Uninsured",
  credit_card_debt: "CC Debt",
  money_mule: "Suspicious Activity",
  felony_record: "Felony Record",
  evaded_police: "Evaded Police",
  missed_jury: "Missed Jury",
  tax_fraud: "Tax Fraud",
  scammed: "Got Scammed",
  bad_lease: "Bad Lease",
  lease_violation: "Lease Violation",
  utility_scam: "Utility Trap",
  eviction_record: "Eviction Record",
  noncompete: "Non-Compete",
  signed_blind: "Signed Blind",
  sued: "Being Sued",
  w4_wrong: "W-4 Wrong",
};

const STAT_COLORS = {
  money: "#10B981",
  stress: "#EF4444",
  knowledge: "#0EA5E9",
  score: "#8B5CF6",
};

export default function OutcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentScenario, currentSceneId, stats, flags, calculateRating, returnToMenu, replayScenario } = useGame();

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const scene = currentScenario?.scenes[currentSceneId];
  const rating = scene?.isEnding ? calculateRating(flags, stats.score) : "Getting By";

  useEffect(() => {
    Haptics.notificationAsync(
      rating === "You Made It"
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    );
  }, []);

  const ratingConfig = {
    "You Made It": {
      color: "#10B981",
      bg: "#10B98115",
      border: "#10B98130",
      icon: "award" as const,
      label: "YOU MADE IT",
    },
    "Getting By": {
      color: "#F59E0B",
      bg: "#F59E0B15",
      border: "#F59E0B30",
      icon: "refresh-cw" as const,
      label: "GETTING BY",
    },
    "Hard Lessons": {
      color: "#EF4444",
      bg: "#EF444415",
      border: "#EF444430",
      icon: "zap" as const,
      label: "HARD LESSONS",
    },
  }[rating];

  const badFlags = Array.from(flags).map((f) => FLAG_DISPLAY_MAP[f]).filter(Boolean);

  const statRows = [
    { key: "money" as const, label: "Final Cash", format: (v: number) => `$${v.toLocaleString()}` },
    { key: "stress" as const, label: "Stress Level", format: (v: number) => `${v}/100` },
    { key: "knowledge" as const, label: "Knowledge", format: (v: number) => `${v} pts` },
    { key: "score" as const, label: "Total Score", format: (v: number) => `${v}` },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 20, paddingTop: topInset + 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Rating badge */}
      <Animated.View entering={ZoomIn.springify()} style={styles.ratingCenter}>
        <View style={[styles.ratingIcon, { backgroundColor: ratingConfig.bg, borderColor: ratingConfig.border }]}>
          <Feather name={ratingConfig.icon} size={44} color={ratingConfig.color} />
        </View>
        <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>RESULT</Text>
        <Text style={[styles.ratingTitle, { color: ratingConfig.color }]}>
          {ratingConfig.label}
        </Text>
      </Animated.View>

      {/* Ending text */}
      {scene && (
        <Animated.View entering={FadeInDown.delay(150).springify()} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {scene.endingTitle && (
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{scene.endingTitle}</Text>
          )}
          <Text style={[styles.cardText, { color: colors.mutedForeground }]}>{scene.text}</Text>
        </Animated.View>
      )}

      {/* Final stats */}
      <Animated.View entering={FadeInDown.delay(250).springify()} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FINAL STATS</Text>
        {statRows.map(({ key, label, format }) => (
          <View key={key} style={[styles.statRow, { borderBottomColor: colors.border }]}>
            <View style={styles.statDot}>
              <View style={[styles.dot, { backgroundColor: STAT_COLORS[key] }]} />
              <Text style={[styles.statLabel, { color: colors.foreground }]}>{label}</Text>
            </View>
            <Text style={[styles.statValue, { color: STAT_COLORS[key] }]}>
              {format(stats[key])}
            </Text>
          </View>
        ))}
      </Animated.View>

      {/* Bad flags earned */}
      {badFlags.length > 0 && (
        <Animated.View entering={FadeInDown.delay(350).springify()} style={[styles.card, { backgroundColor: "#F59E0B08", borderColor: "#F59E0B30" }]}>
          <Text style={[styles.sectionLabel, { color: "#F59E0B" }]}>FLAGS EARNED</Text>
          <View style={styles.flagsWrap}>
            {badFlags.map((f) => (
              <View key={f} style={styles.flag}>
                <Feather name="alert-triangle" size={11} color="#F59E0B" />
                <Text style={styles.flagText}>{f}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Actions */}
      <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.actions}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            replayScenario();
          }}
          style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          testID="button-replay"
          activeOpacity={0.85}
        >
          <Feather name="refresh-cw" size={18} color={colors.foreground} />
          <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Replay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            returnToMenu();
          }}
          style={[styles.primaryBtn, { backgroundColor: PRIMARY }]}
          testID="button-menu"
          activeOpacity={0.85}
        >
          <Feather name="grid" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>More Scenarios</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ratingCenter: { alignItems: "center", paddingHorizontal: 24, marginBottom: 24 },
  ratingIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  ratingLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5, marginBottom: 6 },
  ratingTitle: { fontSize: 36, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 8 },
  cardText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5, marginBottom: 14 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  statDot: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  statValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  flagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  flag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F59E0B18",
    borderWidth: 1,
    borderColor: "#F59E0B40",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  flagText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#F59E0B" },
  actions: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 8 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
  },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});
