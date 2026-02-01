import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecentXPItem } from '../types';
import { styles } from '../styles';

interface RecentXPSectionProps {
  recentXP: RecentXPItem[];
}

export const RecentXPSection: React.FC<RecentXPSectionProps> = ({
  recentXP,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="flash" size={20} color="#F59E0B" />
        <Text style={styles.sectionTitle}>Recent XP</Text>
        <Text style={styles.sectionSubtitle}>Last 7 days</Text>
      </View>
      {recentXP.map((item, i) => (
        <View key={i} style={styles.xpItem}>
          <View style={styles.xpItemIcon}>
            <Ionicons name={item.icon as any} size={16} color={item.color} />
          </View>
          <View style={styles.xpItemContent}>
            <Text style={styles.xpItemAction}>{item.action}</Text>
            <Text style={styles.xpItemTime}>{item.time}</Text>
          </View>
          <Text style={styles.xpItemValue}>+{item.xp}</Text>
        </View>
      ))}
    </View>
  );
};
