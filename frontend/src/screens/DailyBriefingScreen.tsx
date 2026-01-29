/**
 * DailyBriefingScreen - iOS-styled AI-powered daily briefing
 * Beautiful morning/evening summary with insights and tasks
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { aiApi, tasksApi, analyticsApi } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Time-based colors
const getTimeColors = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    // Morning
    return {
      gradient: ['#FF9500', '#FF6B00', '#FF3B30'],
      accent: '#FF9500',
      bg: '#FFF9F0',
    };
  } else if (hour >= 12 && hour < 17) {
    // Afternoon
    return {
      gradient: ['#007AFF', '#5856D6', '#AF52DE'],
      accent: '#007AFF',
      bg: '#F0F6FF',
    };
  } else if (hour >= 17 && hour < 21) {
    // Evening
    return {
      gradient: ['#AF52DE', '#FF6B9D', '#FF9500'],
      accent: '#AF52DE',
      bg: '#F5F0FF',
    };
  } else {
    // Night
    return {
      gradient: ['#5856D6', '#007AFF', '#34C759'],
      accent: '#5856D6',
      bg: '#F0F0FF',
    };
  }
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
};

interface BriefingData {
  greeting?: string;
  insights?: string[];
  tip?: string;
  stats?: {
    pending: number;
    completed: number;
    highPriority: number;
    streak: number;
    weeklyCompleted: number;
  };
}

interface Task {
  id: string;
  title: string;
  priority: string;
  category: string;
  completed: boolean;
  time?: string;
}

export default function DailyBriefingScreen() {
  const navigation = useNavigation();
  const colors = getTimeColors();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [briefing, setBriefing] = useState<BriefingData>({});
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const fetchBriefing = useCallback(async () => {
    try {
      const [insightsRes, tasksRes, analyticsRes] = await Promise.all([
        aiApi.getDailyInsights(),
        tasksApi.getToday(),
        analyticsApi.getWeekly().catch(() => ({ data: null })),
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#FF3B30';
      case 'NORMAL': return '#FF9500';
      case 'LOW': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      Work: '💼',
      Personal: '🏠',
      Health: '💪',
      Finance: '💰',
      Learning: '📚',
      Social: '👥',
    };
    return emojis[category] || '📋';
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.accent }]}>
          Preparing your briefing...
        </Text>
      </View>
    );
  }

  const pendingTasks = todaysTasks.filter(t => !t.completed);
  const completedTasks = todaysTasks.filter(t => t.completed);
  const highPriorityTasks = pendingTasks.filter(t => t.priority === 'HIGH');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={colors.gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
              
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>
                  {briefing.greeting || getGreeting()}
                </Text>
                <Text style={styles.dateText}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>
                    {pendingTasks.length}
                  </Text>
                  <Text style={styles.quickStatLabel}>Tasks</Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatNumber}>
                    {briefing.stats?.streak || 0}
                  </Text>
                  <Text style={styles.quickStatLabel}>🔥 Streak</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* AI Insights */}
        {briefing.insights && briefing.insights.length > 0 && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={20} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.accent }]}>
                Today's Insights
              </Text>
            </View>
            <View style={styles.insightsCard}>
              {briefing.insights.map((insight, index) => (
                <View key={index} style={styles.insightRow}>
                  <View style={[styles.insightDot, { backgroundColor: colors.accent }]} />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
              {briefing.tip && (
                <View style={[styles.tipContainer, { backgroundColor: `${colors.accent}15` }]}>
                  <Ionicons name="bulb" size={18} color={colors.accent} />
                  <Text style={[styles.tipText, { color: colors.accent }]}>
                    {briefing.tip}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* High Priority Tasks */}
        {highPriorityTasks.length > 0 && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={20} color="#FF3B30" />
              <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>
                Priority Focus
              </Text>
            </View>
            <View style={[styles.priorityCard, { borderLeftColor: '#FF3B30' }]}>
              {highPriorityTasks.map((task, index) => (
                <View key={task.id} style={styles.priorityTask}>
                  <Text style={styles.priorityEmoji}>
                    {getCategoryEmoji(task.category)}
                  </Text>
                  <View style={styles.priorityTaskContent}>
                    <Text style={styles.priorityTaskTitle}>{task.title}</Text>
                    {task.time && (
                      <Text style={styles.priorityTaskTime}>
                        <Ionicons name="time-outline" size={12} color="#8E8E93" />
                        {' '}{task.time}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Today's Schedule */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>
              Today's Schedule
            </Text>
            <Text style={styles.taskCount}>
              {completedTasks.length}/{todaysTasks.length} done
            </Text>
          </View>

          {pendingTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptyText}>
                You've completed all your tasks for today
              </Text>
            </View>
          ) : (
            <View style={styles.tasksCard}>
              {pendingTasks.slice(0, 5).map((task, index) => (
                <View key={task.id} style={styles.taskRow}>
                  <View
                    style={[
                      styles.taskPriorityIndicator,
                      { backgroundColor: getPriorityColor(task.priority) },
                    ]}
                  />
                  <Text style={styles.taskEmoji}>
                    {getCategoryEmoji(task.category)}
                  </Text>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Text style={styles.taskMeta}>
                      {task.time || 'Any time'} • {task.category}
                    </Text>
                  </View>
                </View>
              ))}
              {pendingTasks.length > 5 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('Tasks' as never)}
                >
                  <Text style={[styles.viewAllText, { color: colors.accent }]}>
                    View all {pendingTasks.length} tasks
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.accent} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>

        {/* Weekly Progress */}
        {weeklyStats && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up" size={20} color="#34C759" />
              <Text style={[styles.sectionTitle, { color: '#34C759' }]}>
                This Week
              </Text>
            </View>
            <View style={styles.weeklyCard}>
              <View style={styles.weeklyStats}>
                <View style={styles.weeklyStat}>
                  <Text style={styles.weeklyStatNumber}>
                    {weeklyStats.tasksCompleted || 0}
                  </Text>
                  <Text style={styles.weeklyStatLabel}>Completed</Text>
                </View>
                <View style={styles.weeklyStat}>
                  <Text style={styles.weeklyStatNumber}>
                    {weeklyStats.focusMins || 0}
                  </Text>
                  <Text style={styles.weeklyStatLabel}>Focus mins</Text>
                </View>
                <View style={styles.weeklyStat}>
                  <Text style={styles.weeklyStatNumber}>
                    {weeklyStats.xpEarned || 0}
                  </Text>
                  <Text style={styles.weeklyStatLabel}>XP earned</Text>
                </View>
              </View>
              
              {/* Simple Week Overview */}
              <View style={styles.weekDays}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                  const isToday = i === (new Date().getDay() + 6) % 7;
                  const hasActivity = weeklyStats.dailyData?.[i]?.completed > 0;
                  
                  return (
                    <View key={i} style={styles.weekDay}>
                      <View
                        style={[
                          styles.weekDayDot,
                          hasActivity && styles.weekDayDotActive,
                          isToday && [styles.weekDayDotToday, { borderColor: colors.accent }],
                        ]}
                      />
                      <Text
                        style={[
                          styles.weekDayLabel,
                          isToday && { color: colors.accent, fontWeight: '600' },
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: '#007AFF15' }]}
              onPress={() => navigation.navigate('Tasks' as never)}
            >
              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              <Text style={[styles.quickActionText, { color: '#007AFF' }]}>Tasks</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: '#FF950015' }]}
              onPress={() => navigation.navigate('VoiceAssistant' as never)}
            >
              <Ionicons name="mic" size={24} color="#FF9500" />
              <Text style={[styles.quickActionText, { color: '#FF9500' }]}>MYPA</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: '#34C75915' }]}
              onPress={() => navigation.navigate('Analytics' as never)}
            >
              <Ionicons name="stats-chart" size={24} color="#34C759" />
              <Text style={[styles.quickActionText, { color: '#34C759' }]}>Stats</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: '#AF52DE15' }]}
              onPress={() => navigation.navigate('Plan' as never)}
            >
              <Ionicons name="calendar" size={24} color="#AF52DE" />
              <Text style={[styles.quickActionText, { color: '#AF52DE' }]}>Plan</Text>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    gap: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingContainer: {
    gap: 4,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  },
  dateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    gap: 20,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  quickStatLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  taskCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  insightsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  priorityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  priorityTask: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  priorityEmoji: {
    fontSize: 24,
  },
  priorityTaskContent: {
    flex: 1,
  },
  priorityTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  priorityTaskTime: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  tasksCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#F9F9FB',
  },
  taskPriorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  taskEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  taskMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
  },
  weeklyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  weeklyStat: {
    alignItems: 'center',
  },
  weeklyStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  weeklyStatLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  weekDay: {
    alignItems: 'center',
    gap: 6,
  },
  weekDayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
  },
  weekDayDotActive: {
    backgroundColor: '#34C759',
  },
  weekDayDotToday: {
    borderWidth: 2,
  },
  weekDayLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
