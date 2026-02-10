/**
 * Challenge Detail Modal
 * 
 * Full challenge view with progress, leaderboard, and proof submission.
 * Opens when tapping a challenge from Social View or Circle Home.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useChallenges } from '../../hooks/supabase/useChallenges';
import { Challenge, Profile } from '../../lib/supabase';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

interface ChallengeDetailModalProps {
  visible: boolean;
  challengeId: string | null;
  onClose: () => void;
}

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  progress: number;
  rank: number;
}

export function ChallengeDetailModal({ visible, challengeId, onClose }: ChallengeDetailModalProps) {
  const { user } = useSupabaseAuth();
  const { getChallenge, getChallengeLeaderboard, leaveChallenge, submitProof } = useChallenges();
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myProgress, setMyProgress] = useState(0);
  const [myRank, setMyRank] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);

  const loadChallengeData = useCallback(async () => {
    if (!challengeId) return;
    
    try {
      const [challengeData, leaderboardData] = await Promise.all([
        getChallenge(challengeId),
        getChallengeLeaderboard(challengeId),
      ]);
      
      setChallenge(challengeData);
      setLeaderboard(leaderboardData || []);
      
      // Find my progress
      const myEntry = leaderboardData?.find((e: LeaderboardEntry) => e.user_id === user?.id);
      if (myEntry) {
        setMyProgress(myEntry.progress);
        setMyRank(myEntry.rank);
      }
    } catch (error) {
      console.error('Error loading challenge data:', error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId, user?.id]);

  useEffect(() => {
    if (visible && challengeId) {
      setIsLoading(true);
      loadChallengeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, challengeId]);

  const handleLeaveChallenge = useCallback(() => {
    Alert.alert(
      'Leave Challenge',
      'Are you sure you want to leave this challenge? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (!challengeId) return;
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await leaveChallenge(challengeId);
            onClose();
          },
        },
      ]
    );
  }, [challengeId, leaveChallenge, onClose]);

  const handleSubmitProof = useCallback(async () => {
    if (!challengeId) return;
    
    // TODO: Open camera/gallery picker
    Alert.alert('Coming Soon', 'Proof submission will be available soon.');
  }, [challengeId]);

  const getTimeRemaining = (): string => {
    if (!challenge?.ends_at) return '';
    
    const now = new Date();
    const end = new Date(challenge.ends_at);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const getProgressPercentage = (): number => {
    if (!challenge?.goal_value) return 0;
    return Math.min((myProgress / challenge.goal_value) * 100, 100);
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = item.user_id === user?.id;
    const progressPercent = challenge?.goal_value 
      ? Math.min((item.progress / challenge.goal_value) * 100, 100) 
      : 0;
    
    return (
      <View className={`flex-row items-center py-3 px-4 ${isCurrentUser ? 'bg-purple-900/30 rounded-lg' : ''}`}>
        {/* Rank */}
        <View className="w-8 items-center">
          {index < 3 ? (
            <Text className={`text-lg ${
              index === 0 ? 'text-yellow-500' : index === 1 ? 'text-zinc-300' : 'text-orange-400'
            }`}>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
            </Text>
          ) : (
            <Text className="text-zinc-500">{item.rank}</Text>
          )}
        </View>
        
        {/* Avatar */}
        {item.user_avatar ? (
          <Image source={{ uri: item.user_avatar }} className="w-10 h-10 rounded-full ml-2" />
        ) : (
          <View className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center ml-2">
            <Text className="text-white font-semibold">
              {item.user_name[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* Name & Progress */}
        <View className="flex-1 ml-3">
          <Text className={`font-medium ${isCurrentUser ? 'text-purple-400' : 'text-white'}`}>
            {item.user_name}
            {isCurrentUser && ' (You)'}
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <View 
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            <Text className="text-zinc-500 text-xs ml-2">
              {item.progress}/{challenge?.goal_value}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-zinc-800">
          <TouchableOpacity onPress={onClose} className="p-2 -ml-2">
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text className="text-white text-lg font-semibold">Challenge</Text>
          
          <View className="w-10" />
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#a855f7" />
          </View>
        ) : challenge ? (
          <ScrollView className="flex-1">
            {/* Challenge Info */}
            <View className="px-5 py-6 items-center border-b border-zinc-800">
              <Text className="text-5xl mb-3">{challenge.emoji || '🏆'}</Text>
              <Text className="text-white text-xl font-bold text-center">{challenge.title}</Text>
              
              {/* Timer */}
              <View className="flex-row items-center mt-3 bg-zinc-900 px-4 py-2 rounded-full">
                <Ionicons name="time-outline" size={16} color="#f97316" />
                <Text className="text-orange-400 ml-2 font-medium">{getTimeRemaining()}</Text>
              </View>
            </View>

            {/* Your Progress */}
            <View className="px-5 py-4 border-b border-zinc-800">
              <Text className="text-zinc-500 text-sm mb-3">Your Progress</Text>
              <View className="flex-row items-end justify-between mb-2">
                <Text className="text-white text-3xl font-bold">
                  {myProgress}
                  <Text className="text-zinc-500 text-lg font-normal">/{challenge.goal_value}</Text>
                </Text>
                {myRank > 0 && (
                  <Text className="text-purple-400">Rank #{myRank}</Text>
                )}
              </View>
              <View className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </View>
              <Text className="text-zinc-500 text-sm mt-2">
                {challenge.type === 'focus_time' ? 'minutes focused' : 
                 challenge.type === 'tasks_completed' ? 'tasks completed' :
                 challenge.type === 'daily_checkin' ? 'days checked in' : 'progress'}
              </Text>
            </View>

            {/* Daily Check-in (if applicable) */}
            {challenge.type === 'daily_checkin' && (
              <View className="px-5 py-4 border-b border-zinc-800">
                <TouchableOpacity
                  className="bg-purple-600 py-4 rounded-xl items-center"
                  onPress={handleSubmitProof}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="camera-outline" size={20} color="#fff" />
                    <Text className="text-white font-semibold ml-2">Submit Today's Proof</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Leaderboard */}
            <View className="px-5 py-4">
              <Text className="text-white text-lg font-semibold mb-3">Leaderboard</Text>
              {leaderboard.length > 0 ? (
                <View className="bg-zinc-900/50 rounded-xl overflow-hidden">
                  {leaderboard.map((item, index) => (
                    <View key={item.user_id}>
                      {renderLeaderboardItem({ item, index })}
                      {index < leaderboard.length - 1 && (
                        <View className="h-px bg-zinc-800 mx-4" />
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View className="py-8 items-center">
                  <Text className="text-zinc-500">No participants yet</Text>
                </View>
              )}
            </View>

            {/* Rules */}
            <TouchableOpacity
              className="mx-5 mb-4"
              onPress={() => setShowRules(!showRules)}
            >
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-zinc-400">Challenge Rules</Text>
                <Ionicons 
                  name={showRules ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color="#71717a" 
                />
              </View>
              {showRules && (
                <Text className="text-zinc-500 text-sm pb-3">
                  {challenge.description || 'Complete the goal before the challenge ends to win!'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Leave Challenge */}
            <View className="px-5 pb-8">
              <TouchableOpacity
                className="py-3 items-center"
                onPress={handleLeaveChallenge}
              >
                <Text className="text-red-500">Leave Challenge</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-zinc-500">Challenge not found</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
