/**
 * CircleHomeScreen - Refactored
 * Main screen for viewing and interacting with a Circle
 * 
 * This component has been refactored from a 6,900+ line file into a modular architecture:
 * - Components: PostCard, AssignmentCard, ChallengeCard, MemberList, CircleActivityCard
 * - Hooks: useCircleData, useCircleActions, useCircleModals, useAssignmentForm, usePostSelection, useChallengeForm
 * - Modals: 11 modal components in the modals/ folder
 * - Styles: Centralized in styles.ts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { circlesApi, assignmentsApi, postsApi, challengesApi, aiApi } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket, useSocketEvent } from '../../../services/socket';
import { colors as Colors } from '../../../styles/colors';

// Import extracted components
import {
  PostCard,
  AssignmentCard,
  ChallengeCard,
  MemberList,
  CircleActivityCard,
} from './components';

// Import extracted hooks
import {
  useCircleData,
  useCircleActions,
  useCircleModals,
  useAssignmentForm,
  usePostSelection,
  useChallengeForm,
} from './hooks';

// Import extracted modals
import {
  ActionMenuModal,
  AssignModal,
  AssignmentOptionsModal,
  InviteModal,
  DeclineModal,
  CreateChallengeModal,
  EditAssignmentModal,
  SubmitProofModal,
  PostOptionsModal,
  EditPostModal,
  MemberOptionsModal,
  MemberDetailModal,
  CircleSettingsModal,
  ShareModal,
  TodayModal,
  MembersModal,
  ViewProofModal,
} from './modals';

// Import styles
import { styles, postSelectionStyles } from './styles';

// Helper functions (inline)
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const formatDueTime = (dateString: string): string => {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${timeStr}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${timeStr}`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
  }
};

const formatTime = (date: Date): string => {
  const h = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${minutes} ${ampm}`;
};

const formatDate = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

const extractChallengeCategory = (description?: string): string | null => {
  if (!description) return null;
  const match = description.match(/Category:\s*([^|\n]+)/i);
  return match?.[1]?.trim() || null;
};

interface CircleHomeScreenProps {
  navigation: any;
  route: any;
}

export default function CircleHomeScreen({ navigation, route }: CircleHomeScreenProps) {
  // Get circle data from route params with fallback
  const { circleId: paramCircleId, circleName: paramCircleName, inviteCode: paramInviteCode, circle } = route?.params || {};
  const circleId = paramCircleId || circle?.id || 'circle-1';
  const circleName = paramCircleName || circle?.name || 'Morning Warriors';
  const circleEmoji = circle?.emoji || '🏃';
  
  const { user } = useAuth();

  const navigateToHomeStack = (screen: string, params?: any) => {
    const parentNav = navigation?.getParent?.();
    const rootNav = parentNav?.getParent?.() || parentNav || navigation;
    rootNav.navigate('MainTabs', { screen: 'Today', params: { screen, params } });
  };

  // Use extracted hooks
  const circleData = useCircleData(circleId, user?.id || '');
  const circleActions = useCircleActions(circleId, user?.id);
  const modals = useCircleModals();
  const assignForm = useAssignmentForm();
  const postSelect = usePostSelection();
  const challengeForm = useChallengeForm();

  // Destructure data from hooks for easier access
  const {
    circleDetails,
    circleMembers,
    posts,
    assignments,
    circleChallenges,
    todayStats,
    userPosted,
    loadingMembers,
    loadingFeed,
    loadingAssignments,
    loadingChallenges,
    refreshing,
    onRefresh,
    fetchCircleDetails,
    fetchCircleMembers,
    fetchFeed,
    fetchAssignments,
    fetchChallenges,
    fetchTodayStats,
    setPosts,
    setUserPosted,
    setCircleMembers,
  } = circleData;

  const { copySuccess } = circleActions;
  const [localCopySuccess, setLocalCopySuccess] = useState<'code' | 'link' | null>(null);

  // Local UI state
  const [circleTab, setCircleTab] = useState('feed');
  const [feedFilter, setFeedFilter] = useState('all');
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(true);
  
  // Selection states
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedAssignmentForProof, setSelectedAssignmentForProof] = useState<any>(null);
  const [selectedAssignmentForView, setSelectedAssignmentForView] = useState<any>(null);
  
  // Circle settings state
  const [editCircleName, setEditCircleName] = useState(circleName);
  const [editCircleEmoji, setEditCircleEmoji] = useState(circleEmoji);
  
  // Decline mission state
  const [declineAssignmentId, setDeclineAssignmentId] = useState<string | null>(null);
  const [declineAssignmentTitle, setDeclineAssignmentTitle] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [decliningInProgress, setDecliningInProgress] = useState(false);
  
  // Proof submission state
  const [proofUrl, setProofUrl] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  
  // Assignment editing state
  const [editingAssignment, setEditingAssignment] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [editDueDay, setEditDueDay] = useState<'today' | 'tomorrow' | 'custom'>('custom');
  const [editCustomDueDate, setEditCustomDueDate] = useState(new Date());
  const [editAssignmentData, setEditAssignmentData] = useState({
    title: '',
    description: '',
    dueDate: null as Date | null,
    dueTime: null as Date | null,
    xpReward: 50,
    repeatEnabled: false,
    repeatFrequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    requireProof: false,
  });
  
  // Circle settings toggles
  const [inviteLinkEnabled, setInviteLinkEnabled] = useState(true);
  const [approveNewMembers, setApproveNewMembers] = useState(false);
  const [allowAssignments, setAllowAssignments] = useState(true);
  
  // Deletion state
  const [deletingSelectedPosts, setDeletingSelectedPosts] = useState(false);
  const [selectedMemberForManage, setSelectedMemberForManage] = useState<any>(null);
  
  // Share state
  const [sharePrivacy, setSharePrivacy] = useState<'metrics' | 'full'>('full');
  const [shareNote, setShareNote] = useState('');
  
  // Loading state
  const [postingDailyCard, setPostingDailyCard] = useState(false);

  // Derived values
  const postedCount = circleMembers.filter((m: any) => m.posted).length + (userPosted ? 1 : 0);
  const totalCount = circleMembers.length + 1;
  const inviteCode = circleDetails?.inviteCode || paramInviteCode || '';
  const inviteLink = inviteCode ? `https://mypa.app/invite/${inviteCode}` : '';

  // Socket connection for real-time updates
  const { connect, joinCircle, leaveCircle } = useSocket();

  useEffect(() => {
    const openModal = route?.params?.openModal;
    if (!openModal) return;
    if (openModal === 'assign') {
      modals.setShowAssignModal(true);
    } else if (openModal === 'invite') {
      modals.setShowInviteSheet(true);
    } else if (openModal === 'settings') {
      modals.setShowCircleSettings(true);
    }
    if (navigation?.setParams) {
      navigation.setParams({ openModal: undefined });
    }
  }, [route?.params?.openModal]);

  useEffect(() => {
    const setupSocket = async () => {
      await connect();
      joinCircle(circleId);
    };
    setupSocket();
    return () => { leaveCircle(circleId); };
  }, [circleId]);

  // Socket event handlers
  useSocketEvent('post:new', (data: any) => {
    if (data.circleId === circleId) fetchFeed();
  }, [circleId]);

  useSocketEvent('post:deleted', (data: any) => {
    if (data.circleId === circleId) {
      setPosts((prev: any) => prev.filter((p: any) => p.id !== data.postId));
    }
  }, [circleId]);

  useSocketEvent('post:reaction', (data: any) => {
    if (data.circleId === circleId) fetchFeed();
  }, [circleId]);

  useSocketEvent('circle:member_joined', (data: any) => {
    if (data.circleId === circleId) fetchCircleMembers();
  }, [circleId]);

  useSocketEvent('circle:member_left', (data: any) => {
    if (data.circleId === circleId) {
      setCircleMembers((prev: any) => prev.filter((m: any) => m.id !== data.userId));
    }
  }, [circleId]);

  useSocketEvent('assignment:created', (data: any) => {
    if (data.circleId === circleId) {
      fetchAssignments();
      fetchFeed();
    }
  }, [circleId]);

  useSocketEvent('assignment:new', (data: any) => {
    if (data.assignment?.circleId === circleId) {
      fetchAssignments();
      Alert.alert('🎯 New Mission!', `You've been assigned: ${data.assignment.title}`, [
        { text: 'View', onPress: () => setCircleTab('challenges') }
      ]);
    }
  }, [circleId]);

  useSocketEvent('assignment:updated', (data: any) => {
    if (data.circleId === circleId) fetchAssignments();
  }, [circleId]);

  useSocketEvent('challenge:created', (data: any) => {
    if (data.circleId === circleId) {
      fetchFeed();
      fetchChallenges();
    }
  }, [circleId]);

  useSocketEvent('challenge:joined', (data: any) => {
    if (data.circleId === circleId) fetchChallenges();
  }, [circleId]);

  useSocketEvent('challenge:completed', (data: any) => {
    if (data.circleId === circleId) {
      fetchFeed();
      fetchChallenges();
    }
  }, [circleId]);

  // Handler functions
  const handleShareToday = () => {
    if (todayStats.total === 0) {
      Alert.alert('No Tasks Today', 'You don\'t have any tasks scheduled for today. Add some tasks first!');
      return;
    }
    modals.setShowShareModal(true);
  };

  const handleNavigateToDailyLifeCard = () => {
    modals.setShowShareModal(false);
    navigateToHomeStack('DailyLifeCard');
  };

  const handleConfirmShare = async () => {
    setPostingDailyCard(true);
    try {
      const response = await circlesApi.createDailyCard(circleId);
      if (response.success) {
        setUserPosted(true);
        await fetchFeed();
        setShareNote('');
        setSharePrivacy('full');
        modals.setShowShareModal(false);
        Alert.alert('🎉 Shared!', 'Your day has been shared with the circle.');
      } else {
        Alert.alert('Error', response.error || 'Failed to share your day');
      }
    } catch (error) {
      console.error('Failed to post daily card:', error);
      Alert.alert('Error', 'Failed to share your day. Please try again.');
    } finally {
      setPostingDailyCard(false);
    }
  };

  const handleShareLink = async () => {
    try {
      if (inviteLink) {
        await Share.share({ message: inviteLink });
        return;
      }
    } catch (error) {
      // Fallback to copy
    }
    await handleCopyInvite(inviteLink, 'link');
    Alert.alert('Link Copied', 'Invite link has been copied to clipboard');
  };

  const handleOpenMemberDetail = (member: any) => {
    setSelectedMemberDetail(member);
    modals.setShowTodayModal(false);
    modals.setShowMemberDetailModal(true);
  };

  const isAssignmentSender = (assignment: any) => user?.id === assignment?.assignedById;
  const isAssignmentRecipient = (assignment: any) => user?.id === assignment?.assignedToId;

  const openSubmitProofModal = (assignment: any) => {
    setSelectedAssignmentForProof(assignment);
    setProofUrl(assignment?.proofUrl || '');
    setProofNote('');
    modals.setShowSubmitProofModal(true);
  };

  const handleAcceptAssignment = async (assignment: any) => {
    modals.setShowAssignmentOptions(false);
    try {
      const response = await assignmentsApi.accept(String(assignment.id));
      if (response.success) {
        Alert.alert('Mission Accepted! 🎯', 'This mission has been added to your tasks.');
        await fetchAssignments();
        await fetchFeed();
      } else {
        Alert.alert('Error', response.error || 'Failed to accept mission');
      }
    } catch (error) {
      console.error('Failed to accept assignment:', error);
      Alert.alert('Error', 'Failed to accept mission');
    }
  };

  const handleDeclineAssignment = (assignment: any) => {
    modals.setShowAssignmentOptions(false);
    setDeclineAssignmentId(assignment.id);
    setDeclineAssignmentTitle(assignment.title);
    setDeclineReason('');
    modals.setShowDeclineModal(true);
  };

  const handleCompleteAssignment = async (assignment: any) => {
    modals.setShowAssignmentOptions(false);
    try {
      const response = await assignmentsApi.complete(String(assignment.id));
      if (response.success) {
        Alert.alert('Mission Completed', 'Great job! 🎉');
        await fetchAssignments();
        await fetchFeed();
      } else {
        Alert.alert('Error', response.error || 'Failed to complete mission');
      }
    } catch (error) {
      console.error('Failed to complete assignment:', error);
      Alert.alert('Error', 'Failed to complete mission');
    }
  };

  const handleViewProof = (assignment: any) => {
    if (!assignment?.proofUrl) {
      Alert.alert('No proof', 'This mission has no proof attached.');
      return;
    }
    setSelectedAssignmentForView(assignment);
    modals.setShowViewProofModal(true);
  };

  const openEditAssignmentModal = (assignment: any) => {
    modals.setShowAssignmentOptions(false);

    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDateDay = new Date(dueDate);
    dueDateDay.setHours(0, 0, 0, 0);

    if (dueDateDay.getTime() === today.getTime()) {
      setEditDueDay('today');
    } else if (dueDateDay.getTime() === tomorrow.getTime()) {
      setEditDueDay('tomorrow');
    } else {
      setEditDueDay('custom');
    }
    setEditCustomDueDate(dueDate);

    setEditAssignmentData({
      title: assignment.title || '',
      description: assignment.description || '',
      dueDate: assignment.dueDate ? new Date(assignment.dueDate) : null,
      dueTime: assignment.dueDate ? new Date(assignment.dueDate) : new Date(),
      xpReward: assignment.xpReward || 50,
      repeatEnabled: assignment.repeatEnabled || false,
      repeatFrequency: assignment.repeatFrequency || 'daily',
      requireProof: assignment.requireProof || false,
    });
    modals.setShowEditAssignmentModal(true);
  };

  const getEditDueSummary = () => {
    const dayLabel = editDueDay === 'today'
      ? 'Today'
      : editDueDay === 'tomorrow'
        ? 'Tomorrow'
        : formatDate(editCustomDueDate);
    const timeStr = editAssignmentData.dueTime ? formatTime(editAssignmentData.dueTime) : '9:00 AM';
    return `Due: ${dayLabel} at ${timeStr}`;
  };

  const handleSaveAssignmentEdit = async () => {
    if (!selectedAssignment) return;

    setEditingAssignment(true);
    try {
      let dueDate = new Date();
      if (editDueDay === 'tomorrow') {
        dueDate.setDate(dueDate.getDate() + 1);
      } else if (editDueDay === 'custom') {
        dueDate = new Date(editCustomDueDate);
      }

      if (editAssignmentData.dueTime) {
        dueDate.setHours(editAssignmentData.dueTime.getHours(), editAssignmentData.dueTime.getMinutes(), 0, 0);
      }

      const response = await assignmentsApi.update(String(selectedAssignment.id), {
        title: editAssignmentData.title,
        description: editAssignmentData.description || null,
        dueDate: dueDate.toISOString(),
        xpReward: editAssignmentData.xpReward,
        repeatEnabled: editAssignmentData.repeatEnabled,
        repeatFrequency: editAssignmentData.repeatEnabled ? editAssignmentData.repeatFrequency : null,
        requireProof: editAssignmentData.requireProof,
      });

      if (response.success) {
        Alert.alert('Success', 'Mission updated! The recipient has been notified.');
        await fetchAssignments();
        await fetchFeed();
        modals.setShowEditAssignmentModal(false);
        setSelectedAssignment(null);
      } else {
        Alert.alert('Error', response.error || 'Failed to update mission');
      }
    } catch (error) {
      console.error('Failed to update assignment:', error);
      Alert.alert('Error', 'Failed to update mission');
    } finally {
      setEditingAssignment(false);
    }
  };

  const handleCopyInvite = async (text: string, type: 'code' | 'link') => {
    try {
      await Clipboard.setStringAsync(text);
      setLocalCopySuccess(type);
      setTimeout(() => setLocalCopySuccess(null), 2000);
    } catch (error) {
      Alert.alert('Copy failed', 'Unable to copy the invite link.');
    }
  };

  const handleLeaveCircle = () => {
    Alert.alert('Leave Circle', `Are you sure you want to leave ${circleName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Leave', 
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await circlesApi.leave(circleId);
            if (response.success) {
              modals.setShowActionMenu(false);
              navigation.goBack();
            } else {
              Alert.alert('Error', response.error || 'Failed to leave circle');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to leave circle. Please try again.');
          }
        }
      }
    ]);
  };

  const handleViewMember = (member: any) => {
    Alert.alert(
      member.name,
      `Role: ${member.role === 'admin' ? 'Admin' : 'Member'}\n${member.posted ? `Last posted: ${member.lastPostTime || 'Recently'}` : 'Has not posted today'}`,
      [{ text: 'OK' }]
    );
  };

  const handleMemberOptions = (member: any) => {
    setSelectedMember(member);
    modals.setShowMemberOptions(true);
  };

  const handleAssignToMember = (member: any) => {
    assignForm.setAssignedMember({ id: member.id, name: member.name, initial: member.initial });
    assignForm.setAssignTo(member.name);
    assignForm.setAssignToId(member.id);
    modals.setShowAssignModal(true);
  };

  const handleChallengePress = (challenge: any) => {
    navigateToHomeStack('Challenges', { focusChallengeId: challenge.id });
  };

  const handleReaction = async (postId: string, reactionType: 'heart' | 'fire' | 'clap') => {
    const emojiMap = { heart: '❤️', fire: '🔥', clap: '👏' };
    const emoji = emojiMap[reactionType];
    const post = posts.find(p => p.id === postId);
    const hasReacted = post?.userReaction === emoji;
    
    try {
      if (hasReacted) {
        const response = await postsApi.removeReaction(postId);
        if (response.success) {
          setPosts(prevPosts => 
            prevPosts.map(p => p.id === postId ? {
              ...p,
              reactions: { ...p.reactions, [reactionType]: Math.max(0, (p.reactions?.[reactionType] || 1) - 1) },
              userReaction: null
            } : p)
          );
        }
      } else {
        const response = await postsApi.react(postId, emoji);
        if (response.success) {
          const oldReactionType = post?.userReaction ? 
            Object.entries(emojiMap).find(([_, e]) => e === post.userReaction)?.[0] as 'heart' | 'fire' | 'clap' | undefined
            : undefined;
          
          setPosts(prevPosts => 
            prevPosts.map(p => {
              if (p.id === postId) {
                const newReactions = { ...p.reactions };
                newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
                if (oldReactionType && oldReactionType !== reactionType) {
                  newReactions[oldReactionType] = Math.max(0, (newReactions[oldReactionType] || 1) - 1);
                }
                return { ...p, reactions: newReactions, userReaction: emoji };
              }
              return p;
            })
          );
        }
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const handlePostOptions = (post: any) => {
    if (postSelect.postSelectionMode) {
      postSelect.togglePostSelection(post.id);
    } else {
      setSelectedPost(post);
      modals.setShowPostOptions(true);
    }
  };

  const handleUnhideAllPosts = () => {
    postSelect.setHiddenPostIds(new Set());
    Alert.alert('Posts Restored', 'All hidden posts are now visible again.');
  };

  // Filter posts based on current filter and hidden posts
  const getFilteredPosts = () => {
    return posts
      .filter(post => !postSelect.hiddenPostIds.has(post.id))
      .filter(post => {
        if (feedFilter === 'all') return true;
        if (feedFilter === 'checkins') return post.type === 'receipt';
        if (feedFilter === 'assignments') return post.type === 'system' && post.isAssignmentRelated;
        return true;
      });
  };

  // Render post card
  const renderPostCard = (post: any) => {
    return (
      <PostCard
        key={post.id}
        post={post}
        isSelected={postSelect.selectedPosts.has(post.id)}
        postSelectionMode={postSelect.postSelectionMode}
        circleMembers={circleMembers}
        onPress={(p) => {
          if (postSelect.postSelectionMode) {
            postSelect.togglePostSelection(p.id);
          } else if (p.type === 'system' && p.isAssignmentRelated) {
            const assignment = assignments.find((a: any) => a.id === p.assignmentId);
            if (assignment) {
              setSelectedAssignment(assignment);
              modals.setShowAssignmentOptions(true);
            }
          }
        }}
        onLongPress={() => handlePostOptions(post)}
        onToggleSelection={(id) => postSelect.togglePostSelection(id)}
        onReaction={(postId, type) => handleReaction(postId, type)}
        onChallengeJoin={() => fetchChallenges()}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Selection Mode Header */}
      {postSelect.postSelectionMode && (
        <View style={postSelectionStyles.header}>
          <TouchableOpacity
            onPress={() => {
              postSelect.setPostSelectionMode(false);
              postSelect.setSelectedPosts(new Set());
            }}
            style={postSelectionStyles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel selection"
            accessibilityHint="Deselect all posts and exit selection mode"
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={postSelectionStyles.headerText}>
            {postSelect.selectedPosts.size} selected
          </Text>
          <View style={postSelectionStyles.headerActions}>
            <TouchableOpacity
              onPress={() => {
                // Delete selected posts logic
                if (postSelect.selectedPosts.size === 0) return;
                Alert.alert(
                  'Delete Posts',
                  `Delete ${postSelect.selectedPosts.size} selected post(s)?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        setDeletingSelectedPosts(true);
                        try {
                          for (const postId of postSelect.selectedPosts) {
                            await postsApi.delete(String(postId));
                          }
                          setPosts(prev => prev.filter(p => !postSelect.selectedPosts.has(p.id)));
                          postSelect.setPostSelectionMode(false);
                          postSelect.setSelectedPosts(new Set());
                        } catch (error) {
                          Alert.alert('Error', 'Failed to delete some posts');
                        } finally {
                          setDeletingSelectedPosts(false);
                        }
                      }
                    }
                  ]
                );
              }}
              style={postSelectionStyles.deleteButton}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${postSelect.selectedPosts.size} selected post(s)`}
              accessibilityHint="Permanently remove selected posts from this circle"
            >
              {deletingSelectedPosts ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="trash-2" size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header */}
      {!postSelect.postSelectionMode && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back to circles list"
              accessibilityHint="Return to previous screen"
            >
              <Feather name="arrow-left" size={24} color={Colors.mutedForeground} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <View style={styles.circleTitleRow}>
                <Text style={styles.circleEmoji}>{circleEmoji}</Text>
                <Text style={styles.circleName}>{circleName}</Text>
              </View>
              <Text style={styles.postedCount}>{postedCount}/{totalCount} posted today</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => modals.setShowMembersModal(true)}
              style={styles.headerIconButton}
              accessibilityRole="button"
              accessibilityLabel="View circle members"
              accessibilityHint="See all members of this circle"
            >
              <Feather name="users" size={22} color={Colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => modals.setShowActionMenu(true)}
              style={styles.headerIconButton}
              accessibilityRole="button"
              accessibilityLabel="More options"
              accessibilityHint="Open circle actions menu"
            >
              <Feather name="more-vertical" size={22} color={Colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Feed Tab */}
        {circleTab === 'feed' && (
          <View>
            {/* Circle Activity Card */}
            <CircleActivityCard
              currentUserPosted={userPosted}
              currentUserInitial={(user?.name || user?.username || 'Y').charAt(0).toUpperCase()}
              members={circleMembers.map((m: any) => ({
                id: m.id,
                name: m.name,
                initial: m.initial || m.name?.charAt(0).toUpperCase() || '?',
                posted: m.posted,
              }))}
              postedCount={postedCount}
              totalCount={totalCount}
              onShareDay={handleShareToday}
              onAssignMission={() => modals.setShowAssignModal(true)}
              onInvite={() => modals.setShowInviteSheet(true)}
              onViewAll={() => {
                setCircleTab('feed');
                setFeedFilter('all');
              }}
              onMemberPress={(memberId) => {
                if (memberId === 'current') {
                  handleOpenMemberDetail({
                    id: user?.id,
                    name: user?.name || user?.username || 'You',
                    initial: (user?.name || user?.username || 'Y').charAt(0).toUpperCase(),
                    posted: userPosted,
                    lastPostTime: undefined,
                  });
                  return;
                }
                const member = circleMembers.find((m: any) => m.id === memberId);
                if (member) handleOpenMemberDetail(member);
              }}
            />

            {/* Navigation Tabs */}
            <View style={styles.navigationGrid}>
              <View style={styles.navigationRow}>
                {['feed', 'members', 'challenges'].map(tab => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setCircleTab(tab)}
                    style={[
                      styles.navigationButton,
                      circleTab === tab && styles.navigationButtonActive
                    ]}
                  >
                    <Feather 
                      name={tab === 'feed' ? 'activity' : tab === 'members' ? 'users' : 'target'} 
                      size={16} 
                      color={circleTab === tab ? Colors.white : Colors.mutedForeground} 
                    />
                    <Text style={[
                      styles.navigationButtonText,
                      circleTab === tab && styles.navigationButtonTextActive
                    ]}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Filter Row */}
              {circleTab === 'feed' && (
                <View style={styles.navigationRow}>
                  {['all', 'checkins', 'assignments'].map(filter => (
                    <TouchableOpacity
                      key={filter}
                      onPress={() => setFeedFilter(filter)}
                      style={[
                        styles.navigationButton,
                        feedFilter === filter && styles.navigationButtonActive
                      ]}
                    >
                      <Feather 
                        name={filter === 'all' ? 'grid' : filter === 'checkins' ? 'check-circle' : 'clipboard'} 
                        size={16} 
                        color={feedFilter === filter ? Colors.white : Colors.mutedForeground} 
                      />
                      <Text style={[
                        styles.navigationButtonText,
                        feedFilter === filter && styles.navigationButtonTextActive
                      ]}>
                        {filter === 'checkins' ? 'Check-ins' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Posts */}
            {loadingFeed ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 12, color: Colors.mutedForeground }}>Loading feed...</Text>
              </View>
            ) : posts.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="message-circle" size={48} color={Colors.muted} />
                <Text style={styles.emptyStateTitle}>No posts yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Be the first to share your day with the circle!
                </Text>
                {!userPosted && todayStats.total > 0 && (
                  <TouchableOpacity onPress={handleShareToday} style={{ marginTop: 16 }}>
                    <LinearGradient
                      colors={['#8b5cf6', '#ec4899']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                    >
                      <Text style={{ color: Colors.white, fontWeight: '600' }}>Share Your Day</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                {postSelect.hiddenPostIds.size > 0 && (
                  <TouchableOpacity 
                    onPress={handleUnhideAllPosts}
                    style={styles.hiddenPostsBanner}
                  >
                    <Feather name="eye-off" size={16} color={Colors.mutedForeground} />
                    <Text style={styles.hiddenPostsText}>
                      {postSelect.hiddenPostIds.size} hidden post{postSelect.hiddenPostIds.size > 1 ? 's' : ''} • Tap to show all
                    </Text>
                  </TouchableOpacity>
                )}
                {(() => {
                  const filteredPosts = getFilteredPosts();
                  
                  if (filteredPosts.length === 0 && feedFilter !== 'all') {
                    return (
                      <View style={styles.filterEmptyState}>
                        <Feather 
                          name={feedFilter === 'checkins' ? 'check-square' : 'target'} 
                          size={32} 
                          color={Colors.mutedForeground} 
                        />
                        <Text style={styles.filterEmptyText}>
                          No {feedFilter === 'checkins' ? 'check-ins' : 'missions'} yet
                        </Text>
                        <Text style={styles.filterEmptySubtext}>
                          {feedFilter === 'checkins' 
                            ? 'Be the first to share your day!' 
                            : 'Assign a mission to get started'}
                        </Text>
                      </View>
                    );
                  }
                  
                  return filteredPosts.map(post => renderPostCard(post));
                })()}
              </>
            )}
          </View>
        )}

        {/* Members Tab */}
        {circleTab === 'members' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>MEMBERS ({circleMembers.length + 1})</Text>
              {isCurrentUserAdmin && (
                <TouchableOpacity 
                  onPress={() => modals.setShowCircleSettings(true)}
                  style={styles.settingsButton}
                >
                  <Feather name="settings" size={18} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            
            <MemberList
              currentUserPosted={userPosted}
              members={circleMembers.map((m: any) => ({
                id: m.id,
                name: m.name,
                initial: m.initial || m.name?.charAt(0).toUpperCase() || '?',
                posted: m.posted,
                lastPostTime: m.lastPostTime,
                role: m.role || 'member',
                avatarUrl: m.avatarUrl,
              }))}
              isCurrentUserAdmin={isCurrentUserAdmin}
              currentUserName={(user?.name || user?.username || 'You').charAt(0).toUpperCase()}
              loading={loadingMembers}
              onMemberPress={(member) => handleOpenMemberDetail(member)}
              onMemberLongPress={(member) => isCurrentUserAdmin ? handleMemberOptions(member) : undefined}
              onAssignToMember={handleAssignToMember}
              onInvitePress={() => modals.setShowInviteSheet(true)}
            />
          </View>
        )}

        {/* Challenges Tab */}
        {circleTab === 'challenges' && (
          <View>
            <View style={styles.challengeSectionHeader}>
              <Text style={styles.sectionTitle}>CHALLENGES</Text>
              <TouchableOpacity
                style={styles.challengeSectionAction}
                onPress={() => navigateToHomeStack('Challenges', { focusCircleId: circleId })}
              >
                <Text style={styles.challengeSectionActionText}>View all</Text>
                <Feather name="chevron-right" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            {loadingChallenges ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 12, color: Colors.mutedForeground }}>Loading challenges...</Text>
              </View>
            ) : circleChallenges.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="trophy-outline" size={48} color={Colors.muted} />
                <Text style={styles.emptyStateTitle}>No challenges yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Create a challenge in the Challenges screen and select this circle to get started!
                </Text>
                <TouchableOpacity 
                  onPress={() => navigateToHomeStack('Challenges')}
                  style={{ marginTop: 16 }}
                >
                  <LinearGradient
                    colors={['#7c3aed', '#a78bfa']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                  >
                    <Text style={{ color: Colors.white, fontWeight: '600' }}>Go to Challenges</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              circleChallenges.map(challenge => {
                const now = new Date();
                const endsAt = new Date(challenge.endsAt);
                const startsAt = new Date(challenge.startsAt);
                const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                const totalDays = Math.ceil((endsAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24));
                const participantCount = challenge.participantCount || challenge._count?.participants || 1;
                const challengeCategory = extractChallengeCategory(challenge.description);
                
                return (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={{
                      id: challenge.id,
                      title: challenge.title,
                      description: challenge.description,
                      emoji: challenge.emoji,
                      type: challenge.type as 'FOCUS_MINUTES' | 'TASKS_COMPLETED' | 'STREAK_DAYS',
                      targetValue: challenge.targetValue,
                      daysRemaining: daysLeft,
                      totalDays: totalDays,
                      xpReward: challenge.xpReward,
                      category: challengeCategory || undefined,
                      participants: participantCount,
                      isJoined: challenge.isJoined,
                    }}
                    onPress={handleChallengePress}
                    onJoin={async (c) => {
                      try {
                        const response = await challengesApi.join(c.id);
                        if (response.success) {
                          Alert.alert('Joined!', `You've joined ${c.title}`);
                          fetchChallenges();
                        }
                      } catch (error) {
                        console.error('Failed to join:', error);
                      }
                    }}
                  />
                );
              })
            )}

            {/* Create New Challenge Button */}
            <TouchableOpacity
              onPress={() => modals.setShowCreateChallengeModal(true)}
              style={styles.startNewChallengeButton}
            >
              <Feather name="plus" size={20} color={Colors.primary} />
              <Text style={styles.startNewChallengeText}>Create Challenge</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <ActionMenuModal
        visible={modals.showActionMenu}
        onClose={() => modals.setShowActionMenu(false)}
        onAssignMission={() => {
          modals.setShowActionMenu(false);
          setTimeout(() => modals.setShowAssignModal(true), 300);
        }}
        onInviteMembers={() => {
          modals.setShowActionMenu(false);
          setTimeout(() => modals.setShowInviteSheet(true), 300);
        }}
        onCircleSettings={() => {
          modals.setShowActionMenu(false);
          setTimeout(() => modals.setShowCircleSettings(true), 300);
        }}
        onLeaveCircle={handleLeaveCircle}
      />

      <AssignModal
        visible={modals.showAssignModal}
        onClose={() => {
          modals.setShowAssignModal(false);
          assignForm.resetForm();
        }}
        assignmentTitle={assignForm.assignmentTitle}
        assignmentNote={assignForm.assignmentNote}
        assignmentXp={assignForm.assignmentXp}
        assignedMember={assignForm.assignedMember}
        dueDay={assignForm.dueDay}
        customDueDate={assignForm.customDueDate}
        dueTime={assignForm.dueTime}
        repeatEnabled={assignForm.repeatEnabled}
        repeatFrequency={assignForm.repeatFrequency}
        requireProof={assignForm.requireProof}
        showDatePicker={assignForm.showDatePicker}
        showTimePicker={assignForm.showTimePicker}
        onTitleChange={assignForm.setAssignmentTitle}
        onNoteChange={assignForm.setAssignmentNote}
        onXpChange={assignForm.setAssignmentXp}
        onDueDayChange={assignForm.setDueDay}
        onCustomDueDateChange={assignForm.setCustomDueDate}
        onDueTimeChange={assignForm.setDueTime}
        onRepeatEnabledChange={assignForm.setRepeatEnabled}
        onRepeatFrequencyChange={assignForm.setRepeatFrequency}
        onRequireProofChange={assignForm.setRequireProof}
        onShowDatePicker={assignForm.setShowDatePicker}
        onShowTimePicker={assignForm.setShowTimePicker}
        onMemberSelected={(member) => assignForm.selectMember(member)}
        onCreateAssignment={async () => {
          const validation = assignForm.validateForm();
          if (!validation.valid) {
            Alert.alert('Error', validation.error);
            return;
          }
          assignForm.setCreatingAssignment(true);
          try {
            const formData = assignForm.getFormData(circleId);
            const response = await circlesApi.createAssignment(circleId, {
              assigneeId: formData.assigneeId,
              title: formData.title,
              description: formData.description,
              dueDate: formData.dueDate,
              xpReward: formData.xpReward,
              repeatEnabled: formData.repeatEnabled,
              repeatFrequency: formData.repeatFrequency,
              requireProof: formData.requireProof,
            });
            if (response.success) {
              Alert.alert('Success', 'Mission sent!');
              fetchAssignments();
              fetchFeed();
              modals.setShowAssignModal(false);
              assignForm.resetForm();
            } else {
              Alert.alert('Error', response.error || 'Failed to create assignment');
            }
          } catch (error) {
            console.error('Failed to create assignment:', error);
            Alert.alert('Error', 'Failed to create assignment');
          } finally {
            assignForm.setCreatingAssignment(false);
          }
        }}
        creatingAssignment={assignForm.creatingAssignment}
        members={circleMembers}
      />

      <ShareModal
        visible={modals.showShareModal}
        onClose={() => modals.setShowShareModal(false)}
        todayStats={todayStats}
        streakDays={user?.currentStreak || 0}
        shareNote={shareNote}
        sharePrivacy={sharePrivacy}
        onShareNoteChange={setShareNote}
        onSharePrivacyChange={setSharePrivacy}
        onConfirmShare={handleConfirmShare}
        onCreateDailyCard={handleNavigateToDailyLifeCard}
        postingDailyCard={postingDailyCard}
      />

      <AssignmentOptionsModal
        visible={modals.showAssignmentOptions}
        onClose={() => modals.setShowAssignmentOptions(false)}
        assignment={selectedAssignment}
        isSender={!!selectedAssignment && isAssignmentSender(selectedAssignment)}
        isRecipient={!!selectedAssignment && isAssignmentRecipient(selectedAssignment)}
        onEdit={() => selectedAssignment && openEditAssignmentModal(selectedAssignment)}
        onAccept={() => selectedAssignment && handleAcceptAssignment(selectedAssignment)}
        onDecline={() => selectedAssignment && handleDeclineAssignment(selectedAssignment)}
        onComplete={() => selectedAssignment && handleCompleteAssignment(selectedAssignment)}
        onSubmitProof={() => selectedAssignment && openSubmitProofModal(selectedAssignment)}
        onViewProof={() => selectedAssignment && handleViewProof(selectedAssignment)}
        onHide={() => {
          modals.setShowAssignmentOptions(false);
          Alert.alert('Hidden', 'This mission post has been hidden from your feed.');
        }}
      />

      <EditAssignmentModal
        visible={modals.showEditAssignmentModal}
        onClose={() => {
          modals.setShowEditAssignmentModal(false);
          setSelectedAssignment(null);
        }}
        editAssignmentData={editAssignmentData}
        setEditAssignmentData={setEditAssignmentData}
        editDueDay={editDueDay}
        setEditDueDay={setEditDueDay}
        editCustomDueDate={editCustomDueDate}
        setEditCustomDueDate={setEditCustomDueDate}
        showEditDatePicker={showEditDatePicker}
        setShowEditDatePicker={setShowEditDatePicker}
        showEditTimePicker={showEditTimePicker}
        setShowEditTimePicker={setShowEditTimePicker}
        formatDate={formatDate}
        formatTime={formatTime}
        getEditDueSummary={getEditDueSummary}
        onSave={handleSaveAssignmentEdit}
        saving={editingAssignment}
      />

      <MemberDetailModal
        visible={modals.showMemberDetailModal}
        onClose={() => {
          modals.setShowMemberDetailModal(false);
          setSelectedMemberDetail(null);
        }}
        member={selectedMemberDetail}
        onAssignMission={(member) => {
          modals.setShowMemberDetailModal(false);
          handleAssignToMember(member);
        }}
      />

      <ViewProofModal
        visible={modals.showViewProofModal}
        onClose={() => {
          modals.setShowViewProofModal(false);
          setSelectedAssignmentForView(null);
        }}
        proofUrl={selectedAssignmentForView?.proofUrl}
        onCopy={() => {
          if (selectedAssignmentForView?.proofUrl) {
            handleCopyInvite(selectedAssignmentForView.proofUrl, 'link');
          }
        }}
        onOpen={() => {
          if (selectedAssignmentForView?.proofUrl) {
            Linking.openURL(selectedAssignmentForView.proofUrl);
          }
        }}
      />

      <InviteModal
        visible={modals.showInviteSheet}
        onClose={() => modals.setShowInviteSheet(false)}
        circleName={circleName}
        inviteCode={inviteCode}
        inviteLink={inviteLink}
        copySuccess={localCopySuccess}
        onShareLink={handleShareLink}
        onCopyInvite={handleCopyInvite}
      />

      <DeclineModal
        visible={modals.showDeclineModal}
        onClose={() => {
          modals.setShowDeclineModal(false);
          setDeclineAssignmentId(null);
          setDeclineReason('');
        }}
        assignmentTitle={declineAssignmentTitle}
        declineReason={declineReason}
        onDeclineReasonChange={setDeclineReason}
        onConfirmDecline={async (withReason: boolean) => {
          if (!declineAssignmentId) return;
          setDecliningInProgress(true);
          try {
            const response = await assignmentsApi.decline(
              String(declineAssignmentId),
              withReason ? declineReason.trim() || undefined : undefined
            );
            if (response.success) {
              Alert.alert('Mission Declined', 'The sender has been notified.');
              await fetchAssignments();
              await fetchFeed();
              modals.setShowDeclineModal(false);
              setDeclineAssignmentId(null);
              setDeclineReason('');
            } else {
              Alert.alert('Error', response.error || 'Failed to decline mission');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to decline mission');
          } finally {
            setDecliningInProgress(false);
          }
        }}
        decliningInProgress={decliningInProgress}
      />

      <MembersModal
        visible={modals.showMembersModal}
        onClose={() => modals.setShowMembersModal(false)}
        members={circleMembers.map((m: any) => ({
          id: m.id,
          name: m.name,
          initial: m.initial || m.name?.charAt(0).toUpperCase() || '?',
          role: m.role || 'member',
          posted: m.posted,
        }))}
        userPosted={userPosted}
      />

      <TodayModal
        visible={modals.showTodayModal}
        onClose={() => modals.setShowTodayModal(false)}
        circleName={circleName}
        postedCount={postedCount}
        totalCount={totalCount}
        userPosted={userPosted}
        members={circleMembers.map((m: any) => ({
          id: m.id,
          name: m.name,
          initial: m.initial || m.name?.charAt(0).toUpperCase() || '?',
          posted: m.posted,
          lastPostTime: m.lastPostTime,
        }))}
        onMemberPress={(member) => handleOpenMemberDetail(member)}
        onShareToday={handleShareToday}
        onAssignMission={() => {
          modals.setShowTodayModal(false);
          setTimeout(() => modals.setShowAssignModal(true), 300);
        }}
      />

      <CircleSettingsModal
        visible={modals.showCircleSettings}
        onClose={() => modals.setShowCircleSettings(false)}
        circleName={editCircleName}
        circleEmoji={editCircleEmoji}
        onCircleNameChange={setEditCircleName}
        onCircleEmojiChange={setEditCircleEmoji}
        onSaveSettings={async () => {
          try {
            const response = await circlesApi.update(circleId, {
              name: editCircleName,
              emoji: editCircleEmoji,
            });
            if (response.success) {
              fetchCircleDetails();
              modals.setShowCircleSettings(false);
              Alert.alert('Success', 'Circle settings updated');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to update circle settings');
          }
        }}
        onDeleteCircle={() => {
          Alert.alert(
            'Delete Circle',
            'Are you sure you want to delete this circle? This cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  try {
                    const response = await circlesApi.delete(circleId);
                    if (response.success) {
                      navigation.goBack();
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to delete circle');
                  }
                }
              }
            ]
          );
        }}
      />

      <CreateChallengeModal
        visible={modals.showCreateChallengeModal}
        onClose={() => {
          modals.setShowCreateChallengeModal(false);
          challengeForm.resetForm();
        }}
        challengeTitle={challengeForm.challengeTitle}
        challengePrompt={challengeForm.challengePrompt}
        challengeType={challengeForm.challengeType}
        challengeCategory={challengeForm.challengeCategory as any}
        challengeDescription={challengeForm.challengeDescription}
        challengeTarget={challengeForm.challengeTarget}
        challengeDays={challengeForm.challengeDays}
        challengeXP={challengeForm.challengeXP}
        onTitleChange={challengeForm.setChallengeTitle}
        onPromptChange={challengeForm.setChallengePrompt}
        onTypeChange={challengeForm.setChallengeType}
        onCategoryChange={challengeForm.setChallengeCategory as any}
        onDescriptionChange={challengeForm.setChallengeDescription}
        onTargetChange={challengeForm.setChallengeTarget}
        onDaysChange={challengeForm.setChallengeDays}
        onXPChange={challengeForm.setChallengeXP}
        onAiSuggest={async () => {
          if (!challengeForm.challengePrompt.trim()) return;
          challengeForm.setAiSuggestingChallenge(true);
          try {
            const response = await aiApi.suggestChallenge(challengeForm.challengePrompt);
            if (response.success && response.data) {
              challengeForm.setChallengeTitle(response.data.title || '');
              challengeForm.setChallengeDescription(response.data.description || '');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to get AI suggestion');
          } finally {
            challengeForm.setAiSuggestingChallenge(false);
          }
        }}
        onCreateChallenge={async () => {
          const validation = challengeForm.validateForm();
          if (!validation.valid) {
            Alert.alert('Error', validation.error);
            return;
          }
          challengeForm.setCreatingChallenge(true);
          try {
            const formData = challengeForm.getFormData(circleId);
            const response = await challengesApi.create(formData);
            if (response.success) {
              Alert.alert('Success', 'Challenge created!');
              fetchChallenges();
              modals.setShowCreateChallengeModal(false);
              challengeForm.resetForm();
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to create challenge');
          } finally {
            challengeForm.setCreatingChallenge(false);
          }
        }}
        aiSuggestingChallenge={challengeForm.aiSuggestingChallenge}
        creatingChallenge={challengeForm.creatingChallenge}
      />

      <PostOptionsModal
        visible={modals.showPostOptions}
        onClose={() => modals.setShowPostOptions(false)}
        selectedPost={selectedPost}
        currentUserId={user?.id}
        isCurrentUserAdmin={isCurrentUserAdmin}
        onEditPost={(post) => {
          setEditPostContent(post?.content || '');
          modals.setShowPostOptions(false);
          setTimeout(() => modals.setShowEditPostModal(true), 300);
        }}
        onDeletePost={async (post) => {
          if (!post) return;
          try {
            const response = await postsApi.delete(post.id);
            if (response.success) {
              setPosts(prev => prev.filter(p => p.id !== post.id));
              modals.setShowPostOptions(false);
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete post');
          }
        }}
        onHidePost={(postId) => {
          postSelect.setHiddenPostIds(prev => new Set([...prev, postId]));
          modals.setShowPostOptions(false);
        }}
      />

      <EditPostModal
        visible={modals.showEditPostModal}
        onClose={() => modals.setShowEditPostModal(false)}
        editPostContent={editPostContent}
        onEditPostContentChange={setEditPostContent}
        onSave={async () => {
          if (!selectedPost) return;
          try {
            const response = await postsApi.update(selectedPost.id, { content: editPostContent });
            if (response.success) {
              setPosts(prev => prev.map(p => 
                p.id === selectedPost.id ? { ...p, content: editPostContent } : p
              ));
              modals.setShowEditPostModal(false);
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to update post');
          }
        }}
      />

      <MemberOptionsModal
        visible={modals.showMemberOptions}
        onClose={() => modals.setShowMemberOptions(false)}
        selectedMember={selectedMember}
        onViewProfile={(member) => {
          handleOpenMemberDetail(member);
          modals.setShowMemberOptions(false);
        }}
        onToggleAdmin={async (memberId) => {
          try {
            const member = circleMembers.find((m: any) => m.id === memberId);
            const newRole = member?.role === 'admin' ? 'MEMBER' : 'ADMIN';
            const response = await circlesApi.updateMemberRole(circleId, memberId, newRole);
            if (response.success) {
              fetchCircleMembers();
              modals.setShowMemberOptions(false);
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to update member role');
          }
        }}
        onRemoveMember={(memberId) => {
          const member = circleMembers.find((m: any) => m.id === memberId);
          Alert.alert(
            'Remove Member',
            `Remove ${member?.name || 'this member'} from the circle?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                  try {
                    const response = await circlesApi.removeMember(circleId, memberId);
                    if (response.success) {
                      fetchCircleMembers();
                      modals.setShowMemberOptions(false);
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to remove member');
                  }
                }
              }
            ]
          );
        }}
      />

      <SubmitProofModal
        visible={modals.showSubmitProofModal}
        onClose={() => {
          modals.setShowSubmitProofModal(false);
          setSelectedAssignmentForProof(null);
          setProofUrl('');
          setProofNote('');
        }}
        proofUrl={proofUrl}
        proofNote={proofNote}
        onProofUrlChange={setProofUrl}
        onProofNoteChange={setProofNote}
        onSubmit={async () => {
          if (!selectedAssignmentForProof) return;
          setSubmittingProof(true);
          try {
            const response = await assignmentsApi.submitProof(
              selectedAssignmentForProof.id,
              proofUrl,
              proofNote
            );
            if (response.success) {
              Alert.alert('Success', 'Proof submitted!');
              fetchAssignments();
              modals.setShowSubmitProofModal(false);
              setProofUrl('');
              setProofNote('');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to submit proof');
          } finally {
            setSubmittingProof(false);
          }
        }}
        submittingProof={submittingProof}
      />
    </SafeAreaView>
  );
}
