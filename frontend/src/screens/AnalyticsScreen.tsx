/**
 * Analytics Screen
 * Productivity metrics, trends, and insights with iOS-style design
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { analyticsApi } from '../services/api';

const { width } = Dimensions.get('window');

// Colors
const Colors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  secondary: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  textMuted: '#AEAEB2',
  border: '#E5E5EA',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
};

interface AnalyticsScreenProps {
  navigation?: any;
}

interface DailyStats {
  date: string;
  tasksCompleted: number;
  tasksCreated: number;
  focusMinutes: number;
  xpEarned: number;
  streak: number;
}

interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalTasksCompleted: number;
  totalFocusMinutes: number;
  totalXpEarned: number;
  averageTasksPerDay: number;
  mostProductiveDay: string;
  categoryBreakdown: { category: string; count: number; percentage: number }[];
  priorityBreakdown: { priority: string; count: number; percentage: number }[];
}

interface UserInsights {
  currentLevel: number;
  xpToNextLevel: number;
  totalXp: number;
  lifetimeStats: {
    tasksCompleted: number;
    focusMinutes: number;
    challengesWon: number;
    longestStreak: number;
    daysActive: number;
  };
  recentMilestones: string[];
}

interface ProductivityTrends {
  last7Days: DailyStats[];
  completionRate: number;
  averageFocusTime: number;
  peakHours: { hour: number; completions: number }[];
}

export function AnalyticsScreen({ navigation }: AnalyticsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
  
  // Data
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [trends, setTrends] = useState<ProductivityTrends | null>(null);

  const fetchData = async () => {
    try {
      const [dailyRes, weeklyRes, insightsRes, trendsRes] = await Promise.all([
        analyticsApi.getDaily(),
        analyticsApi.getWeekly(),
        analyticsApi.getInsights(),
        analyticsApi.getTrends(),
      ]);

      if (dailyRes.success) setDailyStats(dailyRes.data);
      if (weeklyRes.success) setWeeklyStats(weeklyRes.data);
      if (insightsRes.success) setInsights(insightsRes.data);
      if (trendsRes.success) setTrends(trendsRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['day', 'week', 'month'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodOption, selectedPeriod === period && styles.periodOptionActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: Colors.primary }]}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <Feather name="check-circle" size={24} color="#FFFFFF" />
              <Text style={styles.summaryValue}>
                {selectedPeriod === 'day' ? dailyStats?.tasksCompleted || 0 : weeklyStats?.totalTasksCompleted || 0}
              </Text>
              <Text style={styles.summaryLabel}>Tasks Done</Text>
            </LinearGradient>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: Colors.success }]}>
            <LinearGradient
              colors={[Colors.success, '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <Feather name="clock" size={24} color="#FFFFFF" />
              <Text style={styles.summaryValue}>
                {formatMinutes(selectedPeriod === 'day' ? dailyStats?.focusMinutes || 0 : weeklyStats?.totalFocusMinutes || 0)}
              </Text>
              <Text style={styles.summaryLabel}>Focus Time</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: Colors.warning }]}>
            <LinearGradient
              colors={[Colors.warning, '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <Feather name="zap" size={24} color="#FFFFFF" />
              <Text style={styles.summaryValue}>
                {selectedPeriod === 'day' ? dailyStats?.xpEarned || 0 : weeklyStats?.totalXpEarned || 0}
              </Text>
              <Text style={styles.summaryLabel}>XP Earned</Text>
            </LinearGradient>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: '#EC4899' }]}>
            <LinearGradient
              colors={['#EC4899', '#DB2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <Feather name="trending-up" size={24} color="#FFFFFF" />
              <Text style={styles.summaryValue}>{trends?.completionRate || 0}%</Text>
              <Text style={styles.summaryLabel}>Completion</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Weekly Trend Chart */}
        {trends && trends.last7Days.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Last 7 Days</Text>
            <View style={styles.chartContainer}>
              {trends.last7Days.map((day, index) => {
                const maxCompleted = Math.max(...trends.last7Days.map(d => d.tasksCompleted), 1);
                const height = (day.tasksCompleted / maxCompleted) * 100;
                const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                
                return (
                  <View key={index} style={styles.chartBar}>
                    <View style={styles.barContainer}>
                      <LinearGradient
                        colors={[Colors.primary, Colors.secondary]}
                        style={[styles.bar, { height: `${Math.max(height, 5)}%` }]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{dayName}</Text>
                    <Text style={styles.barValue}>{day.tasksCompleted}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Category Breakdown */}
        {weeklyStats?.categoryBreakdown && weeklyStats.categoryBreakdown.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Categories</Text>
            {weeklyStats.categoryBreakdown.map((cat, index) => {
              const categoryColors: Record<string, string> = {
                Work: '#8B5CF6',
                Personal: '#10B981',
                Health: '#EC4899',
                Finance: '#F59E0B',
                Learning: '#6366F1',
                Social: '#14B8A6',
              };
              const color = categoryColors[cat.category] || Colors.textSecondary;
              
              return (
                <View key={index} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: color }]} />
                    <Text style={styles.categoryName}>{cat.category}</Text>
                  </View>
                  <View style={styles.categoryStats}>
                    <View style={styles.categoryBarBackground}>
                      <View style={[styles.categoryBar, { width: `${cat.percentage}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.categoryCount}>{cat.count}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Peak Hours */}
        {trends?.peakHours && trends.peakHours.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Most Productive Hours</Text>
            {trends.peakHours.slice(0, 3).map((peak, index) => (
              <View key={index} style={styles.peakHourRow}>
                <View style={styles.peakHourRank}>
                  <Text style={styles.peakHourRankText}>{index + 1}</Text>
                </View>
                <View style={styles.peakHourInfo}>
                  <Text style={styles.peakHourTime}>{formatHour(peak.hour)}</Text>
                  <Text style={styles.peakHourDesc}>{peak.completions} tasks completed</Text>
                </View>
                <Feather 
                  name={index === 0 ? 'award' : 'clock'} 
                  size={20} 
                  color={index === 0 ? Colors.warning : Colors.textMuted} 
                />
              </View>
            ))}
          </View>
        )}

        {/* Lifetime Stats */}
        {insights && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lifetime Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{insights.lifetimeStats.tasksCompleted}</Text>
                <Text style={styles.statLabel}>Tasks Done</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatMinutes(insights.lifetimeStats.focusMinutes)}</Text>
                <Text style={styles.statLabel}>Focus Time</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{insights.lifetimeStats.longestStreak}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{insights.lifetimeStats.daysActive}</Text>
                <Text style={styles.statLabel}>Days Active</Text>
              </View>
            </View>
          </View>
        )}

        {/* Milestones */}
        {insights?.recentMilestones && insights.recentMilestones.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Milestones</Text>
            {insights.recentMilestones.map((milestone, index) => (
              <View key={index} style={styles.milestoneRow}>
                <Text style={styles.milestoneText}>{milestone}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Level Progress */}
        {insights && (
          <View style={styles.card}>
            <View style={styles.levelHeader}>
              <Text style={styles.cardTitle}>Level {insights.currentLevel}</Text>
              <Text style={styles.xpText}>{insights.totalXp} XP</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBar,
                  { width: `${Math.min(100, ((insights.totalXp % 1000) / 1000) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {insights.xpToNextLevel} XP to Level {insights.currentLevel + 1}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  periodOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodOptionActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientCard: {
    padding: 16,
    alignItems: 'flex-start',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    width: 24,
    height: 80,
    backgroundColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 12,
  },
  barLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.5,
  },
  categoryBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    width: 30,
    textAlign: 'right',
  },
  peakHourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  peakHourRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  peakHourRankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  peakHourInfo: {
    flex: 1,
  },
  peakHourTime: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  peakHourDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  milestoneRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  milestoneText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AnalyticsScreen;
