import { ImageSourcePropType } from "react-native";

// Static require() so Metro bundles the images — dynamic paths won't work.
export const AVATAR_PRESETS: { id: number; source: ImageSourcePropType; label: string }[] = [
  { id: 1, source: require("../assets/avatar1.jpg"), label: "Getaway Keys" },
  { id: 2, source: require("../assets/avatar2.jpg"), label: "IRS Agent" },
  { id: 3, source: require("../assets/avatar3.jpg"), label: "Hustle" },
  { id: 4, source: require("../assets/avatar4.jpg"), label: "Working Stiff" },
];

export function getPresetSource(id?: number): ImageSourcePropType | null {
  if (!id) return null;
  return AVATAR_PRESETS.find(a => a.id === id)?.source ?? null;
}
