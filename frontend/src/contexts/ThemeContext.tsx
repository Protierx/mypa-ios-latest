/**
 * Theme Context
 *
 * Supports three modes: 'light' | 'dark' | 'adaptive' (default).
 *
 * Adaptive logic: isDark is derived from the current hour —
 *   06:00–17:59 → light, 18:00–05:59 → dark.
 *   Re-evaluated every minute via setInterval.
 *
 * Exposes a resolved `palette` object containing the correct set of
 * design tokens (bg, brand, text, border, semantic, category) for
 * the active mode. Components should consume palette instead of
 * importing tokens directly when they need to adapt to the theme.
 *
 * toggleTheme cycles: adaptive → light → dark → adaptive.
 * Mode is persisted to AsyncStorage under 'mypa_theme_mode'.
 *
 * Usage:
 *   const { isDark, palette, toggleTheme, setMode } = useTheme();
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  bg,
  brand,
  text,
  border,
  bgNight,
  brandNight,
  textNight,
  borderNight,
  semantic,
  category,
} from '../styles/colors';

// ── Types ────────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'adaptive';

export interface ThemePalette {
  bg: { primary: string; secondary: string; card: string; elevated: string; input: string; hover: string };
  brand: { primary: string; secondary: string; tertiary: string; muted: string; surface: string };
  text: { primary: string; secondary: string; tertiary: string; disabled: string; inverse: string };
  border: { primary: string; secondary: string; focus: string };
  semantic: typeof semantic;
  category: typeof category;
}

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  palette: ThemePalette;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

// ── Constants & helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = 'mypa_theme_mode';
const DAY_START_HOUR = 6;   // 06:00 inclusive
const DAY_END_HOUR   = 18;  // 18:00 exclusive

function computeAdaptiveDark(): boolean {
  const hour = new Date().getHours();
  return hour < DAY_START_HOUR || hour >= DAY_END_HOUR;
}

const DAY_PALETTE: ThemePalette   = { bg, brand, text, border, semantic, category };
const NIGHT_PALETTE: ThemePalette = { bg: bgNight, brand: brandNight, text: textNight, border: borderNight, semantic, category };

function resolvePalette(isDark: boolean): ThemePalette {
  return isDark ? NIGHT_PALETTE : DAY_PALETTE;
}

// ── Context default ──────────────────────────────────────────────────────────

const _initialDark = computeAdaptiveDark();

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'adaptive',
  isDark: _initialDark,
  palette: resolvePalette(_initialDark),
  toggleTheme: () => {},
  setMode: () => {},
});

// ── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('adaptive');
  const [adaptiveDark, setAdaptiveDark] = useState<boolean>(computeAdaptiveDark);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore persisted mode on mount.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'adaptive') {
        setModeState(stored);
      }
    });
  }, []);

  // Re-evaluate adaptive dark state every minute while in adaptive mode.
  useEffect(() => {
    if (mode !== 'adaptive') {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Sync immediately when switching into adaptive mode.
    setAdaptiveDark(computeAdaptiveDark());

    intervalRef.current = setInterval(() => {
      setAdaptiveDark(computeAdaptiveDark());
    }, 60_000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => {});
  }, []);

  // Cycles: adaptive → light → dark → adaptive.
  const toggleTheme = useCallback(() => {
    const next: ThemeMode =
      mode === 'adaptive' ? 'light' : mode === 'light' ? 'dark' : 'adaptive';
    setMode(next);
  }, [mode, setMode]);

  const isDark: boolean =
    mode === 'dark' ? true : mode === 'light' ? false : adaptiveDark;

  return (
    <ThemeContext.Provider
      value={{ mode, isDark, palette: resolvePalette(isDark), toggleTheme, setMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
