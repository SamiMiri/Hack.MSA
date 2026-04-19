import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ImageSourcePropType,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { useNav } from "@/context/NavigationContext";

const APP_VERSION = "1.0.0";
const BUILD = "2026.04";

const AVATARS: { id: number; source: ImageSourcePropType }[] = [
  { id: 1, source: require("../../assets/avatar1.jpg") },
  { id: 2, source: require("../../assets/avatar2.jpg") },
  { id: 3, source: require("../../assets/avatar3.jpg") },
  { id: 4, source: require("../../assets/avatar4.jpg") },
];

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

function AvatarDisplay({ avatarId, name, size = 48 }: { avatarId?: number; name?: string; size?: number }) {
  const avatar = AVATARS.find((a) => a.id === avatarId);
  if (avatar) {
    return (
      <Image
        source={avatar.source}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarLetter, { fontSize: size * 0.45 }]}>
        {name ? name[0].toUpperCase() : "A"}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { navigate } = useNav();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, coins, completedLessons, resetApp, updateProfile } = useApp();
  const { mode, setMode } = useTheme();
  const [resetting, setResetting] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.displayName ?? profile?.name ?? "");

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const themeOptions: { id: ThemeMode; label: string; icon: string }[] = [
    { id: "light", label: "Light", icon: "sun" },
    { id: "dark", label: "Dark", icon: "moon" },
    { id: "system", label: "Auto", icon: "smartphone" },
  ];

  const displayedName = profile?.displayName ?? profile?.name ?? "Adulter";

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
    navigate({ name: "onboarding" });
  }

  async function saveName() {
    const trimmed = nameInput.trim();
    if (trimmed) await updateProfile({ displayName: trimmed });
    setEditingName(false);
  }

  async function selectAvatar(id: number) {
    await updateProfile({ avatarId: id });
    setShowAvatarPicker(false);
  }

  return (
    <>
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
              <TouchableOpacity onPress={() => setShowAvatarPicker(true)} activeOpacity={0.8}>
                <View style={styles.avatarWrapper}>
                  <AvatarDisplay avatarId={profile.avatarId} name={profile.name} size={52} />
                  <View style={styles.avatarEditBadge}>
                    <Feather name="camera" size={10} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{displayedName}</Text>
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

        <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.section}>
          <SectionHeader title="PROFILE" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.primary + "18" }]}>
                <Feather name="user" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Display name</Text>
              {editingName ? (
                <View style={styles.nameInputRow}>
                  <TextInput
                    value={nameInput}
                    onChangeText={setNameInput}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={saveName}
                    style={[styles.nameInput, { color: colors.foreground, borderColor: colors.border }]}
                    placeholderTextColor={colors.mutedForeground}
                    placeholder="Your name"
                  />
                  <TouchableOpacity onPress={saveName} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => { setNameInput(displayedName); setEditingName(true); }} style={styles.editNameBtn}>
                  <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{displayedName}</Text>
                  <Feather name="edit-2" size={13} color={colors.mutedForeground} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowAvatarPicker(true)}
              activeOpacity={0.65}
              style={[styles.row, { borderBottomColor: "transparent" }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: colors.primary + "18" }]}>
                <Feather name="image" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Profile picture</Text>
              {profile?.avatarId ? (
                <Image
                  source={AVATARS.find((a) => a.id === profile.avatarId)?.source}
                  style={{ width: 28, height: 28, borderRadius: 14, marginRight: 4 }}
                  resizeMode="cover"
                />
              ) : null}
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.section}>
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
                    <Feather name={opt.icon as any} size={15} color={active ? "#fff" : colors.mutedForeground} />
                    <Text style={[styles.themeLabel, { color: active ? "#fff" : colors.mutedForeground }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.section}>
          <SectionHeader title="PROGRESS" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsRow icon="book-open" label="Lessons completed" value={String(completedLessons.length)} colors={colors} />
            <SettingsRow icon="dollar-sign" label="Coins earned" value={`🪙 ${coins}`} colors={colors} last />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <SectionHeader title="ABOUT" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingsRow icon="smartphone" label="App version" value={APP_VERSION} colors={colors} />
            <SettingsRow icon="calendar" label="Build" value={BUILD} colors={colors} />
            <SettingsRow icon="users" label="Made for" value="Young adults (18–25)" colors={colors} last />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.section}>
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

      <Modal
        visible={showAvatarPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAvatarPicker(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.pickerSheet, { backgroundColor: colors.card }]}>
            <View style={styles.pickerHandle} />
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Choose your avatar</Text>
            <Text style={[styles.pickerSubtitle, { color: colors.mutedForeground }]}>Tap a picture to select it</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map((av) => {
                const selected = profile?.avatarId === av.id;
                return (
                  <TouchableOpacity
                    key={av.id}
                    onPress={() => selectAvatar(av.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.avatarGridItem,
                      selected && { borderColor: colors.primary, borderWidth: 3 },
                      !selected && { borderColor: colors.border, borderWidth: 2 },
                    ]}
                  >
                    <Image
                      source={av.source}
                      style={styles.avatarGridImage}
                      resizeMode="cover"
                    />
                    {selected && (
                      <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                        <Feather name="check" size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={() => setShowAvatarPicker(false)}
              style={[styles.cancelBtn, { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", fontWeight: "700", marginBottom: 4 },
  profileCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarWrapper: { position: "relative" },
  avatarCircle: {
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontFamily: "Inter_700Bold", color: "#fff" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  profileName: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 2 },
  profileStage: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
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
  coinCount: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionHeader: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 1,
    minHeight: 54,
  },
  rowIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  rowValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
  editNameBtn: { flexDirection: "row", alignItems: "center" },
  nameInputRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  nameInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 36,
  },
  saveBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  saveBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  themeRow: { flexDirection: "row", gap: 8, padding: 12 },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  themeLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  resetHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8, marginLeft: 4, lineHeight: 17 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    marginBottom: 20,
  },
  pickerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  pickerSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 24 },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    marginBottom: 24,
  },
  avatarGridItem: {
    width: 130,
    height: 130,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  avatarGridImage: { width: "100%", height: "100%" },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginTop: 4 },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
