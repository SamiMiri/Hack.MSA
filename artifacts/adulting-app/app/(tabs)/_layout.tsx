import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, router } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
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

/* ─────────────────────────────────────────────
   Native (Liquid Glass) layout — iOS 26+
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   Custom tab bar — full control, no routing bugs
───────────────────────────────────────────── */
const MAIN_TABS = [
  { name: "index", label: "Home", icon: "home" as const, sfIcon: "house" },
  { name: "learn", label: "Learn", icon: "book-open" as const, sfIcon: "book" },
  { name: "simulate", label: "Play", icon: "play-circle" as const, sfIcon: "gamecontroller" },
];

const MENU_ITEMS = [
  { label: "Tools", icon: "tool" as const, route: "/(tabs)/tools" },
  { label: "Progress", icon: "bar-chart-2" as const, route: "/(tabs)/progress" },
  { label: "Settings", icon: "settings" as const, route: "/(tabs)/settings" },
] as const;

interface CustomTabBarProps extends BottomTabBarProps {
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
  isIOS: boolean;
  isWeb: boolean;
  moreOpen: boolean;
  onMorePress: () => void;
  tabBarHeight: number;
}

function CustomTabBar({
  state,
  navigation,
  colors,
  isDark,
  isIOS,
  isWeb,
  moreOpen,
  onMorePress,
  tabBarHeight,
}: CustomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        {
          height: tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopColor: colors.border,
        },
      ]}
    >
      {isIOS && (
        <BlurView
          intensity={100}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      )}

      {MAIN_TABS.map((tab) => {
        const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
        const isFocused = state.index === routeIndex;
        const color = isFocused ? colors.primary : colors.mutedForeground;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => {
              if (!isFocused) {
                navigation.navigate(tab.name);
              }
            }}
            activeOpacity={0.7}
          >
            {isIOS ? (
              <SymbolView name={tab.sfIcon} tintColor={color} size={24} />
            ) : (
              <Feather name={tab.icon} size={22} color={color} />
            )}
            <Text
              style={[
                styles.tabLabel,
                { color, marginBottom: isWeb ? 8 : 0 },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* More — pure UI button, zero routing involvement */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={onMorePress}
        activeOpacity={0.7}
      >
        <Feather
          name="more-horizontal"
          size={22}
          color={moreOpen ? colors.primary : colors.mutedForeground}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: moreOpen ? colors.primary : colors.mutedForeground,
              marginBottom: isWeb ? 8 : 0,
            },
          ]}
        >
          More
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─────────────────────────────────────────────
   Classic layout (Android / Web / older iOS)
───────────────────────────────────────────── */
function ClassicTabLayout() {
  const colors = useColors();
  const { resolvedTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = resolvedTheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const [moreOpen, setMoreOpen] = useState(false);
  const TAB_BAR_HEIGHT = isWeb ? 60 : 56;

  const dropdownBottom = TAB_BAR_HEIGHT + insets.bottom + 8;

  function closeMenu() {
    setMoreOpen(false);
  }

  function go(route: string) {
    closeMenu();
    router.push(route as any);
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            colors={colors}
            isDark={isDark}
            isIOS={isIOS}
            isWeb={isWeb}
            moreOpen={moreOpen}
            onMorePress={() => setMoreOpen((v) => !v)}
            tabBarHeight={TAB_BAR_HEIGHT}
          />
        )}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="learn" />
        <Tabs.Screen name="simulate" />
        <Tabs.Screen name="more" />
        <Tabs.Screen name="tools" />
        <Tabs.Screen name="progress" />
        <Tabs.Screen name="settings" />
      </Tabs>

      {/* Dropdown — rendered outside <Tabs> so it floats above everything */}
      {moreOpen && (
        <>
          {/* Transparent backdrop — tap to close */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={closeMenu}
            activeOpacity={1}
          />

          {/* Menu card */}
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
                  <Feather name={item.icon} size={16} color={colors.primary} />
                </View>
                <Text style={[styles.dropdownLabel, { color: colors.foreground }]}>
                  {item.label}
                </Text>
                <Feather
                  name="chevron-right"
                  size={15}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────
   Root export
───────────────────────────────────────────── */
export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    overflow: "hidden",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
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
});
