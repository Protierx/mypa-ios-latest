import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Alert,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { circlesApi, assignmentsApi, postsApi, tasksApi, challengesApi, aiApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket, useSocketEvent } from '../services/socket';

// Import our refactored components and hooks
import {
  PostCard,
  AssignmentCard,
  ChallengeCard,
  MemberList,
  CircleActivityCard,
} from './CircleHome/components';
import {
  useCircleData,
  useCircleActions,
  useCircleModals,
  useAssignmentForm,
  usePostSelection,
  useChallengeForm,
} from './CircleHome/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Colors = {
  primary: '#7c3aed',
  primaryLight: '#ede9fe',
  background: '#ffffff',
  surface: '#f9fafb',
  border: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningText: '#b45309',
  successText: '#047857',
  danger: '#ef4444',
  orange: '#ff6b35',
  white: '#ffffff',
};

export default function CircleHomeScreen({ navigation, route }: { navigation: any; route: any }) {
  // Get circle data from route params with fallback
  const { circleId: paramCircleId, circleName: paramCircleName, inviteCode: paramInviteCode, circle } = route?.params || {};
  const circleId = paramCircleId || circle?.id || 'circle-1';
  const circleName = paramCircleName || circle?.name || 'Morning Warriors';
  const circleEmoji = circle?.emoji || '🏃';
  
  const { user } = useAuth();

  // Use our refactored hooks
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

  // Destructure all modal states from hook
  const {
    showActionMenu, setShowActionMenu,
    showInviteSheet, setShowInviteSheet,
    showMembersModal, setShowMembersModal,
    showTodayModal, setShowTodayModal,
    showAssignModal, setShowAssignModal,
    showMemberPicker, setShowMemberPicker,
    showAssignmentOptions, setShowAssignmentOptions,
    showEditAssignmentModal, setShowEditAssignmentModal,
    showDeclineModal, setShowDeclineModal,
    showPostOptions, setShowPostOptions,
    showEditPostModal, setShowEditPostModal,
    showShareModal, setShowShareModal,
    showSubmitProofModal, setShowSubmitProofModal,
    showViewProofModal, setShowViewProofModal,
    showMemberOptions, setShowMemberOptions,
    showMemberActionSheet, setShowMemberActionSheet,
    showMemberDetailModal, setShowMemberDetailModal,
    showCircleSettings, setShowCircleSettings,
    showCreateChallengeModal, setShowCreateChallengeModal,
    closeAllModals,
  } = modals;

  // Destructure all assignment form states from hook
  const {
    assignmentTitle, setAssignmentTitle,
    assignmentNote, setAssignmentNote,
    assignmentXp, setAssignmentXp,
    assignedMember, setAssignedMember,
    assignTo, setAssignTo,
    assignToId, setAssignToId,
    memberSearchQuery, setMemberSearchQuery,
    dueDay, setDueDay,
    customDueDate, setCustomDueDate,
    dueTime, setDueTime,
    showDatePicker, setShowDatePicker,
    showTimePicker, setShowTimePicker,
    repeatEnabled, setRepeatEnabled,
    repeatFrequency, setRepeatFrequency,
    requireProof, setRequireProof,
    sendNudge, setSendNudge,
    repeatEndType, setRepeatEndType,
    repeatEndDate, setRepeatEndDate,
    repeatEndCount, setRepeatEndCount,
    showRepeatEndDatePicker, setShowRepeatEndDatePicker,
    creatingAssignment, setCreatingAssignment,
    resetForm: resetAssignForm,
  } = assignForm;

  // Destructure challenge form states from hook
  const {
    challengeTitle, setChallengeTitle,
    challengeType, setChallengeType,
    challengeTarget, setChallengeTarget,
    challengeDays, setChallengeDays,
    challengeXP, setChallengeXP,
    challengeCategory, setChallengeCategory,
    challengeDescription, setChallengeDescription,
    creatingChallenge, setCreatingChallenge,
    challengePrompt, setChallengePrompt,
    aiSuggestingChallenge, setAiSuggestingChallenge,
  } = challengeForm;

  // Destructure post selection states from hook
  const {
    postSelectionMode, setPostSelectionMode,
    selectedPosts, setSelectedPosts,
    hiddenPostIds, setHiddenPostIds,
    enterSelectionMode,
    togglePostSelection,
  } = postSelect;

  // Local UI state (not extracted to hooks)
  const [circleTab, setCircleTab] = useState('feed');
  const [feedFilter, setFeedFilter] = useState('all');
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(true);
  
  // Post/Assignment/Member selection state
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedAssignmentForProof, setSelectedAssignmentForProof] = useState<any>(null);
  
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
  const [proofImage, setProofImage] = useState<string | null>(null);
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
  
  // Circle settings toggles (for circle settings modal)
  const [inviteLinkEnabled, setInviteLinkEnabled] = useState(true);
  const [approveNewMembers, setApproveNewMembers] = useState(false);
  const [allowAssignments, setAllowAssignments] = useState(true);
  const [requireAcceptBeforeAdding, setRequireAcceptBeforeAdding] = useState(false);
  const [defaultProofRequired, setDefaultProofRequired] = useState(false);
  const [circlePrivacy, setCirclePrivacy] = useState<'metrics' | 'circle'>('circle');
  const [muteCircle, setMuteCircle] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  
  // Deletion state
  const [deletingSelectedPosts, setDeletingSelectedPosts] = useState(false);
  const [selectedMemberForManage, setSelectedMemberForManage] = useState<any>(null);
  
  // Share state
  const [sharePrivacy, setSharePrivacy] = useState<'metrics' | 'full'>('full');
  const [shareNote, setShareNote] = useState('');
  
  // Loading state
  const [postingDailyCard, setPostingDailyCard] = useState(false);

  const postedCount = circleMembers.filter((m: any) => m.posted).length + (userPosted ? 1 : 0);
  const totalCount = circleMembers.length + 1;

  // Circle details - use from hook
  const inviteCode = circleDetails?.inviteCode || paramInviteCode || '';
  const inviteLink = inviteCode ? `https://mypa.app/invite/${inviteCode}` : '';

  // Socket connection for real-time updates
  const { connect, joinCircle, leaveCircle } = useSocket();

  // Connect to socket and join circle room
  useEffect(() => {
    const setupSocket = async () => {
      await connect();
      joinCircle(circleId);
    };
    setupSocket();

    return () => {
      leaveCircle(circleId);
    };
  }, [circleId]);

  // Real-time: New post in circle
  useSocketEvent('post:new', (data: any) => {
    if (data.circleId === circleId) {
      console.log('📨 New post received:', data.post);
      // Refresh feed to properly format the new post
      fetchFeed();
    }
  }, [circleId]);

  // Real-time: Post deleted
  useSocketEvent('post:deleted', (data: any) => {
    if (data.circleId === circleId) {
      setPosts((prev: any) => prev.filter((p: any) => p.id !== data.postId));
    }
  }, [circleId]);

  // Real-time: Reaction on post
  useSocketEvent('post:reaction', (data: any) => {
    if (data.circleId === circleId) {
      // Refresh posts to get updated reactions
      fetchFeed();
    }
  }, [circleId]);

  // Real-time: New member joined
  useSocketEvent('circle:member_joined', (data: any) => {
    if (data.circleId === circleId) {
      console.log('📨 Member joined:', data.member);
      fetchCircleMembers();
    }
  }, [circleId]);

  // Real-time: Member left
  useSocketEvent('circle:member_left', (data: any) => {
    if (data.circleId === circleId) {
      setCircleMembers((prev: any) => prev.filter((m: any) => m.id !== data.userId));
    }
  }, [circleId]);

  // Real-time: New assignment created (for circle feed)
  useSocketEvent('assignment:created', (data: any) => {
    if (data.circleId === circleId) {
      fetchAssignments();
      fetchFeed(); // Also refresh feed to show system post
    }
  }, [circleId]);

  // Real-time: Assignment assigned to me
  useSocketEvent('assignment:new', (data: any) => {
    console.log('📨 New assignment for you:', data.assignment);
    if (data.assignment?.circleId === circleId) {
      fetchAssignments();
      Alert.alert(
        '🎯 New Mission!',
        `You've been assigned: ${data.assignment.title}`,
        [{ text: 'View', onPress: () => setCircleTab('challenges') }]
      );
    }
  }, [circleId]);

  // Real-time: Assignment status updated
  useSocketEvent('assignment:updated', (data: any) => {
    if (data.circleId === circleId) {
      fetchAssignments();
    }
  }, [circleId]);

  // Real-time: New challenge created
  useSocketEvent('challenge:created', (data: any) => {
    if (data.circleId === circleId) {
      console.log('🏆 New challenge created:', data.challenge);
      fetchFeed(); // Add challenge post to feed
      fetchChallenges(); // Refresh challenge list
    }
  }, [circleId]);

  // Real-time: Challenge joined
  useSocketEvent('challenge:joined', (data: any) => {
    if (data.circleId === circleId) {
      console.log('✅ Member joined challenge:', data.challenge);
      fetchChallenges();
    }
  }, [circleId]);

  // Real-time: Challenge completed
  useSocketEvent('challenge:completed', (data: any) => {
    if (data.circleId === circleId) {
      console.log('🎉 Challenge completed:', data.challenge);
      fetchFeed(); // Show completion post
      fetchChallenges();
    }
  }, [circleId]);

  // Helper to format time ago
  const formatTimeAgo = (dateString: string) => {
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

  // Helper to format due time
  const formatDueTime = (dateString: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${timeStr}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${timeStr}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
    }
  };

  // Handle post check-in - Share My Day (posts daily card with real stats)
  
  const handlePostCheckin = async () => {
    if (userPosted) {
      Alert.alert('Already Shared', 'You\'ve already shared your day with this circle today.');
      return;
    }

    if (todayStats.total === 0) {
      Alert.alert(
        'No Tasks Today',
        'You don\'t have any tasks scheduled for today. Add some tasks first!',
        [{ text: 'OK' }]
      );
      return;
    }

    setPostingDailyCard(true);
    try {
      const response = await circlesApi.createDailyCard(circleId);
      if (response.success) {
        setUserPosted(true);
        // Refresh feed to show new post
        await fetchFeed();
        Alert.alert(
          '🎉 Day Shared!',
          `Your progress (${todayStats.completed}/${todayStats.total} tasks, +${todayStats.timeSaved}m saved) has been shared with the circle.`,
          [{ text: 'Awesome!', style: 'default' }]
        );
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

  // Handle reaction toggle - with real API call
  const handleReaction = async (postId: string, reactionType: 'heart' | 'fire' | 'clap') => {
    const emojiMap = { heart: '❤️', fire: '🔥', clap: '👏' };
    const emoji = emojiMap[reactionType];
    
    // Find the post to check current user reaction
    const post = posts.find(p => p.id === postId);
    const hasReacted = post?.userReaction === emoji;
    
    try {
      if (hasReacted) {
        // Remove reaction
        const response = await postsApi.removeReaction(postId);
        if (response.success) {
          setPosts(prevPosts => 
            prevPosts.map(p => {
              if (p.id === postId) {
                return {
                  ...p,
                  reactions: {
                    ...p.reactions,
                    [reactionType]: Math.max(0, (p.reactions?.[reactionType] || 1) - 1)
                  },
                  userReaction: null
                };
              }
              return p;
            })
          );
        }
      } else {
        // Add reaction (will replace any existing reaction)
        const response = await postsApi.react(postId, emoji);
        if (response.success) {
          // Get the old reaction type if any
          const oldReactionType = post?.userReaction ? 
            Object.entries(emojiMap).find(([_, e]) => e === post.userReaction)?.[0] as 'heart' | 'fire' | 'clap' | undefined
            : undefined;
          
          setPosts(prevPosts => 
            prevPosts.map(p => {
              if (p.id === postId) {
                const newReactions = { ...p.reactions };
                // Increment new reaction
                newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
                // Decrement old reaction if switching
                if (oldReactionType && oldReactionType !== reactionType) {
                  newReactions[oldReactionType] = Math.max(0, (newReactions[oldReactionType] || 1) - 1);
                }
                return {
                  ...p,
                  reactions: newReactions,
                  userReaction: emoji
                };
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

  // Handle leave circle
  const handleLeaveCircle = () => {
    Alert.alert(
      'Leave Circle',
      `Are you sure you want to leave ${circleName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await circlesApi.leave(circleId);
              if (response.success) {
                setShowActionMenu(false);
                navigation.goBack();
              } else {
                Alert.alert('Error', response.error || 'Failed to leave circle');
              }
            } catch (error) {
              console.error('Failed to leave circle:', error);
              Alert.alert('Error', 'Failed to leave circle. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle member selection for assignment
  const handleSelectMember = (member: any) => {
    setAssignedMember({ id: member.id, name: member.name, initial: member.initial });
    setAssignTo(member.name);
    setAssignToId(member.id);
    requestAnimationFrame(() => setShowMemberPicker(false));
  };

  // Handle view member profile
  const handleViewMember = (member: any) => {
    Alert.alert(
      member.name,
      `Role: ${member.role === 'admin' ? 'Admin' : 'Member'}\n${member.posted ? `Last posted: ${member.lastPostTime || 'Recently'}` : 'Has not posted today'}`,
      [{ text: 'OK' }]
    );
  };

  // Handle challenge action
  const handleChallengeAction = (assignment: any) => {
    if (assignment.status === 'pending') {
      Alert.alert(
        assignment.title,
        `Assigned by ${assignment.assignedBy}\nDue: ${assignment.dueTime}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Accept Challenge', 
            onPress: () => {
              setAssignments(prev => 
                prev.map(a => 
                  a.id === assignment.id ? { ...a, status: 'accepted' } : a
                )
              );
            }
          }
        ]
      );
    } else {
      Alert.alert(
        '✅ ' + assignment.title,
        `You've accepted this challenge!\nDue: ${assignment.dueTime}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleCopyInvite = async (text: string, type: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      Alert.alert('Copy failed', 'Unable to copy the invite link.');
    }
  };

  const handleCreateAssignment = async () => {
    if (!assignmentTitle.trim()) {
      Alert.alert('Error', 'Please enter a mission title');
      return;
    }
    if (!assignedMember) {
      Alert.alert('Error', 'Please select a member to assign');
      return;
    }

    // Calculate due date
    let dueDate = new Date();
    if (dueDay === 'tomorrow') {
      dueDate.setDate(dueDate.getDate() + 1);
    } else if (dueDay === 'custom') {
      dueDate = new Date(customDueDate);
    }
    
    // Set the time from the time picker
    dueDate.setHours(dueTime.getHours(), dueTime.getMinutes(), 0, 0);

    setCreatingAssignment(true);
    try {
      const response = await circlesApi.createAssignment(circleId, {
        assigneeId: assignedMember.id,
        title: assignmentTitle.trim(),
        description: assignmentNote.trim() || '',
        dueDate: dueDate.toISOString(),
        xpReward: assignmentXp,
        repeatEnabled: repeatEnabled,
        repeatFrequency: repeatEnabled ? repeatFrequency : undefined,
        requireProof: requireProof,
      });

      if (response.success && response.data) {
        // Refresh assignments list
        await fetchAssignments();
        // Refresh feed to show new system post
        await fetchFeed();
        
        // Reset all form fields
        resetAssignForm();
        setShowAssignModal(false);
        
        Alert.alert('Success', `Mission assigned to ${assignedMember.name}!`);
      } else {
        Alert.alert('Error', response.error || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Failed to create assignment:', error);
      Alert.alert('Error', 'Failed to create assignment. Please try again.');
    } finally {
      setCreatingAssignment(false);
    }
  };

  // Accept assignment
  const handleAcceptAssignment = async (assignmentId: string) => {
    try {
      const response = await assignmentsApi.accept(assignmentId);
      if (response.success) {
        // Refresh assignments
        await fetchAssignments();
        Alert.alert('Accepted!', 'You\'ve accepted this mission.');
      } else {
        Alert.alert('Error', response.error || 'Failed to accept assignment');
      }
    } catch (error) {
      console.error('Failed to accept assignment:', error);
      Alert.alert('Error', 'Failed to accept assignment');
    }
  };

  // Decline assignment - show modal for reason
  const handleDeclineAssignment = async (assignmentId: string, title?: string) => {
    console.log('🔴 Decline button pressed!', { assignmentId, title });
    console.log('🔴 Setting showDeclineModal to true');
    setDeclineAssignmentId(assignmentId);
    setDeclineAssignmentTitle(title || 'this mission');
    setDeclineReason('');
    setShowDeclineModal(true);
    console.log('🔴 showDeclineModal state set');
  };

  // Complete assignment (with optional proof)
  const handleCompleteAssignment = async (assignment: any, proof?: { proofUrl?: string; proofNote?: string }) => {
    try {
      const response = await assignmentsApi.complete(String(assignment.id), proof);
      if (response.success) {
        await fetchAssignments();
        await fetchFeed(); // Refresh feed to show completion
        Alert.alert('🎉 Complete!', 'Great job completing this mission!');
      } else {
        Alert.alert('Error', response.error || 'Failed to complete');
      }
    } catch (error) {
      console.error('Failed to complete assignment:', error);
      Alert.alert('Error', 'Failed to complete assignment');
    }
  };

  const openSubmitProofModal = (assignment: any) => {
    setSelectedAssignmentForProof(assignment);
    setProofUrl(assignment?.proofUrl || '');
    setProofNote('');
    setShowSubmitProofModal(true);
  };

  const submitProofAndComplete = async () => {
    if (!selectedAssignmentForProof) return;

    if (!proofUrl.trim() && !proofNote.trim()) {
      Alert.alert('Proof required', 'Add a proof link or a short note.');
      return;
    }

    setSubmittingProof(true);
    try {
      await handleCompleteAssignment(selectedAssignmentForProof, {
        proofUrl: proofUrl.trim() || undefined,
        proofNote: proofNote.trim() || undefined,
      });
      setShowSubmitProofModal(false);
      setSelectedAssignmentForProof(null);
      setProofUrl('');
      setProofNote('');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleViewProof = async (assignment: any) => {
    if (!assignment?.proofUrl) {
      Alert.alert('No proof', 'No proof link was provided.');
      return;
    }
    Alert.alert(
      'Proof Submitted',
      assignment.proofUrl,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Copy Link', onPress: () => handleCopyInvite(assignment.proofUrl, 'proof') },
      ]
    );
  };

  // Create challenge
  const handleCreateChallenge = async () => {
    if (!challengeTitle.trim()) {
      Alert.alert('Error', 'Please enter a challenge title');
      return;
    }

    const target = parseInt(challengeTarget);
    const days = parseInt(challengeDays);
    
    if (isNaN(target) || target < 1) {
      Alert.alert('Error', 'Please enter a valid target number');
      return;
    }
    
    if (isNaN(days) || days < 1) {
      Alert.alert('Error', 'Please enter a valid number of days');
      return;
    }

    setCreatingChallenge(true);
    try {
      const now = new Date();
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + days);

      const description = `Category: ${challengeCategory}${challengeDescription.trim() ? ` | ${challengeDescription.trim()}` : ''}`;
      const response = await challengesApi.create({
        title: challengeTitle.trim(),
        type: challengeType,
        targetValue: target,
        startsAt: now.toISOString(),
        endsAt: endsAt.toISOString(),
        xpReward: challengeXP,
        circleId: circleId,
        emoji: challengeType === 'FOCUS_MINUTES' ? '🧠' : 
               challengeType === 'TASKS_COMPLETED' ? '✅' : '🔥',
        description,
      });

      if (response.success) {
        // Refresh feed to show new challenge post
        await fetchFeed();
        await fetchChallenges();
        
        // Reset form
        setChallengeTitle('');
        setChallengeTarget('10');
        setChallengeDays('7');
        setChallengeCategory('Productivity');
        setChallengeDescription('');
        setShowCreateChallengeModal(false);
        
        Alert.alert('🎉 Challenge Created!', `Your challenge has been posted to the circle feed!`);
      } else {
        Alert.alert('Error', response.error || 'Failed to create challenge');
      }
    } catch (error) {
      console.error('Failed to create challenge:', error);
      Alert.alert('Error', 'Failed to create challenge. Please try again.');
    } finally {
      setCreatingChallenge(false);
    }
  };

  // Helper to format time from Date object
  const formatTime = (date: Date) => {
    const h = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Helper to format date
  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  // Get due summary text
  const getDueSummary = () => {
    const dayLabel = dueDay === 'today' ? 'Today' : dueDay === 'tomorrow' ? 'Tomorrow' : formatDate(customDueDate);
    return `Due: ${dayLabel} at ${formatTime(dueTime)}`;
  };

  // Get due summary text for edit mode
  const getEditDueSummary = () => {
    const dayLabel = editDueDay === 'today' ? 'Today' : editDueDay === 'tomorrow' ? 'Tomorrow' : formatDate(editCustomDueDate);
    const timeStr = editAssignmentData.dueTime ? formatTime(editAssignmentData.dueTime) : '9:00 AM';
    return `Due: ${dayLabel} at ${timeStr}`;
  };

  // Reset assign form
  // NEW: Handle open Today modal
  const handleOpenTodayModal = () => {
    setShowTodayModal(true);
  };

  const extractChallengeCategory = (description?: string) => {
    if (!description) return null;
    const match = description.match(/Category:\s*([^|\n]+)/i);
    return match?.[1]?.trim() || null;
  };

  // NEW: Handle open Member Detail
  const handleOpenMemberDetail = (member: any) => {
    setSelectedMemberDetail(member);
    setShowTodayModal(false);
    setShowMemberDetailModal(true);
  };

  // NEW: Handle Share Today
  const handleShareToday = () => {
    if (todayStats.total === 0) {
      Alert.alert(
        'No Tasks Today',
        'You don\'t have any tasks scheduled for today. Add some tasks first!',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowShareModal(true);
  };

  // NEW: Handle Confirm Share - posts real daily card
  const handleConfirmShare = async () => {
    setPostingDailyCard(true);
    try {
      const response = await circlesApi.createDailyCard(circleId);
      if (response.success) {
        setUserPosted(true);
        // Refresh feed to show new post
        await fetchFeed();
        setShareNote('');
        setSharePrivacy('full');
        setShowShareModal(false);
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

  // NEW: Handle Share Link
  const handleShareLink = async () => {
    // In a real app, this would use the native share API
    await handleCopyInvite(inviteLink, 'link');
    Alert.alert('Link Copied', 'Invite link has been copied to clipboard');
  };

  // NEW: Handle assign to specific member (pre-select from + button)
  const handleAssignToMember = (member: any) => {
    setAssignedMember({ id: member.id, name: member.name, initial: member.initial });
    setAssignTo(member.name);
    setAssignToId(member.id);
    setShowAssignModal(true);
  };

  // NEW: Handle promote to admin
  const handlePromoteToAdmin = async (memberId: string) => {
    try {
      const response = await circlesApi.updateMemberRole(circleId, memberId, 'ADMIN');
      if (response.success) {
        setCircleMembers(prev =>
          prev.map(m =>
            m.id === memberId ? { ...m, role: 'admin' } : m
          )
        );
        setShowMemberActionSheet(false);
        setSelectedMemberForManage(null);
        Alert.alert('Admin Added', 'Member has been promoted to admin.');
      } else {
        Alert.alert('Error', response.error || 'Failed to promote member');
      }
    } catch (error) {
      console.error('Failed to promote member:', error);
      Alert.alert('Error', 'Failed to promote member. Please try again.');
    }
  };

  // NEW: Handle remove from circle
  const handleRemoveFromCircle = (memberId: string) => {
    const member = circleMembers.find(m => m.id === memberId);
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member?.name} from this circle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await circlesApi.kickMember(circleId, memberId);
              if (response.success) {
                setCircleMembers(prev => prev.filter(m => m.id !== memberId));
                setShowMemberActionSheet(false);
                setSelectedMemberForManage(null);
              } else {
                Alert.alert('Error', response.error || 'Failed to remove member');
              }
            } catch (error) {
              console.error('Failed to remove member:', error);
              Alert.alert('Error', 'Failed to remove member. Please try again.');
            }
          }
        }
      ]
    );
  };

  // NEW: Navigate to Daily Life Card
  const handleNavigateToDailyLifeCard = () => {
    setShowShareModal(false);
    navigation.navigate('DailyLifeCard');
  };

  // Post management handlers - show action sheet first
  const handlePostOptions = (post: any) => {
    if (postSelectionMode) {
      // Already in selection mode, just toggle this post
      togglePostSelection(post.id);
    } else {
      // Show action sheet with options (restored original behavior)
      setSelectedPost(post);
      setShowPostOptions(true);
    }
  };

  // Enter selection mode for delete (triggered from action sheet "Delete" option)
  const enterPostDeleteSelectionMode = (post: any) => {
    setShowPostOptions(false);
    setSelectedPost(null);
    setPostSelectionMode(true);
    setSelectedPosts(new Set([post.id]));
  };

  // Toggle post selection
  // Handle post tap in selection mode
  const handlePostTap = (post: any) => {
    if (postSelectionMode) {
      togglePostSelection(post.id);
      return;
    }

    if (post.type === 'system' && post.isAssignmentRelated && post.assignmentId) {
      const assignment = assignments.find((a: any) => a.id === post.assignmentId);
      if (assignment) {
        setSelectedAssignment(assignment);
        setShowAssignmentOptions(true);
      }
      return;
    }
  };

  const handleChallengePress = (challenge: any) => {
    navigation.navigate('Home', { screen: 'Challenges', params: { focusChallengeId: challenge.id } });
  };

  const handleAiSuggestChallenge = async () => {
    if (!challengePrompt.trim()) {
      Alert.alert('AI Assist', 'Describe the challenge you want.');
      return;
    }

    setAiSuggestingChallenge(true);
    try {
      const response = await aiApi.suggestChallenge(challengePrompt.trim());
      if (response.success && response.data) {
        setChallengeTitle(response.data.title || challengeTitle);
        setChallengeType(response.data.type || 'TASKS_COMPLETED');
        setChallengeTarget(String(response.data.targetValue || 10));
        setChallengeDays(String(response.data.days || 7));
        setChallengeXP(Number(response.data.xpReward || 100));
        if (response.data.category) {
          setChallengeCategory(response.data.category);
        }
        if (response.data.description) {
          setChallengeDescription(response.data.description);
        }
      } else {
        Alert.alert('AI Assist', response.error || 'AI is unavailable right now.');
      }
    } catch (error) {
      console.error('AI suggest failed:', error);
      Alert.alert('AI Assist', 'Failed to generate a challenge.');
    } finally {
      setAiSuggestingChallenge(false);
    }
  };

  const handleDeletePost = (postId: number | string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await postsApi.delete(String(postId));
              if (response.success) {
                setPosts(prev => prev.filter(p => p.id !== postId));
                setShowPostOptions(false);
                setSelectedPost(null);
              } else {
                Alert.alert('Error', response.error || 'Failed to delete post');
              }
            } catch (error) {
              console.error('Failed to delete post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEditPost = async (post: any) => {
    setShowPostOptions(false);
    
    // If it's an assignment-related system post, go directly to edit mission modal
    if (post.type === 'system' && post.isAssignmentRelated && post.assignmentId) {
      // First try to find the full assignment in our assignments array
      let assignment = assignments.find(a => a.id === post.assignmentId);
      
      // If not found locally, fetch it from the API
      if (!assignment) {
        try {
          const response = await assignmentsApi.getById(post.assignmentId);
          if (response.success && response.data) {
            const a = response.data;
            assignment = {
              id: a.id,
              title: a.title,
              description: a.description,
              assignedById: a.creatorId || a.creator?.id,
              assignedToId: a.assigneeId || a.assignee?.id,
              assignedBy: a.creator?.name || a.creator?.username || 'Unknown',
              assignedTo: a.assignee?.name || a.assignee?.username || 'Unknown',
              status: a.status?.toLowerCase() || 'pending',
              dueDate: a.dueDate,
              xpReward: a.xpReward || 50,
              repeatEnabled: a.repeatEnabled || false,
              repeatFrequency: a.repeatFrequency,
              requireProof: a.requireProof || false,
            };
          }
        } catch (error) {
          console.error('Failed to fetch assignment:', error);
        }
      }
      
      if (!assignment) {
        Alert.alert('Mission Not Found', 'This mission may have been deleted.');
        return;
      }
      
      // Check if user is the sender - only sender can edit the mission
      if (user?.id === assignment.assignedById) {
        // Go directly to edit mission modal
        setSelectedAssignment(assignment);
        openEditAssignmentModal(assignment);
      } else {
        // User is the recipient, they can't edit the mission details
        Alert.alert('Cannot Edit', 'Only the person who sent this mission can edit it.');
      }
      return;
    }
    
    // For regular posts, show edit modal directly
    if (post.type === 'system') {
      setEditPostContent(post.systemText || '');
    } else {
      setEditPostContent(post.content || post.note || '');
    }
    setShowEditPostModal(true);
  };

  const handleHidePost = (postId: string) => {
    setHiddenPostIds(prev => new Set([...prev, postId]));
    setShowPostOptions(false);
    setSelectedPost(null);
    // Show brief feedback
    Alert.alert(
      'Post Hidden',
      'This post has been hidden from your feed.',
      [{ text: 'OK' }]
    );
  };

  const handleUnhideAllPosts = () => {
    setHiddenPostIds(new Set());
    Alert.alert('Posts Restored', 'All hidden posts are now visible again.');
  };

  const handleSavePostEdit = async () => {
    if (!selectedPost || !editPostContent.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }

    try {
      // Update the post in local state
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === selectedPost.id) {
            if (post.type === 'system') {
              return {
                ...post,
                systemText: editPostContent.trim(),
                isEdited: true,
                editedAt: new Date().toISOString(),
              };
            } else {
              return {
                ...post,
                note: editPostContent.trim(),
                isEdited: true,
                editedAt: new Date().toISOString(),
              };
            }
          }
          return post;
        })
      );

      // TODO: In production, call API to update post and send notification
      // await postsApi.updatePost(selectedPost.id, { content: editPostContent.trim() });

      setShowEditPostModal(false);
      setSelectedPost(null);
      setEditPostContent('');
      
      // Show success feedback
      Alert.alert(
        'Post Updated',
        'Your changes have been saved. The recipient will be notified.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to update post:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    }
  };

  // Member management handlers (admin only)
  const handleMemberOptions = (member: any) => {
    setSelectedMember(member);
    setShowMemberOptions(true);
  };

  const handleRemoveMember = (memberId: string) => {
    const member = circleMembers.find(m => m.id === memberId);
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member?.name} from this circle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setCircleMembers(prev => prev.filter(m => m.id !== memberId));
            setShowMemberOptions(false);
            setSelectedMember(null);
          }
        }
      ]
    );
  };

  const handleToggleAdmin = (memberId: string) => {
    const member = circleMembers.find(m => m.id === memberId);
    const isAdmin = member?.role === 'admin';
    
    Alert.alert(
      isAdmin ? 'Remove Admin' : 'Make Admin',
      isAdmin 
        ? `Remove admin privileges from ${member?.name}?`
        : `Make ${member?.name} an admin of this circle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setCircleMembers(prev =>
              prev.map(m =>
                m.id === memberId
                  ? { ...m, role: isAdmin ? 'member' : 'admin' }
                  : m
              )
            );
            setShowMemberOptions(false);
            setSelectedMember(null);
          }
        }
      ]
    );
  };

  // Circle settings handlers (admin only)
  const handleSaveCircleSettings = async () => {
    try {
      const response = await circlesApi.update(circleId, {
        name: editCircleName || circleName,
        emoji: editCircleEmoji || circleEmoji,
        // Include any other settings being edited
      });
      if (response.success) {
        Alert.alert('Settings Saved', 'Circle settings have been updated.');
        setShowCircleSettings(false);
        // Refresh circle data
        fetchCircleMembers();
      } else {
        Alert.alert('Error', response.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save circle settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const handleDeleteCircle = () => {
    Alert.alert(
      'Delete Circle',
      'Are you sure you want to delete this circle? This action cannot be undone and all members will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await circlesApi.delete(circleId);
              if (response.success) {
                setShowCircleSettings(false);
                navigation.goBack();
              } else {
                Alert.alert('Error', response.error || 'Failed to delete circle');
              }
            } catch (error) {
              console.error('Failed to delete circle:', error);
              Alert.alert('Error', 'Failed to delete circle. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Assignment management handlers (from circles page)
  const handleAssignmentOptions = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowAssignmentOptions(true);
  };

  // Check if current user is the sender of the assignment
  const isAssignmentSender = (assignment: any) => {
    return user?.id === assignment.assignedById;
  };

  // Check if current user is the recipient of the assignment
  const isAssignmentRecipient = (assignment: any) => {
    return user?.id === assignment.assignedToId;
  };

  // Open edit assignment modal (for sender)
  const openEditAssignmentModal = (assignment: any) => {
    setShowAssignmentOptions(false);
    
    // Parse the due date to determine if it's today, tomorrow, or custom
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
    setShowEditAssignmentModal(true);
  };

  // Save edited assignment (sender only)
  const handleSaveAssignmentEdit = async () => {
    if (!selectedAssignment) return;
    
    setEditingAssignment(true);
    try {
      // Calculate due date based on editDueDay
      let dueDate = new Date();
      if (editDueDay === 'tomorrow') {
        dueDate.setDate(dueDate.getDate() + 1);
      } else if (editDueDay === 'custom') {
        dueDate = new Date(editCustomDueDate);
      }
      
      // Set the time from the time picker
      if (editAssignmentData.dueTime) {
        dueDate.setHours(editAssignmentData.dueTime.getHours(), editAssignmentData.dueTime.getMinutes(), 0, 0);
      }
      
      const dueDateISO = dueDate.toISOString();

      const response = await assignmentsApi.update(String(selectedAssignment.id), {
        title: editAssignmentData.title,
        description: editAssignmentData.description || null,
        dueDate: dueDateISO,
        xpReward: editAssignmentData.xpReward,
        repeatEnabled: editAssignmentData.repeatEnabled,
        repeatFrequency: editAssignmentData.repeatEnabled ? editAssignmentData.repeatFrequency : null,
        requireProof: editAssignmentData.requireProof,
      });

      if (response.success) {
        Alert.alert('Success', 'Mission updated! The recipient has been notified.');
        await fetchAssignments();
        await fetchFeed(); // Refresh feed to show updated system post
        setShowEditAssignmentModal(false);
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

  // Decline an accepted assignment (recipient only)
  const handleDeclineAccepted = (assignment: any) => {
    setShowAssignmentOptions(false);
    setDeclineAssignmentId(assignment.id);
    setDeclineAssignmentTitle(assignment.title);
    setDeclineReason('');
    setShowDeclineModal(true);
  };

  // Accept a pending/declined assignment and navigate to Plan
  const handleAcceptAndGoToPlan = async (assignment: any) => {
    setShowAssignmentOptions(false);
    try {
      const response = await assignmentsApi.accept(String(assignment.id));
      if (response.success) {
        Alert.alert(
          'Mission Accepted! 🎯',
          'This mission has been added to your tasks.',
          [
            {
              text: 'Go to Plan',
              onPress: () => navigation.navigate('Plan'),
            },
            { text: 'Stay Here', style: 'cancel' },
          ]
        );
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

  // Confirm decline with reason
  const confirmDeclineAssignment = async (withReason: boolean) => {
    if (!declineAssignmentId) return;
    
    setDecliningInProgress(true);
    try {
      const response = await assignmentsApi.decline(
        String(declineAssignmentId),
        withReason && declineReason.trim() ? declineReason.trim() : undefined
      );

      if (response.success) {
        Alert.alert('Mission Declined', 'The sender has been notified.');
        await fetchAssignments();
        await fetchFeed();
        setShowDeclineModal(false);
        setDeclineAssignmentId(null);
        setDeclineReason('');
      } else {
        Alert.alert('Error', response.error || 'Failed to decline mission');
      }
    } catch (error) {
      console.error('Failed to decline assignment:', error);
      Alert.alert('Error', 'Failed to decline mission');
    } finally {
      setDecliningInProgress(false);
    }
  };


  // Post Card Component
  const PostCard = ({ post }: { post: any }) => {
    const isSelected = selectedPosts.has(post.id);
    
    // Handle long press - check if it's an assignment-related post
    const handleLongPress = () => {
      if (postSelectionMode) {
        togglePostSelection(post.id);
        return;
      }
      
      // Always show regular post options first
      handlePostOptions(post);
    };
    
    // Handle challenge post type
    if (post.type === 'challenge') {
      let challengeData;
      try {
        challengeData = typeof post.content === 'string' ? JSON.parse(post.content) : post.content;
      } catch (e) {
        return null;
      }
      const postCategory = challengeData?.category || extractChallengeCategory(challengeData?.description);

      return (
        <Pressable 
          onPress={() => {
            Alert.alert(
              `${challengeData.emoji} ${challengeData.title}`,
              `Target: ${challengeData.targetValue} ${
                challengeData.type === 'FOCUS_MINUTES' ? 'minutes' :
                challengeData.type === 'TASKS_COMPLETED' ? 'tasks' : 'days'
              }\nReward: ${challengeData.xpReward} XP${postCategory ? `\nCategory: ${postCategory}` : ''}`,
              [
                { text: 'Later', style: 'cancel' },
                { 
                  text: 'Join Challenge',
                  onPress: async () => {
                    try {
                      const response = await challengesApi.join(challengeData.challengeId);
                      if (response.success) {
                        Alert.alert('Joined!', 'You\'ve joined the challenge!');
                        fetchChallenges();
                      }
                    } catch (error) {
                      console.error('Failed to join:', error);
                    }
                  }
                }
              ]
            );
          }}
          style={({ pressed }) => [
            styles.systemCard,
            pressed && styles.postCardPressed,
            { borderLeftWidth: 4, borderLeftColor: Colors.primary }
          ]}
        >
          <View style={styles.systemCardContent}>
            <View style={[styles.systemIconContainer, { backgroundColor: '#ede9fe' }]}>
              <Text style={{ fontSize: 24 }}>{challengeData.emoji}</Text>
            </View>
            <View style={styles.systemTextContainer}>
              <Text style={[styles.systemText, { fontWeight: '600' }]}>
                {post.author?.name || 'Someone'} created a challenge
              </Text>
              <Text style={[styles.systemText, { fontSize: 15, marginTop: 4 }]}>
                {challengeData.title}
              </Text>
              {postCategory && (
                <View style={{
                  alignSelf: 'flex-start',
                  backgroundColor: Colors.primaryLight,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                  marginTop: 6,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.primary }}>
                    {postCategory}
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                <Text style={styles.systemTime}>
                  {challengeData.type === 'FOCUS_MINUTES' ? `🧠 ${challengeData.targetValue} min` :
                   challengeData.type === 'TASKS_COMPLETED' ? `✅ ${challengeData.targetValue} tasks` :
                   `🔥 ${challengeData.targetValue} day streak`}
                </Text>
                <Text style={[styles.systemTime, { color: Colors.success }]}>
                  +{challengeData.xpReward} XP
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      );
    }
    
    if (post.type === 'system') {
      const iconColor = post.iconName === 'award' ? '#10B981' : 
                        post.iconName === 'check-circle' ? '#8B5CF6' :
                        post.iconName === 'user-plus' ? '#F59E0B' :
                        Colors.textSecondary;
      return (
        <Pressable 
          onPress={() => handlePostTap(post)}
          onLongPress={handleLongPress}
          delayLongPress={400}
          style={({ pressed }) => [
            styles.systemCard,
            pressed && styles.postCardPressed,
            isSelected && postSelectionStyles.selectedCard
          ]}
        >
          {/* Selection Checkbox */}
          {postSelectionMode && (
            <TouchableOpacity 
              style={postSelectionStyles.checkboxRow}
              onPress={() => togglePostSelection(post.id)}
              activeOpacity={0.7}
            >
              <View style={[
                postSelectionStyles.checkbox,
                isSelected && postSelectionStyles.checkboxSelected
              ]}>
                {isSelected && (
                  <Feather name="check" size={14} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          )}
          <View style={styles.systemCardContent}>
            <View style={[styles.systemIconContainer, { backgroundColor: `${iconColor}20` }]}>
              <Feather name={post.iconName || "info"} size={20} color={iconColor} />
            </View>
            <View style={styles.systemTextContainer}>
              <View style={styles.systemTextRow}>
                <Text style={styles.systemText}>{post.systemText}</Text>
                {post.isEdited && (
                  <View style={styles.editedBadge}>
                    <Feather name="edit-2" size={10} color="#64748B" />
                    <Text style={styles.editedBadgeText}>Edited</Text>
                  </View>
                )}
              </View>
              <Text style={styles.systemTime}>{post.dueTime}</Text>
            </View>
          </View>
        </Pressable>
      );
    }

    return (
      <Pressable 
        onPress={() => handlePostTap(post)}
        onLongPress={() => handlePostOptions(post)}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.postCard,
          pressed && styles.postCardPressed,
          isSelected && postSelectionStyles.selectedCard
        ]}
      >
        {/* Selection Checkbox */}
        {postSelectionMode && (
          <TouchableOpacity 
            style={postSelectionStyles.checkboxRow}
            onPress={() => togglePostSelection(post.id)}
            activeOpacity={0.7}
          >
            <View style={[
              postSelectionStyles.checkbox,
              isSelected && postSelectionStyles.checkboxSelected
            ]}>
              {isSelected && (
                <Feather name="check" size={14} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        )}
        {/* Header */}
        <View style={styles.postHeader}>
          <View style={styles.postUserInfo}>
            <LinearGradient
              colors={['#a78bfa', '#7c3aed']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{post.user.initial}</Text>
            </LinearGradient>
            <View style={styles.userDetails}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>{post.user.name}</Text>
                {circleMembers.find(m => m.name === post.user.name)?.role === 'admin' && (
                  <View style={styles.adminBadgeSmall}>
                    <Text style={styles.adminBadgeSmallText}>Admin</Text>
                  </View>
                )}
                {post.isEdited && (
                  <View style={styles.editedBadge}>
                    <Feather name="edit-2" size={10} color="#64748B" />
                    <Text style={styles.editedBadgeText}>Edited</Text>
                  </View>
                )}
              </View>
              <Text style={styles.postTime}>{post.time}</Text>
            </View>
          </View>
        </View>

        {/* Note if edited */}
        {post.note && (
          <View style={styles.postNoteContainer}>
            <Text style={styles.postNoteText}>{post.note}</Text>
          </View>
        )}

        {/* Stats - only show if missions data exists */}
        {post.missions && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Missions</Text>
              <Text style={styles.statValue}>{post.missions.completed}/{post.missions.total}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Time Saved</Text>
              <Text style={[styles.statValue, { color: Colors.success }]}>{post.wallet || '-'}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="fire" size={16} color={Colors.orange} />
              <Text style={[styles.statValue, { color: Colors.orange }]}>{post.streak || 0}</Text>
            </View>
          </View>
        )}

        {/* Reactions - with null checks */}
        {post.reactions && (
          <View style={styles.reactionsContainer}>
            <TouchableOpacity 
              style={[styles.reactionButton, post.userReaction === '❤️' && styles.reactionButtonActive]}
              onPress={() => handleReaction(post.id, 'heart')}
            >
              <Feather name="heart" size={16} color={post.userReaction === '❤️' ? '#EF4444' : Colors.textMuted} />
              <Text style={styles.reactionCount}>{post.reactions.heart || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.reactionButton, post.userReaction === '🔥' && styles.reactionButtonActive]}
              onPress={() => handleReaction(post.id, 'fire')}
            >
              <MaterialCommunityIcons name="fire" size={16} color={post.userReaction === '🔥' ? Colors.orange : Colors.textMuted} />
              <Text style={styles.reactionCount}>{post.reactions.fire || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.reactionButton, post.userReaction === '👏' && styles.reactionButtonActive]}
              onPress={() => handleReaction(post.id, 'clap')}
            >
              <Text style={styles.clapEmoji}>👏</Text>
              <Text style={styles.reactionCount}>{post.reactions.clap || 0}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Selection Mode Header (WhatsApp style) */}
      {postSelectionMode && (
        <View style={postSelectionStyles.header}>
          <TouchableOpacity 
            style={postSelectionStyles.cancelButton}
            onPress={cancelPostSelectionMode}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={postSelectionStyles.headerText}>
            {selectedPosts.size} selected
          </Text>
          <View style={postSelectionStyles.headerActions}>
            <TouchableOpacity 
              style={postSelectionStyles.deleteButton}
              onPress={deleteSelectedPosts}
              disabled={deletingSelectedPosts || selectedPosts.size === 0}
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

      {/* Header - hide when in selection mode */}
      {!postSelectionMode && (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={24} color={Colors.textSecondary} />
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
            onPress={() => setShowMembersModal(true)}
            style={styles.headerIconButton}
          >
            <Feather name="users" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowActionMenu(true)}
            style={styles.headerIconButton}
          >
            <Feather name="more-vertical" size={22} color={Colors.textSecondary} />
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
              members={circleMembers}
              onShareDay={handleShareToday}
              onAssignMission={() => modals.setShowAssignModal(true)}
              onInvite={() => modals.setShowInviteSheet(true)}
              onViewAll={() => {
                setCircleTab('feed');
                setFeedFilter('all');
              }}
              onMemberPress={handleViewMember}
            />

            {/* Navigation Tabs - 2 rows of 3 */}
            <View style={styles.navigationGrid}>
              {/* Row 1: Main Tabs */}
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
                      color={circleTab === tab ? Colors.white : Colors.textSecondary} 
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
              
              {/* Row 2: Filters - Only show when on Feed tab */}
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
                        color={feedFilter === filter ? Colors.white : Colors.textSecondary} 
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

            {/* Posts - With Empty State and Loading */}
            {loadingFeed ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Loading feed...</Text>
              </View>
            ) : posts.length === 0 ? (
              <View style={{
                padding: 40,
                alignItems: 'center',
                backgroundColor: Colors.surface,
                borderRadius: 16,
                marginTop: 8,
              }}>
                <Feather name="message-circle" size={48} color={Colors.textMuted} />
                <Text style={{ 
                  marginTop: 16, 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: Colors.textPrimary,
                  textAlign: 'center' 
                }}>
                  No posts yet
                </Text>
                <Text style={{ 
                  marginTop: 8, 
                  color: Colors.textSecondary, 
                  textAlign: 'center',
                  paddingHorizontal: 20,
                }}>
                  Be the first to share your day with the circle!
                </Text>
                {!userPosted && todayStats.total > 0 && (
                  <TouchableOpacity 
                    onPress={handleShareToday}
                    style={{ marginTop: 16 }}
                  >
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
                {/* Show unhide option if there are hidden posts */}
                {hiddenPostIds.size > 0 && (
                  <TouchableOpacity 
                    onPress={handleUnhideAllPosts}
                    style={styles.hiddenPostsBanner}
                  >
                    <Feather name="eye-off" size={16} color={Colors.textSecondary} />
                    <Text style={styles.hiddenPostsText}>
                      {hiddenPostIds.size} hidden post{hiddenPostIds.size > 1 ? 's' : ''} • Tap to show all
                    </Text>
                  </TouchableOpacity>
                )}
                {(() => {
                  const filteredPosts = posts
                    .filter(post => !hiddenPostIds.has(post.id))
                    .filter(post => {
                      // Apply feed filter
                      if (feedFilter === 'all') return true;
                      if (feedFilter === 'checkins') return post.type === 'receipt';
                      if (feedFilter === 'assignments') return post.type === 'system' && post.isAssignmentRelated;
                      return true;
                    });
                  
                  if (filteredPosts.length === 0 && feedFilter !== 'all') {
                    return (
                      <View style={styles.filterEmptyState}>
                        <Feather 
                          name={feedFilter === 'checkins' ? 'check-square' : 'target'} 
                          size={32} 
                          color={Colors.textSecondary} 
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
                  
                  return filteredPosts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ));
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
              members={circleMembers}
              isCurrentUserAdmin={isCurrentUserAdmin}
              currentUserName={(user?.name || user?.username || 'You').charAt(0).toUpperCase()}
              loadingMembers={loadingMembers}
              onMemberPress={(member) => isCurrentUserAdmin ? handleMemberOptions(member) : handleViewMember(member)}
              onMemberLongPress={(member) => isCurrentUserAdmin && handleMemberOptions(member)}
              onAssignToMember={handleAssignToMember}
              onInvite={() => modals.setShowInviteSheet(true)}
            />
          </View>
        )}

        {/* Challenges Tab - Reserved for friend's implementation */}
        {circleTab === 'challenges' && (
          <View>
            <View style={styles.challengeSectionHeader}>
              <Text style={styles.sectionTitle}>CHALLENGES</Text>
              <TouchableOpacity
                style={styles.challengeSectionAction}
                onPress={() => navigation.navigate('Home', { screen: 'Challenges', params: { focusCircleId: circleId } })}
              >
                <Text style={styles.challengeSectionActionText}>View all</Text>
                <Feather name="chevron-right" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            {loadingChallenges ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Loading challenges...</Text>
              </View>
            ) : circleChallenges.length === 0 ? (
              <View style={{
                padding: 40,
                alignItems: 'center',
                backgroundColor: Colors.surface,
                borderRadius: 16,
                marginTop: 8,
              }}>
                <MaterialCommunityIcons name="trophy-outline" size={48} color={Colors.textMuted} />
                <Text style={{ 
                  marginTop: 16, 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: Colors.textPrimary,
                  textAlign: 'center' 
                }}>
                  No challenges yet
                </Text>
                <Text style={{ 
                  marginTop: 8, 
                  color: Colors.textSecondary, 
                  textAlign: 'center',
                  paddingHorizontal: 20,
                }}>
                  Create a challenge in the Challenges screen and select this circle to get started!
                </Text>
                <TouchableOpacity 
                  onPress={() => navigation?.navigate('Home', { screen: 'Challenges' })}
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
                      category: challengeCategory,
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
              onPress={() => setShowCreateChallengeModal(true)}
              style={styles.startNewChallengeButton}
            >
              <Feather name="plus" size={20} color={Colors.primary} />
              <Text style={styles.startNewChallengeText}>Create Challenge</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Options</Text>

            <TouchableOpacity
              onPress={() => {
                setShowActionMenu(false);
                setTimeout(() => setShowAssignModal(true), 300);
              }}
              style={styles.sheetOption}
            >
              <Feather name="plus-circle" size={24} color={Colors.primary} />
              <Text style={styles.sheetOptionText}>Assign Mission</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowActionMenu(false);
                setTimeout(() => setShowInviteSheet(true), 300);
              }}
              style={styles.sheetOption}
            >
              <Feather name="share" size={24} color="#3b82f6" />
              <Text style={styles.sheetOptionText}>Invite Members</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowActionMenu(false);
                setTimeout(() => setShowCircleSettings(true), 300);
              }}
              style={styles.sheetOption}
            >
              <Feather name="more-horizontal" size={24} color={Colors.textSecondary} />
              <Text style={styles.sheetOptionText}>Circle Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLeaveCircle}
              style={[styles.sheetOption, { borderBottomWidth: 0 }]}
            >
              <Feather name="log-out" size={24} color={Colors.danger} />
              <Text style={[styles.sheetOptionText, { color: Colors.danger }]}>Leave Circle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowActionMenu(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Invite Modal */}
      <Modal
        visible={showInviteSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteSheet(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowInviteSheet(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.sheetTitle}>Invite to {circleName}</Text>
              <TouchableOpacity onPress={() => setShowInviteSheet(false)}>
                <Feather name="x" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Share Link Section */}
            <View style={styles.inviteLinkSection}>
              <Text style={styles.inviteLabel}>Invite Link</Text>
              <View style={styles.inviteLinkRow}>
                <Text style={styles.inviteLinkText} numberOfLines={1}>{inviteLink}</Text>
              </View>
              <View style={styles.inviteLinkButtons}>
                <TouchableOpacity
                  onPress={handleShareLink}
                  style={styles.inviteShareLinkButton}
                >
                  <Feather name="share" size={18} color={Colors.white} />
                  <Text style={styles.inviteShareLinkText}>Share link</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCopyInvite(inviteLink, 'link')}
                  style={styles.inviteCopyLinkButton}
                >
                  <Feather 
                    name={copySuccess === 'link' ? 'check' : 'copy'} 
                    size={18} 
                    color={copySuccess === 'link' ? Colors.success : Colors.primary} 
                  />
                  <Text style={[
                    styles.inviteCopyLinkText,
                    copySuccess === 'link' && { color: Colors.success }
                  ]}>
                    {copySuccess === 'link' ? 'Copied' : 'Copy link'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.inviteDivider} />

            {/* Large Invite Code */}
            <View style={styles.inviteCodeSection}>
              <Text style={styles.inviteCodeLabel}>Or share this code</Text>
              <View style={styles.inviteCodeDisplay}>
                <Text style={styles.inviteCodeBig}>{inviteCode}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleCopyInvite(inviteCode, 'code')}
                style={styles.inviteCopyCodeButton}
              >
                <Feather 
                  name={copySuccess === 'code' ? 'check' : 'copy'} 
                  size={18} 
                  color={copySuccess === 'code' ? Colors.success : Colors.primary} 
                />
                <Text style={[
                  styles.inviteCopyCodeText,
                  copySuccess === 'code' && { color: Colors.success }
                ]}>
                  {copySuccess === 'code' ? 'Copied!' : 'Copy code'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.inviteHelperText}>
                Others can join using this code in the app
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Decline Mission Modal - iOS Action Sheet Style */}
      <Modal
        visible={showDeclineModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowDeclineModal(false);
          setDeclineAssignmentId(null);
          setDeclineReason('');
        }}
      >
        <View style={[styles.modalOverlay, { justifyContent: 'center', alignItems: 'center' }]}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              setShowDeclineModal(false);
              setDeclineAssignmentId(null);
              setDeclineReason('');
            }}
          />
          
          {/* Modal Content */}
          <View style={{
            backgroundColor: Colors.background,
            borderRadius: 20,
            marginHorizontal: 20,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
            width: SCREEN_WIDTH - 40,
          }}>
            {/* Header */}
            <View style={{
              paddingTop: 24,
              paddingHorizontal: 24,
              paddingBottom: 16,
              alignItems: 'center',
            }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#fff5f5',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Feather name="x-circle" size={28} color={Colors.danger} />
              </View>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: Colors.textPrimary,
                marginBottom: 8,
              }}>
                Decline Mission?
              </Text>
              <Text style={{
                fontSize: 15,
                color: Colors.textSecondary,
                textAlign: 'center',
                lineHeight: 22,
              }}>
                Would you like to share why you're declining{'\n'}"{declineAssignmentTitle}"?
              </Text>
            </View>
            
            {/* Reason Input */}
            <View style={{
              paddingHorizontal: 20,
              paddingBottom: 16,
            }}>
              <TextInput
                style={{
                  backgroundColor: Colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingTop: 14,
                  paddingBottom: 14,
                  fontSize: 16,
                  color: Colors.textPrimary,
                  minHeight: 100,
                  textAlignVertical: 'top',
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
                placeholder="e.g., I have a prior commitment, busy with exams..."
                placeholderTextColor={Colors.textMuted}
                value={declineReason}
                onChangeText={setDeclineReason}
                multiline
                maxLength={200}
                autoFocus={false}
              />
              <Text style={{
                fontSize: 12,
                color: Colors.textMuted,
                textAlign: 'right',
                marginTop: 6,
              }}>
                {declineReason.length}/200 (optional)
              </Text>
            </View>
            
            {/* Quick Reason Chips */}
            <View style={{
              paddingHorizontal: 20,
              paddingBottom: 20,
            }}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {['Busy right now', 'Not enough time', 'Already have plans', 'Not feeling well'].map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => setDeclineReason(chip)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      backgroundColor: declineReason === chip ? Colors.primaryLight : Colors.surface,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: declineReason === chip ? Colors.primary : Colors.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      color: declineReason === chip ? Colors.primary : Colors.textSecondary,
                      fontWeight: '500',
                    }}>
                      {chip}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Action Buttons */}
            <View style={{
              borderTopWidth: 1,
              borderTopColor: Colors.border,
            }}>
              {/* Decline with Reason */}
              <TouchableOpacity
                onPress={() => confirmDeclineAssignment(true)}
                disabled={decliningInProgress}
                style={{
                  paddingVertical: 16,
                  alignItems: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.border,
                  opacity: decliningInProgress ? 0.5 : 1,
                }}
              >
                {decliningInProgress ? (
                  <ActivityIndicator color={Colors.danger} />
                ) : (
                  <Text style={{
                    fontSize: 17,
                    fontWeight: '600',
                    color: Colors.danger,
                  }}>
                    {declineReason.trim() ? 'Decline with Reason' : 'Decline without Reason'}
                  </Text>
                )}
              </TouchableOpacity>
              
              {/* Cancel */}
              <TouchableOpacity
                onPress={() => {
                  setShowDeclineModal(false);
                  setDeclineAssignmentId(null);
                  setDeclineReason('');
                }}
                disabled={decliningInProgress}
                style={{
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: Colors.primary,
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Challenge Modal - Simplified */}
      <Modal
        visible={showCreateChallengeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateChallengeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowCreateChallengeModal(false)}
          />
          <View style={[styles.bottomSheet, { maxHeight: '75%' }]} pointerEvents="auto">
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>🏆 Create Challenge</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Challenge Title */}
              <Text style={styles.inputLabel}>Challenge Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Complete 10 tasks"
                value={challengeTitle}
                onChangeText={setChallengeTitle}
                maxLength={50}
              />

              {/* AI Assist */}
              <Text style={[styles.inputLabel, { marginTop: 8 }]}>AI Assist (optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Describe the challenge you want..."
                value={challengePrompt}
                onChangeText={setChallengePrompt}
                maxLength={120}
              />
              <TouchableOpacity
                onPress={handleAiSuggestChallenge}
                disabled={aiSuggestingChallenge}
                style={{
                  backgroundColor: Colors.primaryLight,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginTop: -6,
                  marginBottom: 8,
                }}
              >
                {aiSuggestingChallenge ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={{ color: Colors.primary, fontWeight: '600' }}>✨ Generate with AI</Text>
                )}
              </TouchableOpacity>

              {/* Challenge Type */}
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Challenge Type</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  style={[styles.typeChip, challengeType === 'TASKS_COMPLETED' && styles.typeChipActive]}
                  onPress={() => setChallengeType('TASKS_COMPLETED')}
                >
                  <Text style={[styles.typeChipText, challengeType === 'TASKS_COMPLETED' && styles.typeChipTextActive]}>
                    ✅ Tasks
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeChip, challengeType === 'FOCUS_MINUTES' && styles.typeChipActive]}
                  onPress={() => setChallengeType('FOCUS_MINUTES')}
                >
                  <Text style={[styles.typeChipText, challengeType === 'FOCUS_MINUTES' && styles.typeChipTextActive]}>
                    🧠 Focus
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeChip, challengeType === 'STREAK_DAYS' && styles.typeChipActive]}
                  onPress={() => setChallengeType('STREAK_DAYS')}
                >
                  <Text style={[styles.typeChipText, challengeType === 'STREAK_DAYS' && styles.typeChipTextActive]}>
                    🔥 Streak
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Category */}
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Category</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {['Productivity', 'Fitness', 'Wellness', 'Learning', 'Social'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.typeChip, challengeCategory === cat && styles.typeChipActive]}
                    onPress={() => setChallengeCategory(cat as any)}
                  >
                    <Text style={[styles.typeChipText, challengeCategory === cat && styles.typeChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Description */}
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Description (optional)</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Short details for the challenge"
                value={challengeDescription}
                onChangeText={setChallengeDescription}
                maxLength={140}
                multiline
              />

              {/* Target */}
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                Target {challengeType === 'TASKS_COMPLETED' ? 'Tasks' : 
                       challengeType === 'FOCUS_MINUTES' ? 'Minutes' : 'Days'}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="10"
                value={challengeTarget}
                onChangeText={setChallengeTarget}
                keyboardType="number-pad"
                maxLength={4}
              />

              {/* Duration */}
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Duration (Days)</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {['3', '7', '14', '30'].map(days => (
                  <TouchableOpacity
                    key={days}
                    style={[styles.typeChip, challengeDays === days && styles.typeChipActive]}
                    onPress={() => setChallengeDays(days)}
                  >
                    <Text style={[styles.typeChipText, challengeDays === days && styles.typeChipTextActive]}>
                      {days}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* XP Reward */}
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>XP Reward</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {[50, 100, 150, 200].map(xp => (
                  <TouchableOpacity
                    key={xp}
                    style={[styles.typeChip, challengeXP === xp && styles.typeChipActive]}
                    onPress={() => setChallengeXP(xp)}
                  >
                    <Text style={[styles.typeChipText, challengeXP === xp && styles.typeChipTextActive]}>
                      {xp} XP
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowCreateChallengeModal(false)}
                style={[styles.modalButton, { flex: 1, backgroundColor: Colors.surface }]}
                disabled={creatingChallenge}
              >
                <Text style={[styles.modalButtonText, { color: Colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateChallenge}
                style={[styles.modalButton, { flex: 2 }]}
                disabled={creatingChallenge || !challengeTitle.trim()}
              >
                {creatingChallenge ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalButtonText}>Create Challenge</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Submit Proof Modal */}
      <Modal
        visible={showSubmitProofModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSubmitProofModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowSubmitProofModal(false)}
          />
          <View style={[styles.bottomSheet, { maxHeight: '70%' }]} pointerEvents="auto">
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>📸 Submit Proof</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Proof Link (photo or file)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://..."
                value={proofUrl}
                onChangeText={setProofUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={[styles.inputLabel, { marginTop: 8 }]}>Note (optional)</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Add a short note..."
                value={proofNote}
                onChangeText={setProofNote}
                multiline
              />
              <View style={{ height: 12 }} />
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowSubmitProofModal(false)}
                style={[styles.modalButton, { flex: 1, backgroundColor: Colors.surface }]}
                disabled={submittingProof}
              >
                <Text style={[styles.modalButtonText, { color: Colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitProofAndComplete}
                style={[styles.modalButton, { flex: 2 }]}
                disabled={submittingProof}
              >
                {submittingProof ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalButtonText}>Submit & Complete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Mission Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { resetAssignForm(); setShowAssignModal(false); setShowMemberPicker(false); }}
      >
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable
            style={StyleSheet.absoluteFillObject}
            pointerEvents={showMemberPicker ? 'none' : 'auto'}
            onPress={() => { resetAssignForm(); setShowAssignModal(false); setShowMemberPicker(false); }}
          />
          <View
            style={[styles.assignModalSheet]}
            pointerEvents="auto"
            onStartShouldSetResponder={() => true}
          >
            {/* Drag Handle */}
            <View style={styles.sheetHandle} />
            
            {/* Header */}
            <View style={styles.assignModalHeader}>
              <Text style={styles.assignModalTitle}>Assign Mission</Text>
              <TouchableOpacity 
                onPress={() => { resetAssignForm(); setShowAssignModal(false); setShowMemberPicker(false); }}
                style={styles.assignModalClose}
              >
                <Feather name="x" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              style={styles.assignModalContent}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {/* Mission Input (Required) */}
              <View style={styles.assignSection}>
                <Text style={styles.assignLabel}>Mission</Text>
                <TextInput
                  placeholder="e.g. Take bins out"
                  value={assignmentTitle}
                  onChangeText={setAssignmentTitle}
                  style={styles.assignInput}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Assign To Picker (Required) */}
              <View style={styles.assignSection}>
                <Text style={styles.assignLabel}>Assign to</Text>
                <TouchableOpacity 
                  style={styles.assignSelectButton}
                  onPress={() => setShowMemberPicker(true)}
                >
                  {assignedMember ? (
                    <View style={styles.assignSelectedMember}>
                      <LinearGradient
                        colors={['#a78bfa', '#7c3aed']}
                        style={styles.assignSelectedAvatar}
                      >
                        <Text style={styles.assignSelectedAvatarText}>{assignedMember.initial}</Text>
                      </LinearGradient>
                      <Text style={styles.assignSelectedName}>{assignedMember.name}</Text>
                    </View>
                  ) : (
                    <Text style={styles.assignSelectPlaceholder}>Select member</Text>
                  )}
                  <Feather name="chevron-down" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Schedule Section */}
              <View style={styles.assignSection}>
                <Text style={styles.assignLabel}>Schedule</Text>
                
                {/* Day Segmented Control */}
                <View style={styles.segmentedControl}>
                  {(['today', 'tomorrow', 'custom'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.segmentOption,
                        dueDay === option && styles.segmentOptionActive
                      ]}
                      onPress={() => {
                        setDueDay(option);
                        if (option === 'custom') {
                          setShowDatePicker(true);
                        }
                      }}
                    >
                      <Text style={[
                        styles.segmentOptionText,
                        dueDay === option && styles.segmentOptionTextActive
                      ]}>
                        {option === 'today' ? 'Today' : option === 'tomorrow' ? 'Tomorrow' : 'Pick date'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Date Picker */}
                {dueDay === 'custom' && (
                  <TouchableOpacity
                    style={[styles.datePickerButton, { marginTop: 12 }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Feather name="calendar" size={18} color={Colors.primary} />
                    <Text style={styles.datePickerButtonText}>{formatDate(customDueDate)}</Text>
                    <Feather name="chevron-down" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}

                {/* iOS Date Picker Modal */}
                {showDatePicker && Platform.OS === 'ios' && (
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={customDueDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setCustomDueDate(selectedDate);
                        }
                      }}
                      minimumDate={new Date()}
                      textColor={Colors.textPrimary}
                    />
                    <TouchableOpacity
                      style={styles.pickerDoneButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.pickerDoneButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Android Date Picker */}
                {showDatePicker && Platform.OS === 'android' && (
                  <DateTimePicker
                    value={customDueDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setCustomDueDate(selectedDate);
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}

                {/* Time Picker */}
                <View style={styles.timePickerRow}>
                  <Text style={styles.timePickerLabel}>Time</Text>
                  <TouchableOpacity 
                    style={styles.timePickerInputWrapper}
                    activeOpacity={0.7}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.timePickerInput}>{formatTime(dueTime)}</Text>
                    <Feather name="clock" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* iOS Time Picker */}
                {showTimePicker && Platform.OS === 'ios' && (
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={dueTime}
                      mode="time"
                      display="spinner"
                      onChange={(event, selectedTime) => {
                        if (selectedTime) {
                          setDueTime(selectedTime);
                        }
                      }}
                      textColor={Colors.textPrimary}
                    />
                    <TouchableOpacity
                      style={styles.pickerDoneButton}
                      onPress={() => setShowTimePicker(false)}
                    >
                      <Text style={styles.pickerDoneButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Android Time Picker */}
                {showTimePicker && Platform.OS === 'android' && (
                  <DateTimePicker
                    value={dueTime}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(false);
                      if (selectedTime) {
                        setDueTime(selectedTime);
                      }
                    }}
                  />
                )}

                {/* Due Summary */}
                <Text style={styles.dueSummary}>{getDueSummary()}</Text>
              </View>

              {/* Repeat Toggle */}
              <View style={styles.assignSection}>
                <View style={styles.toggleRowNew}>
                  <Text style={styles.toggleLabelNew}>Repeat</Text>
                  <TouchableOpacity
                    onPress={() => setRepeatEnabled(!repeatEnabled)}
                    style={[
                      styles.toggleSwitch,
                      repeatEnabled ? styles.toggleSwitchOn : styles.toggleSwitchOff
                    ]}
                  >
                    <View style={[
                      styles.toggleKnob,
                      repeatEnabled ? styles.toggleKnobOn : styles.toggleKnobOff
                    ]} />
                  </TouchableOpacity>
                </View>

                {/* Repeat Options (when enabled) */}
                {repeatEnabled && (
                  <View style={styles.repeatOptions}>
                    {/* Frequency Segmented Control */}
                    <View style={[styles.segmentedControl, { marginTop: 12 }]}>
                      {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                        <TouchableOpacity
                          key={freq}
                          style={[
                            styles.segmentOption,
                            repeatFrequency === freq && styles.segmentOptionActive
                          ]}
                          onPress={() => setRepeatFrequency(freq)}
                        >
                          <Text style={[
                            styles.segmentOptionText,
                            repeatFrequency === freq && styles.segmentOptionTextActive
                          ]}>
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Repeat End Options */}
                    <Text style={[styles.assignLabel, { marginTop: 16, marginBottom: 8 }]}>Repeat ends</Text>
                    
                    <View style={styles.repeatEndOptions}>
                      <TouchableOpacity
                        style={[
                          styles.repeatEndOption,
                          repeatEndType === 'forever' && styles.repeatEndOptionActive
                        ]}
                        onPress={() => setRepeatEndType('forever')}
                      >
                        <View style={[styles.radioOuter, repeatEndType === 'forever' && styles.radioOuterActive]}>
                          {repeatEndType === 'forever' && <View style={styles.radioInner} />}
                        </View>
                        <Text style={styles.repeatEndOptionText}>Forever</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.repeatEndOption,
                          repeatEndType === 'untilDate' && styles.repeatEndOptionActive
                        ]}
                        onPress={() => {
                          setRepeatEndType('untilDate');
                          setShowRepeatEndDatePicker(true);
                        }}
                      >
                        <View style={[styles.radioOuter, repeatEndType === 'untilDate' && styles.radioOuterActive]}>
                          {repeatEndType === 'untilDate' && <View style={styles.radioInner} />}
                        </View>
                        <Text style={styles.repeatEndOptionText}>Until</Text>
                        {repeatEndType === 'untilDate' && (
                          <TouchableOpacity
                            style={styles.repeatEndDateButton}
                            onPress={() => setShowRepeatEndDatePicker(true)}
                          >
                            <Text style={styles.repeatEndDateButtonText}>{formatDate(repeatEndDate)}</Text>
                            <Feather name="calendar" size={14} color={Colors.primary} />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>

                      {/* Repeat End Date Picker - iOS */}
                      {showRepeatEndDatePicker && Platform.OS === 'ios' && (
                        <View style={styles.iosPickerContainer}>
                          <DateTimePicker
                            value={repeatEndDate}
                            mode="date"
                            display="spinner"
                            onChange={(event, selectedDate) => {
                              if (selectedDate) {
                                setRepeatEndDate(selectedDate);
                              }
                            }}
                            minimumDate={new Date()}
                            textColor={Colors.textPrimary}
                          />
                          <TouchableOpacity
                            style={styles.pickerDoneButton}
                            onPress={() => setShowRepeatEndDatePicker(false)}
                          >
                            <Text style={styles.pickerDoneButtonText}>Done</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Repeat End Date Picker - Android */}
                      {showRepeatEndDatePicker && Platform.OS === 'android' && (
                        <DateTimePicker
                          value={repeatEndDate}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => {
                            setShowRepeatEndDatePicker(false);
                            if (selectedDate) {
                              setRepeatEndDate(selectedDate);
                            }
                          }}
                          minimumDate={new Date()}
                        />
                      )}

                      <TouchableOpacity
                        style={[
                          styles.repeatEndOption,
                          repeatEndType === 'count' && styles.repeatEndOptionActive
                        ]}
                        onPress={() => setRepeatEndType('count')}
                      >
                        <View style={[styles.radioOuter, repeatEndType === 'count' && styles.radioOuterActive]}>
                          {repeatEndType === 'count' && <View style={styles.radioInner} />}
                        </View>
                        <Text style={styles.repeatEndOptionText}>After</Text>
                        {repeatEndType === 'count' && (
                          <View style={styles.countStepper}>
                            <TouchableOpacity
                              onPress={() => setRepeatEndCount(Math.max(1, repeatEndCount - 1))}
                              style={styles.stepperButton}
                            >
                              <Feather name="minus" size={16} color={Colors.textSecondary} />
                            </TouchableOpacity>
                            <Text style={styles.stepperValue}>{repeatEndCount}</Text>
                            <TouchableOpacity
                              onPress={() => setRepeatEndCount(repeatEndCount + 1)}
                              style={styles.stepperButton}
                            >
                              <Feather name="plus" size={16} color={Colors.textSecondary} />
                            </TouchableOpacity>
                            <Text style={styles.stepperLabel}>times</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Require Proof Toggle */}
              <View style={styles.assignSection}>
                <View style={styles.toggleRowWithSubtitle}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabelNew}>Require proof</Text>
                    <Text style={styles.toggleSubtitle}>Photo required to complete</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setRequireProof(!requireProof)}
                    style={[
                      styles.toggleSwitch,
                      requireProof ? styles.toggleSwitchOn : styles.toggleSwitchOff
                    ]}
                  >
                    <View style={[
                      styles.toggleKnob,
                      requireProof ? styles.toggleKnobOn : styles.toggleKnobOff
                    ]} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* XP Reward Selector */}
              <View style={styles.assignSection}>
                <Text style={styles.assignLabel}>XP Reward</Text>
                <View style={styles.xpSelectorRow}>
                  {[25, 50, 75, 100, 150].map((xp) => (
                    <TouchableOpacity
                      key={xp}
                      onPress={() => setAssignmentXp(xp)}
                      style={[
                        styles.xpOption,
                        assignmentXp === xp && styles.xpOptionSelected
                      ]}
                    >
                      <Text style={[
                        styles.xpOptionText,
                        assignmentXp === xp && styles.xpOptionTextSelected
                      ]}>{xp}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Send Nudge Now Toggle */}
              <View style={styles.assignSection}>
                <View style={styles.toggleRowWithSubtitle}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabelNew}>Send nudge now</Text>
                    <Text style={styles.toggleSubtitle}>Notify immediately</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSendNudge(!sendNudge)}
                    style={[
                      styles.toggleSwitch,
                      sendNudge ? styles.toggleSwitchOn : styles.toggleSwitchOff
                    ]}
                  >
                    <View style={[
                      styles.toggleKnob,
                      sendNudge ? styles.toggleKnobOn : styles.toggleKnobOff
                    ]} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Note Section */}
              <View style={styles.assignSection}>
                <Text style={styles.assignLabel}>Add a note (optional)</Text>
                <TextInput
                  placeholder="Any extra details or motivation..."
                  value={assignmentNote}
                  onChangeText={setAssignmentNote}
                  style={[styles.assignInput, styles.assignNoteInput]}
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Bottom Buttons */}
              <View style={styles.assignBottomButtons}>
                <TouchableOpacity
                  onPress={() => { resetAssignForm(); setShowAssignModal(false); setShowMemberPicker(false); }}
                  style={styles.assignCancelButton}
                >
                  <Text style={styles.assignCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleCreateAssignment}
                  style={[
                    styles.assignSubmitButton,
                    (!assignmentTitle.trim() || !assignedMember) && styles.assignSubmitButtonDisabled
                  ]}
                  disabled={!assignmentTitle.trim() || !assignedMember}
                >
                  <Text style={[
                    styles.assignSubmitButtonText,
                    (!assignmentTitle.trim() || !assignedMember) && styles.assignSubmitButtonTextDisabled
                  ]}>Assign</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            {/* Member Picker Overlay (Inside Assign Modal) */}
            {showMemberPicker && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'flex-end',
                zIndex: 1000,
              }}>
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => { setShowMemberPicker(false); setMemberSearchQuery(''); }}
                />
                <View style={{
                  backgroundColor: Colors.white,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  maxHeight: '80%',
                  paddingBottom: 34,
                }}>
                  <View style={styles.sheetHandle} />
                  
                  {/* Header */}
                  <View style={styles.assignModalHeader}>
                    <Text style={styles.assignModalTitle}>Choose member</Text>
                    <TouchableOpacity 
                      onPress={() => { setShowMemberPicker(false); setMemberSearchQuery(''); }}
                      style={styles.assignModalClose}
                    >
                      <Feather name="x" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Search Bar */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Colors.surface,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    marginHorizontal: 16,
                    marginBottom: 16,
                    height: 44,
                    borderWidth: 1,
                    borderColor: Colors.border,
                  }}>
                    <Feather name="search" size={18} color={Colors.textMuted} />
                    <TextInput
                      style={{
                        flex: 1,
                        marginLeft: 8,
                        fontSize: 16,
                        color: Colors.textPrimary,
                      }}
                      placeholder="Search members..."
                      placeholderTextColor={Colors.textMuted}
                      value={memberSearchQuery}
                      onChangeText={setMemberSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {memberSearchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setMemberSearchQuery('')}>
                        <Feather name="x-circle" size={18} color={Colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Member Grid */}
                  <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.memberPickerGrid}>
                      {loadingMembers ? (
                        <View style={{ padding: 40, alignItems: 'center', width: '100%' }}>
                          <ActivityIndicator size="large" color={Colors.primary} />
                          <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Loading members...</Text>
                        </View>
                      ) : circleMembers.length === 0 ? (
                        <View style={{ padding: 40, alignItems: 'center', width: '100%' }}>
                          <Feather name="users" size={48} color={Colors.textMuted} />
                          <Text style={{ marginTop: 12, color: Colors.textSecondary, textAlign: 'center' }}>
                            No other members in this circle yet.{'\n'}Invite friends to get started!
                          </Text>
                        </View>
                      ) : (
                        circleMembers
                          .filter(member => 
                            member.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
                          )
                          .map(member => (
                            <TouchableOpacity
                              key={member.id}
                              style={[
                                styles.memberPickerGridItem,
                                assignedMember?.id === member.id && styles.memberPickerGridItemSelected
                              ]}
                              onPress={() => {
                                handleSelectMember(member);
                                setMemberSearchQuery('');
                              }}
                            >
                              <View style={styles.memberPickerAvatarWrapper}>
                                <LinearGradient
                                  colors={['#a78bfa', '#7c3aed']}
                                  style={styles.memberPickerAvatar}
                                >
                                  <Text style={styles.memberPickerAvatarText}>{member.initial}</Text>
                                </LinearGradient>
                                {assignedMember?.id === member.id && (
                                  <View style={styles.memberPickerCheckmark}>
                                    <Feather name="check" size={12} color={Colors.white} />
                                  </View>
                                )}
                              </View>
                              <Text style={[
                                styles.memberPickerName,
                                assignedMember?.id === member.id && styles.memberPickerNameSelected
                              ]}>{member.name}</Text>
                            </TouchableOpacity>
                          ))
                      )}
                      {circleMembers.length > 0 && 
                        circleMembers.filter(m => m.name.toLowerCase().includes(memberSearchQuery.toLowerCase())).length === 0 && (
                        <View style={{ padding: 40, alignItems: 'center', width: '100%' }}>
                          <Text style={{ color: Colors.textSecondary }}>No members found matching "{memberSearchQuery}"</Text>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Post Options Modal (iOS Action Sheet Style) */}
      <Modal
        visible={showPostOptions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPostOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPostOptions(false)}
        >
          <View style={styles.actionSheetContainer}>
            <View style={styles.actionSheetGroup}>
              {selectedPost && (
                <>
                  {/* Show Edit option only for own posts or if admin */}
                  {(selectedPost.user?.id === user?.id || isCurrentUserAdmin) && (
                    <TouchableOpacity
                      onPress={() => handleEditPost(selectedPost)}
                      style={styles.actionSheetButton}
                    >
                      <Feather name="edit-2" size={20} color={Colors.primary} />
                      <Text style={styles.actionSheetButtonText}>Edit Post</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Show Delete option for own posts or if admin - triggers multi-select mode */}
                  {(selectedPost.user?.id === user?.id || isCurrentUserAdmin) && (
                    <TouchableOpacity
                      onPress={() => enterPostDeleteSelectionMode(selectedPost)}
                      style={[styles.actionSheetButton, styles.actionSheetButtonDestructive]}
                    >
                      <Feather name="trash-2" size={20} color={Colors.danger} />
                      <Text style={[styles.actionSheetButtonText, { color: Colors.danger }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Report option for other people's posts */}
                  {selectedPost.user?.id !== user?.id && (
                    <TouchableOpacity
                      onPress={() => {
                        setShowPostOptions(false);
                        Alert.alert('Report Submitted', 'Thank you for your report. We will review this post.');
                      }}
                      style={styles.actionSheetButton}
                    >
                      <Feather name="flag" size={20} color={Colors.warning} />
                      <Text style={[styles.actionSheetButtonText, { color: Colors.warning }]}>
                        Report Post
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Hide from feed option - available for all posts */}
                  <TouchableOpacity
                    onPress={() => handleHidePost(selectedPost.id)}
                    style={styles.actionSheetButton}
                  >
                    <Feather name="eye-off" size={20} color={Colors.textSecondary} />
                    <Text style={styles.actionSheetButtonText}>Hide from Feed</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            <TouchableOpacity
              onPress={() => setShowPostOptions(false)}
              style={styles.actionSheetCancel}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Post Modal - iOS Themed */}
      <Modal
        visible={showEditPostModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditPostModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowEditPostModal(false)}
          />
          <View style={styles.editPostSheet}>
            <View style={styles.editPostSheetHandle} />
            
            {/* Header */}
            <View style={styles.editPostHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowEditPostModal(false);
                  setSelectedPost(null);
                }}
              >
                <Text style={styles.editPostCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.editPostTitle}>Edit Post</Text>
              <TouchableOpacity onPress={handleSavePostEdit}>
                <Text style={styles.editPostSaveText}>Save</Text>
              </TouchableOpacity>
            </View>

            {/* Content Editor */}
            <View style={styles.editPostContent}>
              <TextInput
                value={editPostContent}
                onChangeText={setEditPostContent}
                style={styles.editPostTextInput}
                multiline
                placeholder="What's on your mind?"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
            </View>

            {/* Info Note */}
            <View style={styles.editPostInfoContainer}>
              <Feather name="info" size={14} color="#64748B" />
              <Text style={styles.editPostInfoText}>
                Edited posts will show an "Edited" badge
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Member Options Modal (Admin Only) */}
      <Modal
        visible={showMemberOptions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMemberOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMemberOptions(false)}
        >
          <View style={styles.actionSheetContainer}>
            {selectedMember && (
              <>
                <View style={styles.memberOptionHeader}>
                  <LinearGradient
                    colors={['#c4b5fd', '#8b5cf6']}
                    style={styles.memberOptionAvatar}
                  >
                    <Text style={styles.memberOptionAvatarText}>{selectedMember.initial}</Text>
                  </LinearGradient>
                  <Text style={styles.memberOptionName}>{selectedMember.name}</Text>
                  <Text style={styles.memberOptionRole}>
                    {selectedMember.role === 'admin' ? 'Admin' : 'Member'}
                  </Text>
                </View>

                <View style={styles.actionSheetGroup}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowMemberOptions(false);
                      handleViewMember(selectedMember);
                    }}
                    style={styles.actionSheetButton}
                  >
                    <Feather name="user" size={20} color={Colors.primary} />
                    <Text style={styles.actionSheetButtonText}>View Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleToggleAdmin(selectedMember.id)}
                    style={styles.actionSheetButton}
                  >
                    <Feather 
                      name={selectedMember.role === 'admin' ? 'user-minus' : 'user-plus'} 
                      size={20} 
                      color={Colors.primary} 
                    />
                    <Text style={styles.actionSheetButtonText}>
                      {selectedMember.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleRemoveMember(selectedMember.id)}
                    style={[styles.actionSheetButton, styles.actionSheetButtonDestructive]}
                  >
                    <Feather name="user-x" size={20} color={Colors.danger} />
                    <Text style={[styles.actionSheetButtonText, { color: Colors.danger }]}>
                      Remove from Circle
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            
            <TouchableOpacity
              onPress={() => setShowMemberOptions(false)}
              style={styles.actionSheetCancel}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Assignment Options Modal (iOS Action Sheet Style) */}
      <Modal
        visible={showAssignmentOptions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignmentOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAssignmentOptions(false)}
        >
          <View style={styles.actionSheetContainer}>
            <View style={styles.actionSheetGroup}>
              {selectedAssignment && (
                <>
                  {/* Header with mission info */}
                  <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
                      {selectedAssignment.title}
                    </Text>
                    <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>
                      {selectedAssignment.status === 'accepted' ? '✅ Accepted' : 
                       selectedAssignment.status === 'declined' ? '❌ Declined' : 
                       selectedAssignment.status === 'completed' ? '🎉 Completed' : '⏳ Pending'}
                      {isAssignmentSender(selectedAssignment) && ' • You sent this'}
                      {isAssignmentRecipient(selectedAssignment) && ' • Assigned to you'}
                    </Text>
                  </View>

                  {/* Edit option for sender - show if user is sender and status is not completed */}
                  {isAssignmentSender(selectedAssignment) && selectedAssignment.status !== 'completed' && (
                    <TouchableOpacity
                      onPress={() => openEditAssignmentModal(selectedAssignment)}
                      style={styles.actionSheetButton}
                    >
                      <Feather name="edit-2" size={20} color={Colors.primary} />
                      <Text style={styles.actionSheetButtonText}>Edit Mission</Text>
                    </TouchableOpacity>
                  )}

                  {/* Accept option for recipient with pending/declined status */}
                  {isAssignmentRecipient(selectedAssignment) && 
                   (selectedAssignment.status === 'pending' || selectedAssignment.status === 'declined') && (
                    <TouchableOpacity
                      onPress={() => handleAcceptAndGoToPlan(selectedAssignment)}
                      style={styles.actionSheetButton}
                    >
                      <Feather name="check-circle" size={20} color={Colors.success} />
                      <Text style={[styles.actionSheetButtonText, { color: Colors.success }]}>
                        Accept Mission
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Decline option for recipient with pending or accepted status */}
                  {isAssignmentRecipient(selectedAssignment) && 
                   (selectedAssignment.status === 'pending' || selectedAssignment.status === 'accepted') && (
                    <TouchableOpacity
                      onPress={() => handleDeclineAccepted(selectedAssignment)}
                      style={[styles.actionSheetButton, styles.actionSheetButtonDestructive]}
                    >
                      <Feather name="x-circle" size={20} color={Colors.danger} />
                      <Text style={[styles.actionSheetButtonText, { color: Colors.danger }]}>
                        Decline Mission
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Complete option for recipient when accepted */}
                  {isAssignmentRecipient(selectedAssignment) && selectedAssignment.status === 'accepted' && (
                    <TouchableOpacity
                      onPress={() => {
                        setShowAssignmentOptions(false);
                        if (selectedAssignment.requireProof) {
                          openSubmitProofModal(selectedAssignment);
                        } else {
                          handleCompleteAssignment(selectedAssignment);
                        }
                      }}
                      style={styles.actionSheetButton}
                    >
                      <Feather name="check" size={20} color={Colors.success} />
                      <Text style={[styles.actionSheetButtonText, { color: Colors.success }]}>
                        {selectedAssignment.requireProof ? 'Submit Proof & Complete' : 'Complete Mission'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* View proof (if completed with proof) */}
                  {selectedAssignment.status === 'completed' && selectedAssignment.proofUrl && (
                    <TouchableOpacity
                      onPress={() => handleViewProof(selectedAssignment)}
                      style={styles.actionSheetButton}
                    >
                      <Feather name="image" size={20} color={Colors.primary} />
                      <Text style={styles.actionSheetButtonText}>View Proof</Text>
                    </TouchableOpacity>
                  )}

                  {/* Hide from feed */}
                  <TouchableOpacity
                    onPress={() => {
                      setShowAssignmentOptions(false);
                      Alert.alert('Hidden', 'This mission post has been hidden from your feed.');
                    }}
                    style={styles.actionSheetButton}
                  >
                    <Feather name="eye-off" size={20} color={Colors.textMuted} />
                    <Text style={styles.actionSheetButtonText}>Hide from Feed</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            <TouchableOpacity
              onPress={() => setShowAssignmentOptions(false)}
              style={styles.actionSheetCancel}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Assignment Modal (Sender Only) - Matches Create Assignment UI */}
      <Modal
        visible={showEditAssignmentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditAssignmentModal(false)}
      >
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowEditAssignmentModal(false)}
          />
          <View style={[styles.assignModalSheet]} pointerEvents="auto" onStartShouldSetResponder={() => true}>
            {/* Drag Handle */}
            <View style={styles.sheetHandle} />
            
            {/* Header */}
            <View style={styles.assignModalHeader}>
              <Text style={styles.assignModalTitle}>Edit Mission</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowEditAssignmentModal(false);
                  setSelectedAssignment(null);
                }}
                style={styles.assignModalClose}
              >
                <Feather name="x" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              style={styles.assignModalContent}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {/* Mission Title (Required) */}
              <View style={styles.assignSection}>
                <Text style={styles.assignLabel}>Mission</Text>
                <TextInput
                  placeholder="e.g. Take bins out"
                  value={editAssignmentData.title}
                  onChangeText={(text) => setEditAssignmentData(prev => ({ ...prev, title: text }))}
                  style={styles.assignInput}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Schedule Section */}
              <View style={styles.assignSection}>
                <Text style={styles.assignLabel}>Schedule</Text>
                
                {/* Day Segmented Control */}
                <View style={styles.segmentedControl}>
                  {(['today', 'tomorrow', 'custom'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.segmentOption,
                        editDueDay === option && styles.segmentOptionActive
                      ]}
                      onPress={() => {
                        setEditDueDay(option);
                        if (option === 'custom') {
                          setShowEditDatePicker(true);
                        } else {
                          // Update the date based on selection
                          const newDate = new Date();
                          if (option === 'tomorrow') {
                            newDate.setDate(newDate.getDate() + 1);
                          }
                          setEditCustomDueDate(newDate);
                          setEditAssignmentData(prev => ({ ...prev, dueDate: newDate }));
                        }
                      }}
                    >
                      <Text style={[
                        styles.segmentOptionText,
                        editDueDay === option && styles.segmentOptionTextActive
                      ]}>
                        {option === 'today' ? 'Today' : option === 'tomorrow' ? 'Tomorrow' : 'Pick date'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Date Picker */}
                {editDueDay === 'custom' && (
                  <TouchableOpacity
                    style={[styles.datePickerButton, { marginTop: 12 }]}
                    onPress={() => setShowEditDatePicker(true)}
                  >
                    <Feather name="calendar" size={18} color={Colors.primary} />
                    <Text style={styles.datePickerButtonText}>{formatDate(editCustomDueDate)}</Text>
                    <Feather name="chevron-down" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}

                {/* iOS Date Picker Modal */}
                {showEditDatePicker && Platform.OS === 'ios' && (
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={editCustomDueDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setEditCustomDueDate(selectedDate);
                          setEditAssignmentData(prev => ({ ...prev, dueDate: selectedDate }));
                        }
                      }}
                      minimumDate={new Date()}
                      textColor={Colors.textPrimary}
                    />
                    <TouchableOpacity
                      style={styles.pickerDoneButton}
                      onPress={() => setShowEditDatePicker(false)}
                    >
                      <Text style={styles.pickerDoneButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Android Date Picker */}
                {showEditDatePicker && Platform.OS === 'android' && (
                  <DateTimePicker
                    value={editCustomDueDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowEditDatePicker(false);
                      if (selectedDate) {
                        setEditCustomDueDate(selectedDate);
                        setEditAssignmentData(prev => ({ ...prev, dueDate: selectedDate }));
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}

                {/* Time Picker */}
                <View style={styles.timePickerRow}>
                  <Text style={styles.timePickerLabel}>Time</Text>
                  <TouchableOpacity 
                    style={styles.timePickerInputWrapper}
                    activeOpacity={0.7}
                    onPress={() => setShowEditTimePicker(true)}
                  >
                    <Text style={styles.timePickerInput}>
                      {editAssignmentData.dueTime ? formatTime(editAssignmentData.dueTime) : '9:00 AM'}
                    </Text>
                    <Feather name="clock" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* iOS Time Picker */}
                {showEditTimePicker && Platform.OS === 'ios' && (
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={editAssignmentData.dueTime || new Date()}
                      mode="time"
                      display="spinner"
                      onChange={(event, selectedTime) => {
                        if (selectedTime) {
                          setEditAssignmentData(prev => ({ ...prev, dueTime: selectedTime }));
                        }
                      }}
                      textColor={Colors.textPrimary}
                    />
                    <TouchableOpacity
                      style={styles.pickerDoneButton}
                      onPress={() => setShowEditTimePicker(false)}
                    >
                      <Text style={styles.pickerDoneButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Android Time Picker */}
                {showEditTimePicker && Platform.OS === 'android' && (
                  <DateTimePicker
                    value={editAssignmentData.dueTime || new Date()}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowEditTimePicker(false);
                      if (selectedTime) {
                        setEditAssignmentData(prev => ({ ...prev, dueTime: selectedTime }));
                      }
                    }}
                  />
                )}

                {/* Due Summary */}
                <Text style={styles.dueSummary}>{getEditDueSummary()}</Text>
              </View>

              {/* Repeat Toggle */}
              <View style={styles.assignSection}>
                <View style={styles.toggleRowNew}>
                  <Text style={styles.toggleLabelNew}>Repeat</Text>
                  <TouchableOpacity
                    onPress={() => setEditAssignmentData(prev => ({ ...prev, repeatEnabled: !prev.repeatEnabled }))}
                    style={[
                      styles.toggleSwitch,
                      editAssignmentData.repeatEnabled ? styles.toggleSwitchOn : styles.toggleSwitchOff
                    ]}
                  >
                    <View style={[
                      styles.toggleKnob,
                      editAssignmentData.repeatEnabled ? styles.toggleKnobOn : styles.toggleKnobOff
                    ]} />
                  </TouchableOpacity>
                </View>

                {/* Repeat Options (when enabled) */}
                {editAssignmentData.repeatEnabled && (
                  <View style={styles.repeatOptions}>
                    {/* Frequency Segmented Control */}
                    <View style={[styles.segmentedControl, { marginTop: 12 }]}>
                      {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                        <TouchableOpacity
                          key={freq}
                          style={[
                            styles.segmentOption,
                            editAssignmentData.repeatFrequency === freq && styles.segmentOptionActive
                          ]}
                          onPress={() => setEditAssignmentData(prev => ({ ...prev, repeatFrequency: freq }))}
                        >
                          <Text style={[
                            styles.segmentOptionText,
                            editAssignmentData.repeatFrequency === freq && styles.segmentOptionTextActive
                          ]}>
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Require Proof Toggle */}
              <View style={styles.assignSection}>
                <View style={styles.toggleRowWithSubtitle}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabelNew}>Require proof</Text>
                    <Text style={styles.toggleSubtitle}>Photo required to complete</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setEditAssignmentData(prev => ({ ...prev, requireProof: !prev.requireProof }))}
                    style={[
                      styles.toggleSwitch,
                      editAssignmentData.requireProof ? styles.toggleSwitchOn : styles.toggleSwitchOff
                    ]}
                  >
                    <View style={[
                      styles.toggleKnob,
                      editAssignmentData.requireProof ? styles.toggleKnobOn : styles.toggleKnobOff
                    ]} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Note Section */}
              <View style={styles.assignSection}>
                <Text style={styles.assignLabel}>Add a note (optional)</Text>
                <TextInput
                  placeholder="Any extra details or motivation..."
                  value={editAssignmentData.description}
                  onChangeText={(text) => setEditAssignmentData(prev => ({ ...prev, description: text }))}
                  style={[styles.assignInput, styles.assignNoteInput]}
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Bottom Buttons */}
              <View style={styles.assignBottomButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setShowEditAssignmentModal(false);
                    setSelectedAssignment(null);
                  }}
                  style={styles.assignCancelButton}
                >
                  <Text style={styles.assignCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleSaveAssignmentEdit}
                  disabled={editingAssignment || !editAssignmentData.title.trim()}
                  style={[
                    styles.assignSubmitButton,
                    (editingAssignment || !editAssignmentData.title.trim()) && styles.assignSubmitButtonDisabled
                  ]}
                >
                  <Text style={[
                    styles.assignSubmitButtonText,
                    (editingAssignment || !editAssignmentData.title.trim()) && styles.assignSubmitButtonTextDisabled
                  ]}>
                    {editingAssignment ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Circle Settings Modal (Admin Only) */}
      <Modal
        visible={showCircleSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCircleSettings(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCircleSettings(false)}
        >
          <View style={styles.settingsSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Circle Settings</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Circle Info Section */}
              <Text style={styles.settingsSectionTitle}>CIRCLE INFO</Text>
              
              <Text style={styles.inputLabel}>Circle Name</Text>
              <TextInput
                value={editCircleName}
                onChangeText={setEditCircleName}
                style={styles.textInput}
                placeholder="Circle name"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Circle Emoji</Text>
              <TextInput
                value={editCircleEmoji}
                onChangeText={setEditCircleEmoji}
                style={styles.textInput}
                placeholder="Choose an emoji"
                placeholderTextColor={Colors.textMuted}
              />

              {/* Permissions Section */}
              <Text style={styles.settingsSectionTitle}>PERMISSIONS</Text>
              
              <View style={styles.settingsRow}>
                <View style={styles.settingsRowInfo}>
                  <Text style={styles.settingsRowTitle}>Anyone can post challenges</Text>
                  <Text style={styles.settingsRowSubtitle}>Allow all members to create challenges</Text>
                </View>
                <TouchableOpacity style={[styles.toggle, styles.toggleOn]}>
                  <View style={[styles.toggleThumb, styles.toggleThumbOn]} />
                </TouchableOpacity>
              </View>

              <View style={styles.settingsRow}>
                <View style={styles.settingsRowInfo}>
                  <Text style={styles.settingsRowTitle}>Anyone can invite</Text>
                  <Text style={styles.settingsRowSubtitle}>Allow all members to invite others</Text>
                </View>
                <TouchableOpacity style={[styles.toggle, styles.toggleOn]}>
                  <View style={[styles.toggleThumb, styles.toggleThumbOn]} />
                </TouchableOpacity>
              </View>

              {/* Notifications Section */}
              <Text style={styles.settingsSectionTitle}>NOTIFICATIONS</Text>
              
              <View style={styles.settingsRow}>
                <View style={styles.settingsRowInfo}>
                  <Text style={styles.settingsRowTitle}>Daily reminder</Text>
                  <Text style={styles.settingsRowSubtitle}>Remind members who haven't posted</Text>
                </View>
                <TouchableOpacity style={[styles.toggle, styles.toggleOn]}>
                  <View style={[styles.toggleThumb, styles.toggleThumbOn]} />
                </TouchableOpacity>
              </View>

              {/* Danger Zone */}
              <Text style={[styles.settingsSectionTitle, { color: Colors.danger }]}>DANGER ZONE</Text>
              
              <TouchableOpacity
                onPress={handleDeleteCircle}
                style={styles.dangerButton}
              >
                <Feather name="trash-2" size={20} color={Colors.danger} />
                <Text style={styles.dangerButtonText}>Delete Circle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveCircleSettings}
                style={[styles.submitButton, { marginTop: 24 }]}
              >
                <Text style={styles.submitButtonText}>Save Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowCircleSettings(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Today In Circle Modal */}
      <Modal
        visible={showTodayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTodayModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTodayModal(false)}
        >
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.sheetTitle}>Today in {circleName}</Text>
              <TouchableOpacity onPress={() => setShowTodayModal(false)}>
                <Feather name="x" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.checkinStats}>
              Checked in today: {postedCount} of {totalCount}
            </Text>

            <ScrollView style={styles.memberListScroll}>
              {/* Your row */}
              <TouchableOpacity style={styles.todayMemberRow}>
                <LinearGradient
                  colors={['#a78bfa', '#7c3aed']}
                  style={styles.todayMemberAvatar}
                >
                  <Text style={styles.todayMemberAvatarText}>Y</Text>
                </LinearGradient>
                <View style={styles.todayMemberInfo}>
                  <Text style={styles.todayMemberName}>You</Text>
                  <Text style={styles.todayMemberStatus}>
                    {userPosted ? 'Posted today' : 'Not posted yet'}
                  </Text>
                </View>
                {userPosted && (
                  <View style={styles.postedCheckmark}>
                    <Feather name="check" size={16} color={Colors.success} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Other members */}
              {circleMembers.map(member => (
                <TouchableOpacity 
                  key={member.id}
                  style={styles.todayMemberRow}
                  onPress={() => handleOpenMemberDetail(member)}
                >
                  <LinearGradient
                    colors={['#c4b5fd', '#8b5cf6']}
                    style={styles.todayMemberAvatar}
                  >
                    <Text style={styles.todayMemberAvatarText}>{member.initial}</Text>
                  </LinearGradient>
                  <View style={styles.todayMemberInfo}>
                    <Text style={styles.todayMemberName}>{member.name}</Text>
                    <Text style={styles.todayMemberStatus}>
                      {member.posted ? `Posted ${member.lastPostTime}` : 'Not posted yet'}
                    </Text>
                  </View>
                  {member.posted && (
                    <View style={styles.postedCheckmark}>
                      <Feather name="check" size={16} color={Colors.success} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.todayModalActions}>
              <TouchableOpacity 
                style={styles.todayShareButton}
                onPress={() => {
                  setShowTodayModal(false);
                  handleShareToday();
                }}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.todayShareButtonGradient}
                >
                  <Text style={styles.todayShareButtonText}>Share Today</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.todayAssignButton}
                onPress={() => {
                  setShowTodayModal(false);
                  setShowAssignModal(true);
                }}
              >
                <Text style={styles.todayAssignButtonText}>Assign Mission</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Member Detail Modal */}
      <Modal
        visible={showMemberDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMemberDetailModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMemberDetailModal(false)}
        >
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.sheetTitle}>Member Details</Text>
              <TouchableOpacity onPress={() => setShowMemberDetailModal(false)}>
                <Feather name="x" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedMemberDetail && (
              <>
                <View style={styles.memberDetailHeader}>
                  <LinearGradient
                    colors={['#c4b5fd', '#8b5cf6']}
                    style={styles.memberDetailAvatar}
                  >
                    <Text style={styles.memberDetailAvatarText}>{selectedMemberDetail.initial}</Text>
                  </LinearGradient>
                  <Text style={styles.memberDetailName}>{selectedMemberDetail.name}</Text>
                  <Text style={styles.memberDetailLastCheckin}>
                    {selectedMemberDetail.posted 
                      ? `Last check-in: ${selectedMemberDetail.lastPostTime || 'Today'}`
                      : 'Not posted today'}
                  </Text>
                </View>

                {selectedMemberDetail.posted && (
                  <View style={styles.memberDetailPreview}>
                    <Text style={styles.memberDetailPreviewTitle}>Latest Post</Text>
                    <View style={styles.memberDetailStats}>
                      <View style={styles.memberDetailStat}>
                        <Text style={styles.memberDetailStatLabel}>Missions</Text>
                        <Text style={styles.memberDetailStatValue}>4/5</Text>
                      </View>
                      <View style={styles.memberDetailStat}>
                        <Text style={styles.memberDetailStatLabel}>Time Saved</Text>
                        <Text style={[styles.memberDetailStatValue, { color: Colors.success }]}>+26m</Text>
                      </View>
                      <View style={styles.memberDetailStat}>
                        <MaterialCommunityIcons name="fire" size={14} color={Colors.orange} />
                        <Text style={[styles.memberDetailStatValue, { color: Colors.orange }]}>6</Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.memberDetailActions}>
                  <TouchableOpacity style={styles.memberDetailViewPost}>
                    <Text style={styles.memberDetailViewPostText}>View Last Post</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.memberDetailAssign}
                    onPress={() => {
                      setShowMemberDetailModal(false);
                      setAssignTo(selectedMemberDetail.name);
                      setAssignToId(selectedMemberDetail.id);
                      setShowAssignModal(true);
                    }}
                  >
                    <Text style={styles.memberDetailAssignText}>Assign Mission</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Members Modal (from header) */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMembersModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMembersModal(false)}
        >
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.sheetTitle}>Members</Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <Feather name="x" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.memberListScroll}>
              {/* You */}
              <View style={styles.membersModalRow}>
                <LinearGradient
                  colors={['#a78bfa', '#7c3aed']}
                  style={styles.membersModalAvatar}
                >
                  <Text style={styles.membersModalAvatarText}>Y</Text>
                </LinearGradient>
                <View style={styles.membersModalInfo}>
                  <Text style={styles.membersModalName}>You (Admin)</Text>
                </View>
                {userPosted && (
                  <Text style={styles.membersModalPosted}>✓ Posted</Text>
                )}
              </View>

              {/* Other members */}
              {circleMembers.map(member => (
                <View key={member.id} style={styles.membersModalRow}>
                  <LinearGradient
                    colors={['#c4b5fd', '#8b5cf6']}
                    style={styles.membersModalAvatar}
                  >
                    <Text style={styles.membersModalAvatarText}>{member.initial}</Text>
                  </LinearGradient>
                  <View style={styles.membersModalInfo}>
                    <Text style={styles.membersModalName}>
                      {member.name}{member.role === 'admin' ? ' (Admin)' : ''}
                    </Text>
                  </View>
                  {member.posted && (
                    <Text style={styles.membersModalPosted}>✓ Posted</Text>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.circlePrivacyInfo}>
              <Feather name="lock" size={16} color={Colors.textMuted} />
              <Text style={styles.circlePrivacyText}>
                This is a private circle. Only members can see posts.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Share Your Day Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowShareModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowShareModal(false)}
        >
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.sheetTitle}>Share Your Day</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Feather name="x" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Stats Preview - Shows REAL stats */}
            <View style={{
              backgroundColor: Colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Colors.border,
            }}>
              <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 12 }}>Your Stats Today</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.textPrimary }}>
                    {todayStats.completed}/{todayStats.total}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted }}>Tasks Done</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.success }}>
                    +{todayStats.timeSaved}m
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted }}>Time Saved</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.orange }}>
                    {user?.currentStreak || 0}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted }}>Day Streak</Text>
                </View>
              </View>
              {todayStats.total === 0 && (
                <Text style={{ fontSize: 12, color: Colors.warning, textAlign: 'center', marginTop: 8 }}>
                  Add tasks to your day first!
                </Text>
              )}
            </View>

            {/* Create Daily Life Card button */}
            <TouchableOpacity 
              onPress={handleNavigateToDailyLifeCard}
              style={styles.createDailyCardButton}
            >
              <LinearGradient
                colors={['#8b5cf6', '#ec4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createDailyCardGradient}
              >
                <Feather name="image" size={20} color={Colors.white} />
                <Text style={styles.createDailyCardText}>Create Daily Life Card</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.shareOrDivider}>
              <View style={styles.shareOrLine} />
              <Text style={styles.shareOrText}>or quick share</Text>
              <View style={styles.shareOrLine} />
            </View>

            {/* Note text area */}
            <Text style={styles.inputLabel}>Add a note (optional)</Text>
            <TextInput
              value={shareNote}
              onChangeText={setShareNote}
              placeholder="How was your day?"
              style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
              multiline
              placeholderTextColor={Colors.textMuted}
            />

            {/* Privacy options */}
            <Text style={styles.inputLabel}>Privacy Level</Text>
            <View style={styles.privacyOptions}>
              <TouchableOpacity 
                style={[styles.privacyOption, sharePrivacy === 'metrics' && styles.privacyOptionActive]}
                onPress={() => setSharePrivacy('metrics')}
              >
                <View style={[styles.privacyRadio, sharePrivacy === 'metrics' && styles.privacyRadioActive]}>
                  {sharePrivacy === 'metrics' && <View style={styles.privacyRadioDot} />}
                </View>
                <Text style={styles.privacyOptionText}>Metrics Only</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.privacyOption, sharePrivacy === 'full' && styles.privacyOptionActive]}
                onPress={() => setSharePrivacy('full')}
              >
                <View style={[styles.privacyRadio, sharePrivacy === 'full' && styles.privacyRadioActive]}>
                  {sharePrivacy === 'full' && <View style={styles.privacyRadioDot} />}
                </View>
                <Text style={styles.privacyOptionText}>Full Share</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleConfirmShare}
              style={[styles.submitButton, (postingDailyCard || todayStats.total === 0) && { opacity: 0.5 }]}
              disabled={postingDailyCard || todayStats.total === 0}
            >
              {postingDailyCard ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Share to Circle</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowShareModal(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Member Action Sheet (Admin manage member) */}
      <Modal
        visible={showMemberActionSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMemberActionSheet(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMemberActionSheet(false)}
        >
          <View style={styles.actionSheetContainer}>
            {selectedMemberForManage && (
              <>
                <View style={styles.actionSheetHeader}>
                  <Text style={styles.actionSheetTitle}>Manage {selectedMemberForManage.name}</Text>
                </View>

                <View style={styles.actionSheetGroup}>
                  <TouchableOpacity
                    onPress={() => handlePromoteToAdmin(selectedMemberForManage.id)}
                    style={styles.actionSheetButton}
                  >
                    <Feather name="award" size={20} color={Colors.primary} />
                    <Text style={styles.actionSheetButtonText}>Promote to Admin</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleRemoveFromCircle(selectedMemberForManage.id)}
                    style={[styles.actionSheetButton, styles.actionSheetButtonDestructive]}
                  >
                    <Feather name="user-x" size={20} color={Colors.danger} />
                    <Text style={[styles.actionSheetButtonText, { color: Colors.danger }]}>
                      Remove from Circle
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            
            <TouchableOpacity
              onPress={() => {
                setShowMemberActionSheet(false);
                setSelectedMemberForManage(null);
              }}
              style={styles.actionSheetCancel}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// Post Selection Mode Styles (WhatsApp style)
const postSelectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  cancelButton: {
    padding: 4,
  },
  headerText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deleteButton: {
    padding: 4,
  },
  checkboxRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#7C3AED',
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  circleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  circleEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  circleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  postedCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabInactive: {
    backgroundColor: Colors.surface,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabTextInactive: {
    color: Colors.textSecondary,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Filters
  filtersRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryLight,
  },
  filterPillInactive: {
    backgroundColor: Colors.surface,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.primary,
  },
  filterTextInactive: {
    color: Colors.textSecondary,
  },

  // Post Card
  postCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  postCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  postTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },

  // Reactions
  reactionsContainer: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 16,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  clapEmoji: {
    fontSize: 16,
  },

  // System Card
  systemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  systemCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  systemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  systemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  systemTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  systemHideButton: {
    padding: 8,
    marginLeft: 8,
  },
  hiddenPostsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  hiddenPostsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Section Title
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  challengeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  challengeSectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
  },
  challengeSectionActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Member Card
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  memberCardPlain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  memberDetails: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  memberRole: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  memberStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  adminBadge: {
    fontSize: 16,
  },
  
  // Admin & Member Management Styles
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsButton: {
    padding: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminTagBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBadgeSmall: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeSmallText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  editedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  systemTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postNoteContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  postNoteText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // iOS Action Sheet Styles
  actionSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 34,
  },
  actionSheetGroup: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  actionSheetButtonDestructive: {
    borderBottomWidth: 0,
  },
  actionSheetButtonText: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '400',
  },
  actionSheetCancel: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionSheetCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },
  
  // Member Option Modal
  memberOptionHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 8,
  },
  memberOptionAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberOptionAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  memberOptionName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  memberOptionRole: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  
  // Edit Post Modal - iOS Themed
  editPostSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  editPostSheetHandle: {
    width: 36,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  editPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  editPostCancelText: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '400',
  },
  editPostTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  editPostSaveText: {
    fontSize: 17,
    color: Colors.primary,
    fontWeight: '600',
  },
  editPostContent: {
    padding: 16,
    minHeight: 150,
  },
  editPostTextInput: {
    fontSize: 17,
    color: Colors.textPrimary,
    lineHeight: 24,
    minHeight: 120,
  },
  editPostInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    marginTop: 'auto',
  },
  editPostInfoText: {
    fontSize: 13,
    color: '#64748B',
  },
  
  // Circle Settings Modal
  settingsSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsRowInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingsRowTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  settingsRowSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.danger,
  },

  // Challenge Card
  challengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  challengeJoinButton: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 40,
  },
  challengeJoinText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  challengeJoinedBadge: {
    marginTop: 10,
    backgroundColor: Colors.successLight,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  challengeJoinedText: {
    color: Colors.success,
    fontWeight: '600',
    fontSize: 13,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  challengeInfo: {
    flex: 1,
    marginRight: 12,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  challengeAssigner: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: Colors.warningLight,
  },
  statusAccepted: {
    backgroundColor: Colors.successLight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPending: {
    color: Colors.warningText,
  },
  statusTextAccepted: {
    color: Colors.successText,
  },
  challengeDueTime: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Create Button
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  sheetOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // Invite
  inviteCodeBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inviteLinkBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inviteLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  inviteLink: {
    fontSize: 14,
    color: Colors.primary,
    flex: 1,
    marginRight: 12,
  },
  copyButton: {
    padding: 8,
    backgroundColor: Colors.white,
    borderRadius: 8,
  },

  // Form
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  selectInputText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  memberPickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  memberPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberPickerItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  memberPickerItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  memberPickerItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: Colors.primary,
  },
  toggleOff: {
    backgroundColor: Colors.border,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  toggleThumbOff: {
    alignSelf: 'flex-start',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Activity Card Styles
  activityCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fcd34d',
    gap: 4,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
  },
  activityAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityAvatarWrapper: {
    borderRadius: 22,
    padding: 2,
    backgroundColor: 'transparent',
  },
  activityAvatarOverlap: {
    marginLeft: -8,
  },
  activityAvatarPosted: {
    borderWidth: 2,
    borderColor: '#34d399',
    borderRadius: 22,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  activityAvatarText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  activityAvatarMore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  activityAvatarMoreText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  activityStatusText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  activityProgressTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  activityProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  activityPrimaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  activityPrimaryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  activityPostedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 8,
  },
  activityPostedButtonText: {
    color: Colors.success,
    fontSize: 15,
    fontWeight: '600',
  },
  activitySecondaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  
  // Assign Mission Button - Outlined style
  assignMissionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#7c3aed',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  assignMissionIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignMissionButtonText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Invite Button
  inviteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#e9d5ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  inviteIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '600',
  },
  activitySecondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  activitySecondaryButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '500',
  },
  activityViewAllLink: {
    alignItems: 'center',
    paddingTop: 4,
  },
  activityViewAllText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '500',
  },

  // Navigation Grid Styles
  navigationGrid: {
    marginBottom: 16,
    gap: 8,
  },
  navigationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navigationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
  },
  navigationButtonActive: {
    backgroundColor: Colors.primary,
  },
  navigationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  navigationButtonTextActive: {
    color: Colors.white,
  },

  // Header Right Buttons
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Activity Card Header
  activityHeaderLeft: {
    flex: 1,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Today Modal
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkinStats: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  memberListScroll: {
    maxHeight: 300,
    marginBottom: 16,
  },
  todayMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  todayMemberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayMemberAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  todayMemberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  todayMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  todayMemberStatus: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  postedCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayModalActions: {
    gap: 12,
  },
  todayShareButton: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  todayShareButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  todayShareButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  todayAssignButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  todayAssignButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Member Detail Modal
  memberDetailHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  memberDetailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberDetailAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
  },
  memberDetailName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  memberDetailLastCheckin: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  memberDetailPreview: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  memberDetailPreviewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 12,
  },
  memberDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  memberDetailStat: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  memberDetailStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginRight: 6,
  },
  memberDetailStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  memberDetailActions: {
    gap: 12,
  },
  memberDetailViewPost: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  memberDetailViewPostText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  memberDetailAssign: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  memberDetailAssignText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Members Modal (header)
  membersModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  membersModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersModalAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.white,
  },
  membersModalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  membersModalName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  membersModalPosted: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  circlePrivacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  circlePrivacyText: {
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },

  // Share Your Day Modal
  createDailyCardButton: {
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: 20,
  },
  createDailyCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  createDailyCardText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  shareOrDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  shareOrLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  shareOrText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: Colors.textMuted,
  },
  privacyOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  privacyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  privacyOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  privacyRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyRadioActive: {
    borderColor: Colors.primary,
  },
  privacyRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  privacyOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },

  // Action Sheet Header
  actionSheetHeader: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Members Tab
  postedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignToMemberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteMembersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    gap: 8,
  },
  inviteMembersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Challenges Tab
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  challengeProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  challengeProgressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  logTodayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    gap: 6,
  },
  logTodayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  startNewChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    gap: 8,
  },
  startNewChallengeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Invite Modal (Updated)
  inviteLinkSection: {
    marginBottom: 20,
  },
  inviteLinkRow: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  inviteLinkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  inviteLinkButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  inviteShareLinkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  inviteShareLinkText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  inviteCopyLinkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  inviteCopyLinkText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  inviteDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  inviteCodeSection: {
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  inviteCodeDisplay: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  inviteCodeBig: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 3,
  },
  inviteCopyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 8,
  },
  inviteCopyCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  inviteHelperText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },

  // Assign Mission Modal Styles
  assignModalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    position: 'relative',
    overflow: 'hidden',
  },
  assignModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  assignModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  assignModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignModalContent: {
    padding: 20,
  },
  assignSection: {
    marginBottom: 20,
  },
  assignLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  assignInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assignNoteInput: {
    minHeight: 80,
    paddingTop: 14,
  },
  assignSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assignSelectedMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  assignSelectedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignSelectedAvatarText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  assignSelectedName: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  assignSelectPlaceholder: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  xpSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  xpOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  xpOptionSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: Colors.primary,
  },
  xpOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  xpOptionTextSelected: {
    color: Colors.primary,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 4,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentOptionActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  segmentOptionTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  timePickerLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timePickerInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 100,
  },
  timePickerInput: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    minWidth: 50,
    paddingVertical: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  datePickerButtonText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  iosPickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerDoneButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  pickerDoneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  dueSummary: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  toggleRowNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabelNew: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  toggleSwitch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchOn: {
    backgroundColor: Colors.primary,
  },
  toggleSwitchOff: {
    backgroundColor: Colors.border,
  },
  toggleKnob: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  toggleKnobOff: {
    alignSelf: 'flex-start',
  },
  toggleRowWithSubtitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  repeatOptions: {
    marginTop: 12,
    paddingLeft: 4,
  },
  frequencyOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  frequencyOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  frequencyOptionActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  frequencyOptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  frequencyOptionTextActive: {
    color: Colors.primary,
  },
  repeatEndOptions: {
    gap: 12,
  },
  repeatEndOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  repeatEndOptionActive: {},
  repeatEndOptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  repeatEndDateInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginLeft: 34,
    marginTop: 8,
  },
  repeatEndDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginLeft: 8,
    gap: 6,
  },
  repeatEndDateButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  repeatEndDateText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  countStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 8,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  stepperLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  assignBottomButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 10,
  },
  assignCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  assignCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  assignSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  assignSubmitButtonDisabled: {
    backgroundColor: Colors.border,
  },
  assignSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  assignSubmitButtonTextDisabled: {
    color: Colors.textMuted,
  },

  // Member Picker Modal Styles
  memberPickerSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
  },
  memberPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 16,
  },
  memberPickerGridItem: {
    width: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  memberPickerGridItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  memberPickerAvatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  memberPickerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberPickerAvatarText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  memberPickerCheckmark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  memberPickerName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  memberPickerNameSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  filterEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  filterEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  filterEmptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Challenge Modal Styles
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  typeChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});

// Named export for compatibility with App.tsx import
export { CircleHomeScreen };
