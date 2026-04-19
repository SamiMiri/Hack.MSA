import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CORAL = "#FF6B6B";
const CORAL_DEEP = "#C0392B";

const PILLS = [
  { emoji: "💰", label: "Money" },
  { emoji: "🏠", label: "Housing" },
  { emoji: "💼", label: "Career" },
  { emoji: "🏥", label: "Health" },
];

function StartButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={styles.startButton}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 14 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 14 }); }}
        activeOpacity={1}
      >
        <Text style={styles.startButtonText}>Start Now</Text>
        <View style={styles.arrowCircle}>
          <Feather name="arrow-right" size={18} color={CORAL} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function StartScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 20) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 24) : insets.bottom;

  return (
    <View style={styles.container}>
      {/* Decorative background blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      {/* Top badge */}
      <Animated.View
        entering={FadeIn.delay(100).duration(600)}
        style={[styles.topBadge, { marginTop: topPad + 32 }]}
      >
        <Text style={styles.topBadgeText}>Your adulting journey starts here</Text>
      </Animated.View>

      {/* Logo */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.logoSection}>
        <View style={styles.logoRing}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🎓</Text>
          </View>
        </View>
        <Text style={styles.appName}>Adulting 101</Text>
        <Text style={styles.slogan}>
          Real life skills.{"\n"}No instruction manual needed.
        </Text>
      </Animated.View>

      {/* Feature pills */}
      <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.pillsSection}>
        <View style={styles.pillsRow}>
          {PILLS.map((p) => (
            <View key={p.label} style={styles.pill}>
              <Text style={styles.pillEmoji}>{p.emoji}</Text>
              <Text style={styles.pillText}>{p.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Bottom area */}
      <Animated.View
        entering={FadeInUp.delay(450).springify()}
        style={[styles.bottomArea, { paddingBottom: botPad + 24 }]}
      >
        <StartButton onPress={() => router.replace("/onboarding")} />
        <Text style={styles.freeNote}>Free to start · No account needed</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORAL,
    alignItems: "center",
  },
  blob1: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -80,
    right: -100,
  },
  blob2: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.07)",
    bottom: 120,
    left: -80,
  },
  blob3: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(0,0,0,0.07)",
    bottom: 60,
    right: 20,
  },
  topBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  logoSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  logoRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: {
    fontSize: 42,
  },
  appName: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  slogan: {
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
    lineHeight: 26,
  },
  pillsSection: {
    width: "100%",
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillEmoji: { fontSize: 14 },
  pillText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  bottomArea: {
    width: "100%",
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 14,
  },
  startButton: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 17,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    color: CORAL,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CORAL + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  freeNote: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
