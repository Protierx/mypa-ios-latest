import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

interface StreakScreenProps {
  navigation?: any;
}

export function StreakScreen({ navigation }: StreakScreenProps) {
  const streakData = {
    currentStreak: 7,
    longestStreak: 23,
    totalDaysActive: 89,
    xpMultiplier: 1.5,
    nextMilestone: 14,
    daysToMilestone: 7,
  };

  const today = new Date();
  const calendarDays = Array.from({ length: 28 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (27 - i));
    const isActive = i >= 21;
    const isToday = i === 27;
    return { date, isActive, isToday };
  });

  const milestones = [
    { days: 3, reward: '1.2x XP', icon: 'flame', color: '#F97316', achieved: true },
    { days: 7, reward: '1.5x XP', icon: 'flame', color: '#F97316', achieved: true, current: true },
    { days: 14, reward: '2x XP', icon: 'diamond-stone', color: '#06B6D4', achieved: false },
    { days: 30, reward: 'Streak Shield', icon: 'shield', color: '#3B82F6', achieved: false },
    { days: 60, reward: 'Gold Badge', icon: 'trophy', color: '#F59E0B', achieved: false },
    { days: 100, reward: 'Legend Status', icon: 'crown', color: '#EAB308', achieved: false },
  ];

  const streakBenefits = [
    { icon: 'flash', title: '1.5x XP Multiplier', desc: 'All tasks give 50% more XP', active: true },
    { icon: 'gift', title: 'Daily Bonus Chest', desc: 'Unlocks at 14 days', active: false },
    { icon: 'shield', title: 'Streak Shield', desc: 'Unlocks at 30 days', active: false },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#475569" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Streak</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mainCard}>
        <View style={styles.xpBadge}>
          <Ionicons name="flash" size={14} color="#FFFFFF" />
          <Text style={styles.xpBadgeText}>{streakData.xpMultiplier}x XP Active</Text>
        </View>
        
        <View style={styles.streakDisplay}>
          <View style={styles.streakIconBox}>
            <MaterialCommunityIcons name="fire" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
        </View>
        <Text style={styles.streakLabel}>Day Streak!</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Longest</Text>
            <Text style={styles.statValue}>{streakData.longestStreak}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Days</Text>
            <Text style={styles.statValue}>{streakData.totalDaysActive}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>To Next</Text>
            <Text style={styles.statValue}>{streakData.daysToMilestone}d</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={20} color="#F97316" />
          <Text style={styles.sectionTitle}>Activity This Month</Text>
        </View>
        <View style={styles.calendarGrid}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <Text key={i} style={styles.calendarDayLabel}>{day}</Text>
          ))}
          {calendarDays.map((day, i) => (
            <View
              key={i}
              style={[
                styles.calendarDay,
                day.isToday && styles.calendarDayToday,
                day.isActive && !day.isToday && styles.calendarDayActive,
              ]}
            >
              {day.isActive ? (
                <MaterialCommunityIcons name="fire" size={14} color={day.isToday ? '#FFFFFF' : '#F97316'} />
              ) : (
                <Text style={styles.calendarDayText}>{day.date.getDate()}</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={20} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Milestones</Text>
        </View>
        {milestones.map((milestone, i) => (
          <View
            key={i}
            style={[
              styles.milestoneItem,
              milestone.current && styles.milestoneItemCurrent,
              milestone.achieved && !milestone.current && styles.milestoneItemAchieved,
            ]}
          >
            <View style={[styles.milestoneIcon, milestone.achieved && { backgroundColor: '#FFFFFF' }]}>
              <MaterialCommunityIcons
                name={milestone.icon as any}
                size={20}
                color={milestone.achieved ? milestone.color : '#94A3B8'}
              />
            </View>
            <View style={styles.milestoneContent}>
              <View style={styles.milestoneHeader}>
                <Text style={[styles.milestoneDays, !milestone.achieved && { color: '#94A3B8' }]}>
                  {milestone.days} Day Streak
                </Text>
                {milestone.current && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>CURRENT</Text>
                  </View>
                )}
                {milestone.achieved && !milestone.current && (
                  <Ionicons name="checkmark" size={16} color="#10B981" />
                )}
              </View>
              <Text style={styles.milestoneReward}>Reward: {milestone.reward}</Text>
            </View>
            {!milestone.achieved && (
              <Text style={styles.milestoneDaysLeft}>{milestone.days - streakData.currentStreak}d left</Text>
            )}
          </View>
        ))}
      </View>

      <View style={[styles.section, { marginBottom: 120 }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="fire" size={20} color="#F97316" />
          <Text style={styles.sectionTitle}>Streak Benefits</Text>
        </View>
        {streakBenefits.map((benefit, i) => (
          <View key={i} style={[styles.benefitItem, !benefit.active && { opacity: 0.6 }]}>
            <View style={[styles.benefitIcon, benefit.active && styles.benefitIconActive]}>
              <Ionicons name={benefit.icon as any} size={20} color={benefit.active ? '#FFFFFF' : '#94A3B8'} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
              <Text style={styles.benefitDesc}>{benefit.desc}</Text>
            </View>
            {benefit.active && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ACTIVE</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7ED',
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
    backgroundColor: '#F97316',
    alignItems: 'center',
    marginBottom: 20,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  xpBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  streakDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  streakIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
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
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 8,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginBottom: 4,
  },
  calendarDayActive: {
    backgroundColor: '#FFEDD5',
  },
  calendarDayToday: {
    backgroundColor: '#F97316',
  },
  calendarDayText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  milestoneItemCurrent: {
    backgroundColor: '#FFEDD5',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  milestoneItemAchieved: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  milestoneDays: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#F97316',
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  milestoneReward: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  milestoneDaysLeft: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    marginBottom: 8,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitIconActive: {
    backgroundColor: '#F97316',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  benefitDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
});
