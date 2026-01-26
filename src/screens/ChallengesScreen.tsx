import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { colors } from '../styles/colors';

interface ChallengesScreenProps {
  navigation: any;
}

interface Challenge {
  id: number;
  name: string;
  iconName: string;
  iconColor: string;
  daysLeft: number;
  totalDays: number;
  members: { name: string; initial: string; color: string; streak: number; rank: number }[];
  todayPrompt: string;
  progress: { completed: number; total: number };
  myStatus: 'pending' | 'completed' | 'missed';
  myStreak: number;
  category: 'fitness' | 'wellness' | 'learning' | 'productivity' | 'social';
  xpReward: number;
  stakes?: string;
}

const categoryColors: { [key: string]: { bg: string } } = {
  fitness: { bg: '#F43F5E' },
  wellness: { bg: '#8B5CF6' },
  learning: { bg: '#3B82F6' },
  productivity: { bg: '#F59E0B' },
  social: { bg: '#10B981' },
};

export function ChallengesScreen({ navigation }: ChallengesScreenProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'leaderboard' | 'achievements'>('active');
  const [expandedChallenge, setExpandedChallenge] = useState<number | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('week');

  const userStats = {
    totalXP: 4850,
    currentStreak: 7,
    rank: 3,
    totalMembers: 24,
    level: 12,
    nextLevelXP: 5000
  };

  const leaderboard = [
    { rank: 1, name: 'Sarah', initial: 'S', xp: 6240, streak: 21, wins: 12, isYou: false, movement: 'up' },
    { rank: 2, name: 'Mike', initial: 'M', xp: 5890, streak: 18, wins: 10, isYou: false, movement: 'same' },
    { rank: 3, name: 'You', initial: 'A', xp: 4850, streak: 7, wins: 8, isYou: true, movement: 'up' },
    { rank: 4, name: 'Emma', initial: 'E', xp: 4200, streak: 5, wins: 6, isYou: false, movement: 'down' },
    { rank: 5, name: 'Jake', initial: 'J', xp: 3950, streak: 4, wins: 5, isYou: false, movement: 'up' },
  ];

  const achievements = [
    { id: 1, name: 'First Blood', iconName: 'target', color: '#3B82F6', description: 'Complete your first challenge', unlocked: true, xp: 100 },
    { id: 2, name: 'Streak Master', iconName: 'fire', color: '#F97316', description: '7-day streak', unlocked: true, xp: 250 },
    { id: 3, name: 'Consistency King', iconName: 'crown', color: '#F59E0B', description: '21-day streak', unlocked: false, xp: 500, progress: 7, total: 21 },
    { id: 4, name: 'Social Butterfly', iconName: 'heart', color: '#EC4899', description: 'Join 5 group challenges', unlocked: true, xp: 150 },
    { id: 5, name: 'Champion', iconName: 'trophy', color: '#EAB308', description: 'Win 10 challenges', unlocked: false, xp: 1000, progress: 8, total: 10 },
  ];

  const [activeChallenges] = useState<Challenge[]>([
    {
      id: 1,
      name: 'Morning Workout',
      iconName: 'dumbbell',
      iconColor: '#F43F5E',
      daysLeft: 18,
      totalDays: 30,
      members: [
        { name: 'You', initial: 'A', color: '#8B5CF6', streak: 7, rank: 1 },
        { name: 'Sarah', initial: 'S', color: '#F43F5E', streak: 6, rank: 2 },
        { name: 'Mike', initial: 'M', color: '#3B82F6', streak: 5, rank: 3 },
      ],
      todayPrompt: 'Post your workout proof by 10 AM',
      progress: { completed: 3, total: 5 },
      myStatus: 'pending',
      myStreak: 7,
      category: 'fitness',
      xpReward: 50,
      stakes: '$5 per miss'
    },
    {
      id: 2,
      name: 'Daily Reading',
      iconName: 'book-open',
      iconColor: '#3B82F6',
      daysLeft: 6,
      totalDays: 14,
      members: [
        { name: 'You', initial: 'A', color: '#8B5CF6', streak: 14, rank: 1 },
        { name: 'Lily', initial: 'L', color: '#EC4899', streak: 10, rank: 2 },
      ],
      todayPrompt: 'Share what you read today',
      progress: { completed: 3, total: 3 },
      myStatus: 'completed',
      myStreak: 14,
      category: 'learning',
      xpReward: 30
    },
    {
      id: 3,
      name: 'No Phone After 9PM',
      iconName: 'cellphone-off',
      iconColor: '#8B5CF6',
      daysLeft: 3,
      totalDays: 7,
      members: [
        { name: 'You', initial: 'A', color: '#8B5CF6', streak: 4, rank: 2 },
        { name: 'Kate', initial: 'K', color: '#FB923C', streak: 5, rank: 1 },
      ],
      todayPrompt: 'Screenshot your screen time',
      progress: { completed: 1, total: 2 },
      myStatus: 'pending',
      myStreak: 4,
      category: 'wellness',
      xpReward: 25
    },
  ]);

  const invites = [
    {
      id: 1,
      name: 'Hydration Challenge',
      iconName: 'water',
      iconColor: '#06B6D4',
      inviter: 'Sarah',
      members: 4,
      xpReward: 200,
    },
  ];

  const renderIcon = (name: string, size: number, color: string) => {
    switch (name) {
      case 'dumbbell':
        return <MaterialCommunityIcons name="dumbbell" size={size} color={color} />;
      case 'book-open':
        return <Feather name="book-open" size={size} color={color} />;
      case 'cellphone-off':
        return <MaterialCommunityIcons name="cellphone-off" size={size} color={color} />;
      case 'water':
        return <Ionicons name="water" size={size} color={color} />;
      case 'target':
        return <MaterialCommunityIcons name="target" size={size} color={color} />;
      case 'fire':
        return <MaterialCommunityIcons name="fire" size={size} color={color} />;
      case 'crown':
        return <MaterialCommunityIcons name="crown" size={size} color={color} />;
      case 'heart':
        return <Ionicons name="heart" size={size} color={color} />;
      case 'trophy':
        return <Ionicons name="trophy" size={size} color={color} />;
      default:
        return <Ionicons name="help-circle" size={size} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Challenges</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Banner */}
        <View style={styles.statsBanner}>
          <View style={styles.statsRow}>
            <View style={styles.statsLeft}>
              <View style={styles.streakIconContainer}>
                <MaterialCommunityIcons name="fire" size={28} color="#FFFFFF" />
              </View>
              <View>
                <View style={styles.streakValueRow}>
                  <Text style={styles.streakValue}>{userStats.currentStreak}</Text>
                  <Text style={styles.streakLabel}>day streak</Text>
                </View>
                <View style={styles.xpRow}>
                  <Ionicons name="flash" size={14} color="#8B5CF6" />
                  <Text style={styles.xpText}>{userStats.totalXP} XP</Text>
                  <Text style={styles.levelText}>• Lvl {userStats.level}</Text>
                </View>
              </View>
            </View>
            <View style={styles.statsRight}>
              <View style={styles.rankInfo}>
                <View style={styles.rankRow}>
                  <MaterialCommunityIcons name="crown" size={16} color="#F59E0B" />
                  <Text style={styles.rankValue}>#{userStats.rank}</Text>
                </View>
                <Text style={styles.rankTotal}>of {userStats.totalMembers}</Text>
              </View>
              <View style={styles.trophyContainer}>
                <Ionicons name="trophy" size={24} color="#D97706" />
              </View>
            </View>
          </View>
          <View style={styles.xpProgressContainer}>
            <View style={styles.xpProgressLabels}>
              <Text style={styles.xpProgressLabel}>Level {userStats.level} → {userStats.level + 1}</Text>
              <Text style={styles.xpProgressValue}>{userStats.nextLevelXP - userStats.totalXP} XP to go</Text>
            </View>
            <View style={styles.xpProgressBar}>
              <View style={[styles.xpProgressFill, { width: `${(userStats.totalXP / userStats.nextLevelXP) * 100}%` }]} />
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <View style={styles.tabBar}>
            {[
              { id: 'active', label: 'Active', icon: 'target' },
              { id: 'leaderboard', label: 'Rankings', icon: 'trophy' },
              { id: 'achievements', label: 'Badges', icon: 'medal' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id as any)}
              >
                {tab.icon === 'target' && <MaterialCommunityIcons name="target" size={16} color={activeTab === tab.id ? '#0F172A' : '#64748B'} />}
                {tab.icon === 'trophy' && <Ionicons name="trophy" size={16} color={activeTab === tab.id ? '#0F172A' : '#64748B'} />}
                {tab.icon === 'medal' && <MaterialCommunityIcons name="medal" size={16} color={activeTab === tab.id ? '#0F172A' : '#64748B'} />}
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.content}>
          {/* Active Challenges Tab */}
          {activeTab === 'active' && (
            <View style={styles.challengesList}>
              {invites.length > 0 && (
                <View style={styles.inviteCard}>
                  <View style={styles.inviteHeader}>
                    <Ionicons name="gift" size={16} color="#D97706" />
                    <Text style={styles.inviteHeaderText}>New Challenge Invite</Text>
                  </View>
                  {invites.map(invite => (
                    <View key={invite.id} style={styles.inviteContent}>
                      <View style={styles.inviteIconContainer}>
                        {renderIcon(invite.iconName, 24, invite.iconColor)}
                      </View>
                      <View style={styles.inviteInfo}>
                        <Text style={styles.inviteName}>{invite.name}</Text>
                        <Text style={styles.inviteDetails}>{invite.inviter} • {invite.members} members • +{invite.xpReward} XP</Text>
                      </View>
                      <View style={styles.inviteActions}>
                        <TouchableOpacity style={styles.declineButton}>
                          <Ionicons name="close" size={16} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.joinButton}>
                          <Text style={styles.joinButtonText}>Join</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {activeChallenges.map((challenge) => {
                const catColor = categoryColors[challenge.category];
                const progressPercent = ((challenge.totalDays - challenge.daysLeft) / challenge.totalDays) * 100;

                return (
                  <View key={challenge.id} style={styles.challengeCard}>
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
                            <Text style={styles.challengeMetaText}>+{challenge.xpReward} XP/day</Text>
                          </View>
                        </View>
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

                      <TouchableOpacity
                        style={styles.miniLeaderboard}
                        onPress={() => setExpandedChallenge(expandedChallenge === challenge.id ? null : challenge.id)}
                      >
                        <View style={styles.miniLeaderboardHeader}>
                          <Text style={styles.miniLeaderboardTitle}>Challenge Leaderboard</Text>
                          <Ionicons name={expandedChallenge === challenge.id ? "chevron-up" : "chevron-down"} size={16} color="#94A3B8" />
                        </View>
                        <View style={styles.memberAvatars}>
                          {challenge.members.slice(0, 5).map((member, i) => (
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

                      {expandedChallenge === challenge.id && (
                        <View style={styles.expandedLeaderboard}>
                          {challenge.members.map((member, i) => (
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
                        <TouchableOpacity style={styles.submitButton}>
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
                  </View>
                );
              })}
            </View>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <View style={styles.leaderboardTab}>
              <View style={styles.timeframeSelector}>
                {['week', 'month', 'all'].map((tf) => (
                  <TouchableOpacity
                    key={tf}
                    style={[styles.timeframeButton, selectedTimeframe === tf && styles.timeframeButtonActive]}
                    onPress={() => setSelectedTimeframe(tf as any)}
                  >
                    <Text style={[styles.timeframeButtonText, selectedTimeframe === tf && styles.timeframeButtonTextActive]}>
                      {tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'All Time'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.podiumCard}>
                <View style={styles.podium}>
                  <View style={styles.podiumPosition}>
                    <View style={[styles.podiumAvatar, styles.podiumAvatar2]}>
                      <Text style={styles.podiumAvatarText}>{leaderboard[1].initial}</Text>
                    </View>
                    <MaterialCommunityIcons name="medal" size={24} color="#94A3B8" />
                    <Text style={styles.podiumName}>{leaderboard[1].name}</Text>
                    <Text style={styles.podiumXP}>{leaderboard[1].xp} XP</Text>
                    <View style={[styles.podiumStand, styles.podiumStand2]}>
                      <Text style={styles.podiumNumber}>2</Text>
                    </View>
                  </View>
                  <View style={[styles.podiumPosition, styles.podiumPosition1]}>
                    <View style={[styles.podiumAvatar, styles.podiumAvatar1]}>
                      <Text style={styles.podiumAvatarText1}>{leaderboard[0].initial}</Text>
                    </View>
                    <MaterialCommunityIcons name="crown" size={28} color="#F59E0B" />
                    <Text style={styles.podiumName1}>{leaderboard[0].name}</Text>
                    <Text style={styles.podiumXP1}>{leaderboard[0].xp} XP</Text>
                    <View style={[styles.podiumStand, styles.podiumStand1]}>
                      <Text style={styles.podiumNumber1}>1</Text>
                    </View>
                  </View>
                  <View style={styles.podiumPosition}>
                    <View style={[styles.podiumAvatar, styles.podiumAvatar3, leaderboard[2].isYou && styles.podiumAvatarYou]}>
                      <Text style={styles.podiumAvatarText}>{leaderboard[2].initial}</Text>
                    </View>
                    <MaterialCommunityIcons name="medal" size={24} color="#D97706" />
                    <Text style={[styles.podiumName, leaderboard[2].isYou && styles.podiumNameYou]}>{leaderboard[2].name}</Text>
                    <Text style={styles.podiumXP}>{leaderboard[2].xp} XP</Text>
                    <View style={[styles.podiumStand, styles.podiumStand3, leaderboard[2].isYou && styles.podiumStandYou]}>
                      <Text style={[styles.podiumNumber, leaderboard[2].isYou && styles.podiumNumberYou]}>3</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.fullLeaderboard}>
                {leaderboard.slice(3).map((player) => (
                  <View key={player.rank} style={[styles.leaderboardItem, player.isYou && styles.leaderboardItemYou]}>
                    <View style={styles.leaderboardItemLeft}>
                      <Text style={styles.leaderboardItemRank}>#{player.rank}</Text>
                      <View style={[styles.leaderboardItemAvatar, player.isYou && styles.leaderboardItemAvatarYou]}>
                        <Text style={styles.leaderboardItemAvatarText}>{player.initial}</Text>
                      </View>
                      <View>
                        <Text style={[styles.leaderboardItemName, player.isYou && styles.leaderboardItemNameYou]}>{player.name}</Text>
                        <View style={styles.leaderboardItemMeta}>
                          <Text style={styles.leaderboardItemXP}>{player.xp} XP</Text>
                          <Text style={styles.leaderboardItemDot}>•</Text>
                          <Text style={styles.leaderboardItemStreak}>{player.streak}🔥</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.leaderboardItemRight}>
                      {player.movement === 'up' && <Ionicons name="trending-up" size={16} color="#10B981" />}
                      {player.movement === 'down' && <Ionicons name="trending-down" size={16} color="#F43F5E" />}
                      <Text style={styles.leaderboardItemWins}>{player.wins} wins</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <View style={styles.achievementsTab}>
              <View style={styles.achievementStats}>
                <View style={styles.achievementStat}>
                  <Text style={[styles.achievementStatValue, { color: '#10B981' }]}>{achievements.filter(a => a.unlocked).length}</Text>
                  <Text style={styles.achievementStatLabel}>Unlocked</Text>
                </View>
                <View style={styles.achievementStat}>
                  <Text style={[styles.achievementStatValue, { color: '#94A3B8' }]}>{achievements.filter(a => !a.unlocked).length}</Text>
                  <Text style={styles.achievementStatLabel}>Locked</Text>
                </View>
                <View style={styles.achievementStat}>
                  <Text style={[styles.achievementStatValue, { color: '#8B5CF6' }]}>{achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0)}</Text>
                  <Text style={styles.achievementStatLabel}>XP Earned</Text>
                </View>
              </View>

              {achievements.map((achievement) => (
                <View key={achievement.id} style={[styles.achievementCard, !achievement.unlocked && styles.achievementCardLocked]}>
                  <View style={[styles.achievementIcon, achievement.unlocked ? styles.achievementIconUnlocked : styles.achievementIconLocked]}>
                    {achievement.unlocked ? renderIcon(achievement.iconName, 28, achievement.color) : <Ionicons name="lock-closed" size={24} color="#94A3B8" />}
                  </View>
                  <View style={styles.achievementInfo}>
                    <View style={styles.achievementTitleRow}>
                      <Text style={[styles.achievementName, !achievement.unlocked && styles.achievementNameLocked]}>{achievement.name}</Text>
                      {achievement.unlocked && <Ionicons name="checkmark-circle" size={16} color="#10B981" />}
                    </View>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <View style={styles.achievementProgress}>
                        <View style={styles.achievementProgressLabels}>
                          <Text style={styles.achievementProgressText}>{achievement.progress}/{achievement.total}</Text>
                          <Text style={styles.achievementProgressText}>{Math.round((achievement.progress / (achievement.total || 1)) * 100)}%</Text>
                        </View>
                        <View style={styles.achievementProgressBar}>
                          <View style={[styles.achievementProgressFill, { width: `${(achievement.progress / (achievement.total || 1)) * 100}%` }]} />
                        </View>
                      </View>
                    )}
                  </View>
                  <View style={[styles.achievementXP, achievement.unlocked ? styles.achievementXPUnlocked : styles.achievementXPLocked]}>
                    <Text style={[styles.achievementXPText, achievement.unlocked ? styles.achievementXPTextUnlocked : styles.achievementXPTextLocked]}>+{achievement.xp} XP</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  statsBanner: { marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakIconContainer: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  streakValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  streakValue: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  streakLabel: { fontSize: 14, color: '#64748B' },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  xpText: { fontSize: 13, fontWeight: '600', color: '#8B5CF6' },
  levelText: { fontSize: 11, color: '#94A3B8' },
  statsRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankInfo: { alignItems: 'flex-end' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rankValue: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  rankTotal: { fontSize: 11, color: '#64748B' },
  trophyContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  xpProgressContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  xpProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpProgressLabel: { fontSize: 11, color: '#64748B' },
  xpProgressValue: { fontSize: 11, fontWeight: '500', color: '#8B5CF6' },
  xpProgressBar: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  xpProgressFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 4 },
  tabContainer: { paddingHorizontal: 20, marginBottom: 16 },
  tabBar: { flexDirection: 'row', gap: 4, padding: 4, backgroundColor: '#F1F5F9', borderRadius: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  tabTextActive: { color: '#0F172A' },
  content: { paddingHorizontal: 20 },
  challengesList: { gap: 16 },
  inviteCard: { padding: 16, borderRadius: 16, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  inviteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  inviteHeaderText: { fontSize: 13, fontWeight: '600', color: '#B45309' },
  inviteContent: { flexDirection: 'row', alignItems: 'center' },
  inviteIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  inviteInfo: { flex: 1, marginLeft: 12 },
  inviteName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  inviteDetails: { fontSize: 12, color: '#64748B', marginTop: 2 },
  inviteActions: { flexDirection: 'row', gap: 8 },
  declineButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFFFFF' },
  joinButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#0F172A' },
  joinButtonText: { fontSize: 13, fontWeight: '500', color: '#FFFFFF' },
  challengeCard: { borderRadius: 16, backgroundColor: '#FFFFFF', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  challengeHeader: { padding: 16 },
  challengeHeaderContent: { flexDirection: 'row', alignItems: 'center' },
  challengeIconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  challengeHeaderInfo: { flex: 1, marginLeft: 12 },
  challengeName: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF' },
  challengeMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  challengeMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  challengeMetaDot: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginHorizontal: 4 },
  completedBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  streakBadgeText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  challengeProgress: { marginTop: 16 },
  challengeProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  challengeProgressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  challengeProgressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  challengeProgressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 4 },
  challengeBody: { padding: 16 },
  todayStatus: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  todayPrompt: { flex: 1, fontSize: 13, color: '#64748B', marginLeft: 8 },
  todayCount: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  miniLeaderboard: { marginBottom: 12 },
  miniLeaderboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  miniLeaderboardTitle: { fontSize: 12, fontWeight: '600', color: '#475569' },
  memberAvatars: { flexDirection: 'row', gap: 8 },
  memberAvatarContainer: { position: 'relative' },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  memberAvatarYou: { borderColor: '#8B5CF6' },
  memberAvatarText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  rankBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankBadge1: { backgroundColor: '#FCD34D' },
  rankBadge2: { backgroundColor: '#D1D5DB' },
  rankBadge3: { backgroundColor: '#FDE68A' },
  rankBadgeText: { fontSize: 8, fontWeight: 'bold', color: '#78350F' },
  expandedLeaderboard: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 8 },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 12 },
  leaderboardRowYou: { backgroundColor: '#F5F3FF' },
  leaderboardRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leaderboardRank: { width: 24, fontSize: 13, fontWeight: 'bold', color: '#94A3B8' },
  leaderboardRankTop: { color: '#D97706' },
  leaderboardAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  leaderboardAvatarText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  leaderboardName: { fontSize: 14, fontWeight: '500', color: '#475569' },
  leaderboardNameYou: { color: '#7C3AED' },
  leaderboardStreak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leaderboardStreakText: { fontSize: 14, fontWeight: 'bold', color: '#F97316' },
  stakesBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFF1F2', marginBottom: 12 },
  stakesEmoji: { fontSize: 12 },
  stakesText: { fontSize: 12, fontWeight: '500', color: '#BE123C' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0F172A' },
  submitButtonText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  completedButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: '#ECFDF5' },
  completedButtonText: { fontSize: 15, fontWeight: '600', color: '#059669' },
  leaderboardTab: { gap: 16 },
  timeframeSelector: { flexDirection: 'row', gap: 8 },
  timeframeButton: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center' },
  timeframeButtonActive: { backgroundColor: '#0F172A' },
  timeframeButtonText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  timeframeButtonTextActive: { color: '#FFFFFF' },
  podiumCard: { padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 12 },
  podiumPosition: { alignItems: 'center' },
  podiumPosition1: { marginTop: -16 },
  podiumAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 4, marginBottom: 8 },
  podiumAvatar1: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F97316', borderColor: '#FDE68A' },
  podiumAvatar2: { backgroundColor: '#94A3B8', borderColor: '#E2E8F0' },
  podiumAvatar3: { backgroundColor: '#FCD34D', borderColor: '#FDE68A' },
  podiumAvatarYou: { backgroundColor: '#8B5CF6', borderColor: '#C4B5FD' },
  podiumAvatarText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  podiumAvatarText1: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  podiumName: { fontSize: 13, fontWeight: '600', color: '#475569' },
  podiumName1: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  podiumNameYou: { color: '#7C3AED' },
  podiumXP: { fontSize: 11, color: '#64748B', marginTop: 2 },
  podiumXP1: { fontSize: 12, color: '#D97706', fontWeight: '500' },
  podiumStand: { marginTop: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center', justifyContent: 'center' },
  podiumStand1: { width: 96, height: 96, backgroundColor: '#FDE68A' },
  podiumStand2: { width: 80, height: 64, backgroundColor: '#E2E8F0' },
  podiumStand3: { width: 80, height: 48, backgroundColor: '#FEF3C7' },
  podiumStandYou: { backgroundColor: '#EDE9FE' },
  podiumNumber: { fontSize: 24, fontWeight: '900', color: '#94A3B8' },
  podiumNumber1: { fontSize: 32, color: '#B45309' },
  podiumNumberYou: { color: '#8B5CF6' },
  fullLeaderboard: { borderRadius: 16, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  leaderboardItemYou: { backgroundColor: '#F5F3FF' },
  leaderboardItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leaderboardItemRank: { width: 32, fontSize: 15, fontWeight: 'bold', color: '#94A3B8' },
  leaderboardItemAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#94A3B8', alignItems: 'center', justifyContent: 'center' },
  leaderboardItemAvatarYou: { backgroundColor: '#8B5CF6' },
  leaderboardItemAvatarText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  leaderboardItemName: { fontSize: 15, fontWeight: '600', color: '#334155' },
  leaderboardItemNameYou: { color: '#7C3AED' },
  leaderboardItemMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  leaderboardItemXP: { fontSize: 12, color: '#64748B' },
  leaderboardItemDot: { color: '#94A3B8' },
  leaderboardItemStreak: { fontSize: 12, color: '#F97316' },
  leaderboardItemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leaderboardItemWins: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  achievementsTab: { gap: 12 },
  achievementStats: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  achievementStat: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center' },
  achievementStatValue: { fontSize: 20, fontWeight: 'bold' },
  achievementStatLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },
  achievementCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  achievementCardLocked: { opacity: 0.7 },
  achievementIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  achievementIconUnlocked: { backgroundColor: '#FEF3C7' },
  achievementIconLocked: { backgroundColor: '#F1F5F9' },
  achievementInfo: { flex: 1, marginLeft: 16 },
  achievementTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  achievementName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  achievementNameLocked: { color: '#64748B' },
  achievementDescription: { fontSize: 12, color: '#64748B', marginTop: 2 },
  achievementProgress: { marginTop: 8 },
  achievementProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  achievementProgressText: { fontSize: 10, color: '#94A3B8' },
  achievementProgressBar: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  achievementProgressFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 3 },
  achievementXP: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  achievementXPUnlocked: { backgroundColor: '#ECFDF5' },
  achievementXPLocked: { backgroundColor: '#F1F5F9' },
  achievementXPText: { fontSize: 12, fontWeight: 'bold' },
  achievementXPTextUnlocked: { color: '#059669' },
  achievementXPTextLocked: { color: '#64748B' },
});
