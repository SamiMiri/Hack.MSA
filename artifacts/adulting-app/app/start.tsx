import React from "react";
import {
  Image,
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
import { Feather } from "@expo/vector-icons";

import { useApp } from "@/context/AppContext";
import { useNav } from "@/context/NavigationContext";

const START_IMAGE = require("../assets/start-screen.jpg");

function PlayButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={styles.playButton}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.93, { damping: 14 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 14 }); }}
        activeOpacity={1}
        accessibilityLabel="Play"
      >
        <Feather name="play" size={38} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function StartScreen() {
  const { navigate } = useNav();
  const { onboardingComplete } = useApp();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 20) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 24) : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      <Animated.View entering={FadeIn.delay(80).duration(500)} style={styles.header}>
        <Text style={styles.eyebrow}>LIFE SIM</Text>
        <Text style={styles.title}>Adulting{"\n"}101</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.imageWrapper}>
        <Image
          source={START_IMAGE}
          style={styles.image}
          resizeMode="cover"
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.footer}>
        <PlayButton onPress={() => navigate(onboardingComplete ? { name: "tabs" } : { name: "onboarding" })} />
        <Text style={styles.tagline}>Make choices. Face consequences. Try to survive.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    paddingTop: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 3,
    color: "#9ca3af",
    marginBottom: 6,
  },
  title: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    lineHeight: 52,
    letterSpacing: -1,
  },
  imageWrapper: {
    width: "100%",
    maxHeight: 340,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  image: {
    width: "100%",
    height: 340,
  },
  footer: {
    alignItems: "center",
    gap: 16,
    paddingBottom: 8,
  },
  playButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#9ca3af",
    textAlign: "center",
  },
});
