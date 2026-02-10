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
import { MiniVoiceButton } from '../../components/MiniVoiceButton';
import { SettingsModal } from '../modals/SettingsModal';
import { UnlockDetailsModal, FEATURE_UNLOCKS } from '../modals/UnlockDetailsModal';

export function ProfileViewScreen() {
  const { user, signOut } = useSupabaseAuth();
  const { unlocks } = useUnlocks();

  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
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
              <Text className="text-title-1 font-bold text-ink-primary mt-2">{0}</Text>
              <Text className="text-caption-2 text-ink-disabled">Completed</Text>
            </View>
            
            <View className="w-[48%] bg-surface-2 rounded-xl p-4 border border-surface-4">
              <View className="flex-row items-center">
                <Ionicons name="timer" size={20} color="#7C3AED" />
                <Text className="text-caption-1 text-ink-tertiary ml-2">Focus</Text>
              </View>
              <Text className="text-title-1 font-bold text-ink-primary mt-2">{0}m</Text>
              <Text className="text-caption-2 text-ink-disabled">Total time</Text>
            </View>
            
            <View className="w-[48%] bg-surface-2 rounded-xl p-4 border border-surface-4">
              <View className="flex-row items-center">
                <Ionicons name="trophy" size={20} color="#EAB308" />
                <Text className="text-caption-1 text-ink-tertiary ml-2">Challenges</Text>
              </View>
              <Text className="text-title-1 font-bold text-ink-primary mt-2">{0}</Text>
              <Text className="text-caption-2 text-ink-disabled">Won</Text>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-caption-1 font-semibold text-ink-tertiary mb-3 uppercase tracking-wide">
              AI Features
            </Text>
            {unlocks.length > 0 ? (
              unlocks.slice(0, 4).map((unlock, index) => (
                <TouchableOpacity
                  key={unlock.feature || `unlock-${index}`}
                  className="flex-row items-center bg-surface-2 rounded-lg p-4 mb-2 border border-surface-4"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const featureMeta = FEATURE_UNLOCKS[unlock.feature];
                    if (featureMeta) {
                      setSelectedUnlockFeature({
                        ...featureMeta,
                        isUnlocked: !!unlock.unlocked_at,
                        unlockedAt: unlock.unlocked_at,
                        requirements: Object.entries(unlock.progress || {}).map(([key, val]) => ({
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
                    name={unlock.unlocked_at ? 'checkmark-circle' : 'lock-closed'}
                    size={20}
                    color={unlock.unlocked_at ? '#22c55e' : '#52525b'}
                  />
                  <Text className="text-body text-ink-primary ml-3 flex-1 capitalize">
                    {(unlock.name || unlock.feature || '').replace(/_/g, ' ')}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#52525B" />
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-body text-ink-disabled">
                Complete tasks to unlock AI features!
              </Text>
            )}
          </View>

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
