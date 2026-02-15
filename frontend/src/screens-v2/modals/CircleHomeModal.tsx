/**
 * Circle Home Modal — Premium iOS Circle Detail v5
 *
 * Structure:
 *   Compact header → Today Status Strip → Check-In CTA → 3-tab segmented control → Content
 *
 * Settings modal (75%) houses Invite / Members / Admin tabs.
 * Members is no longer a top-level tab.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import { useCircles, CircleMemberProfile, CircleWithMembers } from '../../hooks/supabase/useCircles';
import { useChallenges } from '../../hooks/supabase/useChallenges';
import { useCircleAccountability, FeedPost } from '../../hooks/supabase/useCircleAccountability';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { MiniVoiceButton } from '../../components/MiniVoiceButton';
import { CheckInSheet } from './CheckInSheet';
import { CheckOutSheet } from './CheckOutSheet';

/* Palette */
const L = {
  bg: '#F5F5F7', card: '#FFFFFF', cardBorder: '#EDEDF0',
  textPrimary: '#1C1C1E', textSecondary: '#48484A', textTertiary: '#8E8E93', textQuaternary: '#C7C7CC',
  divider: '#EDEDF0', purple: '#7C3AED', purpleLight: '#F5F0FF', purpleMid: '#EDE5FF',
  green: '#34C759', greenLight: '#ECFDF5', amber: '#F59E0B', amberLight: '#FFFBEB',
  danger: '#DC2626', dangerLight: '#FEF2F2',
};
const { width: SW, height: SH } = Dimensions.get('window');

/* Types */
interface CircleHomeModalProps {
  visible: boolean;
  circleId: string | null;
  onClose: () => void;
  onOpenChallenge?: (challengeId: string) => void;
  onCreateChallenge?: () => void;
}
type TabType = 'feed' | 'challenges' | 'overview';
type SettingsTab = 'invite' | 'members' | 'admin';

/* Helpers */
function formatTimeAgo(dateString: string): string {
  const s = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
const ROLE_ICONS: Record<string, string> = { owner: '👑', admin: '⭐', member: '' };
const ROLE_COLORS: Record<string, string> = { owner: L.amber, admin: L.purple, member: L.textTertiary };
const TABS: { key: TabType; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'challenges', label: 'Challenges' },
  { key: 'overview', label: 'Overview' },
];

/* ═══ Component ══════════════════════════════════════════ */
export function CircleHomeModal({ visible, circleId, onClose, onOpenChallenge, onCreateChallenge }: CircleHomeModalProps) {
  const { user } = useSupabaseAuth();
  const { getCircle, getCircleMembers, getUserRole, updateMemberRole, removeMember, leaveCircle, transferOwnership } = useCircles();
  const { challenges: allChallenges } = useChallenges();
  const accountability = useCircleAccountability(visible ? circleId : null);

  const [circle, setCircle] = useState<CircleWithMembers | null>(null);
  const [members, setMembers] = useState<CircleMemberProfile[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [myRole, setMyRole] = useState<'owner' | 'admin' | 'member' | null>(null);

  // Modals
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('invite');
  const [showMemberPreview, setShowMemberPreview] = useState(false);
  const [previewMember, setPreviewMember] = useState<CircleMemberProfile | null>(null);

  const circleChallenges = useMemo(() => allChallenges.filter((c: any) => c.circle_id === circleId), [allChallenges, circleId]);
  const activeChallenges = useMemo(() => circleChallenges.filter((c: any) => c.status === 'active'), [circleChallenges]);

  /* Data Loading */
  const loadCircleData = useCallback(async () => {
    if (!circleId) return;
    try {
      const [circleData, membersData, role] = await Promise.all([
        getCircle(circleId), getCircleMembers(circleId), getUserRole(circleId),
      ]);
      setCircle(circleData); setMembers(membersData || []); setMyRole(role);
    } catch (e) { console.error('[CircleHome] Error:', e); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, [circleId, getCircle, getCircleMembers, getUserRole]);

  useEffect(() => {
    if (visible && circleId) { setIsLoading(true); setActiveTab('feed'); loadCircleData(); }
  }, [visible, circleId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadCircleData(), accountability.refresh()]);
    setIsRefreshing(false);
  }, [loadCircleData, accountability]);

  /* Actions */
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
    try { await Share.share({ message: `Join my circle "${circle.name}" on MYPA! Code: ${circle.invite_code || circle.id}` }); } catch {}
  }, [circle]);

  const handleLeaveCircle = useCallback(() => {
    if (!circleId) return;
    if (myRole === 'owner') { Alert.alert('Cannot Leave', "Transfer ownership first."); return; }
    Alert.alert('Leave Circle', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const ok = await leaveCircle(circleId);
        if (ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onClose(); }
        else Alert.alert('Error', 'Could not leave.');
      }},
    ]);
  }, [circleId, myRole, leaveCircle, onClose]);

  const handleDeleteCircle = useCallback(() => {
    Alert.alert('Delete Circle', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Coming Soon', 'Circle deletion coming in a future update.') },
    ]);
  }, []);

  /* Member Actions */
  const handleMemberAction = useCallback((member: CircleMemberProfile) => {
    if (!circleId || member.id === user?.id) return;
    const canManage = myRole === 'owner' || (myRole === 'admin' && member.role === 'member');
    if (!canManage) return;
    const opts: string[] = [];
    const acts: (() => void)[] = [];
    if (myRole === 'owner') {
      if (member.role === 'member') {
        opts.push('Promote to Admin');
        acts.push(async () => { const ok = await updateMemberRole(circleId, member.id, 'admin'); if (ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); loadCircleData(); } });
      } else if (member.role === 'admin') {
        opts.push('Demote to Member');
        acts.push(async () => { const ok = await updateMemberRole(circleId, member.id, 'member'); if (ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); loadCircleData(); } });
      }
      opts.push('Transfer Ownership');
      acts.push(() => {
        Alert.alert('Transfer Ownership', `Make ${member.display_name || 'this user'} the owner?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Transfer', style: 'destructive', onPress: async () => { const ok = await transferOwnership(circleId, member.id); if (ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); loadCircleData(); } else Alert.alert('Error', 'Could not transfer.'); }},
        ]);
      });
    }
    opts.push('Remove from Circle');
    acts.push(() => {
      Alert.alert('Remove Member', `Remove ${member.display_name || 'this user'}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: async () => { const ok = await removeMember(circleId, member.id); if (ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); loadCircleData(); } else Alert.alert('Error', 'Could not remove.'); }},
      ]);
    });
    opts.push('Cancel');
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: opts, cancelButtonIndex: opts.length - 1, destructiveButtonIndex: opts.indexOf('Remove from Circle') },
        (i) => { if (i < acts.length) acts[i](); }
      );
    } else {
      Alert.alert(member.display_name || 'Member', 'Choose an action', [
        ...acts.map((a, i) => ({ text: opts[i], onPress: a })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  }, [circleId, user?.id, myRole, updateMemberRole, removeMember, transferOwnership, loadCircleData]);

  const handleMemberBubbleTap = useCallback((m: CircleMemberProfile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewMember(m); setShowMemberPreview(true);
  }, []);

  /* ══ COMPACT HEADER ══════════════════════════════════ */
  const renderHeader = () => {
    if (!circle) return null;
    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
        borderBottomWidth: 0.5, borderBottomColor: L.divider, backgroundColor: L.bg,
      }}>
        <TouchableOpacity onPress={onClose} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-down" size={24} color={L.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 16 }}>{circle.emoji || '👥'}</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: L.textPrimary, letterSpacing: -0.3 }} numberOfLines={1}>{circle.name}</Text>
          </View>
          <Text style={{ fontSize: 12, color: L.textTertiary, fontWeight: '500', marginTop: 1 }}>
            {members.length} member{members.length !== 1 ? 's' : ''}{myRole ? ` · ${myRole}` : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSettings(true); setSettingsTab('invite'); }}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: L.purpleLight, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={20} color={L.purple} />
          </TouchableOpacity>
          <MiniVoiceButton position="top-right" screenContext="circle_detail" size={44} style={{ position: 'relative', top: 0, right: 0 }} />
        </View>
      </View>
    );
  };

  /* ══ TODAY STATUS STRIP ══════════════════════════════ */
  const renderTodayStrip = () => {
    const { status, todayCheckin, todayCheckout, todayCheckinCount, totalMemberCount, membersCheckedIn: mcList, feed } = accountability;
    const todayStr = new Date().toDateString();
    const todayPostCount = feed.filter(p => new Date(p.created_at).toDateString() === todayStr).length;
    const pct = totalMemberCount > 0 ? Math.round((todayCheckinCount / totalMemberCount) * 100) : 0;

    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
        {/* Label row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: L.textPrimary }}>Today</Text>
            <Text style={{ fontSize: 12, color: L.textTertiary, marginTop: 1 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: L.textSecondary }}>{todayCheckinCount}/{totalMemberCount} checked in</Text>
            <Text style={{ fontSize: 11, color: L.textTertiary, marginTop: 1 }}>{todayPostCount} post{todayPostCount !== 1 ? 's' : ''} today</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ height: 4, backgroundColor: L.divider, borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
          <View style={{ height: '100%', width: `${Math.max(pct, 0)}%`, backgroundColor: pct >= 100 ? L.green : L.purple, borderRadius: 2 }} />
        </View>

        {/* Member bubbles */}
        {members.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8, gap: 12 }}>
            {members.map((member) => {
              const ms = mcList.find(m => m.user_id === member.id);
              const isIn = ms?.checked_in || false;
              const isOut = ms?.checked_out || false;
              const hasPosted = feed.some(p => p.user_id === member.id && new Date(p.created_at).toDateString() === todayStr);
              const ringColor = isOut ? L.green : isIn ? L.purple : L.textQuaternary;
              const ringW = isIn || isOut ? 2.5 : 1;
              return (
                <TouchableOpacity key={member.id} onPress={() => handleMemberBubbleTap(member)} activeOpacity={0.7} style={{ alignItems: 'center', width: 56 }}>
                  <View style={{ position: 'relative' }}>
                    {member.avatar_url ? (
                      <Image source={{ uri: member.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: ringW, borderColor: ringColor }} />
                    ) : (
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isIn ? L.purpleLight : L.bg, borderWidth: ringW, borderColor: ringColor, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: isIn ? L.purple : L.textTertiary }}>{member.display_name?.[0]?.toUpperCase() || '?'}</Text>
                      </View>
                    )}
                    {hasPosted && (
                      <View style={{ position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderRadius: 7, backgroundColor: L.green, borderWidth: 2, borderColor: L.bg, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="chatbubble" size={6} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '500', color: L.textTertiary, marginTop: 4, textAlign: 'center' }}>
                    {member.id === user?.id ? 'You' : (member.display_name?.split(' ')[0] || '?')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* CTA */}
        {renderCheckInCTA()}
      </View>
    );
  };

  /* ══ CHECK-IN CTA ═══════════════════════════════════ */
  const renderCheckInCTA = () => {
    const { status, todayCheckin, todayCheckout } = accountability;
    if (status === 'idle') {
      return (
        <View style={{ marginTop: 6, marginBottom: 8 }}>
          <TouchableOpacity style={{
            backgroundColor: L.purple, paddingVertical: 15, borderRadius: 16,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
            shadowColor: L.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12,
          }} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCheckIn(true); }} activeOpacity={0.85}>
            <Ionicons name="hand-left" size={18} color="#fff" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Check In</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (status === 'checked-in') {
      return (
        <View style={{ marginTop: 6, marginBottom: 8 }}>
          {todayCheckin && (
            <View style={{ backgroundColor: L.purpleLight, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: `${L.purple}12` }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: L.purple, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>Your Focus</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: L.textPrimary }} numberOfLines={2}>"{todayCheckin.intention_text}"</Text>
              <Text style={{ fontSize: 11, color: L.textTertiary, marginTop: 4 }}>
                {todayCheckin.committed_focus_minutes ? `${todayCheckin.committed_focus_minutes} min · ` : ''}Checked in {formatTimeAgo(todayCheckin.created_at)}
              </Text>
            </View>
          )}
          <TouchableOpacity style={{
            backgroundColor: L.amber, paddingVertical: 15, borderRadius: 16,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
            shadowColor: L.amber, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12,
          }} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCheckOut(true); }} activeOpacity={0.85}>
            <Ionicons name="log-out" size={18} color="#fff" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Check Out</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={{ marginTop: 6, marginBottom: 8 }}>
        <View style={{ backgroundColor: L.greenLight, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: `${L.green}20` }}>
          <Text style={{ fontSize: 20 }}>✅</Text>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: L.green }}>Done for today</Text>
            {todayCheckout && <Text style={{ fontSize: 12, color: L.textTertiary, marginTop: 2 }}>{todayCheckout.result_status === 'done' ? 'Nailed it!' : todayCheckout.result_status === 'partial' ? 'Partial progress' : 'Tomorrow is new'}</Text>}
          </View>
        </View>
      </View>
    );
  };

  /* ══ iOS SEGMENTED CONTROL ══════════════════════════ */
  const renderSegmentedControl = () => (
    <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 10, marginBottom: 12, backgroundColor: 'rgba(142,142,147,0.12)', borderRadius: 10, padding: 2 }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity key={tab.key} style={{
            flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8,
            backgroundColor: isActive ? L.card : 'transparent',
            shadowColor: isActive ? '#000' : 'transparent', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isActive ? 0.08 : 0, shadowRadius: 3,
          }} onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.key); }} activeOpacity={0.7}>
            <Text style={{ fontSize: 13, fontWeight: isActive ? '600' : '500', color: isActive ? L.textPrimary : L.textTertiary }}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  /* ══ FEED TAB ═══════════════════════════════════════ */
  const renderFeed = () => {
    const { feed: posts, feedLoading } = accountability;
    const renderFeedCard = (post: FeedPost) => {
      const isCheckin = post.type === 'checkin';
      const isCheckout = post.type === 'checkout';
      let icon = 'chatbubble'; let iconColor = L.purple; let iconBg = L.purpleLight; let actionText = '';
      if (isCheckin) { icon = 'hand-left'; iconColor = L.purple; iconBg = L.purpleLight; actionText = 'checked in'; }
      else if (isCheckout) {
        icon = 'log-out';
        iconColor = post.payload?.result_status === 'done' ? L.green : post.payload?.result_status === 'partial' ? L.amber : L.danger;
        iconBg = post.payload?.result_status === 'done' ? L.greenLight : post.payload?.result_status === 'partial' ? L.amberLight : L.dangerLight;
        actionText = `checked out ${post.payload?.status_emoji || ''}`;
      } else if (post.type === 'challenge_created') { icon = 'trophy'; iconColor = L.amber; iconBg = L.amberLight; actionText = 'created a challenge'; }
      else if (post.type === 'member_joined') { icon = 'person-add'; iconColor = L.green; iconBg = L.greenLight; actionText = 'joined the circle'; }
      else { actionText = post.type.replace(/_/g, ' '); }

      return (
        <View key={post.id} style={{ backgroundColor: L.card, borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 0.5, borderColor: L.cardBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {post.user_avatar ? (
              <Image source={{ uri: post.user_avatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
            ) : (
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: iconColor }}>{post.user_name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: L.textSecondary, lineHeight: 18 }}>
                <Text style={{ fontWeight: '700', color: L.textPrimary }}>{post.user_name}</Text>{' '}{actionText}
              </Text>
              <Text style={{ fontSize: 11, color: L.textQuaternary, marginTop: 2 }}>{formatTimeAgo(post.created_at)}</Text>
            </View>
            <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon as any} size={14} color={iconColor} />
            </View>
          </View>

          {isCheckin && post.payload?.intention && (
            <View style={{ marginTop: 12, backgroundColor: L.bg, borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: L.purple }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: L.textPrimary, lineHeight: 20 }}>"{post.payload.intention}"</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                {(post.payload.task_count ?? 0) > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="checkbox" size={11} color={L.textTertiary} />
                    <Text style={{ fontSize: 11, color: L.textTertiary, fontWeight: '500' }}>{post.payload.task_count} tasks</Text>
                  </View>
                )}
                {(post.payload.focus_minutes ?? 0) > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="timer" size={11} color={L.textTertiary} />
                    <Text style={{ fontSize: 11, color: L.textTertiary, fontWeight: '500' }}>{post.payload.focus_minutes} min</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {isCheckout && (
            <View style={{ marginTop: 12 }}>
              {post.payload?.intention && (
                <View style={{ backgroundColor: L.bg, borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: post.payload?.result_status === 'done' ? L.green : post.payload?.result_status === 'partial' ? L.amber : L.danger }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: L.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>Committed to</Text>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: L.textSecondary, lineHeight: 18 }}>"{post.payload.intention}"</Text>
                </View>
              )}
              {post.payload?.reflection_win && <Text style={{ fontSize: 13, color: L.textSecondary, lineHeight: 18, marginBottom: 4 }}>🏆 {post.payload.reflection_win}</Text>}
              {post.payload?.reflection_blocker && <Text style={{ fontSize: 13, color: L.textTertiary, lineHeight: 18 }}>⚠️ {post.payload.reflection_blocker}</Text>}
            </View>
          )}

          {/* XP / Streak pills */}
          {(isCheckin || isCheckout) && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: L.purpleLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 10 }}>⚡</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: L.purple }}>+10 XP</Text>
              </View>
              {isCheckout && (post.payload?.focus_minutes ?? 0) > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: L.greenLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10 }}>⏱</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: L.green }}>{post.payload.focus_minutes}m saved</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: L.amberLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 10 }}>🔥</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: L.amber }}>Streak</Text>
              </View>
            </View>
          )}
        </View>
      );
    };

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={L.purple} />} showsVerticalScrollIndicator={false}>
        {feedLoading && posts.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator size="large" color={L.purple} /></View>
        ) : posts.length > 0 ? posts.map(renderFeedCard) : (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: L.purpleLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Ionicons name="chatbubbles-outline" size={28} color={L.purple} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: L.textPrimary }}>No posts yet</Text>
            <Text style={{ fontSize: 14, color: L.textTertiary, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
              Be the first to check in today.{'\n'}Your circle is waiting.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  /* ══ CHALLENGES TAB ═════════════════════════════════ */
  const renderChallenges = () => {
    const isAdmin = myRole === 'owner' || myRole === 'admin';
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={L.purple} />} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          backgroundColor: isAdmin ? L.purple : L.textQuaternary, paddingVertical: 14, borderRadius: 16, marginBottom: 20,
          shadowColor: isAdmin ? L.purple : 'transparent', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, opacity: isAdmin ? 1 : 0.5,
        }} onPress={() => {
          if (!isAdmin) { Alert.alert('Admin Only', 'Only owners and admins can create challenges.'); return; }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onCreateChallenge?.();
        }} activeOpacity={0.8}>
          <Ionicons name="add-circle" size={18} color="#fff" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>New Challenge</Text>
          {!isAdmin && <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.7)" />}
        </TouchableOpacity>

        {circleChallenges.length > 0 ? circleChallenges.map((challenge: any) => {
          const progress = challenge.userProgress || 0;
          const goal = challenge.goal_value || 1;
          const pct = Math.min((progress / goal) * 100, 100);
          const isActive = challenge.status === 'active';
          const daysLeft = challenge.ends_at ? Math.max(0, Math.ceil((new Date(challenge.ends_at).getTime() - Date.now()) / 86400000)) : null;
          return (
            <TouchableOpacity key={challenge.id} style={{
              backgroundColor: L.card, borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 0.5, borderColor: L.cardBorder,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, opacity: isActive ? 1 : 0.55,
            }} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpenChallenge?.(challenge.id); }} activeOpacity={0.7}>
              <View style={{ height: 3, backgroundColor: isActive ? (pct >= 100 ? L.green : L.purple) : L.textQuaternary }} />
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: L.amberLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24 }}>{challenge.emoji || '🏆'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: L.textPrimary }}>{challenge.title}</Text>
                    {challenge.description ? <Text numberOfLines={1} style={{ fontSize: 12, color: L.textTertiary, marginTop: 2 }}>{challenge.description}</Text> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="people" size={11} color={L.textTertiary} />
                        <Text style={{ fontSize: 11, color: L.textTertiary, fontWeight: '500' }}>{challenge.participantCount || 0}</Text>
                      </View>
                      {daysLeft !== null && isActive && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="time" size={11} color={L.textTertiary} />
                          <Text style={{ fontSize: 11, color: L.textTertiary, fontWeight: '500' }}>{daysLeft}d left</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{ backgroundColor: isActive ? L.greenLight : `${L.textQuaternary}20`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isActive ? L.green : L.textTertiary, textTransform: 'capitalize' }}>{challenge.status}</Text>
                  </View>
                </View>
                <View style={{ height: 6, backgroundColor: L.divider, borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${pct}%`, backgroundColor: pct >= 100 ? L.green : L.purple, borderRadius: 3 }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: L.textTertiary, fontWeight: '500' }}>
                    {progress}/{goal} {challenge.type === 'focus_time' ? 'min' : challenge.type === 'tasks_completed' ? 'tasks' : ''}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: pct >= 100 ? L.green : L.purple }}>{Math.round(pct)}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }) : (
          <View style={{ alignItems: 'center', paddingVertical: 44 }}>
            <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: L.amberLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Ionicons name="trophy-outline" size={30} color={L.amber} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: L.textPrimary }}>No challenges yet</Text>
            <Text style={{ fontSize: 14, color: L.textTertiary, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
              {isAdmin ? 'Start a challenge to motivate\nyour circle!' : 'Ask an admin to create one.'}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  /* ══ OVERVIEW TAB ═══════════════════════════════════ */
  const renderOverview = () => {
    const { feed } = accountability;
    const weekPosts = feed.filter(p => Date.now() - new Date(p.created_at).getTime() < 7 * 86400000).length;
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={L.purple} />} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={{ backgroundColor: L.card, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: L.cardBorder }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: L.textPrimary, marginBottom: 14 }}>Circle Stats</Text>
          <View style={{ flexDirection: 'row' }}>
            {[{ val: members.length, label: 'Members', icon: 'people', color: L.purple }, { val: activeChallenges.length, label: 'Active', icon: 'flame', color: L.amber }, { val: weekPosts, label: 'This Week', icon: 'chatbubbles', color: L.green }].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={{ width: 1, backgroundColor: L.divider, marginVertical: 4 }} />}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Ionicons name={s.icon as any} size={16} color={s.color} style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: 22, fontWeight: '800', color: s.color }}>{s.val}</Text>
                  <Text style={{ fontSize: 10, color: L.textTertiary, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
        {circle?.description ? (
          <View style={{ backgroundColor: L.card, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: L.cardBorder }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: L.textPrimary, marginBottom: 8 }}>About</Text>
            <Text style={{ fontSize: 14, color: L.textSecondary, lineHeight: 20 }}>{circle.description}</Text>
          </View>
        ) : null}
        {activeChallenges.length > 0 && (
          <View style={{ backgroundColor: L.card, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: L.cardBorder }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: L.textPrimary }}>Active Challenges</Text>
              <TouchableOpacity onPress={() => setActiveTab('challenges')}><Text style={{ fontSize: 12, fontWeight: '600', color: L.purple }}>See All</Text></TouchableOpacity>
            </View>
            {activeChallenges.slice(0, 3).map((ch: any) => {
              const p = Math.min(((ch.userProgress || 0) / (ch.goal_value || 1)) * 100, 100);
              return (
                <TouchableOpacity key={ch.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }} onPress={() => onOpenChallenge?.(ch.id)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 18, marginRight: 10 }}>{ch.emoji || '🏆'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: L.textPrimary }}>{ch.title}</Text>
                    <View style={{ height: 4, backgroundColor: L.divider, borderRadius: 2, overflow: 'hidden', marginTop: 5 }}>
                      <View style={{ height: '100%', width: `${p}%`, backgroundColor: p >= 100 ? L.green : L.purple, borderRadius: 2 }} />
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: L.textTertiary, marginLeft: 10 }}>{Math.round(p)}%</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={{ backgroundColor: L.card, borderRadius: 18, padding: 16, borderWidth: 0.5, borderColor: L.cardBorder }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 18 }}>🔥</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: L.textPrimary }}>Streaks</Text>
          </View>
          <Text style={{ fontSize: 13, color: L.textTertiary, lineHeight: 19 }}>Streak tracking coming soon. Check in daily to build yours!</Text>
        </View>
      </ScrollView>
    );
  };

  /* ══ SETTINGS MODAL ═════════════════════════════════ */
  const renderSettingsModal = () => {
    const { membersCheckedIn: mcList } = accountability;
    const checkinMap = new Map(mcList.map(m => [m.user_id, m]));
    const isOwner = myRole === 'owner';
    const code = circle?.invite_code || circle?.id?.substring(0, 8) || '';
    const visTabs: { key: SettingsTab; label: string }[] = [
      { key: 'invite', label: 'Invite' }, { key: 'members', label: 'Members' },
      ...(isOwner ? [{ key: 'admin' as SettingsTab, label: 'Admin' }] : []),
    ];
    const sorted = [...members].sort((a, b) => {
      const ro: Record<string, number> = { owner: 0, admin: 1, member: 2 };
      return (ro[a.role] ?? 3) - (ro[b.role] ?? 3);
    });

    return (
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={() => setShowSettings(false)} />
          <View style={{ height: SH * 0.75, backgroundColor: L.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16 }}>
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D1D6' }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: L.divider }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: L.textPrimary }}>Circle Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(142,142,147,0.12)', alignItems: 'center', justifyContent: 'center' }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={16} color={L.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 14, marginBottom: 14, backgroundColor: 'rgba(142,142,147,0.12)', borderRadius: 10, padding: 2 }}>
              {visTabs.map(t => {
                const a = settingsTab === t.key;
                return (
                  <TouchableOpacity key={t.key} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: a ? L.card : 'transparent', shadowColor: a ? '#000' : 'transparent', shadowOffset: { width: 0, height: 1 }, shadowOpacity: a ? 0.08 : 0, shadowRadius: 3 }}
                    onPress={() => { Haptics.selectionAsync(); setSettingsTab(t.key); }} activeOpacity={0.7}>
                    <Text style={{ fontSize: 13, fontWeight: a ? '600' : '500', color: a ? L.textPrimary : L.textTertiary }}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {/* Invite */}
              {settingsTab === 'invite' && (
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: L.textPrimary, marginBottom: 12 }}>Invite Code</Text>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: L.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: copiedCode ? `${L.green}40` : L.cardBorder, marginBottom: 16 }}
                    onPress={handleCopyCode} activeOpacity={0.7}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: L.textPrimary, letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{code.toUpperCase()}</Text>
                    <View style={{ marginLeft: 12 }}><Ionicons name={copiedCode ? "checkmark-circle" : "copy-outline"} size={22} color={copiedCode ? L.green : L.purple} /></View>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: L.purple, paddingVertical: 14, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 }}
                    onPress={handleCopyCode} activeOpacity={0.85}>
                    <Ionicons name="copy" size={16} color="#fff" />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>{copiedCode ? 'Copied!' : 'Copy Code'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: L.card, paddingVertical: 14, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: L.cardBorder }}
                    onPress={handleShare} activeOpacity={0.85}>
                    <Ionicons name="share-outline" size={16} color={L.purple} />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: L.purple }}>Share Invite</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Members */}
              {settingsTab === 'members' && (
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: L.textTertiary, marginBottom: 12 }}>{members.length} member{members.length !== 1 ? 's' : ''} · {accountability.todayCheckinCount} checked in</Text>
                  {sorted.map(item => {
                    const isMe = item.id === user?.id;
                    const canManage = (myRole === 'owner') || (myRole === 'admin' && item.role === 'member');
                    const showAct = canManage && !isMe;
                    const ms = checkinMap.get(item.id);
                    const isIn = ms?.checked_in || false;
                    const isOut = ms?.checked_out || false;
                    return (
                      <TouchableOpacity key={item.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: L.card, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 0.5, borderColor: isMe ? `${L.purple}20` : L.cardBorder }}
                        onPress={() => showAct && handleMemberAction(item)} activeOpacity={showAct ? 0.7 : 1} disabled={!showAct}>
                        <View style={{ position: 'relative' }}>
                          {item.avatar_url ? (
                            <Image source={{ uri: item.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
                          ) : (
                            <View style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: item.role === 'owner' ? L.amberLight : item.role === 'admin' ? L.purpleLight : L.bg, alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={{ fontSize: 16, fontWeight: '700', color: item.role === 'owner' ? L.amber : item.role === 'admin' ? L.purple : L.textTertiary }}>{item.display_name?.[0]?.toUpperCase() || '?'}</Text>
                            </View>
                          )}
                          {isIn && (
                            <View style={{ position: 'absolute', bottom: -2, right: 8, width: 16, height: 16, borderRadius: 8, backgroundColor: isOut ? L.green : L.amber, borderWidth: 2, borderColor: L.card, alignItems: 'center', justifyContent: 'center' }}>
                              <Ionicons name={isOut ? "checkmark" : "time"} size={8} color="#fff" />
                            </View>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: L.textPrimary }}>{item.display_name || 'User'}</Text>
                            {isMe && <View style={{ backgroundColor: L.purpleLight, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 }}><Text style={{ fontSize: 10, fontWeight: '700', color: L.purple }}>YOU</Text></View>}
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: item.role === 'owner' ? L.amberLight : item.role === 'admin' ? L.purpleLight : L.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                              {ROLE_ICONS[item.role] ? <Text style={{ fontSize: 9 }}>{ROLE_ICONS[item.role]}</Text> : null}
                              <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'capitalize', color: ROLE_COLORS[item.role] || L.textTertiary }}>{item.role}</Text>
                            </View>
                            {isIn ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: isOut ? L.greenLight : L.amberLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                                <Text style={{ fontSize: 9 }}>{isOut ? '✅' : '🟡'}</Text>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: isOut ? L.green : L.amber }}>{isOut ? 'Done' : 'Checked in'}</Text>
                              </View>
                            ) : (
                              <View style={{ backgroundColor: `${L.textQuaternary}20`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                                <Text style={{ fontSize: 10, fontWeight: '600', color: L.textQuaternary }}>Not yet</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        {showAct && (
                          <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: L.bg, alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => handleMemberAction(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="ellipsis-horizontal" size={16} color={L.textTertiary} />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Admin */}
              {settingsTab === 'admin' && isOwner && (
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: L.textPrimary, marginBottom: 8 }}>Circle Name</Text>
                  <View style={{ backgroundColor: L.card, borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 0.5, borderColor: L.cardBorder }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: L.textPrimary }}>{circle?.name}</Text>
                    <Text style={{ fontSize: 12, color: L.textTertiary, marginTop: 4 }}>Name editing coming soon.</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: L.danger, marginBottom: 12 }}>Danger Zone</Text>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: L.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 0.5, borderColor: L.cardBorder }}
                    onPress={handleLeaveCircle} activeOpacity={0.7}>
                    <Ionicons name="log-out-outline" size={20} color={L.amber} />
                    <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: '600', color: L.textPrimary }}>Transfer & Leave</Text><Text style={{ fontSize: 12, color: L.textTertiary, marginTop: 2 }}>Transfer ownership before leaving</Text></View>
                    <Ionicons name="chevron-forward" size={16} color={L.textQuaternary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: L.dangerLight, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: `${L.danger}20` }}
                    onPress={handleDeleteCircle} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={20} color={L.danger} />
                    <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: '600', color: L.danger }}>Delete Circle</Text><Text style={{ fontSize: 12, color: L.textTertiary, marginTop: 2 }}>Cannot be undone</Text></View>
                    <Ionicons name="chevron-forward" size={16} color={L.textQuaternary} />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  /* ══ MEMBER PREVIEW MODAL ═══════════════════════════ */
  const renderMemberPreview = () => {
    if (!previewMember) return null;
    const ms = accountability.membersCheckedIn.find(m => m.user_id === previewMember.id);
    const isIn = ms?.checked_in || false;
    const isOut = ms?.checked_out || false;
    return (
      <Modal visible={showMemberPreview} transparent animationType="fade" onRequestClose={() => setShowMemberPreview(false)}>
        <Pressable style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setShowMemberPreview(false)}>
          <Pressable style={{ backgroundColor: L.card, borderRadius: 24, padding: 28, width: SW * 0.75, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20 }}>
            {previewMember.avatar_url ? (
              <Image source={{ uri: previewMember.avatar_url }} style={{ width: 72, height: 72, borderRadius: 36, marginBottom: 14 }} />
            ) : (
              <View style={{ width: 72, height: 72, borderRadius: 36, marginBottom: 14, backgroundColor: L.purpleLight, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: L.purple }}>{previewMember.display_name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
            )}
            <Text style={{ fontSize: 18, fontWeight: '700', color: L.textPrimary }}>{previewMember.display_name || 'User'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
              {ROLE_ICONS[previewMember.role] ? <Text style={{ fontSize: 12 }}>{ROLE_ICONS[previewMember.role]}</Text> : null}
              <Text style={{ fontSize: 13, fontWeight: '600', color: ROLE_COLORS[previewMember.role] || L.textTertiary, textTransform: 'capitalize' }}>{previewMember.role}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: isOut ? L.greenLight : isIn ? L.amberLight : L.bg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
              <Text style={{ fontSize: 14 }}>{isOut ? '✅' : isIn ? '🟡' : '⏳'}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: isOut ? L.green : isIn ? L.amber : L.textTertiary }}>{isOut ? 'Checked out' : isIn ? 'Checked in' : 'Not checked in'}</Text>
            </View>
            {isIn && ms?.intention && (
              <View style={{ marginTop: 12, backgroundColor: L.bg, borderRadius: 10, padding: 12, width: '100%' }}>
                <Text style={{ fontSize: 12, color: L.textSecondary, lineHeight: 17, textAlign: 'center' }}>"{ms.intention}"</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
              <Text style={{ fontSize: 14 }}>🔥</Text>
              <Text style={{ fontSize: 12, color: L.textTertiary, fontWeight: '500' }}>Streak tracking coming soon</Text>
            </View>
            <TouchableOpacity style={{ marginTop: 18, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12, backgroundColor: L.bg }}
              onPress={() => setShowMemberPreview(false)} activeOpacity={0.7}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: L.textTertiary }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  /* ══ MAIN RENDER ═══════════════════════════════════ */
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: L.bg }} edges={['top', 'bottom']}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={L.purple} /></View>
        ) : (
          <>
            {renderHeader()}
            {renderTodayStrip()}
            {renderSegmentedControl()}
            <View style={{ flex: 1 }}>
              {activeTab === 'feed' && renderFeed()}
              {activeTab === 'challenges' && renderChallenges()}
              {activeTab === 'overview' && renderOverview()}
            </View>
          </>
        )}
      </SafeAreaView>
      {renderSettingsModal()}
      {renderMemberPreview()}
      <CheckInSheet visible={showCheckIn} circleId={circleId || ''} circleName={circle?.name || ''} onClose={() => setShowCheckIn(false)} onSubmit={accountability.checkIn} />
      <CheckOutSheet visible={showCheckOut} circleId={circleId || ''} circleName={circle?.name || ''} todayCheckin={accountability.todayCheckin} onClose={() => setShowCheckOut(false)} onSubmit={accountability.checkOut} />
    </Modal>
  );
}
