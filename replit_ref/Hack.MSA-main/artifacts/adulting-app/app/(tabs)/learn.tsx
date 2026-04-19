import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrackCard } from "@/components/TrackCard";
import { useApp } from "@/context/AppContext";
import { tracks } from "@/data/tracks";
import { useColors } from "@/hooks/useColors";

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getTrackProgress } = useApp();

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: topInset + 16 }}>
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.foreground }]}>Skill Tracks</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Pick a track and start learning life skills
          </Text>
        </Animated.View>

        <View style={styles.tracks}>
          {tracks.map((track, i) => (
            <Animated.View key={track.id} entering={FadeInDown.delay(80 + i * 100).springify()}>
              <TrackCard
                track={track}
                progress={getTrackProgress(track.id, track.lessonsCount)}
                onPress={() => router.push(`/track/${track.id}` as any)}
              />
            </Animated.View>
          ))}
        </View>

        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={[styles.comingSoon, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.comingSoonTitle, { color: colors.mutedForeground }]}>
            More tracks coming soon
          </Text>
          <View style={styles.comingSoonTracks}>
            {["Housing & Leases", "Career & Benefits", "Health Insurance"].map((name) => (
              <View
                key={name}
                style={[styles.comingSoonBadge, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.comingSoonBadgeText, { color: colors.mutedForeground }]}>
                  {name}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  tracks: {
    paddingHorizontal: 20,
  },
  comingSoon: {
    margin: 20,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  comingSoonTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  comingSoonTracks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  comingSoonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  comingSoonBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
