import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, PanResponder, Linking } from 'react-native';
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
  const deleteOpacity = translateX.interpolate({
    inputRange: [-100, -60, 0],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });
  const deleteScale = translateX.interpolate({
    inputRange: [-100, -60, 0],
    outputRange: [1.1, 1, 0.8],
    extrapolate: 'clamp',
  });
  
  const handleDeletePress = () => {
    Animated.timing(translateX, {
      toValue: -400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDelete());
  };

  // Calendar events can't be swiped to delete
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => !task.isFromCalendar && Math.abs(gesture.dx) > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0 && !task.isFromCalendar) {
          translateX.setValue(Math.max(-100, gesture.dx));
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -60 && !task.isFromCalendar) {
          Animated.spring(translateX, { 
            toValue: -80, 
            useNativeDriver: true,
            friction: 8,
          }).start();
        } else {
          Animated.spring(translateX, { 
            toValue: 0, 
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const accent = task.isFromCalendar 
    ? { bar: '#3B82F6', badge: '#3B82F6', text: '#3B82F6' } // Blue for calendar
    : getCategoryAccent(task.category);
  const isHighPriority = task.priority === 'High' && !task.completed && !task.isFromCalendar;

  // Calendar events open the calendar app when tapped
  const handleCalendarPress = () => {
    Linking.openURL('calshow://');
  };

  // Calendar Event Card (different style)
  if (task.isFromCalendar) {
    return (
      <View style={styles.taskWrapper}>
        <TouchableOpacity 
          style={[
            styles.taskCard,
            styles.calendarEventCard,
          ]}
          onPress={handleCalendarPress}
          activeOpacity={0.7}
        >
          {/* Calendar accent bar */}
          <View style={[styles.taskAccent, { backgroundColor: '#3B82F6' }]} />
          
          <View style={styles.taskContent}>
            {/* Calendar icon */}
            <View style={styles.calendarIconWrap}>
              <Ionicons name="calendar" size={18} color="#3B82F6" />
            </View>

            {/* Event details */}
            <View style={styles.taskDetails}>
              <View style={styles.taskTitleRow}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {task.title}
                </Text>
                <View style={styles.calendarBadge}>
                  <Text style={styles.calendarBadgeText}>Calendar</Text>
                </View>
              </View>
              <View style={styles.taskMetaRow}>
                <Feather name="clock" size={11} color="#3B82F6" />
                <Text style={[styles.taskMetaText, { color: '#3B82F6' }]}>{task.time}</Text>
                <Text style={styles.taskMetaDot}>•</Text>
                <Text style={styles.taskMetaText}>{task.duration}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.taskWrapper}>
      {/* iOS-style delete background */}
      <Animated.View 
        style={[
          styles.swipeBgRight,
          { opacity: deleteOpacity, transform: [{ scale: deleteScale }] }
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeletePress}
          accessibilityRole="button"
          accessibilityLabel={`Delete task: ${task.title}`}
        >
          <Ionicons name="trash" size={22} color="#FFFFFF" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.taskCard,
          task.completed && styles.taskCardCompleted,
          isActive && styles.taskCardActive,
          isHighlighted && styles.taskCardHighlighted,
          isHighPriority && styles.taskCardHighPriority,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Priority indicator bar */}
        <View style={[
          styles.taskAccent, 
          { backgroundColor: task.completed ? '#CBD5E1' : isHighPriority ? '#EF4444' : accent.bar }
        ]} />
        
        <TouchableOpacity 
          style={styles.taskContent} 
          onPress={onEdit} 
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${task.title}, ${task.category}, ${task.duration}${isHighPriority ? ', high priority' : ''}${task.completed ? ', completed' : ''}`}
        >
          {/* Checkbox / Play button */}
          <View style={styles.taskCheckArea}>
            {task.completed ? (
              <TouchableOpacity 
                style={styles.completedCheck} 
                onPress={onComplete}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: true }}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : isQuick ? (
              <TouchableOpacity 
                style={[styles.quickCheck, isHighPriority && styles.quickCheckHighPriority]} 
                onPress={onComplete}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: false }}
              >
                <View style={styles.quickCheckInner} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.focusPlay, isActive && styles.focusPlayActive]} 
                onPress={onFocus}
                accessibilityRole="button"
                accessibilityLabel={isActive ? 'Pause' : 'Start focus'}
              >
                <Ionicons 
                  name={isActive ? 'pause' : 'play'} 
                  size={16} 
                  color="#FFFFFF" 
                  style={!isActive && { marginLeft: 2 }}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Task details */}
          <View style={styles.taskDetails}>
            <View style={styles.taskTitleRow}>
              <Text 
                style={[
                  styles.taskTitle, 
                  task.completed && styles.taskTitleCompleted,
                  isHighPriority && styles.taskTitleHighPriority,
                ]} 
                numberOfLines={1}
              >
                {task.title}
              </Text>
              {isHighPriority && (
                <View style={styles.priorityBadge}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                </View>
              )}
            </View>
            <View style={styles.taskMetaRow}>
              <Feather name="clock" size={11} color="#94A3B8" />
              <Text style={styles.taskMetaText}>{task.duration}</Text>
              <View style={[styles.taskCategoryDot, { backgroundColor: accent.badge }]} />
              <Text style={[styles.taskMetaText, { color: accent.badge }]}>{task.category}</Text>
              {task.time && (
                <>
                  <Text style={styles.taskMetaDot}>•</Text>
                  <Text style={styles.taskMetaText}>{task.time.replace(':00', '').replace(' ', '')}</Text>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};
