import React from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { BriefingData, TimeColors } from '../types';

interface InsightsCardProps {
  briefing: BriefingData;
  colors: TimeColors;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

export const InsightsCard: React.FC<InsightsCardProps> = ({
  briefing,
  colors,
  fadeAnim,
  scaleAnim,
}) => {
  if (!briefing.insights || briefing.insights.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons name="sparkles" size={20} color={colors.accent} />
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>
          Today's Insights
        </Text>
      </View>
      <View style={styles.insightsCard}>
        {briefing.insights.map((insight, index) => (
          <View key={index} style={styles.insightRow}>
            <View style={[styles.insightDot, { backgroundColor: colors.accent }]} />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
        {briefing.tip && (
          <View style={[styles.tipContainer, { backgroundColor: `${colors.accent}15` }]}>
            <Ionicons name="bulb" size={18} color={colors.accent} />
            <Text style={[styles.tipText, { color: colors.accent }]}>
              {briefing.tip}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};
