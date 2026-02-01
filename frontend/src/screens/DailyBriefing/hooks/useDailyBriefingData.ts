import { useState, useEffect, useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { aiApi, tasksApi, analyticsApi, assignmentsApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import {
  BriefingData,
  Task,
  Assignment,
  Quote,
  TimeColors,
  WeeklyStats,
  ScoreInfo,
} from '../types';
import { getQuoteForTime, getTimeColors, calculateProductivityScore, getScoreInfo } from '../utils';

interface UseDailyBriefingDataReturn {
  // State
  loading: boolean;
  refreshing: boolean;
  briefing: BriefingData;
  todaysTasks: Task[];
  weeklyStats: WeeklyStats | null;
  assignments: Assignment[];
  quote: Quote;
  colors: TimeColors;
  user: any;
  
  // Derived data
  pendingTasks: Task[];
  completedTasks: Task[];
  highPriorityTasks: Task[];
  productivityScore: number;
  scoreInfo: ScoreInfo;
  
  // Actions
  onRefresh: () => Promise<void>;
  
  // Animations
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  scaleAnim: Animated.Value;
  pulseAnim: Animated.Value;
}

export function useDailyBriefingData(): UseDailyBriefingDataReturn {
  const { user } = useAuth();
  const colors = getTimeColors();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [briefing, setBriefing] = useState<BriefingData>({});
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quote] = useState(getQuoteForTime());
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start pulse animation for productivity score
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const fetchBriefing = useCallback(async () => {
    try {
      const [insightsRes, tasksRes, analyticsRes, assignmentsRes] = await Promise.all([
        aiApi.getDailyInsights(),
        tasksApi.getToday(),
        analyticsApi.getWeekly().catch(() => ({ data: null })),
        assignmentsApi.getMine({ role: 'assignee', status: 'PENDING' }).catch(() => ({ success: false, data: [] })),
      ]);

      if (insightsRes.success && insightsRes.data) {
        setBriefing(insightsRes.data);
      }

      if (tasksRes.success && tasksRes.data) {
        setTodaysTasks(tasksRes.data.tasks || []);
      }

      if (analyticsRes.data) {
        setWeeklyStats(analyticsRes.data);
      }

      if ('success' in assignmentsRes && assignmentsRes.success && assignmentsRes.data) {
        // Format assignments
        const formatted = (assignmentsRes.data as any[]).slice(0, 3).map((a: any) => ({
          id: a.id,
          title: a.title,
          dueDate: a.dueDate,
          status: a.status?.toLowerCase(),
          xpReward: a.xpReward || 50,
          assignedByName: a.creator?.name || a.creator?.username,
          circleName: a.circle?.name,
          circleEmoji: a.circle?.emoji || '👥',
        }));
        setAssignments(formatted);
      }
    } catch (error) {
      console.error('Failed to fetch briefing:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing().then(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBriefing();
    setRefreshing(false);
  }, [fetchBriefing]);

  // Derived data
  const pendingTasks = todaysTasks.filter(t => !t.completed);
  const completedTasks = todaysTasks.filter(t => t.completed);
  const highPriorityTasks = pendingTasks.filter(t => t.priority === 'HIGH');
  
  // Calculate productivity score
  const productivityScore = calculateProductivityScore(
    completedTasks.length,
    todaysTasks.length,
    briefing.stats?.streak || 0,
    briefing.stats?.weeklyCompleted || 0
  );
  
  const scoreInfo = getScoreInfo(productivityScore);

  return {
    // State
    loading,
    refreshing,
    briefing,
    todaysTasks,
    weeklyStats,
    assignments,
    quote,
    colors,
    user,
    
    // Derived data
    pendingTasks,
    completedTasks,
    highPriorityTasks,
    productivityScore,
    scoreInfo,
    
    // Actions
    onRefresh,
    
    // Animations
    fadeAnim,
    slideAnim,
    scaleAnim,
    pulseAnim,
  };
}
