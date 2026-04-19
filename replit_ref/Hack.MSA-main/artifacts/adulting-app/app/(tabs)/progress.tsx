import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { tracks } from "@/data/tracks";
import { useColors } from "@/hooks/useColors";

const MILESTONES = [
  { threshold: 1, label: "First Step", icon: "flag", color: "#FF6B6B" },
  { threshold: 3, label: "Getting Traction", icon: "zap", color: "#FFE66D" },
  { threshold: 6, label: "Halfway There", icon: "star", color: "#4ECDC4" },
  { threshold: 8, label: "Almost Done", icon: "award", color: "#A29BFE" },
  { threshold: 10, label: "Adulting Pro", icon: "shield", color: "#2ED573" },
];

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completedLessons, getTrackProgress } = useApp();

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const totalLessons = tracks.reduce((sum, t) => sum + t.lessonsCount, 0);
  const completedCount = completedLessons.length;

  const nextMilestone = MILESTONES.find((m) => m.threshold > completedCount);
  const lastMilestone = [...MILESTONES].reverse().find((m) => m.threshold <= completedCount);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: topInset + 16 }}>
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.foreground }]}>Your Progress</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={[styles.overallCard, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.overallLabel}>Total Lessons Completed</Text>
          <Text style={styles.overallNumber}>{completedCount}</Text>
          <Text style={styles.overallSub}>out of {totalLessons} lessons</Text>
          <View style={styles.overallProgressBg}>
            <View
              style={[
                styles.overallProgressBar,
                { width: `${totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0}%` },
              ]}
            />
          </View>
          {nextMilestone && (
            <Text style={styles.overallNextLabel}>
              {nextMilestone.threshold - completedCount} more to unlock "{nextMilestone.label}"
            </Text>
          )}
          {!nextMilestone && (
            <Text style={styles.overallNextLabel}>You've completed all available lessons!</Text>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Milestones</Text>
          <View style={styles.milestoneRow}>
            {MILESTONES.map((m) => {
              const unlocked = completedCount >= m.threshold;
              return (
                <View key={m.label} style={styles.milestoneItem}>
                  <View
                    style={[
                      styles.milestoneBadge,
                      {
                        backgroundColor: unlocked ? m.color + "20" : colors.muted,
                        borderColor: unlocked ? m.color : colors.border,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <Feather
                      name={m.icon as any}
                      size={22}
                      color={unlocked ? m.color : colors.mutedForeground}
                    />
                  </View>
                  <Text
                    style={[
                      styles.milestoneLabel,
                      { color: unlocked ? colors.foreground : colors.mutedForeground },
                    ]}
                    numberOfLines={2}
                  >
                    {m.label}
                  </Text>
                  {!unlocked && (
                    <Text style={[styles.milestoneLock, { color: colors.mutedForeground }]}>
                      {m.threshold} lessons
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Track Progress</Text>
          {tracks.map((track, i) => {
            const progress = getTrackProgress(track.id, track.lessonsCount);
            const done = Math.round(progress * track.lessonsCount);
            const pct = Math.round(progress * 100);

            return (
              <TouchableOpacity
                key={track.id}
                onPress={() => router.push(`/track/${track.id}` as any)}
                style={[styles.trackRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.trackIcon, { backgroundColor: track.color + "18" }]}>
                  <Feather name={track.icon as any} size={20} color={track.color} />
                </View>
                <View style={styles.trackInfo}>
                  <Text style={[styles.trackName, { color: colors.foreground }]}>{track.title}</Text>
                  <View style={[styles.trackProgressBg, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.trackProgressBar,
                        { width: `${pct}%`, backgroundColor: track.color },
                      ]}
                    />
                  </View>
                  <Text style={[styles.trackDone, { color: colors.mutedForeground }]}>
                    {done}/{track.lessonsCount} lessons
                  </Text>
                </View>
                <Text style={[styles.trackPct, { color: track.color }]}>{pct}%</Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {completedLessons.length > 0 && (
          <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Completed Lessons</Text>
            {completedLessons
              .slice()
              .reverse()
              .map((cl) => {
                const track = tracks.find((t) => t.id === cl.trackId);
                const lesson = track?.lessons.find((l) => l.id === cl.lessonId);
                if (!track || !lesson) return null;
                return (
                  <View
                    key={cl.lessonId}
                    style={[styles.completedRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.completedCheck, { backgroundColor: track.color }]}>
                      <Feather name="check" size={14} color="#fff" />
                    </View>
                    <View style={styles.completedInfo}>
                      <Text style={[styles.completedLesson, { color: colors.foreground }]}>
                        {lesson.title}
                      </Text>
                      <Text style={[styles.completedTrack, { color: colors.mutedForeground }]}>
                        {track.title}
                      </Text>
                    </View>
                    {cl.score > 0 && (
                      <View style={[styles.scoreBadge, { backgroundColor: track.color + "18" }]}>
                        <Text style={[styles.scoreText, { color: track.color }]}>
                          {cl.score}%
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
          </Animated.View>
        )}

        {completedLessons.length === 0 && (
          <Animated.View
            entering={FadeInDown.delay(320).springify()}
            style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="book-open" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No lessons yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Complete your first lesson to see progress here
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/learn")}
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.emptyButtonText}>Start Learning</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold" },
  overallCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 4,
  },
  overallLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  overallNumber: { fontSize: 48, fontWeight: "700", fontFamily: "Inter_700Bold", color: "#fff" },
  overallSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginBottom: 16 },
  overallProgressBg: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  overallProgressBar: { height: 8, backgroundColor: "#fff", borderRadius: 4 },
  overallNextLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.85)" },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 19, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 14 },
  milestoneRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  milestoneItem: { flex: 1, alignItems: "center", gap: 6 },
  milestoneBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 13,
  },
  milestoneLock: { fontSize: 9, fontFamily: "Inter_500Medium" },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  trackIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  trackInfo: { flex: 1, gap: 6 },
  trackName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  trackProgressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  trackProgressBar: { height: 6, borderRadius: 3 },
  trackDone: { fontSize: 11, fontFamily: "Inter_500Medium" },
  trackPct: { fontSize: 16, fontFamily: "Inter_700Bold" },
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  completedCheck: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  completedInfo: { flex: 1 },
  completedLesson: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  completedTrack: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  scoreText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  emptyState: {
    margin: 20,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 8 },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyButton: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  emptyButtonText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});
