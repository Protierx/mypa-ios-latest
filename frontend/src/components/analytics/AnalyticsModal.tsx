/**
 * Analytics Modal — v2 (Production-Ready)
 *
 * Full-featured analytics screen shown as a 78% bottom sheet from Profile.
 * Designed for retention with actionable insights and clear hierarchy.
 *
 * Layout (top → bottom):
 *   1. Header + Period filter (Today / 7D / 30D / All)
 *   2. Hero summary — Productivity Score + delta + insight
 *   3. Core outcomes 2×2 grid — Completion Rate, Tasks Done, On-Time %, Focus Time
 *   4. Trend chart — Daily completed tasks bar chart
 *   5. Time Saved — total + task/focus breakdown + period comparison
 *   6. Streak — current + longest + 7-day heatmap + at-risk warning
 *   7. Level & XP — progress bar + milestone
 *   8. Execution Summary — completed, avg time, overdue recovered
 *   9. AI Insights — up to 3 contextual tips with CTAs
 *
 * Data sources:
 *   - useTasks()       → task completion, timing, priority
 *   - useFocusSessions → focus minutes
 *   - useSupabaseAuth  → user level, XP, streak
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useFocusSessions } from '../../hooks/supabase/useFocusSessions';
import { useTasks } from '../../hooks/supabase/useTasks';
import { ACCENT_COLORS, AccentPreset } from '../../state/settingsPreferences';

import {
  AnalyticsRange,
  isInRange,
  isInDateRange,
  previousPeriodStart,
  completionRate,
  onTimeRate,
  productivityScore,
  periodDelta,
  heroInsight,
  dailyCompletedSeries,
  formatMinutes,
  generateInsights,
} from './analyticsHelpers';

import {
  PeriodFilter,
  SectionLabel,
  HeroCard,
  MetricCard,
  MetricGrid,
  MiniBarChart,
  TimeSavedCard,
  StreakCard,
  XPCard,
  ExecutionCard,
  InsightCardRow,
  AnalyticsEmptyState,
} from './AnalyticsComponents';

// ── Types ────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  accentPreset?: AccentPreset;
}

// ── Main Component ───────────────────────────────────────────

export function AnalyticsModal({ visible, onClose, accentPreset = 'purple' }: Props) {
  const [range, setRange] = useState<AnalyticsRange>('7d');
  const { user } = useSupabaseAuth();
  const { sessions, loading: sessionsLoading } = useFocusSessions();
  const { tasks, loading: tasksLoading } = useTasks();

  const accent = ACCENT_COLORS[accentPreset].primary;
  const loading = sessionsLoading || tasksLoading;

  // ── Current-period stats ────────────────────────────────────

  const stats = useMemo(() => {
    const allRangeTasks = tasks.filter((t) =>
      isInRange(t.completed_at || t.updated_at, range) || isInRange(t.created_at, range),
    );
    const completedTasks = tasks.filter(
      (t) => t.status === 'completed' && isInRange(t.completed_at || t.updated_at, range),
    );
    const totalTasks = allRangeTasks.filter((t) => t.status === 'completed' || t.status === 'pending');
    const rangeSessions = sessions.filter((s) => isInRange(s.started_at, range));

    // Core metrics
    const completedCount = completedTasks.length;
    const totalCount = totalTasks.length;
    const compRate = completionRate(completedCount, totalCount);
    const onTime = onTimeRate(completedTasks);

    // Time
    const taskMinutes = completedTasks.reduce((s, t) => s + (t.estimated_duration || 0), 0);
    const focusMinutes = rangeSessions.reduce((s, sess) => s + (sess.duration_actual || 0), 0);
    const totalSaved = taskMinutes + focusMinutes;

    // Execution
    const avgCompletion = completedCount > 0
      ? Math.round(taskMinutes / completedCount)
      : 0;
    const overdueRecovered = completedTasks.filter((t) => {
      if (!t.due_date || !t.completed_at) return false;
      return new Date(t.completed_at) > new Date(t.due_date);
    }).length;

    return {
      completedCount,
      totalCount,
      compRate,
      onTime,
      taskMinutes,
      focusMinutes,
      totalSaved,
      avgCompletion,
      overdueRecovered,
    };
  }, [tasks, sessions, range]);

  // ── Previous-period stats for deltas ────────────────────────

  const prevStats = useMemo(() => {
    const prev = previousPeriodStart(range);
    if (!prev) return null;

    const completedTasks = tasks.filter(
      (t) =>
        t.status === 'completed' &&
        isInDateRange(t.completed_at || t.updated_at, prev.start, prev.end),
    );
    const allPrevTasks = tasks.filter(
      (t) =>
        (isInDateRange(t.completed_at || t.updated_at, prev.start, prev.end) ||
          isInDateRange(t.created_at, prev.start, prev.end)) &&
        (t.status === 'completed' || t.status === 'pending'),
    );
    const rangeSessions = sessions.filter((s) =>
      isInDateRange(s.started_at, prev.start, prev.end),
    );

    const completedCount = completedTasks.length;
    const compRate = completionRate(completedCount, allPrevTasks.length);
    const onTime = onTimeRate(completedTasks);
    const taskMinutes = completedTasks.reduce((s, t) => s + (t.estimated_duration || 0), 0);
    const focusMinutes = rangeSessions.reduce((s, sess) => s + (sess.duration_actual || 0), 0);
    const totalSaved = taskMinutes + focusMinutes;

    return { completedCount, compRate, onTime, focusMinutes, totalSaved };
  }, [tasks, sessions, range]);

  // ── Productivity score ──────────────────────────────────────

  const currentStreak = user?.currentStreak ?? 0;
  const longestStreak = user?.longestStreak ?? 0;

  const score = useMemo(
    () =>
      productivityScore({
        completionRate: stats.compRate,
        onTimeRate: stats.onTime,
        focusMinutes: stats.focusMinutes,
        streakDays: currentStreak,
      }),
    [stats, currentStreak],
  );

  const prevScore = useMemo(() => {
    if (!prevStats) return score;
    return productivityScore({
      completionRate: prevStats.compRate,
      onTimeRate: prevStats.onTime,
      focusMinutes: prevStats.focusMinutes,
      streakDays: Math.max(currentStreak - 1, 0),
    });
  }, [prevStats, currentStreak, score]);

  const scoreDelta = periodDelta(score, prevScore);

  // ── Insight text ────────────────────────────────────────────

  const insight = heroInsight({
    completionRate: stats.compRate,
    onTimeRate: stats.onTime,
    streakDays: currentStreak,
    completedCount: stats.completedCount,
  });

  // ── Chart data ──────────────────────────────────────────────

  const chartData = useMemo(
    () => dailyCompletedSeries(tasks, range),
    [tasks, range],
  );

  // ── 7-day streak heatmap ────────────────────────────────────

  const { weeklyHeat, dayLabels } = useMemo(() => {
    const heat: boolean[] = [];
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      heat.push(
        tasks.some(
          (t) => t.status === 'completed' && t.completed_at?.startsWith(dayStr),
        ),
      );
      labels.push(['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()]);
    }
    return { weeklyHeat: heat, dayLabels: labels };
  }, [tasks]);

  // ── XP ──────────────────────────────────────────────────────

  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const xpForNext = level * 100;

  // ── AI Insights ─────────────────────────────────────────────

  const insights = useMemo(
    () =>
      generateInsights({
        completionRate: stats.compRate,
        onTimeRate: stats.onTime,
        completedCount: stats.completedCount,
        overdueCount: stats.overdueRecovered,
        streakDays: currentStreak,
        focusMinutes: stats.focusMinutes,
        range,
      }),
    [stats, currentStreak, range],
  );

  // ── Deltas ──────────────────────────────────────────────────

  const compRateDelta = prevStats ? periodDelta(stats.compRate, prevStats.compRate) : undefined;
  const tasksDelta = prevStats ? periodDelta(stats.completedCount, prevStats.completedCount) : undefined;
  const onTimeDelta = prevStats ? periodDelta(stats.onTime, prevStats.onTime) : undefined;
  const focusDelta = prevStats ? periodDelta(stats.focusMinutes, prevStats.focusMinutes) : undefined;

  const hasData = stats.completedCount > 0 || sessions.length > 0;

  // ── Render ──────────────────────────────────────────────────

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        {/* Tapping the dark area above the sheet closes it */}
        <Pressable style={styles.overlayTap} onPress={onClose} />

        {/* Sheet — plain View so it never steals scroll gestures */}
        <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Analytics</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close analytics"
                accessibilityRole="button"
              >
                <View style={styles.closeBtn}>
                  <Ionicons name="close" size={18} color="#8E8E93" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Period Filter */}
            <PeriodFilter value={range} onChange={setRange} accent={accent} />

            {/* Content */}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={accent} />
                  <Text style={styles.loadingText}>Loading analytics…</Text>
                </View>
              ) : !hasData ? (
                <AnalyticsEmptyState />
              ) : (
                <>
                  {/* 1. Hero Card */}
                  <HeroCard
                    score={score}
                    delta={scoreDelta}
                    insight={insight}
                    accent={accent}
                  />

                  {/* 2. Core Outcomes Grid */}
                  <SectionLabel title="Core Metrics" />
                  <MetricGrid>
                    <MetricCard
                      label="Completion Rate"
                      value={`${stats.compRate}`}
                      unit="%"
                      delta={compRateDelta}
                      deltaLabel="pts"
                      iconName="checkmark-circle-outline"
                      iconColor="#22C55E"
                      iconBg="#F0FDF4"
                    />
                    <MetricCard
                      label="Tasks Completed"
                      value={`${stats.completedCount}`}
                      delta={tasksDelta}
                      deltaLabel="tasks"
                      iconName="list-outline"
                      iconColor="#3B82F6"
                      iconBg="#EFF6FF"
                    />
                    <MetricCard
                      label="On-Time Rate"
                      value={`${stats.onTime}`}
                      unit="%"
                      delta={onTimeDelta}
                      deltaLabel="pts"
                      iconName="alarm-outline"
                      iconColor="#F59E0B"
                      iconBg="#FFFBEB"
                    />
                    <MetricCard
                      label="Focus Time"
                      value={formatMinutes(stats.focusMinutes)}
                      delta={focusDelta}
                      deltaLabel="min"
                      iconName="timer-outline"
                      iconColor="#8B5CF6"
                      iconBg="#F5F3FF"
                    />
                  </MetricGrid>

                  {/* 3. Trend Chart (only for 7D/30D/All) */}
                  {range !== 'today' && chartData.length > 1 && (
                    <MiniBarChart
                      data={chartData}
                      accent={accent}
                      height={range === '30d' || range === 'all' ? 80 : 100}
                    />
                  )}

                  {/* 4. Time Saved */}
                  <SectionLabel title="Progress" />
                  <TimeSavedCard
                    totalMinutes={stats.totalSaved}
                    taskMinutes={stats.taskMinutes}
                    focusMinutes={stats.focusMinutes}
                    prevTotalMinutes={prevStats?.totalSaved ?? 0}
                  />

                  {/* 5. Streak */}
                  <StreakCard
                    currentStreak={currentStreak}
                    longestStreak={longestStreak}
                    weeklyHeat={weeklyHeat}
                    dayLabels={dayLabels}
                  />

                  {/* 6. Level & XP */}
                  <XPCard
                    level={level}
                    xp={xp}
                    xpForNext={xpForNext}
                    accent={accent}
                  />

                  {/* 7. Execution Summary */}
                  <ExecutionCard
                    completed={stats.completedCount}
                    avgMinutes={stats.avgCompletion}
                    overdueRecovered={stats.overdueRecovered}
                  />

                  {/* 8. AI Insights */}
                  {insights.length > 0 && (
                    <>
                      <SectionLabel title="Insights" />
                      <InsightCardRow
                        insights={insights}
                        accent={accent}
                      />
                    </>
                  )}
                </>
              )}
            </ScrollView>

            <SafeAreaView edges={['bottom']} />
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  overlayTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#F8F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '78%',
    borderTopWidth: 1,
    borderColor: '#EEEEF0',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C7C7CC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
  },
});
