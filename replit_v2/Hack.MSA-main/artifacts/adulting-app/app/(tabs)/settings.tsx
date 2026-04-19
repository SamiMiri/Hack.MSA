import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

const APP_VERSION = "1.0.0";
const BUILD = "2026.04";

const STAGE_LABELS: Record<string, string> = {
  student: "Still in school",
  "new-grad": "Just graduated",
  working: "Working, figuring things out",
  independent: "Living independently",
};

type ThemeMode = "light" | "dark" | "system";

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
      {title}
    </Text>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  colors,
  last,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  colors: any;
  last?: boolean;
}) {
  const labelColor = destructive ? "#FF4757" : colors.foreground;
  const iconColor = destructive ? "#FF4757" : colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.65}
      style={[
        styles.row,
        { borderBottomColor: last ? "transparent" : colors.border },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: (destructive ? "#FF4757" : colors.primary) + "18" }]}>
        <Feather name={icon as any} size={16} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
      {value ? (
        <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
      ) : onPress ? (
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, coins, completedLessons, resetApp } = useApp();
  const { mode, resolvedTheme, setMode } = useTheme();
  const [resetting, setResetting] = useState(false);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const themeOptions: { id: ThemeMode; label: string; icon: string }[] = [
    { id: "light", label: "Light", icon: "sun" },
    { id: "dark", label: "Dark", icon: "moon" },
    { id: "system", label: "Auto", icon: "smartphone" },
  ];

  function confirmReset() {
    if (Platform.OS === "web") {
      const ok = window.confirm(
        "Start over?\n\nThis will erase all your progress, coins, and profile. This cannot be undone."
      );
      if (ok) doReset();
    } else {
      Alert.alert(
        "Start Over?",
        "This will erase all your progress, coins, and profile. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Start Over", style: "destructive", onPress: doReset },
        ]
      );
    }
  }

  async function doReset() {
    setResetting(true);
    await resetApp();
    router.replace("/onboarding");
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
      </View>

      {profile && (
        <Animated.View entering={FadeInDown.delay(0).springify()} style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {profile.name ? profile.name[0].toUpperCase() : "A"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{profile.name || "Adulter"}</Text>
              <Text style={styles.profileStage}>
                {STAGE_LABELS[profile.stage] ?? profile.stage}
              </Text>
            </View>
            <View style={styles.coinBadge}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinCount}>{coins}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.section}>
        <SectionHeader title="APPEARANCE" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => {
              const active = mode === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setMode(opt.id)}
                  activeOpacity={0.75}
                  style={[
                    styles.themeOption,
                    active && { backgroundColor: colors.primary },
                    !active && { backgroundColor: colors.muted },
                  ]}
                >
                  <Feather
                    name={opt.icon as any}
                    size={15}
                    color={active ? "#fff" : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.themeLabel,
                      { color: active ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.section}>
        <SectionHeader title="PROGRESS" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="book-open"
            label="Lessons completed"
            value={String(completedLessons.length)}
            colors={colors}
          />
          <SettingsRow
            icon="dollar-sign"
            label="Coins earned"
            value={`🪙 ${coins}`}
            colors={colors}
            last
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.section}>
        <SectionHeader title="ABOUT" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="smartphone"
            label="App version"
            value={APP_VERSION}
            colors={colors}
          />
          <SettingsRow
            icon="calendar"
            label="Build"
            value={BUILD}
            colors={colors}
          />
          <SettingsRow
            icon="users"
            label="Made for"
            value="Young adults (18–25)"
            colors={colors}
            last
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.section}>
        <SectionHeader title="DATA" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="rotate-ccw"
            label={resetting ? "Resetting…" : "Start Over"}
            onPress={resetting ? undefined : confirmReset}
            destructive
            colors={colors}
            last
          />
        </View>
        <Text style={[styles.resetHint, { color: colors.mutedForeground }]}>
          Erases all progress, coins, and your profile. You'll restart from the beginning.
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    marginBottom: 4,
  },
  profileCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  profileName: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 2,
  },
  profileStage: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  coinIcon: { fontSize: 14 },
  coinCount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 1,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  rowValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  themeRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  themeLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  resetHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 17,
  },
});
