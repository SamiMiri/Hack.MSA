import { useTheme } from "@/context/ThemeContext";
import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 * Respects the user's manual override (ThemeContext) first,
 * then falls back to the system color scheme.
 */
export function useColors() {
  const { resolvedTheme } = useTheme();
  const palette =
    resolvedTheme === "dark" && "dark" in colors
      ? (colors as Record<string, typeof colors.light>).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
