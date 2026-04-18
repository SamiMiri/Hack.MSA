import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { Track } from "@/data/tracks";

interface TrackCardProps {
  track: Track;
  progress: number;
  onPress: () => void;
  compact?: boolean;
}

export function TrackCard({ track, progress, onPress, compact = false }: TrackCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const completedCount = Math.round(progress * track.lessonsCount);
  const percentage = Math.round(progress * 100);

  if (compact) {
    return (
      <Animated.View style={animStyle}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={[styles.compactCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.compactIconBg, { backgroundColor: track.color + "20" }]}>
            <Feather name={track.icon as any} size={20} color={track.color} />
          </View>
          <View style={styles.compactInfo}>
            <Text style={[styles.compactTitle, { color: colors.foreground }]}>{track.title}</Text>
            <Text style={[styles.compactSub, { color: colors.mutedForeground }]}>
              {completedCount}/{track.lessonsCount} lessons
            </Text>
            <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${percentage}%`, backgroundColor: track.color },
                ]}
              />
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBg, { backgroundColor: track.color + "18" }]}>
            <Feather name={track.icon as any} size={26} color={track.color} />
          </View>
          {percentage > 0 && (
            <View style={[styles.badge, { backgroundColor: track.color + "18" }]}>
              <Text style={[styles.badgeText, { color: track.color }]}>{percentage}%</Text>
            </View>
          )}
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{track.title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{track.subtitle}</Text>
        <View style={styles.footer}>
          <View style={[styles.progressBgFull, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressBarFull,
                { width: `${percentage}%`, backgroundColor: track.color },
              ]}
            />
          </View>
          <Text style={[styles.lessonCount, { color: colors.mutedForeground }]}>
            {completedCount}/{track.lessonsCount} done
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
    lineHeight: 20,
  },
  footer: {
    gap: 6,
  },
  progressBgFull: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFull: {
    height: 6,
    borderRadius: 3,
  },
  lessonCount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  compactIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  compactInfo: {
    flex: 1,
    gap: 4,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  compactSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
});
