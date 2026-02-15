/**
 * Profile View Screen — Light Mode
 *
 * Swipe DOWN from AI Hub to access.
 * Shows user profile, stats, unlocks, and settings.
 * Uses unified design tokens (Step 6 of UI Redesign Plan).
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useUnlocks } from '../../hooks/supabase/useUnlocks';
import { useUserModel } from '../../contexts/UserModelContext';
import { useFocusSessions } from '../../hooks/supabase/useFocusSessions';
import { LockedFeature, getLevelFromDays } from '../../components/LockedFeature';
import { MiniVoiceButton } from '../../components/MiniVoiceButton';
import { SettingsModal } from '../modals/SettingsModal';
import { PaywallSheet } from '../modals/PaywallSheet';
import { UnlockDetailsModal, FEATURE_UNLOCKS } from '../modals/UnlockDetailsModal';

import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius, spacing } from '../../styles/theme';

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
  const { user, signOut } = useSupabaseAuth();
  const { unlocks } = useUnlocks();
  const { stats } = useUserModel();
  const { getTodayStats, sessions } = useFocusSessions();

  // Compute real stats from data
  const tasksCompleted = stats?.tasksCompleted ?? 0;
  const totalFocusMinutes = sessions.reduce((sum, s) => sum + (s.duration_actual || 0), 0);

  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedUnlockFeature, setSelectedUnlockFeature] = useState<any>(null);
  const [showUnlockDetails, setShowUnlockDetails] = useState(false);

  // Calculate XP progress to next level
  const xpForNextLevel = (user?.level || 1) * 100;
  const xpProgress = ((user?.xp || 0) % 100) / 100;

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg.primary }}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        >
          {/* ── Profile Header ── */}
          <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 32 }}>
            {/* Avatar — 80px with purple border ring */}
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: bg.secondary,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
              borderWidth: 3, borderColor: brand.primary,
              ...shadows.purple,
            }}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 74, height: 74, borderRadius: 37 }}
                />
              ) : (
                <Text style={{ fontSize: 28, fontWeight: '700', color: textTokens.primary }}>
                  {(user?.name || user?.username || 'U')[0].toUpperCase()}
                </Text>
              )}
            </View>

            {/* Name */}
            <Text style={{ fontSize: 22, fontWeight: '800', color: textTokens.primary, letterSpacing: -0.3 }}>
              {user?.name || 'User'}
            </Text>
            {user?.username && (
              <Text style={{ fontSize: 15, color: textTokens.tertiary, marginTop: 2 }}>@{user.username}</Text>
            )}

            {/* Level badge pill */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              marginTop: 12,
              backgroundColor: brand.muted,
              paddingHorizontal: 16, paddingVertical: 8,
              borderRadius: 9999,
            }}>
              <Ionicons name="star" size={16} color={semantic.warning} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: textTokens.primary, marginLeft: 8 }}>
                Level {user?.level || 1}
              </Text>
              <Text style={{ color: textTokens.disabled, marginLeft: 8 }}>·</Text>
              <Text style={{ fontSize: 13, color: textTokens.tertiary, marginLeft: 8 }}>{user?.xp || 0} XP</Text>
            </View>

            {/* XP progress bar */}
            <View style={{
              width: 200, height: 6, backgroundColor: bg.secondary,
              borderRadius: 3, marginTop: 12, overflow: 'hidden',
            }}>
              <View
                style={{
                  height: '100%', borderRadius: 3,
                  backgroundColor: brand.primary,
                  width: `${xpProgress * 100}%`,
                }}
              />
            </View>
            <Text style={{ fontSize: 11, color: textTokens.disabled, marginTop: 6 }}>
              {Math.round(xpProgress * 100)}% to Level {(user?.level || 1) + 1}
            </Text>
          </View>

          {/* ── Stats Grid (2×2) ── */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
            {[
              { icon: 'flame' as const, iconColor: '#F97316', label: 'Streak', value: `${user?.currentStreak || 0} days`, sub: `Longest: ${user?.longestStreak || 0} days` },
              { icon: 'checkbox' as const, iconColor: semantic.success, label: 'Tasks', value: `${tasksCompleted}`, sub: 'Completed' },
              { icon: 'timer' as const, iconColor: brand.primary, label: 'Focus', value: `${totalFocusMinutes}m`, sub: 'Total time' },
              { icon: 'trophy' as const, iconColor: semantic.warning, label: 'Days Active', value: `${stats?.daysActive ?? 0}`, sub: 'Days active' },
            ].map((stat, idx) => (
              <View
                key={stat.label}
                style={{
                  width: '48%',
                  backgroundColor: bg.card,
                  borderRadius: radius.lg,
                  padding: 16,
                  marginBottom: 12,
                  ...shadows.sm,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={stat.icon} size={20} color={stat.iconColor} />
                  <Text style={{ fontSize: 12, color: textTokens.tertiary, marginLeft: 8, fontWeight: '500' }}>{stat.label}</Text>
                </View>
                <Text style={{ fontSize: 28, fontWeight: '800', color: textTokens.primary, marginTop: 8, letterSpacing: -0.5 }}>
                  {stat.value}
                </Text>
                <Text style={{ fontSize: 11, color: textTokens.disabled, marginTop: 2 }}>{stat.sub}</Text>
              </View>
            ))}
          </View>

          {/* ── AI Features — grouped iOS-style list ── */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 13, fontWeight: '600', color: textTokens.tertiary,
              marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              AI Features
            </Text>
            <View style={{
              backgroundColor: bg.card, borderRadius: radius.lg,
              ...shadows.sm, overflow: 'hidden',
            }}>
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
                        flexDirection: 'row', alignItems: 'center',
                        paddingVertical: 14, paddingHorizontal: 16,
                        borderTopWidth: idx > 0 ? 0.5 : 0,
                        borderTopColor: borderTokens.secondary,
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
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isFeatureUnlocked ? 'checkmark-circle' : feature.icon}
                        size={20}
                        color={isFeatureUnlocked ? brand.primary : textTokens.disabled}
                      />
                      <Text style={{ fontSize: 15, color: textTokens.primary, marginLeft: 12, flex: 1 }}>
                        {feature.name}
                      </Text>
                      {!isFeatureUnlocked && (
                        <View style={{
                          backgroundColor: bg.secondary,
                          paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
                          marginRight: 8,
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: textTokens.tertiary }}>
                            Lv.{feature.level}
                          </Text>
                        </View>
                      )}
                      {isFeatureUnlocked && (
                        <Text style={{ fontSize: 11, color: textTokens.disabled, marginRight: 8 }}>
                          L{feature.level}
                        </Text>
                      )}
                      <Ionicons name="chevron-forward" size={16} color={textTokens.disabled} />
                    </TouchableOpacity>
                  </LockedFeature>
                );
              })}
            </View>
          </View>

          {/* ── Upgrade Banner (free users only) ── */}
          {!user?.isPremium && (
            <TouchableOpacity
              style={{
                marginBottom: 24,
                backgroundColor: brand.muted,
                borderRadius: radius.lg, padding: 16,
                flexDirection: 'row', alignItems: 'center',
                borderWidth: 1, borderColor: brand.surface,
                ...shadows.purple,
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowPaywall(true);
              }}
              activeOpacity={0.7}
            >
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: brand.surface,
                alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <Ionicons name="diamond" size={20} color={brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: textTokens.primary }}>Upgrade to Premium</Text>
                <Text style={{ fontSize: 13, color: textTokens.tertiary, marginTop: 2 }}>Unlimited voice, circles & more</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={brand.primary} />
            </TouchableOpacity>
          )}

          {/* ── Settings Section — grouped iOS-style list ── */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 13, fontWeight: '600', color: textTokens.tertiary,
              marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              Settings
            </Text>
            <View style={{
              backgroundColor: bg.card, borderRadius: radius.lg,
              ...shadows.sm, overflow: 'hidden',
            }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 14, paddingHorizontal: 16,
                }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSettings(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={22} color={textTokens.tertiary} />
                <Text style={{ fontSize: 15, color: textTokens.primary, marginLeft: 12, flex: 1 }}>Settings</Text>
                <Ionicons name="chevron-forward" size={20} color={textTokens.disabled} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 14, paddingHorizontal: 16,
                  borderTopWidth: 0.5, borderTopColor: borderTokens.secondary,
                }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowHelp(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="help-circle-outline" size={22} color={textTokens.tertiary} />
                <Text style={{ fontSize: 15, color: textTokens.primary, marginLeft: 12, flex: 1 }}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={20} color={textTokens.disabled} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Sign Out ── */}
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              paddingVertical: 14, marginBottom: 24,
            }}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={semantic.error} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: semantic.error, marginLeft: 8 }}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Mini Voice Button */}
        <MiniVoiceButton position="top-right" screenContext="profile" />
      </SafeAreaView>

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onShowPaywall={() => {
          setShowSettings(false);
          setShowPaywall(true);
        }}
      />

      {/* Paywall */}
      <PaywallSheet
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="profile"
      />

      <UnlockDetailsModal
        visible={showUnlockDetails}
        feature={selectedUnlockFeature}
        onClose={() => {
          setShowUnlockDetails(false);
          setSelectedUnlockFeature(null);
        }}
      />

      {/* Help Modal */}
      <Modal visible={showHelp} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', paddingHorizontal: 20 }}
          onPress={() => setShowHelp(false)}
        >
          <Pressable
            style={{
              backgroundColor: bg.elevated, borderRadius: radius.lg,
              padding: 24, ...shadows.lg,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: textTokens.primary, marginBottom: 8 }}>Help & Support</Text>
            <Text style={{ fontSize: 15, color: textTokens.secondary, lineHeight: 22, marginBottom: 16 }}>
              Need a hand? Tap anywhere to talk to MYPA, or swipe between Tasks, Social, and Profile. Swipe up from the home screen to start a focus session.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: brand.primary,
                paddingVertical: 14, borderRadius: radius.md,
                alignItems: 'center',
              }}
              onPress={() => setShowHelp(false)}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: textTokens.inverse }}>Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
