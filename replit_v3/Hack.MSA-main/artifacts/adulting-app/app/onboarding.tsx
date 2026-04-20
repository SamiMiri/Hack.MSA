import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";

import { useNav } from "@/context/NavigationContext";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { onboardingQuestions } from "@/data/onboarding";
import { useColors } from "@/hooks/useColors";

const TRACK_COLORS = ["#FF6B6B", "#4ECDC4", "#A29BFE"];

interface OptionButtonProps {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  color: string;
}

function OptionButton({ label, icon, selected, onPress, color }: OptionButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        activeOpacity={1}
        style={[
          styles.option,
          {
            backgroundColor: selected ? color + "18" : colors.card,
            borderColor: selected ? color : colors.border,
          },
        ]}
      >
        <View style={[styles.optionIcon, { backgroundColor: selected ? color + "22" : colors.muted }]}>
          <Feather name={icon as any} size={20} color={selected ? color : colors.mutedForeground} />
        </View>
        <Text style={[styles.optionLabel, { color: selected ? colors.foreground : colors.mutedForeground }]}>
          {label}
        </Text>
        {selected && (
          <View style={[styles.check, { backgroundColor: color }]}>
            <Feather name="check" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const { replace } = useNav();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const currentQ = onboardingQuestions[step];
  const accentColor = TRACK_COLORS[step];
  const canProceed = !!answers[currentQ.id];
  const isLast = step === onboardingQuestions.length - 1;

  const handleSelect = (questionId: string, value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = async () => {
    if (!canProceed) return;
    if (!isLast) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setStep((s) => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await completeOnboarding({
        stage: answers["stage"] || "working",
        biggestNeed: answers["biggest-need"] || "money",
        goal: answers["goal"] || "survive",
        name: "",
      });
      replace({ name: "tabs" });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: colors.background }]}>
        <View style={styles.dots}>
          {onboardingQuestions.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i <= step ? TRACK_COLORS[i] : colors.muted,
                  width: i === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.stepText, { color: colors.mutedForeground }]}>
          {step + 1} of {onboardingQuestions.length}
        </Text>
      </View>

      {/* Question — key resets animation on each step */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View key={step} entering={FadeIn.duration(280)}>
          <View style={[styles.questionIcon, { backgroundColor: accentColor + "18" }]}>
            <Feather name={currentQ.icon as any} size={32} color={accentColor} />
          </View>
          <Text style={[styles.question, { color: colors.foreground }]}>{currentQ.question}</Text>
        </Animated.View>

        <Animated.View key={`opts-${step}`} entering={FadeInDown.delay(80).duration(280)} style={styles.options}>
          {currentQ.options.map((opt) => (
            <OptionButton
              key={opt.value}
              label={opt.label}
              icon={opt.icon}
              selected={answers[currentQ.id] === opt.value}
              onPress={() => handleSelect(currentQ.id, opt.value)}
              color={accentColor}
            />
          ))}
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: bottomInset + 16, backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canProceed}
          style={[styles.nextButton, { backgroundColor: canProceed ? accentColor : colors.muted }]}
        >
          <Text style={[styles.nextText, { color: canProceed ? "#fff" : colors.mutedForeground }]}>
            {isLast ? "Get Started" : "Next"}
          </Text>
          <Feather
            name={isLast ? "arrow-right" : "chevron-right"}
            size={20}
            color={canProceed ? "#fff" : colors.mutedForeground}
          />
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
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
  stepText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  questionIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  question: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 34,
    marginBottom: 24,
  },
  options: { gap: 10 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  nextText: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
