/**
 * Settings Preferences Store
 *
 * Frontend-only persistence layer using AsyncStorage.
 * All settings changes are local — no backend writes.
 *
 * Usage:
 *   const { prefs, update } = useSettingsPreferences();
 *   update({ defaultDuration: 30 });
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export type AccentPreset = 'purple' | 'blue' | 'teal' | 'rose' | 'amber';

export type TimeFormat = '12h' | '24h';

export type StartOfWeek = 'monday' | 'sunday';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type InteractionMode = 'tap' | 'hold';

export interface QuietHours {
  enabled: boolean;
  start: string; // "22:00"
  end: string;   // "07:00"
}

export interface SettingsPreferences {
  // ── Profile & Identity ──────────────────────
  displayName: string;
  username: string;
  timezone: string;
  location: string;

  // ── AI & Voice ──────────────────────────────
  interactionMode: InteractionMode;
  spokenReplies: boolean;
  voiceSensitivity: number; // 0–1
  saveTranscripts: boolean;

  // ── Integrations ────────────────────────────
  appleConnected: boolean;
  emailConnected: boolean;
  googleConnected: boolean;
  calendarLinked: boolean;

  // ── Task & Planning Defaults ────────────────
  defaultDuration: number;      // minutes
  defaultPriority: Priority;
  startOfWeek: StartOfWeek;
  timeFormat: TimeFormat;
  noBrainDumpRoute: boolean;    // "No date/time → Brain Dump"
  aiAutoCategories: boolean;

  // ── Notifications ───────────────────────────
  dailyPlanningReminder: boolean;
  overdueNudges: boolean;
  circleCheckinReminder: boolean;
  challengeDeadlineAlerts: boolean;
  inactivityNudges: boolean;
  quietHours: QuietHours;

  // ── Appearance ──────────────────────────────
  themeMode: ThemeMode;
  accentPreset: AccentPreset;

  // ── Privacy & Security ──────────────────────
  micPermission: 'granted' | 'denied' | 'undetermined';
  calendarPermission: 'granted' | 'denied' | 'undetermined';
}

// ── Defaults ─────────────────────────────────────────────────

export const DEFAULT_PREFERENCES: SettingsPreferences = {
  displayName: '',
  username: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  location: '',

  interactionMode: 'tap',
  spokenReplies: true,
  voiceSensitivity: 0.5,
  saveTranscripts: false,

  appleConnected: false,
  emailConnected: false,
  googleConnected: false,
  calendarLinked: false,

  defaultDuration: 30,
  defaultPriority: 'medium',
  startOfWeek: 'monday',
  timeFormat: '12h',
  noBrainDumpRoute: true,    // Always-on — no longer user-toggleable
  aiAutoCategories: true,    // Always-on — no longer user-toggleable

  dailyPlanningReminder: true,
  overdueNudges: true,
  circleCheckinReminder: true,
  challengeDeadlineAlerts: true,
  inactivityNudges: false,
  quietHours: { enabled: false, start: '22:00', end: '07:00' },

  themeMode: 'light',
  accentPreset: 'purple',

  micPermission: 'undetermined',
  calendarPermission: 'undetermined',
};

// ── Accent Palette Map ───────────────────────────────────────

export const ACCENT_COLORS: Record<AccentPreset, { primary: string; light: string; label: string }> = {
  purple: { primary: '#B958FF', light: 'rgba(185, 88, 255, 0.12)', label: 'Purple' },
  blue:   { primary: '#00B4FF', light: 'rgba(0, 180, 255, 0.12)', label: 'Blue' },
  teal:   { primary: '#00E676', light: 'rgba(0, 230, 118, 0.12)', label: 'Teal' },
  rose:   { primary: '#FF2D87', light: 'rgba(255, 45, 135, 0.12)', label: 'Rose' },
  amber:  { primary: '#FFB800', light: 'rgba(255, 184, 0, 0.12)', label: 'Amber' },
};

// ── Storage ──────────────────────────────────────────────────

const STORAGE_KEY = 'mypa_settings_prefs';

async function loadPrefs(): Promise<SettingsPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      // Always-on features — override any saved false values
      noBrainDumpRoute: true,
      aiAutoCategories: true,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

async function savePrefs(prefs: SettingsPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Silently fail — non-critical
  }
}

// ── Hook ─────────────────────────────────────────────────────

export function useSettingsPreferences() {
  const [prefs, setPrefs] = useState<SettingsPreferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPrefs().then((p) => {
      setPrefs(p);
      setLoaded(true);
    });
  }, []);

  const update = useCallback(
    (partial: Partial<SettingsPreferences>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...partial };
        savePrefs(next);
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => {
    const defaults = { ...DEFAULT_PREFERENCES };
    setPrefs(defaults);
    savePrefs(defaults);
  }, []);

  return useMemo(
    () => ({ prefs, update, reset, loaded }),
    [prefs, update, reset, loaded],
  );
}
