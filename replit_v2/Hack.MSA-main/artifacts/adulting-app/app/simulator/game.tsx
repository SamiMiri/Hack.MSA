import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp, SlideInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/context/GameContext";
import { SceneChoice } from "@/data/scenarios";
import { useColors } from "@/hooks/useColors";

const PRIMARY = "#7C3AED";
const STAT_COLORS = {
  money: "#10B981",
  stress: "#EF4444",
  knowledge: "#0EA5E9",
  score: "#8B5CF6",
};

const CHOICE_COLORS = [
  { bg: "rgba(124,58,237,0.1)", border: "#7C3AED50", letter: PRIMARY, letterBg: PRIMARY },
  { bg: "rgba(14,165,233,0.1)", border: "#0EA5E950", letter: "#0EA5E9", letterBg: "#0EA5E9" },
  { bg: "rgba(16,185,129,0.1)", border: "#10B98150", letter: "#10B981", letterBg: "#10B981" },
  { bg: "rgba(245,158,11,0.1)", border: "#F59E0B50", letter: "#F59E0B", letterBg: "#F59E0B" },
];
const LETTERS = ["A", "B", "C", "D"];

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

interface AiTip {
  explanation: string;
  followUpQuestions: string[];
}

function useAiTip(feedback: { text: string; choiceLabel: string; sceneTitle: string } | null, scenarioName: string, characterName: string) {
  const [tip, setTip] = useState<AiTip | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!feedback) {
      setTip(null);
      return;
    }
    setTip(null);
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
    const apiUrl = `https://${domain}/api/explain`;

    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        choice: feedback.choiceLabel,
        feedback: feedback.text,
        scene: feedback.sceneTitle,
        character: characterName,
        scenarioName,
      }),
    })
      .then((r) => r.json())
      .then((data: AiTip) => {
        if (data.explanation) setTip(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [feedback?.choiceLabel, feedback?.sceneTitle]);

  return { tip, loading };
}

export default function GameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gamePhase, currentScenario, currentSceneId, stats, lastDeltas, flags, pendingFeedback, selectedCharacter, makeChoice, continueGame } = useGame();

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const { tip, loading: aiLoading } = useAiTip(
    pendingFeedback,
    currentScenario?.name ?? "",
    selectedCharacter?.name ?? "Young Adult"
  );

  const scene = currentScenario?.scenes[currentSceneId];

  const shuffledChoices = useMemo(() => {
    if (!scene?.choices) return [];
    const choices = [...scene.choices];
    let seed = scene.id.split("").reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.abs(Math.sin(seed++) * 10000) % (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return choices;
  }, [scene?.id, scene?.choices]);

  const visibleFlags = Array.from(flags)
    .map((f) => FLAG_DISPLAY_MAP[f])
    .filter(Boolean);

  if (!currentScenario || !scene) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={PRIMARY} />
      </View>
    );
  }

  const handleChoice = (choice: SceneChoice) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    makeChoice(choice, scene.title);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    continueGame();
  };

  const feedbackBorderColor =
    pendingFeedback?.kind === "good" ? "#10B981" :
    pendingFeedback?.kind === "bad" ? "#EF4444" : "#F59E0B";

  const feedbackBarColor = feedbackBorderColor;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HUD */}
      <View style={[styles.hud, { paddingTop: topInset + 4, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {/* Stat bars */}
        <View style={styles.statsGrid}>
          {(["money", "stress", "knowledge", "score"] as const).map((key) => {
            const val = stats[key];
            const delta = lastDeltas?.[key];
            const color = STAT_COLORS[key];
            const labels = { money: "CASH", stress: "STRESS", knowledge: "KNOW", score: "SCORE" };
            const max = key === "money" ? Math.max((currentScenario.startMoney || 1200) * 3, 5000) : key === "stress" ? 100 : key === "knowledge" ? 30 : 80;
            const pct = key === "score"
              ? Math.min(100, Math.max(0, ((val + 50) / (max + 50)) * 100))
              : Math.min(100, Math.max(0, (val / max) * 100));
            const display = key === "money" ? `$${val.toLocaleString()}` : String(val);
            const hasChanged = delta !== undefined && delta !== 0;
            const isGood = key === "stress" ? (delta ?? 0) < 0 : (delta ?? 0) > 0;

            return (
              <View key={key} style={styles.statItem}>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color }]}>{labels[key]}</Text>
                  <View style={styles.statValueRow}>
                    <Text style={[styles.statValue, { color: key === "score" && val < 0 ? "#EF4444" : colors.foreground }]}>
                      {display}
                    </Text>
                    {hasChanged && (
                      <Text style={[styles.statDelta, { color: isGood ? "#10B981" : "#EF4444" }]}>
                        {(delta ?? 0) > 0 ? "+" : ""}{key === "money" ? `$${delta}` : delta}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={[styles.statBarBg, { backgroundColor: colors.muted }]}>
                  <View style={[styles.statBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                </View>
              </View>
            );
          })}
        </View>

        {selectedCharacter && (
          <View style={styles.charBadge}>
            <Feather name="user" size={10} color={colors.mutedForeground} />
            <Text style={[styles.charBadgeText, { color: colors.mutedForeground }]}>
              {selectedCharacter.name}
            </Text>
          </View>
        )}
      </View>

      {/* Main content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {gamePhase === "playing" ? (
          <Animated.View key={`scene-${scene.id}`} entering={SlideInRight.springify()}>
            {/* Scene title */}
            <Text style={[styles.sceneTitle, { color: colors.mutedForeground }]}>
              {scene.title}
            </Text>

            {/* Scene text */}
            <View style={[styles.sceneCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sceneText, { color: colors.foreground }]}>
                {scene.text}
              </Text>
            </View>

            {/* Active flags */}
            {visibleFlags.length > 0 && (
              <View style={styles.flagsRow}>
                {visibleFlags.map((f) => (
                  <View key={f} style={styles.flag}>
                    <Feather name="alert-triangle" size={11} color="#F59E0B" />
                    <Text style={styles.flagText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Choices */}
            {!scene.isEnding && (
              <View style={styles.choices}>
                {shuffledChoices.map((choice, i) => {
                  const c = CHOICE_COLORS[i % CHOICE_COLORS.length];
                  return (
                    <Animated.View key={choice.id} entering={FadeInDown.delay(i * 60).springify()}>
                      <Pressable
                        onPress={() => handleChoice(choice)}
                        style={({ pressed }) => [
                          styles.choiceBtn,
                          { backgroundColor: c.bg, borderColor: c.border, opacity: pressed ? 0.85 : 1 },
                        ]}
                        testID={`choice-${choice.id}`}
                      >
                        <View style={[styles.choiceLetter, { backgroundColor: c.letterBg }]}>
                          <Text style={styles.choiceLetterText}>{LETTERS[i]}</Text>
                        </View>
                        <Text style={[styles.choiceLabel, { color: colors.foreground }]}>
                          {choice.label}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        ) : (
          <Animated.View key={`consequence-${scene.id}`} entering={FadeInUp.springify()} style={styles.consequenceView}>
            {/* Feedback card */}
            {pendingFeedback && (
              <View style={[styles.feedbackCard, { backgroundColor: colors.card, borderColor: feedbackBorderColor + "40" }]}>
                <View style={[styles.feedbackBar, { backgroundColor: feedbackBarColor }]} />
                <View style={styles.feedbackContent}>
                  <Text style={[styles.feedbackLabel, { color: colors.mutedForeground }]}>FEEDBACK</Text>
                  <Text style={[styles.feedbackText, { color: colors.foreground }]}>
                    {pendingFeedback.text}
                  </Text>
                </View>
              </View>
            )}

            {/* Stat changes */}
            {lastDeltas && (
              <View style={styles.deltaGrid}>
                {(Object.entries(lastDeltas) as [keyof typeof lastDeltas, number][])
                  .filter(([, v]) => v !== undefined && v !== 0)
                  .map(([key, val]) => {
                    const color = STAT_COLORS[key];
                    const labels = { money: "CASH", stress: "STRESS", knowledge: "KNOW", score: "SCORE" };
                    const isGood = key === "stress" ? val < 0 : val > 0;
                    const displayVal = key === "money" ? `$${Math.abs(val)}` : String(val);
                    return (
                      <Animated.View
                        key={key}
                        entering={FadeInDown.delay(50).springify()}
                        style={[
                          styles.deltaCard,
                          { backgroundColor: isGood ? "#10B98115" : "#EF444415", borderColor: isGood ? "#10B98130" : "#EF444430" },
                        ]}
                      >
                        <Text style={[styles.deltaLabel, { color: colors.mutedForeground }]}>{labels[key]}</Text>
                        <Text style={[styles.deltaValue, { color: isGood ? "#10B981" : "#EF4444" }]}>
                          {val > 0 ? "+" : ""}{displayVal}
                        </Text>
                        <Feather name={isGood ? "trending-up" : "trending-down"} size={14} color={isGood ? "#10B981" : "#EF4444"} />
                      </Animated.View>
                    );
                  })}
              </View>
            )}

            {/* AI tip */}
            {(aiLoading || tip) && (
              <Animated.View
                entering={FadeInDown.delay(200).springify()}
                style={[styles.aiCard, { backgroundColor: colors.card, borderColor: PRIMARY + "30" }]}
              >
                <View style={[styles.aiBar, { backgroundColor: PRIMARY }]} />
                <View style={styles.aiContent}>
                  <View style={styles.aiHeader}>
                    <Feather name="zap" size={14} color={PRIMARY} />
                    <Text style={[styles.aiLabel, { color: PRIMARY }]}>REAL WORLD CONTEXT</Text>
                  </View>
                  {aiLoading ? (
                    <View style={styles.aiLoading}>
                      <ActivityIndicator size="small" color={PRIMARY} />
                      <Text style={[styles.aiLoadingText, { color: colors.mutedForeground }]}>Thinking...</Text>
                    </View>
                  ) : tip ? (
                    <>
                      <Text style={[styles.aiExplanation, { color: colors.foreground }]}>
                        {tip.explanation}
                      </Text>
                      {tip.followUpQuestions.map((q, i) => (
                        <View key={i} style={styles.aiQuestion}>
                          <Feather name="help-circle" size={12} color={PRIMARY + "80"} />
                          <Text style={[styles.aiQuestionText, { color: colors.mutedForeground }]}>{q}</Text>
                        </View>
                      ))}
                    </>
                  ) : null}
                </View>
              </Animated.View>
            )}

            {/* Continue */}
            <TouchableOpacity
              onPress={handleContinue}
              style={[styles.continueBtn, { backgroundColor: PRIMARY }]}
              testID="button-continue"
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
              <Feather name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  hud: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  statsGrid: { gap: 8 },
  statItem: { gap: 3 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  statDelta: { fontSize: 10, fontFamily: "Inter_700Bold" },
  statBarBg: { height: 4, borderRadius: 2, overflow: "hidden" },
  statBarFill: { height: 4, borderRadius: 2 },
  charBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  charBadgeText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  scroll: { flex: 1 },
  sceneTitle: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sceneCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  sceneText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 26,
  },
  flagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
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
  choices: { gap: 10 },
  choiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  choiceLetter: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceLetterText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  choiceLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", lineHeight: 22 },
  consequenceView: { gap: 14 },
  feedbackCard: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  feedbackBar: { width: 4 },
  feedbackContent: { flex: 1, padding: 16 },
  feedbackLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2, marginBottom: 6 },
  feedbackText: { fontSize: 17, fontFamily: "Inter_500Medium", lineHeight: 26 },
  deltaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  deltaCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 4,
    alignItems: "flex-start",
  },
  deltaLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  deltaValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  aiCard: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  aiBar: { width: 4 },
  aiContent: { flex: 1, padding: 16 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  aiLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  aiLoading: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiLoadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  aiExplanation: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 10 },
  aiQuestion: { flexDirection: "row", gap: 6, marginBottom: 6, alignItems: "flex-start" },
  aiQuestionText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  continueBtn: {
    borderRadius: 16,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  continueBtnText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
});
