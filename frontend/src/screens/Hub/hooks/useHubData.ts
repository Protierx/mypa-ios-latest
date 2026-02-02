/**
 * useHubData Hook
 * Manages data fetching and state for the Hub screen
 * 
 * Inspired by successful apps:
 * - Things 3: Clean task organization, contextual awareness
 * - Todoist: Smart scheduling, productivity insights
 * - Apple Fitness: Gamification, progress celebration
 * - Forest: Focus encouragement, streak motivation
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { tasksApi, focusApi } from '../../../services/api';
import { getVoiceAssistant } from '../../../services/voiceAssistant';
import { useAuth } from '../../../contexts/AuthContext';
import { handleApiError } from '../../../utils/errorHandler';
import { Sun, CloudSun, Sunrise, Moon } from 'lucide-react-native';

export interface Greeting {
  text: string;
  icon: typeof Sun | typeof CloudSun | typeof Sunrise | typeof Moon;
  period: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  motivationalMessage: string;
}

export interface TodayStats {
  date: string;
  userName: string;
  streak: number;
  level: number;
  xp: number;
  xpToNext: number;
  tasksCompleted: number;
  totalTasks: number;
  timeSaved: number;
  focusMinutes: number;
  // New computed stats
  productivityScore: number;
  estimatedTimeLeft: number;
  nextMilestone: string;
}

export interface DisplayTask {
  id: string;
  title: string;
  time: string;
  icon: React.ComponentType<any>;
  category: string;
  duration: string;
  durationMin: number;
  priority: boolean;
  completed: boolean;
  // New smart fields
  isOverdue: boolean;
  isUrgent: boolean;
  isNextUp: boolean;
  timeUntil: string;
}

interface UseHubDataReturn {
  // Data state
  greeting: Greeting;
  currentTime: Date;
  realTasks: any[];
  displayTasks: DisplayTask[];
  focusStats: any;
  userStats: any;
  aiBriefing: string | null;
  aiSuggestion: string | null;
  xpEarned: number;
  completedTasks: string[];
  todayStats: TodayStats;
  
  // Loading states
  isLoading: boolean;
  
  // Computed insights
  nextTask: DisplayTask | null;
  overdueCount: number;
  remainingMinutes: number;
  
  // Actions
  setCompletedTasks: React.Dispatch<React.SetStateAction<string[]>>;
  awardXp: (amount: number) => Promise<void>;
  refreshData: () => Promise<void>;
  voiceAssistant: ReturnType<typeof getVoiceAssistant>;
}

export function useHubData(): UseHubDataReturn {
  const { user } = useAuth();
  const voiceAssistant = useRef(getVoiceAssistant()).current;
  
  // Data state
  const [greeting, setGreeting] = useState<Greeting>({ 
    text: '', 
    icon: Sun, 
    period: 'day', 
    timeOfDay: 'morning',
    motivationalMessage: ''
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realTasks, setRealTasks] = useState<any[]>([]);
  const [focusStats, setFocusStats] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live clock - update every minute for time-aware features
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Helper to normalize task ID to number for comparison
  const normalizeTaskId = (id: string | number): number => {
    return typeof id === 'string' ? parseInt(id, 10) : id;
  };

  // Load AsyncStorage data
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem('hubData');
        if (stored) {
          const data = JSON.parse(stored);
          setXpEarned(data.xpEarned || 0);
        }
      } catch (e) {
        console.error('Error loading hub data:', e);
      }
    };
    loadData();
  }, []);

  // Load AI data - tasks, focus stats, and proactive suggestion
  const loadAIData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch today's tasks
      const tasksRes = await tasksApi.getToday();
      console.log('🎯 Tasks API Response:', tasksRes);
      if (tasksRes.success && tasksRes.data?.tasks) {
        console.log('✅ Tasks loaded:', tasksRes.data.tasks.length, tasksRes.data.tasks);
        setRealTasks(tasksRes.data.tasks);
        // Reset local completed tasks when we get fresh data from server
        // Keep only locally completed tasks that aren't already marked complete on server
        setCompletedTasks(prev => {
          const serverCompletedIds = tasksRes.data.tasks
            .filter((t: any) => t.completed)
            .map((t: any) => String(t.id));
          // Remove locally completed tasks that are now marked complete on server
          return prev.filter(id => !serverCompletedIds.includes(id));
        });
      }

      // Fetch focus stats
      const focusRes = await focusApi.getStats();
      if (focusRes.success && focusRes.data) {
        setFocusStats(focusRes.data);
      }

      // Get proactive AI suggestion
      const suggestion = await voiceAssistant.getProactiveSuggestion();
      if (suggestion) {
        setAiSuggestion(suggestion);
      }
    } catch (error) {
      handleApiError(
        error,
        'Load Dashboard Data',
        true,
        () => loadAIData()
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh data when screen is focused (coming back from Plan, etc.)
  useFocusEffect(
    useCallback(() => {
      loadAIData();
    }, [loadAIData])
  );

  // Initial load
  useEffect(() => {
    loadAIData();
  }, [loadAIData]);

  // Dynamic greeting with motivational messages based on context
  useEffect(() => {
    const hour = new Date().getHours();
    const completedCount = completedTasks.length;
    const totalTasks = realTasks.filter(t => !t.completed).length;
    
    let greetingData: Greeting;
    
    if (hour < 12) {
      // Morning messages
      const morningMessages = [
        "Let's make today count! ✨",
        "Fresh start, fresh opportunities!",
        "You've got this! 💪",
        "Rise and shine, champion!",
      ];
      greetingData = { 
        text: 'Good morning', 
        icon: Sun, 
        period: 'morning', 
        timeOfDay: 'morning',
        motivationalMessage: totalTasks > 0 
          ? `${totalTasks} tasks waiting for you`
          : morningMessages[Math.floor(Math.random() * morningMessages.length)]
      };
    } else if (hour < 17) {
      // Afternoon messages
      const afternoonMessages = [
        "Keep the momentum going! 🚀",
        "You're doing great!",
        "Stay focused, stay strong!",
        "Halfway there!",
      ];
      greetingData = { 
        text: 'Good afternoon', 
        icon: CloudSun, 
        period: 'afternoon', 
        timeOfDay: 'afternoon',
        motivationalMessage: completedCount > 0 
          ? `${completedCount} tasks crushed today! 🔥`
          : afternoonMessages[Math.floor(Math.random() * afternoonMessages.length)]
      };
    } else if (hour < 21) {
      // Evening messages
      const eveningMessages = [
        "Finish strong! 💪",
        "Almost at the finish line!",
        "Great progress today!",
        "Wind down with intention",
      ];
      greetingData = { 
        text: 'Good evening', 
        icon: Sunrise, 
        period: 'evening', 
        timeOfDay: 'evening',
        motivationalMessage: completedCount === totalTasks && totalTasks > 0
          ? "All done! Enjoy your evening 🌟"
          : eveningMessages[Math.floor(Math.random() * eveningMessages.length)]
      };
    } else {
      // Night messages
      greetingData = { 
        text: 'Good night', 
        icon: Moon, 
        period: 'night', 
        timeOfDay: 'night',
        motivationalMessage: "Plan tomorrow for a head start 🌙"
      };
    }
    
    setGreeting(greetingData);
  }, [completedTasks.length, realTasks.length]);

  // Calculate XP needed for next level
  const xpForNextLevel = (user?.level || 1) * 100;
  const currentLevelXp = user?.xp ? user.xp % xpForNextLevel : 0;

  // Get icon for task category
  const getCategoryIcon = (category: string) => {
    return category?.toLowerCase() || 'FileText';
  };

  // Format time to clean 12-hour format (matching successful apps like Todoist)
  const formatTime = (time: string | null | undefined): string => {
    if (!time) return '';
    
    // If already in 12-hour format, clean it up
    if (time.includes('AM') || time.includes('PM')) {
      return time.replace(':00', '').replace(/\s+/g, '');
    }
    
    // Convert 24-hour format
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = match[2];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return minutes === '00' ? `${hour12}${ampm}` : `${hour12}:${minutes}${ampm}`;
    }
    
    return time;
  };

  // Parse time string to minutes since midnight for comparison
  const parseTimeToMinutes = (time: string | null | undefined): number => {
    if (!time) return 999999;
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return 999999;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Calculate time until a task (for urgency indicators)
  const getTimeUntil = (time: string | null | undefined): string => {
    if (!time) return '';
    const taskMinutes = parseTimeToMinutes(time);
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const diff = taskMinutes - nowMinutes;
    
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'now';
    if (diff <= 15) return 'in 15m';
    if (diff <= 30) return 'in 30m';
    if (diff <= 60) return 'in 1h';
    if (diff <= 120) return 'in 2h';
    return '';
  };

  // Get today's date string in YYYY-MM-DD format
  const getTodayStr = (): string => new Date().toISOString().split('T')[0];

  // Check if a task is locally completed (using string comparison)
  const isLocallyCompleted = (taskId: string | number): boolean => {
    const stringId = String(taskId);
    return completedTasks.includes(stringId);
  };

  // Process and sort tasks with smart features
  const processedTasks = useMemo(() => {
    const todayStr = getTodayStr();
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Filter for today's tasks
    const todayTasks = realTasks.filter(task => {
      if (!task.date) return true;
      return task.date === todayStr;
    });

    // Sort: incomplete first, then by time, then by priority
    const sorted = [...todayTasks].sort((a, b) => {
      // Check both server and local completed status
      const aCompleted = a.completed || isLocallyCompleted(a.id);
      const bCompleted = b.completed || isLocallyCompleted(b.id);
      
      // Completed tasks go last
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      
      // Then by time
      const timeA = parseTimeToMinutes(a.time);
      const timeB = parseTimeToMinutes(b.time);
      if (timeA !== timeB) return timeA - timeB;
      
      // Then by priority
      const priorityOrder: { [key: string]: number } = { HIGH: 0, NORMAL: 1, LOW: 2 };
      const priorityA = priorityOrder[a.priority] ?? 1;
      const priorityB = priorityOrder[b.priority] ?? 1;
      return priorityA - priorityB;
    });

    // Map to display format with smart fields
    let foundNextUp = false;
    const mapped = sorted.map((task: any): DisplayTask => {
      const taskMinutes = parseTimeToMinutes(task.time);
      // Check both server and local completed status
      const taskCompleted = task.completed || isLocallyCompleted(task.id);
      // Only mark as overdue if NOT completed (either server or locally)
      const isOverdue = !taskCompleted && taskMinutes < nowMinutes && task.time;
      const isUrgent = !taskCompleted && taskMinutes - nowMinutes <= 30 && taskMinutes >= nowMinutes;
      const isNextUp = !taskCompleted && !foundNextUp;
      
      if (isNextUp) foundNextUp = true;
      
      // Ensure ID is always a string for consistency
      const taskId = String(task.id);
      
      return {
        id: taskId,
        title: task.title,
        time: formatTime(task.time),
        icon: getCategoryIcon(task.category) as any,
        category: task.category || 'Personal',
        duration: task.durationMin ? `${task.durationMin}m` : '30m',
        durationMin: task.durationMin || 30,
        priority: task.priority === 'HIGH',
        completed: taskCompleted,
        isOverdue,
        isUrgent,
        isNextUp,
        timeUntil: getTimeUntil(task.time),
      };
    });
    
    console.log('📋 Processed tasks:', mapped.map(t => ({ id: t.id, title: t.title, completed: t.completed })));
    return mapped;
  }, [realTasks, currentTime, completedTasks]);

  // Compute insights
  const nextTask = processedTasks.find(t => t.isNextUp) || null;
  const overdueCount = processedTasks.filter(t => t.isOverdue).length;
  const remainingMinutes = processedTasks
    .filter(t => !t.completed)
    .reduce((acc, t) => acc + t.durationMin, 0);

  // Calculate productivity score (0-100)
  const productivityScore = useMemo(() => {
    const total = processedTasks.length;
    if (total === 0) return 0;
    const completed = processedTasks.filter(t => t.completed).length;
    const onTime = processedTasks.filter(t => !t.isOverdue).length;
    return Math.round(((completed / total) * 70) + ((onTime / total) * 30));
  }, [processedTasks]);

  // Today's stats with enhanced data
  const todayStats: TodayStats = useMemo(() => ({
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    userName: user?.name || user?.email?.split('@')[0] || 'there',
    streak: user?.currentStreak || 0,
    level: user?.level || 1,
    xp: (user?.xp || 0) + xpEarned,
    xpToNext: xpForNextLevel - currentLevelXp - xpEarned,
    tasksCompleted: (user?.tasksCompleted || 0) + completedTasks.length,
    totalTasks: processedTasks.length,
    timeSaved: user?.totalTimeSaved || 0,
    focusMinutes: user?.focusMinutes || 0,
    productivityScore,
    estimatedTimeLeft: remainingMinutes,
    nextMilestone: getNextMilestone(user?.xp || 0, xpEarned),
  }), [user, xpEarned, completedTasks, processedTasks, productivityScore, remainingMinutes]);

  // Award XP with celebration
  const awardXp = async (amount: number) => {
    const newXp = xpEarned + amount;
    setXpEarned(newXp);
    try {
      await AsyncStorage.setItem('hubData', JSON.stringify({ xpEarned: newXp }));
    } catch (error) {
      handleApiError(error, 'Save XP Progress', false);
    }
  };

  return {
    greeting,
    currentTime,
    realTasks,
    displayTasks: processedTasks.slice(0, 5), // Show max 5 on hub
    focusStats,
    userStats,
    aiBriefing,
    aiSuggestion,
    xpEarned,
    completedTasks,
    todayStats,
    isLoading,
    nextTask,
    overdueCount,
    remainingMinutes,
    setCompletedTasks,
    awardXp,
    refreshData: loadAIData,
    voiceAssistant,
  };
}

// Helper: Get next milestone message
function getNextMilestone(currentXp: number, earned: number): string {
  const total = currentXp + earned;
  const milestones = [100, 250, 500, 1000, 2500, 5000, 10000];
  const next = milestones.find(m => m > total);
  if (!next) return 'Legend status!';
  return `${next - total} XP to next reward`;
}
