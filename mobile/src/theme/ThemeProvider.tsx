import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';

import {
  darkPalette,
  lightPalette,
  type ColorPalette,
  type ThemeMode,
} from './tokens';

const THEME_STORAGE_KEY = 'daybook.theme.mode';

interface ThemeState {
  mode: ThemeMode;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  hydrateMode: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  hydrated: false,

  setMode: async (mode) => {
    set({ mode });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Storage failure shouldn't block immediate theme switching.
    }
  },

  hydrateMode: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'system' || saved === 'light' || saved === 'dark') {
        set({ mode: saved, hydrated: true });
        return;
      }
    } catch {
      // Fall back to system theme if storage read fails.
    }
    set({ hydrated: true });
  },
}));

interface ThemeContextValue {
  colors: ColorPalette;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightPalette,
  isDark: false,
  mode: 'system',
  setMode: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const hydrateMode = useThemeStore((s) => s.hydrateMode);

  useEffect(() => {
    hydrateMode().catch(() => {});
  }, [hydrateMode]);

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const colors = isDark ? darkPalette : lightPalette;

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
