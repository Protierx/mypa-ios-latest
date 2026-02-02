import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDuration, isQuickTask } from '../utils';
import { Task } from '../types';
import { styles } from '../styles';

interface ProgressCardProps {
  todayTasks: Task[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  totalMinutes: number;
  completedMinutes: number;
  onNavigateSort: () => void;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  todayTasks,
  completedCount,
  totalCount,
  progressPercent,
  totalMinutes,
  completedMinutes,
  onNavigateSort,
}) => {
  const focusTasksCount = todayTasks.filter(t => !t.completed && !isQuickTask(t)).length;
  
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.progressLabel}>Today's Progress</Text>
          <Text style={styles.progressValue}>
            {completedCount}
            <Text style={styles.progressTotal}>/{totalCount}</Text>
            <Text style={styles.progressUnit}> tasks</Text>
          </Text>
        </View>
        <View style={styles.timeLeft}>
          <Text style={styles.timeLeftLabel}>Time left</Text>
          <Text style={styles.timeLeftValue}>{formatDuration(totalMinutes - completedMinutes)}</Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>
      <View style={styles.progressFooter}>
        <View style={styles.progressMeta}>
          <View style={[styles.progressDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.progressMetaText}>
            <Text style={styles.progressMetaStrong}>{formatDuration(completedMinutes)}</Text> done
          </Text>
        </View>
        <View style={styles.progressMeta}>
          <View style={[styles.progressDot, { backgroundColor: '#8B5CF6' }]} />
          <Text style={styles.progressMetaText}>
            <Text style={styles.progressMetaStrong}>{focusTasksCount}</Text> focus tasks
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.dumpBtn} 
          onPress={onNavigateSort}
          accessibilityRole="button"
          accessibilityLabel={`Brain dump, ${focusTasksCount} focus tasks pending`}
          accessibilityHint="Navigate to brain dump to organize tasks"
        >
          <MaterialCommunityIcons name="star-four-points-outline" size={14} color="#64748B" />
          <Text style={styles.dumpBtnText}>Dump</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
