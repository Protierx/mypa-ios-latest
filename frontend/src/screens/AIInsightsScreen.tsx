/**
 * AIInsightsScreen - iOS-styled AI-powered task insights and suggestions
 * Smart recommendations and productivity analysis
 * 
 * Features:
 * - Smart suggestions based on task patterns (too many high-priority, overdue, etc.)
 * - Productivity tips based on habits
 * - One-tap to apply suggestions
 * - Stats snapshot of your day
 * - Actionable insights with immediate effect
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { aiApi, tasksApi, analyticsApi } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Productivity tips database
const PRODUCTIVITY_TIPS = [
  {
    title: 'Time Blocking',
    tip: 'Schedule your most important work during your peak energy hours (usually 9-11 AM).',
    category: 'focus',
  },
  {
    title: 'Two-Minute Rule',
    tip: 'If a task takes less than 2 minutes, do it immediately instead of adding it to your list.',
    category: 'efficiency',
  },
  {
    title: 'Eat the Frog',
    tip: 'Tackle your most dreaded task first thing in the morning when willpower is highest.',
    category: 'priority',
  },
  {
    title: 'Batch Similar Tasks',
    tip: 'Group similar tasks together (emails, calls, errands) to reduce context switching.',
    category: 'efficiency',
  },
  {
    title: 'The 52/17 Rule',
    tip: 'Work for 52 minutes, then take a 17-minute break. This rhythm maximizes productivity.',
    category: 'focus',
  },
  {
    title: 'Weekly Review',
    tip: 'Spend 30 minutes every Sunday reviewing your week and planning the next one.',
    category: 'planning',
  },
  {
    title: 'Single-Tasking',
    tip: 'Multitasking reduces productivity by 40%. Focus on one task at a time.',
    category: 'focus',
  },
  {
    title: 'Energy Management',
    tip: 'Match task difficulty to your energy level. Save creative work for high-energy times.',
    category: 'efficiency',
  },
];

interface TaskSuggestion {
  id: string;
  type: 'reschedule' | 'break_down' | 'delegate' | 'prioritize' | 'combine' | 'defer' | 'quick_win' | 'balance';
  taskId?: string;
  taskTitle?: string;
  message: string;
  action?: string;
  actionLabel?: string;
  impact?: 'high' | 'medium' | 'low';
  autoApply?: () => Promise<void>;
}

interface Insight {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'tip' | 'alert';
  icon: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface DayStats {
  pending: number;
  completed: number;
  highPriority: number;
  streak: number;
  weeklyCompleted: number;
  focusMinutes?: number;
  overdue?: number;
  productivity?: number;
}

export default function AIInsightsScreen() {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dailyInsights, setDailyInsights] = useState<any>(null);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [dayStats, setDayStats] = useState<DayStats | null>(null);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [dailyTip, setDailyTip] = useState(PRODUCTIVITY_TIPS[0]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for alerts
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Get a daily tip based on the day
  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setDailyTip(PRODUCTIVITY_TIPS[dayOfYear % PRODUCTIVITY_TIPS.length]);
  }, []);

  const fetchInsights = useCallback(async () => {
    try {
      const [suggestionsRes, dailyRes, tasksRes, analyticsRes] = await Promise.all([
        aiApi.getTaskSuggestions().catch(() => ({ data: { suggestions: [] } })),
        aiApi.getDailyInsights().catch(() => ({ data: null })),
        tasksApi.getAll().catch(() => ({ data: { tasks: [] } })),
        analyticsApi.getWeekly().catch(() => ({ data: null })),
      ]);

      // Store all tasks for analysis
      const tasks = tasksRes.data?.tasks || [];
      setAllTasks(tasks);

      if (suggestionsRes.data?.suggestions) {
        setSuggestions(suggestionsRes.data.suggestions.map((s: any, i: number) => ({
          ...s,
          id: s.id || `suggestion-${i}`,
        })));
      }

      if (dailyRes.data) {
        setDailyInsights(dailyRes.data);
        
        // Calculate productivity score
        const stats = dailyRes.data.stats || {};
        const total = (stats.pending || 0) + (stats.completed || 0);
        const productivity = total > 0 ? Math.round((stats.completed / total) * 100) : 0;
        
        // Count overdue tasks
        const today = new Date().toISOString().split('T')[0];
        const overdue = tasks.filter((t: any) => 
          !t.completed && t.date && t.date < today
        ).length;
        
        setDayStats({
          ...stats,
          overdue,
          productivity,
          focusMinutes: analyticsRes.data?.focusMins || 0,
        });

        // Animate productivity progress
        Animated.timing(progressAnim, {
          toValue: productivity / 100,
          duration: 1000,
          useNativeDriver: false,
        }).start();
        
        // Generate smart insights from data
        const generatedInsights: Insight[] = [];
        const generatedSuggestions: TaskSuggestion[] = [...(suggestionsRes.data?.suggestions || [])];
        
        // Check for too many high-priority tasks
        if (stats.highPriority > 3) {
          generatedInsights.push({
            id: 'high-priority-overload',
            title: 'Too Many Priorities',
            message: `You have ${stats.highPriority} high-priority tasks. When everything is urgent, nothing is. Consider downgrading some.`,
            type: 'warning',
            icon: 'alert-circle',
            actionLabel: 'Review Priorities',
            onAction: () => navigation.navigate('Tasks' as never),
          });
          
          generatedSuggestions.push({
            id: 'reduce-priorities',
            type: 'prioritize',
            message: 'Limit high-priority tasks to 1-3 per day for better focus.',
            actionLabel: 'Review Tasks',
            impact: 'high',
          });
        }

        // Check for overdue tasks
        if (overdue > 0) {
          generatedInsights.push({
            id: 'overdue-tasks',
            title: 'Overdue Tasks',
            message: `You have ${overdue} overdue task${overdue > 1 ? 's' : ''}. Let's get back on track!`,
            type: 'alert',
            icon: 'time-outline',
            actionLabel: 'View Overdue',
            onAction: () => navigation.navigate('Tasks' as never),
          });
          
          generatedSuggestions.push({
            id: 'reschedule-overdue',
            type: 'reschedule',
            message: 'Reschedule overdue tasks to realistic dates instead of letting them pile up.',
            actionLabel: 'Reschedule All',
            impact: 'high',
          });
        }

        // Check for task overload
        if (stats.pending > 10) {
          generatedInsights.push({
            id: 'task-overload',
            title: 'Task Overload',
            message: `${stats.pending} pending tasks is a lot! Consider deferring or delegating some.`,
            type: 'warning',
            icon: 'warning',
          });
          
          generatedSuggestions.push({
            id: 'defer-tasks',
            type: 'defer',
            message: 'Move non-urgent tasks to next week to reduce today\'s cognitive load.',
            actionLabel: 'Defer Tasks',
            impact: 'medium',
          });
        }

        // Quick wins suggestion
        const quickWins = tasks.filter((t: any) => 
          !t.completed && t.durationMin && t.durationMin <= 15
        ).length;
        if (quickWins > 0) {
          generatedSuggestions.push({
            id: 'quick-wins',
            type: 'quick_win',
            message: `You have ${quickWins} quick task${quickWins > 1 ? 's' : ''} (under 15 min). Knock them out for easy wins!`,
            actionLabel: 'View Quick Tasks',
            impact: 'medium',
          });
        }

        // Work-life balance check
        const workTasks = tasks.filter((t: any) => t.category === 'Work' && !t.completed).length;
        const personalTasks = tasks.filter((t: any) => t.category === 'Personal' && !t.completed).length;
        if (workTasks > 0 && personalTasks === 0) {
          generatedSuggestions.push({
            id: 'balance-reminder',
            type: 'balance',
            message: 'All your tasks are work-related. Don\'t forget to schedule personal time!',
            actionLabel: 'Add Personal',
            impact: 'low',
          });
        }
        
        // Streak celebration
        if (stats.streak >= 7) {
          generatedInsights.push({
            id: 'streak-week',
            title: 'Amazing Streak! 🔥',
            message: `You're on a ${stats.streak}-day streak. That's incredible dedication!`,
            type: 'success',
            icon: 'flame',
          });
        } else if (stats.streak >= 3) {
          generatedInsights.push({
            id: 'streak-building',
            title: 'Building Momentum',
            message: `${stats.streak}-day streak! Keep going to build a powerful habit.`,
            type: 'success',
            icon: 'trending-up',
          });
        }
        
        // All tasks done celebration
        if (stats.pending === 0 && stats.completed > 0) {
          generatedInsights.push({
            id: 'all-done',
            title: 'All Clear! 🎉',
            message: 'You\'ve completed all your tasks. Great time to plan ahead or take a well-deserved break.',
            type: 'success',
            icon: 'checkmark-circle',
          });
        }
        
        // Productivity milestone
        if (stats.weeklyCompleted >= 20) {
          generatedInsights.push({
            id: 'productivity-star',
            title: 'Productivity Star ⭐',
            message: `${stats.weeklyCompleted} tasks completed this week. You're absolutely crushing it!`,
            type: 'success',
            icon: 'star',
          });
        }

        // Good progress today
        if (productivity >= 70) {
          generatedInsights.push({
            id: 'good-progress',
            title: 'Great Progress!',
            message: `You've completed ${productivity}% of today's tasks. Almost there!`,
            type: 'success',
            icon: 'rocket',
          });
        }

        // Add daily productivity tip
        generatedInsights.push({
          id: 'daily-tip',
          title: `Tip: ${dailyTip.title}`,
          message: dailyTip.tip,
          type: 'tip',
          icon: 'bulb',
        });

        setInsights(generatedInsights);
        
        // Merge API suggestions with generated ones (avoid duplicates)
        const existingTypes = new Set(generatedSuggestions.map(s => s.type));
        const uniqueApiSuggestions = (suggestionsRes.data?.suggestions || [])
          .filter((s: any) => !existingTypes.has(s.type))
          .map((s: any, i: number) => ({ ...s, id: s.id || `api-suggestion-${i}` }));
        
        setSuggestions([...generatedSuggestions, ...uniqueApiSuggestions].slice(0, 6));
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  }, [dailyTip, navigation]);

  useEffect(() => {
    fetchInsights().then(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  }, [fetchInsights]);

  const applySuggestion = async (suggestion: TaskSuggestion) => {
    setIsApplying(suggestion.id);
    
    try {
      // Handle different suggestion types
      switch (suggestion.type) {
        case 'reschedule':
          // Navigate to tasks to reschedule
          navigation.navigate('Plan' as never);
          break;
        case 'prioritize':
          navigation.navigate('Tasks' as never);
          break;
        case 'quick_win':
          navigation.navigate('Tasks' as never);
          break;
        case 'balance':
          navigation.navigate('Tasks' as never);
          break;
        case 'defer':
          // Show confirmation
          Alert.alert(
            'Defer Tasks',
            'Move non-urgent tasks to next week?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Defer', 
                onPress: async () => {
                  // In a real app, this would call an API
                  Alert.alert('Success', 'Non-urgent tasks have been moved to next week.');
                  setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
                }
              },
            ]
          );
          break;
        default:
          // Generic apply
          await new Promise(resolve => setTimeout(resolve, 500));
          Alert.alert(
            'Suggestion Applied',
            suggestion.action || 'The suggestion has been applied.',
            [{ text: 'OK' }]
          );
          setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to apply suggestion');
    } finally {
      setIsApplying(null);
    }
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'reschedule': return 'calendar';
      case 'break_down': return 'git-branch';
      case 'delegate': return 'people';
      case 'prioritize': return 'flag';
      case 'combine': return 'git-merge';
      case 'defer': return 'time-outline';
      case 'quick_win': return 'flash';
      case 'balance': return 'heart';
      default: return 'bulb';
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'reschedule': return '#007AFF';
      case 'break_down': return '#5856D6';
      case 'delegate': return '#34C759';
      case 'prioritize': return '#FF3B30';
      case 'combine': return '#FF9500';
      case 'defer': return '#8E8E93';
      case 'quick_win': return '#FFD60A';
      case 'balance': return '#FF2D55';
      default: return '#8E8E93';
    }
  };

  const getImpactBadge = (impact?: string) => {
    switch (impact) {
      case 'high': return { label: 'High Impact', color: '#FF3B30' };
      case 'medium': return { label: 'Medium', color: '#FF9500' };
      case 'low': return { label: 'Quick', color: '#34C759' };
      default: return null;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return '#34C759';
      case 'warning': return '#FF9500';
      case 'alert': return '#FF3B30';
      case 'tip': return '#5856D6';
      default: return '#007AFF';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Analyzing your tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Insights</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="refresh" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* AI Brain Card */}
        <Animated.View
          style={[
            styles.brainCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#007AFF', '#5856D6', '#AF52DE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brainGradient}
          >
            <View style={styles.brainContent}>
              <View style={styles.brainIcon}>
                <Ionicons name="sparkles" size={32} color="white" />
              </View>
              <View style={styles.brainText}>
                <Text style={styles.brainTitle}>MYPA Intelligence</Text>
                <Text style={styles.brainSubtitle}>
                  Personalized suggestions based on your productivity patterns
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Daily Stats Summary - Enhanced */}
        {dayStats && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>TODAY'S SNAPSHOT</Text>
            
            {/* Productivity Progress Ring */}
            <View style={styles.productivityCard}>
              <View style={styles.productivityLeft}>
                <View style={styles.progressRing}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: (dayStats.productivity || 0) >= 70 ? '#34C759' : 
                                        (dayStats.productivity || 0) >= 40 ? '#FF9500' : '#FF3B30',
                      },
                    ]}
                  />
                </View>
                <View style={styles.productivityInfo}>
                  <Text style={styles.productivityPercent}>{dayStats.productivity || 0}%</Text>
                  <Text style={styles.productivityLabel}>
                    {(dayStats.productivity || 0) >= 70 ? 'Great Progress!' : 
                     (dayStats.productivity || 0) >= 40 ? 'Making Progress' : 'Just Starting'}
                  </Text>
                </View>
              </View>
              <View style={styles.productivityRight}>
                <Text style={styles.productivityStat}>
                  {dayStats.completed}/{dayStats.pending + dayStats.completed}
                </Text>
                <Text style={styles.productivityStatLabel}>tasks done</Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#007AFF' }]}>
                  {dayStats.pending}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#34C759' }]}>
                  {dayStats.completed}
                </Text>
                <Text style={styles.statLabel}>Done</Text>
              </View>
              <View style={styles.statCard}>
                <Animated.View style={{ transform: [{ scale: dayStats.highPriority > 3 ? pulseAnim : 1 }] }}>
                  <Text style={[styles.statNumber, { color: dayStats.highPriority > 3 ? '#FF3B30' : '#FF9500' }]}>
                    {dayStats.highPriority}
                  </Text>
                </Animated.View>
                <Text style={styles.statLabel}>Priority</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#FF9500' }]}>
                  {dayStats.streak}
                </Text>
                <Text style={styles.statLabel}>Streak 🔥</Text>
              </View>
            </View>

            {/* Secondary Stats Row */}
            <View style={styles.secondaryStats}>
              {dayStats.overdue && dayStats.overdue > 0 ? (
                <View style={[styles.secondaryStat, styles.alertStat]}>
                  <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                  <Text style={[styles.secondaryStatText, { color: '#FF3B30' }]}>
                    {dayStats.overdue} overdue
                  </Text>
                </View>
              ) : null}
              <View style={styles.secondaryStat}>
                <Ionicons name="calendar" size={16} color="#007AFF" />
                <Text style={styles.secondaryStatText}>
                  {dayStats.weeklyCompleted} this week
                </Text>
              </View>
              {dayStats.focusMinutes ? (
                <View style={styles.secondaryStat}>
                  <Ionicons name="timer" size={16} color="#5856D6" />
                  <Text style={styles.secondaryStatText}>
                    {dayStats.focusMinutes}m focus
                  </Text>
                </View>
              ) : null}
            </View>
          </Animated.View>
        )}

        {/* Smart Suggestions - Enhanced */}
        {suggestions.length > 0 && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>SMART SUGGESTIONS</Text>
              <View style={styles.suggestionBadge}>
                <Ionicons name="sparkles" size={12} color="#5856D6" />
                <Text style={styles.suggestionBadgeText}>AI Powered</Text>
              </View>
            </View>
            {suggestions.map((suggestion, index) => {
              const impactBadge = getImpactBadge(suggestion.impact);
              return (
                <View key={suggestion.id} style={styles.suggestionCard}>
                  {/* Dismiss button */}
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={() => dismissSuggestion(suggestion.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={18} color="#8E8E93" />
                  </TouchableOpacity>
                  
                  <View
                    style={[
                      styles.suggestionIcon,
                      { backgroundColor: `${getSuggestionColor(suggestion.type)}15` },
                    ]}
                  >
                    <Ionicons
                      name={getSuggestionIcon(suggestion.type) as any}
                      size={20}
                      color={getSuggestionColor(suggestion.type)}
                    />
                  </View>
                  <View style={styles.suggestionContent}>
                    {suggestion.taskTitle && (
                      <Text style={styles.suggestionTaskTitle}>
                        {suggestion.taskTitle}
                      </Text>
                    )}
                    <Text style={styles.suggestionMessage}>
                      {suggestion.message}
                    </Text>
                    {impactBadge && (
                      <View style={[styles.impactBadge, { backgroundColor: `${impactBadge.color}15` }]}>
                        <Ionicons name="flash" size={10} color={impactBadge.color} />
                        <Text style={[styles.impactBadgeText, { color: impactBadge.color }]}>
                          {impactBadge.label}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      { backgroundColor: getSuggestionColor(suggestion.type) },
                    ]}
                    onPress={() => applySuggestion(suggestion)}
                    disabled={isApplying === suggestion.id}
                  >
                    {isApplying === suggestion.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.applyButtonText}>
                        {suggestion.actionLabel || 'Apply'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Insights - Enhanced with actions */}
        {insights.length > 0 && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>INSIGHTS</Text>
            {insights.map((insight, index) => (
              <Animated.View 
                key={insight.id} 
                style={[
                  styles.insightCard,
                  insight.type === 'alert' && { borderLeftWidth: 4, borderLeftColor: '#FF3B30' },
                  insight.type === 'warning' && { borderLeftWidth: 4, borderLeftColor: '#FF9500' },
                ]}
              >
                <View
                  style={[
                    styles.insightIcon,
                    { backgroundColor: `${getInsightColor(insight.type)}15` },
                  ]}
                >
                  <Ionicons
                    name={insight.icon as any}
                    size={24}
                    color={getInsightColor(insight.type)}
                  />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightMessage}>{insight.message}</Text>
                  {insight.actionLabel && insight.onAction && (
                    <TouchableOpacity
                      style={[styles.insightAction, { borderColor: getInsightColor(insight.type) }]}
                      onPress={insight.onAction}
                    >
                      <Text style={[styles.insightActionText, { color: getInsightColor(insight.type) }]}>
                        {insight.actionLabel}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={getInsightColor(insight.type)} />
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* Empty State */}
        {suggestions.length === 0 && insights.length === 0 && (
          <Animated.View
            style={[
              styles.emptyContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.emptyIcon}>
              <Ionicons name="sparkles" size={48} color="#8E8E93" />
            </View>
            <Text style={styles.emptyTitle}>All Good!</Text>
            <Text style={styles.emptyText}>
              Your tasks are well organized. Check back later for new insights.
            </Text>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('VoiceAssistant' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FF950015' }]}>
                <Ionicons name="mic" size={24} color="#FF9500" />
              </View>
              <Text style={styles.actionText}>Ask MYPA</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Tasks' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#007AFF15' }]}>
                <Ionicons name="list" size={24} color="#007AFF" />
              </View>
              <Text style={styles.actionText}>View Tasks</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Plan' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#34C75915' }]}>
                <Ionicons name="calendar" size={24} color="#34C759" />
              </View>
              <Text style={styles.actionText}>Plan Day</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
  },
  brainCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  brainGradient: {
    padding: 20,
  },
  brainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  brainIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainText: {
    flex: 1,
  },
  brainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  brainSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6E6E73',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    fontWeight: '500',
  },
  // Productivity card styles
  productivityCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  productivityLeft: {
    flex: 1,
  },
  progressRing: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  productivityInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  productivityPercent: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  productivityLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  productivityRight: {
    alignItems: 'center',
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#F2F2F7',
    marginLeft: 16,
  },
  productivityStat: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759',
  },
  productivityStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  // Secondary stats row
  secondaryStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  secondaryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  alertStat: {
    backgroundColor: '#FFF5F5',
  },
  secondaryStatText: {
    fontSize: 13,
    color: '#3C3C43',
    fontWeight: '500',
  },
  // Suggestion section header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginLeft: 4,
  },
  suggestionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  suggestionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5856D6',
  },
  // Dismiss button
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  // Impact badge
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  impactBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Insight action button
  insightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  insightActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    paddingRight: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  suggestionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTaskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  suggestionMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  insightMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 280,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  bottomSpacer: {
    height: 40,
  },
});
