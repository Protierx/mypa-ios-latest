/**
 * Circles — Premium iOS Social Screen
 *
 * Design philosophy: Apple Fitness-inspired. Content-first layout.
 * Circles are the hero. Actions are contextual, not front-and-centre.
 * Swipe RIGHT from AI Hub to access.
 */

import React, { useState, useCallback, useMemo } from 'react';
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

import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius, spacing } from '../../styles/theme';
import { useEnterAnimation, usePressFeedback, useStaggerIn } from '../../styles/motion';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FREE_TIER_CIRCLE_LIMIT = 3;

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
          <Ionicons name="person" size={size * 0.45} color={bg.primary} />
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

  /* ══════════════════════════════════════════════════════════════
   * RENDER HELPERS
   * ══════════════════════════════════════════════════════════════ */

  /* ── Summary Tabs (backed by circles_home_counts RPC) ── */
  const renderSummaryTabs = () => {
    if (circlesHome.length === 0) return null;
    const tabs = [
      { value: counts.circles_count, label: 'Circles', icon: 'people', color: brand.primary, onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAllCircles(true); } },
      { value: counts.unique_members_count, label: 'Members', icon: 'person', color: brand.secondary, onPress: async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowAllMembers(true);
        setMembersLoading(true);
        try {
          const { data, error } = await supabase.rpc('circles_all_members');
          if (!error && data) setAllMembers(data);
        } catch (e) { console.error('[Members] fetch error:', e); }
        finally { setMembersLoading(false); }
      } },
      { value: counts.active_challenges_count, label: 'Active', icon: 'trophy', color: semantic.warning, onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowActiveChallenges(true); } },
    ];
    return (
      <Animated.View style={[s.summaryTabsContainer, tabsAnim]}>
        {tabs.map((tab, idx) => (
          <TouchableOpacity
            key={tab.label}
            style={[
              s.summaryTab,
              idx > 0 && s.summaryTabBorder,
            ]}
            onPress={tab.onPress}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={`${tab.value} ${tab.label}, tap to view`}
          >
            <Ionicons name={tab.icon as any} size={16} color={tab.color} style={s.summaryTabIcon} />
            <Text style={s.summaryTabValue}>{tab.value}</Text>
            <Text style={s.summaryTabLabel}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    );
  };

  /* ── Search Bar (iOS WhatsApp-style) ── */
  const renderSearchBar = () => {
    if (circlesHome.length === 0) return null;
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

  /* ── Circle Card (rich, immersive — backed by circles_home_all RPC) ── */
  const renderCircleCard = (circle: CircleHomeItem, index: number) => {
    const roleBadge = circle.role === 'owner' ? 'Owner' : circle.role === 'admin' ? 'Admin' : 'Member';
    const roleColor = circle.role === 'owner' ? semantic.warning : circle.role === 'admin' ? brand.primary : textTokens.tertiary;
    const showRoleBadge = true; // always show role per PRD

    return (
      <TouchableOpacity
        key={circle.circle_id}
        style={s.circleCard}
        onPress={() => openCircle(circle.circle_id)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${circle.circle_name}, ${roleBadge}, ${circle.member_count} members`}
      >
        {/* Top colour accent bar */}
        <View style={s.circleAccentBar} />

        <View style={s.circleCardInner}>
          {/* Row 1: Emoji + Name + Role + Chevron */}
          <View style={s.circleRow}>
            <View style={s.circleEmoji}>
              <Text style={s.circleEmojiText}>{circle.circle_emoji || '👥'}</Text>
            </View>
            <View style={s.circleNameContainer}>
              <View style={s.circleNameRow}>
                <Text style={s.circleName} numberOfLines={1}>{circle.circle_name}</Text>
                {showRoleBadge && (
                  <View style={[s.roleBadge, { backgroundColor: `${roleColor}14` }]}>
                    <Text style={[s.roleBadgeText, { color: roleColor }]}>{roleBadge}</Text>
                  </View>
                )}
              </View>
              <View style={s.circleMemberRow}>
                <AvatarStack count={circle.member_count} size={20} />
                <Text style={s.circleMemberText}>
                  {circle.member_count} member{circle.member_count !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={textTokens.disabled} />
          </View>

          {/* Description if exists */}
          {circle.circle_description ? (
            <Text numberOfLines={2} style={s.circleDescription}>
              {circle.circle_description}
            </Text>
          ) : null}

          {/* Active challenges pill (hide if 0) */}
          {circle.active_challenges_count > 0 && (
            <View style={s.challengePillContainer}>
              <View style={s.challengePill}>
                <Ionicons name="trophy" size={12} color={semantic.warning} />
                <Text style={s.challengePillText}>
                  {circle.active_challenges_count} active challenge{circle.active_challenges_count !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}

          {/* New posts indicator */}
          {activeFilter === 'newposts' && hasNewPosts(circle.circle_id) && (
            <View style={s.newPostsPromptRow}>
              <Ionicons name="chatbubble" size={13} color={brand.primary} />
              <Text style={s.newPostsPromptText}>
                {newPostsCount(circle.circle_id)} new post{newPostsCount(circle.circle_id) !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Needs check-in status + CTA */}
          {activeFilter === 'checkin' && needsCheckIn(circle.circle_id) && (
            <View style={s.checkinPromptRow}>
              <View style={s.checkinPromptLeft}>
                <Ionicons name="time-outline" size={13} color={semantic.warning} />
                <Text style={s.checkinPromptText}>You haven't checked in today</Text>
              </View>
              <TouchableOpacity
                style={s.checkinPillCta}
                onPress={(e) => { e.stopPropagation?.(); openCircleToCheckin(circle.circle_id); }}
                activeOpacity={0.75}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Check in to ${circle.circle_name}`}
              >
                <Ionicons name="hand-left" size={11} color="#FFFFFF" />
                <Text style={s.checkinPillCtaText}>Check In</Text>
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

  const hasContent = circlesHome.length > 0 || activeChallenges.length > 0;
  const hasError = (homeError || challengesError) && !hasContent;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={s.flex1} edges={['top']}>

        {/* ── Header ── */}
        <Animated.View style={[s.headerContainer, headerAnim]}>
          <View style={s.headerRow}>
            <Text style={s.headerTitle}>Circles</Text>
            <View style={s.headerActions}>
              {/* + button — Create or Join */}
              <TouchableWithoutFeedback
                onPressIn={plusPressHandlers.onPressIn}
                onPressOut={plusPressHandlers.onPressOut}
                onPress={handlePlusButton}
              >
                <Animated.View style={[s.plusButton, plusPressStyle]}>
                  <Ionicons name="add" size={28} color="#FFFFFF" />
                </Animated.View>
              </TouchableWithoutFeedback>
              <MiniVoiceButton position="top-right" screenContext="social" size={50} style={s.voiceButtonInline} />
            </View>
          </View>
          <Text style={s.headerSubtitle}>
            {circlesHome.length > 0
              ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : 'Accountability with your people'}
          </Text>
        </Animated.View>

        {/* ── Body ── */}
        {loading && !refreshing ? (
          <ScrollView style={s.flex1} contentContainerStyle={s.contentScrollContainer}>
            {/* Skeleton stat cards */}
            <View style={[s.summaryTabsContainer, { opacity: 0.5 }]}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[s.summaryTab, i > 1 && s.summaryTabBorder]}>
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: borderTokens.primary, marginBottom: 5 }} />
                  <View style={{ width: 28, height: 20, borderRadius: 4, backgroundColor: borderTokens.primary, marginBottom: 3 }} />
                  <View style={{ width: 44, height: 10, borderRadius: 3, backgroundColor: borderTokens.primary }} />
                </View>
              ))}
            </View>
            {/* Skeleton circle cards */}
            {[1, 2, 3].map((i) => (
              <View key={i} style={[s.circleCard, { opacity: 0.45 }]}>
                <View style={s.circleAccentBar} />
                <View style={s.circleCardInner}>
                  <View style={s.circleRow}>
                    <View style={[s.circleEmoji, { backgroundColor: borderTokens.primary }]} />
                    <View style={[s.circleNameContainer, { gap: 8 }]}>
                      <View style={{ width: 120, height: 14, borderRadius: 4, backgroundColor: borderTokens.primary }} />
                      <View style={{ width: 80, height: 10, borderRadius: 3, backgroundColor: borderTokens.primary }} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : hasError ? (
          <View style={s.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color={textTokens.disabled} />
            <Text style={s.errorTitle}>Couldn't load circles</Text>
            <Text style={s.errorSubtitle}>Check your connection and try again.</Text>
            <TouchableOpacity
              style={s.retryBtn}
              onPress={handleRefresh}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={18} color={brand.primary} />
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
            {/* Summary Tabs */}
            {renderSummaryTabs()}

            {/* Search Bar */}
            {renderSearchBar()}

            {/* Filter Tabs — All (default) | Needs Check-in | New Posts */}
            {circlesHome.length > 0 && (
              <View style={s.filterChipRow}>
                {/* All tab */}
                <TouchableOpacity
                  style={[
                    s.filterChip,
                    activeFilter === 'all' && s.filterChipActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveFilter('all');
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  accessibilityRole="tab"
                  accessibilityLabel="All circles"
                  accessibilityState={{ selected: activeFilter === 'all' }}
                >
                  <Ionicons
                    name="people"
                    size={14}
                    color={activeFilter === 'all' ? '#FFFFFF' : brand.primary}
                  />
                  <Text style={[
                    s.filterChipText,
                    activeFilter === 'all' && s.filterChipTextActive,
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>

                {/* Needs Check-in tab */}
                <TouchableOpacity
                  style={[
                    s.filterChip,
                    activeFilter === 'checkin' && s.filterChipActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveFilter('checkin');
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  accessibilityRole="tab"
                  accessibilityLabel="Needs Check-in"
                  accessibilityState={{ selected: activeFilter === 'checkin' }}
                >
                  <Ionicons
                    name={activeFilter === 'checkin' ? 'checkmark-circle' : 'hand-left-outline'}
                    size={14}
                    color={activeFilter === 'checkin' ? '#FFFFFF' : brand.primary}
                  />
                  <Text style={[
                    s.filterChipText,
                    activeFilter === 'checkin' && s.filterChipTextActive,
                  ]}>
                    Needs Check-in
                  </Text>
                </TouchableOpacity>

                {/* New Posts tab */}
                <TouchableOpacity
                  style={[
                    s.filterChip,
                    activeFilter === 'newposts' && s.filterChipActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveFilter('newposts');
                    refreshNewPosts();
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  accessibilityRole="tab"
                  accessibilityLabel={`New Posts${newPostsTotalCount > 0 ? `, ${newPostsTotalCount} circles` : ''}`}
                  accessibilityState={{ selected: activeFilter === 'newposts' }}
                >
                  <Ionicons
                    name={activeFilter === 'newposts' ? 'chatbubbles' : 'chatbubbles-outline'}
                    size={14}
                    color={activeFilter === 'newposts' ? '#FFFFFF' : brand.primary}
                  />
                  <Text style={[
                    s.filterChipText,
                    activeFilter === 'newposts' && s.filterChipTextActive,
                  ]}>
                    New Posts
                  </Text>
                  {newPostsTotalCount > 0 && activeFilter !== 'newposts' && (
                    <View style={s.newPostsBadge}>
                      <Text style={s.newPostsBadgeText}>{newPostsTotalCount > 9 ? '9+' : newPostsTotalCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Circles */}
            {circlesHome.length > 0 && (
              <View style={s.circlesSectionMargin}>
                <View style={s.sectionHeaderRow}>
                  <Text style={s.sectionHeaderText}>
                    Your Circles
                  </Text>
                </View>
                {filteredCircles.length > 0 ? (
                  filteredCircles.map((c, i) => renderCircleCard(c, i))
                ) : activeFilter === 'checkin' ? (
                  <View style={s.checkinEmptyContainer}>
                    <View style={s.checkinEmptyIcon}>
                      <Ionicons name="checkmark-circle" size={36} color={semantic.success} />
                    </View>
                    <Text style={s.checkinEmptyTitle}>All checked in</Text>
                    <Text style={s.checkinEmptySubtitle}>You're done for today.</Text>
                  </View>
                ) : activeFilter === 'newposts' ? (
                  <View style={s.checkinEmptyContainer}>
                    <View style={s.checkinEmptyIcon}>
                      <Ionicons name="chatbubbles" size={36} color={brand.primary} />
                    </View>
                    <Text style={s.checkinEmptyTitle}>No new posts</Text>
                    <Text style={s.checkinEmptySubtitle}>You're all caught up.</Text>
                  </View>
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
                        setTimeout(() => openCircle(ch.circle_id), 300);
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
    marginBottom: 18,
    backgroundColor: brand.muted,
    borderRadius: 20,
    flexDirection: 'row',
    ...shadows.sm,
    overflow: 'hidden',
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  summaryTab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 18, backgroundColor: 'transparent' },
  summaryTabBorder: { borderLeftWidth: 0 },
  summaryTabIcon: { marginBottom: 5, opacity: 0.9 },
  summaryTabValue: { fontSize: 20, fontWeight: '800', color: textTokens.primary, letterSpacing: -0.4 },
  summaryTabLabel: { fontSize: 10, fontWeight: '700', color: textTokens.secondary, marginTop: 3, letterSpacing: 0.4, textTransform: 'uppercase' },

  /* Filter Chips */
  filterChipRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: brand.muted,
    borderWidth: 1.5,
    borderColor: brand.tertiary,
  },
  filterChipActive: {
    backgroundColor: brand.primary,
    borderColor: brand.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.primary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  /* Search Bar */
  searchBarContainer: { marginHorizontal: 16, marginBottom: 20 },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: bg.secondary,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
    borderColor: borderTokens.secondary,
  },
  searchIcon: { marginRight: 8, opacity: 0.6 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', color: textTokens.primary, paddingVertical: 0 },

  /* Circle Card */
  circleCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: bg.card,
    borderRadius: radius.lg,
    ...shadows.sm,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: brand.primary,
  },
  circleAccentBar: { height: 0, backgroundColor: 'transparent', opacity: 0 },
  circleCardInner: { padding: 18 },
  circleRow: { flexDirection: 'row', alignItems: 'center' },
  circleEmoji: {
    width: 50,
    height: 50,
    borderRadius: radius.lg,
    backgroundColor: brand.muted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: brand.tertiary,
  },
  circleEmojiText: { fontSize: 24 },
  circleNameContainer: { flex: 1, marginLeft: 14 },
  circleNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  circleName: { fontSize: 17, fontWeight: '700', color: textTokens.primary, flexShrink: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: brand.muted, borderWidth: 1, borderColor: brand.tertiary },
  roleBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', color: brand.primary },
  circleMemberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 },
  circleMemberText: { fontSize: 12.5, color: textTokens.secondary, fontWeight: '600' },
  circleDescription: { fontSize: 13.5, color: textTokens.tertiary, lineHeight: 19, marginTop: 12, marginLeft: 64 },

  /* Challenge pill on circle card */
  challengePillContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 64 },
  challengePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${semantic.warning}14`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, gap: 4 },
  challengePillText: { fontSize: 11.5, fontWeight: '600', color: semantic.warning },

  /* Progress bars (Active Challenges modal) */
  progressBarTrack: { height: 4, backgroundColor: borderTokens.primary, borderRadius: 2, marginTop: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },

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
    backgroundColor: semantic.warningLight, alignItems: 'center', justifyContent: 'center',
  },
  decorativeCheckCircle: {
    position: 'absolute', bottom: 25, left: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: semantic.successLight, alignItems: 'center', justifyContent: 'center',
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
  headerContainer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  headerTitle: { fontSize: 36, fontWeight: '800', color: textTokens.primary, letterSpacing: -0.7 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  plusButton: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: brand.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  voiceButtonInline: { position: 'relative', top: 0, right: 0 },
  headerSubtitle: { fontSize: 13, color: textTokens.secondary, marginTop: 3, fontWeight: '600', letterSpacing: 0.2 },

  /* Loading */
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Error State */
  errorContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18, fontWeight: '700', color: textTokens.primary, marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 14, color: textTokens.tertiary, textAlign: 'center', marginTop: 6, lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9999,
    backgroundColor: brand.muted,
  },
  retryBtnText: {
    fontSize: 15, fontWeight: '600', color: brand.primary, marginLeft: 6,
  },

  /* Content Scroll */
  contentScrollContainer: { paddingTop: 8, paddingBottom: 100 },

  /* Section headers */
  circlesSectionMargin: { marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionHeaderText: { fontSize: 11, fontWeight: '800', color: brand.primary, letterSpacing: 0.6, textTransform: 'uppercase', flex: 1, opacity: 0.8 },

  /* No results */
  noResultsContainer: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 40 },
  noResultsIcon: { marginBottom: 10 },
  noResultsTitle: { fontSize: 15, fontWeight: '600', color: textTokens.tertiary, textAlign: 'center' },
  noResultsSubtitle: { fontSize: 13, color: textTokens.disabled, marginTop: 4, textAlign: 'center' },

  /* Needs Check-in Prompt */
  checkinPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginLeft: 64,
    paddingRight: 2,
  },
  checkinPromptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  checkinPromptText: {
    fontSize: 12,
    fontWeight: '500',
    color: semantic.warning,
  },
  checkinPillCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: brand.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 8,
  },
  checkinPillCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Needs Check-in Empty State */
  checkinEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 40,
  },
  checkinEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semantic.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkinEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: textTokens.primary,
    textAlign: 'center',
  },
  checkinEmptySubtitle: {
    fontSize: 14,
    color: textTokens.tertiary,
    marginTop: 6,
    textAlign: 'center',
  },

  /* New Posts badge on chip */
  newPostsBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: semantic.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  newPostsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* New Posts indicator on circle card */
  newPostsPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    marginLeft: 64,
  },
  newPostsPromptText: {
    fontSize: 12,
    fontWeight: '600',
    color: brand.primary,
  },

  /* Active Challenges Modal */
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.35)' },
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
    backgroundColor: semantic.warningLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyModalTitle: { fontSize: 17, fontWeight: '600', color: textTokens.primary, textAlign: 'center' },
  emptyModalSubtitle: { fontSize: 14, color: textTokens.tertiary, marginTop: 6, textAlign: 'center', lineHeight: 20 },

  /* FlatList */
  flatListContent: { paddingTop: 8, paddingBottom: 40 },

  /* Shared modal list card */
  modalListCard: {
    marginHorizontal: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: bg.card, borderRadius: radius.lg, padding: 16,
    ...shadows.sm,
    borderLeftWidth: 4,
    borderLeftColor: brand.primary,
  },
  modalListEmoji: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: brand.muted,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
    borderWidth: 1,
    borderColor: brand.tertiary,
  },
  modalListEmojiText: { fontSize: 22 },
  modalListName: { fontSize: 15, fontWeight: '700', color: textTokens.primary, flexShrink: 1 },
  modalListNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalListSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 5 },
  modalListSubText: { fontSize: 12.5, color: textTokens.secondary, fontWeight: '600' },
  modalListDot: { fontSize: 12, color: textTokens.disabled, fontWeight: '700' },
  modalRoleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  modalRoleBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },

  /* Member card */
  modalMemberCard: {
    marginHorizontal: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: bg.card, borderRadius: radius.lg, padding: 16,
    ...shadows.sm,
  },
  modalMemberAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: brand.secondary,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  modalMemberAvatarText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },

  /* Modal challenge card */
  modalChallengeCard: {
    marginHorizontal: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: bg.card, borderRadius: radius.lg, padding: 16,
    ...shadows.sm,
    borderLeftWidth: 4,
    borderLeftColor: semantic.warning,
  },
  modalChallengeEmoji: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: semantic.warningLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
    borderWidth: 1,
    borderColor: semantic.warning,
  },
  modalChallengeEmojiText: { fontSize: 22 },
  modalChallengeName: { fontSize: 15, fontWeight: '700', color: textTokens.primary },
  modalCircleNameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  modalCircleNameText: { fontSize: 12.5, color: textTokens.secondary, fontWeight: '600' },
  modalProgressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  modalProgressTrack: { flex: 1, height: 5, backgroundColor: borderTokens.primary, borderRadius: 2.5, overflow: 'hidden' },
  modalProgressPct: { fontSize: 11, fontWeight: '700', color: textTokens.secondary, minWidth: 32, textAlign: 'right' },

  /* Days left badge */
  daysLeftBadge: { marginLeft: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  daysLeftText: { fontSize: 11, fontWeight: '700' },

  chevronSmall: { marginLeft: 4 },
});
