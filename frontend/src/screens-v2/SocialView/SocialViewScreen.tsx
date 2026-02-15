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

/* ────────────── Palette ────────────── */

const L = {
  bg:             '#F5F5F7',
  card:           '#FFFFFF',
  cardBorder:     '#EDEDF0',
  textPrimary:    '#1C1C1E',
  textSecondary:  '#48484A',
  textTertiary:   '#8E8E93',
  textQuaternary: '#C7C7CC',
  divider:        '#EDEDF0',
  purple:         '#7C3AED',
  purpleLight:    '#F5F0FF',
  purpleMid:      '#EDE5FF',
  green:          '#34C759',
  greenLight:     '#ECFDF5',
  amber:          '#F59E0B',
  amberLight:     '#FFFBEB',
  danger:         '#DC2626',
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FREE_TIER_CIRCLE_LIMIT = 1;

/* ────────────── Helpers ────────────── */

/** Stacked avatar row — shows up to N initials, +overflow badge */
function AvatarStack({ count, size = 22 }: { count: number; size?: number }) {
  const show = Math.min(count, 4);
  const colours = ['#7C3AED', '#6D28D9', '#8B5CF6', '#A78BFA'];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {Array.from({ length: show }).map((_, i) => (
        <View
          key={i}
          style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: colours[i % colours.length],
            borderWidth: 2, borderColor: L.card,
            marginLeft: i === 0 ? 0 : -(size * 0.35),
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="person" size={size * 0.45} color="rgba(255,255,255,0.85)" />
        </View>
      ))}
      {count > 4 && (
        <View style={{
          height: size, paddingHorizontal: 5, borderRadius: size / 2,
          backgroundColor: L.divider, marginLeft: -(size * 0.25),
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 2, borderColor: L.card,
        }}>
          <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: L.textTertiary }}>+{count - 4}</Text>
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
      { value: circles.length, label: 'Circles', icon: 'people', color: L.purple, onPress: undefined },
      { value: totalMembers, label: 'Members', icon: 'person', color: '#6D28D9', onPress: undefined },
      { value: activeChallenges.length, label: 'Active', icon: 'trophy', color: L.amber, onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowActiveChallenges(true); } },
    ];
    return (
      <View style={{
        marginHorizontal: 16, marginBottom: 14,
        backgroundColor: L.card, borderRadius: 18,
        flexDirection: 'row',
        borderWidth: 0.5, borderColor: L.cardBorder,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
        overflow: 'hidden',
      }}>
        {tabs.map((tab, idx) => (
          <TouchableOpacity
            key={tab.label}
            style={{
              flex: 1, alignItems: 'center', paddingVertical: 18,
              borderLeftWidth: idx > 0 ? 0.5 : 0, borderLeftColor: L.divider,
            }}
            onPress={tab.onPress}
            activeOpacity={tab.onPress ? 0.6 : 1}
            disabled={!tab.onPress}
            accessibilityRole={tab.onPress ? 'button' : 'text'}
            accessibilityLabel={`${tab.value} ${tab.label}${tab.onPress ? ', tap to view' : ''}`}
          >
            <Ionicons name={tab.icon as any} size={16} color={tab.color} style={{ marginBottom: 6, opacity: 0.85 }} />
            <Text style={{ fontSize: 22, fontWeight: '800', color: L.textPrimary, letterSpacing: -0.5 }}>{tab.value}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: L.textTertiary, marginTop: 2, letterSpacing: 0.3, textTransform: 'uppercase' }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /* ── Search Bar (iOS WhatsApp-style) ── */
  const renderSearchBar = () => {
    if (circles.length === 0) return null;
    return (
      <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: 'rgba(142,142,147,0.12)',
          borderRadius: 12, paddingHorizontal: 12, height: 40,
        }}>
          <Ionicons name="search" size={16} color={L.textTertiary} style={{ marginRight: 6 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search circles"
            placeholderTextColor={L.textTertiary}
            style={{ flex: 1, fontSize: 15, fontWeight: '400', color: L.textPrimary, paddingVertical: 0 }}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color={L.textQuaternary} />
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
    const roleColor = circle.userRole === 'owner' ? L.amber : L.purple;

    return (
      <TouchableOpacity
        key={circle.id}
        style={{
          marginHorizontal: 16, marginBottom: 14,
          backgroundColor: L.card, borderRadius: 20,
          borderWidth: 0.5, borderColor: L.cardBorder,
          shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12,
          overflow: 'hidden',
        }}
        onPress={() => openCircle(circle.id)}
        activeOpacity={0.7}
      >
        {/* Top colour accent bar */}
        <View style={{ height: 3, backgroundColor: L.purple, opacity: 0.7 }} />

        <View style={{ padding: 18 }}>
          {/* Row 1: Emoji + Name + Role */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 50, height: 50, borderRadius: 16,
              backgroundColor: L.purpleLight,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 24 }}>{circle.emoji || '👥'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: L.textPrimary, flexShrink: 1 }} numberOfLines={1}>{circle.name}</Text>
                {roleBadge && (
                  <View style={{ backgroundColor: `${roleColor}14`, paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10.5, fontWeight: '700', color: roleColor, letterSpacing: 0.3, textTransform: 'uppercase' }}>{roleBadge}</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 12 }}>
                <AvatarStack count={circle.memberCount || 1} size={20} />
                <Text style={{ fontSize: 12.5, color: L.textTertiary, fontWeight: '500' }}>
                  {circle.memberCount || 1} member{(circle.memberCount || 1) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={L.textQuaternary} />
          </View>

          {/* Description if exists */}
          {circle.description ? (
            <Text numberOfLines={2} style={{
              fontSize: 13.5, color: L.textTertiary, lineHeight: 19,
              marginTop: 12, marginLeft: 64,
            }}>
              {circle.description}
            </Text>
          ) : null}

          {/* Inline active challenges for this circle */}
          {challenges.length > 0 && (
            <View style={{ marginTop: 14, marginLeft: 64 }}>
              <View style={{
                backgroundColor: L.bg, borderRadius: 12, padding: 12,
              }}>
                {challenges.slice(0, 2).map((ch: any, idx: number) => {
                  const progress = ch.userProgress || 0;
                  const goal = ch.goal_value || 1;
                  const pct = Math.min((progress / goal) * 100, 100);
                  return (
                    <TouchableOpacity
                      key={ch.id}
                      style={{
                        flexDirection: 'row', alignItems: 'center',
                        marginTop: idx > 0 ? 10 : 0,
                      }}
                      onPress={() => { openChallenge(ch.id); }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 16, marginRight: 8 }}>{ch.emoji || '🏆'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: L.textPrimary }}>{ch.title}</Text>
                        <View style={{ height: 4, backgroundColor: L.divider, borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                          <View style={{ height: '100%', width: `${pct}%`, backgroundColor: pct >= 100 ? L.green : L.purple, borderRadius: 2 }} />
                        </View>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: L.textTertiary, marginLeft: 10 }}>
                        {Math.round(pct)}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {challenges.length > 2 && (
                  <Text style={{ fontSize: 11.5, color: L.purple, fontWeight: '600', marginTop: 8 }}>
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
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: 60 }}>
      {/* Decorative circle cluster */}
      <View style={{ width: 120, height: 120, marginBottom: 28, position: 'relative' }}>
        <View style={{
          position: 'absolute', top: 10, left: 10,
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: L.purpleLight,
        }} />
        <View style={{
          position: 'absolute', top: 0, left: 30,
          width: 60, height: 60, borderRadius: 30,
          backgroundColor: L.purpleMid, alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="people" size={26} color={L.purple} />
        </View>
        <View style={{
          position: 'absolute', bottom: 8, right: 5,
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: L.amberLight, alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="trophy" size={18} color={L.amber} />
        </View>
        <View style={{
          position: 'absolute', bottom: 25, left: 0,
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: L.greenLight, alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="checkmark" size={14} color={L.green} />
        </View>
      </View>

      <Text style={{ fontSize: 24, fontWeight: '800', color: L.textPrimary, textAlign: 'center', letterSpacing: -0.4 }}>
        Better together
      </Text>
      <Text style={{ fontSize: 15, color: L.textTertiary, marginTop: 10, textAlign: 'center', lineHeight: 22 }}>
        Create a circle to stay accountable with friends, family, or teammates. Challenge each other and grow.
      </Text>

      <TouchableOpacity
        style={{
          marginTop: 28, width: '100%',
          backgroundColor: L.purple, paddingVertical: 16, borderRadius: 16,
          alignItems: 'center',
          shadowColor: L.purple, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14,
        }}
        onPress={handleCreateCircle}
        activeOpacity={0.85}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Create Your First Circle</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 16, paddingVertical: 12 }}
        onPress={handlePlusButton}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: L.purple }}>I have an invite code</Text>
      </TouchableOpacity>
    </View>
  );

  /* ══════════════════════════════════════════════════════════════
   * MAIN RENDER
   * ══════════════════════════════════════════════════════════════ */

  const hasContent = circles.length > 0 || activeChallenges.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: L.bg }}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42 }}>
            <Text style={{ fontSize: 34, fontWeight: '800', color: L.textPrimary, letterSpacing: -0.5 }}>Circles</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
              {/* + button — Create or Join */}
              <TouchableOpacity
                style={{
                  width: 50, height: 50, borderRadius: 25,
                  backgroundColor: L.purpleLight,
                  alignItems: 'center', justifyContent: 'center',
                }}
                onPress={handlePlusButton}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={28} color={L.purple} />
              </TouchableOpacity>
              <MiniVoiceButton position="top-right" screenContext="social" size={50} style={{ position: 'relative', top: 0, right: 0 }} />
            </View>
          </View>
          <Text style={{ fontSize: 13, color: L.textTertiary, marginTop: 2, fontWeight: '500' }}>
            {circles.length > 0
              ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : 'Accountability with your people'}
          </Text>
        </View>

        {/* ── Body ── */}
        {loading && !refreshing ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={L.purple} size="large" />
          </View>
        ) : !hasContent ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={L.purple} />}
            keyboardShouldPersistTaps="handled"
          >
            {renderEmptyState()}
          </ScrollView>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={L.purple} />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Summary Tabs */}
            {renderSummaryTabs()}

            {/* Search Bar */}
            {renderSearchBar()}

            {/* Circles */}
            {circles.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: L.textTertiary, letterSpacing: 0.6, textTransform: 'uppercase', flex: 1 }}>
                    Your Circles
                  </Text>
                </View>
                {filteredCircles.length > 0 ? (
                  filteredCircles.map(renderCircleCard)
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 40 }}>
                    <Ionicons name="search-outline" size={28} color={L.textQuaternary} style={{ marginBottom: 10 }} />
                    <Text style={{ fontSize: 15, fontWeight: '600', color: L.textTertiary, textAlign: 'center' }}>No circles found</Text>
                    <Text style={{ fontSize: 13, color: L.textQuaternary, marginTop: 4, textAlign: 'center' }}>Try a different search</Text>
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
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}
            onPress={() => setShowActiveChallenges(false)}
          />

          {/* Sheet */}
          <View style={{
            height: SCREEN_HEIGHT * 0.75,
            backgroundColor: L.bg,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16,
            elevation: 10,
          }}>
            {/* Drag Handle */}
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D1D6' }} />
            </View>

            {/* Header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
              borderBottomWidth: 0.5, borderBottomColor: L.divider,
            }}>
              <View>
                <Text style={{ fontSize: 22, fontWeight: '700', color: L.textPrimary }}>Active Challenges</Text>
                <Text style={{ fontSize: 13, color: L.textTertiary, marginTop: 2, fontWeight: '500' }}>Across your circles</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowActiveChallenges(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  width: 30, height: 30, borderRadius: 15,
                  backgroundColor: 'rgba(142,142,147,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={16} color={L.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Challenge List */}
            {activeChallenges.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 40 }}>
                <View style={{
                  width: 56, height: 56, borderRadius: 18,
                  backgroundColor: L.amberLight,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <Ionicons name="trophy-outline" size={26} color={L.amber} />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: L.textPrimary, textAlign: 'center' }}>No active challenges</Text>
                <Text style={{ fontSize: 14, color: L.textTertiary, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
                  Create one inside a circle.
                </Text>
              </View>
            ) : (
              <FlatList
                data={activeChallenges}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
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
                      style={{
                        marginHorizontal: 16, marginBottom: 10,
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: L.card, borderRadius: 16, padding: 16,
                        borderWidth: 0.5, borderColor: L.cardBorder,
                        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6,
                      }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowActiveChallenges(false);
                        if (ch.circle_id) {
                          // Navigate into the circle (which has a Challenges tab)
                          setTimeout(() => openCircle(ch.circle_id), 300);
                        } else {
                          // No circle — open challenge detail directly
                          setTimeout(() => openChallenge(ch.id), 300);
                        }
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${ch.title} in ${circleName}`}
                    >
                      {/* Emoji */}
                      <View style={{
                        width: 44, height: 44, borderRadius: 14,
                        backgroundColor: L.amberLight,
                        alignItems: 'center', justifyContent: 'center', marginRight: 14,
                      }}>
                        <Text style={{ fontSize: 22 }}>{ch.emoji || '🏆'}</Text>
                      </View>

                      {/* Content */}
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: L.textPrimary }}>{ch.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 }}>
                          <Ionicons name="people" size={11} color={L.textQuaternary} />
                          <Text numberOfLines={1} style={{ fontSize: 12.5, color: L.textTertiary, fontWeight: '500' }}>{circleName}</Text>
                        </View>
                        {/* Progress bar */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                          <View style={{ flex: 1, height: 4, backgroundColor: L.divider, borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ height: '100%', width: `${pct}%`, backgroundColor: pct >= 100 ? L.green : L.amber, borderRadius: 2 }} />
                          </View>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: L.textTertiary, minWidth: 32, textAlign: 'right' }}>{Math.round(pct)}%</Text>
                        </View>
                      </View>

                      {/* Days left badge */}
                      {daysLeft !== null && (
                        <View style={{
                          marginLeft: 10,
                          backgroundColor: daysLeft <= 3 ? L.amberLight : L.bg,
                          paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
                        }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: daysLeft <= 3 ? L.amber : L.textTertiary }}>{daysLeft}d</Text>
                        </View>
                      )}

                      <Ionicons name="chevron-forward" size={16} color={L.textQuaternary} style={{ marginLeft: 4 }} />
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
