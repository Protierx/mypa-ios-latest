/**
 * Analytics Modal — v3 (Pass 3: Server-Driven)
 *
 * Full-featured analytics screen shown as a 78% bottom sheet from Profile.
 * All data is pulled from GET /analytics-summary via the useAnalytics hook.
 *
 * Layout (top → bottom):
 *   1. Header + Period filter (Today / 7D / 30D / All) — default 7D
 *   2. Hero summary — Productivity Score (0-100) + delta + insight
 *   3. Core outcomes 2×2 grid — Completion Rate, Tasks Done, On-Time %, Focus Time
 *      ∟ each with current value, previous-period value, up/down trend
 *   4. Trend chart — Daily completed tasks bar chart
 *   5. Time Saved — total + task/focus breakdown + period comparison
 *   6. Streak — current + longest + 7-day heatmap + at-risk warning
 *   7. Level & XP — progress bar + XP earned this period
 *   8. Execution Summary — completed, avg time, overdue recovered
 *   9. AI Insights — up to 3 contextual tips with CTAs (server-generated)
 *
 * Color semantics:
 *   Blue   — productivity
 *   Green  — success
 *   Orange — streak
 *   Purple — XP
 *   Amber  — warnings
 *   Red    — critical
 *
 * Data source: useAnalytics() hook → GET /analytics-summary?period=…
 */

import React, { useEffect, useRef } from 'react';
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

import { ACCENT_COLORS, AccentPreset } from '../../state/settingsPreferences';
import { bg, text as textTokens, border as borderTokens } from '../../styles/colors';
import { useAnalytics } from '../../hooks/useAnalytics';

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
  AnalyticsErrorState,
} from './AnalyticsComponentsV3';

// ── Types ────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  accentPreset?: AccentPreset;
}

// ── Main Component ───────────────────────────────────────────

export function AnalyticsModal({ visible, onClose, accentPreset = 'purple' }: Props) {
  const accent = ACCENT_COLORS[accentPreset].primary;

  const {
    data,
    loading,
    error,
    period,
    setPeriod,
    refresh,
    hasData,
  } = useAnalytics('7d');

  // Refresh analytics data whenever the modal becomes visible
  const prevVisibleRef = useRef(false);
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      // Modal just opened — force refresh to get latest data
      refresh();
    }
    prevVisibleRef.current = visible;
  }, [visible, refresh]);

  // ── Render ──────────────────────────────────────────────────

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <Pressable style={styles.overlayTap} onPress={onClose} />

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
                <Ionicons name="close" size={18} color={textTokens.tertiary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Period Filter */}
          <PeriodFilter value={period} onChange={setPeriod} accent={accent} />

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
            ) : error ? (
              <AnalyticsErrorState message={error} onRetry={refresh} />
            ) : !hasData || !data ? (
              <AnalyticsEmptyState />
            ) : (
              <>
                {/* 1. Hero Card */}
                <HeroCard
                  score={data.productivityScore}
                  delta={data.productivityScoreDelta}
                  insight={data.insight}
                  accent={accent}
                />

                {/* 2. Core Outcomes Grid */}
                <SectionLabel title="Core Metrics" />
                <MetricGrid>
                  <MetricCard
                    label="Completion Rate"
                    value={`${data.completionRate}`}
                    unit="%"
                    delta={data.deltas?.completionRate}
                    deltaLabel="pts"
                    prevValue={data.previousStats ? `${data.previousStats.completionRate}%` : undefined}
                    iconName="checkmark-circle-outline"
                    iconColor="#22C55E"
                    iconBg="#F0FDF4"
                  />
                  <MetricCard
                    label="Tasks Completed"
                    value={`${data.tasksCompleted}`}
                    delta={data.deltas?.tasksCompleted}
                    deltaLabel="tasks"
                    prevValue={data.previousStats ? `${data.previousStats.tasksCompleted}` : undefined}
                    iconName="list-outline"
                    iconColor="#3B82F6"
                    iconBg="#EFF6FF"
                  />
                  <MetricCard
                    label="On-Time Rate"
                    value={`${data.onTimeRate}`}
                    unit="%"
                    delta={data.deltas?.onTimeRate}
                    deltaLabel="pts"
                    prevValue={data.previousStats ? `${data.previousStats.onTimeRate}%` : undefined}
                    iconName="alarm-outline"
                    iconColor="#F59E0B"
                    iconBg="#FFFBEB"
                  />
                  <MetricCard
                    label="Focus Time"
                    value={fmtMinutes(data.focusMinutes)}
                    delta={data.deltas?.focusMinutes}
                    deltaLabel="min"
                    prevValue={data.previousStats ? fmtMinutes(data.previousStats.focusMinutes) : undefined}
                    iconName="timer-outline"
                    iconColor="#8EAAD8"
                    iconBg="#F5F3FF"
                  />
                </MetricGrid>

                {/* 3. Trend Chart (skip for today) */}
                {period !== 'today' && data.daily.length > 1 && (
                  <MiniBarChart data={data.daily} accent={accent} period={period} />
                )}

                {/* 4. Time Saved */}
                <SectionLabel title="Progress" />
                <TimeSavedCard
                  totalMinutes={data.timeSaved?.totalMinutes ?? 0}
                  taskMinutes={data.timeSaved?.taskMinutes ?? 0}
                  focusMinutes={data.timeSaved?.focusMinutes ?? 0}
                  prevTotalMinutes={data.timeSaved?.prevTotalMinutes ?? 0}
                />

                {/* 5. Streak */}
                <StreakCard
                  currentStreak={data.streakCurrent}
                  longestStreak={data.streakLongest}
                  weeklyHeat={data.streakHeatmap}
                  dayLabels={data.streakHeatLabels}
                />

                {/* 6. Level & XP */}
                {data.gamification && (
                  <XPCard
                    level={data.gamification.level}
                    xpIntoLevel={data.gamification.xpIntoLevel}
                    xpForNextLevel={data.gamification.xpForNextLevel}
                    totalXp={data.gamification.totalXp}
                    xpGainedThisPeriod={data.xpGained}
                    accent={accent}
                  />
                )}

                {/* 7. Execution Summary */}
                <ExecutionCard
                  completed={data.execution.completed}
                  avgMinutes={data.execution.avgMinutes}
                  overdueRecovered={data.execution.overdueRecovered}
                />

                {/* 8. AI Insights */}
                {data.aiInsights.length > 0 && (
                  <>
                    <SectionLabel title="Insights" />
                    <InsightCardRow insights={data.aiInsights} accent={accent} />
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

// ── Helpers ──────────────────────────────────────────────────

function fmtMinutes(mins: number): string {
  if (mins === 0) return '0m';
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.60)',
    justifyContent: 'flex-end',
  },
  overlayTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: bg.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '78%',
    borderTopWidth: 1,
    borderColor: borderTokens.primary,
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
    backgroundColor: textTokens.disabled,
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
    color: textTokens.primary,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: borderTokens.primary,
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
    color: textTokens.tertiary,
  },
});
