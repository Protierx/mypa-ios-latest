import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { tasksApi } from '../services/api';

interface PlanScreenProps {
  navigation?: any;
}

interface Task {
  id: number;
  date: string;
  time: string;
  duration: string;
  durationMin: number;
  title: string;
  category: string;
  priority: 'High' | 'Normal' | 'Low';
  completed: boolean;
  isFixed: boolean;
}

interface FocusSession {
  id: number;
  taskId: number;
  taskTitle: string;
  category: string;
  date: string;
  startTime: string;
  elapsedSeconds: number;
  targetSeconds: number;
  percentComplete: number;
  wasCompleted: boolean;
  wasAbandoned: boolean;
}

interface FocusStats {
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  totalFocusMinutes: number;
  currentStreak: number;
  bestStreak: number;
  averageCompletion: number;
  lastSessionDate: string | null;
}

const STORAGE_KEYS = {
  tasks: 'planTasks',
  sessions: 'focusSessions',
  stats: 'focusStats',
  pending: 'pendingPlanTasks',
  highlight: 'highlightNewTask',
};

const DEFAULT_STATS: FocusStats = {
  totalSessions: 0,
  completedSessions: 0,
  abandonedSessions: 0,
  totalFocusMinutes: 0,
  currentStreak: 0,
  bestStreak: 0,
  averageCompletion: 0,
  lastSessionDate: null,
};

const categoryAccents: Record<string, { bar: string; badge: string; tint: string }> = {
  Work: { bar: '#3B82F6', badge: '#2563EB', tint: '#EFF6FF' },
  Health: { bar: '#10B981', badge: '#059669', tint: '#ECFDF5' },
  Learning: { bar: '#F59E0B', badge: '#D97706', tint: '#FFFBEB' },
  Finance: { bar: '#06B6D4', badge: '#0891B2', tint: '#ECFEFF' },
  Social: { bar: '#EC4899', badge: '#DB2777', tint: '#FDF2F8' },
  Personal: { bar: '#8B5CF6', badge: '#7C3AED', tint: '#F5F3FF' },
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

const formatDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m === 0) return `${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const parseDuration = (dur: string): number => {
  if (dur.includes('h')) {
    const parts = dur.split('h');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }
  return parseInt(dur, 10) || 30;
};

const formatTimer = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getYesterdayStr = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

const isQuickTask = (task: Task): boolean => {
  const quickCategories = ['Finance', 'Social'];
  const quickKeywords = ['pay', 'reply', 'email', 'call', 'text', 'message', 'order', 'book', 'schedule', 'confirm', 'cancel', 'check', 'send'];
  const titleLower = task.title.toLowerCase();
  if (task.durationMin <= 10) return true;
  if (quickCategories.includes(task.category)) return true;
  if (quickKeywords.some(kw => titleLower.includes(kw))) return true;
  return false;
};

const SwipeableTask = ({
  task,
  onComplete,
  onDelete,
  onEdit,
  onFocus,
  onMoveTomorrow,
  isActive,
  isQuick,
}: {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onFocus: () => void;
  onMoveTomorrow: () => void;
  isActive: boolean;
  isQuick: boolean;
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

  const accent = categoryAccents[task.category] || categoryAccents.Personal;

  return (
    <View style={styles.taskWrapper}>
      <TouchableOpacity style={[styles.swipeBgRight, { backgroundColor: '#EF4444' }]} onPress={handleDeletePress}>
        <Ionicons name="trash" size={18} color="#FFFFFF" />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.taskCard,
          task.completed && styles.taskCardCompleted,
          isActive && styles.taskCardActive,
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

export function PlanScreen({ navigation }: PlanScreenProps) {
  const nav = useNavigation<any>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newDuration, setNewDuration] = useState('30m');
  const [newPriority, setNewPriority] = useState<'High' | 'Normal' | 'Low'>('Normal');
  const [newTime, setNewTime] = useState('');

  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Personal');
  const [editDuration, setEditDuration] = useState('30m');
  const [editPriority, setEditPriority] = useState<'High' | 'Normal' | 'Low'>('Normal');
  const [editTime, setEditTime] = useState('');

  const [activeTimerId, setActiveTimerId] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);

  const handleNavigate = (screen: string) => {
    const navigator = navigation || nav;
    if (!navigator) return;
    if (screen === 'sort') {
      navigator.navigate('Home', { screen: 'TaskSorting' });
    } else if (screen === 'hub') {
      navigator.navigate('Home', { screen: 'Hub' });
    } else if (screen === 'circles') {
      navigator.navigate('Circles', { screen: 'CirclesList' });
    } else if (screen === 'profile') {
      navigator.navigate('Profile', { screen: 'ProfileMain' });
    } else {
      navigator.navigate(screen);
    }
  };
  const [focusStats, setFocusStats] = useState<FocusStats>(DEFAULT_STATS);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState<FocusSession | null>(null);
  const sessionStartTime = useRef<string | null>(null);
  const focusCardAnim = useRef(new Animated.Value(0)).current;

  const [highlightedTaskTitle, setHighlightedTaskTitle] = useState<string | null>(null);
  const [showAddedBanner, setShowAddedBanner] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // First, try to fetch from API
        const apiResponse = await tasksApi.getAll();
        
        if (apiResponse.success && apiResponse.data?.tasks && apiResponse.data.tasks.length > 0) {
          // Convert API tasks to local format
          const apiTasks: Task[] = apiResponse.data.tasks.map((task: any, index: number) => ({
            id: task.id || Date.now() + index,
            date: task.date || getTodayStr(),
            time: task.time || '10:00 AM',
            duration: task.durationMin ? formatDuration(task.durationMin) : '30m',
            durationMin: task.durationMin || 30,
            title: task.title,
            category: task.category || 'Personal',
            priority: task.priority === 'HIGH' ? 'High' : task.priority === 'LOW' ? 'Low' : 'Normal',
            completed: task.completed || false,
            isFixed: task.isFixed || false,
          }));
          setTasks(apiTasks);
        } else {
          // Fallback to AsyncStorage if API returns no tasks
          const storedTasks = await AsyncStorage.getItem(STORAGE_KEYS.tasks);
          
          if (storedTasks) {
            const parsedTasks: any[] = JSON.parse(storedTasks);
            const normalized = parsedTasks.map(task => {
              const durationStr = typeof task.duration === 'number' ? formatDuration(task.duration) : task.duration || '30m';
              const durationMin = task.durationMin ?? parseDuration(durationStr);
              return {
                ...task,
                duration: durationStr,
                durationMin,
                priority: task.priority || 'Normal',
              } as Task;
            });
            setTasks(normalized);
          } else {
            // No tasks anywhere - start with empty list for new users
            setTasks([]);
          }
        }

        // Load focus sessions and stats from local storage
        const [storedSessions, storedStats] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.sessions),
          AsyncStorage.getItem(STORAGE_KEYS.stats),
        ]);

        if (storedSessions) setFocusSessions(JSON.parse(storedSessions));
        if (storedStats) setFocusStats(JSON.parse(storedStats));

        const pending = await AsyncStorage.getItem(STORAGE_KEYS.pending);
        if (pending) {
          const pendingTasks = JSON.parse(pending);
          if (Array.isArray(pendingTasks) && pendingTasks.length > 0) {
            const todayStr = getTodayStr();
            const newTasks = pendingTasks.map((task: any, index: number) => ({
              id: Date.now() + index,
              date: todayStr,
              time: task.suggestedTime || '10:00 AM',
              duration: task.estimatedTime || '30m',
              durationMin: parseDuration(task.estimatedTime || '30m'),
              title: task.title,
              category: task.aiCategory || 'Personal',
              priority: (task.aiPriority === 'urgent' ? 'High' : task.aiPriority === 'low' ? 'Low' : 'Normal') as 'High' | 'Normal' | 'Low',
              completed: false,
              isFixed: false,
            }));
            setTasks(prev => [...prev, ...newTasks]);
            await AsyncStorage.removeItem(STORAGE_KEYS.pending);

            const highlightFlag = await AsyncStorage.getItem(STORAGE_KEYS.highlight);
            if (highlightFlag) {
              const highlight = JSON.parse(highlightFlag);
              setHighlightedTaskTitle(highlight.title);
              setShowAddedBanner(highlight.title);
              await AsyncStorage.removeItem(STORAGE_KEYS.highlight);
              setTimeout(() => {
                setHighlightedTaskTitle(null);
                setShowAddedBanner(null);
              }, 5000);
            }
          }
        }
      } catch (e) {
        console.warn('PlanScreen storage error', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }, [tasks, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(focusSessions));
  }, [focusSessions, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(focusStats));
  }, [focusStats, isLoading]);

  useEffect(() => {
    if (activeTimerId !== null && isRecording) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTimerId, isRecording]);

  useEffect(() => {
    if (activeTimerId !== null) {
      focusCardAnim.setValue(0);
      Animated.timing(focusCardAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [activeTimerId, focusCardAnim]);

  const todayStr = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);
  const todayTasks = tasks.filter(t => t.date === todayStr);
  const completedCount = todayTasks.filter(t => t.completed).length;
  const totalCount = todayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextTask = todayTasks.find(t => !t.completed);
  const totalMinutes = todayTasks.reduce((sum, t) => sum + t.durationMin, 0);
  const completedMinutes = todayTasks.filter(t => t.completed).reduce((sum, t) => sum + t.durationMin, 0);

  const startTimer = (taskId: number) => {
    setActiveTimerId(taskId);
    setElapsedSeconds(0);
    setIsRecording(true);
    sessionStartTime.current = new Date().toISOString();
  };

  const pauseTimer = () => setIsRecording(false);
  const resumeTimer = () => setIsRecording(true);

  const saveSession = (wasCompleted: boolean, wasAbandoned: boolean) => {
    if (activeTimerId === null || elapsedSeconds < 5) return;
    const task = tasks.find(t => t.id === activeTimerId);
    if (!task) return;

    const targetSeconds = task.durationMin * 60;
    const percentComplete = Math.min(Math.round((elapsedSeconds / targetSeconds) * 100), 100);
    const today = getTodayStr();

    const newSession: FocusSession = {
      id: Date.now(),
      taskId: activeTimerId,
      taskTitle: task.title,
      category: task.category,
      date: today,
      startTime: sessionStartTime.current || new Date().toISOString(),
      elapsedSeconds,
      targetSeconds,
      percentComplete,
      wasCompleted,
      wasAbandoned,
    };

    const updatedSessions = [newSession, ...focusSessions].slice(0, 50);
    setFocusSessions(updatedSessions);

    const isNewDay = focusStats.lastSessionDate !== today;
    const isConsecutiveDay = focusStats.lastSessionDate === getYesterdayStr();

    const newStats: FocusStats = {
      totalSessions: focusStats.totalSessions + 1,
      completedSessions: focusStats.completedSessions + (wasCompleted ? 1 : 0),
      abandonedSessions: focusStats.abandonedSessions + (wasAbandoned ? 1 : 0),
      totalFocusMinutes: focusStats.totalFocusMinutes + Math.round(elapsedSeconds / 60),
      currentStreak: wasCompleted
        ? (isConsecutiveDay || !isNewDay ? focusStats.currentStreak + 1 : 1)
        : (wasAbandoned && percentComplete < 25 ? 0 : focusStats.currentStreak),
      bestStreak: Math.max(
        focusStats.bestStreak,
        wasCompleted ? (isConsecutiveDay || !isNewDay ? focusStats.currentStreak + 1 : 1) : focusStats.currentStreak
      ),
      averageCompletion: Math.round(
        ((focusStats.averageCompletion * focusStats.totalSessions) + percentComplete) / (focusStats.totalSessions + 1)
      ),
      lastSessionDate: today,
    };

    setFocusStats(newStats);
    setShowSessionSummary(newSession);
  };

  const stopTimer = (confirmed = false) => {
    if (!confirmed && elapsedSeconds > 30) {
      setShowAbandonConfirm(true);
      return;
    }

    const task = tasks.find(t => t.id === activeTimerId);
    const targetSeconds = (task?.durationMin || 30) * 60;
    const percentComplete = Math.round((elapsedSeconds / targetSeconds) * 100);

    if (elapsedSeconds >= 5) {
      saveSession(percentComplete >= 80, percentComplete < 80);
    }

    setActiveTimerId(null);
    setElapsedSeconds(0);
    setIsRecording(false);
    setShowAbandonConfirm(false);
    sessionStartTime.current = null;
  };

  const completeTimedTask = (taskId: number) => {
    saveSession(true, false);
    handleComplete(taskId);
    setActiveTimerId(null);
    setElapsedSeconds(0);
    setIsRecording(false);
    sessionStartTime.current = null;
  };

  const handleComplete = (id: number) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
    if (activeTimerId === id) stopTimer(true);
  };

  const handleDelete = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTimerId === id) stopTimer(true);
  };

  const handleMoveToTomorrow = (id: number) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, date: tomorrowStr } : t)));
  };

  const handleAddTask = () => {
    if (!newTitle.trim()) return;
    const newTask: Task = {
      id: Date.now(),
      date: todayStr,
      time: newTime || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      duration: newDuration,
      durationMin: parseDuration(newDuration),
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      completed: false,
      isFixed: false,
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTitle('');
    setNewCategory('Personal');
    setNewDuration('30m');
    setNewPriority('Normal');
    setNewTime('');
    setIsAdding(false);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditCategory(task.category);
    setEditDuration(task.duration);
    setEditPriority(task.priority);
    setEditTime(task.time);
  };

  const saveEditedTask = () => {
    if (!editingTask || !editTitle.trim()) return;
    setTasks(prev =>
      prev.map(t =>
        t.id === editingTask.id
          ? {
              ...t,
              title: editTitle.trim(),
              category: editCategory,
              duration: editDuration,
              durationMin: parseDuration(editDuration),
              priority: editPriority,
              time: editTime || t.time,
            }
          : t
      )
    );
    setEditingTask(null);
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', emoji: '☀️' };
    if (hour < 17) return { text: 'Good Afternoon', emoji: '⛅' };
    if (hour < 21) return { text: 'Good Evening', emoji: '🌅' };
    return { text: 'Good Night', emoji: '🌙' };
  }, []);

  const activeTask = activeTimerId ? tasks.find(t => t.id === activeTimerId) : null;
  const taskDurationSec = (activeTask?.durationMin || 30) * 60;
  const progressPct = Math.min((elapsedSeconds / taskDurationSec) * 100, 100);
  const remainingSec = Math.max(taskDurationSec - elapsedSeconds, 0);
  const isOvertime = elapsedSeconds > taskDurationSec;

  const ringSize = 140;
  const ringStroke = 10;
  const radius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading plan…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingEmoji}>{greeting.emoji}</Text>
              <Text style={styles.greetingText}>{greeting.text}</Text>
            </View>
            <Text style={styles.title}>Your Plan</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerIconBtn, showCalendar && styles.headerIconBtnActive]}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <Ionicons name="calendar" size={18} color={showCalendar ? '#FFFFFF' : '#64748B'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.datePill} onPress={() => setShowCalendar(true)}>
          <Text style={styles.datePillText}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
          <Ionicons name={showCalendar ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
        </TouchableOpacity>

        {showCalendar && (
          <View style={styles.calendarWrap}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, date) => {
                if (date) setSelectedDate(date);
                if (Platform.OS !== 'ios') setShowCalendar(false);
              }}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.calendarCloseBtn} onPress={() => setShowCalendar(false)}>
                <Text style={styles.calendarCloseText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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
                <Text style={styles.progressMetaStrong}>
                  {todayTasks.filter(t => !t.completed && !isQuickTask(t)).length}
                </Text> focus tasks
              </Text>
            </View>
            <TouchableOpacity style={styles.dumpBtn} onPress={() => handleNavigate('sort')}>
              <MaterialCommunityIcons name="star-four-points-outline" size={14} color="#64748B" />
              <Text style={styles.dumpBtnText}>Dump</Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTimerId !== null && activeTask && (
          <Animated.View
            style={[
              styles.focusCardWrap,
              {
                opacity: focusCardAnim,
                transform: [
                  {
                    translateY: focusCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                  {
                    scale: focusCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={isOvertime ? ['#F97316', '#EF4444'] : ['#10B981', '#06B6D4']}
              style={styles.focusCard}
            >
            <View style={styles.focusHeader}>
              <View style={styles.focusStatus}>
                <View style={[styles.liveDot, isRecording ? styles.liveDotActive : styles.liveDotPaused]} />
                <Text style={styles.focusStatusText}>{isRecording ? 'Focus Session' : 'Paused'}</Text>
              </View>
              <View style={styles.focusStreak}>
                {focusStats.currentStreak > 0 && (
                  <Text style={styles.focusStreakText}>🔥 {focusStats.currentStreak}</Text>
                )}
              </View>
            </View>

            <Text style={styles.focusTaskTitle} numberOfLines={1}>
              {activeTask.title}
            </Text>

            <View style={styles.ringWrap}>
              <Svg width={ringSize} height={ringSize}>
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={ringStroke}
                  fill="none"
                />
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke="#FFFFFF"
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  fill="none"
                  rotation={-90}
                  origin={`${ringSize / 2}, ${ringSize / 2}`}
                />
              </Svg>
              <View style={styles.ringCenter}>
                <Text style={styles.ringLabel}>{isOvertime ? 'OVERTIME' : 'REMAINING'}</Text>
                <Text style={styles.ringTime}>
                  {isOvertime ? '+' : ''}
                  {formatTimer(isOvertime ? elapsedSeconds - taskDurationSec : remainingSec)}
                </Text>
              </View>
            </View>

            <View style={styles.timerStats}>
              <View style={styles.timerStatItem}>
                <Text style={styles.timerStatLabel}>Elapsed</Text>
                <Text style={styles.timerStatValue}>{formatTimer(elapsedSeconds)}</Text>
              </View>
              <View style={styles.timerDivider} />
              <View style={styles.timerStatItem}>
                <Text style={styles.timerStatLabel}>Target</Text>
                <Text style={styles.timerStatValue}>{activeTask.duration}</Text>
              </View>
              <View style={styles.timerDivider} />
              <View style={styles.timerStatItem}>
                <Text style={styles.timerStatLabel}>Progress</Text>
                <Text style={styles.timerStatValue}>{Math.round(progressPct)}%</Text>
              </View>
            </View>

            <View style={styles.timerControls}>
              <TouchableOpacity style={styles.timerControlBtn} onPress={() => stopTimer(false)}>
                <Ionicons name="stop" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.timerMainBtn} onPress={isRecording ? pauseTimer : resumeTimer}>
                <Ionicons name={isRecording ? 'pause' : 'play'} size={26} color="#0F172A" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.timerControlBtn} onPress={() => completeTimedTask(activeTimerId)}>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            </LinearGradient>
          </Animated.View>
        )}

        {nextTask && activeTimerId === null && !isQuickTask(nextTask) && (
          <LinearGradient colors={['#0F172A', '#1F2937']} style={styles.nextFocusCard}>
            <TouchableOpacity style={styles.nextFocusPlay} onPress={() => startTimer(nextTask.id)}>
              <Ionicons name="play" size={20} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.nextFocusInfo}>
              <Text style={styles.nextFocusLabel}>Ready to Focus</Text>
              <Text style={styles.nextFocusTitle} numberOfLines={1}>{nextTask.title}</Text>
              <Text style={styles.nextFocusMeta}>{nextTask.time} • {nextTask.duration} estimated</Text>
            </View>
            <TouchableOpacity style={styles.nextFocusDone} onPress={() => handleComplete(nextTask.id)}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
        )}

        {todayTasks.length > 0 && (
          <Text style={styles.swipeHint}>Swipe tasks: → complete • ← delete</Text>
        )}

        {showAddedBanner && (
          <LinearGradient colors={['#10B981', '#14B8A6']} style={styles.addedBanner}>
            <View style={styles.addedIcon}>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.addedTextWrap}>
              <Text style={styles.addedTitle}>Task Added Successfully!</Text>
              <Text style={styles.addedSubtitle}>"{showAddedBanner}" is now in your plan</Text>
            </View>
          </LinearGradient>
        )}

        <View style={styles.taskList}>
          {todayTasks.map(task => (
            <View key={task.id} style={[styles.taskListItem, highlightedTaskTitle === task.title && styles.highlightedTask]}>
              <SwipeableTask
                task={task}
                onComplete={() => handleComplete(task.id)}
                onDelete={() => handleDelete(task.id)}
                onEdit={() => openEditModal(task)}
                onFocus={() => {
                  if (activeTimerId === task.id) {
                    pauseTimer();
                  } else {
                    if (activeTimerId) stopTimer(true);
                    startTimer(task.id);
                  }
                }}
                onMoveTomorrow={() => handleMoveToTomorrow(task.id)}
                isActive={activeTimerId === task.id}
                isQuick={isQuickTask(task)}
              />
            </View>
          ))}
        </View>

        {todayTasks.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle" size={30} color="#8B5CF6" />
            </View>
            <Text style={styles.emptyTitle}>No tasks for today</Text>
            <Text style={styles.emptySubtitle}>Add tasks or use Brain Dump to get organized</Text>
            <View style={styles.emptyButtons}>
              <TouchableOpacity style={styles.emptyPrimary} onPress={() => setIsAdding(true)}>
                <Text style={styles.emptyPrimaryText}>Add Task</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emptySecondary} onPress={() => handleNavigate('sort')}>
                <MaterialCommunityIcons name="star-four-points-outline" size={16} color="#7C3AED" />
                <Text style={styles.emptySecondaryText}>Brain Dump</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={isAdding} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setIsAdding(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Task</Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="What do you need to do?"
              placeholderTextColor="#94A3B8"
              style={styles.modalInput}
            />
            <Text style={styles.modalHelper}>Tip: start with a verb, like “Review” or “Call”.</Text>
            <View style={styles.modalRow}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>When</Text>
                <TextInput
                  value={newTime}
                  onChangeText={setNewTime}
                  placeholder="Anytime"
                  placeholderTextColor="#94A3B8"
                  style={styles.modalInput}
                />
              </View>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Duration</Text>
                <View style={styles.durationRow}>
                  {['15m', '30m', '1h', '2h'].map(dur => (
                    <TouchableOpacity
                      key={dur}
                      style={[styles.durationChip, newDuration === dur && styles.durationChipActive]}
                      onPress={() => setNewDuration(dur)}
                    >
                      <Text style={[styles.durationText, newDuration === dur && styles.durationTextActive]}>{dur}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <Text style={styles.modalLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
              {['Personal', 'Work', 'Health', 'Learning', 'Errands'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, newCategory === cat && styles.categoryChipActive]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, newCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.modalLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['Low', 'Normal', 'High'] as const).map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[styles.priorityChip, newPriority === priority && styles.priorityChipActive]}
                  onPress={() => setNewPriority(priority)}
                >
                  <Text style={[styles.priorityTextLabel, newPriority === priority && styles.priorityTextActive]}>
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setIsAdding(false);
                  setNewTitle('');
                  setNewCategory('Personal');
                  setNewDuration('30m');
                  setNewPriority('Normal');
                  setNewTime('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleAddTask}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.modalSubmitText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAbandonConfirm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowAbandonConfirm(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>End Session Early?</Text>
            <Text style={styles.modalBody}>You're partway through. Want to keep going?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSubmit} onPress={() => setShowAbandonConfirm(false)}>
                <Text style={styles.modalSubmitText}>Keep Going</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancel} onPress={() => stopTimer(true)}>
                <Text style={styles.modalCancelText}>End Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!showSessionSummary} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowSessionSummary(null)} />
          {showSessionSummary && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{showSessionSummary.wasCompleted ? 'Great Work!' : 'Session Ended'}</Text>
              <Text style={styles.summarySubtitle}>{showSessionSummary.taskTitle}</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Time</Text>
                  <Text style={styles.summaryValue}>{formatTimer(showSessionSummary.elapsedSeconds)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Progress</Text>
                  <Text style={styles.summaryValue}>{showSessionSummary.percentComplete}%</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Status</Text>
                  <Text style={styles.summaryValue}>{showSessionSummary.wasCompleted ? '✅' : '⏸️'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.summaryButton} onPress={() => setShowSessionSummary(null)}>
                <Text style={styles.summaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <Modal visible={!!editingTask} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setEditingTask(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Task</Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Task title (e.g., Review Q1 metrics)"
              placeholderTextColor="#94A3B8"
              style={styles.modalInput}
            />
            <Text style={styles.modalHelper}>Keep it short and action-oriented.</Text>
            <Text style={styles.modalLabel}>Time</Text>
            <TextInput
              value={editTime}
              onChangeText={setEditTime}
              placeholder="e.g., 2:30 PM"
              placeholderTextColor="#94A3B8"
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Duration</Text>
            <TextInput
              value={editDuration}
              onChangeText={setEditDuration}
              placeholder="e.g., 30m or 1h"
              placeholderTextColor="#94A3B8"
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Category</Text>
            <TextInput
              value={editCategory}
              onChangeText={setEditCategory}
              placeholder="e.g., Work, Health, Personal"
              placeholderTextColor="#94A3B8"
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['Low', 'Normal', 'High'] as const).map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[styles.priorityChip, editPriority === priority && styles.priorityChipActive]}
                  onPress={() => setEditPriority(priority)}
                >
                  <Text style={[styles.priorityTextLabel, editPriority === priority && styles.priorityTextActive]}>
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              {editingTask && (
                <TouchableOpacity
                  style={styles.modalDelete}
                  onPress={() => {
                    handleDelete(editingTask.id);
                    setEditingTask(null);
                  }}
                >
                  <Ionicons name="trash" size={16} color="#EF4444" />
                  <Text style={styles.modalDeleteText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.modalSubmit} onPress={saveEditedTask}>
                <Text style={styles.modalSubmitText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 120 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748B', fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, alignItems: 'center' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greetingEmoji: { fontSize: 18 },
  greetingText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  headerButtons: { flexDirection: 'row', gap: 10 },
  headerIconBtn: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerIconBtnActive: { backgroundColor: '#0F172A' },
  addBtn: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 8, marginLeft: 20, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F1F5F9' },
  datePillText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  calendarWrap: { marginHorizontal: 20, marginTop: 10, padding: 12, borderRadius: 18, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  calendarCloseBtn: { marginTop: 8, alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#0F172A' },
  calendarCloseText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  progressCard: { marginHorizontal: 20, marginTop: 14, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  progressValue: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  progressTotal: { fontSize: 18, color: '#CBD5F5' },
  progressUnit: { fontSize: 12, color: '#94A3B8' },
  timeLeft: { alignItems: 'flex-end' },
  timeLeftLabel: { fontSize: 10, color: '#CBD5F5', textTransform: 'uppercase' },
  timeLeftValue: { fontSize: 16, fontWeight: '700', color: '#475569' },
  progressBar: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 999, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', backgroundColor: '#10B981' },
  progressFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  progressMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressDot: { width: 6, height: 6, borderRadius: 3 },
  progressMetaText: { fontSize: 11, color: '#64748B' },
  progressMetaStrong: { fontWeight: '700', color: '#0F172A' },
  dumpBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F1F5F9' },
  dumpBtnText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  focusCard: { marginHorizontal: 20, marginTop: 14, borderRadius: 24, padding: 18 },
  focusCardWrap: { marginHorizontal: 20, marginTop: 14 },
  focusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  focusStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  focusStreak: { flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveDotActive: { backgroundColor: '#FFFFFF' },
  liveDotPaused: { backgroundColor: '#FDE68A' },
  focusStatusText: { fontSize: 11, color: '#FFFFFF', fontWeight: '700', textTransform: 'uppercase' },
  focusStreakText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  focusTaskTitle: { marginTop: 12, fontSize: 14, color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  ringTime: { fontSize: 26, color: '#FFFFFF', fontWeight: '700' },
  timerStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 },
  timerStatItem: { alignItems: 'center' },
  timerStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  timerStatValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  timerDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.3)' },
  timerControls: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 14 },
  timerControlBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  timerMainBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  nextFocusCard: { marginHorizontal: 20, marginTop: 12, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextFocusPlay: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  nextFocusInfo: { flex: 1 },
  nextFocusLabel: { fontSize: 10, color: '#34D399', fontWeight: '700', textTransform: 'uppercase' },
  nextFocusTitle: { fontSize: 15, color: '#FFFFFF', fontWeight: '600' },
  nextFocusMeta: { fontSize: 12, color: '#94A3B8' },
  nextFocusDone: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  swipeHint: { textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 12 },
  addedBanner: { marginHorizontal: 20, marginTop: 12, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  addedIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  addedTextWrap: { flex: 1 },
  addedTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  addedSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  taskList: { marginTop: 12, paddingHorizontal: 20, gap: 10 },
  taskListItem: { borderRadius: 18 },
  highlightedTask: { shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  taskWrapper: { position: 'relative' },
  swipeBgRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  taskCardCompleted: { opacity: 0.6 },
  taskCardActive: { borderWidth: 1, borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  taskAccent: { width: 4, height: '100%', borderRadius: 4, marginRight: 12 },
  taskContent: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  taskTimeBlock: { width: 48, alignItems: 'center' },
  taskTime: { fontSize: 13, fontWeight: '700', color: '#475569' },
  taskTimeCompleted: { color: '#94A3B8' },
  quickCheck: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#CBD5F5', alignItems: 'center', justifyContent: 'center' },
  quickCheckInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  completedCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  focusPlay: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  focusPlayActive: { backgroundColor: '#10B981' },
  taskDetails: { flex: 1 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A', flex: 1 },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#94A3B8' },
  priorityBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  priorityText: { fontSize: 10, color: '#EF4444', fontWeight: '700' },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  taskMetaText: { fontSize: 11, color: '#94A3B8' },
  taskMetaDot: { color: '#CBD5F5', fontSize: 12, marginHorizontal: 2 },
  taskCategoryDot: { width: 6, height: 6, borderRadius: 3 },
  tomorrowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F1F5F9' },
  tomorrowText: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  emptyState: { marginHorizontal: 20, marginTop: 20, padding: 24, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  emptyIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  emptySubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 6, textAlign: 'center' },
  emptyButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  emptyPrimary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0F172A' },
  emptyPrimaryText: { color: '#FFFFFF', fontWeight: '600' },
  emptySecondary: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EDE9FE', flexDirection: 'row', alignItems: 'center', gap: 6 },
  emptySecondaryText: { color: '#7C3AED', fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  modalBackdrop: { flex: 1 },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  modalBody: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  modalInput: { backgroundColor: '#F1F5F9', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A', marginBottom: 12 },
  modalHelper: { fontSize: 11, color: '#94A3B8', marginBottom: 8 },
  modalRow: { flexDirection: 'row', gap: 12 },
  modalField: { flex: 1 },
  modalLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  durationChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9' },
  durationChipActive: { backgroundColor: '#7C3AED' },
  durationText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  durationTextActive: { color: '#FFFFFF' },
  categoryRow: { marginBottom: 12 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: '#F1F5F9', marginRight: 8 },
  categoryChipActive: { backgroundColor: '#0F172A' },
  categoryChipText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  categoryChipTextActive: { color: '#FFFFFF' },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  priorityChip: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  priorityChipActive: { backgroundColor: '#2563EB' },
  priorityTextLabel: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  priorityTextActive: { color: '#FFFFFF' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10, alignItems: 'center' },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  modalCancelText: { color: '#64748B', fontWeight: '600' },
  modalSubmit: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#7C3AED', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  modalSubmitText: { color: '#FFFFFF', fontWeight: '700' },
  modalDelete: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#FEE2E2', flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalDeleteText: { color: '#EF4444', fontWeight: '700' },
  summaryCard: { marginHorizontal: 24, padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF' },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  summarySubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' },
  summaryValue: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 6 },
  summaryButton: { marginTop: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0F172A', alignItems: 'center' },
  summaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
});
