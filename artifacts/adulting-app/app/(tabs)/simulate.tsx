import { Feather } from "@expo/vector-icons";
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

import { useApp } from "@/context/AppContext";
import { useGame } from "@/context/GameContext";
import { SCENARIOS, Scenario } from "@/data/scenarios";
import { useColors } from "@/hooks/useColors";

const SCENARIO_ACCENTS = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899"];

function PurchaseModal({
  scenario,
  coins,
  visible,
  onClose,
  onPurchase,
}: {
  scenario: Scenario | null;
  coins: number;
  visible: boolean;
  onClose: () => void;
  onPurchase: () => void;
}) {
  const colors = useColors();
  if (!scenario) return null;
  const canAfford = coins >= (scenario.price ?? 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.modalIconWrap, { backgroundColor: "#7C3AED18" }]}>
            <Feather name="play-circle" size={28} color="#7C3AED" />
          </View>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{scenario.name}</Text>
          <Text style={[styles.modalWho, { color: colors.mutedForeground }]}>
            {scenario.who.toUpperCase()}
          </Text>
          <Text style={[styles.modalDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
            {scenario.desc}
          </Text>

          <View style={[styles.modalPriceRow, { backgroundColor: colors.muted, borderRadius: 12 }]}>
            <Text style={styles.coinIconLg}>⭐</Text>
            <Text style={[styles.modalPrice, { color: "#D97706" }]}>{scenario.price} coins</Text>
            <Text style={[styles.modalBalance, { color: colors.mutedForeground }]}>
              You have {coins}
            </Text>
          </View>

          {!canAfford && (
            <View style={[styles.modalWarning, { backgroundColor: "#FF6B6B18" }]}>
              <Feather name="alert-circle" size={14} color="#FF6B6B" />
              <Text style={[styles.modalWarningText, { color: "#FF6B6B" }]}>
                Need {(scenario.price ?? 0) - coins} more coins. Complete lessons to earn them.
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
                { backgroundColor: canAfford ? "#7C3AED" : colors.border },
              ]}
              onPress={canAfford ? onPurchase : undefined}
              disabled={!canAfford}
            >
              <Text style={[styles.modalBtnText, { color: canAfford ? "#fff" : colors.mutedForeground }]}>
                {canAfford ? "Unlock Scenario" : "Not Enough Coins"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function SimulateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { chooseScenario, bestScores } = useGame();
  const { coins, purchaseScenario, isScenarioUnlocked } = useApp();
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const ratingColor: Record<string, string> = {
    "You Made It": "#10B981",
    "Getting By": "#F59E0B",
    "Hard Lessons": "#EF4444",
  };

  const freeScenarios = SCENARIOS.filter((s) => !s.premium);
  const premiumScenarios = SCENARIOS.filter((s) => s.premium);

  const handleScenarioPress = (scenario: Scenario) => {
    if (!scenario.premium || isScenarioUnlocked(scenario.id)) {
      chooseScenario(scenario.id);
    } else {
      setSelectedScenario(scenario);
    }
  };

  const handlePurchase = async () => {
    if (!selectedScenario) return;
    const success = await purchaseScenario(selectedScenario.id, selectedScenario.price ?? 0);
    if (success) {
      setSelectedScenario(null);
      Alert.alert("Unlocked!", `${selectedScenario.name} is ready to play.`);
    } else {
      Alert.alert("Not enough coins", "Complete more lessons to earn coins.");
    }
  };

  const renderScenarioCard = (scenario: Scenario, index: number) => {
    const accent = SCENARIO_ACCENTS[index % SCENARIO_ACCENTS.length];
    const best = bestScores[scenario.id];
    const isPremium = scenario.premium;
    const isUnlocked = !isPremium || isScenarioUnlocked(scenario.id);

    return (
      <Animated.View
        key={scenario.id}
        entering={FadeInDown.delay(100 + index * 80).springify()}
      >
        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            !isUnlocked && styles.cardLocked,
          ]}
          onPress={() => handleScenarioPress(scenario)}
          activeOpacity={0.85}
          testID={`scenario-${scenario.id}`}
        >
          <View style={[styles.cardAccent, { backgroundColor: isUnlocked ? accent : colors.mutedForeground }]} />
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitles}>
                <Text style={[styles.cardTitle, { color: isUnlocked ? colors.foreground : colors.mutedForeground }]}>
                  {scenario.name}
                </Text>
                <Text style={[styles.cardWho, { color: colors.mutedForeground }]}>
                  {scenario.who.toUpperCase()}
                </Text>
              </View>
              {isUnlocked ? (
                <View style={[styles.playBadge, { backgroundColor: accent + "18" }]}>
                  <Feather name="play" size={14} color={accent} />
                </View>
              ) : (
                <View style={[styles.lockPriceBadge, { backgroundColor: "#FFE66D18", borderColor: "#FFE66D50" }]}>
                  <Text style={styles.lockCoinIcon}>⭐</Text>
                  <Text style={[styles.lockPriceText, { color: "#D97706" }]}>{scenario.price}</Text>
                </View>
              )}
            </View>

            <Text
              style={[styles.cardDesc, { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {scenario.desc}
            </Text>

            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.cardTime, { color: colors.mutedForeground }]}>
                {scenario.estimatedTime}
              </Text>
              {isUnlocked ? (
                best ? (
                  <Text style={[styles.bestScore, { color: ratingColor[best.rating] }]}>
                    Best: {best.rating}
                  </Text>
                ) : (
                  <Text style={[styles.playText, { color: accent }]}>
                    Play now
                  </Text>
                )
              ) : (
                <View style={styles.lockedLabel}>
                  <Feather name="lock" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.lockedLabelText, { color: colors.mutedForeground }]}>Locked</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: topInset + 20 }]}>
          <Animated.View entering={FadeInDown.delay(0).springify()}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.eyebrow, { color: "#7C3AED" }]}>LIFE SIM</Text>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Adulting{"\n"}Simulator
                </Text>
              </View>
              <View style={[styles.coinBadge, { backgroundColor: "#FFE66D20", borderColor: "#FFE66D50" }]}>
                <Text style={styles.coinIcon}>⭐</Text>
                <Text style={[styles.coinCount, { color: "#D97706" }]}>{coins}</Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Make choices. Face consequences. Try to survive.
            </Text>
          </Animated.View>
        </View>

        <View style={styles.scenarios}>
          {freeScenarios.map((scenario, index) => renderScenarioCard(scenario, index))}
        </View>

        {premiumScenarios.length > 0 && (
          <View style={styles.premiumSection}>
            <View style={styles.premiumHeader}>
              <Text style={[styles.premiumLabel, { color: colors.mutedForeground }]}>
                PREMIUM SCENARIOS
              </Text>
              <View style={[styles.coinBadgeSmall, { backgroundColor: "#FFE66D18" }]}>
                <Text style={styles.coinIconSm}>⭐</Text>
                <Text style={[styles.coinCountSm, { color: "#D97706" }]}>Unlock with coins</Text>
              </View>
            </View>
            {premiumScenarios.map((scenario, index) =>
              renderScenarioCard(scenario, freeScenarios.length + index)
            )}
          </View>
        )}

        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          style={[styles.earnHint, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.earnHintText, { color: colors.mutedForeground }]}>
            Earn ⭐ coins by completing lessons (+10) and scenarios (+20). Spend them to unlock premium content.
          </Text>
        </Animated.View>
      </ScrollView>

      <PurchaseModal
        scenario={selectedScenario}
        coins={coins}
        visible={!!selectedScenario}
        onClose={() => setSelectedScenario(null)}
        onPurchase={handlePurchase}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrow: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 42, fontFamily: "Inter_700Bold", lineHeight: 46, marginBottom: 10 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 8 },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  coinIcon: { fontSize: 14 },
  coinCount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  scenarios: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  premiumSection: { paddingHorizontal: 16, marginTop: 20 },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  premiumLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5, textTransform: "uppercase" },
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
  card: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 12,
  },
  cardLocked: { opacity: 0.9 },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: 18, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardTitles: { flex: 1 },
  cardTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 2 },
  cardWho: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2 },
  playBadge: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  lockPriceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  lockCoinIcon: { fontSize: 12 },
  lockPriceText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  cardDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
  },
  cardTime: { fontSize: 13, fontFamily: "Inter_400Regular" },
  bestScore: { fontSize: 13, fontFamily: "Inter_700Bold" },
  playText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  lockedLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  lockedLabelText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  earnHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
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
    gap: 12,
  },
  modalIconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  modalWho: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2 },
  modalDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
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
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  modalBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
