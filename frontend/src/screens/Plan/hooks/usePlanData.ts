import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { tasksApi, aiApi } from '../../../services/api';
import { handleApiError } from '../../../utils/errorHandler';
import { Task, FocusSession, FocusStats, AISuggestion } from '../types';
import { STORAGE_KEYS, DEFAULT_STATS } from '../constants';
import { useBackgroundTimer } from './useBackgroundTimer';
import * as calendarSync from '../../../services/calendarSync';
import { 
  getTodayStr, 
  formatDuration, 
  parseDuration, 
  getGreeting,
  mapAIPriority,
  mapAICategory,
  mapAIDuration,
} from '../utils';

interface UsePlanDataProps {
  routeParams?: { date?: string; taskId?: string; highlightNew?: boolean };
}

export const usePlanData = ({ routeParams }: UsePlanDataProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (routeParams?.date) {
      return new Date(routeParams.date + 'T12:00:00');
    }
    return new Date();
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(routeParams?.taskId || null);
  const [isLoading, setIsLoading] = useState(true);

  // Add task modal state
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newDuration, setNewDuration] = useState('30m');
  const [newPriority, setNewPriority] = useState<'High' | 'Normal' | 'Low'>('Normal');
  const [newTime, setNewTime] = useState('');
  const [showNewTimePicker, setShowNewTimePicker] = useState(false);
  const [newTimeDate, setNewTimeDate] = useState(new Date());
  const [newTaskDate, setNewTaskDate] = useState(new Date());
  const [showNewDatePicker, setShowNewDatePicker] = useState(false);

  // AI suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const aiDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Edit modal state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Personal');
  const [editDuration, setEditDuration] = useState('30m');
  const [editPriority, setEditPriority] = useState<'High' | 'Normal' | 'Low'>('Normal');
  const [editTime, setEditTime] = useState('');

  // Timer state
  const [activeTimerId, setActiveTimerId] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef<string | null>(null);
  const focusCardAnim = useRef(new Animated.Value(0)).current;

  // Focus data
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [focusStats, setFocusStats] = useState<FocusStats>(DEFAULT_STATS);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState<FocusSession | null>(null);

  // Highlight banner state
  const [highlightedTaskTitle, setHighlightedTaskTitle] = useState<string | null>(null);
  const [showAddedBanner, setShowAddedBanner] = useState<string | null>(null);

  // Greeting
  const greeting = useMemo(() => getGreeting(), []);

  // Computed values
  const todayStr = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);
  
  // Merge MYPA tasks with calendar events, sorted by time
  const todayTasks = useMemo(() => {
    const mypaTasks = tasks.filter(t => t.date === todayStr);
    const todayCalendarEvents = calendarEvents.filter(t => t.date === todayStr);
    
    // Combine and sort by time
    const combined = [...mypaTasks, ...todayCalendarEvents];
    return combined.sort((a, b) => {
      // Parse times for comparison
      const parseTime = (time: string): number => {
        const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!match) return 0;
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const ampm = match[3]?.toUpperCase();
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      return parseTime(a.time) - parseTime(b.time);
    });
  }, [tasks, calendarEvents, todayStr]);
  
  // Only count MYPA tasks for progress (not calendar events)
  const mypaTodayTasks = tasks.filter(t => t.date === todayStr && !t.isFromCalendar);
  const completedCount = mypaTodayTasks.filter(t => t.completed).length;
  const totalCount = mypaTodayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextTask = todayTasks.find(t => !t.completed && !t.isFromCalendar);
  const totalMinutes = mypaTodayTasks.reduce((sum, t) => sum + t.durationMin, 0);
  const completedMinutes = mypaTodayTasks.filter(t => t.completed).reduce((sum, t) => sum + t.durationMin, 0);
  const activeTask = activeTimerId ? tasks.find(t => t.id === activeTimerId) : null;

  // Load calendar events
  const loadCalendarEvents = useCallback(async () => {
    try {
      // Check if user has calendar sync enabled (user-specific setting)
      const syncSettings = await calendarSync.getSyncSettings();
      const selectedCalendars = await calendarSync.getSelectedCalendars();
      
      // If no sync settings saved or no calendars selected, user hasn't connected
      if (!selectedCalendars || selectedCalendars.length === 0) {
        setCalendarEvents([]);
        return;
      }

      const hasPermission = await calendarSync.checkCalendarPermissions();
      if (!hasPermission) {
        setCalendarEvents([]);
        return;
      }

      // Get events for the selected week
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const events = await calendarSync.getEventsFromCalendar(startDate, endDate);
      
      // Convert calendar events to Task format
      const calendarTasks: Task[] = events.map((event, index) => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        const durationMs = eventEnd.getTime() - eventStart.getTime();
        const durationMin = Math.max(15, Math.round(durationMs / (1000 * 60)));
        
        // Format time
        const hours = eventStart.getHours();
        const minutes = eventStart.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        const time = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        
        return {
          id: -(Date.now() + index), // Negative ID to avoid conflicts with MYPA tasks
          date: eventStart.toISOString().split('T')[0],
          time,
          duration: formatDuration(durationMin),
          durationMin,
          title: event.title,
          category: 'Calendar',
          priority: 'Normal' as const,
          completed: false,
          isFixed: true,
          isFromCalendar: true,
          calendarEventId: event.id,
          calendarId: event.calendarId,
        };
      });
      
      setCalendarEvents(calendarTasks);
    } catch (error) {
      console.log('Error loading calendar events:', error);
      setCalendarEvents([]);
    }
  }, [selectedDate]);

  // Load tasks from API
  const loadTasksFromApi = useCallback(async () => {
    try {
      const apiResponse = await tasksApi.getAll();
      const tasksData = apiResponse.data;
      
      if (apiResponse.success && Array.isArray(tasksData) && tasksData.length > 0) {
        const apiTasks: Task[] = tasksData.map((task: any, index: number) => ({
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
        return true;
      }
      return false;
    } catch (error) {
      handleApiError(
        error,
        'Load Tasks',
        true,
        () => loadTasksFromApi() // Retry function
      );
      return false;
    }
  }, []);

  // Handle route params
  useEffect(() => {
    if (routeParams?.date) {
      const targetDate = new Date(routeParams.date + 'T12:00:00');
      setSelectedDate(targetDate);
    }
    if (routeParams?.taskId) {
      setHighlightedTaskId(routeParams.taskId);
      const timer = setTimeout(() => setHighlightedTaskId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [routeParams?.date, routeParams?.taskId]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      if (!isLoading) {
        loadTasksFromApi();
        loadCalendarEvents();
        if (routeParams?.date) {
          setSelectedDate(new Date(routeParams.date + 'T12:00:00'));
        }
      }
    }, [isLoading, loadTasksFromApi, loadCalendarEvents, routeParams?.date])
  );

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tasks and calendar events in parallel
        const apiLoaded = await loadTasksFromApi();
        await loadCalendarEvents();
        
        if (!apiLoaded) {
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
            setTasks([]);
          }
        }

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
            const todayStrLocal = getTodayStr();
            const newTasks = pendingTasks.map((task: any, index: number) => ({
              id: Date.now() + index,
              date: todayStrLocal,
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
  }, [loadTasksFromApi, loadCalendarEvents]);

  // Reload calendar when date changes
  useEffect(() => {
    if (!isLoading) {
      loadCalendarEvents();
    }
  }, [selectedDate, isLoading, loadCalendarEvents]);

  // Persist tasks
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }, [tasks, isLoading]);

  // Persist sessions
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(focusSessions));
  }, [focusSessions, isLoading]);

  // Persist stats
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(focusStats));
  }, [focusStats, isLoading]);

  // Background timer support (notifications when app is in background)
  const { saveSessionState } = useBackgroundTimer({
    activeTimerId,
    isRecording,
    elapsedSeconds,
    setElapsedSeconds,
    tasks,
  });

  // Timer tick
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

  // Focus card animation
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

  // AI suggestion debounce
  useEffect(() => {
    if (!newTitle.trim() || newTitle.trim().length < 3) {
      setAiSuggestion(null);
      return;
    }

    if (aiDebounceRef.current) {
      clearTimeout(aiDebounceRef.current);
    }

    aiDebounceRef.current = setTimeout(async () => {
      setIsLoadingAI(true);
      try {
        const response = await aiApi.categorizeTask(newTitle.trim());
        if (response.success && response.data) {
          const data = response.data;
          setAiSuggestion({
            category: mapAICategory(data.category || 'Personal'),
            priority: mapAIPriority(data.priority || 'normal'),
            suggestedDuration: mapAIDuration(data.suggestedDuration || '30'),
            confidence: data.confidence || 0.5,
            tags: data.tags || [],
          });
        }
      } catch (error) {
        handleApiError(
          error,
          'Get AI Suggestions',
          false // Don't show retry for optional suggestions
        );
      } finally {
        setIsLoadingAI(false);
      }
    }, 500);

    return () => {
      if (aiDebounceRef.current) {
        clearTimeout(aiDebounceRef.current);
      }
    };
  }, [newTitle]);

  return {
    // State
    tasks,
    setTasks,
    selectedDate,
    setSelectedDate,
    showCalendar,
    setShowCalendar,
    highlightedTaskId,
    isLoading,
    isAdding,
    setIsAdding,
    editingTask,
    setEditingTask,
    newTitle,
    setNewTitle,
    newCategory,
    setNewCategory,
    newDuration,
    setNewDuration,
    newPriority,
    setNewPriority,
    newTime,
    setNewTime,
    showNewTimePicker,
    setShowNewTimePicker,
    newTimeDate,
    setNewTimeDate,
    newTaskDate,
    setNewTaskDate,
    showNewDatePicker,
    setShowNewDatePicker,
    aiSuggestion,
    setAiSuggestion,
    isLoadingAI,
    editTitle,
    setEditTitle,
    editCategory,
    setEditCategory,
    editDuration,
    setEditDuration,
    editPriority,
    setEditPriority,
    editTime,
    setEditTime,
    activeTimerId,
    setActiveTimerId,
    elapsedSeconds,
    setElapsedSeconds,
    isRecording,
    setIsRecording,
    sessionStartTime,
    focusCardAnim,
    focusSessions,
    setFocusSessions,
    focusStats,
    setFocusStats,
    showAbandonConfirm,
    setShowAbandonConfirm,
    showSessionSummary,
    setShowSessionSummary,
    highlightedTaskTitle,
    showAddedBanner,
    greeting,
    // Computed
    todayStr,
    todayTasks,
    completedCount,
    totalCount,
    progressPercent,
    nextTask,
    totalMinutes,
    completedMinutes,
    activeTask,
  };
};
