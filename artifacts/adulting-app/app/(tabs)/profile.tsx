import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const AVATARS: { id: number; source: ImageSourcePropType; label: string }[] = [
  { id: 1, source: require("../../assets/avatar1.jpg"), label: "IRS Chaos" },
  { id: 2, source: require("../../assets/avatar2.jpg"), label: "IRS Agent" },
  { id: 3, source: require("../../assets/avatar3.jpg"), label: "Briefcase" },
  { id: 4, source: require("../../assets/avatar4.jpg"), label: "Money Bag" },
];

const STAGE_LABELS: Record<string, string> = {
  student: "Still in school",
  "new-grad": "Just graduated",
  working: "Working, figuring things out",
  independent: "Living independently",
};

function AvatarDisplay({
  avatarId,
  name,
  size = 80,
}: {
  avatarId?: number;
  name?: string;
  size?: number;
}) {
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
    <View
      style={[
        styles.avatarFallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarLetter, { fontSize: size * 0.42 }]}>
        {name ? name[0].toUpperCase() : "A"}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, coins, completedLessons, updateProfile } = useApp();

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  const displayedName = profile?.displayName ?? profile?.name ?? "Adulter";
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayedName);
  const [showPicker, setShowPicker] = useState(false);

  async function saveName() {
    const trimmed = nameInput.trim();
    if (trimmed) await updateProfile({ displayName: trimmed });
    setEditingName(false);
  }

  async function selectAvatar(id: number) {
    await updateProfile({ avatarId: id });
    setShowPicker(false);
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: topInset + 16 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        </View>

        {/* Avatar hero */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.heroSection}>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            activeOpacity={0.85}
            style={styles.avatarTouchable}
          >
            <View style={[styles.avatarRing, { borderColor: colors.primary + "40" }]}>
              <AvatarDisplay avatarId={profile?.avatarId} name={profile?.name} size={96} />
            </View>
            <View style={[styles.cameraBtn, { backgroundColor: colors.primary }]}>
              <Feather name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.heroName, { color: colors.foreground }]}>{displayedName}</Text>
          {profile && (
            <Text style={[styles.heroStage, { color: colors.mutedForeground }]}>
              {STAGE_LABELS[profile.stage] ?? profile.stage}
            </Text>
          )}

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{completedLessons.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Lessons</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>🪙 {coins}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Coins</Text>
            </View>
          </View>
        </Animated.View>

        {/* Display name */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>DISPLAY NAME</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                  style={[styles.nameInput, { color: colors.foreground, borderColor: colors.border }]}
                  placeholderTextColor={colors.mutedForeground}
                  placeholder="Your display name"
                />
                <TouchableOpacity
                  onPress={saveName}
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditingName(false)}
                  style={[styles.cancelEditBtn, { backgroundColor: colors.muted }]}
                >
                  <Text style={[styles.cancelEditText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => { setNameInput(displayedName); setEditingName(true); }}
                activeOpacity={0.7}
                style={styles.nameDisplayRow}
              >
                <View style={[styles.rowIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="user" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.nameDisplayText, { color: colors.foreground }]}>
                  {displayedName}
                </Text>
                <Feather name="edit-2" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Avatar picker row */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>PROFILE PICTURE</Text>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            activeOpacity={0.7}
            style={[styles.card, styles.avatarRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="image" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.nameDisplayText, { color: colors.foreground }]}>
              {profile?.avatarId
                ? AVATARS.find((a) => a.id === profile.avatarId)?.label ?? "Custom"
                : "No picture selected"}
            </Text>
            {profile?.avatarId && (
              <Image
                source={AVATARS.find((a) => a.id === profile.avatarId)?.source}
                style={{ width: 32, height: 32, borderRadius: 16 }}
                resizeMode="cover"
              />
            )}
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Avatar picker modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sheet, { backgroundColor: colors.card }]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
              Choose your avatar
            </Text>
            <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
              Tap a picture to select it
            </Text>

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
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        borderWidth: selected ? 3 : 2,
                      },
                    ]}
                  >
                    <Image source={av.source} style={styles.avatarGridImg} resizeMode="cover" />
                    {selected && (
                      <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                        <Feather name="check" size={14} color="#fff" />
                      </View>
                    )}
                    <View style={[styles.avatarGridLabel, { backgroundColor: "rgba(0,0,0,0.45)" }]}>
                      <Text style={styles.avatarGridLabelText}>{av.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setShowPicker(false)}
              style={[styles.cancelSheetBtn, { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.cancelSheetText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 4 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", fontWeight: "700", marginBottom: 4 },
  heroSection: { alignItems: "center", paddingTop: 24, paddingBottom: 12, paddingHorizontal: 20 },
  avatarTouchable: { position: "relative", marginBottom: 14 },
  avatarRing: {
    borderWidth: 3,
    borderRadius: 60,
    padding: 3,
  },
  avatarFallback: {
    backgroundColor: "#4F6EF7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontFamily: "Inter_700Bold", color: "#fff" },
  cameraBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  heroName: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  heroStage: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 12, width: "100%" },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  nameDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  nameDisplayText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  nameInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  saveBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  saveBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cancelEditBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  cancelEditText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    paddingBottom: 48,
    alignItems: "center",
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#ccc", marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sheetSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 24 },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "center",
    marginBottom: 24,
  },
  avatarGridItem: {
    width: 136,
    height: 136,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  avatarGridImg: { width: "100%", height: "100%" },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGridLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 5,
    alignItems: "center",
  },
  avatarGridLabelText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cancelSheetBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 48 },
  cancelSheetText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
