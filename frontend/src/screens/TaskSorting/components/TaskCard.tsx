import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BrainDumpTask } from '../types';
import { Colors, categoryConfig, priorityConfig } from '../constants';
import { styles } from '../styles';

interface TaskCardProps {
  task: BrainDumpTask;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  checkAnim: Animated.Value;
  completingTaskId: string | null;
  showTaskMenu: string | null;
  onToggleStar: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onOpenAddToPlan: (task: BrainDumpTask) => void;
  onCategorize: (taskId: string) => void;
  onToggleMenu: (taskId: string | null) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  fadeAnim,
  slideAnim,
  checkAnim,
  completingTaskId,
  showTaskMenu,
  onToggleStar,
  onComplete,
  onDelete,
  onOpenAddToPlan,
  onCategorize,
  onToggleMenu,
}) => {
  const renderSourceIcon = (source: BrainDumpTask['source']) => {
    switch (source) {
      case 'voice': return <Feather name="mic" size={12} color={Colors.textMuted} />;
      case 'ai-chat': return <MaterialCommunityIcons name="robot" size={12} color={Colors.textMuted} />;
      default: return <Feather name="edit-3" size={12} color={Colors.textMuted} />;
    }
  };

  const renderCategoryBadge = (category?: BrainDumpTask['aiCategory']) => {
    if (!category) return null;
    const config = categoryConfig[category];
    return (
      <View style={[styles.badge, { backgroundColor: config.lightColor }]}>
        <MaterialCommunityIcons name={config.icon as any} size={12} color={config.color} />
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const renderPriorityBadge = (priority?: BrainDumpTask['aiPriority']) => {
    if (!priority || priority === 'normal' || priority === 'low') return null;
    const config = priorityConfig[priority];
    return (
      <View style={[styles.badge, { backgroundColor: config.color }]}>
        <Text style={[styles.badgeText, { color: config.textColor }]}>{config.label}</Text>
      </View>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.taskCard, 
        { 
          opacity: fadeAnim || 1, 
          transform: [{ translateY: slideAnim || 0 }] 
        }
      ]}
    >
      <TouchableOpacity 
        style={[styles.checkbox, completingTaskId === task.id && styles.checkboxCompleted]} 
        onPress={() => onComplete(task.id)}
      >
        {completingTaskId === task.id && (
          <Animated.View style={{ transform: [{ scale: checkAnim || 0 }] }}>
            <Feather name="check" size={14} color={Colors.white} />
          </Animated.View>
        )}
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={styles.taskActions}>
            <TouchableOpacity onPress={() => onToggleStar(task.id)}>
              <Ionicons 
                name={task.isStarred ? 'star' : 'star-outline'} 
                size={18} 
                color={task.isStarred ? Colors.warning : Colors.textMuted} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => onToggleMenu(showTaskMenu === task.id ? null : task.id)} 
              style={styles.moreButton}
            >
              <Feather name="more-vertical" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
        
        {showTaskMenu === task.id && (
          <View style={styles.taskMenu}>
            <TouchableOpacity style={styles.taskMenuItem} onPress={() => onOpenAddToPlan(task)}>
              <Feather name="calendar" size={16} color={Colors.success} />
              <Text style={styles.taskMenuItemText}>Add to Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.taskMenuItem} onPress={() => { onComplete(task.id); onToggleMenu(null); }}>
              <Feather name="check-circle" size={16} color={Colors.primary} />
              <Text style={styles.taskMenuItemText}>Mark Done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.taskMenuItem, { borderBottomWidth: 0 }]} onPress={() => onDelete(task.id)}>
              <Feather name="trash-2" size={16} color={Colors.danger} />
              <Text style={[styles.taskMenuItemText, { color: Colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.taskMeta}>
          {renderSourceIcon(task.source)}
          {task.status === 'unsorted' && (
            <View style={[styles.badge, { backgroundColor: Colors.warningLight }]}>
              <Text style={[styles.badgeText, { color: Colors.warning }]}>Unsorted</Text>
            </View>
          )}
          {renderCategoryBadge(task.aiCategory)}
          {renderPriorityBadge(task.aiPriority)}
          {task.estimatedTime && (
            <View style={[styles.badge, { backgroundColor: Colors.surface }]}>
              <Feather name="clock" size={10} color={Colors.textMuted} />
              <Text style={[styles.badgeText, { color: Colors.textSecondary }]}>{task.estimatedTime}</Text>
            </View>
          )}
          {task.isNew && (
            <View style={[styles.badge, { backgroundColor: Colors.primaryLight }]}>
              <Text style={[styles.badgeText, { color: Colors.primary }]}>NEW</Text>
            </View>
          )}
          <Text style={styles.taskTime}>{task.createdAt}</Text>
        </View>
        
        <View style={styles.taskButtons}>
          <TouchableOpacity style={styles.addToPlanButton} onPress={() => onOpenAddToPlan(task)}>
            <Feather name="calendar" size={14} color={Colors.success} />
            <Text style={styles.addToPlanButtonText}>Add to Plan</Text>
          </TouchableOpacity>
          {task.status === 'unsorted' && (
            <TouchableOpacity style={styles.categorizeButton} onPress={() => onCategorize(task.id)}>
              <MaterialCommunityIcons name="auto-fix" size={14} color={Colors.primary} />
              <Text style={styles.categorizeButtonText}>Categorize</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(task.id)}>
            <Feather name="trash-2" size={14} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};
