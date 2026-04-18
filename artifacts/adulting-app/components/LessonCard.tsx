import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { Lesson } from "@/data/tracks";

interface LessonCardProps {
  lesson: Lesson;
  trackColor: string;
  isComplete: boolean;
  isLocked: boolean;
  onPress: () => void;
}

export function LessonCard({ lesson, trackColor, isComplete, isLocked, onPress }: LessonCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!isLocked) scale.value = withSpring(0.97, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={isLocked ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={isLocked ? 1 : 0.9}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isComplete ? trackColor + "40" : colors.border,
            opacity: isLocked ? 0.5 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.iconBg,
            {
              backgroundColor: isComplete ? trackColor + "18" : colors.muted,
            },
          ]}
        >
          <Feather
            name={lesson.icon as any}
            size={20}
            color={isComplete ? trackColor : colors.mutedForeground}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]}>{lesson.title}</Text>
          <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={1}>
            {lesson.description}
          </Text>
          <View style={styles.meta}>
            <Feather name="clock" size={11} color={colors.mutedForeground} />
            <Text style={[styles.duration, { color: colors.mutedForeground }]}>
              {lesson.duration} min
            </Text>
          </View>
        </View>
        {isComplete ? (
          <View style={[styles.checkCircle, { backgroundColor: trackColor }]}>
            <Feather name="check" size={14} color="#fff" />
          </View>
        ) : isLocked ? (
          <Feather name="lock" size={16} color={colors.mutedForeground} />
        ) : (
          <View style={[styles.playButton, { backgroundColor: trackColor + "18" }]}>
            <Feather name="chevron-right" size={18} color={trackColor} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  duration: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
