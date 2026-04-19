import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/context/GameContext";
import { SCENARIOS } from "@/data/scenarios";
import { useColors } from "@/hooks/useColors";

const SCENARIO_ACCENTS = ["#7C3AED", "#0EA5E9", "#10B981"];

export default function SimulateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { chooseScenario, bestScores } = useGame();

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const ratingColor: Record<string, string> = {
    "You Made It": "#10B981",
    "Getting By": "#F59E0B",
    "Hard Lessons": "#EF4444",
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topInset + 20 }]}>
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <Text style={[styles.eyebrow, { color: "#7C3AED" }]}>LIFE SIM</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Adulting{"\n"}Simulator
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Make choices. Face consequences. Try to survive.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.scenarios}>
        {SCENARIOS.map((scenario, index) => {
          const accent = SCENARIO_ACCENTS[index % SCENARIO_ACCENTS.length];
          const best = bestScores[scenario.id];
          return (
            <Animated.View
              key={scenario.id}
              entering={FadeInDown.delay(100 + index * 80).springify()}
            >
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => chooseScenario(scenario.id)}
                activeOpacity={0.85}
                testID={`scenario-${scenario.id}`}
              >
                <View style={[styles.cardAccent, { backgroundColor: accent }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitles}>
                      <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                        {scenario.name}
                      </Text>
                      <Text style={[styles.cardWho, { color: colors.mutedForeground }]}>
                        {scenario.who.toUpperCase()}
                      </Text>
                    </View>
                    <View style={[styles.playBadge, { backgroundColor: accent + "18" }]}>
                      <Feather name="play" size={14} color={accent} />
                    </View>
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
                    {best ? (
                      <Text style={[styles.bestScore, { color: ratingColor[best.rating] }]}>
                        Best: {best.rating}
                      </Text>
                    ) : (
                      <Text style={[styles.playText, { color: accent }]}>
                        Play now
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      <Text style={[styles.footer, { color: colors.mutedForeground }]}>
        {SCENARIOS.length} scenarios · All choices matter
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  eyebrow: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    lineHeight: 46,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 8,
  },
  scenarios: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: 18, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardTitles: { flex: 1 },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  cardWho: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  playBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
  },
  cardTime: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  bestScore: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  playText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingVertical: 24,
  },
});
