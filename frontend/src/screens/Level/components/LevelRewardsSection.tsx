import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LevelReward } from '../types';
import { styles } from '../styles';

interface LevelRewardsSectionProps {
  rewards: LevelReward[];
}

export const LevelRewardsSection: React.FC<LevelRewardsSectionProps> = ({
  rewards,
}) => {
  return (
    <View style={[styles.section, { marginBottom: 120 }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="gift" size={20} color="#EC4899" />
        <Text style={styles.sectionTitle}>Level Rewards</Text>
      </View>
      {rewards.map((reward, i) => (
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
            <Ionicons
              name={reward.icon as any}
              size={20}
              color={reward.unlocked ? reward.color : '#94A3B8'}
            />
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
          {!reward.unlocked && (
            <Ionicons name="lock-closed" size={16} color="#CBD5E1" />
          )}
        </View>
      ))}
    </View>
  );
};
