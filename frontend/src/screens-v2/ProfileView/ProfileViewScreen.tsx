/**
 * Profile View Screen
 *
 * Swipe DOWN from AI Hub to access.
 * Purpose: "Who I am + how I'm doing"
 *
 * Contains:
 *   - Avatar, name, username
 *   - Level + XP progress
 *   - KPI summary cards (Streak, Tasks, Focus, Challenges)
 *   - Two pill tabs: Analytics | Settings
 *   - Upgrade banner (free users)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useUserModel } from '../../contexts/UserModelContext';
import { useFocusSessions } from '../../hooks/supabase/useFocusSessions';
import { MiniVoiceButton } from '../../components/MiniVoiceButton';
import { SettingsScreen } from '../settings/SettingsScreen';
import { PaywallSheet } from '../modals/PaywallSheet';
import { AnalyticsModal } from '../../components/settings/AnalyticsModal';
import { ACCENT_COLORS, useSettingsPreferences } from '../../state/settingsPreferences';

import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius, spacing } from '../../styles/theme';

export function ProfileViewScreen() {
  const { user, signOut } = useSupabaseAuth();
  const { stats } = useUserModel();
  const { sessions } = useFocusSessions();
  const { prefs } = useSettingsPreferences();

  // Compute real stats from data
  const tasksCompleted = stats?.tasksCompleted ?? 0;
  const totalFocusMinutes = sessions.reduce((sum, s) => sum + (s.duration_actual || 0), 0);

  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Calculate XP progress to next level
  const xpProgress = ((user?.xp || 0) % 100) / 100;
  const accent = ACCENT_COLORS[prefs.accentPreset].primary;

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          style={s.safeArea}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Profile Header ── */}
          <View style={s.profileHeader}>
            {/* Avatar — 80px with purple border ring */}
            <View style={s.avatarRing}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={s.avatarImage}
                />
              ) : (
                <Text style={s.avatarInitial}>
                  {(user?.name || user?.username || 'U')[0].toUpperCase()}
                </Text>
              )}
            </View>

            {/* Name */}
            <Text style={s.profileName}>
              {user?.name || 'User'}
            </Text>
            {user?.username && (
              <Text style={s.profileUsername}>@{user.username}</Text>
            )}

            {/* Level badge pill */}
            <View style={s.levelBadge}>
              <Ionicons name="star" size={16} color={semantic.warning} />
              <Text style={s.levelText}>
                Level {user?.level || 1}
              </Text>
              <Text style={s.levelDot}>·</Text>
              <Text style={s.levelXp}>{user?.xp || 0} XP</Text>
            </View>

            {/* XP progress bar */}
            <View style={s.xpBar}>
              <View
                style={[s.xpFill, { width: `${xpProgress * 100}%` }]}
              />
            </View>
            <Text style={s.xpLabel}>
              {Math.round(xpProgress * 100)}% to Level {(user?.level || 1) + 1}
            </Text>
          </View>

          {/* ── Stats Grid (2×2) ── */}
          <View style={s.statsGrid}>
            {[
              { icon: 'flame' as const, iconColor: '#F97316', label: 'Streak', value: `${user?.currentStreak || 0} days`, sub: `Longest: ${user?.longestStreak || 0} days` },
              { icon: 'checkbox' as const, iconColor: semantic.success, label: 'Tasks', value: `${tasksCompleted}`, sub: 'Completed' },
              { icon: 'timer' as const, iconColor: brand.primary, label: 'Focus', value: `${totalFocusMinutes}m`, sub: 'Total time' },
              { icon: 'trophy' as const, iconColor: semantic.warning, label: 'Days Active', value: `${stats?.daysActive ?? 0}`, sub: 'Days active' },
            ].map((stat) => (
              <View
                key={stat.label}
                style={s.statCard}
              >
                <View style={s.statIconRow}>
                  <Ionicons name={stat.icon} size={20} color={stat.iconColor} />
                  <Text style={s.statSub}>{stat.label}</Text>
                </View>
                <Text style={s.statValue}>
                  {stat.value}
                </Text>
                <Text style={s.statSubDetail}>{stat.sub}</Text>
              </View>
            ))}
          </View>

          {/* ── Action Pill Tabs (Analytics | Settings) ── */}
          <View style={s.actionPills}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowAnalytics(true);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Open Analytics"
              accessibilityRole="button"
              style={[s.actionPill, { backgroundColor: accent }]}
            >
              <Ionicons name="analytics-outline" size={20} color={textTokens.inverse} />
              <Text style={s.actionPillTextLight}>Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowSettings(true);
              }}
              activeOpacity={0.7}
              accessibilityLabel="Open Settings"
              accessibilityRole="button"
              style={s.actionPillOutline}
            >
              <Ionicons name="settings-outline" size={20} color={textTokens.primary} />
              <Text style={s.actionPillTextDark}>Settings</Text>
            </TouchableOpacity>
          </View>

          {/* ── Upgrade Banner (free users only) ── */}
          {!user?.isPremium && (
            <TouchableOpacity
              style={s.upgradeBanner}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowPaywall(true);
              }}
              activeOpacity={0.7}
            >
              <View style={s.upgradeIcon}>
                <Ionicons name="diamond" size={20} color={brand.primary} />
              </View>
              <View style={s.upgradeTitleContainer}>
                <Text style={s.upgradeTitle}>Upgrade to Premium</Text>
                <Text style={s.upgradeSub}>Unlimited voice, circles & more</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={brand.primary} />
            </TouchableOpacity>
          )}

          {/* ── Sign Out ── */}
          <TouchableOpacity
            style={s.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={semantic.error} />
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Mini Voice Button */}
        <MiniVoiceButton position="top-right" screenContext="profile" />
      </SafeAreaView>

      {/* ── Analytics Modal (75% sheet from Profile) ─────── */}
      <AnalyticsModal
        visible={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        accentPreset={prefs.accentPreset}
      />

      {/* ── Settings Screen (full-screen) ────────────────── */}
      <SettingsScreen
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onShowPaywall={() => {
          setShowSettings(false);
          setShowPaywall(true);
        }}
      />

      {/* ── Paywall ──────────────────────────────────────── */}
      <PaywallSheet
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="profile"
      />

      {/* Help Modal */}
      <Modal visible={showHelp} transparent animationType="fade">
        <Pressable
          style={s.helpOverlay}
          onPress={() => setShowHelp(false)}
        >
          <Pressable
            style={s.helpCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={s.helpTitle}>Help & Support</Text>
            <Text style={s.helpBody}>
              Need a hand? Tap anywhere to talk to MYPA, or swipe between Tasks, Social, and Profile. Swipe up from the home screen to start a focus session.
            </Text>
            <TouchableOpacity
              style={s.helpBtn}
              onPress={() => setShowHelp(false)}
              activeOpacity={0.85}
            >
              <Text style={s.helpBtnText}>Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: bg.primary,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // ── Profile Header ──
  profileHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: brand.primary,
    ...shadows.purple,
  },
  avatarImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: textTokens.primary,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: textTokens.primary,
    letterSpacing: -0.3,
  },
  profileUsername: {
    fontSize: 15,
    color: textTokens.tertiary,
    marginTop: 2,
  },

  // ── Level Badge ──
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: brand.muted,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  levelText: {
    fontSize: 15,
    fontWeight: '700',
    color: textTokens.primary,
    marginLeft: 8,
  },
  levelDot: {
    color: textTokens.disabled,
    marginLeft: 8,
  },
  levelXp: {
    fontSize: 13,
    color: textTokens.tertiary,
    marginLeft: 8,
  },

  // ── XP Bar ──
  xpBar: {
    width: 200,
    height: 6,
    backgroundColor: bg.secondary,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: brand.primary,
  },
  xpLabel: {
    fontSize: 11,
    color: textTokens.disabled,
    marginTop: 6,
  },

  // ── Stats Grid ──
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: bg.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadows.sm,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statSub: {
    fontSize: 12,
    color: textTokens.tertiary,
    marginLeft: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: textTokens.primary,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  statSubDetail: {
    fontSize: 11,
    color: textTokens.disabled,
    marginTop: 2,
  },

  // ── Action Pills ──
  actionPills: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  actionPill: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillOutline: {
    flex: 1,
    backgroundColor: bg.card,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: borderTokens.primary,
  },
  actionPillTextLight: {
    fontSize: 16,
    fontWeight: '600',
    color: textTokens.inverse,
    marginLeft: 8,
  },
  actionPillTextDark: {
    fontSize: 16,
    fontWeight: '600',
    color: textTokens.primary,
    marginLeft: 8,
  },

  // ── Upgrade Banner ──
  upgradeBanner: {
    marginBottom: 24,
    backgroundColor: brand.muted,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: brand.surface,
    ...shadows.purple,
  },
  upgradeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  upgradeTitleContainer: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: textTokens.primary,
  },
  upgradeSub: {
    fontSize: 13,
    color: textTokens.tertiary,
    marginTop: 2,
  },

  // ── Sign Out ──
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 24,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: semantic.error,
    marginLeft: 8,
  },

  // ── Help Modal ──
  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  helpCard: {
    backgroundColor: bg.elevated,
    borderRadius: radius.lg,
    padding: 24,
    ...shadows.lg,
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: textTokens.primary,
    marginBottom: 8,
  },
  helpBody: {
    fontSize: 15,
    color: textTokens.secondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  helpBtn: {
    backgroundColor: brand.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  helpBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: textTokens.inverse,
  },
});
