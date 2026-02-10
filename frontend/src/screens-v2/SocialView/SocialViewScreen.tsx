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
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Modal state
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [showCircleHome, setShowCircleHome] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Failsafe: don't show spinner for more than 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => setLoadingTimeout(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshCircles(), refreshChallenges()]);
    setRefreshing(false);
  }, [refreshCircles, refreshChallenges]);

  const loading = (circlesLoading || challengesLoading) && !loadingTimeout;
  const activeChallenges = challenges.filter(c => c.status === 'active');

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="px-5 pt-4 pb-3 flex-row justify-between items-center">
          <Text className="text-title-1 font-bold text-ink-primary">Social</Text>
          <TouchableOpacity
            className="w-10 h-10 bg-surface-3 rounded-full items-center justify-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreateMenu(!showCreateMenu);
            }}
          >
            <Ionicons name={showCreateMenu ? 'close' : 'add'} size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {showCreateMenu && (
          <View className="absolute top-20 right-5 z-50 bg-surface-2 rounded-xl border border-surface-4 shadow-lg overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center px-5 py-4 border-b border-surface-4"
              onPress={() => {
                setShowCreateMenu(false);
                setShowCreateCircle(true);
              }}
            >
              <Ionicons name="people" size={20} color="#7C3AED" />
              <Text className="text-body font-medium text-ink-primary ml-3">Create Circle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center px-5 py-4"
              onPress={() => {
                setShowCreateMenu(false);
                setShowCreateChallenge(true);
              }}
            >
              <Ionicons name="trophy" size={20} color="#EAB308" />
              <Text className="text-body font-medium text-ink-primary ml-3">Create Challenge</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#7C3AED" size="large" />
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7C3AED" />
            }
          >
            {/* Active Challenges Section */}
            {activeChallenges.length > 0 && (
              <View className="mb-6">
                <Text className="text-caption-1 font-semibold text-ink-tertiary mb-3 uppercase tracking-wide">
                  Active Challenges
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
                  {activeChallenges.map((challenge) => (
                    <TouchableOpacity
                      key={challenge.id}
                      className="bg-surface-2 rounded-xl p-4 mr-3 w-48 border border-surface-4"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedChallengeId(challenge.id);
                        setShowChallengeDetail(true);
                      }}
                    >
                      <Text className="text-title-2 mb-2">{challenge.emoji || '🏆'}</Text>
                      <Text className="text-headline font-semibold text-ink-primary" numberOfLines={1}>
                        {challenge.title}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="people-outline" size={14} color="#71717A" />
                        <Text className="text-footnote text-ink-tertiary ml-1">
                          {challenge.participantCount || 0} participants
                        </Text>
                      </View>
                      <View className="mt-3 h-1.5 bg-surface-4 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-brand-purple rounded-full"
                          style={{ width: `${Math.min((challenge.userProgress || 0) / (challenge.goal_value || 1) * 100, 100)}%` }}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View className="mb-6">
              <Text className="text-caption-1 font-semibold text-ink-tertiary mb-3 uppercase tracking-wide">
                Your Circles
              </Text>
              {circles.length > 0 ? (
                circles.map((circle) => (
                  <TouchableOpacity
                    key={circle.id}
                    className="flex-row items-center bg-surface-2 rounded-xl p-4 mb-3 border border-surface-4"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCircleId(circle.id);
                      setShowCircleHome(true);
                    }}
                  >
                    <View className="w-12 h-12 bg-surface-3 rounded-full items-center justify-center mr-4">
                      <Text className="text-title-2">{circle.emoji || '👥'}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-headline font-semibold text-ink-primary">{circle.name}</Text>
                      <Text className="text-subhead text-ink-tertiary mt-0.5">
                        {circle.memberCount || 1} members
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#52525B" />
                  </TouchableOpacity>
                ))
              ) : (
                <View className="items-center py-10">
                  <Ionicons name="people-outline" size={48} color="#52525B" />
                  <Text className="text-body text-ink-tertiary mt-4">No circles yet</Text>
                  <TouchableOpacity
                    className="mt-4 bg-brand-purple px-6 py-3 rounded-full"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setShowCreateCircle(true);
                    }}
                  >
                    <Text className="text-headline font-semibold text-ink-primary">Create a Circle</Text>
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
