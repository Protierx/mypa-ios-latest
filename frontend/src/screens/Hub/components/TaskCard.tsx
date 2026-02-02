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
import { LinearGradient } from 'expo-linear-gradient';
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
  switch (category?.toLowerCase()) {
    case 'work':
      return { 
        bg: '#3b82f6', 
        gradient: ['#3b82f6', '#2563eb'] as const,
        light: '#eff6ff', 
        text: '#1e40af',
        darkText: '#1e3a8a',
        border: '#bfdbfe',
        lightGradient: ['#eff6ff', '#dbeafe'] as const,
      };
    case 'health':
      return { 
        bg: '#10b981', 
        gradient: ['#10b981', '#059669'] as const,
        light: '#ecfdf5', 
        text: '#065f46',
        darkText: '#064e3b',
        border: '#a7f3d0',
        lightGradient: ['#ecfdf5', '#d1fae5'] as const,
      };
    case 'fitness':
      return { 
        bg: '#f59e0b', 
        gradient: ['#f59e0b', '#d97706'] as const,
        light: '#fef3c7', 
        text: '#92400e',
        darkText: '#78350f',
        border: '#fde68a',
        lightGradient: ['#fef3c7', '#fde68a'] as const,
      };
    default:
      return { 
        bg: '#8b5cf6', 
        gradient: ['#8b5cf6', '#7c3aed'] as const,
        light: '#f5f3ff', 
        text: '#5b21b6',
        darkText: '#4c1d95',
        border: '#ddd6fe',
        lightGradient: ['#f5f3ff', '#ede9fe'] as const,
      };
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
        styles.taskCardWrapper,
        pressed && !isCompleted && styles.cardWrapperPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${task.category}, ${task.time}, ${isCompleted ? 'completed' : 'not completed'}${isNextUp ? ', next up' : ''}`}
      accessibilityHint={isCompleted ? "Tap to view task details" : "Tap to mark as complete or view details"}
    >
      {isNextUp && !isCompleted ? (
        <LinearGradient
          colors={catStyle.lightGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.taskCard}
        >
          <View style={[styles.taskAccent, { backgroundColor: catStyle.bg }]} />
          <View style={styles.taskContent}>
            {/* Time */}
            <View style={styles.taskTimeContainer}>
              <Text style={[styles.taskTime, { color: catStyle.darkText }]}>
                {task.time.replace(':00', '').replace(' ', '')}
              </Text>
            </View>

            {/* Checkbox */}
            <Pressable
              onPress={onToggleComplete}
              style={[styles.checkbox, { borderColor: catStyle.bg, backgroundColor: '#fff' }]}
              accessibilityRole="checkbox"
              accessibilityLabel={`Mark task as ${isCompleted ? 'incomplete' : 'complete'}`}
              accessibilityState={{ checked: isCompleted }}
            >
              {isCompleted && <Check color="#fff" size={14} strokeWidth={3} />}
            </Pressable>

            {/* Task Info */}
            <View style={styles.taskInfo}>
              <View style={styles.taskTitleRow}>
                <Text style={[styles.taskTitle, { color: catStyle.darkText }]} numberOfLines={1}>
                  {task.title}
                </Text>
                {task.priority && !isCompleted && (
                  <View style={[styles.priorityBadge, { backgroundColor: catStyle.bg }]}>
                    <Text style={styles.priorityText}>!</Text>
                  </View>
                )}
              </View>
              <View style={styles.taskMeta}>
                <Clock color={catStyle.bg} size={12} />
                <Text style={[styles.taskDuration, { color: catStyle.text }]}>{task.duration}</Text>
                <Text style={[styles.taskDot, { color: catStyle.border }]}>·</Text>
                <Text style={[styles.taskCategory, { color: catStyle.bg, fontWeight: '600' }]}>
                  {task.category}
                </Text>
              </View>
            </View>

            {/* Action Button */}
            <LinearGradient
              colors={catStyle.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.taskPlayButton}
            >
              <Play color="#fff" size={16} style={{ marginLeft: 2 }} fill="#fff" />
            </LinearGradient>
          </View>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.taskCard,
            isCompleted ? styles.taskCompleted : styles.taskDefault,
          ]}
        >
          <View
            style={[
              styles.taskAccent,
              { backgroundColor: isCompleted ? '#cbd5e1' : catStyle.bg },
            ]}
          />

          <View style={styles.taskContent}>
            {/* Time */}
            <View style={styles.taskTimeContainer}>
              <Text
                style={[
                  styles.taskTime,
                  isCompleted && styles.taskTimeCompleted,
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
              ]}
              accessibilityRole="checkbox"
              accessibilityLabel={`Mark task as ${isCompleted ? 'incomplete' : 'complete'}`}
              accessibilityState={{ checked: isCompleted }}
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
              <ChevronRight color="#cbd5e1" size={20} />
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  taskCardWrapper: {
    marginHorizontal: 20,
    marginBottom: 14,
  },
  cardWrapperPressed: {
    opacity: 0.85,
  },
  taskCard: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  taskCompleted: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  taskDefault: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  taskAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  nextBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  nextBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    paddingLeft: 20,
    gap: 14,
  },
  taskTimeContainer: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: -0.3,
  },
  taskTimeCompleted: {
    color: '#cbd5e1',
  },
  checkbox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
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
    marginBottom: 5,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    letterSpacing: -0.2,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#cbd5e1',
    fontWeight: '500',
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskDuration: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  taskDot: {
    color: '#cbd5e1',
    fontSize: 10,
  },
  taskCategory: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  taskPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});
