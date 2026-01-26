import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../styles';

interface TaskSortingScreenProps {
  navigation?: any;
}

const sortOptions = [
  { id: 'priority', label: 'Priority', icon: 'flag' },
  { id: 'dueDate', label: 'Due Date', icon: 'calendar' },
  { id: 'category', label: 'Category', icon: 'folder' },
  { id: 'timeEstimate', label: 'Time Estimate', icon: 'time' },
];

const sampleTasks = [
  { id: '1', title: 'Review Q1 metrics', category: 'Work', priority: 'high', time: '15m', due: 'Today' },
  { id: '2', title: 'Gym Session', category: 'Health', priority: 'medium', time: '1h', due: 'Today' },
  { id: '3', title: 'Call Mom', category: 'Personal', priority: 'low', time: '15m', due: 'Tomorrow' },
  { id: '4', title: 'Project planning', category: 'Work', priority: 'high', time: '2h', due: 'This week' },
];

export function TaskSortingScreen({ navigation }: TaskSortingScreenProps) {
  const [activeSort, setActiveSort] = useState('priority');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.destructive;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.mutedForeground;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>Sort Tasks</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.sortOptions}>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.sortButton, activeSort === option.id && styles.sortButtonActive]}
            onPress={() => setActiveSort(option.id)}
          >
            <Ionicons 
              name={option.icon as any} 
              size={18} 
              color={activeSort === option.id ? colors.white : colors.mutedForeground} 
            />
            <Text style={[styles.sortLabel, activeSort === option.id && styles.sortLabelActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
        {sampleTasks.map((task) => (
          <TouchableOpacity key={task.id} style={styles.taskCard}>
            <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(task.priority) }]} />
            <View style={styles.taskContent}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <View style={styles.taskMeta}>
                <Text style={styles.taskCategory}>{task.category}</Text>
                <Text style={styles.taskTime}>{task.time}</Text>
                <Text style={styles.taskDue}>{task.due}</Text>
              </View>
            </View>
            <Ionicons name="reorder-three" size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  sortOptions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    ...shadows.sm,
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  sortLabelActive: {
    color: colors.white,
  },
  taskList: {
    flex: 1,
    paddingHorizontal: spacing.base,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  taskCategory: {
    fontSize: 12,
    color: colors.primary,
  },
  taskTime: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  taskDue: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
});

export default TaskSortingScreen;
