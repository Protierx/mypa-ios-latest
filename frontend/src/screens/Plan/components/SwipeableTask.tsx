import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Task } from '../types';
import { getCategoryAccent } from '../utils';
import { styles } from '../styles';

interface SwipeableTaskProps {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onFocus: () => void;
  onMoveTomorrow: () => void;
  isActive: boolean;
  isQuick: boolean;
  isHighlighted?: boolean;
}

export const SwipeableTask: React.FC<SwipeableTaskProps> = ({
  task,
  onComplete,
  onDelete,
  onEdit,
  onFocus,
  onMoveTomorrow,
  isActive,
  isQuick,
  isHighlighted,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  
  const handleDeletePress = () => {
    translateX.setValue(0);
    onDelete();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(Math.max(-80, Math.min(0, gesture.dx)));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -50) {
          Animated.spring(translateX, { toValue: -70, useNativeDriver: true }).start();
          return;
        }
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const accent = getCategoryAccent(task.category);

  return (
    <View style={styles.taskWrapper}>
      <TouchableOpacity
        style={[styles.swipeBgRight, { backgroundColor: '#EF4444' }]}
        onPress={handleDeletePress}
      >
        <Ionicons name="trash" size={18} color="#FFFFFF" />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.taskCard,
          task.completed && styles.taskCardCompleted,
          isActive && styles.taskCardActive,
          isHighlighted && styles.taskCardHighlighted,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.taskAccent, { backgroundColor: task.completed ? '#CBD5F5' : accent.bar }]} />
        <TouchableOpacity style={styles.taskContent} onPress={onEdit} activeOpacity={0.8}>
          <View style={styles.taskTimeBlock}>
            <Text style={[styles.taskTime, task.completed && styles.taskTimeCompleted]}>
              {task.time.replace(':00', '').replace(' ', '')}
            </Text>
          </View>

          {!task.completed && isQuick ? (
            <TouchableOpacity style={styles.quickCheck} onPress={onComplete}>
              <View style={styles.quickCheckInner} />
            </TouchableOpacity>
          ) : task.completed ? (
            <TouchableOpacity style={styles.completedCheck} onPress={onComplete}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.focusPlay, isActive && styles.focusPlayActive]} onPress={onFocus}>
              <Ionicons name={isActive ? 'pause' : 'play'} size={12} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <View style={styles.taskDetails}>
            <View style={styles.taskTitleRow}>
              <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]} numberOfLines={1}>
                {task.title}
              </Text>
              {task.priority === 'High' && !task.completed && (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>!</Text>
                </View>
              )}
            </View>
            <View style={styles.taskMetaRow}>
              <Feather name="clock" size={12} color="#94A3B8" />
              <Text style={styles.taskMetaText}>{task.duration}</Text>
              <Text style={styles.taskMetaDot}>•</Text>
              <View style={[styles.taskCategoryDot, { backgroundColor: accent.badge }]} />
              <Text style={[styles.taskMetaText, { color: accent.badge }]}>{task.category}</Text>
            </View>
          </View>
          
          {!task.completed && (
            <TouchableOpacity style={styles.tomorrowBtn} onPress={onMoveTomorrow}>
              <Ionicons name="arrow-forward" size={14} color="#64748B" />
              <Text style={styles.tomorrowText}>Tmrw</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};
