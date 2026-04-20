import { Feather } from "@expo/vector-icons";
import React from "react";

import { useNav } from "@/context/NavigationContext";
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
import { LessonCard } from "@/components/LessonCard";
import { useApp } from "@/context/AppContext";
import { getTrack } from "@/data/tracks";
import { useColors } from "@/hooks/useColors";

export default function TrackScreen() {
  const { screen, goBack, navigate } = useNav();
  const id = (screen as { name: "track"; trackId: string }).trackId;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isLessonComplete, getTrackProgress } = useApp();

  const track = getTrack(id ?? "");

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  if (!track) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Track not found</Text>
      </View>
    );
  }

  const progress = getTrackProgress(track.id, track.lessonsCount);
  const completedCount = Math.round(progress * track.lessonsCount);
  const pct = Math.round(progress * 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 12, backgroundColor: track.color + "12" },
        ]}
      >
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: track.color + "22" }]}>
            <Feather name={track.icon as any} size={28} color={track.color} />
          </View>
          <Text style={[styles.trackTitle, { color: colors.foreground }]}>{track.title}</Text>
          <Text style={[styles.trackSubtitle, { color: colors.mutedForeground }]}>
            {track.subtitle}
          </Text>
          <View style={styles.progressRow}>
            <View style={[styles.progressBg, { backgroundColor: "rgba(0,0,0,0.08)" }]}>
              <View
                style={[styles.progressBar, { width: `${pct}%`, backgroundColor: track.color }]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
              {completedCount}/{track.lessonsCount} lessons
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            LESSONS
          </Text>
        </Animated.View>
        {track.lessons.map((lesson, i) => {
          const isComplete = isLessonComplete(lesson.id);
          const isLocked = false;
          return (
            <Animated.View key={lesson.id} entering={FadeInDown.delay(100 + i * 80).springify()}>
              <LessonCard
                lesson={lesson}
                trackColor={track.color}
                isComplete={isComplete}
                isLocked={isLocked}
                onPress={() =>
                  navigate({ name: "lesson", trackId: track.id, lessonId: lesson.id })
                }
              />
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 16, fontFamily: "Inter_500Medium" },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerContent: {
    gap: 6,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  trackSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  progressRow: {
    gap: 6,
    marginTop: 6,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
});
