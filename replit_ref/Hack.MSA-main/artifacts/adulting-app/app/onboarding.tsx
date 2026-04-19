import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
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

const { width } = Dimensions.get("window");

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
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.option,
          {
            backgroundColor: selected ? color + "18" : colors.card,
            borderColor: selected ? color : colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.optionIcon,
            { backgroundColor: selected ? color + "22" : colors.muted },
          ]}
        >
          <Feather name={icon as any} size={20} color={selected ? color : colors.mutedForeground} />
        </View>
        <Text
          style={[
            styles.optionLabel,
            { color: selected ? colors.foreground : colors.mutedForeground },
          ]}
        >
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
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const flatListRef = useRef<FlatList>(null);

  const TRACK_COLORS = ["#FF6B6B", "#4ECDC4", "#A29BFE"];

  const handleSelect = (questionId: string, value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = async () => {
    if (step < onboardingQuestions.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const next = step + 1;
      setStep(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await completeOnboarding({
        stage: answers["stage"] || "working",
        biggestNeed: answers["biggest-need"] || "money",
        goal: answers["goal"] || "survive",
        name: "",
      });
      router.replace("/(tabs)");
    }
  };

  const currentQ = onboardingQuestions[step];
  const currentAnswer = answers[currentQ.id];
  const canProceed = !!currentAnswer;

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 16, paddingBottom: 16, backgroundColor: colors.background },
        ]}
      >
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

      <FlatList
        ref={flatListRef}
        data={onboardingQuestions}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(q) => q.id}
        renderItem={({ item, index }) => (
          <View style={[styles.page, { width }]}>
            <Animated.View entering={FadeIn.delay(100)}>
              <View style={[styles.questionIcon, { backgroundColor: TRACK_COLORS[index] + "18" }]}>
                <Feather name={item.icon as any} size={32} color={TRACK_COLORS[index]} />
              </View>
              <Text style={[styles.question, { color: colors.foreground }]}>{item.question}</Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(200)} style={styles.options}>
              {item.options.map((opt) => (
                <OptionButton
                  key={opt.value}
                  label={opt.label}
                  icon={opt.icon}
                  selected={answers[item.id] === opt.value}
                  onPress={() => handleSelect(item.id, opt.value)}
                  color={TRACK_COLORS[index]}
                />
              ))}
            </Animated.View>
          </View>
        )}
      />

      <View
        style={[
          styles.footer,
          { paddingBottom: bottomInset + 16, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canProceed}
          style={[
            styles.nextButton,
            {
              backgroundColor: canProceed ? TRACK_COLORS[step] : colors.muted,
            },
          ]}
        >
          <Text
            style={[
              styles.nextText,
              { color: canProceed ? "#fff" : colors.mutedForeground },
            ]}
          >
            {step === onboardingQuestions.length - 1 ? "Get Started" : "Next"}
          </Text>
          <Feather
            name={step === onboardingQuestions.length - 1 ? "arrow-right" : "chevron-right"}
            size={20}
            color={canProceed ? "#fff" : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  stepText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  page: {
    paddingHorizontal: 24,
    paddingTop: 24,
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
  options: {
    gap: 10,
  },
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
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  nextText: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
