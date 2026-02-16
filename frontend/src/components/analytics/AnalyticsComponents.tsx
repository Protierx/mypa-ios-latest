/**
 * Analytics Sub-Components
 *
 * Modular building blocks for the Analytics screen.
 * Each component is self-contained with inline styles.
 *
 * Components:
 *   - PeriodFilter        – range chip selector
 *   - HeroCard            – productivity score + delta + insight
 *   - MetricCard          – single KPI with trend
 *   - MetricGrid          – 2×2 layout for MetricCards
 *   - MiniBarChart        – lightweight bar chart for trends
 *   - StreakCard           – streak + 7-day heatmap
 *   - XPCard              – level + XP progress bar
 *   - TimeSavedCard       – time wallet with breakdown
 *   - ExecutionCard       – execution summary
 *   - InsightCard         – AI insight with CTA
 *   - SectionLabel        – section heading
 *   - EmptyState          – polished empty view
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  AnalyticsRange,
  DailyDataPoint,
  InsightItem,
  formatMinutes,
  formatDelta,
  trendDirection,
} from './analyticsHelpers';

// ── Color Tokens ─────────────────────────────────────────────

const C = {
  bg: '#F8F8FA',
  card: '#FFFFFF',
  border: '#EEEEF0',
  text: '#1C1C1E',
  textSecondary: '#636366',
  textTertiary: '#AEAEB2',
  pill: '#F2F2F7',
  blue: '#3B82F6',
  blueBg: '#EFF6FF',
  green: '#22C55E',
  greenBg: '#F0FDF4',
  amber: '#F59E0B',
  amberBg: '#FFFBEB',
  red: '#EF4444',
  redBg: '#FEF2F2',
  purple: '#8B5CF6',
  purpleBg: '#F5F3FF',
  orange: '#F97316',
  orangeBg: '#FFF7ED',
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
};

// ═══════════════════════════════════════════════════════════════
// Period Filter
// ═══════════════════════════════════════════════════════════════

const RANGES: { key: AnalyticsRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: 'all', label: 'All' },
];

export function PeriodFilter({
  value,
  onChange,
  accent,
}: {
  value: AnalyticsRange;
  onChange: (r: AnalyticsRange) => void;
  accent: string;
}) {
  return (
    <View style={filterStyles.row}>
      {RANGES.map((r) => {
        const active = value === r.key;
        return (
          <TouchableOpacity
            key={r.key}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(r.key);
            }}
            accessibilityLabel={`Show ${r.label} analytics`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              filterStyles.chip,
              active
                ? { backgroundColor: accent }
                : { backgroundColor: C.pill, borderWidth: 1, borderColor: C.border },
            ]}
          >
            <Text
              style={[
                filterStyles.chipText,
                active
                  ? { color: '#FFFFFF', fontWeight: '600' }
                  : { color: C.textSecondary, fontWeight: '500' },
              ]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const filterStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  chip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 14 },
});

// ═══════════════════════════════════════════════════════════════
// Section Label
// ═══════════════════════════════════════════════════════════════

export function SectionLabel({ title }: { title: string }) {
  return (
    <Text style={sectionStyles.label}>{title}</Text>
  );
}

const sectionStyles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 6,
    paddingHorizontal: 4,
  },
});

// ═══════════════════════════════════════════════════════════════
// Hero Card
// ═══════════════════════════════════════════════════════════════

export function HeroCard({
  score,
  delta,
  insight,
  accent,
}: {
  score: number;
  delta: number;
  insight: string;
  accent: string;
}) {
  const trend = trendDirection(delta);
  const trendIcon: keyof typeof Ionicons.glyphMap =
    trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove-outline';
  const trendColor = trend === 'up' ? C.green : trend === 'down' ? C.red : C.textTertiary;

  return (
    <View style={[heroStyles.card, C.shadow]}>
      {/* Score Ring (simplified as large number) */}
      <View style={heroStyles.scoreRow}>
        <View style={heroStyles.scoreContainer}>
          <View style={[heroStyles.scoreCircle, { borderColor: accent }]}>
            <Text style={[heroStyles.scoreValue, { color: accent }]}>{score}</Text>
          </View>
          <Text style={heroStyles.scoreLabel}>Productivity{'\n'}Score</Text>
        </View>
        <View style={heroStyles.deltaContainer}>
          <View style={[heroStyles.deltaPill, { backgroundColor: trend === 'up' ? C.greenBg : trend === 'down' ? C.redBg : C.pill }]}>
            <Ionicons name={trendIcon} size={14} color={trendColor} />
            <Text style={[heroStyles.deltaText, { color: trendColor }]}>
              {formatDelta(delta)}
            </Text>
          </View>
          <Text style={heroStyles.deltaLabel}>vs prev period</Text>
        </View>
      </View>
      {/* Insight */}
      <View style={heroStyles.insightRow}>
        <Ionicons name="sparkles" size={14} color={C.amber} />
        <Text style={heroStyles.insightText}>{insight}</Text>
      </View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
    lineHeight: 18,
  },
  deltaContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  deltaText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deltaLabel: {
    fontSize: 11,
    color: C.textTertiary,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
  },
  insightText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
});

// ═══════════════════════════════════════════════════════════════
// Metric Card (for 2×2 grid)
// ═══════════════════════════════════════════════════════════════

export function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  iconName,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}) {
  const trend = delta !== undefined ? trendDirection(delta) : 'flat';
  const trendColor = trend === 'up' ? C.green : trend === 'down' ? C.red : C.textTertiary;

  return (
    <View style={[metricStyles.card, C.shadow]}>
      <View style={[metricStyles.iconDot, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={16} color={iconColor} />
      </View>
      <Text style={metricStyles.label}>{label}</Text>
      <View style={metricStyles.valueRow}>
        <Text style={metricStyles.value}>{value}</Text>
        {unit ? <Text style={metricStyles.unit}>{unit}</Text> : null}
      </View>
      {delta !== undefined && (
        <View style={metricStyles.deltaRow}>
          <Ionicons
            name={trend === 'up' ? 'caret-up' : trend === 'down' ? 'caret-down' : 'remove-outline'}
            size={10}
            color={trendColor}
          />
          <Text style={[metricStyles.deltaText, { color: trendColor }]}>
            {formatDelta(delta)}{deltaLabel ? ` ${deltaLabel}` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

export function MetricGrid({ children }: { children: React.ReactNode }) {
  return <View style={metricStyles.grid}>{children}</View>;
}

const metricStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    width: '48.5%' as any,
    borderWidth: 1,
    borderColor: C.border,
  },
  iconDot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 14,
    color: C.textTertiary,
    fontWeight: '500',
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

// ═══════════════════════════════════════════════════════════════
// Mini Bar Chart
// ═══════════════════════════════════════════════════════════════

export function MiniBarChart({
  data,
  accent,
  height = 100,
}: {
  data: DailyDataPoint[];
  accent: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = data.length <= 7 ? 28 : 12;

  return (
    <View style={[chartStyles.card, C.shadow]}>
      <View style={chartStyles.header}>
        <Ionicons name="bar-chart-outline" size={16} color={C.blue} />
        <Text style={chartStyles.title}>Daily Completions</Text>
      </View>
      <View style={[chartStyles.chartArea, { height }]}>
        {data.map((d, i) => {
          const barH = max > 0 ? (d.value / max) * (height - 24) : 0;
          const isToday = i === data.length - 1;
          return (
            <View key={d.date} style={chartStyles.barCol}>
              <View style={chartStyles.barContainer}>
                <View
                  style={[
                    chartStyles.bar,
                    {
                      height: Math.max(barH, 3),
                      width: barWidth,
                      backgroundColor: isToday ? accent : d.value > 0 ? `${accent}66` : '#EEEEF0',
                      borderRadius: barWidth > 16 ? 6 : 4,
                    },
                  ]}
                />
              </View>
              <Text style={[chartStyles.barLabel, isToday && { color: accent, fontWeight: '600' }]}>
                {d.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    minHeight: 3,
  },
  barLabel: {
    fontSize: 10,
    color: C.textTertiary,
    marginTop: 6,
  },
});

// ═══════════════════════════════════════════════════════════════
// Time Saved Card
// ═══════════════════════════════════════════════════════════════

export function TimeSavedCard({
  totalMinutes,
  taskMinutes,
  focusMinutes,
  prevTotalMinutes,
}: {
  totalMinutes: number;
  taskMinutes: number;
  focusMinutes: number;
  prevTotalMinutes: number;
}) {
  const delta = totalMinutes - prevTotalMinutes;
  const trend = trendDirection(delta);
  const trendColor = trend === 'up' ? C.green : trend === 'down' ? C.red : C.textTertiary;

  return (
    <View style={[savedStyles.card, C.shadow]}>
      <View style={savedStyles.header}>
        <View style={[savedStyles.iconDot, { backgroundColor: C.greenBg }]}>
          <Ionicons name="time-outline" size={16} color={C.green} />
        </View>
        <Text style={savedStyles.title}>Time Saved</Text>
        {delta !== 0 && (
          <View style={[savedStyles.trendPill, { backgroundColor: trend === 'up' ? C.greenBg : C.redBg }]}>
            <Ionicons
              name={trend === 'up' ? 'trending-up' : 'trending-down'}
              size={12}
              color={trendColor}
            />
            <Text style={[savedStyles.trendText, { color: trendColor }]}>
              {formatDelta(delta > 0 ? delta : delta)}m
            </Text>
          </View>
        )}
      </View>
      <Text style={savedStyles.bigValue}>{formatMinutes(totalMinutes)}</Text>
      <View style={savedStyles.breakdown}>
        <View style={savedStyles.breakdownItem}>
          <View style={[savedStyles.breakdownDot, { backgroundColor: C.green }]} />
          <Text style={savedStyles.breakdownLabel}>Tasks</Text>
          <Text style={savedStyles.breakdownValue}>{formatMinutes(taskMinutes)}</Text>
        </View>
        <View style={savedStyles.breakdownItem}>
          <View style={[savedStyles.breakdownDot, { backgroundColor: C.blue }]} />
          <Text style={savedStyles.breakdownLabel}>Focus</Text>
          <Text style={savedStyles.breakdownValue}>{formatMinutes(focusMinutes)}</Text>
        </View>
      </View>
    </View>
  );
}

const savedStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconDot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    flex: 1,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bigValue: {
    fontSize: 32,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -1,
    marginBottom: 12,
  },
  breakdown: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: C.textSecondary,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },
});

// ═══════════════════════════════════════════════════════════════
// Streak Card
// ═══════════════════════════════════════════════════════════════

export function StreakCard({
  currentStreak,
  longestStreak,
  weeklyHeat,
  dayLabels,
}: {
  currentStreak: number;
  longestStreak: number;
  weeklyHeat: boolean[];
  dayLabels: string[];
}) {
  const atRisk = currentStreak > 0 && !weeklyHeat[weeklyHeat.length - 1];

  return (
    <View style={[streakStyles.card, C.shadow]}>
      <View style={streakStyles.header}>
        <View style={[streakStyles.iconDot, { backgroundColor: C.orangeBg }]}>
          <Ionicons name="flame" size={16} color={C.orange} />
        </View>
        <Text style={streakStyles.title}>Streak</Text>
        {atRisk && (
          <View style={[streakStyles.riskPill]}>
            <Ionicons name="warning-outline" size={12} color={C.amber} />
            <Text style={streakStyles.riskText}>At risk</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={streakStyles.statsRow}>
        <View style={streakStyles.statItem}>
          <Text style={streakStyles.statValue}>{currentStreak}</Text>
          <Text style={streakStyles.statLabel}>Current</Text>
        </View>
        <View style={streakStyles.divider} />
        <View style={streakStyles.statItem}>
          <Text style={[streakStyles.statValue, { color: C.textSecondary }]}>{longestStreak}</Text>
          <Text style={streakStyles.statLabel}>Longest</Text>
        </View>
      </View>

      {/* 7-day heatmap */}
      <View style={streakStyles.heatRow}>
        {weeklyHeat.map((active, i) => (
          <View key={i} style={streakStyles.heatCol}>
            <View
              style={[
                streakStyles.heatBox,
                active
                  ? { backgroundColor: C.orange }
                  : { backgroundColor: '#F2F2F7', borderWidth: 1, borderColor: C.border },
              ]}
            >
              {active && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
            </View>
            <Text style={streakStyles.heatLabel}>{dayLabels[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const streakStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  iconDot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    flex: 1,
  },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.amberBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: C.orange,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: C.border,
  },
  heatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  heatCol: {
    alignItems: 'center',
    gap: 5,
  },
  heatBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatLabel: {
    fontSize: 10,
    color: C.textTertiary,
    fontWeight: '500',
  },
});

// ═══════════════════════════════════════════════════════════════
// XP Card
// ═══════════════════════════════════════════════════════════════

export function XPCard({
  level,
  xp,
  xpForNext,
  accent,
}: {
  level: number;
  xp: number;
  xpForNext: number;
  accent: string;
}) {
  const progress = xpForNext > 0 ? Math.min((xp % xpForNext) / xpForNext, 1) : 0;
  const remaining = xpForNext - (xp % xpForNext);

  return (
    <View style={[xpStyles.card, C.shadow]}>
      <View style={xpStyles.header}>
        <View style={[xpStyles.iconDot, { backgroundColor: C.purpleBg }]}>
          <Ionicons name="star" size={16} color={C.purple} />
        </View>
        <Text style={xpStyles.title}>Level & XP</Text>
      </View>
      <View style={xpStyles.levelRow}>
        <View style={[xpStyles.levelBadge, { backgroundColor: accent }]}>
          <Text style={xpStyles.levelNumber}>{level}</Text>
        </View>
        <View style={xpStyles.xpInfo}>
          <Text style={xpStyles.xpText}>{xp} / {xpForNext} XP</Text>
          <View style={xpStyles.progressTrack}>
            <View
              style={[
                xpStyles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: accent },
              ]}
            />
          </View>
          <Text style={xpStyles.xpRemaining}>{remaining} XP to Level {level + 1}</Text>
        </View>
      </View>
    </View>
  );
}

const xpStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  iconDot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  levelBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  xpInfo: {
    flex: 1,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F2F2F7',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  xpRemaining: {
    fontSize: 12,
    color: C.textTertiary,
    marginTop: 4,
  },
});

// ═══════════════════════════════════════════════════════════════
// Execution Card
// ═══════════════════════════════════════════════════════════════

export function ExecutionCard({
  completed,
  avgMinutes,
  overdueRecovered,
}: {
  completed: number;
  avgMinutes: number;
  overdueRecovered: number;
}) {
  return (
    <View style={[execStyles.card, C.shadow]}>
      <View style={execStyles.header}>
        <View style={[execStyles.iconDot, { backgroundColor: C.blueBg }]}>
          <Ionicons name="analytics-outline" size={16} color={C.blue} />
        </View>
        <Text style={execStyles.title}>Execution Summary</Text>
      </View>
      <View style={execStyles.rows}>
        <ExecutionRow
          label="Tasks completed"
          value={String(completed)}
          color={C.green}
        />
        <ExecutionRow
          label="Avg completion time"
          value={avgMinutes > 0 ? formatMinutes(avgMinutes) : '—'}
          color={C.blue}
        />
        <ExecutionRow
          label="Overdue recovered"
          value={String(overdueRecovered)}
          color={overdueRecovered > 0 ? C.amber : C.textTertiary}
        />
      </View>
    </View>
  );
}

function ExecutionRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={execStyles.row}>
      <Text style={execStyles.rowLabel}>{label}</Text>
      <Text style={[execStyles.rowValue, { color }]}>{value}</Text>
    </View>
  );
}

const execStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  iconDot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  rows: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8FA',
  },
  rowLabel: {
    fontSize: 14,
    color: C.textSecondary,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});

// ═══════════════════════════════════════════════════════════════
// Insight Card
// ═══════════════════════════════════════════════════════════════

export function InsightCardRow({
  insights,
  accent,
  onAction,
}: {
  insights: InsightItem[];
  accent: string;
  onAction?: (action: string) => void;
}) {
  if (insights.length === 0) return null;

  return (
    <View style={insightStyles.container}>
      {insights.map((item) => (
        <View key={item.id} style={[insightStyles.card, C.shadow]}>
          <View style={insightStyles.row}>
            <Ionicons
              name={item.icon as keyof typeof Ionicons.glyphMap}
              size={18}
              color={item.iconColor}
            />
            <Text style={insightStyles.text}>{item.text}</Text>
          </View>
          {item.cta && (
            <TouchableOpacity
              style={[insightStyles.cta, { backgroundColor: `${accent}14` }]}
              onPress={() => onAction?.(item.ctaAction || '')}
            >
              <Text style={[insightStyles.ctaText, { color: accent }]}>
                {item.cta}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={accent} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const insightStyles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 20,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  text: {
    fontSize: 14,
    color: C.text,
    flex: 1,
    lineHeight: 20,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// ═══════════════════════════════════════════════════════════════
// Empty State
// ═══════════════════════════════════════════════════════════════

export function AnalyticsEmptyState() {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconCircle}>
        <Ionicons name="analytics-outline" size={40} color={C.textTertiary} />
      </View>
      <Text style={emptyStyles.title}>No data yet</Text>
      <Text style={emptyStyles.subtitle}>
        Start completing tasks and focus sessions{'\n'}to see your analytics come to life.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
