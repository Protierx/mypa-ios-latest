import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Challenge, ChallengeMember } from '../types';
import { categoryColors } from '../constants';
import { styles } from '../styles';
import { renderIcon } from './IconRenderer';

interface ChallengeCardProps {
  challenge: Challenge;
  isExpanded: boolean;
  leaderboardMembers: ChallengeMember[];
  onPress: () => void;
  onLongPress: () => void;
  onOptionsPress: () => void;
  onSubmitProof: () => void;
}

export function ChallengeCard({
  challenge,
  isExpanded,
  leaderboardMembers,
  onPress,
  onLongPress,
  onOptionsPress,
  onSubmitProof,
}: ChallengeCardProps) {
  const catColor = categoryColors[challenge.category];
  const progressPercent = ((challenge.totalDays - challenge.daysLeft) / challenge.totalDays) * 100;
  const renderMembers = leaderboardMembers.length > 0 ? leaderboardMembers : challenge.members;

  return (
    <TouchableOpacity
      style={styles.challengeCard}
      activeOpacity={0.95}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <View style={[styles.challengeHeader, { backgroundColor: catColor.bg }]}>
        <View style={styles.challengeHeaderContent}>
          <View style={styles.challengeIconContainer}>
            {renderIcon(challenge.iconName, 24, '#FFFFFF')}
          </View>
          <View style={styles.challengeHeaderInfo}>
            <Text style={styles.challengeName}>{challenge.name}</Text>
            <View style={styles.challengeMeta}>
              <Text style={styles.challengeMetaText}>{challenge.daysLeft} days left</Text>
              <Text style={styles.challengeMetaDot}>•</Text>
              <Text style={styles.challengeMetaText}>+{challenge.xpReward} XP</Text>
            </View>
          </View>
          <View style={styles.challengeHeaderRight}>
            <TouchableOpacity
              style={styles.challengeOptionsButton}
              onPress={onOptionsPress}
            >
              <Feather name="more-horizontal" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            {challenge.myStatus === 'completed' ? (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.streakBadge}>
                <MaterialCommunityIcons name="fire" size={16} color="#FFFFFF" />
                <Text style={styles.streakBadgeText}>{challenge.myStreak}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.challengeProgress}>
          <View style={styles.challengeProgressLabels}>
            <Text style={styles.challengeProgressLabel}>Day {challenge.totalDays - challenge.daysLeft}</Text>
            <Text style={styles.challengeProgressLabel}>{Math.round(progressPercent)}%</Text>
          </View>
          <View style={styles.challengeProgressBar}>
            <View style={[styles.challengeProgressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.challengeBody}>
        <View style={styles.todayStatus}>
          <Feather name="clock" size={14} color="#94A3B8" />
          <Text style={styles.todayPrompt}>{challenge.todayPrompt}</Text>
          <Text style={styles.todayCount}>{challenge.progress.completed}/{challenge.progress.total}</Text>
        </View>

        <TouchableOpacity style={styles.miniLeaderboard} onPress={onPress}>
          <View style={styles.miniLeaderboardHeader}>
            <Text style={styles.miniLeaderboardTitle}>Challenge Leaderboard</Text>
            <View style={styles.miniLeaderboardCta}>
              <Text style={styles.miniLeaderboardHint}>{isExpanded ? 'Hide' : 'View'}</Text>
              <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
            </View>
          </View>
          <View style={styles.memberAvatars}>
            {renderMembers.slice(0, 5).map((member, i) => (
              <View key={i} style={styles.memberAvatarContainer}>
                <View style={[styles.memberAvatar, { backgroundColor: member.color }, member.name === 'You' && styles.memberAvatarYou]}>
                  <Text style={styles.memberAvatarText}>{member.initial}</Text>
                </View>
                {member.rank <= 3 && (
                  <View style={[styles.rankBadge, member.rank === 1 && styles.rankBadge1, member.rank === 2 && styles.rankBadge2, member.rank === 3 && styles.rankBadge3]}>
                    <Text style={styles.rankBadgeText}>{member.rank}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedLeaderboard}>
            {renderMembers.map((member, i) => (
              <View key={i} style={[styles.leaderboardRow, member.name === 'You' && styles.leaderboardRowYou]}>
                <View style={styles.leaderboardRowLeft}>
                  <Text style={[styles.leaderboardRank, member.rank <= 3 && styles.leaderboardRankTop]}>#{member.rank}</Text>
                  <View style={[styles.leaderboardAvatar, { backgroundColor: member.color }]}>
                    <Text style={styles.leaderboardAvatarText}>{member.initial}</Text>
                  </View>
                  <Text style={[styles.leaderboardName, member.name === 'You' && styles.leaderboardNameYou]}>{member.name}</Text>
                </View>
                <View style={styles.leaderboardStreak}>
                  <MaterialCommunityIcons name="fire" size={16} color="#F97316" />
                  <Text style={styles.leaderboardStreakText}>{member.streak}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {challenge.stakes && (
          <View style={styles.stakesBadge}>
            <Text style={styles.stakesEmoji}>💰</Text>
            <Text style={styles.stakesText}>{challenge.stakes}</Text>
          </View>
        )}

        {challenge.myStatus === 'pending' ? (
          <TouchableOpacity style={styles.submitButton} onPress={onSubmitProof}>
            <Ionicons name="camera" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Submit Proof</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedButton}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.completedButtonText}>Completed for today! +{challenge.xpReward} XP</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
