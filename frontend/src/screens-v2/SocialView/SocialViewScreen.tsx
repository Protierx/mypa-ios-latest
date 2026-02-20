/**
 * Circles — Premium iOS Social Screen v2
 *
 * Design: Apple Health / Fitness+ inspired. Spacious, content-first.
 * Glassmorphic stat cards, immersive circle cards, native iOS feel.
 * Every function from v1 preserved — zero deletions.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useCircles } from '../../hooks/supabase/useCircles';
import { useChallenges } from '../../hooks/supabase/useChallenges';
import { useCirclesHome, CircleHomeItem } from '../../hooks/supabase/useCirclesHome';
import { useCircleCheckinStatus } from '../../hooks/supabase/useCircleCheckinStatus';
import { useNewPosts } from '../../hooks/supabase/useNewPosts';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../lib/supabase';
import { MiniVoiceButton } from '../../components/MiniVoiceButton';
import { CircleHomeModal } from '../modals/CircleHomeModal';
import { ChallengeDetailModal } from '../modals/ChallengeDetailModal';
import { CreateCircleSheet } from '../modals/CreateCircleSheet';
import { CreateChallengeSheet } from '../modals/CreateChallengeSheet';
import { PaywallSheet } from '../modals/PaywallSheet';

import { navigationBus } from '../../services/navigationBus';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius, spacing } from '../../styles/theme';
import { useEnterAnimation, usePressFeedback, useStaggerIn } from '../../styles/motion';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FREE_TIER_CIRCLE_LIMIT = 3;
const CARD_WIDTH = SCREEN_WIDTH - 40;

/* ────────────── Helpers ────────────── */

/** Stacked avatar row — shows up to N initials, +overflow badge */
function AvatarStack({ count, size = 24 }: { count: number; size?: number }) {
  const show = Math.min(count, 4);
  const colours = [brand.primary, brand.secondary, brand.tertiary, '#9333EA'];
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
              marginLeft: i === 0 ? 0 : -(size * 0.3),
            },
          ]}
        >
          <Ionicons name="person" size={size * 0.45} color="#FFFFFF" />
        </View>
      ))}
      {count > 4 && (
        <View style={[
          s.avatarOverflowBadge,
          {
            height: size, borderRadius: size / 2,
            marginLeft: -(size * 0.2),
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
  // ── Data hooks ──
  // useCirclesHome = primary display data (RPCs: circles_home_all + circles_home_counts)
  // useCircles     = mutations only (joinCircleByCode, refresh for real-time sync)
  // useChallenges  = active challenges modal
  const { circles: circlesHome, counts, loading: homeLoading, error: homeError, refresh: refreshHome } = useCirclesHome();
  const { joinCircleByCode } = useCircles();
  const { challenges, loading: challengesLoading, error: challengesError, refresh: refreshChallenges } = useChallenges();
  const { user } = useSupabaseAuth();

  /* ── Animations ── */
  const headerAnim = useEnterAnimation(18, 450, 0);
  const tabsAnim = useEnterAnimation(14, 400, 100);
  const { animatedStyle: plusPressStyle, pressHandlers: plusPressHandlers } = usePressFeedback(0.88);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Modals
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [showCircleHome, setShowCircleHome] = useState(false);
  const [circleHomeInitialTab, setCircleHomeInitialTab] = useState<'feed' | 'challenges' | 'overview' | undefined>(undefined);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [createChallengeCircleId, setCreateChallengeCircleId] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showActiveChallenges, setShowActiveChallenges] = useState(false);
  const [showAllCircles, setShowAllCircles] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tabs: 'all' | 'checkin' | 'newposts'
  type FilterTab = 'all' | 'checkin' | 'newposts';
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const circleIds = useMemo(() => circlesHome.map((c) => c.circle_id), [circlesHome]);
  const { needsCheckIn, refresh: refreshCheckinStatus } = useCircleCheckinStatus(circleIds);
  const { circles: newPostsCircles, refresh: refreshNewPosts, markSeen, hasNewPosts, newPostsCount, totalCount: newPostsTotalCount } = useNewPosts();
  const [circleHomeFocus, setCircleHomeFocus] = useState<'checkin' | undefined>(undefined);

  const isPremium = (user as any)?.isPremium ?? false;
  const isCircleLimitReached = !isPremium && circlesHome.length >= FREE_TIER_CIRCLE_LIMIT;

  React.useEffect(() => {
    const timer = setTimeout(() => setLoadingTimeout(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const loading = (homeLoading || challengesLoading) && !loadingTimeout;
  const activeChallenges = useMemo(() => challenges.filter((c: any) => c.status === 'active' && c.circle_id), [challenges]);

  // Filtered circles: filter tab → search
  const filteredCircles = useMemo(() => {
    let result = circlesHome;
    if (activeFilter === 'checkin') {
      result = result.filter((c) => needsCheckIn(c.circle_id));
    } else if (activeFilter === 'newposts') {
      // Only show circles that have new (unread) posts
      const newPostIds = new Set(newPostsCircles.map((np) => np.circle_id));
      result = result.filter((c) => newPostIds.has(c.circle_id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((c) => (c.circle_name || '').toLowerCase().includes(q));
    }
    return result;
  }, [circlesHome, searchQuery, activeFilter, needsCheckIn, newPostsCircles]);

  // Map circle_id → circle name for Active Challenges modal
  const circleNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    circlesHome.forEach((c) => { map[c.circle_id] = c.circle_name || 'Unknown'; });
    return map;
  }, [circlesHome]);

  /* ── Handlers ── */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshHome(), refreshChallenges(), refreshCheckinStatus(), refreshNewPosts()]);
    setRefreshing(false);
  }, [refreshHome, refreshChallenges, refreshCheckinStatus, refreshNewPosts]);

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
                        refreshHome();
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
  }, [handleCreateCircle, joinCircleByCode, refreshHome]);

  const openCircle = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCircleId(id);
    setCircleHomeFocus(undefined);
    setShowCircleHome(true);
    // Mark circle as seen (fire-and-forget) so new-posts count clears
    markSeen(id);
  }, [markSeen]);

  const openCircleToCheckin = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCircleId(id);
    setCircleHomeInitialTab('overview');
    setCircleHomeFocus('checkin');
    setShowCircleHome(true);
  }, []);

  const openChallenge = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChallengeId(id);
    setShowChallengeDetail(true);
  }, []);

  // Listen for challenge-open events from notification taps
  useEffect(() => {
    const unsub = navigationBus.onOpenChallenge((challengeId) => {
      setSelectedChallengeId(challengeId);
      setShowChallengeDetail(true);
    });
    return unsub;
  }, []);

  /* ══════════════════════════════════════════════════════════════
   * RENDER HELPERS
   * ══════════════════════════════════════════════════════════════ */

  /* ── Summary Stats (glassmorphic cards) ── */
  const renderSummaryTabs = () => {
    if (circlesHome.length === 0) return null;
    const tabs = [
      { value: counts.circles_count, label: 'Circles', icon: 'people', gradient: [brand.primary, brand.secondary] as const, onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAllCircles(true); } },
      { value: counts.unique_members_count, label: 'Members', icon: 'person-circle', gradient: [brand.tertiary, brand.primary] as const, onPress: async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowAllMembers(true);
        setMembersLoading(true);
        try {
          const { data, error } = await supabase.rpc('circles_all_members');
          if (!error && data) setAllMembers(data);
        } catch (e) { console.error('[Members] fetch error:', e); }
        finally { setMembersLoading(false); }
      } },
      { value: counts.active_challenges_count, label: 'Active', icon: 'flame', gradient: ['#FF6B35', '#FF3D00'] as const, onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowActiveChallenges(true); } },
    ];
    return (
      <Animated.View style={[s.summaryCardsRow, tabsAnim]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.label}
            style={s.summaryCard}
            onPress={tab.onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${tab.value} ${tab.label}, tap to view`}
          >
            <View style={s.summaryCardGradientWrap}>
              <LinearGradient
                colors={tab.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.summaryCardGradient}
              >
                <Ionicons name={tab.icon as any} size={18} color="rgba(255,255,255,0.9)" />
              </LinearGradient>
            </View>
            <Text style={s.summaryCardValue}>{tab.value}</Text>
            <Text style={s.summaryCardLabel}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    );
  };

  /* ── Search Bar (Apple-native style) ── */
  const renderSearchBar = () => {
    if (circlesHome.length === 0) return null;
    return (
      <View style={s.searchBarContainer}>
        <View style={s.searchBarInner}>
          <Ionicons name="search" size={17} color={textTokens.tertiary} style={s.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search circles..."
            placeholderTextColor={textTokens.disabled}
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

  /* ── Circle Card (premium immersive design) ── */
  const renderCircleCard = (circle: CircleHomeItem, index: number) => {
    const roleBadge = circle.role === 'owner' ? 'Owner' : circle.role === 'admin' ? 'Admin' : 'Member';
    const roleColor = circle.role === 'owner' ? '#FF6B35' : circle.role === 'admin' ? brand.primary : textTokens.tertiary;
    const roleIcon = circle.role === 'owner' ? 'shield-checkmark' : circle.role === 'admin' ? 'star' : 'person';
    const showRoleBadge = true;
    const isCheckin = activeFilter === 'checkin' && needsCheckIn(circle.circle_id);
    const isNewPosts = activeFilter === 'newposts' && hasNewPosts(circle.circle_id);

    return (
      <TouchableOpacity
        key={circle.circle_id}
        style={s.circleCard}
        onPress={() => openCircle(circle.circle_id)}
        activeOpacity={0.65}
        accessibilityRole="button"
        accessibilityLabel={`${circle.circle_name}, ${roleBadge}, ${circle.member_count} members`}
      >
        <View style={s.circleCardInner}>
          {/* Row 1: Large Emoji + Title block */}
          <View style={s.circleTopRow}>
            <View style={s.circleEmojiWrap}>
              <Text style={s.circleEmojiText}>{circle.circle_emoji || '👥'}</Text>
            </View>
            <View style={s.circleInfoBlock}>
              <Text style={s.circleName} numberOfLines={1}>{circle.circle_name}</Text>
              <View style={s.circleMetaRow}>
                <AvatarStack count={circle.member_count} size={20} />
                <Text style={s.circleMemberCount}>
                  {circle.member_count} member{circle.member_count !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View style={s.circleChevronWrap}>
              <Ionicons name="chevron-forward" size={16} color={textTokens.disabled} />
            </View>
          </View>

          {/* Description */}
          {circle.circle_description ? (
            <Text numberOfLines={2} style={s.circleDescription}>
              {circle.circle_description}
            </Text>
          ) : null}

          {/* Bottom row: badges */}
          <View style={s.circleBottomRow}>
            {/* Role badge */}
            {showRoleBadge && (
              <View style={[s.roleBadge, { backgroundColor: `${roleColor}12` }]}>
                <Ionicons name={roleIcon as any} size={10} color={roleColor} />
                <Text style={[s.roleBadgeText, { color: roleColor }]}>{roleBadge}</Text>
              </View>
            )}

            {/* Active challenges */}
            {circle.active_challenges_count > 0 && (
              <View style={s.challengePill}>
                <Ionicons name="flame" size={11} color="#FF6B35" />
                <Text style={s.challengePillText}>
                  {circle.active_challenges_count} challenge{circle.active_challenges_count !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {/* New posts indicator */}
            {isNewPosts && (
              <View style={s.newPostsPill}>
                <View style={s.newPostsDot} />
                <Text style={s.newPostsPillText}>
                  {newPostsCount(circle.circle_id)} new
                </Text>
              </View>
            )}
          </View>

          {/* Needs check-in CTA */}
          {isCheckin && (
            <View style={s.checkinCtaRow}>
              <View style={s.checkinCtaLeft}>
                <View style={s.checkinPulse} />
                <Text style={s.checkinCtaText}>You haven't checked in today</Text>
              </View>
              <TouchableOpacity
                style={s.checkinCtaBtn}
                onPress={(e) => { e.stopPropagation?.(); openCircleToCheckin(circle.circle_id); }}
                activeOpacity={0.75}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Check in to ${circle.circle_name}`}
              >
                <Ionicons name="hand-left" size={12} color="#FFFFFF" />
                <Text style={s.checkinCtaBtnText}>Check In</Text>
              </TouchableOpacity>
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
      {/* Decorative illustration */}
      <View style={s.emptyIllustration}>
        <LinearGradient
          colors={['rgba(185, 88, 255, 0.08)', 'rgba(185, 88, 255, 0.15)', 'rgba(185, 88, 255, 0.08)']}
          style={s.emptyGradientOrb}
        >
          <View style={s.emptyIconRing}>
            <Ionicons name="people" size={36} color={brand.primary} />
          </View>
        </LinearGradient>
        <View style={s.emptyFloatingBadge1}>
          <Ionicons name="trophy" size={16} color="#FF6B35" />
        </View>
        <View style={s.emptyFloatingBadge2}>
          <Ionicons name="checkmark-circle" size={16} color={semantic.success} />
        </View>
        <View style={s.emptyFloatingBadge3}>
          <Ionicons name="chatbubbles" size={14} color={brand.secondary} />
        </View>
      </View>

      <Text style={s.emptyTitle}>Better together</Text>
      <Text style={s.emptySubtitle}>
        Create a circle to stay accountable with{'\n'}friends, family, or teammates.
      </Text>

      <TouchableOpacity
        style={s.createFirstCircleBtn}
        onPress={handleCreateCircle}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[brand.primary, brand.tertiary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.createBtnGradient}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={s.createFirstCircleBtnText}>Create Your First Circle</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.inviteCodeBtn}
        onPress={handlePlusButton}
        activeOpacity={0.7}
      >
        <Ionicons name="key-outline" size={16} color={brand.primary} />
        <Text style={s.inviteCodeBtnText}>I have an invite code</Text>
      </TouchableOpacity>
    </View>
  );

  /* ══════════════════════════════════════════════════════════════
   * MAIN RENDER
   * ══════════════════════════════════════════════════════════════ */

  const hasContent = circlesHome.length > 0 || activeChallenges.length > 0;
  const hasError = (homeError || challengesError) && !hasContent;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={s.flex1} edges={['top']}>

        {/* ── Hero Header ── */}
        <Animated.View style={[s.headerContainer, headerAnim]}>
          <View style={s.headerTopRow}>
            <View>
              <Text style={s.headerTitle}>Circles</Text>
              <Text style={s.headerSubtitle}>
                {circlesHome.length > 0
                  ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  : 'Accountability with your people'}
              </Text>
            </View>
            <View style={s.headerActions}>
              <TouchableWithoutFeedback
                onPressIn={plusPressHandlers.onPressIn}
                onPressOut={plusPressHandlers.onPressOut}
                onPress={handlePlusButton}
              >
                <Animated.View style={[s.plusButton, plusPressStyle]}>
                  <LinearGradient
                    colors={[brand.primary, brand.tertiary]}
                    style={s.plusButtonGradient}
                  >
                    <Ionicons name="add" size={26} color="#FFFFFF" />
                  </LinearGradient>
                </Animated.View>
              </TouchableWithoutFeedback>
              <MiniVoiceButton position="top-right" screenContext="social" size={46} style={s.voiceButtonInline} />
            </View>
          </View>
        </Animated.View>

        {/* ── Body ── */}
        {loading && !refreshing ? (
          <ScrollView style={s.flex1} contentContainerStyle={s.contentScrollContainer}>
            {/* Skeleton stat cards */}
            <View style={[s.summaryCardsRow, { opacity: 0.4 }]}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={s.summaryCard}>
                  <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: borderTokens.primary, marginBottom: 10 }} />
                  <View style={{ width: 28, height: 22, borderRadius: 6, backgroundColor: borderTokens.primary, marginBottom: 6 }} />
                  <View style={{ width: 48, height: 10, borderRadius: 4, backgroundColor: borderTokens.primary }} />
                </View>
              ))}
            </View>
            {/* Skeleton circle cards */}
            {[1, 2, 3].map((i) => (
              <View key={i} style={[s.circleCard, { opacity: 0.35 }]}>
                <View style={s.circleCardInner}>
                  <View style={s.circleTopRow}>
                    <View style={[s.circleEmojiWrap, { backgroundColor: borderTokens.primary }]} />
                    <View style={[s.circleInfoBlock, { gap: 10 }]}>
                      <View style={{ width: 130, height: 16, borderRadius: 6, backgroundColor: borderTokens.primary }} />
                      <View style={{ width: 90, height: 12, borderRadius: 4, backgroundColor: borderTokens.primary }} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : hasError ? (
          <View style={s.errorContainer}>
            <View style={s.errorIconWrap}>
              <Ionicons name="cloud-offline-outline" size={36} color={textTokens.disabled} />
            </View>
            <Text style={s.errorTitle}>Couldn't load circles</Text>
            <Text style={s.errorSubtitle}>Check your connection and try again.</Text>
            <TouchableOpacity style={s.retryBtn} onPress={handleRefresh} activeOpacity={0.7}>
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={s.retryBtnText}>Retry</Text>
            </TouchableOpacity>
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
            {/* Summary Stats */}
            {renderSummaryTabs()}

            {/* Search */}
            {renderSearchBar()}

            {/* Filter Bar — iOS segmented style */}
            {circlesHome.length > 0 && (
              <View style={s.filterBarWrap}>
                <View style={s.filterBar}>
                  {/* All */}
                  <TouchableOpacity
                    style={[s.filterSegment, activeFilter === 'all' && s.filterSegmentActive]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveFilter('all'); }}
                    activeOpacity={0.7}
                    accessibilityRole="tab"
                    accessibilityLabel="All circles"
                    accessibilityState={{ selected: activeFilter === 'all' }}
                  >
                    <Text style={[s.filterSegmentText, activeFilter === 'all' && s.filterSegmentTextActive]}>All</Text>
                  </TouchableOpacity>

                  {/* Needs Check-in */}
                  <TouchableOpacity
                    style={[s.filterSegment, activeFilter === 'checkin' && s.filterSegmentActive]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveFilter('checkin'); }}
                    activeOpacity={0.7}
                    accessibilityRole="tab"
                    accessibilityLabel="Needs Check-in"
                    accessibilityState={{ selected: activeFilter === 'checkin' }}
                  >
                    <Text style={[s.filterSegmentText, activeFilter === 'checkin' && s.filterSegmentTextActive]}>Check-in</Text>
                  </TouchableOpacity>

                  {/* New Posts */}
                  <TouchableOpacity
                    style={[s.filterSegment, activeFilter === 'newposts' && s.filterSegmentActive]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveFilter('newposts'); refreshNewPosts(); }}
                    activeOpacity={0.7}
                    accessibilityRole="tab"
                    accessibilityLabel={`New Posts${newPostsTotalCount > 0 ? `, ${newPostsTotalCount} circles` : ''}`}
                    accessibilityState={{ selected: activeFilter === 'newposts' }}
                  >
                    <Text style={[s.filterSegmentText, activeFilter === 'newposts' && s.filterSegmentTextActive]}>New Posts</Text>
                    {newPostsTotalCount > 0 && activeFilter !== 'newposts' && (
                      <View style={s.filterBadge}>
                        <Text style={s.filterBadgeText}>{newPostsTotalCount > 9 ? '9+' : newPostsTotalCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Circle Cards */}
            {circlesHome.length > 0 && (
              <View style={s.circlesSectionWrap}>
                {filteredCircles.length > 0 ? (
                  filteredCircles.map((c, i) => renderCircleCard(c, i))
                ) : activeFilter === 'checkin' ? (
                  <View style={s.filterEmptyContainer}>
                    <View style={[s.filterEmptyIcon, { backgroundColor: semantic.successLight }]}>
                      <Ionicons name="checkmark-circle" size={32} color={semantic.success} />
                    </View>
                    <Text style={s.filterEmptyTitle}>All checked in</Text>
                    <Text style={s.filterEmptySubtitle}>You're done for today — great job!</Text>
                  </View>
                ) : activeFilter === 'newposts' ? (
                  <View style={s.filterEmptyContainer}>
                    <View style={[s.filterEmptyIcon, { backgroundColor: brand.muted }]}>
                      <Ionicons name="chatbubbles" size={32} color={brand.primary} />
                    </View>
                    <Text style={s.filterEmptyTitle}>No new posts</Text>
                    <Text style={s.filterEmptySubtitle}>You're all caught up.</Text>
                  </View>
                ) : (
                  <View style={s.filterEmptyContainer}>
                    <Ionicons name="search-outline" size={28} color={textTokens.disabled} />
                    <Text style={s.filterEmptyTitle}>No circles found</Text>
                    <Text style={s.filterEmptySubtitle}>Try a different search</Text>
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
        initialTab={circleHomeInitialTab}
        initialFocus={circleHomeFocus}
        onClose={() => { setShowCircleHome(false); setSelectedCircleId(null); setCircleHomeInitialTab(undefined); setCircleHomeFocus(undefined); refreshHome(); refreshCheckinStatus(); refreshNewPosts(); }}
        onOpenChallenge={(challengeId: string) => { setShowCircleHome(false); setSelectedChallengeId(challengeId); setShowChallengeDetail(true); }}
        onCreateChallenge={() => { setShowCircleHome(false); setCreateChallengeCircleId(selectedCircleId); setShowCreateChallenge(true); }}
      />
      <ChallengeDetailModal
        visible={showChallengeDetail}
        challengeId={selectedChallengeId}
        onClose={() => { setShowChallengeDetail(false); setSelectedChallengeId(null); }}
      />
      <CreateCircleSheet
        visible={showCreateCircle}
        onClose={() => setShowCreateCircle(false)}
        onCircleCreated={() => { setShowCreateCircle(false); refreshHome(); }}
      />
      <CreateChallengeSheet
        visible={showCreateChallenge}
        circleId={createChallengeCircleId || undefined}
        onClose={() => {
          const circleId = createChallengeCircleId;
          setShowCreateChallenge(false);
          setCreateChallengeCircleId(null);
          // Reopen circle modal so user returns to where they came from
          if (circleId) {
            setTimeout(() => {
              setSelectedCircleId(circleId);
              setCircleHomeInitialTab('challenges');
              setShowCircleHome(true);
            }, 350);
          }
        }}
        onChallengeCreated={(challenge) => {
          setShowCreateChallenge(false);
          refreshChallenges();
          const circleId = createChallengeCircleId;
          setCreateChallengeCircleId(null);
          // Open Challenge Detail for the newly created challenge
          // Use setTimeout to let the CreateChallengeSheet Modal fully dismiss first
          if (challenge?.id) {
            setTimeout(() => {
              setSelectedChallengeId(challenge.id);
              setShowChallengeDetail(true);
            }, 350);
          } else if (circleId) {
            // Fallback: reopen circle modal on Challenges tab so the new challenge is visible
            setTimeout(() => {
              setSelectedCircleId(circleId);
              setCircleHomeInitialTab('challenges');
              setShowCircleHome(true);
            }, 350);
          }
        }}
      />
      <PaywallSheet
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="circle_limit"
      />

      {/* ── All Circles Bottom Sheet Modal ── */}
      <Modal
        visible={showAllCircles}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllCircles(false)}
      >
        <View style={s.modalOverlay}>
          <Pressable style={s.modalBackdrop} onPress={() => setShowAllCircles(false)} />
          <View style={s.modalSheet}>
            <View style={s.dragHandleContainer}>
              <View style={s.dragHandle} />
            </View>
            <View style={s.modalHeaderRow}>
              <View>
                <Text style={s.modalHeaderTitle}>Your Circles</Text>
                <Text style={s.modalHeaderSubtitle}>{counts.circles_count} circle{counts.circles_count !== 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAllCircles(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={s.modalCloseBtn}
              >
                <Ionicons name="close" size={16} color={textTokens.tertiary} />
              </TouchableOpacity>
            </View>
            {circlesHome.length === 0 ? (
              <View style={s.emptyModalContainer}>
                <View style={[s.emptyModalIcon, { backgroundColor: brand.muted }]}> 
                  <Ionicons name="people-outline" size={26} color={brand.primary} />
                </View>
                <Text style={s.emptyModalTitle}>No circles yet</Text>
                <Text style={s.emptyModalSubtitle}>Create or join a circle to get started.</Text>
              </View>
            ) : (
              <FlatList
                data={circlesHome}
                keyExtractor={(item) => item.circle_id}
                contentContainerStyle={s.flatListContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: circle }) => {
                  const roleBadge = circle.role === 'owner' ? 'Owner' : circle.role === 'admin' ? 'Admin' : 'Member';
                  const roleColor = circle.role === 'owner' ? semantic.warning : circle.role === 'admin' ? brand.primary : textTokens.tertiary;
                  return (
                    <TouchableOpacity
                      style={s.modalListCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowAllCircles(false);
                        setTimeout(() => openCircle(circle.circle_id), 300);
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${circle.circle_name}, ${roleBadge}`}
                    >
                      <View style={s.modalListEmoji}>
                        <Text style={s.modalListEmojiText}>{circle.circle_emoji || '👥'}</Text>
                      </View>
                      <View style={s.flex1}>
                        <View style={s.modalListNameRow}>
                          <Text numberOfLines={1} style={s.modalListName}>{circle.circle_name}</Text>
                          <View style={[s.modalRoleBadge, { backgroundColor: `${roleColor}14` }]}>
                            <Text style={[s.modalRoleBadgeText, { color: roleColor }]}>{roleBadge}</Text>
                          </View>
                        </View>
                        <View style={s.modalListSubRow}>
                          <Ionicons name="people" size={11} color={textTokens.disabled} />
                          <Text style={s.modalListSubText}>{circle.member_count} member{circle.member_count !== 1 ? 's' : ''}</Text>
                          {circle.active_challenges_count > 0 && (
                            <>
                              <Text style={s.modalListDot}>·</Text>
                              <Ionicons name="trophy" size={11} color={semantic.warning} />
                              <Text style={s.modalListSubText}>{circle.active_challenges_count} active</Text>
                            </>
                          )}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={textTokens.disabled} style={s.chevronSmall} />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ── All Members Bottom Sheet Modal ── */}
      <Modal
        visible={showAllMembers}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllMembers(false)}
      >
        <View style={s.modalOverlay}>
          <Pressable style={s.modalBackdrop} onPress={() => setShowAllMembers(false)} />
          <View style={s.modalSheet}>
            <View style={s.dragHandleContainer}>
              <View style={s.dragHandle} />
            </View>
            <View style={s.modalHeaderRow}>
              <View>
                <Text style={s.modalHeaderTitle}>All Members</Text>
                <Text style={s.modalHeaderSubtitle}>{counts.unique_members_count} across your circles</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAllMembers(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={s.modalCloseBtn}
              >
                <Ionicons name="close" size={16} color={textTokens.tertiary} />
              </TouchableOpacity>
            </View>
            {membersLoading ? (
              <View style={s.emptyModalContainer}>
                <Text style={s.modalListSubText}>Loading members…</Text>
              </View>
            ) : allMembers.length === 0 ? (
              <View style={s.emptyModalContainer}>
                <View style={[s.emptyModalIcon, { backgroundColor: brand.muted }]}>
                  <Ionicons name="person-outline" size={26} color={brand.secondary} />
                </View>
                <Text style={s.emptyModalTitle}>No members yet</Text>
                <Text style={s.emptyModalSubtitle}>Members will appear when you join or create circles.</Text>
              </View>
            ) : (
              <FlatList
                data={allMembers}
                keyExtractor={(item) => item.user_id}
                contentContainerStyle={s.flatListContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: member }) => {
                  const name = member.display_name || member.username || 'Unknown';
                  const initials = name.slice(0, 1).toUpperCase();
                  const circleList = (member.circle_names || []).join(', ');
                  return (
                    <View style={s.modalMemberCard}>
                      {member.avatar_url ? (
                        <View style={s.modalMemberAvatar}>
                          <Text style={s.modalMemberAvatarText}>{initials}</Text>
                        </View>
                      ) : (
                        <View style={[s.modalMemberAvatar, member.is_self && { backgroundColor: brand.primary }]}>
                          <Text style={s.modalMemberAvatarText}>{initials}</Text>
                        </View>
                      )}
                      <View style={s.flex1}>
                        <View style={s.modalListNameRow}>
                          <Text numberOfLines={1} style={s.modalListName}>{name}</Text>
                          {member.is_self && (
                            <View style={[s.modalRoleBadge, { backgroundColor: `${brand.primary}14` }]}>
                              <Text style={[s.modalRoleBadgeText, { color: brand.primary }]}>You</Text>
                            </View>
                          )}
                        </View>
                        <View style={s.modalListSubRow}>
                          <Ionicons name="people" size={11} color={textTokens.disabled} />
                          <Text numberOfLines={1} style={[s.modalListSubText, { flex: 1 }]}>{member.circle_count} circle{member.circle_count !== 1 ? 's' : ''} · {circleList}</Text>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

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
                  const circleName = circleNameMap[ch.circle_id] || 'Unknown circle';
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
                        setTimeout(() => openChallenge(ch.id), 300);
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
                          { backgroundColor: daysLeft <= 3 ? semantic.warningLight : bg.secondary },
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

/* ────────────── Styles — Premium iOS v2 ────────────── */
const s = StyleSheet.create({
  /* ── Layout helpers ── */
  flex1: { flex: 1 },
  scrollGrow: { flexGrow: 1 },
  root: { flex: 1, backgroundColor: bg.primary },

  /* ── AvatarStack ── */
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

  /* ── Hero Header ── */
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: textTokens.primary,
    letterSpacing: -0.7,
  },
  headerSubtitle: {
    fontSize: 13,
    color: textTokens.secondary,
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  plusButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonInline: { position: 'relative', top: 0, right: 0 },

  /* ── Summary Stat Cards (glassmorphic) ── */
  summaryCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: bg.card,
    borderRadius: 18,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: borderTokens.secondary,
  },
  summaryCardGradientWrap: { marginBottom: 10 },
  summaryCardGradient: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: textTokens.primary,
    letterSpacing: -0.4,
  },
  summaryCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: textTokens.tertiary,
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  /* ── Search Bar (Apple-native) ── */
  searchBarContainer: { marginHorizontal: 20, marginBottom: 16 },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: bg.secondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
    borderColor: borderTokens.secondary,
  },
  searchIcon: { marginRight: 8, opacity: 0.55 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: textTokens.primary,
    paddingVertical: 0,
  },

  /* ── Filter Bar (iOS segmented control) ── */
  filterBarWrap: {
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: bg.secondary,
    borderRadius: 12,
    padding: 3,
  },
  filterSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  filterSegmentActive: {
    backgroundColor: bg.card,
    ...shadows.sm,
  },
  filterSegmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: textTokens.tertiary,
  },
  filterSegmentTextActive: {
    color: brand.primary,
    fontWeight: '700',
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: semantic.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── Circle Card (premium immersive) ── */
  circleCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: bg.card,
    borderRadius: 16,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: borderTokens.secondary,
  },
  circleCardInner: { padding: 16 },
  circleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: brand.muted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: brand.tertiary,
  },
  circleEmojiText: { fontSize: 26 },
  circleInfoBlock: {
    flex: 1,
    marginLeft: 14,
  },
  circleName: {
    fontSize: 16,
    fontWeight: '700',
    color: textTokens.primary,
    letterSpacing: -0.2,
  },
  circleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 8,
  },
  circleMemberCount: {
    fontSize: 12.5,
    color: textTokens.secondary,
    fontWeight: '600',
  },
  circleChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  circleDescription: {
    fontSize: 13,
    color: textTokens.tertiary,
    lineHeight: 19,
    marginTop: 10,
    paddingLeft: 66,
  },
  circleBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingLeft: 66,
    gap: 8,
    flexWrap: 'wrap',
  },

  /* Role badge */
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  /* Challenge pill on circle card */
  challengePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  challengePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B35',
  },

  /* New posts pill on circle card */
  newPostsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.muted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  newPostsDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: brand.primary,
  },
  newPostsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: brand.primary,
  },

  /* Check-in CTA row on circle card */
  checkinCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderTopColor: borderTokens.secondary,
  },
  checkinCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  checkinPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  checkinCtaText: {
    fontSize: 12,
    fontWeight: '500',
    color: textTokens.tertiary,
    flex: 1,
  },
  checkinCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: brand.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  checkinCtaBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Circles Section ── */
  circlesSectionWrap: { marginBottom: 12 },

  /* ── Filter Empty States ── */
  filterEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 40,
  },
  filterEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  filterEmptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: textTokens.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  filterEmptySubtitle: {
    fontSize: 14,
    color: textTokens.tertiary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* ── Premium Empty State ── */
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIllustration: {
    width: 140,
    height: 140,
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGradientOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  emptyFloatingBadge1: {
    position: 'absolute',
    top: 4,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  emptyFloatingBadge2: {
    position: 'absolute',
    bottom: 8,
    left: 4,
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  emptyFloatingBadge3: {
    position: 'absolute',
    bottom: 20,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: brand.muted,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: textTokens.primary,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  emptySubtitle: {
    fontSize: 15,
    color: textTokens.tertiary,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  createFirstCircleBtn: {
    marginTop: 28,
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  createFirstCircleBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inviteCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingVertical: 12,
  },
  inviteCodeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.primary,
  },

  /* ── Loading ── */
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* ── Error State ── */
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: textTokens.primary,
  },
  errorSubtitle: {
    fontSize: 14,
    color: textTokens.tertiary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: brand.primary,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* ── Content Scroll ── */
  contentScrollContainer: { paddingTop: 6, paddingBottom: 100 },

  /* ── Progress bars ── */
  progressBarFill: { height: '100%', borderRadius: 2.5 },

  /* ── Bottom Sheet Modals (shared) ── */
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalSheet: {
    height: SCREEN_HEIGHT * 0.75,
    backgroundColor: bg.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadows.lg,
    elevation: 10,
  },
  dragHandleContainer: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: borderTokens.primary,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderTokens.primary,
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: textTokens.primary,
    letterSpacing: -0.3,
  },
  modalHeaderSubtitle: {
    fontSize: 13,
    color: textTokens.tertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Empty modal */
  emptyModalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  emptyModalIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: semantic.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: textTokens.primary,
    textAlign: 'center',
  },
  emptyModalSubtitle: {
    fontSize: 14,
    color: textTokens.tertiary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* FlatList */
  flatListContent: { paddingTop: 8, paddingBottom: 40 },

  /* Modal list card (Circles list) */
  modalListCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: bg.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: borderTokens.secondary,
  },
  modalListEmoji: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: brand.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalListEmojiText: { fontSize: 22 },
  modalListName: {
    fontSize: 15,
    fontWeight: '700',
    color: textTokens.primary,
    flexShrink: 1,
  },
  modalListNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalListSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 5 },
  modalListSubText: { fontSize: 12.5, color: textTokens.secondary, fontWeight: '600' },
  modalListDot: { fontSize: 12, color: textTokens.disabled, fontWeight: '700' },
  modalRoleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  modalRoleBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },

  /* Member card */
  modalMemberCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: bg.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: borderTokens.secondary,
  },
  modalMemberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brand.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalMemberAvatarText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },

  /* Modal challenge card */
  modalChallengeCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: bg.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: borderTokens.secondary,
  },
  modalChallengeEmoji: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalChallengeEmojiText: { fontSize: 22 },
  modalChallengeName: {
    fontSize: 15,
    fontWeight: '700',
    color: textTokens.primary,
  },
  modalCircleNameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  modalCircleNameText: { fontSize: 12.5, color: textTokens.secondary, fontWeight: '600' },
  modalProgressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  modalProgressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: borderTokens.primary,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  modalProgressPct: { fontSize: 11, fontWeight: '700', color: textTokens.secondary, minWidth: 32, textAlign: 'right' },

  /* Days left badge */
  daysLeftBadge: { marginLeft: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  daysLeftText: { fontSize: 11, fontWeight: '700' },

  chevronSmall: { marginLeft: 4 },
});
