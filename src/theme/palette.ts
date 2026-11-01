export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export type Palette = {
  background: string;
  foreground: string;
  surface2: string;
  surface3: string;
  line: string;
  line2: string;
  ink2: string;
  ink3: string;
  accent: string;
  accent2: string;
  accentSoft: string;
  danger: string;
  movie: string;
  series: string;
  game: string;
  anime: string;
  manga: string;
  white: string;
};

export const darkPalette: Palette = {
  background: '#111113',
  foreground: '#f1f1ed',
  surface2: '#1a1a1d',
  surface3: '#222226',
  line: '#27272b',
  line2: '#3a3a40',
  ink2: '#a6a69e',
  ink3: '#70706a',
  accent: '#7e8fff',
  accent2: '#98a5ff',
  accentSoft: '#1d2138',
  danger: '#d9705a',
  movie: '#d9705a',
  series: '#cfa544',
  game: '#5fae7c',
  anime: '#c4708f',
  manga: '#5e93b0',
  white: '#ffffff',
};

export const lightPalette: Palette = {
  background: '#fbfbf9',
  foreground: '#161613',
  surface2: '#f6f6f3',
  surface3: '#efefeb',
  line: '#e8e8e3',
  line2: '#d6d6cf',
  ink2: '#63635d',
  ink3: '#9a9a91',
  accent: '#1e36c8',
  accent2: '#152699',
  accentSoft: '#eef0fc',
  danger: '#c4533c',
  movie: '#c4533c',
  series: '#b98e2f',
  game: '#4e9066',
  anime: '#a85777',
  manga: '#47748f',
  white: '#ffffff',
};

export const palettes: Record<ResolvedTheme, Palette> = {
  dark: darkPalette,
  light: lightPalette,
};

let activeTheme: ResolvedTheme = 'dark';
let themeVersion = 0;

export function setActiveTheme(theme: ResolvedTheme) {
  if (theme !== activeTheme) {
    activeTheme = theme;
    themeVersion += 1;
  }
}

export function getThemeVersion() {
  return themeVersion;
}

export function getActiveTheme(): ResolvedTheme {
  return activeTheme;
}

export function currentPalette(): Palette {
  return palettes[activeTheme];
}

/** Dark value → light value, used to retheme StyleSheet objects created once. */
export const darkToLightColors: Record<string, string> = Object.entries(darkPalette).reduce(
  (map, [key, value]) => {
    const lightValue = lightPalette[key as keyof Palette];
    if (lightValue !== value) map[value.toLowerCase()] = lightValue;
    return map;
  },
  {} as Record<string, string>,
);

/** Light value → dark value, for styles created while light was active. */
export const lightToDarkColors: Record<string, string> = Object.entries(lightPalette).reduce(
  (map, [key, value]) => {
    const darkValue = darkPalette[key as keyof Palette];
    if (darkValue !== value) map[value.toLowerCase()] = darkValue;
    return map;
  },
  {} as Record<string, string>,
);

export function mapColor(value: string): string {
  const key = value.toLowerCase();
  if (activeTheme === 'dark') return lightToDarkColors[key] ?? value;
  return darkToLightColors[key] ?? value;
}
