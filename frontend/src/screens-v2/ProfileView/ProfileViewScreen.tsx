/**
 * Profile View Screen
 * 
 * Swipe DOWN from AI Hub to access.
 * Shows user profile, stats, unlocks, and settings.
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
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        >
          {/* Profile Header */}
          <View className="items-center pt-6 pb-8">
            {/* Avatar */}
            <View className="w-24 h-24 rounded-full bg-surface-3 items-center justify-center mb-4 border-2 border-brand-purple">
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Text className="text-title-1 text-ink-primary">
                  {(user?.name || user?.username || 'U')[0].toUpperCase()}
                </Text>
              )}
            </View>
            
            <Text className="text-title-2 font-bold text-ink-primary">
              {user?.name || 'User'}
            </Text>
            {user?.username && (
              <Text className="text-body text-ink-tertiary">@{user.username}</Text>
            )}
            
            <View className="flex-row items-center mt-3 bg-surface-2 px-4 py-2 rounded-full border border-surface-4">
              <Ionicons name="star" size={16} color="#EAB308" />
              <Text className="text-headline font-semibold text-ink-primary ml-2">
                Level {user?.level || 1}
              </Text>
              <Text className="text-ink-tertiary ml-2">·</Text>
              <Text className="text-ink-tertiary ml-2">{user?.xp || 0} XP</Text>
            </View>
            
            <View className="w-48 h-1.5 bg-surface-4 rounded-full mt-3 overflow-hidden">
              <View
                className="h-full bg-brand-purple rounded-full"
                style={{ width: `${xpProgress * 100}%` }}
              />
            </View>
            <Text className="text-caption-2 text-ink-disabled mt-1">
              {Math.round(xpProgress * 100)}% to Level {(user?.level || 1) + 1}
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-between mb-6">
            <View className="w-[48%] bg-surface-2 rounded-xl p-4 mb-3 border border-surface-4">
              <View className="flex-row items-center">
                <Ionicons name="flame" size={20} color="#f97316" />
                <Text className="text-caption-1 text-ink-tertiary ml-2">Streak</Text>
              </View>
              <Text className="text-title-1 font-bold text-ink-primary mt-2">
                {user?.currentStreak || 0} days
              </Text>
              <Text className="text-caption-2 text-ink-disabled">
                Longest: {user?.longestStreak || 0} days
              </Text>
            </View>
            
            <View className="w-[48%] bg-surface-2 rounded-xl p-4 mb-3 border border-surface-4">
              <View className="flex-row items-center">
                <Ionicons name="checkbox" size={20} color="#22C55E" />
                <Text className="text-caption-1 text-ink-tertiary ml-2">Tasks</Text>
              </View>
              <Text className="text-title-1 font-bold text-ink-primary mt-2">{tasksCompleted}</Text>
              <Text className="text-caption-2 text-ink-disabled">Completed</Text>
            </View>
            
            <View className="w-[48%] bg-surface-2 rounded-xl p-4 border border-surface-4">
              <View className="flex-row items-center">
                <Ionicons name="timer" size={20} color="#7C3AED" />
                <Text className="text-caption-1 text-ink-tertiary ml-2">Focus</Text>
              </View>
              <Text className="text-title-1 font-bold text-ink-primary mt-2">{totalFocusMinutes}m</Text>
              <Text className="text-caption-2 text-ink-disabled">Total time</Text>
            </View>
            
            <View className="w-[48%] bg-surface-2 rounded-xl p-4 border border-surface-4">
              <View className="flex-row items-center">
                <Ionicons name="trophy" size={20} color="#EAB308" />
                <Text className="text-caption-1 text-ink-tertiary ml-2">Challenges</Text>
              </View>
              <Text className="text-title-1 font-bold text-ink-primary mt-2">{stats?.daysActive ?? 0}</Text>
              <Text className="text-caption-2 text-ink-disabled">Days active</Text>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-caption-1 font-semibold text-ink-tertiary mb-3 uppercase tracking-wide">
              AI Features
            </Text>
            {ALL_AI_FEATURES.map((feature) => {
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
                    className="flex-row items-center bg-surface-2 rounded-lg p-4 mb-2 border border-surface-4"
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
                      color={isFeatureUnlocked ? '#22c55e' : '#A1A1AA'}
                    />
                    <Text className="text-body text-ink-primary ml-3 flex-1">
                      {feature.name}
                    </Text>
                    <Text className="text-caption-2 text-ink-disabled mr-2">
                      L{feature.level}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#52525B" />
                  </TouchableOpacity>
                </LockedFeature>
              );
            })}
          </View>

          {/* Upgrade Banner (free users only) */}
          {!user?.isPremium && (
            <TouchableOpacity
              className="mb-6 bg-brand-purple/15 rounded-xl p-4 border border-brand-purple/30 flex-row items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowPaywall(true);
              }}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-brand-purple/20 rounded-full items-center justify-center mr-3">
                <Ionicons name="diamond" size={20} color="#7C3AED" />
              </View>
              <View className="flex-1">
                <Text className="text-headline font-semibold text-ink-primary">Upgrade to Premium</Text>
                <Text className="text-subhead text-ink-tertiary mt-0.5">Unlimited voice, circles & more</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
            </TouchableOpacity>
          )}

          <View className="mb-6">
            <TouchableOpacity
              className="flex-row items-center bg-surface-2 rounded-lg p-4 mb-3 border border-surface-4"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSettings(true);
              }}
            >
              <Ionicons name="settings-outline" size={22} color="#A1A1AA" />
              <Text className="text-body text-ink-primary ml-3 flex-1">Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#52525B" />
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row items-center bg-surface-2 rounded-lg p-4 mb-3 border border-surface-4"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowHelp(true);
              }}
            >
              <Ionicons name="help-circle-outline" size={22} color="#A1A1AA" />
              <Text className="text-body text-ink-primary ml-3 flex-1">Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#52525B" />
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row items-center bg-error/10 rounded-lg p-4 border border-error/30"
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              <Text className="text-body text-error ml-3">Sign Out</Text>
            </TouchableOpacity>
          </View>
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
        <Pressable className="flex-1 bg-black/60 justify-center px-5" onPress={() => setShowHelp(false)}>
          <Pressable className="bg-surface-2 rounded-xl p-6 border border-surface-4" onPress={(e) => e.stopPropagation()}>
            <Text className="text-title-2 font-bold text-ink-primary mb-2">Help & Support</Text>
            <Text className="text-body text-ink-secondary mb-4">
              Need a hand? Tap anywhere to talk to MYPA, or swipe between Tasks, Social, and Profile. Swipe up from the home screen to start a focus session.
            </Text>
            <TouchableOpacity
              className="bg-brand-purple py-3 rounded-lg items-center"
              onPress={() => setShowHelp(false)}
            >
              <Text className="text-headline font-semibold text-ink-primary">Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
