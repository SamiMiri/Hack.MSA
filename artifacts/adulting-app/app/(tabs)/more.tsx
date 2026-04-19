import { Redirect } from "expo-router";
import { View } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function MoreScreen() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Redirect href="/(tabs)/index" />
    </View>
  );
}
