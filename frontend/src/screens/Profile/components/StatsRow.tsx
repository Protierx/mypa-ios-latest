import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StatConfig } from '../types';
import { styles } from '../styles';

interface StatsRowProps {
  stats: StatConfig[];
  onStatPress: (screen: string) => void;
}

export const StatsRow: React.FC<StatsRowProps> = ({
  stats,
  onStatPress,
}) => {
  return (
    <View style={styles.statsRow}>
      {stats.map((stat) => {
        const StatIcon = stat.icon;
        return (
          <Pressable
            key={stat.key}
            onPress={() => onStatPress(stat.screen)}
            style={({ pressed }) => [
              styles.statCard,
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${stat.label}: ${stat.value}`}
          >
            <StatIcon color={stat.color} size={20} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};
