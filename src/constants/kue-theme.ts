/**
 * Kue dark palette, ported from the web app's `globals.css` dark theme.
 * The app is dark-first, so these are the only active values.
 */
export const KueColors = {
  background: "#111113",
  foreground: "#f1f1ed",
  surface2: "#1a1a1d",
  surface3: "#222226",
  line: "#27272b",
  line2: "#3a3a40",
  ink2: "#a6a69e",
  ink3: "#70706a",
  accent: "#7e8fff",
  accent2: "#98a5ff",
  accentSoft: "#1d2138",
  danger: "#d9705a",
  movie: "#d9705a",
  series: "#cfa544",
  game: "#5fae7c",
  anime: "#c4708f",
  manga: "#5e93b0",
  white: "#ffffff",
} as const;

export const KueSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/**
 * Font family names loaded by `@expo-google-fonts/*` in the root layout.
 * Rendering is gated on `useFonts`, so these are safe to use anywhere.
 */
export const KueFonts = {
  sans: "Montserrat_400Regular",
  sansMedium: "Montserrat_500Medium",
  sansSemiBold: "Montserrat_600SemiBold",
  sansBold: "Montserrat_700Bold",
  sansItalic: "Montserrat_400Regular_Italic",
  serif: "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
  mono: "FragmentMono_400Regular",
} as const;

/**
 * Ceilings for the system font scale. Text inside fixed-height controls
 * (buttons, pills, inputs, poster cards) is capped so labels never clip;
 * body copy and the legal documents scale freely because they can reflow.
 */
export const KueTextScale = {
  control: 1.25,
  compact: 1.15,
} as const;

export const KueShadow = {
  color: "#000000",
  offset: { width: 0, height: 18 },
  opacity: 0.45,
  radius: 30,
  elevation: 12,
} as const;
