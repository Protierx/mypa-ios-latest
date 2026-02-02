/**
 * useHubData Hook
 * Manages data fetching and state for the Hub screen
 */
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tasksApi, focusApi } from '../../../services/api';
import { getVoiceAssistant } from '../../../services/voiceAssistant';
import { useAuth } from '../../../contexts/AuthContext';
import { handleApiError } from '../../../utils/errorHandler';
import { Sun, CloudSun, Sunrise, Moon } from 'lucide-react-native';

export interface Greeting {
  text: string;
  icon: typeof Sun | typeof CloudSun | typeof Sunrise | typeof Moon;
  period: string;
  timeOfDay: string;
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
}

export interface DisplayTask {
  id: string;
  title: string;
  time: string;
  icon: React.ComponentType<any>;
  category: string;
  duration: string;
  priority: boolean;
  completed: boolean;
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
  completedTasks: number[];
  todayStats: TodayStats;
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  setCompletedTasks: React.Dispatch<React.SetStateAction<number[]>>;
  awardXp: (amount: number) => Promise<void>;
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
    timeOfDay: 'morning' 
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realTasks, setRealTasks] = useState<any[]>([]);
  const [focusStats, setFocusStats] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
  useEffect(() => {
    const loadAIData = async () => {
      setIsLoading(true);
      try {
        // Fetch today's tasks
        const tasksRes = await tasksApi.getToday();
        console.log('🎯 Tasks API Response:', tasksRes);
        if (tasksRes.success && tasksRes.data?.tasks) {
          console.log('✅ Tasks loaded:', tasksRes.data.tasks.length, tasksRes.data.tasks);
          setRealTasks(tasksRes.data.tasks);
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
          () => loadAIData() // Retry function
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadAIData();
  }, []);

  // Dynamic greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting({ text: 'Good morning', icon: Sun, period: 'morning', timeOfDay: 'morning' });
    } else if (hour < 17) {
      setGreeting({ text: 'Good afternoon', icon: CloudSun, period: 'afternoon', timeOfDay: 'afternoon' });
    } else if (hour < 21) {
      setGreeting({ text: 'Good evening', icon: Sunrise, period: 'evening', timeOfDay: 'evening' });
    } else {
      setGreeting({ text: 'Good night', icon: Moon, period: 'night', timeOfDay: 'night' });
    }
  }, []);

  // Calculate XP needed for next level (simple formula: level * 100)
  const xpForNextLevel = (user?.level || 1) * 100;
  const currentLevelXp = user?.xp ? user.xp % xpForNextLevel : 0;

  // Today's data - using real user data from AuthContext
  const todayStats: TodayStats = {
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    userName: user?.name || user?.email?.split('@')[0] || 'there',
    streak: user?.currentStreak || 0,
    level: user?.level || 1,
    xp: (user?.xp || 0) + xpEarned,
    xpToNext: xpForNextLevel - currentLevelXp - xpEarned,
    tasksCompleted: (user?.tasksCompleted || 0) + completedTasks.length,
    totalTasks: realTasks.length || 0,
    timeSaved: user?.totalTimeSaved || 0,
    focusMinutes: user?.focusMinutes || 0,
  };

  // Get icon for task category
  const getCategoryIcon = (category: string) => {
    // Import icons dynamically or return icon names
    return category?.toLowerCase() || 'FileText';
  };

  // Map real tasks to display format
  const displayTasks: DisplayTask[] = realTasks.slice(0, 5).map((task: any) => ({
    id: task.id,
    title: task.title,
    time: task.time || (task.date ? new Date(task.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Anytime'),
    icon: getCategoryIcon(task.category) as any,
    category: task.category || 'Personal',
    duration: task.durationMin ? `${task.durationMin}m` : '30m',
    priority: task.priority === 'HIGH',
    completed: task.completed,
  }));

  // Award XP
  const awardXp = async (amount: number) => {
    const newXp = xpEarned + amount;
    setXpEarned(newXp);
    try {
      await AsyncStorage.setItem('hubData', JSON.stringify({ xpEarned: newXp }));
    } catch (error) {
      handleApiError(
        error,
        'Save XP Progress',
        false // Don't show retry for storage errors
      );
    }
  };

  return {
    greeting,
    currentTime,
    realTasks,
    displayTasks,
    focusStats,
    userStats,
    aiBriefing,
    aiSuggestion,
    xpEarned,
    completedTasks,
    todayStats,
    isLoading,
    setCompletedTasks,
    awardXp,
    voiceAssistant,
  };
}
