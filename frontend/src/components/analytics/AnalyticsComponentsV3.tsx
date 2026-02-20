/**
 * Analytics Sub-Components — v3 (Pass 3: Server-Driven)
 *
 * Modular building blocks consuming the AnalyticsSummaryResponse
 * from the analytics-summary edge function.
 *
 * All components use the shared design-token palette from @/styles/colors
 * and @/styles/theme. Color semantics:
 *   Blue   — productivity
 *   Green  — success
 *   Orange — streak
 *   Purple — XP
 *   Amber  — warnings
 *   Red    — critical
 *
 * Components:
 *   PeriodFilter        — range chip selector
 *   HeroCard            — productivity score + delta + insight
 *   MetricCard          — single KPI with trend
 *   MetricGrid          — 2×2 layout
 *   MiniBarChart        — daily completions chart
 *   TimeSavedCard       — time wallet + breakdown
 *   StreakCard           — streak + 7-day heatmap + at-risk
 *   XPCard              — level + XP progress
 *   ExecutionCard       — execution summary rows
 *   InsightCardRow      — AI insights with CTAs
 *   SectionLabel        — section heading
 *   AnalyticsEmptyState — no data view
 *   AnalyticsErrorState — error view with retry
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
import type {
  AnalyticsPeriod,
  AnalyticsInsight,
  DailyRow,
} from '@/types/analytics';

// ── Design Tokens ────────────────────────────────────────────

const C = {
  // backgrounds (dark-first)
  bg: '#0A0A0F',
  card: '#1A1A24',
  border: 'rgba(255,255,255,0.08)',
  pill: '#222230',

  // text
  text: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textTertiary: '#6B6B7B',

  // semantic colours (PRD mapping — vibrant on dark)
  blue: '#00B4FF',       // productivity
  blueBg: 'rgba(0,180,255,0.12)',
  green: '#00E676',      // success
  greenBg: 'rgba(0,230,118,0.12)',
  amber: '#FFB800',      // warnings
  amberBg: 'rgba(255,184,0,0.12)',
  red: '#FF3B5C',        // critical
  redBg: 'rgba(255,59,92,0.12)',
  purple: '#B958FF',     // XP
  purpleBg: 'rgba(185,88,255,0.12)',
  orange: '#FF6B35',     // streak
  orangeBg: 'rgba(255,107,53,0.12)',

  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  } as ViewStyle,
};

// ── Helpers ──────────────────────────────────────────────────

type Trend = 'up' | 'down' | 'flat';

function trendOf(delta: number): Trend {
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'flat';
}

function fmtDelta(delta: number): string {
  if (delta === 0) return '—';
  return `${delta > 0 ? '+' : ''}${delta}`;
}

function fmtMinutes(mins: number): string {
  if (mins === 0) return '0m';
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function trendColor(t: Trend): string {
  return t === 'up' ? C.green : t === 'down' ? C.red : C.textTertiary;
}

function trendBg(t: Trend): string {
  return t === 'up' ? C.greenBg : t === 'down' ? C.redBg : C.pill;
}

function trendIcon(t: Trend): keyof typeof Ionicons.glyphMap {
  return t === 'up' ? 'trending-up' : t === 'down' ? 'trending-down' : 'remove-outline';
}

function caretIcon(t: Trend): keyof typeof Ionicons.glyphMap {
  return t === 'up' ? 'caret-up' : t === 'down' ? 'caret-down' : 'remove-outline';
}

// ═══════════════════════════════════════════════════════════════
// Period Filter
// ═══════════════════════════════════════════════════════════════

const RANGES: { key: AnalyticsPeriod; label: string }[] = [
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
  value: AnalyticsPeriod;
  onChange: (r: AnalyticsPeriod) => void;
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
  return <Text style={sectionStyles.label}>{title}</Text>;
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
// Hero Card — Productivity Score + Delta + Insight
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
  const trend = trendOf(delta);
  const tc = trendColor(trend);

  return (
    <View style={[heroStyles.card, C.shadow]}>
      <View style={heroStyles.scoreRow}>
        <View style={heroStyles.scoreContainer}>
          <View style={[heroStyles.scoreCircle, { borderColor: accent }]}>
            <Text style={[heroStyles.scoreValue, { color: accent }]}>{score}</Text>
          </View>
          <Text style={heroStyles.scoreLabel}>Productivity{'\n'}Score</Text>
        </View>
        <View style={heroStyles.deltaContainer}>
          <View style={[heroStyles.deltaPill, { backgroundColor: trendBg(trend) }]}>
            <Ionicons name={trendIcon(trend)} size={14} color={tc} />
            <Text style={[heroStyles.deltaText, { color: tc }]}>{fmtDelta(delta)}</Text>
          </View>
          <Text style={heroStyles.deltaLabel}>vs prev period</Text>
        </View>
      </View>
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
  scoreContainer: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },
  scoreValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  scoreLabel: { fontSize: 13, fontWeight: '600', color: C.textSecondary, lineHeight: 18 },
  deltaContainer: { alignItems: 'flex-end', gap: 4 },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  deltaText: { fontSize: 14, fontWeight: '700' },
  deltaLabel: { fontSize: 11, color: C.textTertiary },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: C.amberBg,
    borderRadius: 10,
    padding: 12,
  },
  insightText: { fontSize: 13, color: C.amber, flex: 1, lineHeight: 18 },
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
  prevValue,
  iconName,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  prevValue?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}) {
  const trend = delta !== undefined ? trendOf(delta) : 'flat';
  const tc = trendColor(trend);

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
          <Ionicons name={caretIcon(trend)} size={10} color={tc} />
          <Text style={[metricStyles.deltaText, { color: tc }]}>
            {fmtDelta(delta)}{deltaLabel ? ` ${deltaLabel}` : ''}
          </Text>
          {prevValue !== undefined && (
            <Text style={metricStyles.prevText}>was {prevValue}</Text>
          )}
        </View>
      )}
    </View>
  );
}

export function MetricGrid({ children }: { children: React.ReactNode }) {
  return <View style={metricStyles.grid}>{children}</View>;
}

const metricStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
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
  label: { fontSize: 12, color: C.textSecondary, fontWeight: '500', marginBottom: 4 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  value: { fontSize: 24, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
  unit: { fontSize: 14, color: C.textTertiary, fontWeight: '500' },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6, flexWrap: 'wrap' },
  deltaText: { fontSize: 11, fontWeight: '600' },
  prevText: { fontSize: 10, color: C.textTertiary, marginLeft: 2 },
});

// ═══════════════════════════════════════════════════════════════
// Mini Bar Chart
// ═══════════════════════════════════════════════════════════════

export function MiniBarChart({
  data,
  accent,
  period,
}: {
  data: DailyRow[];
  accent: string;
  period: AnalyticsPeriod;
}) {
  if (!data || data.length < 2) return null;

  const height = period === '30d' || period === 'all' ? 80 : 100;
  const barWidth = data.length <= 7 ? 28 : 12;
  const max = Math.max(...data.map((d) => d.tasks_completed), 1);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={[chartStyles.card, C.shadow]}>
      <View style={chartStyles.header}>
        <Ionicons name="bar-chart-outline" size={16} color={C.blue} />
        <Text style={chartStyles.title}>Daily Completions</Text>
      </View>
      <View style={[chartStyles.chartArea, { height }]}>
        {data.map((d, i) => {
          const barH = max > 0 ? (d.tasks_completed / max) * (height - 24) : 0;
          const isLast = i === data.length - 1;
          const dt = new Date(`${d.date}T12:00:00Z`);
          const label = data.length <= 7
            ? dayNames[dt.getUTCDay()]
            : `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;

          return (
            <View key={d.date} style={chartStyles.barCol}>
              <View style={chartStyles.barContainer}>
                <View
                  style={[
                    chartStyles.bar,
                    {
                      height: Math.max(barH, 3),
                      width: barWidth,
                      backgroundColor: isLast
                        ? accent
                        : d.tasks_completed > 0
                          ? `${accent}66`
                          : C.border,
                      borderRadius: barWidth > 16 ? 6 : 4,
                    },
                  ]}
                />
              </View>
              <Text
                style={[chartStyles.barLabel, isLast && { color: accent, fontWeight: '600' }]}
              >
                {label}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  title: { fontSize: 15, fontWeight: '600', color: C.text },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  barCol: { alignItems: 'center', flex: 1 },
  barContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { minHeight: 3 },
  barLabel: { fontSize: 10, color: C.textTertiary, marginTop: 6 },
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
  const trend = trendOf(delta);
  const tc = trendColor(trend);

  return (
    <View style={[savedStyles.card, C.shadow]}>
      <View style={savedStyles.header}>
        <View style={[savedStyles.iconDot, { backgroundColor: C.greenBg }]}>
          <Ionicons name="time-outline" size={16} color={C.green} />
        </View>
        <Text style={savedStyles.title}>Time Saved</Text>
        {delta !== 0 && (
          <View style={[savedStyles.trendPill, { backgroundColor: trendBg(trend) }]}>
            <Ionicons name={trendIcon(trend)} size={12} color={tc} />
            <Text style={[savedStyles.trendText, { color: tc }]}>
              {fmtDelta(delta)}m
            </Text>
          </View>
        )}
      </View>
      <Text style={savedStyles.bigValue}>{fmtMinutes(totalMinutes)}</Text>
      {prevTotalMinutes > 0 && (
        <Text style={savedStyles.prevLabel}>prev: {fmtMinutes(prevTotalMinutes)}</Text>
      )}
      <View style={savedStyles.breakdown}>
        <View style={savedStyles.breakdownItem}>
          <View style={[savedStyles.breakdownDot, { backgroundColor: C.green }]} />
          <Text style={savedStyles.breakdownLabel}>Tasks</Text>
          <Text style={savedStyles.breakdownValue}>{fmtMinutes(taskMinutes)}</Text>
        </View>
        <View style={savedStyles.breakdownItem}>
          <View style={[savedStyles.breakdownDot, { backgroundColor: C.blue }]} />
          <Text style={savedStyles.breakdownLabel}>Focus</Text>
          <Text style={savedStyles.breakdownValue}>{fmtMinutes(focusMinutes)}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  iconDot: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: C.text, flex: 1 },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendText: { fontSize: 12, fontWeight: '600' },
  bigValue: { fontSize: 32, fontWeight: '800', color: C.text, letterSpacing: -1, marginBottom: 4 },
  prevLabel: { fontSize: 12, color: C.textTertiary, marginBottom: 12 },
  breakdown: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { fontSize: 13, color: C.textSecondary },
  breakdownValue: { fontSize: 13, fontWeight: '600', color: C.text },
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
          <View style={streakStyles.riskPill}>
            <Ionicons name="warning-outline" size={12} color={C.amber} />
            <Text style={streakStyles.riskText}>At risk</Text>
          </View>
        )}
      </View>

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

      <View style={streakStyles.heatRow}>
        {weeklyHeat.map((active, i) => (
          <View key={i} style={streakStyles.heatCol}>
            <View
              style={[
                streakStyles.heatBox,
                active
                  ? { backgroundColor: C.orange }
                  : { backgroundColor: C.pill, borderWidth: 1, borderColor: C.border },
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  iconDot: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: C.text, flex: 1 },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.amberBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  riskText: { fontSize: 12, fontWeight: '600', color: C.amber },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', color: C.orange, letterSpacing: -1 },
  statLabel: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  divider: { width: 1, height: 36, backgroundColor: C.border },
  heatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  heatCol: { alignItems: 'center', gap: 5 },
  heatBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatLabel: { fontSize: 10, color: C.textTertiary, fontWeight: '500' },
});

// ═══════════════════════════════════════════════════════════════
// XP Card
// ═══════════════════════════════════════════════════════════════

export function XPCard({
  level,
  xpIntoLevel,
  xpForNextLevel,
  totalXp,
  xpGainedThisPeriod,
  accent,
}: {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  totalXp: number;
  xpGainedThisPeriod: number;
  accent: string;
}) {
  const progress = xpForNextLevel > 0 ? Math.min(xpIntoLevel / xpForNextLevel, 1) : 0;
  const remaining = xpForNextLevel - xpIntoLevel;

  return (
    <View style={[xpStyles.card, C.shadow]}>
      <View style={xpStyles.header}>
        <View style={[xpStyles.iconDot, { backgroundColor: C.purpleBg }]}>
          <Ionicons name="star" size={16} color={C.purple} />
        </View>
        <Text style={xpStyles.title}>Level & XP</Text>
        {xpGainedThisPeriod > 0 && (
          <View style={[xpStyles.gainPill, { backgroundColor: C.purpleBg }]}>
            <Text style={[xpStyles.gainText, { color: C.purple }]}>+{xpGainedThisPeriod} XP</Text>
          </View>
        )}
      </View>
      <View style={xpStyles.levelRow}>
        <View style={[xpStyles.levelBadge, { backgroundColor: accent }]}>
          <Text style={xpStyles.levelNumber}>{level}</Text>
        </View>
        <View style={xpStyles.xpInfo}>
          <Text style={xpStyles.xpText}>
            {xpIntoLevel} / {xpForNextLevel} XP
          </Text>
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
      <View style={xpStyles.totalRow}>
        <Text style={xpStyles.totalLabel}>Total XP</Text>
        <Text style={[xpStyles.totalValue, { color: C.purple }]}>{totalXp.toLocaleString()}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  iconDot: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: C.text, flex: 1 },
  gainPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  gainText: { fontSize: 12, fontWeight: '700' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  levelBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  xpInfo: { flex: 1 },
  xpText: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 6 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: C.pill, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  xpRemaining: { fontSize: 12, color: C.textTertiary, marginTop: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  totalLabel: { fontSize: 13, color: C.textSecondary },
  totalValue: { fontSize: 14, fontWeight: '700' },
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
        <ExecutionRow label="Tasks completed" value={String(completed)} color={C.green} />
        <ExecutionRow
          label="Avg completion time"
          value={avgMinutes > 0 ? fmtMinutes(avgMinutes) : '—'}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  iconDot: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: C.text },
  rows: { gap: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rowLabel: { fontSize: 14, color: C.textSecondary },
  rowValue: { fontSize: 16, fontWeight: '700' },
});

// ═══════════════════════════════════════════════════════════════
// Insight Card Row (AI Insights)
// ═══════════════════════════════════════════════════════════════

export function InsightCardRow({
  insights,
  accent,
  onAction,
}: {
  insights: AnalyticsInsight[];
  accent: string;
  onAction?: (action: string) => void;
}) {
  if (!insights || insights.length === 0) return null;

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
              <Text style={[insightStyles.ctaText, { color: accent }]}>{item.cta}</Text>
              <Ionicons name="chevron-forward" size={14} color={accent} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const insightStyles = StyleSheet.create({
  container: { gap: 8, marginBottom: 20 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  text: { fontSize: 14, color: C.text, flex: 1, lineHeight: 20 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ctaText: { fontSize: 14, fontWeight: '600' },
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
  container: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
});

// ═══════════════════════════════════════════════════════════════
// Error State
// ═══════════════════════════════════════════════════════════════

export function AnalyticsErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={errorStyles.container}>
      <View style={[errorStyles.iconCircle, { backgroundColor: C.redBg }]}>
        <Ionicons name="cloud-offline-outline" size={36} color={C.red} />
      </View>
      <Text style={errorStyles.title}>Couldn't load analytics</Text>
      <Text style={errorStyles.subtitle}>{message}</Text>
      <TouchableOpacity style={errorStyles.retryBtn} onPress={onRetry}>
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={errorStyles.retryText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 20 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.blue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
