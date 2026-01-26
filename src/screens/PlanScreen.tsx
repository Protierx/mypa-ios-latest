import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  Alert,
  Platform,
  PanResponder,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Glass card wrapper component
const GlassCard = ({ children, style, intensity = 80 }: { children: React.ReactNode; style?: any; intensity?: number }) => {
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={intensity} tint="light" style={[styles.glassCard, style]}>
        {children}
      </BlurView>
    );
  }
  return (
    <View style={[styles.glassCardAndroid, style]}>
      {children}
    </View>
  );
};

interface Task {
  id: string;
  time: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  color: string;
  iconName: string;
  duration: string;
  durationMin: number;
  priority: 'High' | 'Normal' | 'Low';
}

interface FocusStats {
  totalSessions: number;
  completedSessions: number;
  totalFocusMinutes: number;
  currentStreak: number;
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    Work: '#3B82F6',
    Health: '#10B981',
    Personal: '#8B5CF6',
    Learning: '#F59E0B',
    Finance: '#06B6D4',
    Wellness: '#EC4899',
    Creative: '#F97316',
  };
  return colors[category] || '#8B5CF6';
};

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    Work: 'briefcase',
    Health: 'fitness',
    Personal: 'person',
    Learning: 'book',
    Finance: 'wallet',
    Wellness: 'leaf',
    Creative: 'color-palette',
  };
  return icons[category] || 'ellipse';
};

const parseDuration = (dur: string): number => {
  if (dur.includes('h')) {
    const parts = dur.split('h');
    return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
  }
  return parseInt(dur) || 30;
};

const formatDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m === 0) return `${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const isQuickTask = (task: Task): boolean => {
  const quickCategories = ['Finance'];
  const quickKeywords = ['pay', 'reply', 'email', 'call', 'text', 'message', 'order', 'book', 'check', 'send'];
  const titleLower = task.title.toLowerCase();
  
  // Short duration tasks are quick
  if (task.durationMin <= 15) return true;
  
  // Finance tasks are usually quick
  if (quickCategories.includes(task.category)) return true;
  
  // Tasks with quick action keywords
  if (quickKeywords.some(kw => titleLower.includes(kw))) return true;
  
  // Low priority short tasks
  if (task.priority === 'Low' && task.durationMin <= 30) return true;
  
  return false;
};

// Determine if task needs focus (opposite of quick)
const isFocusTask = (task: Task): boolean => {
  // High priority tasks need focus
  if (task.priority === 'High') return true;
  
  // Long duration tasks need focus
  if (task.durationMin >= 45) return true;
  
  // Work and Learning categories typically need focus
  if (['Work', 'Learning', 'Creative'].includes(task.category) && task.durationMin >= 30) return true;
  
  // Deep work keywords
  const focusKeywords = ['deep work', 'focus', 'project', 'design', 'develop', 'write', 'create', 'study', 'review'];
  const titleLower = task.title.toLowerCase();
  if (focusKeywords.some(kw => titleLower.includes(kw))) return true;
  
  return !isQuickTask(task);
};

// Get time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', emoji: '☀️', period: 'morning' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '🌤️', period: 'afternoon' };
  if (hour < 21) return { text: 'Good Evening', emoji: '🌅', period: 'evening' };
  return { text: 'Good Night', emoji: '🌙', period: 'night' };
};

// Generate calendar days for current week
const generateWeekDays = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const days = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push({
      name: dayNames[i],
      date: date.getDate(),
      fullDate: date,
      isToday: date.toDateString() === today.toDateString()
    });
  }
  return days;
};

const initialTasks: Task[] = [
  { id: '1', time: '6:30 AM', title: 'Morning Routine', description: 'Meditation & stretching', category: 'Wellness', completed: true, color: '#8B5CF6', iconName: 'leaf', duration: '30m', durationMin: 30, priority: 'Normal' },
  { id: '2', time: '7:00 AM', title: 'Workout Session', description: '45 min strength training', category: 'Health', completed: true, color: '#10B981', iconName: 'fitness', duration: '45m', durationMin: 45, priority: 'High' },
  { id: '3', time: '8:30 AM', title: 'Breakfast', description: 'Healthy meal prep', category: 'Health', completed: true, color: '#10B981', iconName: 'nutrition', duration: '30m', durationMin: 30, priority: 'Normal' },
  { id: '4', time: '9:00 AM', title: 'Deep Work Block', description: 'Focus on project development', category: 'Work', completed: false, color: '#3B82F6', iconName: 'laptop', duration: '90m', durationMin: 90, priority: 'High' },
  { id: '5', time: '10:30 AM', title: 'Team Standup', description: 'Weekly sync-up meeting', category: 'Work', completed: false, color: '#3B82F6', iconName: 'people', duration: '30m', durationMin: 30, priority: 'Normal' },
  { id: '6', time: '12:00 PM', title: 'Lunch Break', description: 'Rest and recharge', category: 'Health', completed: false, color: '#10B981', iconName: 'restaurant', duration: '60m', durationMin: 60, priority: 'Normal' },
  { id: '7', time: '1:00 PM', title: 'Client Call', description: 'Project review meeting', category: 'Work', completed: false, color: '#3B82F6', iconName: 'videocam', duration: '45m', durationMin: 45, priority: 'High' },
  { id: '8', time: '3:00 PM', title: 'Creative Time', description: 'Design exploration', category: 'Creative', completed: false, color: '#F97316', iconName: 'color-palette', duration: '120m', durationMin: 120, priority: 'Normal' },
  { id: '9', time: '5:00 PM', title: 'Evening Walk', description: '30 min outdoor activity', category: 'Wellness', completed: false, color: '#8B5CF6', iconName: 'walk', duration: '30m', durationMin: 30, priority: 'Low' },
  { id: '10', time: '7:00 PM', title: 'Family Dinner', description: 'Quality time', category: 'Personal', completed: false, color: '#EC4899', iconName: 'heart', duration: '90m', durationMin: 90, priority: 'Normal' },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dates = [20, 21, 22, 23, 24, 25, 26];

export function PlanScreen() {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedDay, setSelectedDay] = useState(() => {
    const weekDays = generateWeekDays();
    return weekDays.findIndex(d => d.isToday);
  });
  const [weekDays] = useState(generateWeekDays);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Timer state
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Focus stats
  const [focusStats, setFocusStats] = useState<FocusStats>({
    totalSessions: 12,
    completedSessions: 9,
    totalFocusMinutes: 340,
    currentStreak: 5,
  });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showFocusComplete, setShowFocusComplete] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState<{ task: Task | null; duration: number; streak: number }>({ task: null, duration: 0, streak: 0 });
  
  // New task form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newDuration, setNewDuration] = useState('30m');
  const [newPriority, setNewPriority] = useState<'High' | 'Normal' | 'Low'>('Normal');
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newDescription, setNewDescription] = useState('');
  
  // Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.9)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  
  const greeting = getGreeting();
  
  // Timer effect
  useEffect(() => {
    if (activeTimerId !== null && isRecording) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTimerId, isRecording]);
  
  // Pulse animation for active timer
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);
  
  // Modal animation
  const openModal = (type: 'add' | 'edit', task?: Task) => {
    // Reset animation values first
    modalScaleAnim.setValue(0.9);
    modalOpacityAnim.setValue(0);
    
    if (type === 'edit' && task) {
      openEditModal(task);
    } else {
      // Reset form for new task
      setNewTitle('');
      setNewDescription('');
      setNewCategory('Personal');
      setNewDuration('30m');
      setNewPriority('Normal');
      setNewTime('10:00 AM');
      setShowAddModal(true);
    }
    
    // Trigger opening animation
    Animated.parallel([
      Animated.spring(modalScaleAnim, { toValue: 1, tension: 65, friction: 10, useNativeDriver: true }),
      Animated.timing(modalOpacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };
  
  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalScaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
      Animated.timing(modalOpacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setShowAddModal(false);
      setEditingTask(null);
      setNewTitle('');
      setNewDescription('');
      setNewCategory('Personal');
      setNewDuration('30m');
      setNewPriority('Normal');
      setNewTime('10:00 AM');
    });
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    if (activeTimerId === id) {
      stopTimer(true);
    }
  };
  
  const deleteTask = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: () => {
          setTasks(tasks.filter(t => t.id !== id));
          if (activeTimerId === id) {
            stopTimer(true);
          }
        }
      },
    ]);
  };
  
  const startTimer = (taskId: string) => {
    if (activeTimerId && activeTimerId !== taskId) {
      setShowAbandonConfirm(true);
      return;
    }
    setActiveTimerId(taskId);
    setElapsedSeconds(0);
    setIsRecording(true);
  };
  
  const pauseTimer = () => {
    setIsRecording(false);
  };
  
  const resumeTimer = () => {
    setIsRecording(true);
  };
  
  const stopTimer = (confirmed = false) => {
    if (!confirmed && elapsedSeconds > 30) {
      setShowAbandonConfirm(true);
      return;
    }
    
    if (elapsedSeconds >= 60) {
      setFocusStats(prev => ({
        ...prev,
        totalSessions: prev.totalSessions + 1,
        totalFocusMinutes: prev.totalFocusMinutes + Math.round(elapsedSeconds / 60),
      }));
    }
    
    setActiveTimerId(null);
    setElapsedSeconds(0);
    setIsRecording(false);
    setShowAbandonConfirm(false);
  };
  
  const completeTimedTask = () => {
    if (!activeTimerId) return;
    
    const completedTask = tasks.find(t => t.id === activeTimerId);
    const newStreak = focusStats.currentStreak + 1;
    
    setTasks(tasks.map(task => 
      task.id === activeTimerId ? { ...task, completed: true } : task
    ));
    
    setFocusStats(prev => ({
      ...prev,
      totalSessions: prev.totalSessions + 1,
      completedSessions: prev.completedSessions + 1,
      totalFocusMinutes: prev.totalFocusMinutes + Math.round(elapsedSeconds / 60),
      currentStreak: newStreak,
    }));
    
    // Store session data for the completion modal
    setCompletedSessionData({
      task: completedTask || null,
      duration: elapsedSeconds,
      streak: newStreak,
    });
    
    setActiveTimerId(null);
    setElapsedSeconds(0);
    setIsRecording(false);
    
    // Show celebration modal with animation
    setShowFocusComplete(true);
    celebrationAnim.setValue(0);
    confettiAnim.setValue(0);
    
    Animated.sequence([
      Animated.spring(celebrationAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(confettiAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  };
  
  const closeCelebration = () => {
    Animated.timing(celebrationAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setShowFocusComplete(false);
    });
  };
  
  const addTask = () => {
    if (!newTitle.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      time: newTime,
      title: newTitle.trim(),
      description: newDescription.trim() || 'New task',
      category: newCategory,
      completed: false,
      color: getCategoryColor(newCategory),
      iconName: getCategoryIcon(newCategory),
      duration: newDuration,
      durationMin: parseDuration(newDuration),
      priority: newPriority,
    };
    
    setTasks([...tasks, newTask].sort((a, b) => {
      const timeA = new Date(`2024-01-01 ${a.time}`).getTime();
      const timeB = new Date(`2024-01-01 ${b.time}`).getTime();
      return timeA - timeB;
    }));
    
    closeModal();
  };
  
  const saveEditedTask = () => {
    if (!editingTask || !newTitle.trim()) return;
    
    setTasks(tasks.map(t => 
      t.id === editingTask.id 
        ? {
            ...t,
            title: newTitle.trim(),
            description: newDescription.trim() || t.description,
            category: newCategory,
            color: getCategoryColor(newCategory),
            iconName: getCategoryIcon(newCategory),
            duration: newDuration,
            durationMin: parseDuration(newDuration),
            priority: newPriority,
            time: newTime,
          }
        : t
    ).sort((a, b) => {
      const timeA = new Date(`2024-01-01 ${a.time}`).getTime();
      const timeB = new Date(`2024-01-01 ${b.time}`).getTime();
      return timeA - timeB;
    }));
    
    closeModal();
  };
  
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewDescription(task.description);
    setNewCategory(task.category);
    setNewDuration(task.duration);
    setNewPriority(task.priority);
    setNewTime(task.time);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;
  const totalMinutes = tasks.reduce((sum, t) => sum + t.durationMin, 0);
  const completedMinutes = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.durationMin, 0);
  const focusTasksCount = tasks.filter(t => !t.completed && isFocusTask(t)).length;
  const quickTasksCount = tasks.filter(t => !t.completed && isQuickTask(t)).length;
  const highPriorityCount = tasks.filter(t => !t.completed && t.priority === 'High').length;
  const nextTask = tasks.find(t => !t.completed);
  const nextFocusTask = tasks.find(t => !t.completed && isFocusTask(t));
  const activeTask = tasks.find(t => t.id === activeTimerId);

  // Animate progress bar
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 50,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const renderIcon = (iconName: string, size: number, color: string) => {
    switch (iconName) {
      case 'leaf':
        return <Ionicons name="leaf" size={size} color={color} />;
      case 'fitness':
        return <Ionicons name="fitness" size={size} color={color} />;
      case 'nutrition':
        return <Ionicons name="nutrition" size={size} color={color} />;
      case 'laptop':
        return <Ionicons name="laptop" size={size} color={color} />;
      case 'people':
        return <Ionicons name="people" size={size} color={color} />;
      case 'restaurant':
        return <Ionicons name="restaurant" size={size} color={color} />;
      case 'videocam':
        return <Ionicons name="videocam" size={size} color={color} />;
      case 'color-palette':
        return <Ionicons name="color-palette" size={size} color={color} />;
      case 'walk':
        return <MaterialCommunityIcons name="walk" size={size} color={color} />;
      case 'heart':
        return <Ionicons name="heart" size={size} color={color} />;
      case 'briefcase':
        return <Ionicons name="briefcase" size={size} color={color} />;
      case 'book':
        return <Ionicons name="book" size={size} color={color} />;
      case 'wallet':
        return <Ionicons name="wallet" size={size} color={color} />;
      case 'person':
        return <Ionicons name="person" size={size} color={color} />;
      default:
        return <Ionicons name="ellipse" size={size} color={color} />;
    }
  };
  
  // Focus Timer Card Component
  const renderFocusTimer = () => {
    if (!activeTimerId || !activeTask) return null;
    
    const taskDurationSec = activeTask.durationMin * 60;
    const progressPct = Math.min((elapsedSeconds / taskDurationSec) * 100, 100);
    const remainingSec = Math.max(taskDurationSec - elapsedSeconds, 0);
    const isOvertime = elapsedSeconds > taskDurationSec;
    
    const getMotivationalMessage = () => {
      if (isOvertime) return { text: 'Overtime! Wrap it up', emoji: '🔥' };
      if (progressPct >= 90) return { text: 'Almost there!', emoji: '🏁' };
      if (progressPct >= 75) return { text: 'Final stretch!', emoji: '💪' };
      if (progressPct >= 50) return { text: 'Halfway done!', emoji: '⭐' };
      if (progressPct >= 25) return { text: 'Great momentum!', emoji: '🚀' };
      return { text: 'Stay focused', emoji: '🧘' };
    };
    const motivation = getMotivationalMessage();
    
    const size = 140;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progressPct / 100) * circumference;
    
    return (
      <View style={[styles.focusTimerCard, isOvertime && styles.focusTimerOvertime]}>
        {/* Header */}
        <View style={styles.focusTimerHeader}>
          <View style={styles.focusTimerStatus}>
            <Animated.View style={[
              styles.focusTimerDot, 
              isRecording && styles.focusTimerDotActive,
              { transform: [{ scale: pulseAnim }] }
            ]} />
            <Text style={styles.focusTimerStatusText}>
              {isRecording ? 'FOCUS SESSION' : 'PAUSED'}
            </Text>
          </View>
          <View style={styles.focusTimerMotivation}>
            {focusStats.currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <Text>🔥</Text>
                <Text style={styles.streakText}>{focusStats.currentStreak}</Text>
              </View>
            )}
            <Text style={styles.motivationEmoji}>{motivation.emoji}</Text>
            <Text style={styles.motivationText}>{motivation.text}</Text>
          </View>
        </View>
        
        {/* Task Title */}
        <Text style={styles.focusTaskTitle} numberOfLines={1}>{activeTask.title}</Text>
        
        {/* Progress Ring */}
        <View style={styles.progressRingContainer}>
          <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isOvertime ? '#FBBF24' : '#FFFFFF'}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </Svg>
          <View style={styles.progressRingCenter}>
            <Text style={styles.progressRingLabel}>
              {isOvertime ? 'OVERTIME' : 'REMAINING'}
            </Text>
            <Text style={[styles.progressRingTime, isOvertime && styles.progressRingTimeOvertime]}>
              {isOvertime ? '+' : ''}{formatTimer(isOvertime ? elapsedSeconds - taskDurationSec : remainingSec)}
            </Text>
          </View>
        </View>
        
        {/* Time Stats */}
        <View style={styles.focusTimerStats}>
          <View style={styles.focusTimerStat}>
            <Text style={styles.focusTimerStatLabel}>Elapsed</Text>
            <Text style={styles.focusTimerStatValue}>{formatTimer(elapsedSeconds)}</Text>
          </View>
          <View style={styles.focusTimerStatDivider} />
          <View style={styles.focusTimerStat}>
            <Text style={styles.focusTimerStatLabel}>Target</Text>
            <Text style={styles.focusTimerStatValue}>{activeTask.duration}</Text>
          </View>
          <View style={styles.focusTimerStatDivider} />
          <View style={styles.focusTimerStat}>
            <Text style={styles.focusTimerStatLabel}>Progress</Text>
            <Text style={styles.focusTimerStatValue}>{Math.round(progressPct)}%</Text>
          </View>
        </View>
        
        {/* Milestone Badges */}
        <View style={styles.milestoneBadges}>
          {[25, 50, 75, 100].map((pct) => (
            <View
              key={pct}
              style={[
                styles.milestoneBadge,
                progressPct >= pct && styles.milestoneBadgeReached
              ]}
            >
              <Text style={[
                styles.milestoneBadgeText,
                progressPct >= pct && styles.milestoneBadgeTextReached
              ]}>
                {pct === 100 ? '✓' : `${pct}%`}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Control Buttons */}
        <View style={styles.focusTimerControls}>
          <TouchableOpacity 
            style={styles.focusControlButton}
            onPress={() => stopTimer(false)}
          >
            <Ionicons name="stop" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.focusControlButtonMain}
            onPress={isRecording ? pauseTimer : resumeTimer}
          >
            <Ionicons 
              name={isRecording ? 'pause' : 'play'} 
              size={28} 
              color={isOvertime ? '#F97316' : '#10B981'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.focusControlButton}
            onPress={completeTimedTask}
          >
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Ready to Focus Card
  const renderReadyToFocus = () => {
    if (activeTimerId || !nextFocusTask) return null;
    
    return (
      <View style={styles.readyToFocusCard}>
        <View style={styles.readyToFocusGlow} />
        <TouchableOpacity 
          style={styles.readyToFocusPlayButton}
          onPress={() => startTimer(nextFocusTask.id)}
        >
          <Ionicons name="play" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.readyToFocusInfo}>
          <Text style={styles.readyToFocusLabel}>READY TO FOCUS</Text>
          <Text style={styles.readyToFocusTitle} numberOfLines={1}>{nextFocusTask.title}</Text>
          <View style={styles.readyToFocusMeta}>
            <View style={styles.readyToFocusMetaItem}>
              <Ionicons name="time-outline" size={12} color="#94A3B8" />
              <Text style={styles.readyToFocusTime}>{nextFocusTask.time}</Text>
            </View>
            <View style={styles.readyToFocusMetaDot} />
            <View style={styles.readyToFocusMetaItem}>
              <Ionicons name="hourglass-outline" size={12} color="#94A3B8" />
              <Text style={styles.readyToFocusTime}>{nextFocusTask.duration}</Text>
            </View>
            {nextFocusTask.priority === 'High' && (
              <>
                <View style={styles.readyToFocusMetaDot} />
                <View style={[styles.readyToFocusMetaItem, styles.readyToFocusPriority]}>
                  <Ionicons name="flag" size={10} color="#F59E0B" />
                  <Text style={styles.readyToFocusPriorityText}>Priority</Text>
                </View>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.readyToFocusCheck}
          onPress={() => toggleTask(nextFocusTask.id)}
        >
          <Ionicons name="checkmark" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
    );
  };
  
  // Task Form Modal - Glass Style
  const renderTaskModal = () => {
    const isEditing = !!editingTask;
    const categories = ['Work', 'Health', 'Personal', 'Learning', 'Finance', 'Wellness', 'Creative'];
    const durations = ['15m', '30m', '45m', '1h', '90m', '2h', '3h'];
    const priorities: ('High' | 'Normal' | 'Low')[] = ['High', 'Normal', 'Low'];
    const times = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'];
    
    const needsFocus = newDuration && (parseDuration(newDuration) >= 45 || newPriority === 'High' || ['Work', 'Learning', 'Creative'].includes(newCategory));
    
    return (
      <Modal
        visible={showAddModal || !!editingTask}
        animationType="fade"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeModal} />
          <Animated.View style={[
            styles.modalContainer,
            {
              transform: [{ scale: modalScaleAnim }],
              opacity: modalOpacityAnim,
            }
          ]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: isEditing ? '#3B82F6' : '#8B5CF6' }]}>
                  <Ionicons name={isEditing ? 'create' : 'add'} size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.modalTitle}>{isEditing ? 'Edit Task' : 'New Task'}</Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {/* Focus Indicator */}
            {needsFocus && (
              <View style={styles.focusIndicator}>
                <MaterialCommunityIcons name="timer-outline" size={16} color="#F59E0B" />
                <Text style={styles.focusIndicatorText}>This task will need a focus session</Text>
              </View>
            )}
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Title */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>What do you need to do?</Text>
                <TextInput
                  style={styles.formInputLarge}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Enter task title..."
                  placeholderTextColor="#94A3B8"
                  autoFocus={!isEditing}
                />
              </View>
              
              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Details (optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="Add more context..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              {/* Time */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  <Ionicons name="time-outline" size={14} color="#64748B" /> When?
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipGroup}>
                    {times.map(time => (
                      <TouchableOpacity
                        key={time}
                        style={[styles.chipTime, newTime === time && styles.chipTimeSelected]}
                        onPress={() => setNewTime(time)}
                      >
                        <Text style={[styles.chipTimeText, newTime === time && styles.chipTimeTextSelected]}>{time}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* Duration */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  <Ionicons name="hourglass-outline" size={14} color="#64748B" /> How long?
                </Text>
                <View style={styles.chipGroupWrap}>
                  {durations.map(dur => (
                    <TouchableOpacity
                      key={dur}
                      style={[styles.chipDuration, newDuration === dur && styles.chipDurationSelected]}
                      onPress={() => setNewDuration(dur)}
                    >
                      <Text style={[styles.chipDurationText, newDuration === dur && styles.chipDurationTextSelected]}>{dur}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  <Ionicons name="folder-outline" size={14} color="#64748B" /> Category
                </Text>
                <View style={styles.chipGroupWrap}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.chipCategory, 
                        newCategory === cat && { backgroundColor: getCategoryColor(cat), borderColor: getCategoryColor(cat) }
                      ]}
                      onPress={() => setNewCategory(cat)}
                    >
                      <View style={[styles.chipCategoryDot, { backgroundColor: getCategoryColor(cat) }, newCategory === cat && { backgroundColor: '#FFFFFF' }]} />
                      <Text style={[styles.chipCategoryText, newCategory === cat && styles.chipCategoryTextSelected]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Priority */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  <Ionicons name="flag-outline" size={14} color="#64748B" /> Priority
                </Text>
                <View style={styles.priorityGroup}>
                  {priorities.map(pri => {
                    const priorityConfig = {
                      High: { color: '#EF4444', bg: '#FEF2F2', icon: 'flag' },
                      Normal: { color: '#3B82F6', bg: '#EFF6FF', icon: 'flag-outline' },
                      Low: { color: '#94A3B8', bg: '#F8FAFC', icon: 'flag-outline' },
                    };
                    const config = priorityConfig[pri];
                    const isSelected = newPriority === pri;
                    
                    return (
                      <TouchableOpacity
                        key={pri}
                        style={[
                          styles.priorityChip,
                          { backgroundColor: isSelected ? config.color : config.bg },
                        ]}
                        onPress={() => setNewPriority(pri)}
                      >
                        <Ionicons name={config.icon as any} size={14} color={isSelected ? '#FFFFFF' : config.color} />
                        <Text style={[styles.priorityChipText, { color: isSelected ? '#FFFFFF' : config.color }]}>{pri}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              
              {/* Delete button for editing */}
              {isEditing && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => {
                    deleteTask(editingTask.id);
                    closeModal();
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>Delete Task</Text>
                </TouchableOpacity>
              )}
              
              <View style={{ height: 20 }} />
            </ScrollView>
            
            {/* Action Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalSaveButton, !newTitle.trim() && styles.modalSaveButtonDisabled]}
                onPress={() => {
                  if (isEditing) {
                    saveEditedTask();
                  } else {
                    addTask();
                  }
                  closeModal();
                }}
                disabled={!newTitle.trim()}
              >
                <Ionicons name={isEditing ? 'checkmark' : 'add'} size={20} color="#FFFFFF" />
                <Text style={styles.modalSaveButtonText}>{isEditing ? 'Save Changes' : 'Add Task'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };
  
  // Abandon Confirm Modal
  const renderAbandonConfirm = () => (
    <Modal
      visible={showAbandonConfirm}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAbandonConfirm(false)}
    >
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>End Focus Session?</Text>
          <Text style={styles.confirmMessage}>
            You've been focusing for {formatTimer(elapsedSeconds)}. Are you sure you want to stop?
          </Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity 
              style={styles.confirmButtonCancel}
              onPress={() => setShowAbandonConfirm(false)}
            >
              <Text style={styles.confirmButtonCancelText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButtonConfirm}
              onPress={() => stopTimer(true)}
            >
              <Text style={styles.confirmButtonConfirmText}>End Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  // Focus Completion Celebration Modal
  const renderFocusCompleteModal = () => {
    if (!completedSessionData.task) return null;
    
    const minutes = Math.round(completedSessionData.duration / 60);
    const motivationalMessages = [
      { text: "Amazing focus! You're unstoppable!", emoji: "🚀" },
      { text: "Incredible work! Keep crushing it!", emoji: "💪" },
      { text: "You're on fire! Great session!", emoji: "🔥" },
      { text: "Fantastic effort! You did it!", emoji: "⭐" },
      { text: "Outstanding focus! Well done!", emoji: "🎯" },
      { text: "Deep work mastery achieved!", emoji: "🧠" },
      { text: "You stayed in the zone!", emoji: "💫" },
    ];
    const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    
    return (
      <Modal
        visible={showFocusComplete}
        transparent
        animationType="none"
        onRequestClose={closeCelebration}
      >
        <View style={styles.celebrationOverlay}>
          <Animated.View style={[
            styles.celebrationCard,
            {
              transform: [
                { scale: celebrationAnim },
                { translateY: celebrationAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }
              ],
              opacity: celebrationAnim,
            }
          ]}>
            {/* Confetti decoration */}
            <Animated.View style={[styles.confettiContainer, { opacity: confettiAnim }]}>
              {['🎉', '✨', '🌟', '💫', '🎊'].map((emoji, i) => (
                <Animated.Text 
                  key={i} 
                  style={[
                    styles.confettiEmoji,
                    { 
                      left: `${15 + i * 18}%`,
                      transform: [{
                        translateY: confettiAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] })
                      }]
                    }
                  ]}
                >
                  {emoji}
                </Animated.Text>
              ))}
            </Animated.View>
            
            {/* Trophy Icon */}
            <View style={styles.celebrationIconContainer}>
              <View style={styles.celebrationIconBg}>
                <Ionicons name="trophy" size={40} color="#F59E0B" />
              </View>
            </View>
            
            <Text style={styles.celebrationTitle}>Focus Complete!</Text>
            <Text style={styles.celebrationMessage}>{message.emoji} {message.text}</Text>
            
            {/* Session Stats */}
            <View style={styles.sessionSummary}>
              <View style={styles.sessionStatItem}>
                <View style={[styles.sessionStatIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="time" size={20} color="#3B82F6" />
                </View>
                <Text style={styles.sessionStatValue}>{minutes}m</Text>
                <Text style={styles.sessionStatLabel}>Focused</Text>
              </View>
              
              <View style={styles.sessionStatDivider} />
              
              <View style={styles.sessionStatItem}>
                <View style={[styles.sessionStatIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="flame" size={20} color="#F59E0B" />
                </View>
                <Text style={styles.sessionStatValue}>{completedSessionData.streak}</Text>
                <Text style={styles.sessionStatLabel}>Day Streak</Text>
              </View>
              
              <View style={styles.sessionStatDivider} />
              
              <View style={styles.sessionStatItem}>
                <View style={[styles.sessionStatIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
                <Text style={styles.sessionStatValue}>{focusStats.completedSessions}</Text>
                <Text style={styles.sessionStatLabel}>Sessions</Text>
              </View>
            </View>
            
            {/* Completed Task */}
            <View style={styles.completedTaskCard}>
              <View style={[styles.completedTaskAccent, { backgroundColor: completedSessionData.task.color }]} />
              <View style={styles.completedTaskContent}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <View style={styles.completedTaskInfo}>
                  <Text style={styles.completedTaskTitle}>{completedSessionData.task.title}</Text>
                  <Text style={styles.completedTaskCategory}>{completedSessionData.task.category}</Text>
                </View>
              </View>
            </View>
            
            {/* Action Button */}
            <TouchableOpacity style={styles.celebrationButton} onPress={closeCelebration}>
              <Text style={styles.celebrationButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
  };
  
  // Swipeable Task Card Component
  const SwipeableTaskCard = ({ task, index }: { task: Task; index: number }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const isActive = activeTimerId === task.id;
    const taskNeedsFocus = isFocusTask(task);
    
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx < 0) {
            translateX.setValue(Math.max(gestureState.dx, -100));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -60) {
            // Delete task
            Animated.timing(translateX, { toValue: -SCREEN_WIDTH, duration: 200, useNativeDriver: true }).start(() => {
              setTasks(tasks.filter(t => t.id !== task.id));
              if (activeTimerId === task.id) {
                stopTimer(true);
              }
            });
          } else {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          }
        },
      })
    ).current;
    
    return (
      <View style={styles.taskItem}>
        <View style={styles.taskTime}>
          <Text style={styles.taskTimeText}>{task.time}</Text>
          {index < tasks.length - 1 && (
            <View style={[
              styles.timeline, 
              { backgroundColor: task.completed ? '#E2E8F0' : task.color + '40' }
            ]} />
          )}
        </View>
        
        {/* Delete background */}
        <View style={styles.swipeDeleteBg}>
          <Ionicons name="trash" size={22} color="#FFFFFF" />
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </View>
        
        <Animated.View 
          style={[{ transform: [{ translateX }], flex: 1 }]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => openModal('edit', task)}
            style={[
              styles.taskCard, 
              task.completed && styles.taskCardCompleted,
              isActive && styles.taskCardActive,
              taskNeedsFocus && !task.completed && !isActive && styles.taskCardFocus
            ]}
          >
            {/* Category accent bar */}
            <View style={[styles.taskAccentBar, { backgroundColor: task.color }]} />
            
            {/* Active badge */}
            {isActive && (
              <View style={styles.activeBadge}>
                <Animated.View style={[styles.activeBadgeDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.activeBadgeText}>LIVE</Text>
              </View>
            )}
            
            {/* Focus/Quick badge */}
            {!task.completed && !isActive && (
              <View style={[styles.taskTypeBadge, taskNeedsFocus ? styles.focusBadge : styles.quickBadge]}>
                {taskNeedsFocus ? (
                  <>
                    <MaterialCommunityIcons name="timer-outline" size={10} color="#F59E0B" />
                    <Text style={styles.focusBadgeText}>Focus</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="flash" size={10} color="#3B82F6" />
                    <Text style={styles.quickBadgeText}>Quick</Text>
                  </>
                )}
              </View>
            )}
            
            <View style={styles.taskHeader}>
              {/* Play/Checkbox */}
              {taskNeedsFocus && !task.completed ? (
                <TouchableOpacity 
                  style={[styles.playButton, isActive && styles.playButtonActive]}
                  onPress={() => isActive ? null : startTimer(task.id)}
                >
                  <Ionicons name={isActive ? 'pause' : 'play'} size={14} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
                  onPress={() => toggleTask(task.id)}
                >
                  {task.completed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              )}
              
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]} numberOfLines={1}>
                  {task.title}
                </Text>
                <Text style={styles.taskDescription} numberOfLines={1}>{task.description}</Text>
              </View>
            </View>
            
            <View style={styles.taskFooter}>
              <View style={[styles.categoryBadge, { backgroundColor: task.color + '20' }]}>
                <Text style={[styles.categoryText, { color: task.color }]}>{task.category}</Text>
              </View>
              {task.priority === 'High' && (
                <View style={styles.priorityBadge}>
                  <Ionicons name="flag" size={10} color="#EF4444" />
                  <Text style={styles.priorityText}>High</Text>
                </View>
              )}
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={12} color="#94A3B8" />
                <Text style={styles.durationText}>{task.duration}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Enhanced Header with Avatar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>K</Text>
              </View>
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>🔥</Text>
              </View>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.greetingRow}>
                <Text style={styles.greetingEmoji}>{greeting.emoji}</Text>
                <Text style={styles.greetingText}>{greeting.text}, Khalid</Text>
              </View>
              <Text style={styles.title}>Your Plan</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.headerButton, styles.headerButtonOutline]}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <Ionicons name="calendar-outline" size={20} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => openModal('add')}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Streak & Stats Banner */}
        <View style={styles.streakBanner}>
          <View style={styles.streakLeft}>
            <View style={styles.streakIconBg}>
              <Text style={styles.streakIconEmoji}>🔥</Text>
            </View>
            <View>
              <Text style={styles.streakValue}>{focusStats.currentStreak} Day Streak!</Text>
              <Text style={styles.streakSubtext}>Keep it going, you're doing great</Text>
            </View>
          </View>
          <View style={styles.miniStats}>
            <View style={styles.miniStatItem}>
              <Text style={styles.miniStatValue}>{focusStats.completedSessions}</Text>
              <Text style={styles.miniStatLabel}>Sessions</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStatItem}>
              <Text style={styles.miniStatValue}>{formatDuration(focusStats.totalFocusMinutes)}</Text>
              <Text style={styles.miniStatLabel}>Focused</Text>
            </View>
          </View>
        </View>

        {/* Calendar Popup */}
        {showCalendar && (
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => {
                const newMonth = new Date(selectedMonth);
                newMonth.setMonth(newMonth.getMonth() - 1);
                setSelectedMonth(newMonth);
              }}>
                <Ionicons name="chevron-back" size={20} color="#64748B" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>
                {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => {
                const newMonth = new Date(selectedMonth);
                newMonth.setMonth(newMonth.getMonth() + 1);
                setSelectedMonth(newMonth);
              }}>
                <Ionicons name="chevron-forward" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <Text key={i} style={styles.calendarDayLabel}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {(() => {
                const firstDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
                const lastDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
                const startDay = firstDay.getDay();
                const days = [];
                
                for (let i = 0; i < startDay; i++) {
                  days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
                }
                
                for (let i = 1; i <= lastDay.getDate(); i++) {
                  const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), i);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSelected = date.toDateString() === weekDays[selectedDay]?.fullDate.toDateString();
                  
                  days.push(
                    <TouchableOpacity 
                      key={i} 
                      style={[styles.calendarDay, isSelected && styles.calendarDaySelected, isToday && !isSelected && styles.calendarDayToday]}
                      onPress={() => {
                        const dayIndex = weekDays.findIndex(d => d.fullDate.toDateString() === date.toDateString());
                        if (dayIndex >= 0) {
                          setSelectedDay(dayIndex);
                        }
                        setShowCalendar(false);
                      }}
                    >
                      <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected, isToday && !isSelected && styles.calendarDayTextToday]}>{i}</Text>
                    </TouchableOpacity>
                  );
                }
                
                return days;
              })()}
            </View>
          </View>
        )}

        {/* Day Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
          {weekDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dayItem, selectedDay === index && styles.dayItemSelected, day.isToday && selectedDay !== index && styles.dayItemToday]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[styles.dayName, selectedDay === index && styles.dayNameSelected]}>{day.name}</Text>
              <Text style={[styles.dayDate, selectedDay === index && styles.dayDateSelected]}>{day.date}</Text>
              {day.isToday && <View style={[styles.dayDot, selectedDay === index && styles.dayDotSelected]} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Enhanced Progress Card */}
        <View style={styles.progressCard}>
          {/* Background Gradient Decoration */}
          <View style={styles.progressCardDecor} />
          
          <View style={styles.progressHeader}>
            <View style={styles.progressLeft}>
              <View style={styles.progressIconContainer}>
                <Ionicons name="trophy" size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.progressTitle}>Daily Progress</Text>
                <Text style={styles.progressSubtitle}>
                  {completedCount === tasks.length 
                    ? "🎉 All done! You're amazing!" 
                    : progress >= 75 
                      ? "Almost there! Keep going!" 
                      : progress >= 50 
                        ? "Great momentum! 💪" 
                        : "Let's crush it today!"}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Circular Progress */}
          <View style={styles.progressCircleContainer}>
            <Svg width={120} height={120}>
              <Defs>
                <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#8B5CF6" />
                  <Stop offset="100%" stopColor="#EC4899" />
                </LinearGradient>
              </Defs>
              <Circle
                cx={60}
                cy={60}
                r={52}
                stroke="#F1F5F9"
                strokeWidth={10}
                fill="none"
              />
              <Circle
                cx={60}
                cy={60}
                r={52}
                stroke="url(#progressGrad)"
                strokeWidth={10}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={2 * Math.PI * 52 * (1 - progress / 100)}
                transform="rotate(-90 60 60)"
              />
            </Svg>
            <View style={styles.progressCircleCenter}>
              <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
              <Text style={styles.progressPercentLabel}>done</Text>
            </View>
          </View>
          
          {/* Stats Row */}
          <View style={styles.progressStatsRow}>
            <View style={styles.progressStatBox}>
              <View style={[styles.progressStatIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </View>
              <Text style={styles.progressStatNumber}>{completedCount}</Text>
              <Text style={styles.progressStatLabel}>Done</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStatBox}>
              <View style={[styles.progressStatIcon, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="timer-outline" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.progressStatNumber}>{focusTasksCount}</Text>
              <Text style={styles.progressStatLabel}>Focus</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStatBox}>
              <View style={[styles.progressStatIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="flag" size={14} color="#EF4444" />
              </View>
              <Text style={styles.progressStatNumber}>{highPriorityCount}</Text>
              <Text style={styles.progressStatLabel}>Priority</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStatBox}>
              <View style={[styles.progressStatIcon, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name="flash" size={14} color="#3B82F6" />
              </View>
              <Text style={styles.progressStatNumber}>{quickTasksCount}</Text>
              <Text style={styles.progressStatLabel}>Quick</Text>
            </View>
          </View>
          
          {/* Time Summary */}
          <View style={styles.timeSummary}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.timeSummaryText}>
              <Text style={styles.timeSummaryBold}>{formatDuration(completedMinutes)}</Text> completed • <Text style={styles.timeSummaryBold}>{formatDuration(totalMinutes - completedMinutes)}</Text> remaining
            </Text>
          </View>
        </View>

        {/* Focus Timer (when active) */}
        {renderFocusTimer()}
        
        {/* Ready to Focus Card (when no timer active) */}
        {renderReadyToFocus()}

        {/* Quick Tasks Section */}
        {quickTasksCount > 0 && !activeTimerId && (
          <TouchableOpacity 
            style={styles.quickTasksSection}
            activeOpacity={0.8}
            onPress={() => {
              // Scroll to first quick task or show quick tasks filter
            }}
          >
            <View style={styles.quickTasksHeader}>
              <View style={styles.quickTasksIconBg}>
                <Ionicons name="flash" size={16} color="#3B82F6" />
              </View>
              <View style={styles.quickTasksInfo}>
                <Text style={styles.quickTasksTitle}>⚡ Quick Tasks Available</Text>
                <Text style={styles.quickTasksHint}>Knock these out in between focus sessions</Text>
              </View>
              <View style={styles.quickTasksCountBadge}>
                <Text style={styles.quickTasksCount}>{quickTasksCount}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Category Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter} contentContainerStyle={styles.categoryFilterContent}>
          <TouchableOpacity style={[styles.categoryPill, styles.categoryPillActive]}>
            <Text style={[styles.categoryPillText, styles.categoryPillTextActive]}>All Tasks</Text>
          </TouchableOpacity>
          {['Work', 'Health', 'Personal', 'Wellness', 'Creative'].map(cat => (
            <TouchableOpacity key={cat} style={styles.categoryPill}>
              <View style={[styles.categoryPillDot, { backgroundColor: getCategoryColor(cat) }]} />
              <Text style={styles.categoryPillText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Today's Schedule */}
        <View style={styles.scheduleHeader}>
          <View style={styles.scheduleLeft}>
            <Text style={styles.scheduleTitle}>📋 Today's Schedule</Text>
            <View style={styles.taskCountBadge}>
              <Text style={styles.taskCountText}>{tasks.filter(t => !t.completed).length} left</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>
        
        {/* Swipe hint */}
        <Text style={styles.swipeHint}>← Swipe left to delete</Text>

        {tasks.map((task, index) => (
          <SwipeableTaskCard key={task.id} task={task} index={index} />
        ))}
        
        {/* Empty state if all completed */}
        {tasks.every(t => t.completed) && (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Text style={styles.emptyStateEmoji}>🎉</Text>
            </View>
            <Text style={styles.emptyStateTitle}>All Done!</Text>
            <Text style={styles.emptyStateText}>You've completed all your tasks for today. Time to relax or add more goals!</Text>
            <TouchableOpacity style={[styles.emptyStateButton, { flexDirection: 'row', alignItems: 'center', gap: 6 }]} onPress={() => openModal('add')}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyStateButtonText}>Add New Task</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => openModal('add')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Modals */}
      {renderTaskModal()}
      {renderAbandonConfirm()}
      {renderFocusCompleteModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1 },
  
  // Glass Card Base
  glassCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  glassCardAndroid: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  
  // Enhanced Header with Avatar
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  avatarBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  avatarBadgeText: { fontSize: 12 },
  headerInfo: {},
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  greetingEmoji: { fontSize: 14 },
  greetingText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 10 },
  headerButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  headerButtonOutline: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.08 },
  
  // Streak Banner
  streakBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 16, backgroundColor: '#1E293B', borderRadius: 20, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  streakIconEmoji: { fontSize: 22 },
  streakValue: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  streakSubtext: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  miniStats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniStatItem: { alignItems: 'center' },
  miniStatValue: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  miniStatLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  miniStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  
  // Calendar
  calendarCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calendarMonthTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayLabel: { width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#94A3B8', marginBottom: 8 },
  calendarDay: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calendarDaySelected: { backgroundColor: '#8B5CF6', borderRadius: 12 },
  calendarDayToday: { backgroundColor: '#F1F5F9', borderRadius: 12 },
  calendarDayText: { fontSize: 14, color: '#0F172A', fontWeight: '500' },
  calendarDayTextSelected: { color: '#FFFFFF' },
  calendarDayTextToday: { color: '#8B5CF6', fontWeight: '700' },
  
  // Day Selector
  daySelector: { marginBottom: 16, paddingHorizontal: 20 },
  dayItem: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, marginRight: 8, borderRadius: 16, backgroundColor: '#FFFFFF', minWidth: 52, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  dayItemSelected: { backgroundColor: '#8B5CF6', shadowColor: '#8B5CF6', shadowOpacity: 0.3 },
  dayItemToday: { borderWidth: 2, borderColor: '#10B981' },
  dayName: { fontSize: 11, color: '#94A3B8', marginBottom: 4, fontWeight: '500' },
  dayNameSelected: { color: 'rgba(255,255,255,0.7)' },
  dayDate: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  dayDateSelected: { color: '#FFFFFF' },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#10B981', marginTop: 4 },
  dayDotSelected: { backgroundColor: '#FFFFFF' },
  
  // Enhanced Progress Card
  progressCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 6, overflow: 'hidden' },
  progressCardDecor: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: '#F5F3FF', opacity: 0.8 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  progressLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  progressIconContainer: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  progressTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  progressSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  progressRight: {},
  
  // Circular Progress
  progressCircleContainer: { alignItems: 'center', marginBottom: 20 },
  progressCircleCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  progressPercent: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  progressPercentLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  
  // Progress Stats Row
  progressStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12 },
  progressStatBox: { flex: 1, alignItems: 'center' },
  progressStatIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  progressStatNumber: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  progressStatLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  progressStatDivider: { width: 1, height: 40, backgroundColor: '#E2E8F0' },
  
  // Time Summary
  timeSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  timeSummaryText: { fontSize: 12, color: '#64748B' },
  timeSummaryBold: { fontWeight: '600', color: '#0F172A' },
  
  // Legacy progress styles (keeping some)
  progressBar: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  progressStats: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  progressStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressStatDot: { width: 6, height: 6, borderRadius: 3 },
  progressStatText: { fontSize: 11, color: '#64748B' },
  progressStatValue: { fontWeight: '600', color: '#0F172A' },
  
  // Focus Timer Card
  focusTimerCard: { marginHorizontal: 20, borderRadius: 24, padding: 20, marginBottom: 16, backgroundColor: '#10B981', overflow: 'hidden' },
  focusTimerOvertime: { backgroundColor: '#F97316' },
  focusTimerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  focusTimerStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  focusTimerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  focusTimerDotActive: { backgroundColor: '#FFFFFF' },
  focusTimerStatusText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  focusTimerMotivation: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  streakText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  motivationEmoji: { fontSize: 14 },
  motivationText: { fontSize: 11, fontWeight: '500', color: '#FFFFFF' },
  focusTaskTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', textAlign: 'center', marginBottom: 16 },
  
  // Progress Ring
  progressRingContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  progressRingCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  progressRingLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 2 },
  progressRingTime: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  progressRingTimeOvertime: { color: '#FEF3C7' },
  
  // Focus Timer Stats
  focusTimerStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 },
  focusTimerStat: { alignItems: 'center' },
  focusTimerStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, marginBottom: 2 },
  focusTimerStatValue: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  focusTimerStatDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)' },
  
  // Milestones
  milestoneBadges: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  milestoneBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  milestoneBadgeReached: { backgroundColor: '#FFFFFF' },
  milestoneBadgeText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  milestoneBadgeTextReached: { color: '#10B981' },
  
  // Focus Controls
  focusTimerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  focusControlButton: { width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  focusControlButtonMain: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  
  // Ready to Focus Card
  readyToFocusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 20, backgroundColor: '#1E293B', overflow: 'hidden' },
  readyToFocusGlow: { position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: '#10B981', opacity: 0.15 },
  readyToFocusPlayButton: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  readyToFocusInfo: { flex: 1 },
  readyToFocusLabel: { fontSize: 10, fontWeight: '700', color: '#10B981', letterSpacing: 0.5, marginBottom: 4 },
  readyToFocusTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 6 },
  readyToFocusMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  readyToFocusMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readyToFocusMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#475569' },
  readyToFocusTime: { fontSize: 12, color: '#94A3B8' },
  readyToFocusPriority: { backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  readyToFocusPriorityText: { fontSize: 10, fontWeight: '600', color: '#F59E0B' },
  readyToFocusCheck: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  
  // Quick Tasks Section - Enhanced
  quickTasksSection: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#DBEAFE', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  quickTasksHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickTasksIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  quickTasksInfo: { flex: 1 },
  quickTasksTitle: { fontSize: 14, fontWeight: '600', color: '#1E40AF' },
  quickTasksHint: { fontSize: 11, color: '#64748B', marginTop: 2 },
  quickTasksCountBadge: { backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  quickTasksCount: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  
  // Category Filter
  categoryFilter: { marginBottom: 16 },
  categoryFilterContent: { paddingHorizontal: 20, gap: 8 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  categoryPillActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  categoryPillDot: { width: 8, height: 8, borderRadius: 4 },
  categoryPillText: { fontSize: 13, fontWeight: '500', color: '#475569' },
  categoryPillTextActive: { color: '#FFFFFF' },
  
  // Schedule Header
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  scheduleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scheduleTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  taskCountBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  taskCountText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
  
  // Task Item
  taskItem: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 4 },
  taskTime: { width: 65, alignItems: 'flex-end', paddingRight: 14, paddingTop: 4 },
  taskTimeText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  timeline: { position: 'absolute', top: 24, right: 7, width: 2, height: 80, borderRadius: 1 },
  
  // Task Card
  taskCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2, overflow: 'hidden' },
  taskCardCompleted: { opacity: 0.5, backgroundColor: '#F8FAFC' },
  taskCardActive: { backgroundColor: '#ECFDF5', borderWidth: 1.5, borderColor: '#A7F3D0' },
  taskCardFocus: { borderWidth: 1.5, borderColor: '#FDE68A', borderLeftWidth: 0, backgroundColor: '#FFFBEB' },
  taskAccentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  
  // Task Type Badge
  taskTypeBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  focusBadge: { backgroundColor: '#FEF3C7' },
  focusBadgeText: { fontSize: 9, fontWeight: '600', color: '#B45309' },
  quickBadge: { backgroundColor: '#EFF6FF' },
  quickBadgeText: { fontSize: 9, fontWeight: '600', color: '#2563EB' },
  
  // Active Badge
  activeBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  activeBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  
  // Task Header
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, paddingLeft: 4 },
  taskIconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  taskInfo: { flex: 1, marginRight: 10 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#94A3B8' },
  taskDescription: { fontSize: 12, color: '#64748B' },
  
  // Checkbox & Play Button
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxCompleted: { backgroundColor: '#10B981', borderColor: '#10B981' },
  playButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  playButtonActive: { backgroundColor: '#10B981' },
  
  // Task Footer
  taskFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryText: { fontSize: 11, fontWeight: '600' },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF2F2', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '600', color: '#EF4444' },
  durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { fontSize: 11, color: '#94A3B8' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalHeaderIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalCloseButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalCancel: { fontSize: 16, color: '#64748B' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#8B5CF6' },
  modalContent: { flex: 1, paddingHorizontal: 20 },
  modalFooter: { padding: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  modalSaveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8B5CF6', paddingVertical: 16, borderRadius: 14, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalSaveButtonDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  modalSaveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  
  // Focus Indicator
  focusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 12, backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  focusIndicatorText: { fontSize: 12, color: '#92400E', fontWeight: '500' },
  
  // Form
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 10 },
  formInput: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, fontSize: 15, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0' },
  formInputLarge: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 16, fontSize: 17, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', fontWeight: '500' },
  formTextArea: { height: 80, textAlignVertical: 'top' },
  chipGroup: { flexDirection: 'row', gap: 8 },
  chipGroupWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  
  // Time Chips
  chipTime: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1F5F9' },
  chipTimeSelected: { backgroundColor: '#0F172A' },
  chipTimeText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  chipTimeTextSelected: { color: '#FFFFFF' },
  
  // Duration Chips
  chipDuration: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9', minWidth: 54, alignItems: 'center' },
  chipDurationSelected: { backgroundColor: '#8B5CF6' },
  chipDurationText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  chipDurationTextSelected: { color: '#FFFFFF' },
  
  // Category Chips
  chipCategory: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0' },
  chipCategoryDot: { width: 8, height: 8, borderRadius: 4 },
  chipCategoryText: { fontSize: 13, fontWeight: '500', color: '#475569' },
  chipCategoryTextSelected: { color: '#FFFFFF' },
  
  // Priority Chips
  priorityGroup: { flexDirection: 'row', gap: 10 },
  priorityChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  priorityChipText: { fontSize: 13, fontWeight: '600' },
  
  // Legacy chips
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1F5F9' },
  chipSelected: { backgroundColor: '#8B5CF6' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  chipTextSelected: { color: '#FFFFFF' },
  
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  deleteButtonText: { fontSize: 15, fontWeight: '500', color: '#EF4444' },

  // Empty State
  emptyState: { alignItems: 'center', padding: 40, marginHorizontal: 20, marginTop: 20, backgroundColor: '#FFFFFF', borderRadius: 28, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, borderWidth: 1, borderColor: '#D1FAE5' },
  emptyStateIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 3, borderColor: '#A7F3D0' },
  emptyStateEmoji: { fontSize: 40 },
  emptyStateTitle: { fontSize: 22, fontWeight: '800', color: '#065F46', marginBottom: 10 },
  emptyStateText: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 24, marginBottom: 28, paddingHorizontal: 10 },
  emptyStateButton: { backgroundColor: '#10B981', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  emptyStateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // FAB - Floating Action Button
  fab: { position: 'absolute', bottom: 100, right: 24, width: 62, height: 62, borderRadius: 31, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 10 },
  
  // Confirm Modal
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  confirmCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, width: '100%', maxWidth: 320 },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 8 },
  confirmMessage: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  confirmButtons: { flexDirection: 'row', gap: 12 },
  confirmButtonCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  confirmButtonCancelText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  confirmButtonConfirm: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' },
  confirmButtonConfirmText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  
  // Swipe Hint
  swipeHint: { textAlign: 'center', fontSize: 11, color: '#94A3B8', marginBottom: 14, marginHorizontal: 20, fontWeight: '500' },
  
  // Swipe Delete Background
  swipeDeleteBg: { position: 'absolute', right: 0, top: 0, bottom: 8, width: 100, backgroundColor: '#EF4444', borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginRight: 20 },
  swipeDeleteText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  
  // Celebration Modal
  celebrationOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  celebrationCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', overflow: 'hidden' },
  confettiContainer: { position: 'absolute', top: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  confettiEmoji: { fontSize: 24, position: 'absolute' },
  celebrationIconContainer: { marginBottom: 20 },
  celebrationIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
  celebrationTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  celebrationMessage: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  
  // Session Summary
  sessionSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 20, width: '100%' },
  sessionStatItem: { flex: 1, alignItems: 'center' },
  sessionStatIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  sessionStatValue: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  sessionStatLabel: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  sessionStatDivider: { width: 1, height: 50, backgroundColor: '#E2E8F0' },
  
  // Completed Task Card
  completedTaskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 14, padding: 14, marginBottom: 24, width: '100%', overflow: 'hidden' },
  completedTaskAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  completedTaskContent: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 8 },
  completedTaskInfo: { flex: 1 },
  completedTaskTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  completedTaskCategory: { fontSize: 12, color: '#64748B' },
  
  // Celebration Button
  celebrationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8B5CF6', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, width: '100%' },
  celebrationButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
