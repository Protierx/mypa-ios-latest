/**
 * Momentum Strip — compact gamification summary
 *
 * Sits at the top of the Tasks page (non-invasive).
 * Shows: Today XP ● Streak ● Active Challenge
 *
 * Design: single row, small pills, matches existing iOS light theme.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGamification } from '@/contexts/GamificationContext';
import { bg, brand, text as textTokens, semantic } from '@/styles/colors';
import { radius, spacing, shadows } from '@/styles/theme';

export function MomentumStrip() {
  const { state } = useGamification();
  const { todayXp, dailyXpCap, streak, activeChallenges } = state;

  // Pick the first active (non-completed) challenge to show
  const activeChallenge = activeChallenges.find((c) => !c.completed) ?? null;

  const xpPct = Math.min(todayXp / dailyXpCap, 1);

  return (
    <View style={styles.strip}>
      {/* Today XP */}
      <View style={styles.cell}>
        <View style={styles.cellIcon}>
          <Ionicons name="flash" size={12} color={brand.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cellLabel}>Today</Text>
          <View style={styles.xpRow}>
            <Text style={styles.cellValue}>{todayXp}</Text>
            <Text style={styles.cellCap}>/{dailyXpCap} XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpPct * 100}%` }]} />
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Streak */}
      <View style={styles.cell}>
        <View style={[styles.cellIcon, { backgroundColor: streak.current > 0 ? 'rgba(255,159,10,0.12)' : bg.secondary }]}>
          <Ionicons
            name="flame"
            size={12}
            color={streak.current > 0 ? semantic.warning : textTokens.disabled}
          />
        </View>
        <View>
          <Text style={styles.cellLabel}>Streak</Text>
          <Text style={styles.cellValue}>
            {streak.current} day{streak.current !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Divider */}
      {activeChallenge && <View style={styles.divider} />}

      {/* Active Challenge */}
      {activeChallenge && (
        <View style={[styles.cell, { flex: 1.2 }]}>
          <View style={[styles.cellIcon, { backgroundColor: 'rgba(52,199,89,0.12)' }]}>
            <Ionicons name="flag" size={12} color={semantic.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cellLabel} numberOfLines={1}>
              {activeChallenge.type === 'tasks_completed' ? 'Tasks' : 'Check-in'}
            </Text>
            <Text style={styles.cellValue}>
              {activeChallenge.progressValue}/{activeChallenge.target}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginBottom: 6,
    backgroundColor: bg.card,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...shadows.sm,
  },
  cell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cellIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: brand.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cellLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: textTokens.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cellValue: {
    fontSize: 14,
    fontWeight: '700',
    color: textTokens.primary,
    letterSpacing: -0.2,
  },
  cellCap: {
    fontSize: 11,
    fontWeight: '500',
    color: textTokens.tertiary,
    marginLeft: 1,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  xpBarBg: {
    height: 3,
    backgroundColor: bg.secondary,
    borderRadius: 1.5,
    marginTop: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: brand.primary,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 8,
  },
});
