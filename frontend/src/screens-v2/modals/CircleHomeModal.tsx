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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import { useCircles, CircleMemberProfile, CircleWithMembers } from '../../hooks/supabase/useCircles';
import { useChallenges } from '../../hooks/supabase/useChallenges';
import { useCircleAccountability, FeedPost } from '../../hooks/supabase/useCircleAccountability';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../lib/supabase';
import { MiniVoiceButton } from '../../components/MiniVoiceButton';
import { CheckInSheet } from './CheckInSheet';
import { CheckOutSheet } from './CheckOutSheet';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius, spacing } from '../../styles/theme';
const { width: SW, height: SH } = Dimensions.get('window');

/* Types */
interface CircleHomeModalProps {
  visible: boolean;
  circleId: string | null;
  onClose: () => void;
  onOpenChallenge?: (challengeId: string) => void;
  onCreateChallenge?: () => void;
  initialTab?: TabType;
  initialFocus?: 'checkin';
}
type TabType = 'feed' | 'challenges' | 'overview';

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
const ROLE_COLORS: Record<string, string> = { owner: semantic.warning, admin: brand.primary, member: textTokens.tertiary };
const TABS: { key: TabType; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'challenges', label: 'Challenges' },
  { key: 'overview', label: 'Overview' },
];

/* ═══ Component ══════════════════════════════════════════ */
export function CircleHomeModal({ visible, circleId, onClose, onOpenChallenge, onCreateChallenge, initialTab, initialFocus }: CircleHomeModalProps) {
  const { user } = useSupabaseAuth();
  const { getCircle, getCircleMembers, getUserRole, updateMemberRole, removeMember, leaveCircle, transferOwnership, deleteCircle, updateCircle } = useCircles();
  const { challenges: allChallenges, refresh: refreshChallenges } = useChallenges();
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
  const [showMemberPreview, setShowMemberPreview] = useState(false);
  const [previewMember, setPreviewMember] = useState<CircleMemberProfile | null>(null);

  // Admin editing
  const [isEditingCircle, setIsEditingCircle] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Challenges the user has joined in this circle (from useChallenges hook)
  const myCircleChallenges = useMemo(() => allChallenges.filter((c: any) => c.circle_id === circleId), [allChallenges, circleId]);
  const activeChallenges = useMemo(() => myCircleChallenges.filter((c: any) => c.status === 'active'), [myCircleChallenges]);

  // ALL challenges for this circle (including ones user hasn't joined)
  const [allCircleChallenges, setAllCircleChallenges] = useState<any[]>([]);
  const joinedIds = useMemo(() => new Set(myCircleChallenges.map((c: any) => c.id)), [myCircleChallenges]);
  // Merge: use enriched data for joined challenges, raw data for non-joined
  const circleChallenges = useMemo(() => {
    const merged = [...myCircleChallenges];
    allCircleChallenges.forEach((c: any) => {
      if (!joinedIds.has(c.id)) merged.push(c);
    });
    // Sort: active first, then by created_at desc
    return merged.sort((a: any, b: any) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [myCircleChallenges, allCircleChallenges, joinedIds]);

  const fetchAllCircleChallenges = useCallback(async () => {
    if (!circleId) return;
    try {
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false });
      setAllCircleChallenges(data || []);
    } catch (e) { console.error('[CircleHome] fetch all challenges error:', e); }
  }, [circleId]);

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
    if (visible && circleId) { setIsLoading(true); setActiveTab(initialTab || 'feed'); loadCircleData(); refreshChallenges(); fetchAllCircleChallenges(); }
  }, [visible, circleId]);

  // Auto-open CheckInSheet when navigated with initialFocus='checkin'
  useEffect(() => {
    if (visible && initialFocus === 'checkin' && !isLoading && accountability.status === 'idle') {
      setShowCheckIn(true);
    }
  }, [visible, initialFocus, isLoading, accountability.status]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadCircleData(), accountability.refresh(), refreshChallenges(), fetchAllCircleChallenges()]);
    setIsRefreshing(false);
  }, [loadCircleData, accountability, refreshChallenges, fetchAllCircleChallenges]);

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
    if (!circleId) return;
    Alert.alert(
      'Delete Circle',
      'This will permanently delete this circle, all posts, and check-ins. Challenges will be unlinked but not deleted. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            const ok = await deleteCircle(circleId);
            if (ok) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setShowSettings(false);
              onClose();
            } else {
              Alert.alert('Error', 'Could not delete the circle. Make sure you are the owner.');
            }
          },
        },
      ],
    );
  }, [circleId, deleteCircle, onClose]);

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
        borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary, backgroundColor: bg.primary,
      }}>
        <TouchableOpacity onPress={onClose} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-down" size={24} color={textTokens.secondary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 16 }}>{circle.emoji || '👥'}</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: textTokens.primary, letterSpacing: -0.3 }} numberOfLines={1}>{circle.name}</Text>
          </View>
          <Text style={{ fontSize: 12, color: textTokens.tertiary, fontWeight: '500', marginTop: 1 }}>
            {members.length} member{members.length !== 1 ? 's' : ''}{myRole ? ` · ${myRole}` : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSettings(true); }}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: brand.muted, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={20} color={brand.primary} />
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
            <Text style={{ fontSize: 16, fontWeight: '700', color: textTokens.primary }}>Today</Text>
            <Text style={{ fontSize: 12, color: textTokens.tertiary, marginTop: 1 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: textTokens.secondary }}>{todayCheckinCount}/{totalMemberCount} checked in</Text>
            <Text style={{ fontSize: 11, color: textTokens.tertiary, marginTop: 1 }}>{todayPostCount} post{todayPostCount !== 1 ? 's' : ''} today</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ height: 4, backgroundColor: borderTokens.primary, borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
          <View style={{ height: '100%', width: `${Math.max(pct, 0)}%`, backgroundColor: pct >= 100 ? semantic.success : brand.primary, borderRadius: 2 }} />
        </View>

        {/* Member bubbles */}
        {members.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8, gap: 12 }}>
            {members.map((member) => {
              const ms = mcList.find(m => m.user_id === member.id);
              const isIn = ms?.checked_in || false;
              const isOut = ms?.checked_out || false;
              const hasPosted = feed.some(p => p.user_id === member.id && new Date(p.created_at).toDateString() === todayStr);
              const ringColor = isOut ? semantic.success : isIn ? brand.primary : textTokens.disabled;
              const ringW = isIn || isOut ? 2.5 : 1;
              return (
                <TouchableOpacity key={member.id} onPress={() => handleMemberBubbleTap(member)} activeOpacity={0.7} style={{ alignItems: 'center', width: 56 }}>
                  <View style={{ position: 'relative' }}>
                    {member.avatar_url ? (
                      <Image source={{ uri: member.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: ringW, borderColor: ringColor }} />
                    ) : (
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isIn ? brand.muted : bg.primary, borderWidth: ringW, borderColor: ringColor, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: isIn ? brand.primary : textTokens.tertiary }}>{member.display_name?.[0]?.toUpperCase() || '?'}</Text>
                      </View>
                    )}
                    {hasPosted && (
                      <View style={{ position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderRadius: 7, backgroundColor: semantic.success, borderWidth: 2, borderColor: bg.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="chatbubble" size={6} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '500', color: textTokens.tertiary, marginTop: 4, textAlign: 'center' }}>
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
            backgroundColor: brand.primary, paddingVertical: 15, borderRadius: 16,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
            shadowColor: brand.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12,
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
            <View style={{ backgroundColor: brand.muted, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: `${brand.primary}12` }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: brand.primary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>Your Focus</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: textTokens.primary }} numberOfLines={2}>"{todayCheckin.intention_text}"</Text>
              <Text style={{ fontSize: 11, color: textTokens.tertiary, marginTop: 4 }}>
                {todayCheckin.committed_focus_minutes ? `${todayCheckin.committed_focus_minutes} min · ` : ''}Checked in {formatTimeAgo(todayCheckin.created_at)}
              </Text>
            </View>
          )}
          <TouchableOpacity style={{
            backgroundColor: semantic.warning, paddingVertical: 15, borderRadius: 16,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
            shadowColor: semantic.warning, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12,
          }} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCheckOut(true); }} activeOpacity={0.85}>
            <Ionicons name="log-out" size={18} color="#fff" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Check Out</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={{ marginTop: 6, marginBottom: 8 }}>
        <View style={{ backgroundColor: semantic.successLight, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: `${semantic.success}20` }}>
          <Text style={{ fontSize: 20 }}>✅</Text>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: semantic.success }}>Done for today</Text>
            {todayCheckout && <Text style={{ fontSize: 12, color: textTokens.tertiary, marginTop: 2 }}>{todayCheckout.result_status === 'done' ? 'Nailed it!' : todayCheckout.result_status === 'partial' ? 'Partial progress' : 'Tomorrow is new'}</Text>}
          </View>
        </View>
      </View>
    );
  };

  /* ══ iOS SEGMENTED CONTROL ══════════════════════════ */
  const renderSegmentedControl = () => (
    <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 10, marginBottom: 12, backgroundColor: bg.secondary, borderRadius: 10, padding: 2 }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity key={tab.key} style={{
            flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8,
            backgroundColor: isActive ? bg.card : 'transparent',
            shadowColor: isActive ? '#000' : 'transparent', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isActive ? 0.08 : 0, shadowRadius: 3,
          }} onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.key); }} activeOpacity={0.7}>
            <Text style={{ fontSize: 13, fontWeight: isActive ? '600' : '500', color: isActive ? textTokens.primary : textTokens.tertiary }}>{tab.label}</Text>
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
      let icon = 'chatbubble'; let iconColor: string = brand.primary; let iconBg: string = brand.muted; let actionText = '';
      if (isCheckin) { icon = 'hand-left'; iconColor = brand.primary; iconBg = brand.muted; actionText = 'checked in'; }
      else if (isCheckout) {
        icon = 'log-out';
        iconColor = post.payload?.result_status === 'done' ? semantic.success : post.payload?.result_status === 'partial' ? semantic.warning : semantic.error;
        iconBg = post.payload?.result_status === 'done' ? semantic.successLight : post.payload?.result_status === 'partial' ? semantic.warningLight : semantic.errorLight;
        actionText = `checked out ${post.payload?.status_emoji || ''}`;
      } else if (post.type === 'challenge_created') { icon = 'trophy'; iconColor = semantic.warning; iconBg = semantic.warningLight; actionText = 'created a challenge'; }
      else if (post.type === 'member_joined') { icon = 'person-add'; iconColor = semantic.success; iconBg = semantic.successLight; actionText = 'joined the circle'; }
      else { actionText = post.type.replace(/_/g, ' '); }

      return (
        <View key={post.id} style={{ backgroundColor: bg.card, borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 0.5, borderColor: borderTokens.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {post.user_avatar ? (
              <Image source={{ uri: post.user_avatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
            ) : (
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: iconColor }}>{post.user_name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: textTokens.secondary, lineHeight: 18 }}>
                <Text style={{ fontWeight: '700', color: textTokens.primary }}>{post.user_name}</Text>{' '}{actionText}
              </Text>
              <Text style={{ fontSize: 11, color: textTokens.disabled, marginTop: 2 }}>{formatTimeAgo(post.created_at)}</Text>
            </View>
            <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon as any} size={14} color={iconColor} />
            </View>
          </View>

          {isCheckin && post.payload?.intention && (
            <View style={{ marginTop: 12, backgroundColor: bg.primary, borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: brand.primary }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: textTokens.primary, lineHeight: 20 }}>"{post.payload.intention}"</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                {(post.payload.task_count ?? 0) > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="checkbox" size={11} color={textTokens.tertiary} />
                    <Text style={{ fontSize: 11, color: textTokens.tertiary, fontWeight: '500' }}>{post.payload.task_count} tasks</Text>
                  </View>
                )}
                {(post.payload.focus_minutes ?? 0) > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="timer" size={11} color={textTokens.tertiary} />
                    <Text style={{ fontSize: 11, color: textTokens.tertiary, fontWeight: '500' }}>{post.payload.focus_minutes} min</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {post.type === 'challenge_created' && post.payload?.challenge_title && (
            <TouchableOpacity
              style={{ marginTop: 12, backgroundColor: bg.primary, borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: semantic.warning }}
              onPress={() => { if (post.payload?.challenge_id) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpenChallenge?.(post.payload.challenge_id); } }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>{post.payload.challenge_emoji || '🏆'}</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: textTokens.primary, flex: 1 }}>{post.payload.challenge_title}</Text>
                <Ionicons name="chevron-forward" size={16} color={textTokens.disabled} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  {post.payload.duration_days && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="calendar" size={11} color={textTokens.tertiary} />
                      <Text style={{ fontSize: 11, color: textTokens.tertiary, fontWeight: '500' }}>{post.payload.duration_days} days</Text>
                    </View>
                  )}
                  {post.payload.tracking_method && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name={post.payload.tracking_method === 'focus_minutes' ? 'timer' : post.payload.tracking_method === 'proof_checkin' ? 'camera' : 'checkbox'} size={11} color={textTokens.tertiary} />
                      <Text style={{ fontSize: 11, color: textTokens.tertiary, fontWeight: '500' }}>{post.payload.tracking_method.replace(/_/g, ' ')}</Text>
                    </View>
                  )}
                </View>
                <View style={{ backgroundColor: '#10B98114', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>View & Join</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {isCheckout && (
            <View style={{ marginTop: 12 }}>
              {post.payload?.intention && (
                <View style={{ backgroundColor: bg.primary, borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: post.payload?.result_status === 'done' ? semantic.success : post.payload?.result_status === 'partial' ? semantic.warning : semantic.error }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: textTokens.tertiary, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>Committed to</Text>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: textTokens.secondary, lineHeight: 18 }}>"{post.payload.intention}"</Text>
                </View>
              )}
              {post.payload?.reflection_win && <Text style={{ fontSize: 13, color: textTokens.secondary, lineHeight: 18, marginBottom: 4 }}>🏆 {post.payload.reflection_win}</Text>}
              {post.payload?.reflection_blocker && <Text style={{ fontSize: 13, color: textTokens.tertiary, lineHeight: 18 }}>⚠️ {post.payload.reflection_blocker}</Text>}
            </View>
          )}

          {/* Focus time pill (only for checkouts with focus data) */}
          {isCheckout && (post.payload?.focus_minutes ?? 0) > 0 && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: semantic.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 10 }}>⏱</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: semantic.success }}>{post.payload.focus_minutes}m focused</Text>
              </View>
            </View>
          )}
        </View>
      );
    };

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={brand.primary} />} showsVerticalScrollIndicator={false}>
        {feedLoading && posts.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator size="large" color={brand.primary} /></View>
        ) : posts.length > 0 ? posts.map(renderFeedCard) : (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: brand.muted, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Ionicons name="chatbubbles-outline" size={28} color={brand.primary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: textTokens.primary }}>No posts yet</Text>
            <Text style={{ fontSize: 14, color: textTokens.tertiary, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={brand.primary} />} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          backgroundColor: isAdmin ? brand.primary : textTokens.disabled, paddingVertical: 14, borderRadius: 16, marginBottom: 20,
          shadowColor: isAdmin ? brand.primary : 'transparent', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, opacity: isAdmin ? 1 : 0.5,
        }} onPress={() => {
          if (!isAdmin) { Alert.alert('Admin Only', 'Only owners and admins can create challenges.'); return; }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onCreateChallenge?.();
        }} activeOpacity={0.8}>
          <Ionicons name="add-circle" size={18} color="#fff" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>New Challenge</Text>
          {!isAdmin && <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.7)" />}
        </TouchableOpacity>

        {circleChallenges.length > 0 ? circleChallenges.map((challenge: any) => {
          const isJoined = joinedIds.has(challenge.id);
          const progress = challenge.userProgress || 0;
          const goal = challenge.goal_value || 1;
          const pct = isJoined ? Math.min((progress / goal) * 100, 100) : 0;
          const isActive = challenge.status === 'active';
          const daysLeft = challenge.ends_at ? Math.max(0, Math.ceil((new Date(challenge.ends_at).getTime() - Date.now()) / 86400000)) : null;
          return (
            <TouchableOpacity key={challenge.id} style={{
              backgroundColor: bg.card, borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 0.5, borderColor: borderTokens.primary,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, opacity: isActive ? 1 : 0.55,
            }} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpenChallenge?.(challenge.id); }} activeOpacity={0.7}>
              <View style={{ height: 3, backgroundColor: isActive ? (isJoined && pct >= 100 ? semantic.success : isJoined ? brand.primary : '#10B981') : textTokens.disabled }} />
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: semantic.warningLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24 }}>{challenge.emoji || '🏆'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: textTokens.primary }}>{challenge.title}</Text>
                    {challenge.description ? <Text numberOfLines={1} style={{ fontSize: 12, color: textTokens.tertiary, marginTop: 2 }}>{challenge.description}</Text> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="people" size={11} color={textTokens.tertiary} />
                        <Text style={{ fontSize: 11, color: textTokens.tertiary, fontWeight: '500' }}>{challenge.participantCount || 0}</Text>
                      </View>
                      {daysLeft !== null && isActive && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="time" size={11} color={textTokens.tertiary} />
                          <Text style={{ fontSize: 11, color: textTokens.tertiary, fontWeight: '500' }}>{daysLeft}d left</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {isJoined ? (
                    <View style={{ backgroundColor: isActive ? semantic.successLight : `${textTokens.disabled}20`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isActive ? semantic.success : textTokens.tertiary, textTransform: 'capitalize' }}>{challenge.status}</Text>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: '#10B98114', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>Join</Text>
                    </View>
                  )}
                </View>
                {isJoined ? (
                  <>
                    <View style={{ height: 6, backgroundColor: borderTokens.primary, borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${pct}%`, backgroundColor: pct >= 100 ? semantic.success : brand.primary, borderRadius: 3 }} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <Text style={{ fontSize: 11, color: textTokens.tertiary, fontWeight: '500' }}>
                        {progress}/{goal} {challenge.type === 'focus_time' ? 'min' : challenge.type === 'tasks_completed' ? 'tasks' : ''}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: pct >= 100 ? semantic.success : brand.primary }}>{Math.round(pct)}%</Text>
                    </View>
                  </>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Ionicons name="arrow-forward-circle" size={14} color={'#10B981'} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#10B981' }}>Tap to view details & join</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }) : (
          <View style={{ alignItems: 'center', paddingVertical: 44 }}>
            <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: semantic.warningLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Ionicons name="trophy-outline" size={30} color={semantic.warning} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: textTokens.primary }}>No challenges yet</Text>
            <Text style={{ fontSize: 14, color: textTokens.tertiary, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={brand.primary} />} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={{ backgroundColor: bg.card, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: borderTokens.primary }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: textTokens.primary, marginBottom: 14 }}>Circle Stats</Text>
          <View style={{ flexDirection: 'row' }}>
            {[{ val: members.length, label: 'Members', icon: 'people', color: brand.primary }, { val: activeChallenges.length, label: 'Active', icon: 'flame', color: semantic.warning }, { val: weekPosts, label: 'This Week', icon: 'chatbubbles', color: semantic.success }].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={{ width: 1, backgroundColor: borderTokens.primary, marginVertical: 4 }} />}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Ionicons name={s.icon as any} size={16} color={s.color} style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: 22, fontWeight: '800', color: s.color }}>{s.val}</Text>
                  <Text style={{ fontSize: 10, color: textTokens.tertiary, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
        {circle?.description ? (
          <View style={{ backgroundColor: bg.card, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: borderTokens.primary }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textTokens.primary, marginBottom: 8 }}>About</Text>
            <Text style={{ fontSize: 14, color: textTokens.secondary, lineHeight: 20 }}>{circle.description}</Text>
          </View>
        ) : null}
        {activeChallenges.length > 0 && (
          <View style={{ backgroundColor: bg.card, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: borderTokens.primary }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: textTokens.primary }}>Active Challenges</Text>
              <TouchableOpacity onPress={() => setActiveTab('challenges')}><Text style={{ fontSize: 12, fontWeight: '600', color: brand.primary }}>See All</Text></TouchableOpacity>
            </View>
            {activeChallenges.slice(0, 3).map((ch: any) => {
              const p = Math.min(((ch.userProgress || 0) / (ch.goal_value || 1)) * 100, 100);
              return (
                <TouchableOpacity key={ch.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }} onPress={() => onOpenChallenge?.(ch.id)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 18, marginRight: 10 }}>{ch.emoji || '🏆'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: textTokens.primary }}>{ch.title}</Text>
                    <View style={{ height: 4, backgroundColor: borderTokens.primary, borderRadius: 2, overflow: 'hidden', marginTop: 5 }}>
                      <View style={{ height: '100%', width: `${p}%`, backgroundColor: p >= 100 ? semantic.success : brand.primary, borderRadius: 2 }} />
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: textTokens.tertiary, marginLeft: 10 }}>{Math.round(p)}%</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>
    );
  };

  /* ══ SETTINGS MODAL (unified) ═════════════════════════ */
  const renderSettingsModal = () => {
    const { membersCheckedIn: mcList } = accountability;
    const checkinMap = new Map(mcList.map(m => [m.user_id, m]));
    const isOwner = myRole === 'owner';
    const code = circle?.invite_code || circle?.id?.substring(0, 8) || '';
    const sorted = [...members].sort((a, b) => {
      const ro: Record<string, number> = { owner: 0, admin: 1, member: 2 };
      return (ro[a.role] ?? 3) - (ro[b.role] ?? 3);
    });

    return (
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => { setShowSettings(false); setIsEditingCircle(false); }}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.60)' }} onPress={() => { setShowSettings(false); setIsEditingCircle(false); }} />
          <View style={{ height: SH * 0.82, backgroundColor: bg.primary, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16 }}>
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: textTokens.disabled }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: textTokens.primary }}>Circle Settings</Text>
              <TouchableOpacity onPress={() => { setShowSettings(false); setIsEditingCircle(false); }} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: bg.secondary, alignItems: 'center', justifyContent: 'center' }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={16} color={textTokens.tertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

              {/* ── Section 1: Circle Details ───────────────────── */}
              <View style={{ marginTop: 18 }}>
                {!isEditingCircle ? (
                  <View style={{ backgroundColor: bg.card, borderRadius: 18, padding: 18, borderWidth: 0.5, borderColor: borderTokens.primary }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: brand.muted, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        <Text style={{ fontSize: 26 }}>{circle?.emoji || '👥'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: textTokens.primary }}>{circle?.name}</Text>
                        {circle?.description ? (
                          <Text numberOfLines={2} style={{ fontSize: 13, color: textTokens.tertiary, marginTop: 3, lineHeight: 18 }}>{circle.description}</Text>
                        ) : (
                          <Text style={{ fontSize: 13, color: textTokens.disabled, marginTop: 3, fontStyle: 'italic' }}>No description</Text>
                        )}
                      </View>
                      {isOwner && (
                        <TouchableOpacity
                          onPress={() => { setEditName(circle?.name || ''); setEditEmoji(circle?.emoji || '👥'); setEditDescription(circle?.description || ''); setIsEditingCircle(true); }}
                          style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: brand.muted, alignItems: 'center', justifyContent: 'center' }}
                          activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="pencil" size={15} color={brand.primary} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Invite code row */}
                    <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: borderTokens.primary }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 }}>Invite Code</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: bg.secondary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 0.5, borderColor: copiedCode ? `${semantic.success}40` : borderTokens.primary }}>
                          <Text style={{ fontSize: 18, fontWeight: '800', color: textTokens.primary, letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{code.toUpperCase()}</Text>
                        </View>
                        <TouchableOpacity onPress={handleCopyCode} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: brand.primary, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.85}>
                          <Ionicons name={copiedCode ? "checkmark" : "copy"} size={18} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleShare} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: bg.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: borderTokens.primary }} activeOpacity={0.85}>
                          <Ionicons name="share-outline" size={18} color={brand.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  /* Edit mode */
                  <View style={{ backgroundColor: bg.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: brand.primary }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: textTokens.primary, marginBottom: 14 }}>Edit Circle</Text>
                    {/* Emoji picker row */}
                    <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.secondary, marginBottom: 6 }}>Emoji</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
                      {['👥', '🏋️', '📚', '💻', '🎯', '🧘', '🏃', '🎨', '🎵', '💰', '🌱', '❤️'].map((em) => (
                        <TouchableOpacity
                          key={em}
                          onPress={() => setEditEmoji(em)}
                          style={{
                            width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                            backgroundColor: editEmoji === em ? brand.muted : bg.secondary,
                            borderWidth: editEmoji === em ? 1.5 : 0.5,
                            borderColor: editEmoji === em ? brand.primary : borderTokens.primary,
                          }}
                        >
                          <Text style={{ fontSize: 20 }}>{em}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    {/* Name input */}
                    <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.secondary, marginBottom: 6 }}>Name</Text>
                    <TextInput
                      value={editName}
                      onChangeText={(t) => setEditName(t.slice(0, 30))}
                      placeholder="Circle name"
                      placeholderTextColor={textTokens.disabled}
                      style={{
                        fontSize: 16, fontWeight: '600', color: textTokens.primary,
                        backgroundColor: bg.secondary, borderRadius: 10, padding: 12,
                        borderWidth: 0.5, borderColor: borderTokens.primary, marginBottom: 14,
                      }}
                      autoFocus
                      returnKeyType="done"
                      maxLength={30}
                    />
                    {/* Description input */}
                    <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.secondary, marginBottom: 6 }}>Description</Text>
                    <TextInput
                      value={editDescription}
                      onChangeText={(t) => setEditDescription(t.slice(0, 100))}
                      placeholder="Optional description"
                      placeholderTextColor={textTokens.disabled}
                      multiline
                      style={{
                        fontSize: 14, color: textTokens.primary,
                        backgroundColor: bg.secondary, borderRadius: 10, padding: 12,
                        borderWidth: 0.5, borderColor: borderTokens.primary, marginBottom: 16,
                        minHeight: 60, textAlignVertical: 'top',
                      }}
                      maxLength={100}
                    />
                    {/* Save / Cancel buttons */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: bg.secondary, borderWidth: 0.5, borderColor: borderTokens.primary }}
                        onPress={() => setIsEditingCircle(false)}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: textTokens.secondary }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: brand.primary, opacity: editName.trim().length < 2 || isSavingEdit ? 0.5 : 1 }}
                        disabled={editName.trim().length < 2 || isSavingEdit}
                        onPress={async () => {
                          if (!circleId || editName.trim().length < 2) return;
                          setIsSavingEdit(true);
                          const ok = await updateCircle(circleId, {
                            name: editName.trim(),
                            emoji: editEmoji,
                            description: editDescription.trim() || null as any,
                          });
                          setIsSavingEdit(false);
                          if (ok) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            setIsEditingCircle(false);
                            loadCircleData();
                          } else {
                            Alert.alert('Error', 'Could not update circle.');
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{isSavingEdit ? 'Saving…' : 'Save'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* ── Section 2: Members ──────────────────────────── */}
              <View style={{ marginTop: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: textTokens.primary }}>Members</Text>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: textTokens.tertiary }}>{members.length} member{members.length !== 1 ? 's' : ''} · {accountability.todayCheckinCount} in</Text>
                </View>
                {sorted.map(item => {
                  const isMe = item.id === user?.id;
                  const canManage = (myRole === 'owner') || (myRole === 'admin' && item.role === 'member');
                  const showAct = canManage && !isMe;
                  const ms = checkinMap.get(item.id);
                  const isIn = ms?.checked_in || false;
                  const isOut = ms?.checked_out || false;
                  return (
                    <TouchableOpacity key={item.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: bg.card, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 0.5, borderColor: isMe ? `${brand.primary}20` : borderTokens.primary }}
                      onPress={() => showAct && handleMemberAction(item)} activeOpacity={showAct ? 0.7 : 1} disabled={!showAct}>
                      <View style={{ position: 'relative' }}>
                        {item.avatar_url ? (
                          <Image source={{ uri: item.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
                        ) : (
                          <View style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: item.role === 'owner' ? semantic.warningLight : item.role === 'admin' ? brand.muted : bg.primary, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: item.role === 'owner' ? semantic.warning : item.role === 'admin' ? brand.primary : textTokens.tertiary }}>{item.display_name?.[0]?.toUpperCase() || '?'}</Text>
                          </View>
                        )}
                        {isIn && (
                          <View style={{ position: 'absolute', bottom: -2, right: 8, width: 16, height: 16, borderRadius: 8, backgroundColor: isOut ? semantic.success : semantic.warning, borderWidth: 2, borderColor: bg.card, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name={isOut ? "checkmark" : "time"} size={8} color="#fff" />
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: textTokens.primary }}>{item.display_name || 'User'}</Text>
                          {isMe && <View style={{ backgroundColor: brand.muted, paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 }}><Text style={{ fontSize: 10, fontWeight: '700', color: brand.primary }}>YOU</Text></View>}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: item.role === 'owner' ? semantic.warningLight : item.role === 'admin' ? brand.muted : bg.primary, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                            {ROLE_ICONS[item.role] ? <Text style={{ fontSize: 9 }}>{ROLE_ICONS[item.role]}</Text> : null}
                            <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'capitalize', color: ROLE_COLORS[item.role] || textTokens.tertiary }}>{item.role}</Text>
                          </View>
                          {isIn ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: isOut ? semantic.successLight : semantic.warningLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ fontSize: 9 }}>{isOut ? '✅' : '🟡'}</Text>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: isOut ? semantic.success : semantic.warning }}>{isOut ? 'Done' : 'Checked in'}</Text>
                            </View>
                          ) : (
                            <View style={{ backgroundColor: `${textTokens.disabled}20`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ fontSize: 10, fontWeight: '600', color: textTokens.disabled }}>Not yet</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {showAct && (
                        <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: bg.primary, alignItems: 'center', justifyContent: 'center' }}
                          onPress={() => handleMemberAction(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                          <Ionicons name="ellipsis-horizontal" size={16} color={textTokens.tertiary} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Section 3: Danger Zone ─────────────────────── */}
              <View style={{ marginTop: 28 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: semantic.error, marginBottom: 12 }}>Danger Zone</Text>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: bg.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 0.5, borderColor: borderTokens.primary }}
                  onPress={handleLeaveCircle} activeOpacity={0.7}>
                  <Ionicons name="log-out-outline" size={20} color={semantic.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: textTokens.primary }}>{isOwner ? 'Transfer & Leave' : 'Leave Circle'}</Text>
                    <Text style={{ fontSize: 12, color: textTokens.tertiary, marginTop: 2 }}>{isOwner ? 'Transfer ownership before leaving' : 'You can rejoin with the invite code'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={textTokens.disabled} />
                </TouchableOpacity>
                {isOwner && (
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: semantic.errorLight, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: `${semantic.error}20` }}
                    onPress={handleDeleteCircle} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={20} color={semantic.error} />
                    <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: '600', color: semantic.error }}>Delete Circle</Text><Text style={{ fontSize: 12, color: textTokens.tertiary, marginTop: 2 }}>Cannot be undone</Text></View>
                    <Ionicons name="chevron-forward" size={16} color={textTokens.disabled} />
                  </TouchableOpacity>
                )}
              </View>

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
          <Pressable style={{ backgroundColor: bg.card, borderRadius: 24, padding: 28, width: SW * 0.75, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20 }}>
            {previewMember.avatar_url ? (
              <Image source={{ uri: previewMember.avatar_url }} style={{ width: 72, height: 72, borderRadius: 36, marginBottom: 14 }} />
            ) : (
              <View style={{ width: 72, height: 72, borderRadius: 36, marginBottom: 14, backgroundColor: brand.muted, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: brand.primary }}>{previewMember.display_name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
            )}
            <Text style={{ fontSize: 18, fontWeight: '700', color: textTokens.primary }}>{previewMember.display_name || 'User'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
              {ROLE_ICONS[previewMember.role] ? <Text style={{ fontSize: 12 }}>{ROLE_ICONS[previewMember.role]}</Text> : null}
              <Text style={{ fontSize: 13, fontWeight: '600', color: ROLE_COLORS[previewMember.role] || textTokens.tertiary, textTransform: 'capitalize' }}>{previewMember.role}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: isOut ? semantic.successLight : isIn ? semantic.warningLight : bg.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
              <Text style={{ fontSize: 14 }}>{isOut ? '✅' : isIn ? '🟡' : '⏳'}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: isOut ? semantic.success : isIn ? semantic.warning : textTokens.tertiary }}>{isOut ? 'Checked out' : isIn ? 'Checked in' : 'Not checked in'}</Text>
            </View>
            {isIn && ms?.intention && (
              <View style={{ marginTop: 12, backgroundColor: bg.primary, borderRadius: 10, padding: 12, width: '100%' }}>
                <Text style={{ fontSize: 12, color: textTokens.secondary, lineHeight: 17, textAlign: 'center' }}>"{ms.intention}"</Text>
              </View>
            )}
            <TouchableOpacity style={{ marginTop: 18, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12, backgroundColor: bg.primary }}
              onPress={() => setShowMemberPreview(false)} activeOpacity={0.7}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: textTokens.tertiary }}>Close</Text>
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
      <SafeAreaView style={{ flex: 1, backgroundColor: bg.primary }} edges={['top', 'bottom']}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={brand.primary} /></View>
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
