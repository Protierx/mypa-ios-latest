import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { styles } from '../styles';
import { Task, TimeColors } from '../types';
import { getPriorityColor, getCategoryEmoji } from '../utils';

interface TodaysScheduleProps {
  pendingTasks: Task[];
  completedTasks: Task[];
  todaysTasks: Task[];
  colors: TimeColors;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

export const TodaysSchedule: React.FC<TodaysScheduleProps> = ({
  pendingTasks,
  completedTasks,
  todaysTasks,
  colors,
  fadeAnim,
  scaleAnim,
}) => {
  const navigation = useNavigation();

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
        <Ionicons name="calendar" size={20} color={colors.accent} />
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>
          Today's Schedule
        </Text>
        <Text style={styles.taskCount}>
          {completedTasks.length}/{todaysTasks.length} done
        </Text>
      </View>

      {pendingTasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>All Clear!</Text>
          <Text style={styles.emptyText}>
            You've completed all your tasks for today
          </Text>
        </View>
      ) : (
        <View style={styles.tasksCard}>
          {pendingTasks.slice(0, 5).map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <View
                style={[
                  styles.taskPriorityIndicator,
                  { backgroundColor: getPriorityColor(task.priority) },
                ]}
              />
              <Text style={styles.taskEmoji}>
                {getCategoryEmoji(task.category)}
              </Text>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {task.title}
                </Text>
                <Text style={styles.taskMeta}>
                  {task.time || 'Any time'} • {task.category}
                </Text>
              </View>
            </View>
          ))}
          {pendingTasks.length > 5 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Tasks' as never)}
            >
              <Text style={[styles.viewAllText, { color: colors.accent }]}>
                View all {pendingTasks.length} tasks
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
};
