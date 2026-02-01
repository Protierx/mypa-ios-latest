import React from 'react';
import { View, Text } from 'react-native';
import { UserInsights } from '../types';
import { styles } from '../styles';

interface MilestonesProps {
  insights: UserInsights | null;
}

export const Milestones: React.FC<MilestonesProps> = ({ insights }) => {
  if (!insights?.recentMilestones?.length) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Recent Milestones</Text>
      {insights.recentMilestones.map((milestone, index) => (
        <View
          key={index}
          style={[
            styles.milestoneRow,
            index === insights.recentMilestones.length - 1 && {
              borderBottomWidth: 0,
            },
          ]}
        >
          <Text style={styles.milestoneText}>🏆 {milestone}</Text>
        </View>
      ))}
    </View>
  );
};
