/**
 * TaskCard Component
 * Displays a single task in the Hub screen
 */
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Clock, Check, Play, ChevronRight, Briefcase, Heart, Home, Dumbbell, FileText } from 'lucide-react-native';

interface TaskCardProps {
  task: {
    id: string | number;
    title: string;
    time: string;
    category: string;
    duration: string;
    priority: boolean;
    completed: boolean;
  };
  isCompleted: boolean;
  isNextUp: boolean;
  onPress: () => void;
  onToggleComplete: () => void;
}

const getCategoryStyle = (category: string) => {
  switch (category) {
    case 'Work':
      return { bg: '#3b82f6', light: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
    case 'Health':
      return { bg: '#10b981', light: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
    default:
      return { bg: '#8b5cf6', light: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' };
  }
};

const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'work': return Briefcase;
    case 'health': return Heart;
    case 'personal': return Home;
    case 'fitness': return Dumbbell;
    default: return FileText;
  }
};

export function TaskCard({
  task,
  isCompleted,
  isNextUp,
  onPress,
  onToggleComplete,
}: TaskCardProps) {
  const catStyle = getCategoryStyle(task.category);
  const TaskIcon = getCategoryIcon(task.category);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.taskCard,
        isCompleted && styles.taskCompleted,
        isNextUp && { backgroundColor: catStyle.light, borderColor: catStyle.border, borderWidth: 1 },
        !isCompleted && !isNextUp && styles.taskDefault,
        pressed && !isCompleted && styles.cardPressed,
      ]}
    >
      {/* Category Accent Bar */}
      <View
        style={[
          styles.taskAccent,
          { backgroundColor: isCompleted ? '#cbd5e1' : catStyle.bg },
        ]}
      />

      {/* Next Up Badge */}
      {isNextUp && (
        <View style={[styles.nextBadge, { backgroundColor: catStyle.bg }]}>
          <Text style={styles.nextBadgeText}>Next</Text>
        </View>
      )}

      <View style={styles.taskContent}>
        {/* Time */}
        <View style={styles.taskTimeContainer}>
          <Text
            style={[
              styles.taskTime,
              isCompleted && styles.taskTimeCompleted,
              isNextUp && { color: catStyle.text },
            ]}
          >
            {task.time.replace(':00', '').replace(' ', '')}
          </Text>
        </View>

        {/* Checkbox */}
        <Pressable
          onPress={onToggleComplete}
          style={[
            styles.checkbox,
            isCompleted && styles.checkboxCompleted,
            !isCompleted && isNextUp && { borderColor: catStyle.text },
          ]}
        >
          {isCompleted && <Check color="#fff" size={14} strokeWidth={3} />}
        </Pressable>

        {/* Task Info */}
        <View style={styles.taskInfo}>
          <View style={styles.taskTitleRow}>
            <Text
              style={[
                styles.taskTitle,
                isCompleted && styles.taskTitleCompleted,
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            {task.priority && !isCompleted && (
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>!</Text>
              </View>
            )}
          </View>
          <View style={styles.taskMeta}>
            <Clock color="#94a3b8" size={12} />
            <Text style={styles.taskDuration}>{task.duration}</Text>
            <Text style={styles.taskDot}>·</Text>
            <Text style={[styles.taskCategory, { color: catStyle.text }]}>
              {task.category}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        {!isCompleted && (
          isNextUp ? (
            <View style={[styles.taskPlayButton, { backgroundColor: catStyle.bg }]}>
              <Play color="#fff" size={14} style={{ marginLeft: 2 }} fill="#fff" />
            </View>
          ) : (
            <ChevronRight color="#cbd5e1" size={20} />
          )
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  taskCompleted: {
    backgroundColor: '#f8fafc',
    opacity: 0.6,
  },
  taskDefault: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  taskAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  nextBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  nextBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingLeft: 16,
    gap: 12,
  },
  taskTimeContainer: {
    width: 48,
    alignItems: 'center',
  },
  taskTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  taskTimeCompleted: {
    color: '#94a3b8',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  taskInfo: {
    flex: 1,
    minWidth: 0,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  priorityBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  taskDuration: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  taskDot: {
    color: '#cbd5e1',
  },
  taskCategory: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
});
