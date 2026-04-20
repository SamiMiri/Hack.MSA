import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";

import { useNav } from "@/context/NavigationContext";
import {
  Dimensions,
  FlatList,
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
import { getLesson, getTrack, LessonStep } from "@/data/tracks";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

function TextStep({ step, trackColor }: { step: LessonStep; trackColor: string }) {
  const colors = useColors();
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
        <Text style={[styles.stepBody, { color: colors.foreground }]}>{step.content}</Text>
      </Animated.View>
    </ScrollView>
  );
}

function ChecklistStep({ step, trackColor }: { step: LessonStep; trackColor: string }) {
  const colors = useColors();
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
        <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>{step.content}</Text>
        <View style={styles.checklistItems}>
          {step.checklistItems?.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => toggle(i)}
              style={[
                styles.checkItem,
                {
                  backgroundColor: checked.has(i) ? trackColor + "12" : colors.card,
                  borderColor: checked.has(i) ? trackColor + "40" : colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.checkBox,
                  {
                    backgroundColor: checked.has(i) ? trackColor : colors.background,
                    borderColor: checked.has(i) ? trackColor : colors.border,
                  },
                ]}
              >
                {checked.has(i) && <Feather name="check" size={12} color="#fff" />}
              </View>
              <Text
                style={[
                  styles.checkItemText,
                  {
                    color: checked.has(i) ? colors.mutedForeground : colors.foreground,
                    textDecorationLine: checked.has(i) ? "line-through" : "none",
                  },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function ScenarioStep({ step, trackColor }: { step: LessonStep; trackColor: string }) {
  const colors = useColors();
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.stepContent}>
        <View style={[styles.scenarioBadge, { backgroundColor: trackColor + "18" }]}>
          <Feather name="users" size={14} color={trackColor} />
          <Text style={[styles.scenarioBadgeText, { color: trackColor }]}>Real-Life Scenario</Text>
        </View>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
        <View style={[styles.scenarioCard, { backgroundColor: trackColor + "10", borderColor: trackColor + "30" }]}>
          <Text style={[styles.stepBody, { color: colors.foreground }]}>{step.content}</Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

interface QuizStepProps {
  step: LessonStep;
  trackColor: string;
  onCorrect: () => void;
  onWrong: () => void;
}

function QuizStep({ step, trackColor, onCorrect, onWrong }: QuizStepProps) {
  const colors = useColors();
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === step.quiz?.correctIndex) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCorrect();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onWrong();
    }
  };

  const isCorrect = answered && selected === step.quiz?.correctIndex;
  const isWrong = answered && selected !== step.quiz?.correctIndex;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.stepContent}>
        <View style={[styles.quizBadge, { backgroundColor: "#FFE66D33" }]}>
          <Feather name="help-circle" size={14} color="#B8A000" />
          <Text style={[styles.quizBadgeText, { color: "#B8A000" }]}>Quiz</Text>
        </View>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.quiz?.question}</Text>

        <View style={styles.quizOptions}>
          {step.quiz?.options.map((opt, i) => {
            const isSelected = selected === i;
            const isRight = i === step.quiz?.correctIndex;
            let bg = colors.card;
            let border = colors.border;
            let textColor = colors.foreground;

            if (answered) {
              if (isRight) { bg = "#2ED57318"; border = "#2ED573"; textColor = colors.foreground; }
              else if (isSelected && !isRight) { bg = "#FF475718"; border = "#FF4757"; textColor = colors.foreground; }
            } else if (isSelected) {
              bg = trackColor + "18";
              border = trackColor;
            }

            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleSelect(i)}
                disabled={answered}
                style={[styles.quizOption, { backgroundColor: bg, borderColor: border }]}
              >
                <View style={[styles.quizOptionLetter, { backgroundColor: border + "30" }]}>
                  <Text style={[styles.quizOptionLetterText, { color: border }]}>
                    {["A", "B", "C", "D"][i]}
                  </Text>
                </View>
                <Text style={[styles.quizOptionText, { color: textColor }]}>{opt}</Text>
                {answered && isRight && (
                  <Feather name="check-circle" size={18} color="#2ED573" />
                )}
                {answered && isSelected && !isRight && (
                  <Feather name="x-circle" size={18} color="#FF4757" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {answered && step.quiz?.explanation && (
          <Animated.View
            entering={FadeInDown.springify()}
            style={[
              styles.explanation,
              { backgroundColor: isCorrect ? "#2ED57314" : "#FF475714", borderColor: isCorrect ? "#2ED57360" : "#FF475760" },
            ]}
          >
            <Feather
              name={isCorrect ? "check-circle" : "info"}
              size={16}
              color={isCorrect ? "#2ED573" : "#FF4757"}
            />
            <Text style={[styles.explanationText, { color: colors.foreground }]}>
              {step.quiz.explanation}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

export default function LessonScreen() {
  const { screen, goBack } = useNav();
  const { trackId, lessonId } = screen as { name: "lesson"; trackId: string; lessonId: string };
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeLesson, isLessonComplete } = useApp();

  const [currentStep, setCurrentStep] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const track = getTrack(trackId ?? "");
  const lesson = getLesson(trackId ?? "", lessonId ?? "");

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  if (!track || !lesson) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Lesson not found</Text>
      </View>
    );
  }

  const steps = lesson.steps;
  const currentStepData = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isQuiz = currentStepData.type === "quiz";
  const needsAnswerFirst = isQuiz && !quizAnswered;

  const handleNext = async () => {
    if (isLast) {
      const quizCount = steps.filter((s) => s.type === "quiz").length;
      const score = quizCount > 0 ? Math.round((correctAnswers / quizCount) * 100) : 100;
      await completeLesson({
        trackId: track.id,
        lessonId: lesson.id,
        completedAt: new Date().toISOString(),
        score,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFinished(true);
    } else {
      setCurrentStep((s) => s + 1);
      setQuizAnswered(false);
      flatListRef.current?.scrollToIndex({ index: currentStep + 1, animated: true });
    }
  };

  const handleCorrect = () => {
    setCorrectAnswers((c) => c + 1);
    setQuizAnswered(true);
  };

  const handleWrong = () => {
    setQuizAnswered(true);
  };

  if (finished) {
    const quizCount = steps.filter((s) => s.type === "quiz").length;
    const score = quizCount > 0 ? Math.round((correctAnswers / quizCount) * 100) : 100;
    const coinsEarned = 10 + (score >= 80 ? 5 : 0);
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.completedScreen, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]}>
          <Animated.View entering={FadeIn.springify()} style={styles.completedContent}>
            <View style={[styles.completedBadge, { backgroundColor: track.color + "18" }]}>
              <Feather name="award" size={48} color={track.color} />
            </View>
            <Text style={[styles.completedTitle, { color: colors.foreground }]}>Lesson Complete!</Text>
            <Text style={[styles.completedSubtitle, { color: colors.mutedForeground }]}>
              {lesson.title}
            </Text>
            <View style={[styles.coinsEarned, { backgroundColor: "#FFE66D18", borderColor: "#FFE66D50" }]}>
              <Text style={styles.coinsEarnedIcon}>⭐</Text>
              <Text style={[styles.coinsEarnedText, { color: "#D97706" }]}>+{coinsEarned} coins earned</Text>
              {score >= 80 && <Text style={[styles.coinsBonus, { color: "#D97706" }]}> (includes +5 quiz bonus!)</Text>}
            </View>
            {quizCount > 0 && (
              <View style={[styles.scoreCard, { backgroundColor: track.color, marginTop: 12 }]}>
                <Text style={styles.scoreCardLabel}>Quiz Score</Text>
                <Text style={styles.scoreCardNumber}>{score}%</Text>
                <Text style={styles.scoreCardSub}>
                  {correctAnswers}/{quizCount} correct
                </Text>
              </View>
            )}
            <View style={styles.completedActions}>
              <TouchableOpacity
                onPress={() => goBack()}
                style={[styles.completedBtn, { backgroundColor: track.color }]}
              >
                <Text style={styles.completedBtnText}>Back to Track</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.lessonHeader, { paddingTop: topInset + 12 }]}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}>
          <Feather name="x" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.lessonProgress, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.lessonProgressBar,
              {
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                backgroundColor: track.color,
              },
            ]}
          />
        </View>
        <Text style={[styles.lessonStepNum, { color: colors.mutedForeground }]}>
          {currentStep + 1}/{steps.length}
        </Text>
      </View>

      <View style={styles.stepContainer}>
        {currentStepData.type === "text" && (
          <TextStep step={currentStepData} trackColor={track.color} />
        )}
        {currentStepData.type === "scenario" && (
          <ScenarioStep step={currentStepData} trackColor={track.color} />
        )}
        {currentStepData.type === "checklist" && (
          <ChecklistStep step={currentStepData} trackColor={track.color} />
        )}
        {currentStepData.type === "quiz" && (
          <QuizStep
            step={currentStepData}
            trackColor={track.color}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        )}
      </View>

      <View style={[styles.lessonFooter, { paddingBottom: bottomInset + 12 }]}>
        <TouchableOpacity
          onPress={needsAnswerFirst ? undefined : handleNext}
          disabled={needsAnswerFirst}
          style={[
            styles.nextBtn,
            {
              backgroundColor: needsAnswerFirst ? colors.muted : track.color,
            },
          ]}
        >
          <Text
            style={[
              styles.nextBtnText,
              { color: needsAnswerFirst ? colors.mutedForeground : "#fff" },
            ]}
          >
            {needsAnswerFirst
              ? "Select an answer"
              : isLast
              ? "Complete Lesson"
              : "Next"}
          </Text>
          {!needsAnswerFirst && (
            <Feather
              name={isLast ? "check" : "arrow-right"}
              size={18}
              color="#fff"
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 16, fontFamily: "Inter_500Medium" },
  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonProgress: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  lessonProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  lessonStepNum: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    minWidth: 32,
    textAlign: "right",
  },
  stepContainer: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
    lineHeight: 30,
  },
  stepBody: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
  quizBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  quizBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  quizOptions: {
    gap: 10,
    marginTop: 4,
  },
  quizOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  quizOptionLetter: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  quizOptionLetterText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  quizOptionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  explanation: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  explanationText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  scenarioBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  scenarioBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  scenarioCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  checklistItems: { gap: 8, marginTop: 12 },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkItemText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  lessonFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  coinsEarned: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 10,
  },
  coinsEarnedIcon: { fontSize: 16, marginRight: 4 },
  coinsEarnedText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  coinsBonus: { fontSize: 12, fontFamily: "Inter_500Medium" },
  completedScreen: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  completedContent: { alignItems: "center", width: "100%" },
  completedBadge: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  completedSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  scoreCard: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  scoreCardLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  scoreCardNumber: {
    fontSize: 48,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  scoreCardSub: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
  },
  completedActions: { width: "100%", marginTop: 24, gap: 10 },
  completedBtn: {
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  completedBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
