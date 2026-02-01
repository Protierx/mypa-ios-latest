import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Milestone } from '../types';
import { styles } from '../styles';

interface MilestonesSectionProps {
  milestones: Milestone[];
  currentStreak: number;
}

export const MilestonesSection: React.FC<MilestonesSectionProps> = ({
  milestones,
  currentStreak,
}) => (
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
          <Text style={styles.milestoneDaysLeft}>{milestone.days - currentStreak}d left</Text>
        )}
      </View>
    ))}
  </View>
);
