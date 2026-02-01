import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface StatsRowProps {
  pendingCount: number;
  completedCount: number;
  highPriorityCount: number;
}

export function StatsRow({ pendingCount, completedCount, highPriorityCount }: StatsRowProps) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <View style={[styles.statIconBg, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="hourglass-outline" size={18} color="#F59E0B" />
        </View>
        <Text style={styles.statValue}>{pendingCount}</Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
      <View style={styles.statCard}>
        <View style={[styles.statIconBg, { backgroundColor: '#ECFDF5' }]}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
        </View>
        <Text style={[styles.statValue, { color: '#10B981' }]}>{completedCount}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
      <View style={styles.statCard}>
        <View style={[styles.statIconBg, { backgroundColor: '#FEF2F2' }]}>
          <Ionicons name="alert-circle" size={18} color="#F43F5E" />
        </View>
        <Text style={[styles.statValue, { color: '#F43F5E' }]}>{highPriorityCount}</Text>
        <Text style={styles.statLabel}>High Priority</Text>
      </View>
    </View>
  );
}
