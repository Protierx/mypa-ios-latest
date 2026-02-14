/**
 * Theme Context
 *
 * Provides light/dark theme state across the app.
 * Default: dark (matches existing app design).
 * Toggle: stored in AsyncStorage, surfaced in Settings.
 *
 * Usage:
 *   const { isDark, toggleTheme } = useTheme();
 *
 * Integration note: The current Tailwind tokens (surface-1, ink-primary, etc.)
 * are dark-mode values. Once a full light token set is added to tailwind.config.js
 * with `dark:` variants, this context will drive the class toggle.
 * For now, it provides the scaffolding for components to query theme state.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'mypa_theme_mode';

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, isDark: mode === 'dark', toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
