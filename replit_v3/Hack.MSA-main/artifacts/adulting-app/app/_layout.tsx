import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { GameProvider } from "@/context/GameContext";
import { AppScreen, NavigationProvider, useNav } from "@/context/NavigationContext";
import { ThemeProvider } from "@/context/ThemeContext";

import CharacterSelectScreen from "@/app/simulator/character-select";
import GameScreen from "@/app/simulator/game";
import OutcomeScreen from "@/app/simulator/outcome";
import TabsContainer from "@/components/TabsContainer";
import OnboardingScreen from "./onboarding";
import StartScreen from "./start";
import TrackScreen from "./track/[id]";
import LessonScreen from "./lesson/[trackId]/[lessonId]";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function ScreenSwitcher() {
  const { screen } = useNav();

  switch (screen.name) {
    case "start":
      return <StartScreen />;
    case "onboarding":
      return <OnboardingScreen />;
    case "tabs":
      return <TabsContainer />;
    case "track":
      return <TrackScreen />;
    case "lesson":
      return <LessonScreen />;
    case "sim-character-select":
      return <CharacterSelectScreen />;
    case "sim-game":
      return <GameScreen />;
    case "sim-outcome":
      return <OutcomeScreen />;
    default:
      return null;
  }
}

function AppInner() {
  const { appLoaded, onboardingComplete } = useApp();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;
  if (!appLoaded) return null;

  const initialScreen: AppScreen = { name: "start" };

  return (
    <NavigationProvider initial={initialScreen}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GameProvider>
            <ScreenSwitcher />
          </GameProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </NavigationProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppInner />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
