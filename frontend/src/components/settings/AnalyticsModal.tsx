/**
 * Analytics Modal (75% sheet)
 *
 * Shows Time Wallet, Level/XP, Streak, Execution Summary,
 * and Category breakdown. Range filter pills: Today | 7D | 30D | All.
 *
 * Frontend-only — reads from existing hooks/user data.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, Modal, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useFocusSessions } from '../../hooks/supabase/useFocusSessions';
import { useTasks } from '../../hooks/supabase/useTasks';
import { ACCENT_COLORS, AccentPreset } from '../../state/settingsPreferences';
import { bg, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';

// ── Types ────────────────────────────────────────────────────

type Range = 'today' | '7d' | '30d' | 'all';

interface Props {
  visible: boolean;
  onClose: () => void;
  accentPreset?: AccentPreset;
}

// ── Helpers ──────────────────────────────────────────────────

function isInRange(dateStr: string | null | undefined, range: Range): boolean {
  if (!dateStr) return false;
  if (range === 'all') return true;
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  switch (range) {
    case 'today': return diffDays < 1 && d.getDate() === now.getDate();
    case '7d':    return diffDays <= 7;
    case '30d':   return diffDays <= 30;
    default:      return true;
  }
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Card component ───────────────────────────────────────────

function StatCard({ title, icon, iconColor, children }: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: bg.card,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: borderTokens.primary,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text style={{ fontSize: 15, fontWeight: '600', color: textTokens.primary, marginLeft: 8 }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
      <Text style={{ fontSize: 14, color: textTokens.secondary }}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: textTokens.primary }}>{value}</Text>
        {sub ? <Text style={{ fontSize: 11, color: textTokens.tertiary }}>{sub}</Text> : null}
      </View>
    </View>
  );
}

// ── Main Component ───────────────────────────────────────────

export function AnalyticsModal({ visible, onClose, accentPreset = 'purple' }: Props) {
  const [range, setRange] = useState<Range>('7d');
  const { user } = useSupabaseAuth();
  const { sessions } = useFocusSessions();
  const { tasks } = useTasks();

  const accent = ACCENT_COLORS[accentPreset].primary;

  // ── Computed stats ──────────────────────────────────────────

  const stats = useMemo(() => {
    // Filter tasks & sessions by range
    const completedTasks = tasks.filter(
      (t) => t.status === 'completed' && isInRange(t.completed_at || t.updated_at, range),
    );
    const rangeSessions = sessions.filter((s) => isInRange(s.started_at, range));

    // Time wallet
    const taskMinutes = completedTasks.reduce((s, t) => s + (t.estimated_duration || 0), 0);
    const focusMinutes = rangeSessions.reduce((s, sess) => s + (sess.duration_actual || 0), 0);
    const totalSaved = taskMinutes + focusMinutes;

    // Execution
    const avgCompletion = completedTasks.length > 0
      ? Math.round(completedTasks.reduce((s, t) => s + (t.estimated_duration || 0), 0) / completedTasks.length)
      : 0;

    const overdueRecovered = completedTasks.filter((t) => {
      if (!t.due_date || !t.completed_at) return false;
      return new Date(t.completed_at) > new Date(t.due_date);
    }).length;

    // Group by priority
    const byCat: Record<string, number> = {};
    completedTasks.forEach((t) => {
      const cat = t.priority || 'medium';
      byCat[cat] = (byCat[cat] || 0) + 1;
    });
    const categoryEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCatCount = categoryEntries.length > 0 ? categoryEntries[0][1] : 1;

    return {
      totalSaved,
      taskMinutes,
      focusMinutes,
      completedCount: completedTasks.length,
      avgCompletion,
      overdueRecovered,
      categoryEntries,
      maxCatCount,
    };
  }, [tasks, sessions, range]);

  // ── 7-day streak heat row ──────────────────────────────────

  const streakDays = useMemo(() => {
    const days: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const hasActivity = tasks.some(
        (t) => t.status === 'completed' && t.completed_at?.startsWith(dayStr),
      );
      days.push(hasActivity);
    }
    return days;
  }, [tasks]);

  const dayLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(['S','M','T','W','T','F','S'][d.getDay()]);
    }
    return labels;
  }, []);

  // Priority colours
  const CAT_COLORS: Record<string, string> = {
    low: '#22C55E', medium: '#3B82F6', high: '#F59E0B', urgent: '#FF3B30',
  };

  const ranges: { key: Range; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: '7d', label: '7D' },
    { key: '30d', label: '30D' },
    { key: 'all', label: 'All' },
  ];

  // XP
  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const xpForNext = level * 100;
  const xpProgress = (xp % 100) / 100;

  const hasData = stats.completedCount > 0 || sessions.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.60)' }}
        onPress={onClose}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            style={{
              backgroundColor: bg.elevated,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '78%',
              borderTopWidth: 1,
              borderColor: borderTokens.primary,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: textTokens.disabled,
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 12,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: '700', color: textTokens.primary }}>
                Analytics
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close analytics"
                accessibilityRole="button"
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: bg.hover,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={18} color={textTokens.tertiary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Range pills */}
            <View
              style={{
                flexDirection: 'row',
                paddingHorizontal: 20,
                marginBottom: 16,
                gap: 8,
              }}
            >
              {ranges.map((r) => {
                const active = range === r.key;
                return (
                  <TouchableOpacity
                    key={r.key}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setRange(r.key);
                    }}
                    accessibilityLabel={`Show ${r.label} analytics`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 7,
                      borderRadius: 20,
                      backgroundColor: active ? accent : bg.input,
                      borderWidth: active ? 0 : 1,
                      borderColor: borderTokens.primary,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: active ? '600' : '400',
                        color: active ? '#FFFFFF' : textTokens.secondary,
                      }}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView
              style={{ paddingHorizontal: 16 }}
              contentContainerStyle={{ paddingBottom: 40 }}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {!hasData ? (
                <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                  <Ionicons name="bar-chart-outline" size={48} color={textTokens.disabled} />
                  <Text style={{ fontSize: 17, fontWeight: '600', color: textTokens.primary, marginTop: 16 }}>
                    No data yet
                  </Text>
                  <Text style={{ fontSize: 14, color: textTokens.tertiary, marginTop: 6, textAlign: 'center' }}>
                    Start completing tasks to{'\n'}populate your analytics.
                  </Text>
                </View>
              ) : (
                <>
                  {/* 1. Time Wallet */}
                  <StatCard title="Time Wallet" icon="wallet-outline" iconColor="#22C55E">
                    <StatRow
                      label="Total saved"
                      value={formatMinutes(stats.totalSaved)}
                    />
                    <StatRow
                      label="Breakdown"
                      value={`Tasks ${formatMinutes(stats.taskMinutes)} · Focus ${formatMinutes(stats.focusMinutes)}`}
                    />
                  </StatCard>

                  {/* 2. Level & XP */}
                  <StatCard title="Level & XP" icon="star-outline" iconColor="#EAB308">
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 28, fontWeight: '700', color: textTokens.primary }}>
                        Level {level}
                      </Text>
                      <Text style={{ fontSize: 15, color: textTokens.tertiary, alignSelf: 'flex-end' }}>
                        {xp} / {xpForNext} XP
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: bg.input,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: accent,
                          width: `${Math.min(xpProgress * 100, 100)}%`,
                        }}
                      />
                    </View>
                    <Text style={{ fontSize: 12, color: textTokens.tertiary, marginTop: 4 }}>
                      {Math.round(xpProgress * 100)}% to Level {level + 1}
                    </Text>
                  </StatCard>

                  {/* 3. Streak */}
                  <StatCard title="Streak" icon="flame-outline" iconColor="#F97316">
                    <StatRow
                      label="Current streak"
                      value={`${user?.currentStreak ?? 0} days`}
                    />
                    <StatRow
                      label="Longest streak"
                      value={`${user?.longestStreak ?? 0} days`}
                    />
                    {/* 7-day heat row */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 10,
                        paddingTop: 10,
                        borderTopWidth: 1,
                        borderTopColor: borderTokens.primary,
                      }}
                    >
                      {streakDays.map((active, i) => (
                        <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                          <View
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              backgroundColor: active ? '#F97316' : bg.input,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {active && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                          </View>
                          <Text style={{ fontSize: 10, color: textTokens.tertiary }}>{dayLabels[i]}</Text>
                        </View>
                      ))}
                    </View>
                  </StatCard>

                  {/* 4. Execution Summary */}
                  <StatCard title="Execution Summary" icon="analytics-outline" iconColor="#3B82F6">
                    <StatRow label="Tasks completed" value={String(stats.completedCount)} />
                    <StatRow label="Avg completion time" value={stats.avgCompletion > 0 ? formatMinutes(stats.avgCompletion) : '—'} />
                    <StatRow label="Overdue recovered" value={String(stats.overdueRecovered)} />
                  </StatCard>

                  {/* 5. Priority Breakdown */}
                  <StatCard title="Priority Breakdown" icon="grid-outline" iconColor="#8EAAD8">
                    {stats.categoryEntries.length === 0 ? (
                      <Text style={{ fontSize: 14, color: textTokens.tertiary }}>
                        Complete tasks to see breakdown.
                      </Text>
                    ) : (
                      stats.categoryEntries.map(([cat, count]) => (
                        <View key={cat} style={{ marginBottom: 10 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: 14, color: textTokens.primary, textTransform: 'capitalize' }}>
                              {cat}
                            </Text>
                            <Text style={{ fontSize: 13, color: textTokens.tertiary }}>{count}</Text>
                          </View>
                          <View
                            style={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: bg.input,
                              overflow: 'hidden',
                            }}
                          >
                            <View
                              style={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: CAT_COLORS[cat.toLowerCase()] || accent,
                                width: `${(count / stats.maxCatCount) * 100}%`,
                              }}
                            />
                          </View>
                        </View>
                      ))
                    )}
                  </StatCard>
                </>
              )}
            </ScrollView>

            <SafeAreaView edges={['bottom']} />
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
