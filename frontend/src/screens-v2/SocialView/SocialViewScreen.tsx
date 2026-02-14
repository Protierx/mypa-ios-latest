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
  Dimensions,
  Image,
  Keyboard,
  Platform,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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

  // Join flow
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const joinInputRef = useRef<TextInput>(null);

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

  const handleJoinCircle = useCallback(async () => {
    const code = joinCode.trim();
    if (!code) return;
    setIsJoining(true);
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await joinCircleByCode(code);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setJoinCode('');
        refreshCircles();
      } else {
        Alert.alert("Couldn't Join", result.error || 'Invalid code or you\'re already a member.');
      }
    } catch {
      Alert.alert("Couldn't Join", 'Something went wrong. Please try again.');
    } finally {
      setIsJoining(false);
    }
  }, [joinCode, joinCircleByCode, refreshCircles]);

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

  /* ── Quick Stats Banner (only when user has circles) ── */
  const renderStatsBanner = () => {
    if (circles.length === 0) return null;
    const totalMembers = circles.reduce((sum: number, c: any) => sum + (c.memberCount || 1), 0);
    return (
      <View style={{
        marginHorizontal: 16, marginBottom: 20,
        backgroundColor: L.card, borderRadius: 18,
        flexDirection: 'row',
        borderWidth: 0.5, borderColor: L.cardBorder,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
        overflow: 'hidden',
      }}>
        {[
          { value: circles.length, label: 'Circles', icon: 'people', color: L.purple },
          { value: totalMembers, label: 'Members', icon: 'person', color: '#6D28D9' },
          { value: activeChallenges.length, label: 'Active', icon: 'trophy', color: L.amber },
        ].map((stat, idx) => (
          <View key={stat.label} style={{
            flex: 1, alignItems: 'center', paddingVertical: 18,
            borderLeftWidth: idx > 0 ? 0.5 : 0, borderLeftColor: L.divider,
          }}>
            <Ionicons name={stat.icon as any} size={16} color={stat.color} style={{ marginBottom: 6, opacity: 0.85 }} />
            <Text style={{ fontSize: 22, fontWeight: '800', color: L.textPrimary, letterSpacing: -0.5 }}>{stat.value}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: L.textTertiary, marginTop: 2, letterSpacing: 0.3, textTransform: 'uppercase' }}>{stat.label}</Text>
          </View>
        ))}
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
                      onPress={(e) => { e.stopPropagation; openChallenge(ch.id); }}
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

  /* ── Global Challenges (not attached to any circle) ── */
  const renderGlobalChallenges = () => {
    const global = challengesByCircle['_global'];
    if (!global || global.length === 0) return null;
    return (
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
          <Ionicons name="trophy" size={14} color={L.amber} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: L.textTertiary, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            Solo Challenges
          </Text>
        </View>
        {global.map((ch: any) => {
          const progress = ch.userProgress || 0;
          const goal = ch.goal_value || 1;
          const pct = Math.min((progress / goal) * 100, 100);
          const daysLeft = ch.ends_at ? Math.max(0, Math.ceil((new Date(ch.ends_at).getTime() - Date.now()) / 86400000)) : null;
          return (
            <TouchableOpacity
              key={ch.id}
              style={{
                marginHorizontal: 16, marginBottom: 10,
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: L.card, borderRadius: 14, padding: 14,
                borderWidth: 0.5, borderColor: L.cardBorder,
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6,
              }}
              onPress={() => openChallenge(ch.id)}
              activeOpacity={0.7}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: L.amberLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 20 }}>{ch.emoji || '🏆'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '600', color: L.textPrimary }}>{ch.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 6 }}>
                  <View style={{ flex: 1, height: 4, backgroundColor: L.divider, borderRadius: 2, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${pct}%`, backgroundColor: pct >= 100 ? L.green : L.amber, borderRadius: 2 }} />
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: L.textTertiary }}>{Math.round(pct)}%</Text>
                </View>
              </View>
              {daysLeft !== null && (
                <View style={{ marginLeft: 10, backgroundColor: daysLeft <= 3 ? L.amberLight : L.bg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10.5, fontWeight: '700', color: daysLeft <= 3 ? L.amber : L.textTertiary }}>{daysLeft}d</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  /* ── Join Code (always visible, minimal, bottom of list) ── */
  const renderJoinSection = () => (
    <View style={{
      marginHorizontal: 16, marginTop: 8, marginBottom: 24,
      backgroundColor: L.card, borderRadius: 16,
      borderWidth: 0.5, borderColor: L.cardBorder,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6,
      overflow: 'hidden',
    }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: L.textPrimary, marginBottom: 4 }}>Have an invite code?</Text>
        <Text style={{ fontSize: 12.5, color: L.textTertiary, lineHeight: 17, marginBottom: 14 }}>
          Paste a code to join someone's circle instantly.
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            flex: 1, flexDirection: 'row', alignItems: 'center',
            backgroundColor: L.bg, borderRadius: 12,
            paddingHorizontal: 14, height: 46,
            borderWidth: 1, borderColor: joinCode.trim() ? `${L.purple}30` : L.divider,
          }}>
            <Ionicons name="key-outline" size={15} color={L.textQuaternary} style={{ marginRight: 8 }} />
            <TextInput
              ref={joinInputRef}
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="Enter invite code"
              placeholderTextColor={L.textQuaternary}
              style={{ flex: 1, fontSize: 15, fontWeight: '500', color: L.textPrimary, letterSpacing: 0.5 }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="join"
              onSubmitEditing={handleJoinCircle}
            />
          </View>
          <TouchableOpacity
            style={{
              height: 46, paddingHorizontal: 18, borderRadius: 12,
              backgroundColor: joinCode.trim() ? L.purple : L.divider,
              alignItems: 'center', justifyContent: 'center',
            }}
            onPress={handleJoinCircle}
            disabled={!joinCode.trim() || isJoining}
            activeOpacity={0.8}
          >
            {isJoining
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ fontSize: 14, fontWeight: '700', color: joinCode.trim() ? '#fff' : L.textQuaternary }}>Join</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
        onPress={() => joinInputRef.current?.focus()}
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
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 34, fontWeight: '800', color: L.textPrimary, letterSpacing: -0.5 }}>Circles</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Subtle New button */}
              <TouchableOpacity
                style={{
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: L.purpleLight,
                  alignItems: 'center', justifyContent: 'center',
                }}
                onPress={handleCreateCircle}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={22} color={L.purple} />
              </TouchableOpacity>
              <MiniVoiceButton position="top-right" screenContext="social" size={52} style={{ position: 'relative', top: 0, right: 0 }} />
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
            {renderJoinSection()}
          </ScrollView>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={L.purple} />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Stats */}
            {renderStatsBanner()}

            {/* Circles */}
            {circles.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: L.textTertiary, letterSpacing: 0.6, textTransform: 'uppercase', flex: 1 }}>
                    Your Circles
                  </Text>
                </View>
                {circles.map(renderCircleCard)}
              </View>
            )}

            {/* Global / Solo challenges */}
            {renderGlobalChallenges()}

            {/* Join Code (always present) */}
            {renderJoinSection()}
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
    </View>
  );
}
