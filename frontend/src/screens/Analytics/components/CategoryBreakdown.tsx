import React from 'react';
import { View, Text } from 'react-native';
import { WeeklyStats } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { styles } from '../styles';

interface CategoryBreakdownProps {
  weeklyStats: WeeklyStats | null;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  weeklyStats,
}) => {
  if (!weeklyStats?.categoryBreakdown?.length) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Category Breakdown</Text>
      {weeklyStats.categoryBreakdown.map((category, index) => (
        <View key={index} style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            <View
              style={[
                styles.categoryDot,
                {
                  backgroundColor:
                    CATEGORY_COLORS[category.category] || '#8B5CF6',
                },
              ]}
            />
            <Text style={styles.categoryName}>{category.category}</Text>
          </View>
          <View style={styles.categoryStats}>
            <View style={styles.categoryBarBackground}>
              <View
                style={[
                  styles.categoryBar,
                  {
                    width: `${category.percentage}%`,
                    backgroundColor:
                      CATEGORY_COLORS[category.category] || '#8B5CF6',
                  },
                ]}
              />
            </View>
            <Text style={styles.categoryCount}>{category.count}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};
