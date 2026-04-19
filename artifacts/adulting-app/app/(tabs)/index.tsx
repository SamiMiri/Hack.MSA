import { Feather } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
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
import { TrackCard } from "@/components/TrackCard";
import { useApp } from "@/context/AppContext";
import { tracks } from "@/data/tracks";
import { useColors } from "@/hooks/useColors";

const DEADLINES = [
  { id: "1", label: "Tax filing deadline", date: "Apr 15", icon: "file-text", color: "#4ECDC4" },
  { id: "2", label: "Q1 estimated taxes (self-employed)", date: "Apr 15", icon: "dollar-sign", color: "#FF6B6B" },
  { id: "3", label: "W-2s & 1099s should arrive", date: "Jan 31", icon: "mail", color: "#A29BFE" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, getTrackProgress, completedLessons, onboardingComplete } = useApp();

  if (!onboardingComplete) {
    return <Redirect href="/start" />;
  }

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const totalLessons = tracks.reduce((sum, t) => sum + t.lessonsCount, 0);
  const completedCount = completedLessons.length;
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const greetings: Record<string, string> = {
    student: "Still in school",
    "new-grad": "Just graduated",
    working: "Working it out",
    independent: "Living independently",
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.heroSection, { paddingTop: topInset + 16 }]}>
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {profile?.stage ? greetings[profile.stage] ?? "Welcome" : "Welcome back"}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Let's get adulting
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={[styles.statsCard, { backgroundColor: colors.primary }]}
        >
          <View style={styles.statRow}>
            <View>
              <Text style={styles.statNumber}>{completedCount}</Text>
              <Text style={styles.statLabel}>Lessons done</Text>
            </View>
            <View style={styles.statDivider} />
            <View>
              <Text style={styles.statNumber}>{overallPct}%</Text>
              <Text style={styles.statLabel}>Overall progress</Text>
            </View>
            <View style={styles.statDivider} />
            <View>
              <Text style={styles.statNumber}>{tracks.length}</Text>
              <Text style={styles.statLabel}>Skill tracks</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.section}>
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skill Tracks</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/learn")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </Animated.View>
        {tracks.map((track, i) => (
          <Animated.View key={track.id} entering={FadeInDown.delay(200 + i * 80).springify()}>
            <TrackCard
              track={track}
              progress={getTrackProgress(track.id, track.lessonsCount)}
              onPress={() => router.push(`/track/${track.id}` as any)}
            />
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(360).springify()} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Deadlines</Text>
        </View>
        <View style={[styles.deadlineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {DEADLINES.map((d, i) => (
            <View key={d.id}>
              <View style={styles.deadlineRow}>
                <View style={[styles.deadlineIcon, { backgroundColor: d.color + "18" }]}>
                  <Feather name={d.icon as any} size={16} color={d.color} />
                </View>
                <View style={styles.deadlineInfo}>
                  <Text style={[styles.deadlineLabel, { color: colors.foreground }]}>{d.label}</Text>
                </View>
                <View style={[styles.dateBadge, { backgroundColor: d.color + "18" }]}>
                  <Text style={[styles.dateText, { color: d.color }]}>{d.date}</Text>
                </View>
              </View>
              {i < DEADLINES.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(440).springify()} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Tools</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/tools")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toolsRow}>
          {[
            { icon: "sliders", label: "Budget", color: "#FF6B6B", tab: "/(tabs)/tools" },
            { icon: "check-square", label: "Lease Checklist", color: "#A29BFE", tab: "/(tabs)/tools" },
            { icon: "file-text", label: "Tax Doc Tracker", color: "#4ECDC4", tab: "/(tabs)/tools" },
          ].map((tool) => (
            <TouchableOpacity
              key={tool.label}
              onPress={() => router.push(tool.tab as any)}
              style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.toolIcon, { backgroundColor: tool.color + "18" }]}>
                <Feather name={tool.icon as any} size={20} color={tool.color} />
              </View>
              <Text style={[styles.toolLabel, { color: colors.foreground }]}>{tool.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },
  statsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 4,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  deadlineCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  deadlineIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  toolsRow: {
    flexDirection: "row",
    gap: 10,
  },
  toolCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  toolLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
});
