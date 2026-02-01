import React from 'react';
import { View, Text, Animated } from 'react-native';
import { styles } from '../styles';
import { Insight } from '../types';
import { InsightCard } from './InsightCard';

interface InsightsListProps {
  insights: Insight[];
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const InsightsList: React.FC<InsightsListProps> = ({
  insights,
  fadeAnim,
  slideAnim,
}) => {
  if (insights.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.sectionTitle}>INSIGHTS</Text>
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </Animated.View>
  );
};
