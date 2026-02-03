/**
 * GestureTasksView - Full-featured Tasks screen for Mylo
 * 
 * Features:
 * - Today/Tomorrow/Week/All filters
 * - Task cards with swipe actions (complete, delete)
 * - Add task modal with AI categorization
 * - Full calendar picker with navigation
 * - Time picker for scheduling
 * - AI auto-suggests category, priority, duration
 * - Pull to refresh
 * - Grouped by time of day
 * - Priority indicators
 * - Quick complete with animations
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../styles/colors';
import { tasksApi, aiApi } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Task {
  id: string;
  title: string;
  description?: string;
  date?: string;
  time?: string;
  dueDate?: string;
  dueTime?: string;
  category?: string;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  completed: boolean;
  durationMin?: number;
  tags?: string[];
}

type FilterType = 'today' | 'tomorrow' | 'week' | 'all';

interface GestureTasksViewProps {
  onBack?: () => void;
  navigation?: any;
}

// Category colors mapping
const CATEGORY_COLORS: Record<string, string> = {
  work: '#3B82F6',
  health: '#22C55E',
  fitness: '#F59E0B',
  personal: '#8B5CF6',
  errands: '#EC4899',
  learning: '#06B6D4',
  social: '#F97316',
  finance: '#10B981',
  wellness: '#A78BFA',
  creative: '#F43F5E',
};

// Priority colors
const PRIORITY_COLORS = {
  HIGH: '#EF4444',
  NORMAL: '#F59E0B',
  LOW: '#22C55E',
};

export function GestureTasksView({ onBack, navigation }: GestureTasksViewProps) {
  const insets = useSafeAreaInsets();
  
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('personal');
  const [newTaskPriority, setNewTaskPriority] = useState<'HIGH' | 'NORMAL' | 'LOW'>('NORMAL');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [estimatedDuration, setEstimatedDuration] = useState<number>(30);
  
  // AI Suggestion State
  const [aiSuggestions, setAiSuggestions] = useState<{
    category?: string;
    priority?: 'HIGH' | 'NORMAL' | 'LOW';
    suggestedDuration?: number;
    tags?: string[];
    confidence?: number;
  } | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const aiDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  
  // Animations
  const fadeAnims = useRef<Record<string, Animated.Value>>({}).current;
  const scaleAnims = useRef<Record<string, Animated.Value>>({}).current;
  
  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const response = await tasksApi.getAll();
      const fetchedTasks = response.data?.tasks || response.data?.data?.tasks || [];
      setTasks(fetchedTasks);
      
      // Initialize animations for each task
      fetchedTasks.forEach((task: Task) => {
        if (!fadeAnims[task.id]) {
          fadeAnims[task.id] = new Animated.Value(1);
          scaleAnims[task.id] = new Animated.Value(1);
        }
      });
    } catch (error) {
      console.log('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, [fetchTasks]);
  
  // AI Task Analysis - debounced to avoid too many API calls
  const analyzeTaskWithAI = useCallback(async (title: string) => {
    if (title.trim().length < 3) {
      setAiSuggestions(null);
      setShowAiSuggestions(false);
      return;
    }
    
    setIsAiAnalyzing(true);
    try {
      const response = await aiApi.categorizeTask(title);
      const data = response.data?.data || response.data;
      
      if (data) {
        setAiSuggestions({
          category: data.category?.toLowerCase(),
          priority: data.priority,
          suggestedDuration: data.suggestedDuration,
          tags: data.tags,
          confidence: data.confidence,
        });
        setShowAiSuggestions(true);
      }
    } catch (error) {
      console.log('AI categorization error:', error);
    } finally {
      setIsAiAnalyzing(false);
    }
  }, []);
  
  // Handle task title change with debounced AI analysis
  const handleTaskTitleChange = useCallback((text: string) => {
    setNewTaskTitle(text);
    
    // Clear previous timeout
    if (aiDebounceRef.current) {
      clearTimeout(aiDebounceRef.current);
    }
    
    // Debounce AI call - wait 800ms after user stops typing
    aiDebounceRef.current = setTimeout(() => {
      analyzeTaskWithAI(text);
    }, 800);
  }, [analyzeTaskWithAI]);
  
  // Accept AI suggestions
  const acceptAiSuggestions = useCallback(() => {
    if (aiSuggestions) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (aiSuggestions.category) setNewTaskCategory(aiSuggestions.category);
      if (aiSuggestions.priority) setNewTaskPriority(aiSuggestions.priority);
      if (aiSuggestions.suggestedDuration) setEstimatedDuration(aiSuggestions.suggestedDuration);
      setShowAiSuggestions(false);
    }
  }, [aiSuggestions]);
  
  // Calendar helpers
  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday
    
    const days: (number | null)[] = [];
    
    // Add empty slots for days before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, []);
  
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    Haptics.selectionAsync();
    setCalendarMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  }, []);
  
  const selectDate = useCallback((day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    setSelectedDate(newDate);
    setShowCalendar(false);
  }, [calendarMonth]);
  
  const isToday = useCallback((day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      calendarMonth.getMonth() === today.getMonth() &&
      calendarMonth.getFullYear() === today.getFullYear()
    );
  }, [calendarMonth]);
  
  const isSelected = useCallback((day: number) => {
    return (
      day === selectedDate.getDate() &&
      calendarMonth.getMonth() === selectedDate.getMonth() &&
      calendarMonth.getFullYear() === selectedDate.getFullYear()
    );
  }, [calendarMonth, selectedDate]);
  
  const isPastDate = useCallback((day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    return checkDate < today;
  }, [calendarMonth]);
  
  // Time picker options
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 6; h < 23; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);
  
  // Format date for display
  const formatSelectedDate = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    if (selected.getTime() === today.getTime()) return 'Today';
    if (selected.getTime() === tomorrow.getTime()) return 'Tomorrow';
    
    return selectedDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }, [selectedDate]);
  
  // Duration options
  const durationOptions = [15, 30, 45, 60, 90, 120];
  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  };
  
  // Filter tasks based on selected filter
  const getFilteredTasks = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return tasks.filter(task => {
      if (task.completed) return false;
      
      const taskDate = task.date || task.dueDate;
      if (!taskDate && activeFilter !== 'all') return activeFilter === 'today'; // Show undated in today
      
      const parsedDate = taskDate ? new Date(taskDate) : null;
      if (parsedDate) parsedDate.setHours(0, 0, 0, 0);
      
      switch (activeFilter) {
        case 'today':
          return !parsedDate || parsedDate.getTime() === today.getTime();
        case 'tomorrow':
          return parsedDate && parsedDate.getTime() === tomorrow.getTime();
        case 'week':
          return parsedDate && parsedDate >= today && parsedDate <= weekEnd;
        case 'all':
        default:
          return true;
      }
    });
  }, [tasks, activeFilter]);
  
  const filteredTasks = getFilteredTasks();
  
  // Group tasks by time of day
  const groupTasksByTime = useCallback((taskList: Task[]) => {
    const groups = {
      overdue: [] as Task[],
      morning: [] as Task[],
      afternoon: [] as Task[],
      evening: [] as Task[],
      anytime: [] as Task[],
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    taskList.forEach(task => {
      const taskTime = task.time || task.dueTime;
      const taskDate = task.date || task.dueDate;
      
      // Check if overdue
      if (taskDate) {
        const parsedDate = new Date(taskDate);
        parsedDate.setHours(0, 0, 0, 0);
        if (parsedDate < today) {
          groups.overdue.push(task);
          return;
        }
      }
      
      if (!taskTime) {
        groups.anytime.push(task);
        return;
      }
      
      const hour = parseInt(taskTime.split(':')[0]);
      if (hour >= 5 && hour < 12) {
        groups.morning.push(task);
      } else if (hour >= 12 && hour < 17) {
        groups.afternoon.push(task);
      } else {
        groups.evening.push(task);
      }
    });
    
    // Sort each group by time
    const sortByTime = (a: Task, b: Task) => {
      const timeA = a.time || a.dueTime || '99:99';
      const timeB = b.time || b.dueTime || '99:99';
      return timeA.localeCompare(timeB);
    };
    
    Object.keys(groups).forEach(key => {
      groups[key as keyof typeof groups].sort(sortByTime);
    });
    
    return groups;
  }, []);
  
  const groupedTasks = groupTasksByTime(filteredTasks);
  
  // Complete task with animation
  const handleCompleteTask = useCallback(async (taskId: string) => {
    setCompletingTaskId(taskId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Initialize animation if needed
    if (!fadeAnims[taskId]) {
      fadeAnims[taskId] = new Animated.Value(1);
      scaleAnims[taskId] = new Animated.Value(1);
    }
    
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnims[taskId], {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[taskId], {
        toValue: 0.8,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      try {
        await tasksApi.complete(taskId);
        setTasks(prev => prev.filter(t => t.id !== taskId));
      } catch (error) {
        console.log('Error completing task:', error);
        // Reset animation on error
        fadeAnims[taskId].setValue(1);
        scaleAnims[taskId].setValue(1);
      }
      setCompletingTaskId(null);
    });
  }, [fadeAnims, scaleAnims]);
  
  // Delete task
  const handleDeleteTask = useCallback(async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              await tasksApi.delete(taskId);
              setTasks(prev => prev.filter(t => t.id !== taskId));
            } catch (error) {
              console.log('Error deleting task:', error);
            }
          },
        },
      ]
    );
  }, []);
  
  // Create new task
  const handleCreateTask = useCallback(async () => {
    if (!newTaskTitle.trim()) return;
    
    setIsCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const taskData = {
        title: newTaskTitle.trim(),
        category: newTaskCategory,
        priority: newTaskPriority,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime || undefined,
        durationMin: estimatedDuration,
      };
      
      const response = await tasksApi.create(taskData);
      const newTask = response.data?.task || response.data?.data?.task || response.data;
      
      if (newTask) {
        // Initialize animation for new task
        fadeAnims[newTask.id] = new Animated.Value(0);
        scaleAnims[newTask.id] = new Animated.Value(0.8);
        
        setTasks(prev => [newTask, ...prev]);
        
        // Animate in
        Animated.parallel([
          Animated.timing(fadeAnims[newTask.id], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnims[newTask.id], {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start();
      }
      
      // Reset form
      setNewTaskTitle('');
      setNewTaskCategory('personal');
      setNewTaskPriority('NORMAL');
      setSelectedDate(new Date());
      setSelectedTime(null);
      setEstimatedDuration(30);
      setAiSuggestions(null);
      setShowAiSuggestions(false);
      setShowAddModal(false);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [newTaskTitle, newTaskCategory, newTaskPriority, selectedDate, selectedTime, estimatedDuration, fadeAnims, scaleAnims]);
  
  // Format time for display
  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  // Render task card
  const renderTaskCard = (task: Task) => {
    const categoryColor = CATEGORY_COLORS[task.category?.toLowerCase() || 'personal'] || colors.primary;
    const priorityColor = PRIORITY_COLORS[task.priority || 'NORMAL'];
    
    return (
      <Animated.View
        key={task.id}
        style={[
          styles.taskCard,
          {
            opacity: fadeAnims[task.id] || 1,
            transform: [{ scale: scaleAnims[task.id] || 1 }],
          },
        ]}
      >
        <Pressable
          style={styles.taskCardInner}
          onPress={() => handleCompleteTask(task.id)}
          onLongPress={() => handleDeleteTask(task.id)}
          android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
          {/* Checkbox */}
          <TouchableOpacity 
            style={[styles.checkbox, { borderColor: categoryColor }]}
            onPress={() => handleCompleteTask(task.id)}
            disabled={completingTaskId === task.id}
          >
            {completingTaskId === task.id && (
              <Ionicons name="checkmark" size={16} color={categoryColor} />
            )}
          </TouchableOpacity>
          
          {/* Content */}
          <View style={styles.taskContent}>
            <Text style={styles.taskTitle} numberOfLines={2}>
              {task.title}
            </Text>
            
            <View style={styles.taskMeta}>
              {/* Time */}
              {(task.time || task.dueTime) && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color="#A1A1AA" />
                  <Text style={styles.metaText}>{formatTime(task.time || task.dueTime)}</Text>
                </View>
              )}
              
              {/* Category */}
              {task.category && (
                <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
                  <Text style={[styles.categoryText, { color: categoryColor }]}>
                    {task.category}
                  </Text>
                </View>
              )}
              
              {/* Duration */}
              {task.durationMin && (
                <View style={styles.metaItem}>
                  <Ionicons name="hourglass-outline" size={12} color="#71717A" />
                  <Text style={styles.metaTextLight}>{task.durationMin}m</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Priority indicator */}
          {task.priority === 'HIGH' && (
            <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
              <Ionicons name="flag" size={14} color={priorityColor} />
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };
  
  // Render section header
  const renderSectionHeader = (title: string, icon: string, count: number, color?: string) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon as any} size={16} color={color || '#A1A1AA'} />
        <Text style={[styles.sectionTitle, color && { color }]}>{title}</Text>
      </View>
      <View style={styles.sectionCount}>
        <Text style={styles.sectionCountText}>{count}</Text>
      </View>
    </View>
  );
  
  const totalForFilter = filteredTasks.length;
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={28} color="#A1A1AA" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tasks</Text>
          <Text style={styles.headerSubtitle}>
            {totalForFilter} {totalForFilter === 1 ? 'task' : 'tasks'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.aiButton}
          onPress={() => navigation?.navigate?.('VoiceAssistant')}
        >
          <LinearGradient
            colors={['#7C3AED', '#A78BFA']}
            style={styles.aiButtonGradient}
          >
            <Ionicons name="sparkles" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {(['today', 'tomorrow', 'week', 'all'] as FilterType[]).map(filter => {
            const isActive = activeFilter === filter;
            const labels: Record<FilterType, string> = {
              today: 'Today',
              tomorrow: 'Tomorrow',
              week: 'This Week',
              all: 'All Tasks',
            };
            
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveFilter(filter);
                }}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {labels[filter]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      
      {/* Task List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#7C3AED"
          />
        }
      >
        {/* Overdue section */}
        {groupedTasks.overdue.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Overdue', 'alert-circle', groupedTasks.overdue.length, '#EF4444')}
            {groupedTasks.overdue.map(renderTaskCard)}
          </View>
        )}
        
        {/* Morning section */}
        {groupedTasks.morning.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Morning', 'sunny-outline', groupedTasks.morning.length)}
            {groupedTasks.morning.map(renderTaskCard)}
          </View>
        )}
        
        {/* Afternoon section */}
        {groupedTasks.afternoon.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Afternoon', 'partly-sunny-outline', groupedTasks.afternoon.length)}
            {groupedTasks.afternoon.map(renderTaskCard)}
          </View>
        )}
        
        {/* Evening section */}
        {groupedTasks.evening.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Evening', 'moon-outline', groupedTasks.evening.length)}
            {groupedTasks.evening.map(renderTaskCard)}
          </View>
        )}
        
        {/* Anytime section */}
        {groupedTasks.anytime.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Anytime', 'calendar-outline', groupedTasks.anytime.length)}
            {groupedTasks.anytime.map(renderTaskCard)}
          </View>
        )}
        
        {/* Empty state */}
        {filteredTasks.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#7C3AED" />
            </View>
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'today' 
                ? "You've completed all your tasks for today. Great job!"
                : "No tasks found for this filter."}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyButtonText}>Add a Task</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Bottom padding for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* FAB - Add Task */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAddModal(true);
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#7C3AED', '#A78BFA']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Add Task Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <Pressable 
            style={styles.modalBackdrop}
            onPress={() => setShowAddModal(false)}
          />
          
          <ScrollView 
            style={[styles.modalContent, { maxHeight: '90%' }]}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHandle} />
            
            <Text style={styles.modalTitle}>New Task</Text>
            
            {/* Task Title Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.taskInput}
                placeholder="What needs to be done?"
                placeholderTextColor="#71717A"
                value={newTaskTitle}
                onChangeText={handleTaskTitleChange}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreateTask}
              />
              {isAiAnalyzing && (
                <View style={styles.aiAnalyzingIndicator}>
                  <ActivityIndicator size="small" color="#7C3AED" />
                </View>
              )}
            </View>
            
            {/* AI Suggestions Banner */}
            {showAiSuggestions && aiSuggestions && (
              <View style={styles.aiSuggestionsBanner}>
                <View style={styles.aiSuggestionsHeader}>
                  <View style={styles.aiSuggestionsTitle}>
                    <Ionicons name="sparkles" size={16} color="#7C3AED" />
                    <Text style={styles.aiSuggestionsTitleText}>AI Suggestions</Text>
                    {aiSuggestions.confidence && (
                      <Text style={styles.aiConfidence}>
                        {Math.round(aiSuggestions.confidence * 100)}% confident
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => setShowAiSuggestions(false)}>
                    <Ionicons name="close" size={20} color="#71717A" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.aiSuggestionsChips}>
                  {aiSuggestions.category && (
                    <View style={[styles.aiChip, { backgroundColor: `${CATEGORY_COLORS[aiSuggestions.category] || '#7C3AED'}20` }]}>
                      <Text style={[styles.aiChipText, { color: CATEGORY_COLORS[aiSuggestions.category] || '#7C3AED' }]}>
                        {aiSuggestions.category.charAt(0).toUpperCase() + aiSuggestions.category.slice(1)}
                      </Text>
                    </View>
                  )}
                  {aiSuggestions.priority && (
                    <View style={[styles.aiChip, { backgroundColor: `${PRIORITY_COLORS[aiSuggestions.priority]}20` }]}>
                      <Ionicons name="flag" size={12} color={PRIORITY_COLORS[aiSuggestions.priority]} />
                      <Text style={[styles.aiChipText, { color: PRIORITY_COLORS[aiSuggestions.priority] }]}>
                        {aiSuggestions.priority}
                      </Text>
                    </View>
                  )}
                  {aiSuggestions.suggestedDuration && (
                    <View style={[styles.aiChip, { backgroundColor: 'rgba(124, 58, 237, 0.2)' }]}>
                      <Ionicons name="time-outline" size={12} color="#7C3AED" />
                      <Text style={[styles.aiChipText, { color: '#7C3AED' }]}>
                        ~{formatDuration(aiSuggestions.suggestedDuration)}
                      </Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity style={styles.acceptAiButton} onPress={acceptAiSuggestions}>
                  <Text style={styles.acceptAiButtonText}>Apply All Suggestions</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Date Selection */}
            <Text style={styles.inputLabel}>When</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <View style={styles.datePickerLeft}>
                <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
                <Text style={styles.datePickerText}>{formatSelectedDate()}</Text>
              </View>
              <Ionicons name={showCalendar ? "chevron-up" : "chevron-down"} size={20} color="#71717A" />
            </TouchableOpacity>
            
            {/* Calendar */}
            {showCalendar && (
              <View style={styles.calendarContainer}>
                {/* Month Navigation */}
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.calendarNavBtn}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthText}>
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                  <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.calendarNavBtn}>
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                {/* Day Headers */}
                <View style={styles.calendarWeekHeader}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
                  ))}
                </View>
                
                {/* Days Grid */}
                <View style={styles.calendarGrid}>
                  {getDaysInMonth(calendarMonth).map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarDay,
                        day !== null && isSelected(day) ? styles.calendarDaySelected : undefined,
                        day !== null && isToday(day) && !isSelected(day) ? styles.calendarDayToday : undefined,
                      ]}
                      onPress={() => day !== null && !isPastDate(day) && selectDate(day)}
                      disabled={day === null || isPastDate(day)}
                    >
                      {day !== null && (
                        <Text style={[
                          styles.calendarDayText,
                          isSelected(day) ? styles.calendarDayTextSelected : undefined,
                          isToday(day) && !isSelected(day) ? styles.calendarDayTextToday : undefined,
                          isPastDate(day) ? styles.calendarDayTextPast : undefined,
                        ]}>
                          {day}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Quick Date Options */}
                <View style={styles.quickDateOptions}>
                  <TouchableOpacity 
                    style={styles.quickDateBtn}
                    onPress={() => { setSelectedDate(new Date()); setShowCalendar(false); }}
                  >
                    <Text style={styles.quickDateText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickDateBtn}
                    onPress={() => { 
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setSelectedDate(tomorrow);
                      setShowCalendar(false);
                    }}
                  >
                    <Text style={styles.quickDateText}>Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.quickDateBtn}
                    onPress={() => { 
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      setSelectedDate(nextWeek);
                      setShowCalendar(false);
                    }}
                  >
                    <Text style={styles.quickDateText}>Next Week</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* Time Selection */}
            <Text style={styles.inputLabel}>Time (Optional)</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowTimePicker(!showTimePicker)}
            >
              <View style={styles.datePickerLeft}>
                <Ionicons name="time-outline" size={20} color="#7C3AED" />
                <Text style={styles.datePickerText}>
                  {selectedTime ? formatTime(selectedTime) : 'Anytime'}
                </Text>
              </View>
              {selectedTime && (
                <TouchableOpacity onPress={() => setSelectedTime(null)} style={styles.clearTimeBtn}>
                  <Ionicons name="close-circle" size={20} color="#71717A" />
                </TouchableOpacity>
              )}
              <Ionicons name={showTimePicker ? "chevron-up" : "chevron-down"} size={20} color="#71717A" />
            </TouchableOpacity>
            
            {/* Time Picker */}
            {showTimePicker && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.timePickerScroll}
                contentContainerStyle={styles.timePickerContent}
              >
                {timeSlots.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      selectedTime === time && styles.timeSlotSelected,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedTime(time);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      selectedTime === time && styles.timeSlotTextSelected,
                    ]}>
                      {formatTime(time)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            {/* Duration */}
            <Text style={styles.inputLabel}>Estimated Duration</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.durationScroll}
            >
              {durationOptions.map(mins => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.durationOption,
                    estimatedDuration === mins && styles.durationOptionActive,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setEstimatedDuration(mins);
                  }}
                >
                  <Text style={[
                    styles.durationOptionText,
                    estimatedDuration === mins && styles.durationOptionTextActive,
                  ]}>
                    {formatDuration(mins)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Priority */}
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.optionRow}>
              {(['LOW', 'NORMAL', 'HIGH'] as const).map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.optionButton,
                    newTaskPriority === priority && styles.optionButtonActive,
                    newTaskPriority === priority && { backgroundColor: `${PRIORITY_COLORS[priority]}20`, borderColor: PRIORITY_COLORS[priority] },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setNewTaskPriority(priority);
                  }}
                >
                  <Ionicons 
                    name="flag" 
                    size={14} 
                    color={newTaskPriority === priority ? PRIORITY_COLORS[priority] : '#71717A'} 
                  />
                  <Text style={[
                    styles.optionText,
                    newTaskPriority === priority && { color: PRIORITY_COLORS[priority] },
                  ]}>
                    {priority === 'LOW' ? 'Low' : priority === 'NORMAL' ? 'Normal' : 'High'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Category */}
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    newTaskCategory === cat && { backgroundColor: `${color}20`, borderColor: color },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setNewTaskCategory(cat);
                  }}
                >
                  <View style={[styles.categoryDot, { backgroundColor: color }]} />
                  <Text style={[
                    styles.categoryOptionText,
                    newTaskCategory === cat && { color },
                  ]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Create Button */}
            <TouchableOpacity
              style={[
                styles.createButton,
                (!newTaskTitle.trim() || isCreating) && styles.createButtonDisabled,
              ]}
              onPress={handleCreateTask}
              disabled={!newTaskTitle.trim() || isCreating}
            >
              <LinearGradient
                colors={newTaskTitle.trim() && !isCreating ? ['#7C3AED', '#A78BFA'] : ['#3F3F46', '#3F3F46']}
                style={styles.createButtonGradient}
              >
                {isCreating ? (
                  <Text style={styles.createButtonText}>Creating...</Text>
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.createButtonText}>Create Task</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    marginTop: 2,
  },
  aiButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#7C3AED',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  filterTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  taskCard: {
    marginBottom: 10,
  },
  taskCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 6,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  metaTextLight: {
    fontSize: 12,
    color: '#71717A',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  inputContainer: {
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    marginBottom: 20,
  },
  taskInput: {
    fontSize: 17,
    color: '#fff',
    padding: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A1A1AA',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: '#7C3AED',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  optionTextActive: {
    color: '#7C3AED',
  },
  categoryScroll: {
    marginBottom: 24,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // AI Suggestion styles
  aiAnalyzingIndicator: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  aiSuggestionsBanner: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  aiSuggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiSuggestionsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiSuggestionsTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  aiConfidence: {
    fontSize: 11,
    color: '#A1A1AA',
    marginLeft: 8,
  },
  aiSuggestionsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  aiChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  acceptAiButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptAiButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  // Date Picker styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  datePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  clearTimeBtn: {
    marginRight: 8,
  },
  // Calendar styles
  calendarContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarNavBtn: {
    padding: 8,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  calendarDaySelected: {
    backgroundColor: '#7C3AED',
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#7C3AED',
  },
  calendarDayTextPast: {
    color: '#3F3F46',
  },
  quickDateOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  quickDateBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    alignItems: 'center',
  },
  quickDateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  // Time Picker styles
  timePickerScroll: {
    marginBottom: 20,
  },
  timePickerContent: {
    gap: 8,
    paddingVertical: 4,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeSlotSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: '#7C3AED',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A1A1AA',
  },
  timeSlotTextSelected: {
    color: '#7C3AED',
  },
  // Duration styles
  durationScroll: {
    marginBottom: 20,
  },
  durationOption: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  durationOptionActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: '#7C3AED',
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  durationOptionTextActive: {
    color: '#7C3AED',
  },
});

export default GestureTasksView;
