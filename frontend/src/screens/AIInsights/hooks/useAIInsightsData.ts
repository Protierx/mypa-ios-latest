import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { aiApi, tasksApi, analyticsApi } from '../../../services/api';
import { DayStats, TaskSuggestion, Insight, ProductivityTip } from '../types';
import { PRODUCTIVITY_TIPS } from '../constants';

const initialStats: DayStats = {
  pending: 0,
  completed: 0,
  highPriority: 0,
  streak: 0,
  weeklyCompleted: 0,
  focusMinutes: 0,
  overdue: 0,
  productivity: 0,
};

export const useAIInsightsData = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DayStats>(initialStats);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [currentTip, setCurrentTip] = useState<ProductivityTip>(
    PRODUCTIVITY_TIPS[Math.floor(Math.random() * PRODUCTIVITY_TIPS.length)]
  );

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const fetchInsights = async () => {
    try {
      setLoading(true);
      
      // Parallel API calls
      const [aiResponse, tasksResponse, analyticsResponse] = await Promise.all([
        aiApi.getInsights().catch(() => null),
        tasksApi.getAll().catch(() => ({ data: [] })),
        analyticsApi.getOverview().catch(() => null),
      ]);

      const tasks = tasksResponse?.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate stats
      const todayTasks = tasks.filter((t: any) => {
        const taskDate = new Date(t.scheduledDate || t.dueDate || t.createdAt);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });

      const pending = todayTasks.filter((t: any) => t.status !== 'completed').length;
      const completed = todayTasks.filter((t: any) => t.status === 'completed').length;
      const highPriority = todayTasks.filter((t: any) => t.priority === 'high').length;
      const overdue = tasks.filter((t: any) => {
        const dueDate = new Date(t.dueDate);
        return dueDate < new Date() && t.status !== 'completed';
      }).length;

      // Calculate productivity
      const total = pending + completed;
      const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Get analytics data
      const streakData = analyticsResponse?.data?.streak || 0;
      const weeklyCompleted = analyticsResponse?.data?.weeklyCompleted || completed;
      const focusMinutes = analyticsResponse?.data?.focusMinutes || 0;

      setStats({
        pending,
        completed,
        highPriority,
        streak: streakData,
        weeklyCompleted,
        focusMinutes,
        overdue,
        productivity,
      });

      // Generate insights from AI response or create smart ones
      const newInsights: Insight[] = [];
      const newSuggestions: TaskSuggestion[] = [];

      // AI-generated suggestions
      if (aiResponse?.data?.suggestions) {
        aiResponse.data.suggestions.forEach((s: any, index: number) => {
          newSuggestions.push({
            id: `ai-${index}`,
            taskId: s.taskId,
            taskTitle: s.taskTitle,
            type: s.type || 'prioritize',
            message: s.message,
            impact: s.impact || 'medium',
          });
        });
      }

      // Smart insights based on data
      if (overdue > 0) {
        newInsights.push({
          id: 'overdue',
          type: 'alert',
          title: 'Overdue Tasks',
          message: `You have ${overdue} overdue task${overdue > 1 ? 's' : ''}. Consider rescheduling or completing them today.`,
          icon: 'warning-outline',
          actionLabel: 'View Tasks',
          onAction: () => navigation.navigate('Tasks' as never),
        });
      }

      if (highPriority > 3) {
        newInsights.push({
          id: 'high-priority',
          type: 'warning',
          title: 'Many High Priority Tasks',
          message: `You have ${highPriority} high priority tasks today. Consider delegating or rescheduling some.`,
          icon: 'flag-outline',
        });
      }

      if (streakData >= 7) {
        newInsights.push({
          id: 'streak',
          type: 'success',
          title: `${streakData} Day Streak! 🔥`,
          message: `Amazing! You've been consistent for ${streakData} days. Keep it up!`,
          icon: 'flame-outline',
        });
      }

      if (productivity >= 80) {
        newInsights.push({
          id: 'productivity',
          type: 'success',
          title: 'Great Productivity!',
          message: `You're at ${productivity}% completion today. Excellent work!`,
          icon: 'trophy-outline',
        });
      } else if (productivity < 30 && total > 0) {
        newInsights.push({
          id: 'low-productivity',
          type: 'tip',
          title: 'Productivity Tip',
          message: 'Try starting with your easiest task to build momentum.',
          icon: 'bulb-outline',
        });
      }

      if (focusMinutes > 120) {
        newInsights.push({
          id: 'focus',
          type: 'info',
          title: 'Focus Champion',
          message: `You've focused for ${focusMinutes} minutes today. Great dedication!`,
          icon: 'time-outline',
        });
      }

      // Generate task-based suggestions if none from AI
      if (newSuggestions.length === 0 && tasks.length > 0) {
        const pendingTasks = tasks.filter((t: any) => t.status !== 'completed');
        
        // Find quick wins (low complexity, short duration)
        const quickWins = pendingTasks.filter(
          (t: any) => t.estimatedDuration && t.estimatedDuration <= 15
        );
        if (quickWins.length > 0) {
          newSuggestions.push({
            id: 'quick-win-1',
            taskId: quickWins[0].id,
            taskTitle: quickWins[0].title,
            type: 'quick_win',
            message: 'This task is quick - knock it out now!',
            impact: 'medium',
          });
        }

        // Find tasks that could be combined
        const workTasks = pendingTasks.filter((t: any) => 
          t.category === 'work' || t.title?.toLowerCase().includes('meeting')
        );
        if (workTasks.length >= 3) {
          newSuggestions.push({
            id: 'combine-1',
            type: 'combine',
            message: `You have ${workTasks.length} work tasks - consider batching them together.`,
            impact: 'high',
          });
        }
      }

      setInsights(newInsights);
      setSuggestions(newSuggestions);
      startAnimations();
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = async (suggestion: TaskSuggestion) => {
    if (suggestion.action) {
      suggestion.action();
    }
    // Remove the suggestion after applying
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleDismissSuggestion = (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleRefresh = () => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    progressAnim.setValue(0);
    
    // Rotate tip
    setCurrentTip(PRODUCTIVITY_TIPS[Math.floor(Math.random() * PRODUCTIVITY_TIPS.length)]);
    
    fetchInsights();
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return {
    loading,
    stats,
    suggestions,
    insights,
    currentTip,
    fadeAnim,
    slideAnim,
    pulseAnim,
    progressAnim,
    handleApplySuggestion,
    handleDismissSuggestion,
    handleRefresh,
  };
};
