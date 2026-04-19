import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabName, useNav } from "@/context/NavigationContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

import HomeScreen from "@/app/(tabs)/index";
import LearnScreen from "@/app/(tabs)/learn";
import SimulateScreen from "@/app/(tabs)/simulate";
import ToolsScreen from "@/app/(tabs)/tools";
import ProgressScreen from "@/app/(tabs)/progress";
import SettingsScreen from "@/app/(tabs)/settings";

const MAIN_TABS: {
  name: TabName;
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  sfIcon: string;
}[] = [
  { name: "home", label: "Home", icon: "home", sfIcon: "house" },
  { name: "learn", label: "Learn", icon: "book-open", sfIcon: "book" },
  { name: "simulate", label: "Play", icon: "play-circle", sfIcon: "gamecontroller" },
];

const MORE_ITEMS: {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  tab: TabName;
}[] = [
  { label: "Tools", icon: "tool", tab: "tools" },
  { label: "Progress", icon: "bar-chart-2", tab: "progress" },
  { label: "Settings", icon: "settings", tab: "settings" },
];

function TabContent({ activeTab }: { activeTab: TabName }) {
  switch (activeTab) {
    case "home": return <HomeScreen />;
    case "learn": return <LearnScreen />;
    case "simulate": return <SimulateScreen />;
    case "tools": return <ToolsScreen />;
    case "progress": return <ProgressScreen />;
    case "settings": return <SettingsScreen />;
    default: return <HomeScreen />;
  }
}

export default function TabsContainer() {
  const { activeTab, setActiveTab } = useNav();
  const colors = useColors();
  const { resolvedTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = resolvedTheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const [moreOpen, setMoreOpen] = useState(false);

  const TAB_BAR_HEIGHT = isWeb ? 60 : 56;
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;
  const dropdownBottom = tabBarHeight + 8;

  const isMainTab = MAIN_TABS.some((t) => t.name === activeTab);
  const moreActive = !isMainTab;

  function go(tab: TabName) {
    setMoreOpen(false);
    setActiveTab(tab);
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <TabContent activeTab={activeTab} />
      </View>

      {/* More dropdown */}
      {moreOpen && (
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setMoreOpen(false)}
            activeOpacity={1}
          />
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
            {MORE_ITEMS.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => go(item.tab)}
                activeOpacity={0.7}
                style={[
                  styles.dropdownItem,
                  i < MORE_ITEMS.length - 1 && {
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
                <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Tab bar */}
      <View
        style={[
          styles.tabBar,
          {
            height: tabBarHeight,
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
          const isFocused = activeTab === tab.name;
          const color = isFocused ? colors.primary : colors.mutedForeground;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => {
                setMoreOpen(false);
                setActiveTab(tab.name);
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

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setMoreOpen((v) => !v)}
          activeOpacity={0.7}
        >
          <Feather
            name="more-horizontal"
            size={22}
            color={moreOpen || moreActive ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: moreOpen || moreActive ? colors.primary : colors.mutedForeground,
                marginBottom: isWeb ? 8 : 0,
              },
            ]}
          >
            More
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
