/**
 * Social View Screen
 * 
 * Swipe RIGHT from AI Hub to access.
 * Shows circles, challenges, and social activity.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useCircles } from '../../hooks/supabase/useCircles';
import { useChallenges } from '../../hooks/supabase/useChallenges';
import { MiniVoiceButton } from '../../components/MiniVoiceButton';
import { CircleHomeModal } from '../modals/CircleHomeModal';
import { ChallengeDetailModal } from '../modals/ChallengeDetailModal';
import { CreateCircleSheet } from '../modals/CreateCircleSheet';
import { CreateChallengeSheet } from '../modals/CreateChallengeSheet';

export function SocialViewScreen() {
  const { circles, loading: circlesLoading, refresh: refreshCircles } = useCircles();
  const { challenges, loading: challengesLoading, refresh: refreshChallenges } = useChallenges();
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [showCircleHome, setShowCircleHome] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshCircles(), refreshChallenges()]);
    setRefreshing(false);
  }, [refreshCircles, refreshChallenges]);

  const loading = circlesLoading || challengesLoading;
  const activeChallenges = challenges.filter(c => c.status === 'active');

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 pt-4 pb-3 flex-row justify-between items-center">
          <Text className="text-white text-3xl font-bold">Social</Text>
          <TouchableOpacity
            className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreateMenu(!showCreateMenu);
            }}
          >
            <Ionicons name={showCreateMenu ? 'close' : 'add'} size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Create Menu Dropdown */}
        {showCreateMenu && (
          <View className="absolute top-20 right-5 z-50 bg-zinc-800 rounded-2xl border border-zinc-700 shadow-lg overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center px-5 py-4 border-b border-zinc-700"
              onPress={() => {
                setShowCreateMenu(false);
                setShowCreateCircle(true);
              }}
            >
              <Ionicons name="people" size={20} color="#a855f7" />
              <Text className="text-white font-medium ml-3">Create Circle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center px-5 py-4"
              onPress={() => {
                setShowCreateMenu(false);
                setShowCreateChallenge(true);
              }}
            >
              <Ionicons name="trophy" size={20} color="#eab308" />
              <Text className="text-white font-medium ml-3">Create Challenge</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#a855f7" size="large" />
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#a855f7"
              />
            }
          >
            {/* Active Challenges Section */}
            {activeChallenges.length > 0 && (
              <View className="mb-6">
                <Text className="text-zinc-400 text-sm font-semibold mb-3 uppercase tracking-wide">
                  Active Challenges
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
                  {activeChallenges.map((challenge) => (
                    <TouchableOpacity
                      key={challenge.id}
                      className="bg-zinc-900 rounded-2xl p-4 mr-3 w-48 border border-zinc-800"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedChallengeId(challenge.id);
                        setShowChallengeDetail(true);
                      }}
                    >
                      <Text className="text-2xl mb-2">{challenge.emoji || '🏆'}</Text>
                      <Text className="text-white font-semibold" numberOfLines={1}>
                        {challenge.title}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="people-outline" size={14} color="#71717a" />
                        <Text className="text-zinc-500 text-xs ml-1">
                          {challenge.participantCount || 0} participants
                        </Text>
                      </View>
                      {/* Progress bar */}
                      <View className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-purple-600 rounded-full"
                          style={{ width: `${Math.min((challenge.userProgress || 0) / (challenge.goal_value || 1) * 100, 100)}%` }}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Your Circles Section */}
            <View className="mb-6">
              <Text className="text-zinc-400 text-sm font-semibold mb-3 uppercase tracking-wide">
                Your Circles
              </Text>
              {circles.length > 0 ? (
                circles.map((circle) => (
                  <TouchableOpacity
                    key={circle.id}
                    className="flex-row items-center bg-zinc-900 rounded-2xl p-4 mb-3 border border-zinc-800"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCircleId(circle.id);
                      setShowCircleHome(true);
                    }}
                  >
                    <View className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center mr-4">
                      <Text className="text-2xl">{circle.emoji || '👥'}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base">{circle.name}</Text>
                      <Text className="text-zinc-500 text-sm mt-0.5">
                        {circle.memberCount || 1} members
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#52525b" />
                  </TouchableOpacity>
                ))
              ) : (
                <View className="items-center py-10">
                  <Ionicons name="people-outline" size={48} color="#3f3f46" />
                  <Text className="text-zinc-500 text-base mt-4">No circles yet</Text>
                  <TouchableOpacity
                    className="mt-4 bg-purple-600 px-6 py-3 rounded-full"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setShowCreateCircle(true);
                    }}
                  >
                    <Text className="text-white font-semibold">Create a Circle</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* Mini Voice Button */}
        <MiniVoiceButton position="top-right" screenContext="social" />
      </SafeAreaView>

      {/* Circle Home Modal */}
      <CircleHomeModal
        visible={showCircleHome}
        circleId={selectedCircleId}
        onClose={() => {
          setShowCircleHome(false);
          setSelectedCircleId(null);
        }}
        onOpenChallenge={(challengeId) => {
          setShowCircleHome(false);
          setSelectedChallengeId(challengeId);
          setShowChallengeDetail(true);
        }}
      />

      {/* Challenge Detail Modal */}
      <ChallengeDetailModal
        visible={showChallengeDetail}
        challengeId={selectedChallengeId}
        onClose={() => {
          setShowChallengeDetail(false);
          setSelectedChallengeId(null);
        }}
      />

      {/* Create Circle Sheet */}
      <CreateCircleSheet
        visible={showCreateCircle}
        onClose={() => setShowCreateCircle(false)}
        onCircleCreated={() => {
          setShowCreateCircle(false);
          refreshCircles();
        }}
      />

      {/* Create Challenge Sheet */}
      <CreateChallengeSheet
        visible={showCreateChallenge}
        onClose={() => setShowCreateChallenge(false)}
        onChallengeCreated={() => {
          setShowCreateChallenge(false);
          refreshChallenges();
        }}
      />
    </View>
  );
}
