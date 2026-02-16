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
 *   - "Analytics" pill → opens 75% analytics modal
 *   - "Settings" entry → opens full-screen settings
 *   - AI Feature unlocks list
 *   - Upgrade banner (free users)
 *
 * Does NOT contain:
 *   - Integration controls, notification toggles, voice sensitivity
 *   - Legal/privacy, theme/accent, sign out
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
import { useUnlocks } from '../../hooks/supabase/useUnlocks';
import { useUserModel } from '../../contexts/UserModelContext';
import { useFocusSessions } from '../../hooks/supabase/useFocusSessions';
import { LockedFeature } from '../../components/LockedFeature';
import { MiniVoiceButton } from '../../components/MiniVoiceButton';
import { SettingsScreen } from '../settings/SettingsScreen';
import { PaywallSheet } from '../modals/PaywallSheet';
import { UnlockDetailsModal, FEATURE_UNLOCKS } from '../modals/UnlockDetailsModal';
import { AnalyticsModal } from '../../components/settings/AnalyticsModal';
import { ACCENT_COLORS, useSettingsPreferences } from '../../state/settingsPreferences';

// All AI features with their required unlock levels
const ALL_AI_FEATURES: { id: string; name: string; icon: keyof typeof Ionicons.glyphMap; level: number }[] = [
  { id: 'personalized_greeting', name: 'Personalized Greetings', icon: 'hand-right-outline', level: 1 },
  { id: 'task_insights', name: 'Task Insights', icon: 'bulb-outline', level: 2 },
  { id: 'ai_task_sorting', name: 'AI Task Sorting', icon: 'swap-vertical-outline', level: 2 },
  { id: 'focus_stats', name: 'Focus Statistics', icon: 'timer-outline', level: 2 },
  { id: 'duration_estimation', name: 'Duration Estimation', icon: 'hourglass-outline', level: 3 },
  { id: 'challenges', name: 'Challenges', icon: 'trophy-outline', level: 3 },
  { id: 'custom_ai_voice', name: 'Custom AI Voice', icon: 'mic-outline', level: 3 },
  { id: 'circle_insights', name: 'Circle Insights', icon: 'people-outline', level: 3 },
  { id: 'overwhelm_detection', name: 'Overwhelm Detection', icon: 'alert-circle-outline', level: 4 },
  { id: 'peak_hours', name: 'Peak Hours', icon: 'sunny-outline', level: 4 },
  { id: 'predictive_tasks', name: 'Predictive Tasks', icon: 'sparkles-outline', level: 5 },
];

export function ProfileViewScreen() {
  const { user } = useSupabaseAuth();
  const { unlocks } = useUnlocks();
  const { stats } = useUserModel();
  const { sessions } = useFocusSessions();
  const { prefs } = useSettingsPreferences();

  // Compute real stats from data
  const tasksCompleted = stats?.tasksCompleted ?? 0;
  const totalFocusMinutes = sessions.reduce((sum, s) => sum + (s.duration_actual || 0), 0);

  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedUnlockFeature, setSelectedUnlockFeature] = useState<any>(null);
  const [showUnlockDetails, setShowUnlockDetails] = useState(false);

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
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 4,
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#1C1C1E' }}>
              Profile
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSettings(true);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Open Settings"
              accessibilityRole="button"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#E5E5EA',
              }}
            >
              <Ionicons name="settings-outline" size={20} color="#1C1C1E" />
            </TouchableOpacity>
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

          {/* ── Analytics Pill ─────────────────────────────── */}
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowAnalytics(true);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Open Analytics"
              accessibilityRole="button"
              style={{
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

          {/* ── AI Features ────────────────────────────────── */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: '#8E8E93',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                marginBottom: 10,
              }}
              accessibilityRole="header"
            >
              AI Features
            </Text>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E5EA',
                overflow: 'hidden',
              }}
            >
              {ALL_AI_FEATURES.map((feature, idx) => {
                const unlock = unlocks.find((u) => u.feature === feature.id);
                const isFeatureUnlocked = !!unlock?.unlocked_at;

                return (
                  <LockedFeature
                    key={feature.id}
                    requiredLevel={feature.level}
                    featureName={feature.name}
                    onLockedPress={() => {
                      const featureMeta = FEATURE_UNLOCKS[feature.id];
                      if (featureMeta) {
                        setSelectedUnlockFeature({
                          ...featureMeta,
                          isUnlocked: false,
                          requirements: Object.entries(unlock?.progress || {}).map(([key, val]) => ({
                            id: key,
                            description: key.replace(/_/g, ' '),
                            current: val?.current || 0,
                            required: val?.required || 0,
                            completed: (val?.current || 0) >= (val?.required || 0),
                          })),
                        });
                        setShowUnlockDetails(true);
                      }
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: idx < ALL_AI_FEATURES.length - 1 ? 1 : 0,
                        borderBottomColor: '#F2F2F7',
                      }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const featureMeta = FEATURE_UNLOCKS[feature.id];
                        if (featureMeta) {
                          setSelectedUnlockFeature({
                            ...featureMeta,
                            isUnlocked: isFeatureUnlocked,
                            unlockedAt: unlock?.unlocked_at,
                            requirements: Object.entries(unlock?.progress || {}).map(([key, val]) => ({
                              id: key,
                              description: key.replace(/_/g, ' '),
                              current: val?.current || 0,
                              required: val?.required || 0,
                              completed: (val?.current || 0) >= (val?.required || 0),
                            })),
                          });
                          setShowUnlockDetails(true);
                        }
                      }}
                      activeOpacity={0.6}
                      accessibilityLabel={`${feature.name}, Level ${feature.level}${isFeatureUnlocked ? ', Unlocked' : ''}`}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: isFeatureUnlocked ? '#DCFCE7' : '#F2F2F7',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Ionicons
                          name={isFeatureUnlocked ? 'checkmark-circle' : feature.icon}
                          size={18}
                          color={isFeatureUnlocked ? '#22C55E' : '#8E8E93'}
                        />
                      </View>
                      <Text style={{ flex: 1, fontSize: 16, color: '#1C1C1E' }}>
                        {feature.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#C7C7CC', marginRight: 6 }}>
                        L{feature.level}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                    </TouchableOpacity>
                  </LockedFeature>
                );
              })}
            </View>
          </View>
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

      {/* ── Unlock Details ───────────────────────────────── */}
      <UnlockDetailsModal
        visible={showUnlockDetails}
        feature={selectedUnlockFeature}
        onClose={() => {
          setShowUnlockDetails(false);
          setSelectedUnlockFeature(null);
        }}
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
