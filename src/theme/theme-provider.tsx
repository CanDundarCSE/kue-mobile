import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  setActiveTheme,
  type ResolvedTheme,
  type ThemeMode,
} from '@/theme/palette';

const THEME_KEY = 'kue.themeMode';

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    let cancelled = false;
    void SecureStore.getItemAsync(THEME_KEY).then((saved) => {
      if (cancelled) return;
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        setModeState(saved);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolved: ResolvedTheme = mode === 'system' ? (system ?? 'dark') : mode;
  setActiveTheme(resolved);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void SecureStore.setItemAsync(THEME_KEY, next).catch(() => undefined);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
