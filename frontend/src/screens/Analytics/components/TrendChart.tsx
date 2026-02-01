import React from 'react';
import { View, Text } from 'react-native';
import { ProductivityTrends } from '../types';
import { Colors } from '../constants';
import { styles } from '../styles';

interface TrendChartProps {
  trends: ProductivityTrends | null;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TrendChart: React.FC<TrendChartProps> = ({ trends }) => {
  const maxTasks = Math.max(
    ...(trends?.last7Days.map((d) => d.tasksCompleted) ?? [1])
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>7-Day Trend</Text>
      <View style={styles.chartContainer}>
        {trends?.last7Days.map((day, index) => {
          const height = maxTasks > 0 
            ? (day.tasksCompleted / maxTasks) * 100 
            : 0;
          return (
            <View key={index} style={styles.chartBar}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${height}%`,
                      backgroundColor: Colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{DAYS[index]}</Text>
              <Text style={styles.barValue}>{day.tasksCompleted}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
