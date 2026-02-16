/**
 * Circles — Premium iOS Social Screen
 *
 * Design philosophy: Apple Fitness-inspired. Content-first layout.
 * Circles are the hero. Actions are contextual, not front-and-centre.
 * Swipe RIGHT from AI Hub to access.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Alert,
  ActionSheetIOS,
  Dimensions,
  Platform,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useCircles } from '../../hooks/supabase/useCircles';
import { useChallenges } from '../../hooks/supabase/useChallenges';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { MiniVoiceButton } from '../../components/MiniVoiceButton';
import { CircleHomeModal } from '../modals/CircleHomeModal';
import { ChallengeDetailModal } from '../modals/ChallengeDetailModal';
import { CreateCircleSheet } from '../modals/CreateCircleSheet';
import { CreateChallengeSheet } from '../modals/CreateChallengeSheet';
import { PaywallSheet } from '../modals/PaywallSheet';

import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius, spacing } from '../../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FREE_TIER_CIRCLE_LIMIT = 1;

/* ────────────── Helpers ────────────── */

/** Stacked avatar row — shows up to N initials, +overflow badge */
function AvatarStack({ count, size = 22 }: { count: number; size?: number }) {
  const show = Math.min(count, 4);
  const colours = [brand.primary, brand.secondary, brand.muted, brand.primary];
  return (
    <View style={s.avatarStackRow}>
      {Array.from({ length: show }).map((_, i) => (
        <View
          key={i}
          style={[
            s.avatarCircle,
            {
              width: size, height: size, borderRadius: size / 2,
              backgroundColor: colours[i % colours.length],
              marginLeft: i === 0 ? 0 : -(size * 0.35),
            },
          ]}
        >
          <Ionicons name="person" size={size * 0.45} color="rgba(255,255,255,0.85)" />
        </View>
      ))}
      {count > 4 && (
        <View style={[
          s.avatarOverflowBadge,
          {
            height: size, borderRadius: size / 2,
            marginLeft: -(size * 0.25),
          },
        ]}>
          <Text style={[s.avatarOverflowText, { fontSize: size * 0.4 }]}>+{count - 4}</Text>
        </View>
      )}
    </View>
  );
}

/* ────────────── Component ────────────── */

export function SocialViewScreen() {
  const { circles, loading: circlesLoading, refresh: refreshCircles, joinCircleByCode } = useCircles();
  const { challenges, loading: challengesLoading, refresh: refreshChallenges } = useChallenges();
  const { user } = useSupabaseAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Modals
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [showCircleHome, setShowCircleHome] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showActiveChallenges, setShowActiveChallenges] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const isPremium = (user as any)?.isPremium ?? false;
  const isCircleLimitReached = !isPremium && circles.length >= FREE_TIER_CIRCLE_LIMIT;

  React.useEffect(() => {
    const timer = setTimeout(() => setLoadingTimeout(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const loading = (circlesLoading || challengesLoading) && !loadingTimeout;
  const activeChallenges = useMemo(() => challenges.filter((c: any) => c.status === 'active'), [challenges]);

  // Group challenges by circle
  const challengesByCircle = useMemo(() => {
    const map: Record<string, any[]> = {};
    activeChallenges.forEach((c: any) => {
      const key = c.circle_id || '_global';
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [activeChallenges]);

  // Search-filtered circles
  const filteredCircles = useMemo(() => {
    if (!searchQuery.trim()) return circles;
    const q = searchQuery.trim().toLowerCase();
    return circles.filter((c: any) => (c.name || '').toLowerCase().includes(q));
  }, [circles, searchQuery]);

  // Map circle_id → circle name for Active Challenges modal
  const circleNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    circles.forEach((c: any) => { map[c.id] = c.name || 'Unknown'; });
    return map;
  }, [circles]);

  /* ── Handlers ── */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshCircles(), refreshChallenges()]);
    setRefreshing(false);
  }, [refreshCircles, refreshChallenges]);

  const handleCreateCircle = useCallback(() => {
    if (isCircleLimitReached) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowPaywall(true);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowCreateCircle(true);
    }
  }, [isCircleLimitReached]);

  /** + button — iOS ActionSheet with Create / Join options */
  const handlePlusButton = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Create a Circle', 'Join with Code'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleCreateCircle();
          if (buttonIndex === 2) {
            Alert.prompt(
              'Join a Circle',
              'Enter the invite code you received.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Join',
                  onPress: async (code?: string) => {
                    const trimmed = (code || '').trim();
                    if (!trimmed) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    try {
                      const result = await joinCircleByCode(trimmed);
                      if (result.success) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        refreshCircles();
                      } else {
                        Alert.alert("Couldn't Join", result.error || 'Invalid code or you\'re already a member.');
                      }
                    } catch {
                      Alert.alert("Couldn't Join", 'Something went wrong. Please try again.');
                    }
                  },
                },
              ],
              'plain-text',
              '',
              'default',
            );
          }
        },
      );
    } else {
      // Android fallback — just create
      handleCreateCircle();
    }
  }, [handleCreateCircle, joinCircleByCode, refreshCircles]);

  const openCircle = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCircleId(id);
    setShowCircleHome(true);
  }, []);

  const openChallenge = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChallengeId(id);
    setShowChallengeDetail(true);
  }, []);

  /* ══════════════════════════════════════════════════════════════
   * RENDER HELPERS
   * ══════════════════════════════════════════════════════════════ */

  /* ── Summary Tabs (tappable — Active opens modal) ── */
  const renderSummaryTabs = () => {
    if (circles.length === 0) return null;
    const totalMembers = circles.reduce((sum: number, c: any) => sum + (c.memberCount || 1), 0);
    const tabs = [
      { value: circles.length, label: 'Circles', icon: 'people', color: brand.primary, onPress: undefined },
      { value: totalMembers, label: 'Members', icon: 'person', color: brand.secondary, onPress: undefined },
      { value: activeChallenges.length, label: 'Active', icon: 'trophy', color: semantic.warning, onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowActiveChallenges(true); } },
    ];
    return (
      <View style={s.summaryTabsContainer}>
        {tabs.map((tab, idx) => (
          <TouchableOpacity
            key={tab.label}
            style={[
              s.summaryTab,
              idx > 0 && s.summaryTabBorder,
            ]}
            onPress={tab.onPress}
            activeOpacity={tab.onPress ? 0.6 : 1}
            disabled={!tab.onPress}
            accessibilityRole={tab.onPress ? 'button' : 'text'}
            accessibilityLabel={`${tab.value} ${tab.label}${tab.onPress ? ', tap to view' : ''}`}
          >
            <Ionicons name={tab.icon as any} size={16} color={tab.color} style={s.summaryTabIcon} />
            <Text style={s.summaryTabValue}>{tab.value}</Text>
            <Text style={s.summaryTabLabel}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /* ── Search Bar (iOS WhatsApp-style) ── */
  const renderSearchBar = () => {
    if (circles.length === 0) return null;
    return (
      <View style={s.searchBarContainer}>
        <View style={s.searchBarInner}>
          <Ionicons name="search" size={16} color={textTokens.tertiary} style={s.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search circles"
            placeholderTextColor={textTokens.tertiary}
            style={s.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color={textTokens.disabled} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  /* ── Circle Card (rich, immersive) ── */
  const renderCircleCard = (circle: any) => {
    const challenges = challengesByCircle[circle.id] || [];
    const roleBadge = circle.userRole === 'owner' ? 'Owner' : circle.userRole === 'admin' ? 'Admin' : null;
    const roleColor = circle.userRole === 'owner' ? semantic.warning : brand.primary;

    return (
      <TouchableOpacity
        key={circle.id}
        style={s.circleCard}
        onPress={() => openCircle(circle.id)}
        activeOpacity={0.7}
      >
        {/* Top colour accent bar */}
        <View style={s.circleAccentBar} />

        <View style={s.circleCardInner}>
          {/* Row 1: Emoji + Name + Role */}
          <View style={s.circleRow}>
            <View style={s.circleEmoji}>
              <Text style={s.circleEmojiText}>{circle.emoji || '👥'}</Text>
            </View>
            <View style={s.circleNameContainer}>
              <View style={s.circleNameRow}>
                <Text style={s.circleName} numberOfLines={1}>{circle.name}</Text>
                {roleBadge && (
                  <View style={[s.roleBadge, { backgroundColor: `${roleColor}14` }]}>
                    <Text style={[s.roleBadgeText, { color: roleColor }]}>{roleBadge}</Text>
                  </View>
                )}
              </View>
              <View style={s.circleMemberRow}>
                <AvatarStack count={circle.memberCount || 1} size={20} />
                <Text style={s.circleMemberText}>
                  {circle.memberCount || 1} member{(circle.memberCount || 1) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={textTokens.disabled} />
          </View>

          {/* Description if exists */}
          {circle.description ? (
            <Text numberOfLines={2} style={s.circleDescription}>
              {circle.description}
            </Text>
          ) : null}

          {/* Inline active challenges for this circle */}
          {challenges.length > 0 && (
            <View style={s.inlineChallengesWrapper}>
              <View style={s.inlineChallengesBox}>
                {challenges.slice(0, 2).map((ch: any, idx: number) => {
                  const progress = ch.userProgress || 0;
                  const goal = ch.goal_value || 1;
                  const pct = Math.min((progress / goal) * 100, 100);
                  return (
                    <TouchableOpacity
                      key={ch.id}
                      style={[
                        s.inlineChallengeRow,
                        idx > 0 && { marginTop: 10 },
                      ]}
                      onPress={() => { openChallenge(ch.id); }}
                      activeOpacity={0.7}
                    >
                      <Text style={s.challengeEmoji}>{ch.emoji || '🏆'}</Text>
                      <View style={s.flex1}>
                        <Text numberOfLines={1} style={s.challengeTitle}>{ch.title}</Text>
                        <View style={s.progressBarTrack}>
                          <View style={[s.progressBarFill, { width: `${pct}%`, backgroundColor: pct >= 100 ? semantic.success : brand.primary }]} />
                        </View>
                      </View>
                      <Text style={s.challengePct}>
                        {Math.round(pct)}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {challenges.length > 2 && (
                  <Text style={s.moreChallengesText}>
                    +{challenges.length - 2} more challenge{challenges.length - 2 !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /* ── Solo / Global Challenges — REMOVED from home (visible only inside circles or Active modal) ── */

  /* ── Join Code section REMOVED — now handled via + button ActionSheet ── */

  /* ── Premium Empty State ── */
  const renderEmptyState = () => (
    <View style={s.emptyStateContainer}>
      {/* Decorative circle cluster */}
      <View style={s.decorativeCluster}>
        <View style={s.decorativeLargeCircle} />
        <View style={s.decorativePeopleCircle}>
          <Ionicons name="people" size={26} color={brand.primary} />
        </View>
        <View style={s.decorativeTrophyCircle}>
          <Ionicons name="trophy" size={18} color={semantic.warning} />
        </View>
        <View style={s.decorativeCheckCircle}>
          <Ionicons name="checkmark" size={14} color={semantic.success} />
        </View>
      </View>

      <Text style={s.emptyTitle}>
        Better together
      </Text>
      <Text style={s.emptySubtitle}>
        Create a circle to stay accountable with friends, family, or teammates. Challenge each other and grow.
      </Text>

      <TouchableOpacity
        style={s.createFirstCircleBtn}
        onPress={handleCreateCircle}
        activeOpacity={0.85}
      >
        <Text style={s.createFirstCircleBtnText}>Create Your First Circle</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.inviteCodeBtn}
        onPress={handlePlusButton}
        activeOpacity={0.7}
      >
        <Text style={s.inviteCodeBtnText}>I have an invite code</Text>
      </TouchableOpacity>
    </View>
  );

  /* ══════════════════════════════════════════════════════════════
   * MAIN RENDER
   * ══════════════════════════════════════════════════════════════ */

  const hasContent = circles.length > 0 || activeChallenges.length > 0;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={s.flex1} edges={['top']}>

        {/* ── Header ── */}
        <View style={s.headerContainer}>
          <View style={s.headerRow}>
            <Text style={s.headerTitle}>Circles</Text>
            <View style={s.headerActions}>
              {/* + button — Create or Join */}
              <TouchableOpacity
                style={s.plusButton}
                onPress={handlePlusButton}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={28} color={brand.primary} />
              </TouchableOpacity>
              <MiniVoiceButton position="top-right" screenContext="social" size={50} style={s.voiceButtonInline} />
            </View>
          </View>
          <Text style={s.headerSubtitle}>
            {circles.length > 0
              ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : 'Accountability with your people'}
          </Text>
        </View>

        {/* ── Body ── */}
        {loading && !refreshing ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator color={brand.primary} size="large" />
          </View>
        ) : !hasContent ? (
          <ScrollView
            style={s.flex1}
            contentContainerStyle={s.scrollGrow}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={brand.primary} />}
            keyboardShouldPersistTaps="handled"
          >
            {renderEmptyState()}
          </ScrollView>
        ) : (
          <ScrollView
            style={s.flex1}
            contentContainerStyle={s.contentScrollContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={brand.primary} />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Summary Tabs */}
            {renderSummaryTabs()}

            {/* Search Bar */}
            {renderSearchBar()}

            {/* Circles */}
            {circles.length > 0 && (
              <View style={s.circlesSectionMargin}>
                <View style={s.sectionHeaderRow}>
                  <Text style={s.sectionHeaderText}>
                    Your Circles
                  </Text>
                </View>
                {filteredCircles.length > 0 ? (
                  filteredCircles.map(renderCircleCard)
                ) : (
                  <View style={s.noResultsContainer}>
                    <Ionicons name="search-outline" size={28} color={textTokens.disabled} style={s.noResultsIcon} />
                    <Text style={s.noResultsTitle}>No circles found</Text>
                    <Text style={s.noResultsSubtitle}>Try a different search</Text>
                  </View>
                )}
              </View>
            )}

          </ScrollView>
        )}
      </SafeAreaView>

      {/* ── Modals ── */}
      <CircleHomeModal
        visible={showCircleHome}
        circleId={selectedCircleId}
        onClose={() => { setShowCircleHome(false); setSelectedCircleId(null); refreshCircles(); }}
        onOpenChallenge={(challengeId: string) => { setShowCircleHome(false); setSelectedChallengeId(challengeId); setShowChallengeDetail(true); }}
        onCreateChallenge={() => { setShowCircleHome(false); setShowCreateChallenge(true); }}
      />
      <ChallengeDetailModal
        visible={showChallengeDetail}
        challengeId={selectedChallengeId}
        onClose={() => { setShowChallengeDetail(false); setSelectedChallengeId(null); }}
      />
      <CreateCircleSheet
        visible={showCreateCircle}
        onClose={() => setShowCreateCircle(false)}
        onCircleCreated={() => { setShowCreateCircle(false); refreshCircles(); }}
      />
      <CreateChallengeSheet
        visible={showCreateChallenge}
        onClose={() => setShowCreateChallenge(false)}
        onChallengeCreated={() => { setShowCreateChallenge(false); refreshChallenges(); }}
      />
      <PaywallSheet
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="circle_limit"
      />

      {/* ── Active Challenges Bottom Sheet Modal ── */}
      <Modal
        visible={showActiveChallenges}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActiveChallenges(false)}
      >
        <View style={s.modalOverlay}>
          {/* Backdrop */}
          <Pressable
            style={s.modalBackdrop}
            onPress={() => setShowActiveChallenges(false)}
          />

          {/* Sheet */}
          <View style={s.modalSheet}>
            {/* Drag Handle */}
            <View style={s.dragHandleContainer}>
              <View style={s.dragHandle} />
            </View>

            {/* Header */}
            <View style={s.modalHeaderRow}>
              <View>
                <Text style={s.modalHeaderTitle}>Active Challenges</Text>
                <Text style={s.modalHeaderSubtitle}>Across your circles</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowActiveChallenges(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={s.modalCloseBtn}
              >
                <Ionicons name="close" size={16} color={textTokens.tertiary} />
              </TouchableOpacity>
            </View>

            {/* Challenge List */}
            {activeChallenges.length === 0 ? (
              <View style={s.emptyModalContainer}>
                <View style={s.emptyModalIcon}>
                  <Ionicons name="trophy-outline" size={26} color={semantic.warning} />
                </View>
                <Text style={s.emptyModalTitle}>No active challenges</Text>
                <Text style={s.emptyModalSubtitle}>
                  Create one inside a circle.
                </Text>
              </View>
            ) : (
              <FlatList
                data={activeChallenges}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={s.flatListContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: ch }: { item: any }) => {
                  const circleName = ch.circle_id ? (circleNameMap[ch.circle_id] || 'Unknown circle') : 'Unassigned';
                  if (!ch.circle_id) {
                    console.warn('[ActiveChallengesModal] Challenge has no circle_id:', ch.id, ch.title);
                  }
                  const progress = ch.userProgress || 0;
                  const goal = ch.goal_value || 1;
                  const pct = Math.min((progress / goal) * 100, 100);
                  const daysLeft = ch.ends_at ? Math.max(0, Math.ceil((new Date(ch.ends_at).getTime() - Date.now()) / 86400000)) : null;

                  return (
                    <TouchableOpacity
                      style={s.modalChallengeCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowActiveChallenges(false);
                        if (ch.circle_id) {
                          setTimeout(() => openCircle(ch.circle_id), 300);
                        } else {
                          setTimeout(() => openChallenge(ch.id), 300);
                        }
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${ch.title} in ${circleName}`}
                    >
                      {/* Emoji */}
                      <View style={s.modalChallengeEmoji}>
                        <Text style={s.modalChallengeEmojiText}>{ch.emoji || '🏆'}</Text>
                      </View>

                      {/* Content */}
                      <View style={s.flex1}>
                        <Text numberOfLines={1} style={s.modalChallengeName}>{ch.title}</Text>
                        <View style={s.modalCircleNameRow}>
                          <Ionicons name="people" size={11} color={textTokens.disabled} />
                          <Text numberOfLines={1} style={s.modalCircleNameText}>{circleName}</Text>
                        </View>
                        {/* Progress bar */}
                        <View style={s.modalProgressRow}>
                          <View style={s.modalProgressTrack}>
                            <View style={[s.progressBarFill, { width: `${pct}%`, backgroundColor: pct >= 100 ? semantic.success : semantic.warning }]} />
                          </View>
                          <Text style={s.modalProgressPct}>{Math.round(pct)}%</Text>
                        </View>
                      </View>

                      {/* Days left badge */}
                      {daysLeft !== null && (
                        <View style={[
                          s.daysLeftBadge,
                          { backgroundColor: daysLeft <= 3 ? 'rgba(255,159,10,0.10)' : bg.secondary },
                        ]}>
                          <Text style={[s.daysLeftText, { color: daysLeft <= 3 ? semantic.warning : textTokens.tertiary }]}>{daysLeft}d</Text>
                        </View>
                      )}

                      <Ionicons name="chevron-forward" size={16} color={textTokens.disabled} style={s.chevronSmall} />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ────────────── Styles ────────────── */
const s = StyleSheet.create({
  /* Layout helpers */
  flex1: { flex: 1 },
  scrollGrow: { flexGrow: 1 },
  root: { flex: 1, backgroundColor: bg.primary },

  /* AvatarStack */
  avatarStackRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    borderWidth: 2,
    borderColor: bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverflowBadge: {
    paddingHorizontal: 5,
    backgroundColor: borderTokens.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: bg.card,
  },
  avatarOverflowText: { fontWeight: '700', color: textTokens.tertiary },

  /* Summary Tabs */
  summaryTabsContainer: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: bg.card,
    borderRadius: 18,
    flexDirection: 'row',
    ...shadows.sm,
    overflow: 'hidden',
  },
  summaryTab: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  summaryTabBorder: { borderLeftWidth: 0.5, borderLeftColor: borderTokens.primary },
  summaryTabIcon: { marginBottom: 6, opacity: 0.85 },
  summaryTabValue: { fontSize: 22, fontWeight: '800', color: textTokens.primary, letterSpacing: -0.5 },
  summaryTabLabel: { fontSize: 11, fontWeight: '600', color: textTokens.tertiary, marginTop: 2, letterSpacing: 0.3, textTransform: 'uppercase' },

  /* Search Bar */
  searchBarContainer: { marginHorizontal: 16, marginBottom: 16 },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: bg.secondary,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '400', color: textTokens.primary, paddingVertical: 0 },

  /* Circle Card */
  circleCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: bg.card,
    borderRadius: radius.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  circleAccentBar: { height: 3, backgroundColor: brand.primary, opacity: 0.7 },
  circleCardInner: { padding: 18 },
  circleRow: { flexDirection: 'row', alignItems: 'center' },
  circleEmoji: {
    width: 50,
    height: 50,
    borderRadius: radius.lg,
    backgroundColor: brand.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleEmojiText: { fontSize: 24 },
  circleNameContainer: { flex: 1, marginLeft: 14 },
  circleNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  circleName: { fontSize: 17, fontWeight: '700', color: textTokens.primary, flexShrink: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 },
  roleBadgeText: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  circleMemberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 12 },
  circleMemberText: { fontSize: 12.5, color: textTokens.tertiary, fontWeight: '500' },
  circleDescription: { fontSize: 13.5, color: textTokens.tertiary, lineHeight: 19, marginTop: 12, marginLeft: 64 },

  /* Inline Challenges */
  inlineChallengesWrapper: { marginTop: 14, marginLeft: 64 },
  inlineChallengesBox: { backgroundColor: bg.secondary, borderRadius: radius.md, padding: 12 },
  inlineChallengeRow: { flexDirection: 'row', alignItems: 'center' },
  challengeEmoji: { fontSize: 16, marginRight: 8 },
  challengeTitle: { fontSize: 13, fontWeight: '600', color: textTokens.primary },
  progressBarTrack: { height: 4, backgroundColor: borderTokens.primary, borderRadius: 2, marginTop: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  challengePct: { fontSize: 11, fontWeight: '600', color: textTokens.tertiary, marginLeft: 10 },
  moreChallengesText: { fontSize: 11.5, color: brand.primary, fontWeight: '600', marginTop: 8 },

  /* Empty State */
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  decorativeCluster: { width: 120, height: 120, marginBottom: 28, position: 'relative' },
  decorativeLargeCircle: {
    position: 'absolute', top: 10, left: 10,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: brand.muted,
  },
  decorativePeopleCircle: {
    position: 'absolute', top: 0, left: 30,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: brand.surface, alignItems: 'center', justifyContent: 'center',
  },
  decorativeTrophyCircle: {
    position: 'absolute', bottom: 8, right: 5,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,159,10,0.10)', alignItems: 'center', justifyContent: 'center',
  },
  decorativeCheckCircle: {
    position: 'absolute', bottom: 25, left: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(52,199,89,0.10)', alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: textTokens.primary, textAlign: 'center', letterSpacing: -0.4 },
  emptySubtitle: { fontSize: 15, color: textTokens.tertiary, marginTop: 10, textAlign: 'center', lineHeight: 22 },
  createFirstCircleBtn: {
    marginTop: 28, width: '100%',
    backgroundColor: brand.primary, paddingVertical: 16, borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.purple,
  },
  createFirstCircleBtnText: { fontSize: 16, fontWeight: '700', color: textTokens.inverse },
  inviteCodeBtn: { marginTop: 16, paddingVertical: 12 },
  inviteCodeBtnText: { fontSize: 14, fontWeight: '600', color: brand.primary },

  /* Header */
  headerContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42 },
  headerTitle: { fontSize: 34, fontWeight: '800', color: textTokens.primary, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  plusButton: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: brand.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  voiceButtonInline: { position: 'relative', top: 0, right: 0 },
  headerSubtitle: { fontSize: 13, color: textTokens.tertiary, marginTop: 2, fontWeight: '500' },

  /* Loading */
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Content Scroll */
  contentScrollContainer: { paddingTop: 8, paddingBottom: 100 },

  /* Section headers */
  circlesSectionMargin: { marginBottom: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  sectionHeaderText: { fontSize: 12, fontWeight: '700', color: textTokens.tertiary, letterSpacing: 0.5, textTransform: 'uppercase', flex: 1 },

  /* No results */
  noResultsContainer: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 40 },
  noResultsIcon: { marginBottom: 10 },
  noResultsTitle: { fontSize: 15, fontWeight: '600', color: textTokens.tertiary, textAlign: 'center' },
  noResultsSubtitle: { fontSize: 13, color: textTokens.disabled, marginTop: 4, textAlign: 'center' },

  /* Active Challenges Modal */
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: {
    height: SCREEN_HEIGHT * 0.75,
    backgroundColor: bg.primary,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    ...shadows.lg,
    elevation: 10,
  },
  dragHandleContainer: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: textTokens.disabled },

  modalHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary,
  },
  modalHeaderTitle: { fontSize: 22, fontWeight: '700', color: textTokens.primary },
  modalHeaderSubtitle: { fontSize: 13, color: textTokens.tertiary, marginTop: 2, fontWeight: '500' },
  modalCloseBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: bg.secondary,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Empty modal */
  emptyModalContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 40 },
  emptyModalIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: 'rgba(255,159,10,0.10)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyModalTitle: { fontSize: 17, fontWeight: '600', color: textTokens.primary, textAlign: 'center' },
  emptyModalSubtitle: { fontSize: 14, color: textTokens.tertiary, marginTop: 6, textAlign: 'center', lineHeight: 20 },

  /* FlatList */
  flatListContent: { paddingTop: 8, paddingBottom: 40 },

  /* Modal challenge card */
  modalChallengeCard: {
    marginHorizontal: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: bg.card, borderRadius: radius.lg, padding: 16,
    ...shadows.sm,
  },
  modalChallengeEmoji: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,159,10,0.10)',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  modalChallengeEmojiText: { fontSize: 22 },
  modalChallengeName: { fontSize: 15, fontWeight: '600', color: textTokens.primary },
  modalCircleNameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 },
  modalCircleNameText: { fontSize: 12.5, color: textTokens.tertiary, fontWeight: '500' },
  modalProgressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  modalProgressTrack: { flex: 1, height: 4, backgroundColor: borderTokens.primary, borderRadius: 2, overflow: 'hidden' },
  modalProgressPct: { fontSize: 11, fontWeight: '600', color: textTokens.tertiary, minWidth: 32, textAlign: 'right' },

  /* Days left badge */
  daysLeftBadge: { marginLeft: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  daysLeftText: { fontSize: 11, fontWeight: '700' },

  chevronSmall: { marginLeft: 4 },
});
