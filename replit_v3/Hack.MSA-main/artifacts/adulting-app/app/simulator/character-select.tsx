import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";

import { useNav } from "@/context/NavigationContext";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/context/GameContext";
import { CHARACTERS, CharacterOption } from "@/data/characters";
import { SCENARIOS } from "@/data/scenarios";
import { useColors } from "@/hooks/useColors";

const PRIMARY = "#7C3AED";

export default function CharacterSelectScreen() {
  const { goBack } = useNav();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pendingScenarioId, confirmCharacter } = useGame();
  const [selected, setSelected] = useState<string | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === pendingScenarioId);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const statPreview = (char: CharacterOption) => {
    const base = scenario?.startMoney ?? 1200;
    return {
      money: Math.floor(base * char.moneyMult),
      stress: char.stressBonus,
      knowledge: Math.max(0, char.knowledgeBonus),
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity
          onPress={() => goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          testID="button-back"
        >
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerEyebrow, { color: PRIMARY }]}>CHOOSE YOUR CHARACTER</Text>
          {scenario && (
            <Text style={[styles.headerScenario, { color: colors.mutedForeground }]}>
              {scenario.name}
            </Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Characters */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {CHARACTERS.map((char, i) => {
          const preview = statPreview(char);
          const isSelected = selected === char.id;
          return (
            <Animated.View key={char.id} entering={FadeInDown.delay(i * 80).springify()}>
              <Pressable
                onPress={() => setSelected(char.id)}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? PRIMARY : colors.border,
                  },
                ]}
                testID={`character-${char.id}`}
              >
                {isSelected && (
                  <View style={[styles.selectedBar, { backgroundColor: PRIMARY }]} />
                )}
                <View style={styles.cardInner}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardTitles}>
                      <Text
                        style={[
                          styles.charName,
                          { color: isSelected ? PRIMARY : colors.foreground },
                        ]}
                      >
                        {char.name}
                      </Text>
                      <Text style={[styles.charTagline, { color: colors.mutedForeground }]}>
                        {char.tagline}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        {
                          borderColor: isSelected ? PRIMARY : colors.border,
                          backgroundColor: isSelected ? PRIMARY : "transparent",
                        },
                      ]}
                    >
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </View>

                  <View style={styles.traits}>
                    {char.traits.map((t) => (
                      <View
                        key={t}
                        style={[styles.trait, { backgroundColor: colors.muted, borderColor: colors.border }]}
                      >
                        <Text style={[styles.traitText, { color: colors.mutedForeground }]}>{t}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.statRow, { borderTopColor: colors.border }]}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Cash</Text>
                      <Text style={styles.statValueGreen}>${preview.money.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Stress</Text>
                      <Text style={[styles.statValue, { color: preview.stress > 0 ? "#EF4444" : colors.mutedForeground }]}>
                        {preview.stress > 0 ? `+${preview.stress}` : "0"}
                      </Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Know</Text>
                      <Text style={[styles.statValue, {
                        color: preview.knowledge > 0 ? "#0EA5E9" : preview.knowledge < 0 ? "#EF4444" : colors.mutedForeground
                      }]}>
                        {preview.knowledge > 0 ? `+${preview.knowledge}` : preview.knowledge !== 0 ? preview.knowledge : "0"}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Confirm */}
      <View style={[styles.footer, { paddingBottom: bottomInset + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => selected && confirmCharacter(selected)}
          disabled={!selected}
          style={[
            styles.confirmBtn,
            { backgroundColor: selected ? PRIMARY : colors.muted },
          ]}
          testID="button-confirm-character"
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmText, { color: selected ? "#fff" : colors.mutedForeground }]}>
            {selected ? "Start Scenario" : "Select a character"}
          </Text>
          {selected && <Feather name="arrow-right" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerEyebrow: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  headerScenario: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
    flexDirection: "row",
  },
  selectedBar: { width: 4 },
  cardInner: { flex: 1, padding: 18, gap: 12 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardTitles: { flex: 1 },
  charName: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 2 },
  charTagline: { fontSize: 13, fontFamily: "Inter_400Regular" },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" },
  traits: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  trait: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
  },
  traitText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  statRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 0,
  },
  statItem: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 2 },
  statValueGreen: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#10B981" },
  statValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statDivider: { width: 1, marginHorizontal: 4 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  confirmBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: { fontSize: 17, fontFamily: "Inter_700Bold" },
});
