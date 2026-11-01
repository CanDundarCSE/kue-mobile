/**
 * Kue dark palette, ported from the web app's `globals.css` dark theme.
 * The app is dark-first, so these are the only active values.
 */
import { currentPalette, type Palette } from '@/theme/palette';

/**
 * Live palette: reads the active theme on every access, so inline color props
 * (icon tints, props) follow a runtime theme switch.
 */
export const KueColors: Palette = new Proxy({} as Palette, {
  get: (_target, key: string | symbol) => currentPalette()[key as keyof Palette],
  has: (_target, key: string | symbol) => key in currentPalette(),
  ownKeys: () => Object.keys(currentPalette()),
  getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
});

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
