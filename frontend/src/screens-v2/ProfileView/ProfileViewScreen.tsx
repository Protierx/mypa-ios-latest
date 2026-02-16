/**
 * Profile View Screen
 *
 * Swipe DOWN from AI Hub to access.
 * Purpose: "Who I am + how I'm doing"
 *
 * Contains:
 *   - Avatar, name, username
 *   - Level + XP progress
 *   - KPI summary cards (Streak, Tasks, Focus, Challenges)
 *   - Two pill tabs: Analytics | Settings
 *   - Upgrade banner (free users)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useUserModel } from '../../contexts/UserModelContext';
import { useFocusSessions } from '../../hooks/supabase/useFocusSessions';
import { MiniVoiceButton } from '../../components/MiniVoiceButton';
import { SettingsScreen } from '../settings/SettingsScreen';
import { PaywallSheet } from '../modals/PaywallSheet';
import { AnalyticsModal } from '../../components/settings/AnalyticsModal';
import { ACCENT_COLORS, useSettingsPreferences } from '../../state/settingsPreferences';

export function ProfileViewScreen() {
  const { user } = useSupabaseAuth();
  const { stats } = useUserModel();
  const { sessions } = useFocusSessions();
  const { prefs } = useSettingsPreferences();

  // Compute real stats from data
  const tasksCompleted = stats?.tasksCompleted ?? 0;
  const totalFocusMinutes = sessions.reduce((sum, s) => sum + (s.duration_actual || 0), 0);

  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Calculate XP progress to next level
  const xpProgress = ((user?.xp || 0) % 100) / 100;
  const accent = ACCENT_COLORS[prefs.accentPreset].primary;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F8FA' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 4,
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#1C1C1E' }}>
              Profile
            </Text>
          </View>

          {/* ── Profile Identity Card ──────────────────────── */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E5E5EA',
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: '#F2F2F7',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                borderWidth: 3,
                borderColor: accent,
              }}
            >
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 82, height: 82, borderRadius: 41 }}
                />
              ) : (
                <Text style={{ fontSize: 32, fontWeight: '700', color: '#1C1C1E' }}>
                  {(user?.name || user?.username || 'U')[0].toUpperCase()}
                </Text>
              )}
            </View>

            <Text style={{ fontSize: 22, fontWeight: '700', color: '#1C1C1E' }}>
              {user?.name || 'User'}
            </Text>
            {user?.username && (
              <Text style={{ fontSize: 15, color: '#8E8E93', marginTop: 2 }}>
                @{user.username}
              </Text>
            )}

            {/* Level + XP strip */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 12,
                backgroundColor: '#F2F2F7',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
              }}
            >
              <Ionicons name="star" size={16} color="#EAB308" />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginLeft: 6 }}>
                Level {user?.level || 1}
              </Text>
              <Text style={{ color: '#C7C7CC', marginHorizontal: 8 }}>·</Text>
              <Text style={{ fontSize: 14, color: '#8E8E93' }}>
                {user?.xp || 0} XP
              </Text>
            </View>

            {/* XP progress bar */}
            <View
              style={{
                width: 180,
                height: 6,
                backgroundColor: '#E5E5EA',
                borderRadius: 3,
                marginTop: 10,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: accent,
                  width: `${Math.min(xpProgress * 100, 100)}%`,
                }}
              />
            </View>
            <Text style={{ fontSize: 12, color: '#C7C7CC', marginTop: 4 }}>
              {Math.round(xpProgress * 100)}% to Level {(user?.level || 1) + 1}
            </Text>
          </View>

          {/* ── KPI Cards ──────────────────────────────────── */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              marginTop: 16,
            }}
          >
            <KPICard
              icon="flame"
              iconColor="#F97316"
              label="Streak"
              value={`${user?.currentStreak || 0} days`}
              subtext={`Longest: ${user?.longestStreak || 0} days`}
            />
            <KPICard
              icon="checkbox"
              iconColor="#22C55E"
              label="Tasks"
              value={`${tasksCompleted}`}
              subtext="Completed"
            />
            <KPICard
              icon="timer"
              iconColor={accent}
              label="Focus"
              value={`${totalFocusMinutes}m`}
              subtext="Total time"
            />
            <KPICard
              icon="trophy"
              iconColor="#EAB308"
              label="Challenges"
              value={`${stats?.daysActive ?? 0}`}
              subtext="Days active"
            />
          </View>

          {/* ── Action Pill Tabs (Analytics | Settings) ────── */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowAnalytics(true);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Open Analytics"
              accessibilityRole="button"
              style={{
                flex: 1,
                backgroundColor: accent,
                borderRadius: 14,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="analytics-outline" size={20} color="#FFFFFF" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginLeft: 8 }}>
                Analytics
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowSettings(true);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Open Settings"
              accessibilityRole="button"
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#E5E5EA',
              }}
            >
              <Ionicons name="settings-outline" size={20} color="#1C1C1E" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginLeft: 8 }}>
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Upgrade Banner (free users only) ───────────── */}
          {!user?.isPremium && (
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowPaywall(true);
                }}
                activeOpacity={0.7}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: `${accent}40`,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: `${accent}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="diamond" size={20} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1C1C1E' }}>
                    Upgrade to Premium
                  </Text>
                  <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>
                    Unlimited voice, circles & more
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={accent} />
              </TouchableOpacity>
            </View>
          )}


        </ScrollView>

        {/* Mini Voice Button */}
        <MiniVoiceButton position="top-right" screenContext="profile" />
      </SafeAreaView>

      {/* ── Analytics Modal (75% sheet from Profile) ─────── */}
      <AnalyticsModal
        visible={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        accentPreset={prefs.accentPreset}
      />

      {/* ── Settings Screen (full-screen) ────────────────── */}
      <SettingsScreen
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onShowPaywall={() => {
          setShowSettings(false);
          setShowPaywall(true);
        }}
      />

      {/* ── Paywall ──────────────────────────────────────── */}
      <PaywallSheet
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="profile"
      />
    </View>
  );
}

// ── KPI Card Component ───────────────────────────────────────

function KPICard({
  icon,
  iconColor,
  label,
  value,
  subtext,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text style={{ fontSize: 13, color: '#8E8E93', marginLeft: 6 }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#1C1C1E' }}>{value}</Text>
      <Text style={{ fontSize: 12, color: '#C7C7CC', marginTop: 2 }}>{subtext}</Text>
    </View>
  );
}
