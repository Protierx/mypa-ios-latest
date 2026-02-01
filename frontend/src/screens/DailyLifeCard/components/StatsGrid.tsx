import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DailyStat } from '../types';
import { styles } from '../styles';

interface StatsGridProps {
  stats: DailyStat[];
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => (
  <View style={styles.statsGrid}>
    {stats.map((stat) => (
      <View key={stat.id} style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
          <MaterialCommunityIcons name={stat.icon as any} size={22} color={stat.color} />
        </View>
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statLabel}>{stat.label}</Text>
      </View>
    ))}
  </View>
);
