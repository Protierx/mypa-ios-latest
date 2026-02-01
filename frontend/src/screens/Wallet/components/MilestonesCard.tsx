import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Milestone } from '../types';
import { styles } from '../styles';

interface MilestonesCardProps {
  milestones: Milestone[];
  onMilestonePress: (milestone: Milestone) => void;
}

export const MilestonesCard: React.FC<MilestonesCardProps> = ({
  milestones,
  onMilestonePress,
}) => {
  const unlockedCount = milestones.filter(m => m.reached).length;
  
  return (
    <View style={styles.milestonesCard}>
      <BlurView intensity={40} tint="light" style={styles.milestonesBlur}>
        <View style={styles.milestonesHeader}>
          <Text style={styles.milestonesTitle}>Time Milestones</Text>
          <View style={styles.milestonesBadge}>
            <Text style={styles.milestonesBadgeText}>
              {unlockedCount}/{milestones.length} Unlocked
            </Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.milestonesScroll}
          snapToInterval={76}
          decelerationRate="fast"
        >
          {milestones.map(milestone => (
            <Pressable
              key={milestone.id}
              onPress={() => onMilestonePress(milestone)}
              style={[
                styles.milestoneItem,
                !milestone.reached && styles.milestoneItemLocked,
              ]}
            >
              <View
                style={[
                  styles.milestoneIcon,
                  milestone.reached
                    ? styles.milestoneIconReached
                    : styles.milestoneIconLocked,
                ]}
              >
                {milestone.reached ? (
                  <Text style={styles.milestoneEmoji}>{milestone.reward}</Text>
                ) : (
                  <>
                    <Text style={styles.milestoneLockEmoji}>🔒</Text>
                    {milestone.progress > 0 && (
                      <View
                        style={[
                          styles.milestoneProgress,
                          { height: `${milestone.progress}%` },
                        ]}
                      />
                    )}
                  </>
                )}
              </View>
              <Text style={styles.milestoneTitle}>{milestone.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </BlurView>
    </View>
  );
};
