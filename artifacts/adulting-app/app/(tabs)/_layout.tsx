import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, router } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
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
      <NativeTabs.Trigger name="tools">
        <Icon sf={{ default: "wrench", selected: "wrench.fill" }} />
        <Label>Tools</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon sf={{ default: "ellipsis", selected: "ellipsis" }} />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

interface MoreDropdownProps {
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
  tabBarHeight: number;
}

function MoreDropdown({ visible, onClose, colors, tabBarHeight }: MoreDropdownProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = tabBarHeight + insets.bottom + 8;

  const items = [
    { label: "Progress", icon: "bar-chart-2", route: "/(tabs)/progress" },
    { label: "Settings", icon: "settings", route: "/(tabs)/settings" },
  ] as const;

  function go(route: string) {
    onClose();
    router.push(route as any);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1}>
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              bottom: bottomOffset,
            },
          ]}
        >
          {items.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => go(item.route)}
              activeOpacity={0.7}
              style={[
                styles.dropdownItem,
                i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.dropdownIcon, { backgroundColor: colors.primary + "18" }]}>
                <Feather name={item.icon as any} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.dropdownLabel, { color: colors.foreground }]}>
                {item.label}
              </Text>
              <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const [moreOpen, setMoreOpen] = useState(false);
  const TAB_BAR_HEIGHT = isWeb ? 84 : 60;

  return (
    <>
      <MoreDropdown
        visible={moreOpen}
        onClose={() => setMoreOpen(false)}
        colors={colors}
        tabBarHeight={TAB_BAR_HEIGHT}
      />
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
            ...(isWeb ? { height: 84 } : {}),
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
          name="tools"
          options={{
            title: "Tools",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="wrench" tintColor={color} size={24} />
              ) : (
                <Feather name="tool" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            tabBarButton: (props) => (
              <TouchableOpacity
                style={[styles.moreButton, { flex: props.style ? (props.style as any).flex ?? 1 : 1 }]}
                onPress={() => setMoreOpen((v) => !v)}
                activeOpacity={0.7}
              >
                <Feather
                  name="more-horizontal"
                  size={22}
                  color={moreOpen ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.moreLabel,
                    {
                      color: moreOpen ? colors.primary : colors.mutedForeground,
                      marginBottom: isWeb ? 8 : 0,
                    },
                  ]}
                >
                  More
                </Text>
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen name="progress" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
      </Tabs>
    </>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  dropdown: {
    position: "absolute",
    right: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
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
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 6,
  },
  moreLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
