import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Insight } from '../types';
import { getInsightColor } from '../utils';

interface InsightCardProps {
  insight: Insight;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const color = getInsightColor(insight.type);

  return (
    <Animated.View
      style={[
        styles.insightCard,
        insight.type === 'alert' && { borderLeftWidth: 4, borderLeftColor: '#FF3B30' },
        insight.type === 'warning' && { borderLeftWidth: 4, borderLeftColor: '#FF9500' },
      ]}
    >
      <View style={[styles.insightIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={insight.icon as any} size={24} color={color} />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightMessage}>{insight.message}</Text>
        {insight.actionLabel && insight.onAction && (
          <TouchableOpacity
            style={[styles.insightAction, { borderColor: color }]}
            onPress={insight.onAction}
          >
            <Text style={[styles.insightActionText, { color }]}>
              {insight.actionLabel}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={color} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};
