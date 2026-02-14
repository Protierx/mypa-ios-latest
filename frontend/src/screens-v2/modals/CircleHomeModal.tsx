/**
 * Circle Home Modal — Premium iOS Design v3
 *
 * Design: Apple Fitness / Apple Music inspired. Immersive hero header,
 * pill-shaped segmented control, breathing whitespace, rich cards.
 *
 * Role-based actions:
 * - Owner: kick, promote/demote, transfer ownership
 * - Admin: kick members (not other admins/owner)
 * - Member: view only
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  Share,
  Alert,
  ActionSheetIOS,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import { useCircles, CircleMemberProfile, CircleWithMembers } from '../../hooks/supabase/useCircles';
import { useChallenges } from '../../hooks/supabase/useChallenges';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

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
  dangerLight:    '#FEF2F2',
};

const { width: SW } = Dimensions.get('window');

/* ────────────── Types ────────────── */

interface CircleHomeModalProps {
  visible: boolean;
  circleId: string | null;
  onClose: () => void;
  onOpenChallenge?: (challengeId: string) => void;
  onCreateChallenge?: () => void;
}

type TabType = 'overview' | 'members' | 'challenges' | 'settings';

interface CircleActivity {
  id: string;
  user_name: string;
  user_avatar?: string;
  action: string;
  task_title?: string;
  created_at: string;
}

/* ────────────── Helpers ────────────── */

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ROLE_ICONS: Record<string, string> = { owner: '👑', admin: '⭐', member: '' };
const ROLE_COLORS: Record<string, string> = { owner: L.amber, admin: L.purple, member: L.textTertiary };

/** Mini avatar stack */
function MemberAvatars({ members, max = 5, size = 28 }: { members: CircleMemberProfile[]; max?: number; size?: number }) {
  const show = members.slice(0, max);
  const overflow = members.length - max;
  const colours = ['#7C3AED', '#6D28D9', '#8B5CF6', '#A78BFA', '#C4B5FD'];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {show.map((m, i) => (
        m.avatar_url ? (
          <Image
            key={m.id}
            source={{ uri: m.avatar_url }}
            style={{
              width: size, height: size, borderRadius: size / 2,
              borderWidth: 2, borderColor: L.card,
              marginLeft: i === 0 ? 0 : -(size * 0.3),
            }}
          />
        ) : (
          <View
            key={m.id}
            style={{
              width: size, height: size, borderRadius: size / 2,
              backgroundColor: colours[i % colours.length],
              borderWidth: 2, borderColor: L.card,
              marginLeft: i === 0 ? 0 : -(size * 0.3),
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: '#fff' }}>
              {m.display_name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )
      ))}
      {overflow > 0 && (
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: L.purpleMid, borderWidth: 2, borderColor: L.card,
          marginLeft: -(size * 0.3), alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: size * 0.35, fontWeight: '700', color: L.purple }}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

/* ────────────── Tabs ────────────── */

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'members', label: 'Members', icon: 'people-outline' },
  { key: 'challenges', label: 'Challenges', icon: 'trophy-outline' },
  { key: 'settings', label: 'Settings', icon: 'cog-outline' },
];

/* ════════════════════════════════════════════════════════════════
   ═══ Component ════════════════════════════════════════════════
   ════════════════════════════════════════════════════════════════ */

export function CircleHomeModal({ visible, circleId, onClose, onOpenChallenge, onCreateChallenge }: CircleHomeModalProps) {
  const { user } = useSupabaseAuth();
  const {
    getCircle, getCircleMembers, getCircleActivity,
    getUserRole, updateMemberRole, removeMember, leaveCircle, transferOwnership,
  } = useCircles();
  const { challenges: allChallenges } = useChallenges();

  const [circle, setCircle] = useState<CircleWithMembers | null>(null);
  const [members, setMembers] = useState<CircleMemberProfile[]>([]);
  const [activity, setActivity] = useState<CircleActivity[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [myRole, setMyRole] = useState<'owner' | 'admin' | 'member' | null>(null);

  const heroOpacity = useRef(new Animated.Value(0)).current;

  // Challenges for this circle
  const circleChallenges = allChallenges.filter((c: any) => c.circle_id === circleId);
  const activeChallenges = circleChallenges.filter((c: any) => c.status === 'active');

  /* ── Data Loading ── */
  const loadCircleData = useCallback(async () => {
    if (!circleId) return;
    try {
      const [circleData, membersData, activityData, role] = await Promise.all([
        getCircle(circleId),
        getCircleMembers(circleId),
        getCircleActivity(circleId),
        getUserRole(circleId),
      ]);
      setCircle(circleData);
      setMembers(membersData || []);
      setActivity(activityData || []);
      setMyRole(role);
    } catch (error) {
      console.error('[CircleHome] Error loading circle data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [circleId, getCircle, getCircleMembers, getCircleActivity, getUserRole]);

  useEffect(() => {
    if (visible && circleId) {
      setIsLoading(true);
      setActiveTab('overview');
      heroOpacity.setValue(0);
      loadCircleData();
      Animated.timing(heroOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [visible, circleId]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCircleData();
  }, [loadCircleData]);

  /* ── Actions ── */
  const handleCopyCode = useCallback(async () => {
    if (!circle) return;
    const code = circle.invite_code || circle.id.substring(0, 8);
    await Clipboard.setStringAsync(code);
    setCopiedCode(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [circle]);

  const handleShare = useCallback(async () => {
    if (!circle) return;
    const code = circle.invite_code || circle.id;
    try {
      await Share.share({ message: `Join my circle "${circle.name}" on MYPA! Use invite code: ${code}` });
    } catch {}
  }, [circle]);

  const handleLeaveCircle = useCallback(() => {
    if (!circleId) return;
    if (myRole === 'owner') {
      Alert.alert('Cannot Leave', "You're the owner. Transfer ownership first or delete the circle.", [{ text: 'OK' }]);
      return;
    }
    Alert.alert('Leave Circle', 'Are you sure you want to leave this circle?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          const ok = await leaveCircle(circleId);
          if (ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onClose(); }
          else Alert.alert('Error', 'Could not leave the circle.');
        },
      },
    ]);
  }, [circleId, myRole, leaveCircle, onClose]);

  /* ── Member Actions (role-based) ── */
  const handleMemberAction = useCallback((member: CircleMemberProfile) => {
    if (!circleId || member.id === user?.id) return;
    const canManage = myRole === 'owner' || (myRole === 'admin' && member.role === 'member');
    if (!canManage) return;

    const options: string[] = [];
    const actions: (() => void)[] = [];

    if (myRole === 'owner') {
      if (member.role === 'member') {
        options.push('Promote to Admin');
        actions.push(async () => {
          const ok = await updateMemberRole(circleId, member.id, 'admin');
          if (ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); loadCircleData(); }
        });
      } else if (member.role === 'admin') {
        options.push('Demote to Member');
        actions.push(async () => {
          const ok = await updateMemberRole(circleId, member.id, 'member');
          if (ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); loadCircleData(); }
        });
      }
      options.push('Transfer Ownership');
      actions.push(() => {
        Alert.alert('Transfer Ownership', `Make ${member.display_name || 'this user'} the owner? You'll become an admin.`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Transfer', style: 'destructive',
            onPress: async () => {
              const ok = await transferOwnership(circleId, member.id);
              if (ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); loadCircleData(); }
              else Alert.alert('Error', 'Could not transfer ownership.');
            },
          },
        ]);
      });
    }

    options.push('Remove from Circle');
    actions.push(() => {
      Alert.alert('Remove Member', `Remove ${member.display_name || 'this user'} from the circle?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            const ok = await removeMember(circleId, member.id);
            if (ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); loadCircleData(); }
            else Alert.alert('Error', 'Could not remove member.');
          },
        },
      ]);
    });

    options.push('Cancel');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: options.indexOf('Remove from Circle') },
        (index) => { if (index < actions.length) actions[index](); }
      );
    } else {
      Alert.alert(member.display_name || 'Member', 'Choose an action', [
        ...actions.map((action, i) => ({ text: options[i], onPress: action })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  }, [circleId, user?.id, myRole, updateMemberRole, removeMember, transferOwnership, loadCircleData]);


  /* ══════════════════════════════════════════════════════
     ══════ HERO HEADER ══════════════════════════════════
     ══════════════════════════════════════════════════════ */
  const renderHero = () => {
    if (!circle) return null;
    return (
      <Animated.View style={{ opacity: heroOpacity }}>
        {/* Decorative gradient band */}
        <View style={{
          height: 120, backgroundColor: L.purpleLight,
          borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
          position: 'absolute', top: 0, left: 0, right: 0,
        }}>
          {/* Subtle circle accents */}
          <View style={{
            position: 'absolute', width: 100, height: 100, borderRadius: 50,
            backgroundColor: L.purpleMid, opacity: 0.5, top: -20, right: 30,
          }} />
          <View style={{
            position: 'absolute', width: 60, height: 60, borderRadius: 30,
            backgroundColor: L.purpleMid, opacity: 0.4, top: 40, left: 20,
          }} />
        </View>

        <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 }}>
          {/* Big emoji */}
          <View style={{
            width: 72, height: 72, borderRadius: 24, backgroundColor: L.card,
            alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16,
            borderWidth: 1, borderColor: 'rgba(124,58,237,0.08)',
          }}>
            <Text style={{ fontSize: 38 }}>{circle.emoji || '👥'}</Text>
          </View>

          <Text style={{ fontSize: 24, fontWeight: '800', color: L.textPrimary, textAlign: 'center', letterSpacing: -0.4 }}>
            {circle.name}
          </Text>

          {circle.description ? (
            <Text style={{ fontSize: 14, color: L.textTertiary, textAlign: 'center', marginTop: 6, lineHeight: 20, maxWidth: SW * 0.7 }}>
              {circle.description}
            </Text>
          ) : null}

          {/* Member avatars + count */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 }}>
            <MemberAvatars members={members} max={5} size={28} />
            <Text style={{ fontSize: 13, color: L.textTertiary, fontWeight: '600' }}>
              {members.length} member{members.length !== 1 ? 's' : ''}
            </Text>
            {myRole && (
              <>
                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: L.textQuaternary }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  {ROLE_ICONS[myRole] ? <Text style={{ fontSize: 11 }}>{ROLE_ICONS[myRole]}</Text> : null}
                  <Text style={{ fontSize: 13, color: ROLE_COLORS[myRole] || L.textTertiary, fontWeight: '600', textTransform: 'capitalize' }}>
                    {myRole}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Quick actions row */}
          <View style={{ flexDirection: 'row', marginTop: 18, gap: 10 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: L.purple, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
                shadowColor: L.purple, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8,
              }}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleShare(); }}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={14} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Invite</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: L.card, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
                borderWidth: 1, borderColor: L.cardBorder,
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
              }}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onCreateChallenge?.(); }}
              activeOpacity={0.8}
            >
              <Ionicons name="trophy" size={14} color={L.amber} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: L.textPrimary }}>Challenge</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: L.card, alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: L.cardBorder,
              }}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={17} color={L.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };


  /* ══════════════════════════════════════════════════════
     ══════ SEGMENTED TAB BAR ════════════════════════════
     ══════════════════════════════════════════════════════ */
  const renderSegmentedTabs = () => (
    <View style={{
      flexDirection: 'row', marginHorizontal: 16, marginTop: 4, marginBottom: 12,
      backgroundColor: L.card, borderRadius: 14, padding: 3,
      borderWidth: 1, borderColor: L.cardBorder,
    }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const badgeCount = tab.key === 'challenges' ? activeChallenges.length
          : tab.key === 'members' ? members.length : 0;
        return (
          <TouchableOpacity
            key={tab.key}
            style={{
              flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 11,
              backgroundColor: isActive ? L.purple : 'transparent',
            }}
            onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.key); }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name={tab.icon as any} size={14} color={isActive ? '#fff' : L.textTertiary} />
              <Text style={{ fontSize: 11.5, fontWeight: isActive ? '700' : '500', color: isActive ? '#fff' : L.textTertiary }}>
                {tab.label}
              </Text>
              {badgeCount > 0 && !isActive && (
                <View style={{
                  backgroundColor: L.purpleLight, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 5,
                  minWidth: 16, alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: L.purple }}>{badgeCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );


  /* ══════════════════════════════════════════════════════
     ══════ OVERVIEW TAB ═════════════════════════════════
     ══════════════════════════════════════════════════════ */
  const renderOverview = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={L.purple} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Stats Strip ── */}
      <View style={{
        flexDirection: 'row', backgroundColor: L.card, borderRadius: 18, padding: 16, marginBottom: 20,
        borderWidth: 1, borderColor: L.cardBorder,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10,
      }}>
        {[
          { val: members.length, label: 'Members', icon: 'people', color: L.purple },
          { val: activeChallenges.length, label: 'Active', icon: 'flame', color: L.amber },
          { val: activity.length, label: 'Events', icon: 'pulse', color: L.green },
        ].map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && <View style={{ width: 1, backgroundColor: L.divider, marginVertical: 4 }} />}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={{
                width: 34, height: 34, borderRadius: 11,
                backgroundColor: `${s.color}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 6,
              }}>
                <Ionicons name={s.icon as any} size={16} color={s.color} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: s.color }}>{s.val}</Text>
              <Text style={{ fontSize: 10.5, color: L.textTertiary, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* ── Active Challenges Preview ── */}
      {activeChallenges.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="flame" size={14} color={L.amber} style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: L.textSecondary, flex: 1 }}>Active Challenges</Text>
            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setActiveTab('challenges'); }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: L.purple }}>See All</Text>
            </TouchableOpacity>
          </View>
          {activeChallenges.slice(0, 3).map((challenge: any) => {
            const progress = challenge.userProgress || 0;
            const goal = challenge.goal_value || 1;
            const pct = Math.min((progress / goal) * 100, 100);
            return (
              <TouchableOpacity
                key={challenge.id}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: L.card, borderRadius: 16, padding: 14, marginBottom: 8,
                  borderWidth: 1, borderColor: L.cardBorder,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4,
                }}
                onPress={() => onOpenChallenge?.(challenge.id)}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 42, height: 42, borderRadius: 14, backgroundColor: L.amberLight,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 20 }}>{challenge.emoji || '🏆'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: L.textPrimary }} numberOfLines={1}>{challenge.title}</Text>
                  <View style={{ height: 4, backgroundColor: L.divider, borderRadius: 2, overflow: 'hidden', marginTop: 7 }}>
                    <View style={{ height: '100%', width: `${pct}%`, backgroundColor: pct >= 100 ? L.green : L.purple, borderRadius: 2 }} />
                  </View>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: pct >= 100 ? L.green : L.purple, marginLeft: 10 }}>
                  {Math.round(pct)}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── Recent Activity ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name="pulse" size={14} color={L.green} style={{ marginRight: 5 }} />
        <Text style={{ fontSize: 13, fontWeight: '700', color: L.textSecondary }}>Recent Activity</Text>
      </View>
      {activity.length > 0 ? (
        <View style={{
          backgroundColor: L.card, borderRadius: 18, overflow: 'hidden',
          borderWidth: 1, borderColor: L.cardBorder,
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6,
        }}>
          {activity.slice(0, 8).map((item: CircleActivity, idx: number) => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row', alignItems: 'flex-start', padding: 14,
                borderBottomWidth: idx < Math.min(activity.length, 8) - 1 ? 0.5 : 0,
                borderBottomColor: L.divider,
              }}
            >
              {item.user_avatar ? (
                <Image source={{ uri: item.user_avatar }} style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10 }} />
              ) : (
                <View style={{
                  width: 30, height: 30, borderRadius: 15, backgroundColor: L.purpleLight,
                  alignItems: 'center', justifyContent: 'center', marginRight: 10,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: L.purple }}>{item.user_name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: L.textSecondary, lineHeight: 18 }}>
                  <Text style={{ fontWeight: '700', color: L.textPrimary }}>{item.user_name}</Text>{' '}{item.action}
                  {item.task_title ? <Text style={{ color: L.purple, fontWeight: '500' }}> "{item.task_title}"</Text> : null}
                </Text>
                <Text style={{ fontSize: 11, color: L.textQuaternary, marginTop: 3 }}>{formatTimeAgo(item.created_at)}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={{
          backgroundColor: L.card, borderRadius: 18, padding: 32, alignItems: 'center',
          borderWidth: 1, borderColor: L.cardBorder,
        }}>
          <View style={{
            width: 48, height: 48, borderRadius: 16, backgroundColor: L.bg,
            alignItems: 'center', justifyContent: 'center', marginBottom: 10,
          }}>
            <Ionicons name="pulse-outline" size={22} color={L.textQuaternary} />
          </View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: L.textTertiary }}>No activity yet</Text>
          <Text style={{ fontSize: 12, color: L.textQuaternary, marginTop: 4, textAlign: 'center' }}>
            Complete tasks and challenges to see activity here
          </Text>
        </View>
      )}
    </ScrollView>
  );


  /* ══════════════════════════════════════════════════════
     ══════ MEMBERS TAB ══════════════════════════════════
     ══════════════════════════════════════════════════════ */
  const renderMembers = () => {
    const sortedMembers = [...members].sort((a, b) => {
      const roleOrder: Record<string, number> = { owner: 0, admin: 1, member: 2 };
      return (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3);
    });

    return (
      <FlatList
        data={sortedMembers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={L.purple} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: L.textSecondary, flex: 1 }}>
              {members.length} member{members.length !== 1 ? 's' : ''}
            </Text>
            {(myRole === 'owner' || myRole === 'admin') && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: L.purple, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
                }}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Ionicons name="person-add" size={12} color="#fff" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Invite</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          const isMe = item.id === user?.id;
          const canManage = (myRole === 'owner') || (myRole === 'admin' && item.role === 'member');
          const showActionButton = canManage && !isMe;

          return (
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: L.card, borderRadius: 18, padding: 14, marginBottom: 8,
                borderWidth: 1, borderColor: isMe ? `${L.purple}20` : L.cardBorder,
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4,
              }}
              onPress={() => showActionButton && handleMemberAction(item)}
              activeOpacity={showActionButton ? 0.7 : 1}
              disabled={!showActionButton}
            >
              {/* Avatar */}
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={{ width: 46, height: 46, borderRadius: 23, marginRight: 12 }} />
              ) : (
                <View style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: item.role === 'owner' ? L.amberLight : item.role === 'admin' ? L.purpleLight : L.bg,
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <Text style={{
                    fontSize: 18, fontWeight: '700',
                    color: item.role === 'owner' ? L.amber : item.role === 'admin' ? L.purple : L.textTertiary,
                  }}>
                    {item.display_name?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: L.textPrimary }}>
                    {item.display_name || 'User'}
                  </Text>
                  {isMe && (
                    <View style={{ backgroundColor: L.purpleLight, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: L.purple }}>YOU</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 5 }}>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 3,
                    backgroundColor: item.role === 'owner' ? L.amberLight : item.role === 'admin' ? L.purpleLight : L.bg,
                    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
                  }}>
                    {ROLE_ICONS[item.role] ? <Text style={{ fontSize: 9 }}>{ROLE_ICONS[item.role]}</Text> : null}
                    <Text style={{
                      fontSize: 11, fontWeight: '700', textTransform: 'capitalize',
                      color: ROLE_COLORS[item.role] || L.textTertiary,
                    }}>
                      {item.role}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: L.textQuaternary }}>Joined {formatDate(item.joined_at)}</Text>
                </View>
              </View>

              {/* Action */}
              {showActionButton && (
                <TouchableOpacity
                  style={{
                    width: 32, height: 32, borderRadius: 10, backgroundColor: L.bg,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                  onPress={() => handleMemberAction(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="ellipsis-horizontal" size={16} color={L.textTertiary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 50 }}>
            <View style={{
              width: 60, height: 60, borderRadius: 20, backgroundColor: L.purpleLight,
              alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <Ionicons name="people-outline" size={28} color={L.purple} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: L.textPrimary }}>No members yet</Text>
            <Text style={{ fontSize: 13, color: L.textTertiary, marginTop: 6 }}>Invite friends to join your circle</Text>
          </View>
        }
      />
    );
  };


  /* ══════════════════════════════════════════════════════
     ══════ CHALLENGES TAB ═══════════════════════════════
     ══════════════════════════════════════════════════════ */
  const renderChallenges = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={L.purple} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Start Challenge CTA */}
      <TouchableOpacity
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          backgroundColor: L.purple, paddingVertical: 14, borderRadius: 18, marginBottom: 20,
          shadowColor: L.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10,
        }}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onCreateChallenge?.(); }}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={18} color="#fff" />
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Start a Challenge</Text>
      </TouchableOpacity>

      {circleChallenges.length > 0 ? (
        circleChallenges.map((challenge: any) => {
          const progress = challenge.userProgress || 0;
          const goal = challenge.goal_value || 1;
          const pct = Math.min((progress / goal) * 100, 100);
          const isActive = challenge.status === 'active';
          const daysLeft = challenge.ends_at
            ? Math.max(0, Math.ceil((new Date(challenge.ends_at).getTime() - Date.now()) / 86400000))
            : null;

          return (
            <TouchableOpacity
              key={challenge.id}
              style={{
                backgroundColor: L.card, borderRadius: 20, marginBottom: 12, overflow: 'hidden',
                borderWidth: 1, borderColor: L.cardBorder,
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10,
                opacity: isActive ? 1 : 0.55,
              }}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpenChallenge?.(challenge.id); }}
              activeOpacity={0.7}
            >
              {/* Thin accent bar */}
              <View style={{
                height: 3, backgroundColor: isActive ? (pct >= 100 ? L.green : L.purple) : L.textQuaternary,
              }} />

              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{
                    width: 48, height: 48, borderRadius: 16, backgroundColor: L.amberLight,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 24 }}>{challenge.emoji || '🏆'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: L.textPrimary }}>{challenge.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="people" size={11} color={L.textTertiary} />
                        <Text style={{ fontSize: 11, color: L.textTertiary, fontWeight: '500' }}>
                          {challenge.participantCount || 0}
                        </Text>
                      </View>
                      {daysLeft !== null && isActive && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="time" size={11} color={L.textTertiary} />
                          <Text style={{ fontSize: 11, color: L.textTertiary, fontWeight: '500' }}>{daysLeft}d left</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{
                    backgroundColor: isActive ? L.greenLight : `${L.textQuaternary}20`,
                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isActive ? L.green : L.textTertiary, textTransform: 'capitalize' }}>
                      {challenge.status}
                    </Text>
                  </View>
                </View>

                {/* Progress */}
                <View style={{ height: 6, backgroundColor: L.divider, borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${pct}%`, backgroundColor: pct >= 100 ? L.green : L.purple, borderRadius: 3 }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: L.textTertiary, fontWeight: '500' }}>
                    {progress}/{goal} {challenge.type === 'focus_time' ? 'min' : challenge.type === 'tasks_completed' ? 'tasks' : ''}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: pct >= 100 ? L.green : L.purple }}>
                    {Math.round(pct)}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 44 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 22, backgroundColor: L.amberLight,
            alignItems: 'center', justifyContent: 'center', marginBottom: 14,
          }}>
            <Ionicons name="trophy-outline" size={30} color={L.amber} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: L.textPrimary }}>No challenges yet</Text>
          <Text style={{ fontSize: 14, color: L.textTertiary, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
            Start a challenge to motivate{'\n'}your circle members!
          </Text>
        </View>
      )}
    </ScrollView>
  );


  /* ══════════════════════════════════════════════════════
     ══════ SETTINGS TAB ═════════════════════════════════
     ══════════════════════════════════════════════════════ */
  const renderSettings = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={L.purple} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Circle Info ── */}
      <View style={{
        backgroundColor: L.card, borderRadius: 20, padding: 20, marginBottom: 14,
        borderWidth: 1, borderColor: L.cardBorder,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="information-circle" size={16} color={L.purple} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: L.textSecondary }}>Circle Info</Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 11, color: L.textQuaternary, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Name</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: L.textPrimary }}>{circle?.name}</Text>
        </View>

        {circle?.description ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 11, color: L.textQuaternary, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</Text>
            <Text style={{ fontSize: 14, color: L.textSecondary, lineHeight: 20 }}>{circle.description}</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 28 }}>
          <View>
            <Text style={{ fontSize: 11, color: L.textQuaternary, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Privacy</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons
                name={circle?.privacy === 'public' ? 'globe-outline' : circle?.privacy === 'invite-only' ? 'mail-outline' : 'lock-closed-outline'}
                size={14} color={L.textSecondary}
              />
              <Text style={{ fontSize: 14, color: L.textSecondary, fontWeight: '500', textTransform: 'capitalize' }}>
                {circle?.privacy || 'Private'}
              </Text>
            </View>
          </View>
          <View>
            <Text style={{ fontSize: 11, color: L.textQuaternary, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Created</Text>
            <Text style={{ fontSize: 14, color: L.textSecondary, fontWeight: '500' }}>
              {circle?.created_at ? formatDate(circle.created_at) : '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Your Role ── */}
      <View style={{
        backgroundColor: L.card, borderRadius: 20, padding: 20, marginBottom: 14,
        borderWidth: 1, borderColor: L.cardBorder,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <Ionicons name="shield-checkmark" size={16} color={L.purple} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: L.textSecondary }}>Your Role</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 44, height: 44, borderRadius: 14,
            backgroundColor: myRole === 'owner' ? L.amberLight : myRole === 'admin' ? L.purpleLight : L.bg,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 22 }}>{ROLE_ICONS[myRole || 'member'] || '👤'}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: L.textPrimary, textTransform: 'capitalize' }}>
              {myRole || 'Member'}
            </Text>
            <Text style={{ fontSize: 12, color: L.textTertiary, marginTop: 3 }}>
              {myRole === 'owner' ? 'Full control over this circle'
                : myRole === 'admin' ? 'Can manage members and challenges'
                : 'Can participate in challenges'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Share Section ── */}
      <View style={{
        backgroundColor: L.card, borderRadius: 20, overflow: 'hidden', marginBottom: 14,
        borderWidth: 1, borderColor: L.cardBorder,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8,
      }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: L.divider }}
          onPress={handleCopyCode}
          activeOpacity={0.7}
        >
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: L.purpleLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name="copy-outline" size={16} color={L.purple} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '500', color: L.textPrimary, flex: 1 }}>Copy Invite Code</Text>
          <Text style={{ fontSize: 12, color: L.textQuaternary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
            {(circle?.invite_code || circle?.id?.substring(0, 8) || '').toUpperCase()}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: L.purpleLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name="share-outline" size={16} color={L.purple} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '500', color: L.textPrimary, flex: 1 }}>Share Circle</Text>
          <Ionicons name="chevron-forward" size={16} color={L.textQuaternary} />
        </TouchableOpacity>
      </View>

      {/* ── Danger Zone ── */}
      <View style={{
        backgroundColor: L.card, borderRadius: 20, overflow: 'hidden',
        borderWidth: 1, borderColor: `${L.danger}15`,
      }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
          onPress={handleLeaveCircle}
          activeOpacity={0.7}
        >
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: L.dangerLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name="exit-outline" size={16} color={L.danger} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: L.danger, flex: 1 }}>
            {myRole === 'owner' ? 'Transfer Ownership / Leave' : 'Leave Circle'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={`${L.danger}60`} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );


  /* ══════════════════════════════════════════════════════
     ══════ MAIN RENDER ══════════════════════════════════
     ══════════════════════════════════════════════════════ */

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: L.bg }} edges={['top', 'bottom']}>
        {/* ── Minimal Header ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16, paddingVertical: 10,
          backgroundColor: L.purpleLight,
        }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-down" size={20} color={L.textSecondary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 13, fontWeight: '600', color: L.purple, opacity: 0.6 }}>Circle</Text>
          <View style={{ width: 34 }} />
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={L.purple} />
          </View>
        ) : (
          <>
            {/* ── Hero ── */}
            {renderHero()}

            {/* ── Segmented Tabs ── */}
            {renderSegmentedTabs()}

            {/* ── Tab Content ── */}
            <View style={{ flex: 1 }}>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'members' && renderMembers()}
              {activeTab === 'challenges' && renderChallenges()}
              {activeTab === 'settings' && renderSettings()}
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}
