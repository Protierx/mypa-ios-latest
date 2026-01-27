import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

interface LevelScreenProps {
  navigation?: any;
}

export function LevelScreen({ navigation }: LevelScreenProps) {
  const levelData = {
    currentLevel: 12,
    currentXP: 2460,
    xpForCurrentLevel: 2200,
    xpForNextLevel: 2800,
    totalXPEarned: 24600,
    rank: 'Rising Star',
  };

  const xpProgress = ((levelData.currentXP - levelData.xpForCurrentLevel) / (levelData.xpForNextLevel - levelData.xpForCurrentLevel)) * 100;
  const xpToNext = levelData.xpForNextLevel - levelData.currentXP;

  const tiers = [
    { level: '1-5', name: 'Beginner', icon: 'sprout', color: '#10B981' },
    { level: '6-10', name: 'Explorer', icon: 'compass', color: '#06B6D4' },
    { level: '11-15', name: 'Rising Star', icon: 'star', color: '#8B5CF6', current: true },
    { level: '16-25', name: 'Champion', icon: 'trophy', color: '#F59E0B' },
    { level: '26-40', name: 'Master', icon: 'diamond-stone', color: '#EC4899' },
    { level: '41+', name: 'Legend', icon: 'crown', color: '#EAB308' },
  ];

  const recentXP = [
    { action: 'Completed Daily Tasks', xp: 150, time: '2h ago', icon: 'checkmark-circle', color: '#10B981' },
    { action: '7-Day Streak Bonus', xp: 100, time: '5h ago', icon: 'flame', color: '#F97316' },
    { action: 'Circle Challenge Won', xp: 250, time: 'Yesterday', icon: 'trophy', color: '#F59E0B' },
    { action: 'Morning Routine', xp: 75, time: 'Yesterday', icon: 'sunny', color: '#EC4899' },
    { action: 'First Task of Day', xp: 50, time: 'Yesterday', icon: 'flash', color: '#8B5CF6' },
  ];

  const levelRewards = [
    { level: 10, reward: 'Custom Themes', icon: 'color-palette', color: '#EC4899', unlocked: true },
    { level: 12, reward: 'Priority Support', icon: 'people', color: '#8B5CF6', unlocked: true, current: true },
    { level: 15, reward: 'Circle Leader Badge', icon: 'ribbon', color: '#F59E0B', unlocked: false },
    { level: 20, reward: 'Unlimited Circles', icon: 'infinite', color: '#3B82F6', unlocked: false },
    { level: 25, reward: 'VIP Status', icon: 'diamond', color: '#06B6D4', unlocked: false },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#475569" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Level</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mainCard}>
        <View style={styles.rankBadge}>
          <Ionicons name="star" size={14} color="#FFFFFF" />
          <Text style={styles.rankBadgeText}>{levelData.rank}</Text>
        </View>
        
        <View style={styles.levelDisplay}>
          <View style={styles.levelIconBox}>
            <Ionicons name="star" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.levelNumber}>{levelData.currentLevel}</Text>
        </View>
        <Text style={styles.levelLabel}>Level {levelData.currentLevel}</Text>
        
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelText}>{levelData.currentXP.toLocaleString()} XP</Text>
            <Text style={styles.progressLabelText}>{levelData.xpForNextLevel.toLocaleString()} XP</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${xpProgress}%` }]} />
          </View>
          <Text style={styles.xpToNext}>{xpToNext} XP to Level {levelData.currentLevel + 1}</Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total XP</Text>
            <Text style={styles.statValue}>{(levelData.totalXPEarned / 1000).toFixed(1)}K</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>This Week</Text>
            <Text style={styles.statValue}>+625</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Multiplier</Text>
            <Text style={styles.statValue}>1.5x</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trending-up" size={20} color="#8B5CF6" />
          <Text style={styles.sectionTitle}>Rank Progression</Text>
        </View>
        {tiers.map((tier, i) => (
          <View
            key={i}
            style={[
              styles.tierItem,
              tier.current && styles.tierItemCurrent,
              i < 2 && styles.tierItemCompleted,
              i > 2 && { opacity: 0.6 },
            ]}
          >
            <View style={[styles.tierIcon, tier.current && { backgroundColor: tier.color }]}>
              <MaterialCommunityIcons
                name={tier.icon as any}
                size={20}
                color={tier.current ? '#FFFFFF' : tier.color}
              />
            </View>
            <View style={styles.tierContent}>
              <View style={styles.tierHeader}>
                <Text style={styles.tierName}>{tier.name}</Text>
                {tier.current && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>YOU</Text>
                  </View>
                )}
                {i < 2 && <Ionicons name="checkmark" size={16} color="#10B981" />}
              </View>
              <Text style={styles.tierLevel}>Level {tier.level}</Text>
            </View>
            {i > 2 && <Ionicons name="lock-closed" size={16} color="#CBD5E1" />}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash" size={20} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Recent XP</Text>
          <Text style={styles.sectionSubtitle}>Last 7 days</Text>
        </View>
        {recentXP.map((item, i) => (
          <View key={i} style={styles.xpItem}>
            <View style={styles.xpItemIcon}>
              <Ionicons name={item.icon as any} size={16} color={item.color} />
            </View>
            <View style={styles.xpItemContent}>
              <Text style={styles.xpItemAction}>{item.action}</Text>
              <Text style={styles.xpItemTime}>{item.time}</Text>
            </View>
            <Text style={styles.xpItemValue}>+{item.xp}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.section, { marginBottom: 120 }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="gift" size={20} color="#EC4899" />
          <Text style={styles.sectionTitle}>Level Rewards</Text>
        </View>
        {levelRewards.map((reward, i) => (
          <View
            key={i}
            style={[
              styles.rewardItem,
              reward.current && styles.rewardItemCurrent,
              reward.unlocked && !reward.current && styles.rewardItemUnlocked,
              !reward.unlocked && { opacity: 0.6 },
            ]}
          >
            <View style={styles.rewardIcon}>
              <Ionicons name={reward.icon as any} size={20} color={reward.unlocked ? reward.color : '#94A3B8'} />
            </View>
            <View style={styles.rewardContent}>
              <Text style={styles.rewardName}>{reward.reward}</Text>
              <Text style={styles.rewardLevel}>Level {reward.level}</Text>
            </View>
            {reward.current && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
            {reward.unlocked && !reward.current && (
              <Text style={styles.unlockedText}>Unlocked</Text>
            )}
            {!reward.unlocked && <Ionicons name="lock-closed" size={16} color="#CBD5E1" />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  mainCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    marginBottom: 20,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  levelDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  levelIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  progressSection: {
    width: '100%',
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabelText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#FCD34D',
  },
  xpToNext: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  tierItemCurrent: {
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  tierItemCompleted: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  tierIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tierContent: {
    flex: 1,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  youBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tierLevel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  xpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  xpItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  xpItemContent: {
    flex: 1,
  },
  xpItemAction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  xpItemTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  xpItemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  rewardItemCurrent: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  rewardItemUnlocked: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rewardContent: {
    flex: 1,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  rewardLevel: {
    fontSize: 12,
    color: '#64748B',
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
});
