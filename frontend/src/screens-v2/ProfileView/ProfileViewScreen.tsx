/**
 * Profile View Screen
 * 
 * Swipe DOWN from AI Hub to access.
 * Shows user profile, stats, unlocks, and settings.
 */

import React from 'react';
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
import { MiniVoiceButton } from '../../components/MiniVoiceButton';

export function ProfileViewScreen() {
  const { user, signOut } = useSupabaseAuth();
  const { unlocks } = useUnlocks();

  // Calculate XP progress to next level
  const xpForNextLevel = (user?.level || 1) * 100;
  const xpProgress = ((user?.xp || 0) % 100) / 100;

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  };

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        >
          {/* Profile Header */}
          <View className="items-center pt-6 pb-8">
            {/* Avatar */}
            <View className="w-24 h-24 rounded-full bg-zinc-800 items-center justify-center mb-4 border-2 border-purple-600">
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <Text className="text-4xl">
                  {(user?.name || user?.username || 'U')[0].toUpperCase()}
                </Text>
              )}
            </View>
            
            {/* Name & Username */}
            <Text className="text-white text-2xl font-bold">
              {user?.name || 'User'}
            </Text>
            {user?.username && (
              <Text className="text-zinc-500 text-base">@{user.username}</Text>
            )}
            
            {/* Level Badge */}
            <View className="flex-row items-center mt-3 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
              <Ionicons name="star" size={16} color="#eab308" />
              <Text className="text-white font-semibold ml-2">
                Level {user?.level || 1}
              </Text>
              <Text className="text-zinc-500 ml-2">·</Text>
              <Text className="text-zinc-400 ml-2">{user?.xp || 0} XP</Text>
            </View>
            
            {/* XP Progress Bar */}
            <View className="w-48 h-1.5 bg-zinc-800 rounded-full mt-3 overflow-hidden">
              <View
                className="h-full bg-purple-600 rounded-full"
                style={{ width: `${xpProgress * 100}%` }}
              />
            </View>
            <Text className="text-zinc-600 text-xs mt-1">
              {Math.round(xpProgress * 100)}% to Level {(user?.level || 1) + 1}
            </Text>
          </View>

          {/* Stats Grid */}
          <View className="flex-row flex-wrap justify-between mb-6">
            <View className="w-[48%] bg-zinc-900 rounded-2xl p-4 mb-3 border border-zinc-800">
              <View className="flex-row items-center">
                <Ionicons name="flame" size={20} color="#f97316" />
                <Text className="text-zinc-400 text-sm ml-2">Streak</Text>
              </View>
              <Text className="text-white text-2xl font-bold mt-2">
                {user?.currentStreak || 0} days
              </Text>
              <Text className="text-zinc-600 text-xs">
                Longest: {user?.longestStreak || 0} days
              </Text>
            </View>
            
            <View className="w-[48%] bg-zinc-900 rounded-2xl p-4 mb-3 border border-zinc-800">
              <View className="flex-row items-center">
                <Ionicons name="checkbox" size={20} color="#22c55e" />
                <Text className="text-zinc-400 text-sm ml-2">Tasks</Text>
              </View>
              <Text className="text-white text-2xl font-bold mt-2">
                {0}
              </Text>
              <Text className="text-zinc-600 text-xs">Completed</Text>
            </View>
            
            <View className="w-[48%] bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <View className="flex-row items-center">
                <Ionicons name="timer" size={20} color="#a855f7" />
                <Text className="text-zinc-400 text-sm ml-2">Focus</Text>
              </View>
              <Text className="text-white text-2xl font-bold mt-2">
                {0}m
              </Text>
              <Text className="text-zinc-600 text-xs">Total time</Text>
            </View>
            
            <View className="w-[48%] bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <View className="flex-row items-center">
                <Ionicons name="trophy" size={20} color="#eab308" />
                <Text className="text-zinc-400 text-sm ml-2">Challenges</Text>
              </View>
              <Text className="text-white text-2xl font-bold mt-2">
                {0}
              </Text>
              <Text className="text-zinc-600 text-xs">Won</Text>
            </View>
          </View>

          {/* Unlocked Features */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-sm font-semibold mb-3 uppercase tracking-wide">
              AI Features
            </Text>
            {unlocks.length > 0 ? (
              unlocks.slice(0, 4).map((unlock, index) => (
                <View
                  key={unlock.feature || `unlock-${index}`}
                  className="flex-row items-center bg-zinc-900 rounded-xl p-3 mb-2 border border-zinc-800"
                >
                  <Ionicons
                    name={unlock.unlocked_at ? 'checkmark-circle' : 'lock-closed'}
                    size={20}
                    color={unlock.unlocked_at ? '#22c55e' : '#52525b'}
                  />
                  <Text className="text-white ml-3 flex-1 capitalize">
                    {(unlock.name || unlock.feature || '').replace(/_/g, ' ')}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-zinc-600 text-sm">
                Complete tasks to unlock AI features!
              </Text>
            )}
          </View>

          {/* Actions */}
          <View className="mb-6">
            <TouchableOpacity
              className="flex-row items-center bg-zinc-900 rounded-xl p-4 mb-3 border border-zinc-800"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // TODO: Open settings
              }}
            >
              <Ionicons name="settings-outline" size={22} color="#a1a1aa" />
              <Text className="text-white ml-3 flex-1">Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#52525b" />
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row items-center bg-zinc-900 rounded-xl p-4 mb-3 border border-zinc-800"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // TODO: Open help
              }}
            >
              <Ionicons name="help-circle-outline" size={22} color="#a1a1aa" />
              <Text className="text-white ml-3 flex-1">Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#52525b" />
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row items-center bg-red-950/30 rounded-xl p-4 border border-red-900/30"
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
              <Text className="text-red-500 ml-3">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Mini Voice Button */}
        <MiniVoiceButton position="top-right" screenContext="profile" />
      </SafeAreaView>
    </View>
  );
}
