import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Alert,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { circlesApi } from '../../../services/api';
import {
  Users,
  Plus,
  Flame,
  Search,
  X,
  Check,
  ChevronRight,
  Bell,
  UserPlus,
  Trash2,
  Settings,
  Copy,
  Share2,
  Lock,
  Globe,
  Sparkles,
  MessageCircle,
  Target,
  Clock,
  TrendingUp,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

interface CircleMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name?: string;
    username?: string;
    avatarUrl?: string;
  };
  role: string;
  xpContributed: number;
}

interface Circle {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  color: string;
  ownerId: string;
  isPrivate: boolean;
  inviteCode: string;
  memberCount: number;
  members: CircleMember[];
  currentStreak?: number;
  totalXp?: number;
  lastActivityAt?: string;
  activeChallenge?: {
    id: string;
    title: string;
    participantCount: number;
  } | null;
  recentPost?: {
    id: string;
    content?: string;
    createdAt: string;
    user: { name?: string };
  } | null;
  unreadCount?: number;
}

interface CirclesScreenProps {
  onModalStateChange?: (isOpen: boolean) => void;
  navigation?: any;
}

// ============================================
// SKELETON LOADING COMPONENT
// ============================================

const SkeletonCard = ({ index }: { index: number }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonSubtitle} />
        </View>
      </View>
      <View style={styles.skeletonMeta} />
    </Animated.View>
  );
};

// ============================================
// MEMBER AVATAR STACK COMPONENT
// ============================================

const MemberAvatarStack = ({ members, maxShow = 4 }: { members: CircleMember[]; maxShow?: number }) => {
  const displayMembers = members.slice(0, maxShow);
  const overflow = members.length - maxShow;

  return (
    <View style={styles.avatarStack}>
      {displayMembers.map((member, index) => (
        <View
          key={member.id || index}
          style={[
            styles.avatarItem,
            { marginLeft: index > 0 ? -10 : 0, zIndex: maxShow - index },
          ]}
        >
          {member.user?.avatarUrl ? (
            <Image source={{ uri: member.user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.avatarPlaceholder}
            >
              <Text style={styles.avatarInitial}>
                {(member.user?.name || member.user?.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
        </View>
      ))}
      {overflow > 0 && (
        <View style={[styles.avatarItem, styles.avatarOverflow, { marginLeft: -10 }]}>
          <Text style={styles.avatarOverflowText}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
};

// ============================================
// CIRCLE CARD COMPONENT
// ============================================

const CircleCard = ({
  circle,
  onPress,
  onLongPress,
  isHighlighted,
}: {
  circle: Circle;
  onPress: () => void;
  onLongPress: () => void;
  isHighlighted?: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const memberText = circle.memberCount === 1 ? '1 member' : `${circle.memberCount} members`;
  const hasStreak = (circle.currentStreak || 0) > 0;
  const hasUnread = (circle.unreadCount || 0) > 0;

  // Format last activity
  const getLastActivity = () => {
    if (!circle.lastActivityAt) return null;
    const date = new Date(circle.lastActivityAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const lastActivity = getLastActivity();

  // Safe haptics wrapper
  const triggerHaptic = (type: 'light' | 'medium') => {
    try {
      if (type === 'light') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (e) {
      // Haptics not available
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={() => {
          triggerHaptic('light');
          onPress();
        }}
        onLongPress={() => {
          triggerHaptic('medium');
          onLongPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.circleCard,
          isHighlighted && styles.circleCardHighlight,
        ]}
      >
        {/* Unread indicator */}
        {hasUnread && <View style={styles.unreadDot} />}

        <View style={styles.cardContent}>
          {/* Left: Emoji Avatar */}
          <View style={[styles.emojiContainer, { backgroundColor: circle.color + '20' }]}>
            <Text style={styles.emojiText}>{circle.emoji}</Text>
            {circle.isPrivate && (
              <View style={styles.lockBadge}>
                <Lock color="#64748b" size={10} />
              </View>
            )}
          </View>

          {/* Center: Info */}
          <View style={styles.cardInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.circleName} numberOfLines={1}>
                {circle.name}
              </Text>
              {hasStreak && (
                <View style={styles.streakBadge}>
                  <Flame color="#f97316" size={12} />
                  <Text style={styles.streakText}>{circle.currentStreak}</Text>
                </View>
              )}
            </View>

            {circle.description ? (
              <Text style={styles.circleDescription} numberOfLines={1}>
                {circle.description}
              </Text>
            ) : (
              <Text style={styles.circleMeta}>
                {memberText}
                {lastActivity && <Text style={styles.metaDot}> • </Text>}
                {lastActivity && <Text style={styles.lastActivity}>{lastActivity}</Text>}
              </Text>
            )}

            {/* Activity Preview */}
            {circle.activeChallenge && (
              <View style={styles.activityPreview}>
                <Target color="#8b5cf6" size={12} />
                <Text style={styles.activityText} numberOfLines={1}>
                  {circle.activeChallenge.title}
                </Text>
              </View>
            )}
            {!circle.activeChallenge && circle.recentPost && (
              <View style={styles.activityPreview}>
                <MessageCircle color="#64748b" size={12} />
                <Text style={styles.activityText} numberOfLines={1}>
                  {circle.recentPost.user?.name || 'Someone'}: {circle.recentPost.content || 'Shared an update'}
                </Text>
              </View>
            )}
          </View>

          {/* Right: Members & Arrow */}
          <View style={styles.cardRight}>
            {circle.members && circle.members.length > 0 && (
              <MemberAvatarStack members={circle.members} maxShow={3} />
            )}
            <ChevronRight color="#cbd5e1" size={20} style={styles.chevron} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ============================================
// MAIN SCREEN
// ============================================

export function CirclesScreen({ onModalStateChange, navigation }: CirclesScreenProps) {
  // State
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChip, setFilterChip] = useState<'all' | 'active' | 'private'>('all');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [actionSheetCircle, setActionSheetCircle] = useState<Circle | null>(null);
  const [justJoinedId, setJustJoinedId] = useState<string | null>(null);
  const [editingCircle, setEditingCircle] = useState<Circle | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEmoji, setNewEmoji] = useState('👥');
  const [newColor, setNewColor] = useState('#8B5CF6');
  const [newPrivacy, setNewPrivacy] = useState<'public' | 'private'>('public');
  const [creating, setCreating] = useState(false);

  // Join form state
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joining, setJoining] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEmoji, setEditEmoji] = useState('👥');
  const [editColor, setEditColor] = useState('#8B5CF6');
  const [editing, setEditing] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Safe haptics wrapper
  const triggerHaptic = (type: 'light' | 'selection' | 'success' | 'error') => {
    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'selection':
          Haptics.selectionAsync();
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (e) {
      // Haptics not available
    }
  };

  // Fetch circles on focus
  useFocusEffect(
    useCallback(() => {
      fetchCircles();
    }, [])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Notify parent of modal state
  useEffect(() => {
    const isOpen = createModalOpen || joinModalOpen || editModalOpen || actionSheetCircle !== null;
    onModalStateChange?.(isOpen);
  }, [createModalOpen, joinModalOpen, editModalOpen, actionSheetCircle, onModalStateChange]);

  const fetchCircles = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else if (circles.length === 0) {
      setLoading(true);
    }

    try {
      const response = await circlesApi.list();
      if (response.success && response.data) {
        const mapped: Circle[] = response.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          emoji: c.emoji || '👥',
          color: c.color || '#8B5CF6',
          ownerId: c.ownerId,
          isPrivate: c.isPrivate || false,
          inviteCode: c.inviteCode,
          memberCount: c._count?.members || c.members?.length || 1,
          members: (c.members || []).slice(0, 5).map((m: any) => ({
            id: m.id || m.userId,
            userId: m.userId,
            user: {
              id: m.user?.id || m.userId,
              name: m.user?.name,
              username: m.user?.username,
              avatarUrl: m.user?.avatarUrl,
            },
            role: m.role || 'MEMBER',
            xpContributed: m.xpContributed || 0,
          })),
          currentStreak: c.currentStreak || 0,
          totalXp: c.totalXp || 0,
          lastActivityAt: c.updatedAt || c.createdAt,
          activeChallenge: c.activeChallenge || null,
          recentPost: c.recentPost || null,
          unreadCount: c.unreadCount || 0,
        }));
        setCircles(mapped);
      }
    } catch (error) {
      console.error('[Circles] Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    triggerHaptic('light');
    fetchCircles(true);
  };

  // Navigation
  const openCircle = (circle: Circle) => {
    if (!navigation) return;
    const parentNav = navigation.getParent?.();
    const rootNav = parentNav?.getParent?.() || parentNav || navigation;
    rootNav.navigate('CircleHome', {
      circleId: circle.id,
      circleName: circle.name,
      inviteCode: circle.inviteCode,
    });
  };

  // Create circle
  const handleCreateCircle = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a circle name');
      return;
    }

    setCreating(true);
    try {
      const response = await circlesApi.create({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        emoji: newEmoji,
        color: newColor,
        isPrivate: newPrivacy === 'private',
      });

      if (response.success && response.data) {
        triggerHaptic('success');

        // Add to list
        const newCircle: Circle = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description || '',
          emoji: response.data.emoji || '👥',
          color: response.data.color || '#8B5CF6',
          ownerId: response.data.ownerId,
          isPrivate: response.data.isPrivate,
          inviteCode: response.data.inviteCode,
          memberCount: 1,
          members: [],
          currentStreak: 0,
          totalXp: 0,
        };

        setCircles(prev => [newCircle, ...prev]);
        setJustJoinedId(newCircle.id);
        setTimeout(() => setJustJoinedId(null), 3000);

        // Reset form
        setNewName('');
        setNewDescription('');
        setNewEmoji('👥');
        setNewColor('#8B5CF6');
        setNewPrivacy('public');
        setCreateModalOpen(false);

        // Navigate to circle
        setTimeout(() => openCircle(newCircle), 300);
      } else {
        Alert.alert('Error', response.error || 'Failed to create circle');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Join circle
  const handleJoinCircle = async () => {
    if (!joinCode.trim()) return;

    setJoining(true);
    setJoinError('');

    try {
      const code = joinCode.trim().toUpperCase();
      const response = await circlesApi.joinByCode(code);

      if (response.success && response.data) {
        triggerHaptic('success');
        setJoinSuccess(true);

        // Add to list
        const joined: Circle = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description || '',
          emoji: response.data.emoji || '👥',
          color: response.data.color || '#8B5CF6',
          ownerId: response.data.ownerId,
          isPrivate: response.data.isPrivate,
          inviteCode: response.data.inviteCode,
          memberCount: response.data._count?.members || 1,
          members: (response.data.members || []).slice(0, 5),
          currentStreak: response.data.currentStreak || 0,
        };

        const exists = circles.find(c => c.id === joined.id);
        if (!exists) {
          setCircles(prev => [joined, ...prev]);
        }

        setJustJoinedId(joined.id);

        setTimeout(() => {
          setJoinSuccess(false);
          setJoinModalOpen(false);
          setJoinCode('');
          setJustJoinedId(null);
        }, 1500);
      } else {
        setJoinError(response.error || 'Invalid invite code');
        triggerHaptic('error');
      }
    } catch (error) {
      setJoinError('Something went wrong. Please try again.');
      triggerHaptic('error');
    } finally {
      setJoining(false);
    }
  };

  // Leave circle
  const handleLeaveCircle = async (circle: Circle) => {
    Alert.alert(
      'Leave Circle',
      `Are you sure you want to leave "${circle.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await circlesApi.leave(circle.id);
              if (response.success) {
                triggerHaptic('success');
                setCircles(prev => prev.filter(c => c.id !== circle.id));
                setActionSheetCircle(null);
              } else {
                Alert.alert('Error', response.error || 'Failed to leave circle');
              }
            } catch (error) {
              Alert.alert('Error', 'Something went wrong');
            }
          },
        },
      ]
    );
  };

  // Copy invite code
  const handleCopyCode = async (circle: Circle) => {
    try {
      // Note: In production, use Clipboard.setStringAsync from expo-clipboard
      Alert.alert('Invite Code', `Share this code with friends:\n\n${circle.inviteCode}`);
      triggerHaptic('success');
      setActionSheetCircle(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code');
    }
  };

  // Open edit modal
  const handleOpenEdit = (circle: Circle) => {
    setEditingCircle(circle);
    setEditName(circle.name);
    setEditDescription(circle.description || '');
    setEditEmoji(circle.emoji);
    setEditColor(circle.color);
    setActionSheetCircle(null);
    setEditModalOpen(true);
  };

  // Save circle edits
  const handleSaveEdit = async () => {
    if (!editingCircle || !editName.trim()) return;

    setEditing(true);
    try {
      const response = await circlesApi.update(editingCircle.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        emoji: editEmoji,
        color: editColor,
      });

      if (response.success) {
        triggerHaptic('success');
        // Update in local state
        setCircles(prev => prev.map(c => 
          c.id === editingCircle.id 
            ? { ...c, name: editName.trim(), description: editDescription.trim(), emoji: editEmoji, color: editColor }
            : c
        ));
        setEditModalOpen(false);
        setEditingCircle(null);
      } else {
        Alert.alert('Error', response.error || 'Failed to update circle');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setEditing(false);
    }
  };

  // Filter circles
  let filteredCircles = [...circles];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredCircles = filteredCircles.filter(
      c => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }

  if (filterChip === 'active') {
    filteredCircles = filteredCircles.filter(c => (c.currentStreak || 0) > 0 || c.activeChallenge);
  } else if (filterChip === 'private') {
    filteredCircles = filteredCircles.filter(c => c.isPrivate);
  }

  // Stats
  const totalStreaks = circles.reduce((sum, c) => sum + (c.currentStreak || 0), 0);
  const totalMembers = circles.reduce((sum, c) => sum + c.memberCount, 0);
  const activeCircles = circles.filter(c => (c.currentStreak || 0) > 0 || c.activeChallenge).length;

  // Emoji picker options
  const emojiOptions = ['👥', '🏃', '📚', '💪', '🎯', '🧘', '💼', '🎨', '🎮', '🍳', '🌱', '⭐'];
  const colorOptions = ['#8B5CF6', '#EC4899', '#F97316', '#10B981', '#3B82F6', '#6366F1', '#EF4444', '#14B8A6'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9', '#e2e8f0']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#8b5cf6"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Circles</Text>
              <Text style={styles.headerSubtitle}>
                {circles.length === 0
                  ? 'Create or join your first circle'
                  : `${circles.length} ${circles.length === 1 ? 'circle' : 'circles'} • ${totalMembers} ${totalMembers === 1 ? 'member' : 'members'}`}
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  setJoinModalOpen(true);
                }}
                style={({ pressed }) => [styles.joinButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  setCreateModalOpen(true);
                }}
                style={({ pressed }) => [styles.createButton, pressed && styles.buttonPressed]}
              >
                <Plus color="#fff" size={20} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          {/* Stats Bar - Only show if there's something meaningful */}
          {circles.length > 0 && (
            <View style={styles.statsBar}>
              {totalStreaks > 0 ? (
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                    <Flame color="#f59e0b" size={16} />
                  </View>
                  <View>
                    <Text style={styles.statValue}>{totalStreaks}</Text>
                    <Text style={styles.statLabel}>{totalStreaks === 1 ? 'Streak' : 'Streaks'}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#f0fdf4' }]}>
                    <Sparkles color="#22c55e" size={16} />
                  </View>
                  <View>
                    <Text style={styles.statValue}>{circles.length}</Text>
                    <Text style={styles.statLabel}>{circles.length === 1 ? 'Circle' : 'Circles'}</Text>
                  </View>
                </View>
              )}

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                  <Users color="#3b82f6" size={16} />
                </View>
                <View>
                  <Text style={styles.statValue}>{totalMembers}</Text>
                  <Text style={styles.statLabel}>{totalMembers === 1 ? 'Member' : 'Members'}</Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              {activeCircles > 0 ? (
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                    <TrendingUp color="#22c55e" size={16} />
                  </View>
                  <View>
                    <Text style={styles.statValue}>{activeCircles}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                    <Target color="#f59e0b" size={16} />
                  </View>
                  <View>
                    <Text style={styles.statValue}>Ready</Text>
                    <Text style={styles.statLabel}>to go!</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Search & Filter */}
          {circles.length > 0 && (
            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <Search color="#94a3b8" size={18} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search circles..."
                  placeholderTextColor="#94a3b8"
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                    <X color="#94a3b8" size={18} />
                  </Pressable>
                )}
              </View>

              <View style={styles.filterRow}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'private', label: 'Private' },
                ].map(tab => (
                  <Pressable
                    key={tab.id}
                    onPress={() => {
                      triggerHaptic('selection');
                      setFilterChip(tab.id as any);
                    }}
                    style={[
                      styles.filterChip,
                      filterChip === tab.id && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filterChip === tab.id && styles.filterChipTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Circle List */}
          <View style={styles.listSection}>
            {loading ? (
              // Skeleton loading
              <>
                <SkeletonCard index={0} />
                <SkeletonCard index={1} />
                <SkeletonCard index={2} />
              </>
            ) : filteredCircles.length === 0 ? (
              // Empty state
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Users color="#94a3b8" size={40} />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No circles found' : 'No circles yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Create a circle to start collaborating with friends, family, or colleagues.'}
                </Text>
                {!searchQuery && (
                  <Pressable
                    onPress={() => setCreateModalOpen(true)}
                    style={({ pressed }) => [styles.emptyButton, pressed && styles.buttonPressed]}
                  >
                    <Plus color="#fff" size={18} />
                    <Text style={styles.emptyButtonText}>Create Circle</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              // Circle cards
              <Animated.View style={{ opacity: fadeAnim }}>
                {filteredCircles.map((circle, index) => (
                  <CircleCard
                    key={circle.id}
                    circle={circle}
                    onPress={() => openCircle(circle)}
                    onLongPress={() => setActionSheetCircle(circle)}
                    isHighlighted={justJoinedId === circle.id}
                  />
                ))}
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* ============================================
          ACTION SHEET MODAL
          ============================================ */}
      <Modal
        visible={actionSheetCircle !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActionSheetCircle(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setActionSheetCircle(null)}
          />
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />

            {actionSheetCircle && (
              <>
                {/* Circle header in sheet */}
                <View style={styles.sheetHeader}>
                  <View style={[styles.sheetEmoji, { backgroundColor: actionSheetCircle.color + '20' }]}>
                    <Text style={{ fontSize: 24 }}>{actionSheetCircle.emoji}</Text>
                  </View>
                  <View style={styles.sheetHeaderText}>
                    <Text style={styles.sheetTitle}>{actionSheetCircle.name}</Text>
                    <Text style={styles.sheetSubtitle}>
                      {actionSheetCircle.memberCount} {actionSheetCircle.memberCount === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
                </View>

                <View style={styles.sheetDivider} />

                {/* Actions */}
                <Pressable
                  onPress={() => {
                    openCircle(actionSheetCircle);
                    setActionSheetCircle(null);
                  }}
                  style={({ pressed }) => [styles.sheetAction, pressed && styles.sheetActionPressed]}
                >
                  <View style={[styles.sheetActionIcon, { backgroundColor: '#ede9fe' }]}>
                    <ChevronRight color="#8b5cf6" size={20} />
                  </View>
                  <Text style={styles.sheetActionText}>Open Circle</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleOpenEdit(actionSheetCircle)}
                  style={({ pressed }) => [styles.sheetAction, pressed && styles.sheetActionPressed]}
                >
                  <View style={[styles.sheetActionIcon, { backgroundColor: '#fef3c7' }]}>
                    <Settings color="#f59e0b" size={20} />
                  </View>
                  <Text style={styles.sheetActionText}>Edit Circle</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleCopyCode(actionSheetCircle)}
                  style={({ pressed }) => [styles.sheetAction, pressed && styles.sheetActionPressed]}
                >
                  <View style={[styles.sheetActionIcon, { backgroundColor: '#dbeafe' }]}>
                    <Copy color="#3b82f6" size={20} />
                  </View>
                  <Text style={styles.sheetActionText}>Copy Invite Code</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleLeaveCircle(actionSheetCircle)}
                  style={({ pressed }) => [styles.sheetAction, styles.sheetActionDanger, pressed && styles.sheetActionPressed]}
                >
                  <View style={[styles.sheetActionIcon, { backgroundColor: '#fee2e2' }]}>
                    <Trash2 color="#ef4444" size={20} />
                  </View>
                  <Text style={[styles.sheetActionText, { color: '#ef4444' }]}>Leave Circle</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ============================================
          CREATE MODAL
          ============================================ */}
      <Modal
        visible={createModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setCreateModalOpen(false)}
          />
          <View style={styles.createModal}>
            <View style={styles.actionSheetHandle} />

            <Text style={styles.modalTitle}>Create Circle</Text>

            {/* Emoji & Color Selection */}
            <View style={styles.emojiColorRow}>
              <Pressable
                style={[styles.emojiPreview, { backgroundColor: newColor + '20' }]}
              >
                <Text style={{ fontSize: 32 }}>{newEmoji}</Text>
              </Pressable>
              <View style={styles.emojiColorPickers}>
                <Text style={styles.pickerLabel}>Emoji</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                  {emojiOptions.map(emoji => (
                    <Pressable
                      key={emoji}
                      onPress={() => setNewEmoji(emoji)}
                      style={[
                        styles.emojiOption,
                        newEmoji === emoji && styles.emojiOptionSelected,
                      ]}
                    >
                      <Text style={{ fontSize: 20 }}>{emoji}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={[styles.pickerLabel, { marginTop: 12 }]}>Color</Text>
                <View style={styles.colorRow}>
                  {colorOptions.map(color => (
                    <Pressable
                      key={color}
                      onPress={() => setNewColor(color)}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newColor === color && styles.colorOptionSelected,
                      ]}
                    >
                      {newColor === color && <Check color="#fff" size={14} />}
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Name Input */}
            <Text style={styles.inputLabel}>Circle Name</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Morning Runners"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              maxLength={30}
            />

            {/* Description Input */}
            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="What's this circle about?"
              placeholderTextColor="#94a3b8"
              style={[styles.input, styles.inputMultiline]}
              multiline
              maxLength={100}
            />

            {/* Privacy Toggle */}
            <Text style={styles.inputLabel}>Privacy</Text>
            <View style={styles.privacyRow}>
              <Pressable
                onPress={() => setNewPrivacy('public')}
                style={[styles.privacyOption, newPrivacy === 'public' && styles.privacyOptionActive]}
              >
                <Globe color={newPrivacy === 'public' ? '#fff' : '#64748b'} size={18} />
                <Text style={[styles.privacyOptionText, newPrivacy === 'public' && styles.privacyOptionTextActive]}>
                  Public
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setNewPrivacy('private')}
                style={[styles.privacyOption, newPrivacy === 'private' && styles.privacyOptionActive]}
              >
                <Lock color={newPrivacy === 'private' ? '#fff' : '#64748b'} size={18} />
                <Text style={[styles.privacyOptionText, newPrivacy === 'private' && styles.privacyOptionTextActive]}>
                  Private
                </Text>
              </Pressable>
            </View>

            {/* Create Button */}
            <Pressable
              onPress={handleCreateCircle}
              disabled={!newName.trim() || creating}
              style={({ pressed }) => [
                styles.submitButton,
                (!newName.trim() || creating) && styles.submitButtonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              {creating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Create Circle</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ============================================
          JOIN MODAL
          ============================================ */}
      <Modal
        visible={joinModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setJoinModalOpen(false);
          setJoinCode('');
          setJoinError('');
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              setJoinModalOpen(false);
              setJoinCode('');
              setJoinError('');
            }}
          />
          <View style={styles.joinModal}>
            <View style={styles.actionSheetHandle} />

            {joinSuccess ? (
              <View style={styles.successState}>
                <View style={styles.successIcon}>
                  <Check color="#22c55e" size={32} />
                </View>
                <Text style={styles.successTitle}>You're in!</Text>
                <Text style={styles.successSubtitle}>Successfully joined the circle</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>Join Circle</Text>
                <Text style={styles.modalSubtitle}>Enter the invite code shared with you</Text>

                <TextInput
                  value={joinCode}
                  onChangeText={text => {
                    setJoinCode(text.toUpperCase());
                    setJoinError('');
                  }}
                  placeholder="e.g. ABC123"
                  placeholderTextColor="#94a3b8"
                  style={styles.codeInput}
                  autoCapitalize="characters"
                  maxLength={20}
                />

                {joinError ? <Text style={styles.errorText}>{joinError}</Text> : null}

                <Pressable
                  onPress={handleJoinCircle}
                  disabled={!joinCode.trim() || joining}
                  style={({ pressed }) => [
                    styles.submitButton,
                    (!joinCode.trim() || joining) && styles.submitButtonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  {joining ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Join Circle</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ============================================
          EDIT MODAL
          ============================================ */}
      <Modal
        visible={editModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setEditModalOpen(false);
          setEditingCircle(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              setEditModalOpen(false);
              setEditingCircle(null);
            }}
          />
          <View style={styles.createModal}>
            <View style={styles.actionSheetHandle} />

            <Text style={styles.modalTitle}>Edit Circle</Text>

            {/* Emoji & Color Selection */}
            <View style={styles.emojiColorRow}>
              <Pressable
                style={[styles.emojiPreview, { backgroundColor: editColor + '20' }]}
              >
                <Text style={{ fontSize: 32 }}>{editEmoji}</Text>
              </Pressable>
              <View style={styles.emojiColorPickers}>
                <Text style={styles.pickerLabel}>Emoji</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                  {emojiOptions.map(emoji => (
                    <Pressable
                      key={emoji}
                      onPress={() => setEditEmoji(emoji)}
                      style={[
                        styles.emojiOption,
                        editEmoji === emoji && styles.emojiOptionSelected,
                      ]}
                    >
                      <Text style={{ fontSize: 20 }}>{emoji}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={[styles.pickerLabel, { marginTop: 12 }]}>Color</Text>
                <View style={styles.colorRow}>
                  {colorOptions.map(color => (
                    <Pressable
                      key={color}
                      onPress={() => setEditColor(color)}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        editColor === color && styles.colorOptionSelected,
                      ]}
                    >
                      {editColor === color && <Check color="#fff" size={14} />}
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Name Input */}
            <Text style={styles.inputLabel}>Circle Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Morning Runners"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              maxLength={30}
            />

            {/* Description Input */}
            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="What's this circle about?"
              placeholderTextColor="#94a3b8"
              style={[styles.input, styles.inputMultiline]}
              multiline
              maxLength={100}
            />

            {/* Save Button */}
            <Pressable
              onPress={handleSaveEdit}
              disabled={!editName.trim() || editing}
              style={({ pressed }) => [
                styles.submitButton,
                (!editName.trim() || editing) && styles.submitButtonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              {editing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  joinButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
  },

  // Search Section
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // List Section
  listSection: {
    paddingHorizontal: 16,
  },

  // Circle Card
  circleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  circleCardHighlight: {
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    zIndex: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  emojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emojiText: {
    fontSize: 28,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 3,
  },
  cardInfo: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  circleName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    flexShrink: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
  },
  circleDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  circleMeta: {
    fontSize: 13,
    color: '#94a3b8',
  },
  metaDot: {
    color: '#cbd5e1',
  },
  lastActivity: {
    color: '#94a3b8',
  },
  activityPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  activityText: {
    fontSize: 12,
    color: '#64748b',
    flexShrink: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  chevron: {
    marginTop: 4,
  },

  // Avatar Stack
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarItem: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  avatarOverflow: {
    backgroundColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverflowText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },

  // Skeleton
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    marginRight: 14,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonTitle: {
    height: 18,
    width: '60%',
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
  },
  skeletonSubtitle: {
    height: 14,
    width: '40%',
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
  },
  skeletonMeta: {
    height: 24,
    width: '80%',
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    marginTop: 12,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  // Action Sheet
  actionSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sheetEmoji: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  sheetActionPressed: {
    backgroundColor: '#f8fafc',
  },
  sheetActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  sheetActionDanger: {},

  // Create Modal
  createModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  emojiColorRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  emojiPreview: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  emojiColorPickers: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerScroll: {
    flexGrow: 0,
  },
  emojiOption: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#f8fafc',
  },
  emojiOptionSelected: {
    backgroundColor: '#e2e8f0',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  privacyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  privacyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  privacyOptionActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  privacyOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  privacyOptionTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Join Modal
  joinModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  codeInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Success State
  successState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  successSubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 4,
  },
});

export default CirclesScreen;
