import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, router } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="learn">
        <Icon sf={{ default: "book", selected: "book.fill" }} />
        <Label>Learn</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="simulate">
        <Icon sf={{ default: "gamecontroller", selected: "gamecontroller.fill" }} />
        <Label>Play</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon sf={{ default: "ellipsis", selected: "ellipsis" }} />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function MoreTabButton({
  onPress,
  color,
  isWeb,
}: {
  onPress: () => void;
  color: string;
  isWeb: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.moreButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Feather name="more-horizontal" size={22} color={color} />
      <Text style={[styles.moreLabel, { color, marginBottom: isWeb ? 8 : 0 }]}>
        More
      </Text>
    </TouchableOpacity>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const { resolvedTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = resolvedTheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const [moreOpen, setMoreOpen] = useState(false);
  const TAB_BAR_HEIGHT = isWeb ? 84 : 60;

  const MENU_ITEMS = [
    { label: "Tools", icon: "tool", route: "/(tabs)/tools" },
    { label: "Progress", icon: "bar-chart-2", route: "/(tabs)/progress" },
    { label: "Settings", icon: "settings", route: "/(tabs)/settings" },
  ] as const;

  function closeMenu() {
    setMoreOpen(false);
  }

  function go(route: string) {
    closeMenu();
    router.push(route as any);
  }

  const dropdownBottom = TAB_BAR_HEIGHT + insets.bottom + 8;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            elevation: 0,
            ...(isWeb ? { height: TAB_BAR_HEIGHT } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : isWeb ? (
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
              />
            ) : null,
          tabBarLabelStyle: {
            fontFamily: "Inter_600SemiBold",
            fontSize: 11,
            marginBottom: isWeb ? 8 : 0,
          },
          tabBarItemStyle: {
            alignItems: "center",
            justifyContent: "center",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="house" tintColor={color} size={24} />
              ) : (
                <Feather name="home" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="learn"
          options={{
            title: "Learn",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="book" tintColor={color} size={24} />
              ) : (
                <Feather name="book-open" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="simulate"
          options={{
            title: "Play",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="gamecontroller" tintColor={color} size={24} />
              ) : (
                <Feather name="play-circle" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            tabBarButton: () => (
              <MoreTabButton
                onPress={() => setMoreOpen((v) => !v)}
                color={moreOpen ? colors.primary : colors.mutedForeground}
                isWeb={isWeb}
              />
            ),
          }}
        />
        {/* Hidden routes — zero-width so they don't affect tab centering */}
        <Tabs.Screen
          name="tools"
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { flex: 0, width: 0, overflow: "hidden" },
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { flex: 0, width: 0, overflow: "hidden" },
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { flex: 0, width: 0, overflow: "hidden" },
          }}
        />
      </Tabs>

      {/* Dropdown overlay — rendered after <Tabs> so it sits on top */}
      {moreOpen && (
        <>
          {/* Invisible full-screen backdrop: tap anywhere outside to close */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={closeMenu}
            activeOpacity={1}
          />

          {/* The actual menu card */}
          <View
            style={[
              styles.dropdown,
              {
                bottom: dropdownBottom,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            {MENU_ITEMS.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => go(item.route)}
                activeOpacity={0.7}
                style={[
                  styles.dropdownItem,
                  i < MENU_ITEMS.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.dropdownIcon,
                    { backgroundColor: colors.primary + "18" },
                  ]}
                >
                  <Feather name={item.icon as any} size={16} color={colors.primary} />
                </View>
                <Text style={[styles.dropdownLabel, { color: colors.foreground }]}>
                  {item.label}
                </Text>
                <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  dropdown: {
    position: "absolute",
    right: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    minWidth: 210,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  dropdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  moreButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  moreLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
