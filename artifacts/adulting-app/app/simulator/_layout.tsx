import { Stack } from "expo-router";
import React from "react";

export default function SimulatorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="character-select" />
      <Stack.Screen name="game" />
      <Stack.Screen name="outcome" />
    </Stack>
  );
}
