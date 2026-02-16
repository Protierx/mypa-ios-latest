/**
 * Challenge Detail Modal — Premium Light Theme
 *
 * Full challenge view with progress, leaderboard, and proof submission.
 * Opens when tapping a challenge from Circles Home or Circle Detail.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useChallenges } from '../../hooks/supabase/useChallenges';
import { Challenge } from '../../lib/supabase';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius, spacing } from '../../styles/theme';

/* ────────────── Types ────────────── */

interface ChallengeDetailModalProps {
  visible: boolean;
  challengeId: string | null;
  onClose: () => void;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  progress: number;
  rank: number;
  isCurrentUser: boolean;
}

/* ────────────── Component ────────────── */

export function ChallengeDetailModal({ visible, challengeId, onClose }: ChallengeDetailModalProps) {
  const { user } = useSupabaseAuth();
  const { getChallenge, getChallengeLeaderboard, leaveChallenge, submitProof } = useChallenges();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myProgress, setMyProgress] = useState(0);
  const [myRank, setMyRank] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadChallengeData = useCallback(async () => {
    if (!challengeId) return;
    try {
      const [challengeData, leaderboardData] = await Promise.all([
        getChallenge(challengeId),
        getChallengeLeaderboard(challengeId),
      ]);
      setChallenge(challengeData);
      setLeaderboard(leaderboardData || []);
      const myEntry = leaderboardData?.find((e: LeaderboardEntry) => e.userId === user?.id);
      if (myEntry) { setMyProgress(myEntry.progress); setMyRank(myEntry.rank); }
    } catch (error) {
      console.error('Error loading challenge data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [challengeId, user?.id]);

  useEffect(() => {
    if (visible && challengeId) { setIsLoading(true); loadChallengeData(); }
  }, [visible, challengeId]);

  const handleLeaveChallenge = useCallback(() => {
    Alert.alert(
      'Leave Challenge',
      'Are you sure? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (!challengeId) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await leaveChallenge(challengeId);
            onClose();
          },
        },
      ]
    );
  }, [challengeId, leaveChallenge, onClose]);

  const handleSubmitProof = useCallback(async () => {
    if (!challengeId || isSubmitting) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const ok = await submitProof(challengeId, 'checkin');
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMyProgress(prev => prev + 1);
        // Reload leaderboard
        const lb = await getChallengeLeaderboard(challengeId);
        setLeaderboard(lb || []);
        const myEntry = lb?.find((e: LeaderboardEntry) => e.userId === user?.id);
        if (myEntry) setMyRank(myEntry.rank);
      } else {
        Alert.alert('Error', 'Could not submit. Try again.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }, [challengeId, isSubmitting, submitProof, getChallengeLeaderboard, user?.id]);

  const getTimeRemaining = (): string => {
    if (!challenge?.ends_at) return '';
    const diff = new Date(challenge.ends_at).getTime() - Date.now();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const getProgressPercentage = (): number => {
    if (!challenge?.goal_value) return 0;
    return Math.min((myProgress / challenge.goal_value) * 100, 100);
  };

  const getTypeLabel = (): string => {
    if (!challenge) return 'progress';
    switch (challenge.type) {
      case 'focus_time': return 'minutes focused';
      case 'tasks_completed': return 'tasks completed';
      case 'daily_checkin': return 'days checked in';
      default: return 'progress';
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: bg.primary }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary,
          backgroundColor: bg.card,
        }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color={textTokens.secondary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '700', color: textTokens.primary }}>Challenge</Text>
          <View style={{ width: 32 }} />
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={brand.primary} />
          </View>
        ) : challenge ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Challenge Hero */}
            <View style={{
              alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20,
              backgroundColor: bg.card, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary,
            }}>
              <Text style={{ fontSize: 56 }}>{challenge.emoji || '🏆'}</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: textTokens.primary, textAlign: 'center', marginTop: 8, letterSpacing: -0.3 }}>
                {challenge.title}
              </Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', marginTop: 10,
                backgroundColor: 'rgba(245,158,11,0.08)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
              }}>
                <Ionicons name="time-outline" size={14} color={semantic.warning} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: semantic.warning, marginLeft: 5 }}>{getTimeRemaining()}</Text>
              </View>
            </View>

            {/* Your Progress */}
            <View style={{ margin: 16, backgroundColor: bg.card, borderRadius: radius.lg, padding: 20, borderWidth: 0.5, borderColor: borderTokens.primary, ...shadows.md }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: textTokens.tertiary, letterSpacing: 0.5, marginBottom: 10 }}>YOUR PROGRESS</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 36, fontWeight: '800', color: textTokens.primary }}>
                  {myProgress}
                  <Text style={{ fontSize: 18, fontWeight: '500', color: textTokens.tertiary }}>/{challenge.goal_value}</Text>
                </Text>
                {myRank > 0 && (
                  <View style={{ backgroundColor: brand.muted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: brand.primary }}>#{myRank}</Text>
                  </View>
                )}
              </View>
              <View style={{ height: 10, backgroundColor: borderTokens.primary, borderRadius: 5, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${getProgressPercentage()}%`, backgroundColor: getProgressPercentage() >= 100 ? semantic.success : brand.primary, borderRadius: 5 }} />
              </View>
              <Text style={{ fontSize: 12, color: textTokens.tertiary, marginTop: 6, fontWeight: '500' }}>{getTypeLabel()}</Text>
            </View>

            {/* Check-in / Submit Button */}
            {challenge.type === 'daily_checkin' && challenge.status === 'active' && (
              <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: brand.primary, paddingVertical: 16, borderRadius: 14, gap: 8,
                    ...shadows.purple,
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                  onPress={handleSubmitProof}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={textTokens.inverse} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={textTokens.inverse} />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: textTokens.inverse }}>Check In Today</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Leaderboard */}
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: textTokens.tertiary, letterSpacing: 0.5, marginBottom: 10 }}>LEADERBOARD</Text>
              {leaderboard.length > 0 ? (
                <View style={{ backgroundColor: bg.card, borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: borderTokens.primary }}>
                  {leaderboard.map((item, index) => {
                    const isCurrentUser = item.isCurrentUser;
                    const progressPercent = challenge.goal_value
                      ? Math.min((item.progress / challenge.goal_value) * 100, 100)
                      : 0;
                    return (
                      <View key={item.userId}>
                        <View style={{
                          flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14,
                          backgroundColor: isCurrentUser ? brand.muted : 'transparent',
                        }}>
                          {/* Rank */}
                          <View style={{ width: 28, alignItems: 'center' }}>
                            {index < 3 ? (
                              <Text style={{ fontSize: 16 }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</Text>
                            ) : (
                              <Text style={{ fontSize: 13, fontWeight: '600', color: textTokens.tertiary }}>{item.rank}</Text>
                            )}
                          </View>
                          {/* Avatar */}
                          {item.avatarUrl ? (
                            <Image source={{ uri: item.avatarUrl }} style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 8 }} />
                          ) : (
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isCurrentUser ? brand.surface : borderTokens.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                              <Text style={{ fontSize: 14, fontWeight: '600', color: isCurrentUser ? brand.primary : textTokens.secondary }}>{item.displayName[0]?.toUpperCase()}</Text>
                            </View>
                          )}
                          {/* Name & Progress Bar */}
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: isCurrentUser ? brand.primary : textTokens.primary }}>
                              {item.displayName}{isCurrentUser ? ' (You)' : ''}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                              <View style={{ flex: 1, height: 4, backgroundColor: borderTokens.primary, borderRadius: 2, overflow: 'hidden' }}>
                                <View style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: brand.primary, borderRadius: 2 }} />
                              </View>
                              <Text style={{ fontSize: 11, color: textTokens.tertiary, marginLeft: 8, fontWeight: '500' }}>
                                {item.progress}/{challenge.goal_value}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {index < leaderboard.length - 1 && (
                          <View style={{ height: 0.5, backgroundColor: borderTokens.primary, marginHorizontal: 14 }} />
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 24, backgroundColor: bg.card, borderRadius: 14, borderWidth: 0.5, borderColor: borderTokens.primary }}>
                  <Ionicons name="podium-outline" size={28} color={textTokens.disabled} />
                  <Text style={{ fontSize: 13, color: textTokens.tertiary, marginTop: 6 }}>No participants yet</Text>
                </View>
              )}
            </View>

            {/* Rules (Collapsible) */}
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: bg.card, borderRadius: radius.md, padding: 14,
                  borderWidth: 0.5, borderColor: borderTokens.primary,
                }}
                onPress={() => setShowRules(!showRules)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: textTokens.secondary }}>Challenge Rules</Text>
                <Ionicons name={showRules ? 'chevron-up' : 'chevron-down'} size={18} color={textTokens.tertiary} />
              </TouchableOpacity>
              {showRules && (
                <View style={{ backgroundColor: bg.card, borderRadius: radius.md, padding: 14, marginTop: 4, borderWidth: 0.5, borderColor: borderTokens.primary }}>
                  <Text style={{ fontSize: 13, color: textTokens.secondary, lineHeight: 19 }}>
                    {challenge.description || 'Complete the goal before the challenge ends to win!'}
                  </Text>
                </View>
              )}
            </View>

            {/* Leave Challenge */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
              <TouchableOpacity
                style={{ alignItems: 'center', paddingVertical: 12 }}
                onPress={handleLeaveChallenge}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: semantic.error }}>Leave Challenge</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="trophy-outline" size={40} color={textTokens.disabled} />
            <Text style={{ fontSize: 14, color: textTokens.tertiary, marginTop: 8 }}>Challenge not found</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
