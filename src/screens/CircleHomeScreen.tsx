import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

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
  const { circle } = route?.params || {};
  const circleId = circle?.id || 'circle-1';
  const circleName = circle?.name || 'Morning Warriors';
  const circleEmoji = circle?.emoji || '🏃';

  const [circleTab, setCircleTab] = useState('feed');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState('all');

  const [circleMembers, setCircleMembers] = useState([
    { id: 'a', initial: 'A', name: 'Alex', posted: true, lastPostTime: '2h ago', role: 'admin' },
    { id: 'b', initial: 'B', name: 'Blake', posted: true, lastPostTime: '4h ago', role: 'member' },
    { id: 'c', initial: 'C', name: 'Charlie', posted: false, role: 'member' },
    { id: 'd', initial: 'D', name: 'Dana', posted: true, lastPostTime: '1h ago', role: 'member' },
  ]);

  const [userPosted, setUserPosted] = useState(false);
  const postedCount = circleMembers.filter(m => m.posted).length + (userPosted ? 1 : 0);
  const totalCount = circleMembers.length + 1;

  const [posts, setPosts] = useState([
    {
      id: 1,
      user: { initial: 'A', name: 'Alex' },
      time: '2h ago',
      type: 'receipt',
      missions: { completed: 4, total: 5 },
      wallet: '+26m',
      streak: 6,
      reactions: { heart: 2, fire: 1, clap: 0 },
    },
    {
      id: 2,
      user: { initial: 'B', name: 'Blake' },
      time: '4h ago',
      type: 'receipt',
      missions: { completed: 5, total: 5 },
      wallet: '+32m',
      streak: 12,
      reactions: { heart: 5, fire: 3, clap: 2 },
    },
    {
      id: 3,
      type: 'system',
      systemType: 'assigned',
      systemText: 'Morning workout assigned by Alex',
      dueTime: 'Today at 7:00 AM',
    },
    {
      id: 4,
      user: { initial: 'D', name: 'Dana' },
      time: '1h ago',
      type: 'receipt',
      missions: { completed: 3, total: 5 },
      wallet: '+15m',
      streak: 4,
      reactions: { heart: 1, fire: 0, clap: 1 },
    },
  ]);

  const [assignments, setAssignments] = useState([
    {
      id: 1,
      title: 'Morning workout',
      assignedBy: 'Alex',
      dueTime: 'Today at 7:00 AM',
      status: 'pending',
    },
    {
      id: 2,
      title: 'Read for 15 minutes',
      assignedBy: 'Blake',
      dueTime: 'Today at 8:00 PM',
      status: 'accepted',
    },
  ]);

  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDueTime, setAssignmentDueTime] = useState('18:00');
  const [assignTo, setAssignTo] = useState('');
  const [sendNudge, setSendNudge] = useState(true);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  // Assign Mission Modal - Complete State
  const [assignedMember, setAssignedMember] = useState<{ id: string; name: string; initial: string } | null>(null);
  const [dueDay, setDueDay] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customDueDate, setCustomDueDate] = useState('');
  const [dueTime, setDueTime] = useState('18:00');
  const [repeatEndType, setRepeatEndType] = useState<'forever' | 'untilDate' | 'count'>('forever');
  const [repeatEndDate, setRepeatEndDate] = useState('');
  const [repeatEndCount, setRepeatEndCount] = useState(10);

  // Current user is admin
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(true);
  
  // Post management
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editPostContent, setEditPostContent] = useState('');
  
  // Member management (admin)
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberOptions, setShowMemberOptions] = useState(false);
  
  // Circle settings (admin)
  const [showCircleSettings, setShowCircleSettings] = useState(false);
  const [editCircleName, setEditCircleName] = useState(circleName);
  const [editCircleEmoji, setEditCircleEmoji] = useState(circleEmoji);

  // NEW: Today In Circle Modal
  const [showTodayModal, setShowTodayModal] = useState(false);
  
  // NEW: Member Detail Modal
  const [showMemberDetailModal, setShowMemberDetailModal] = useState(false);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<any>(null);
  
  // NEW: Members Modal (header icon)
  const [showMembersModal, setShowMembersModal] = useState(false);
  
  // NEW: Share Your Day Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const [sharePrivacy, setSharePrivacy] = useState<'metrics' | 'full'>('full');
  
  // NEW: Assignment states
  const [assignToId, setAssignToId] = useState('');
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [requireProof, setRequireProof] = useState(false);
  const [scheduleOption, setScheduleOption] = useState<'today' | 'tomorrow' | 'custom'>('today');
  
  // NEW: Circle Settings toggles
  const [inviteLinkEnabled, setInviteLinkEnabled] = useState(true);
  const [approveNewMembers, setApproveNewMembers] = useState(false);
  const [allowAssignments, setAllowAssignments] = useState(true);
  const [requireAcceptBeforeAdding, setRequireAcceptBeforeAdding] = useState(false);
  const [defaultProofRequired, setDefaultProofRequired] = useState(false);
  const [circlePrivacy, setCirclePrivacy] = useState<'metrics' | 'circle'>('circle');
  const [muteCircle, setMuteCircle] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  
  // NEW: Member Action Sheet (for admin)
  const [showMemberActionSheet, setShowMemberActionSheet] = useState(false);
  const [selectedMemberForManage, setSelectedMemberForManage] = useState<any>(null);
  
  // NEW: Proof modals
  const [showSubmitProofModal, setShowSubmitProofModal] = useState(false);
  const [showViewProofModal, setShowViewProofModal] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [selectedAssignmentForProof, setSelectedAssignmentForProof] = useState<any>(null);

  const inviteCode = 'MYPA-7K2P';
  const inviteLink = 'https://mypa.app/invite/MYPA-7K2P';

  // Handle post check-in
  const handlePostCheckin = () => {
    setUserPosted(true);
    Alert.alert(
      '🎉 Check-in Posted!',
      'Your progress has been shared with the circle.',
      [{ text: 'Awesome!', style: 'default' }]
    );
  };

  // Handle reaction toggle
  const handleReaction = (postId: number, reactionType: 'heart' | 'fire' | 'clap') => {
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post.id === postId && post.reactions) {
          return {
            ...post,
            reactions: {
              ...post.reactions,
              [reactionType]: post.reactions[reactionType] + 1
            }
          };
        }
        return post;
      })
    );
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
          onPress: () => {
            setShowActionMenu(false);
            navigation.goBack();
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
    setShowMemberPicker(false);
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
      console.log('Copy failed:', error);
    }
  };

  const handleCreateAssignment = () => {
    if (!assignmentTitle.trim()) {
      Alert.alert('Error', 'Please enter a mission title');
      return;
    }
    if (!assignedMember) {
      Alert.alert('Error', 'Please select a member to assign');
      return;
    }

    // Format due time string
    const dayLabel = dueDay === 'today' ? 'Today' : dueDay === 'tomorrow' ? 'Tomorrow' : customDueDate;
    const timeLabel = formatTime(dueTime);
    const dueString = `${dayLabel} at ${timeLabel}`;

    const newAssignment = {
      id: assignments.length + 1,
      title: assignmentTitle,
      assignedBy: 'You',
      assignedTo: assignedMember.name,
      dueTime: dueString,
      status: 'pending',
      requireProof: requireProof,
      repeat: repeatEnabled ? repeatFrequency : null,
    };

    setAssignments([...assignments, newAssignment]);
    
    // Create system post with purple border styling
    let systemText = `${assignedMember.name} assigned: ${assignmentTitle} (Due ${dueString})`;
    if (repeatEnabled) {
      systemText += ` · Repeats ${repeatFrequency}`;
    }
    
    const newPost = {
      id: posts.length + 1,
      type: 'system',
      systemType: 'assigned',
      systemText: systemText,
      dueTime: dueString,
    };
    setPosts([newPost as any, ...posts]);
    
    // Reset all form fields
    resetAssignForm();
    setShowAssignModal(false);
  };

  // Helper to format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get due summary text
  const getDueSummary = () => {
    const dayLabel = dueDay === 'today' ? 'Today' : dueDay === 'tomorrow' ? 'Tomorrow' : (customDueDate || 'Pick date');
    return `Due: ${dayLabel} at ${formatTime(dueTime)}`;
  };

  // Reset assign form
  const resetAssignForm = () => {
    setAssignmentTitle('');
    setAssignedMember(null);
    setAssignTo('');
    setAssignToId('');
    setDueDay('today');
    setCustomDueDate('');
    setDueTime('18:00');
    setRepeatEnabled(false);
    setRepeatFrequency('daily');
    setRepeatEndType('forever');
    setRepeatEndDate('');
    setRepeatEndCount(10);
    setRequireProof(false);
    setSendNudge(true);
  };

  // NEW: Handle open Today modal
  const handleOpenTodayModal = () => {
    setShowTodayModal(true);
  };

  // NEW: Handle open Member Detail
  const handleOpenMemberDetail = (member: any) => {
    setSelectedMemberDetail(member);
    setShowTodayModal(false);
    setShowMemberDetailModal(true);
  };

  // NEW: Handle Share Today
  const handleShareToday = () => {
    setShowShareModal(true);
  };

  // NEW: Handle Confirm Share
  const handleConfirmShare = () => {
    // Create receipt post
    const newPost = {
      id: posts.length + 1,
      user: { initial: 'Y', name: 'You' },
      time: 'Just now',
      type: 'receipt',
      missions: { completed: 4, total: 5 },
      wallet: '+20m',
      streak: 3,
      reactions: { heart: 0, fire: 0, clap: 0 },
      note: shareNote || undefined,
      privacy: sharePrivacy,
    };
    
    setPosts([newPost, ...posts]);
    setUserPosted(true);
    setShareNote('');
    setSharePrivacy('full');
    setShowShareModal(false);
    
    Alert.alert('🎉 Shared!', 'Your day has been shared with the circle.');
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
  const handlePromoteToAdmin = (memberId: string) => {
    setCircleMembers(prev =>
      prev.map(m =>
        m.id === memberId ? { ...m, role: 'admin' } : m
      )
    );
    setShowMemberActionSheet(false);
    setSelectedMemberForManage(null);
    Alert.alert('Admin Added', 'Member has been promoted to admin.');
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
          onPress: () => {
            setCircleMembers(prev => prev.filter(m => m.id !== memberId));
            setShowMemberActionSheet(false);
            setSelectedMemberForManage(null);
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

  // Post management handlers
  const handlePostOptions = (post: any) => {
    setSelectedPost(post);
    setShowPostOptions(true);
  };

  const handleDeletePost = (postId: number) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPosts(prev => prev.filter(p => p.id !== postId));
            setShowPostOptions(false);
            setSelectedPost(null);
          }
        }
      ]
    );
  };

  const handleEditPost = (post: any) => {
    setEditPostContent(`Missions: ${post.missions.completed}/${post.missions.total}`);
    setShowPostOptions(false);
    setShowEditPostModal(true);
  };

  const handleSavePostEdit = () => {
    // In a real app, this would update the post content
    Alert.alert('Post Updated', 'Your post has been updated successfully.');
    setShowEditPostModal(false);
    setSelectedPost(null);
    setEditPostContent('');
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
  const handleSaveCircleSettings = () => {
    // In a real app, this would update the circle settings
    Alert.alert('Settings Saved', 'Circle settings have been updated.');
    setShowCircleSettings(false);
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
          onPress: () => {
            setShowCircleSettings(false);
            navigation.goBack();
          }
        }
      ]
    );
  };


  // Post Card Component
  const PostCard = ({ post }: { post: any }) => {
    if (post.type === 'system') {
      return (
        <View style={styles.systemCard}>
          <View style={styles.systemCardContent}>
            <View style={styles.systemIconContainer}>
              <Feather name="clock" size={20} color={Colors.textSecondary} />
            </View>
            <View style={styles.systemTextContainer}>
              <Text style={styles.systemText}>{post.systemText}</Text>
              <Text style={styles.systemTime}>{post.dueTime}</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.postCard}>
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
              </View>
              <Text style={styles.postTime}>{post.time}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handlePostOptions(post)}>
            <Feather name="more-horizontal" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Missions</Text>
            <Text style={styles.statValue}>{post.missions.completed}/{post.missions.total}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Time Saved</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>{post.wallet}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="fire" size={16} color={Colors.orange} />
            <Text style={[styles.statValue, { color: Colors.orange }]}>{post.streak}</Text>
          </View>
        </View>

        {/* Reactions */}
        <View style={styles.reactionsContainer}>
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => handleReaction(post.id, 'heart')}
          >
            <Feather name="heart" size={16} color={Colors.textMuted} />
            <Text style={styles.reactionCount}>{post.reactions.heart}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => handleReaction(post.id, 'fire')}
          >
            <MaterialCommunityIcons name="fire" size={16} color={Colors.orange} />
            <Text style={styles.reactionCount}>{post.reactions.fire}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.reactionButton}
            onPress={() => handleReaction(post.id, 'clap')}
          >
            <Text style={styles.clapEmoji}>👏</Text>
            <Text style={styles.reactionCount}>{post.reactions.clap}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
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

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feed Tab */}
        {circleTab === 'feed' && (
          <View>
            {/* Circle Activity Card */}
            <View style={styles.activityCard}>
              {/* Header Row */}
              <View style={styles.activityHeader}>
                <View style={styles.activityHeaderLeft}>
                  <Text style={styles.activityTitle}>Today's Activity</Text>
                  <LinearGradient
                    colors={['#fffbeb', '#fff7ed']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.streakBadge}
                  >
                    <MaterialCommunityIcons name="fire" size={14} color="#f59e0b" />
                    <Text style={styles.streakBadgeText}>7 day streak</Text>
                  </LinearGradient>
                </View>
                <TouchableOpacity onPress={handleOpenTodayModal}>
                  <Text style={styles.viewAllLink}>View all →</Text>
                </TouchableOpacity>
              </View>

              {/* Member Avatars Row */}
              <View style={styles.activityAvatarsRow}>
                {/* Current User Avatar */}
                <TouchableOpacity 
                  style={[styles.activityAvatarWrapper, userPosted && styles.activityAvatarPosted]}
                  onPress={() => {
                    setCircleTab('members');
                  }}
                >
                  <LinearGradient
                    colors={['#8b5cf6', '#ec4899']}
                    style={styles.activityAvatar}
                  >
                    <Text style={styles.activityAvatarText}>Y</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                {/* Other Members */}
                {circleMembers.slice(0, 4).map((member, index) => (
                  <TouchableOpacity 
                    key={member.id} 
                    style={[
                      styles.activityAvatarWrapper, 
                      styles.activityAvatarOverlap,
                      member.posted && styles.activityAvatarPosted
                    ]}
                    onPress={() => handleViewMember(member)}
                  >
                    <LinearGradient
                      colors={['#8b5cf6', '#ec4899']}
                      style={styles.activityAvatar}
                    >
                      <Text style={styles.activityAvatarText}>{member.initial}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
                
                {/* More Members Indicator */}
                {circleMembers.length > 4 && (
                  <TouchableOpacity 
                    style={[styles.activityAvatarWrapper, styles.activityAvatarOverlap]}
                    onPress={() => setCircleTab('members')}
                  >
                    <View style={styles.activityAvatarMore}>
                      <Text style={styles.activityAvatarMoreText}>+{circleMembers.length - 4}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* Status Text */}
              <Text style={styles.activityStatusText}>
                {postedCount === totalCount 
                  ? "Everyone's checked in! 🎉" 
                  : `${postedCount} of ${totalCount} members posted`}
              </Text>

              {/* Progress Bar */}
              <View style={styles.activityProgressTrack}>
                <LinearGradient
                  colors={['#8b5cf6', '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.activityProgressFill, { width: `${(postedCount / totalCount) * 100}%` }]}
                />
              </View>

              {/* Primary Action Button */}
              {userPosted ? (
                <View style={styles.activityPostedButton}>
                  <Feather name="check" size={18} color={Colors.success} />
                  <Text style={styles.activityPostedButtonText}>Posted</Text>
                </View>
              ) : (
                <TouchableOpacity activeOpacity={0.8} onPress={handleShareToday}>
                  <LinearGradient
                    colors={['#8b5cf6', '#ec4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.activityPrimaryButton}
                  >
                    <Text style={styles.activityPrimaryButtonText}>Share Your Day</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Secondary Action Buttons */}
              <View style={styles.activitySecondaryRow}>
                {/* Assign Mission - Killer Feature */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => setShowAssignModal(true)}
                  style={styles.assignMissionButton}
                >
                  <View style={styles.assignMissionIconWrapper}>
                    <Feather name="crosshair" size={18} color="#7c3aed" />
                  </View>
                  <Text style={styles.assignMissionButtonText}>Assign Mission</Text>
                </TouchableOpacity>
                
                {/* Invite Button */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  style={styles.inviteButton}
                  onPress={() => setShowInviteSheet(true)}
                >
                  <View style={styles.inviteIconWrapper}>
                    <Feather name="user-plus" size={16} color="#7c3aed" />
                  </View>
                  <Text style={styles.inviteButtonText}>Invite</Text>
                </TouchableOpacity>
              </View>

              {/* View All Link */}
              <TouchableOpacity 
                style={styles.activityViewAllLink}
                onPress={() => {
                  setCircleTab('feed');
                  setFeedFilter('all');
                }}
              >
                <Text style={styles.activityViewAllText}>View all activity</Text>
              </TouchableOpacity>
            </View>

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
              
              {/* Row 2: Filters */}
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
            </View>

            {/* Posts */}
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </View>
        )}

        {/* Members Tab */}
        {circleTab === 'members' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>MEMBERS ({totalCount})</Text>
              {isCurrentUserAdmin && (
                <TouchableOpacity 
                  onPress={() => setShowCircleSettings(true)}
                  style={styles.settingsButton}
                >
                  <Feather name="settings" size={18} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            
            {/* You Card */}
            <TouchableOpacity activeOpacity={0.8}>
              <LinearGradient
                colors={[Colors.primaryLight, '#f5f3ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.memberCard}
              >
                <View style={styles.memberInfo}>
                  <LinearGradient
                    colors={['#a78bfa', '#7c3aed']}
                    style={styles.memberAvatar}
                  >
                    <Text style={styles.memberAvatarText}>Y</Text>
                  </LinearGradient>
                  <View style={styles.memberDetails}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>You</Text>
                      <View style={styles.adminTagBadge}>
                        <Text style={styles.adminTagText}>Admin</Text>
                      </View>
                    </View>
                    <Text style={styles.memberRole}>Circle creator</Text>
                  </View>
                </View>
                <Text style={styles.adminBadge}>👑</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Other Members */}
            {circleMembers.map(member => (
              <TouchableOpacity 
                key={member.id} 
                activeOpacity={0.7}
                onPress={() => isCurrentUserAdmin ? handleMemberOptions(member) : handleViewMember(member)}
                onLongPress={() => isCurrentUserAdmin && handleMemberOptions(member)}
                style={styles.memberCardPlain}
              >
                <View style={styles.memberInfo}>
                  <LinearGradient
                    colors={['#c4b5fd', '#8b5cf6']}
                    style={styles.memberAvatar}
                  >
                    <Text style={styles.memberAvatarText}>{member.initial}</Text>
                  </LinearGradient>
                  <View style={styles.memberDetails}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.role === 'admin' && (
                        <View style={styles.adminTagBadge}>
                          <Text style={styles.adminTagText}>Admin</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.memberStatus}>
                      {member.posted ? `Posted ${member.lastPostTime}` : 'Not posted yet'}
                    </Text>
                  </View>
                </View>
                <View style={styles.memberActions}>
                  {member.posted && (
                    <View style={styles.postedIndicator}>
                      <Feather name="check" size={12} color={Colors.success} />
                    </View>
                  )}
                  {member.role === 'admin' && <Text style={styles.adminBadge}>👑</Text>}
                  <TouchableOpacity 
                    onPress={() => handleAssignToMember(member)}
                    style={styles.assignToMemberButton}
                  >
                    <Feather name="plus" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            {/* Invite Members Button */}
            <TouchableOpacity 
              onPress={() => setShowInviteSheet(true)}
              style={styles.inviteMembersButton}
            >
              <Feather name="user-plus" size={20} color={Colors.primary} />
              <Text style={styles.inviteMembersButtonText}>Invite Members</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Challenges Tab */}
        {circleTab === 'challenges' && (
          <View>
            <Text style={styles.sectionTitle}>CHALLENGES</Text>
            
            {assignments.map(assignment => (
              <View key={assignment.id} style={styles.challengeCard}>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => handleChallengeAction(assignment)}
                >
                  <View style={styles.challengeHeader}>
                    <View style={styles.challengeInfo}>
                      <Text style={styles.challengeTitle}>{assignment.title}</Text>
                      <Text style={styles.challengeAssigner}>Assigned by {assignment.assignedBy}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      assignment.status === 'pending' ? styles.statusPending : styles.statusAccepted
                    ]}>
                      <Text style={[
                        styles.statusText,
                        assignment.status === 'pending' ? styles.statusTextPending : styles.statusTextAccepted
                      ]}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.challengeDueTime}>⏰ {assignment.dueTime}</Text>
                </TouchableOpacity>
                
                {/* Progress Bar */}
                <View style={styles.challengeProgress}>
                  <View style={styles.challengeProgressTrack}>
                    <View style={[styles.challengeProgressFill, { width: '60%' }]} />
                  </View>
                  <Text style={styles.challengeProgressText}>3/5 days</Text>
                </View>
                
                {/* Log Today Button */}
                <TouchableOpacity 
                  style={styles.logTodayButton}
                  onPress={() => {
                    Alert.alert('Logged!', `Today's progress for "${assignment.title}" has been logged.`);
                  }}
                >
                  <Feather name="check-circle" size={16} color={Colors.primary} />
                  <Text style={styles.logTodayButtonText}>Log Today</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Start New Challenge Button */}
            <TouchableOpacity
              onPress={() => setShowAssignModal(true)}
              style={styles.startNewChallengeButton}
            >
              <Feather name="plus" size={20} color={Colors.primary} />
              <Text style={styles.startNewChallengeText}>Start New Challenge</Text>
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

      {/* Assign Mission Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { resetAssignForm(); setShowAssignModal(false); }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { resetAssignForm(); setShowAssignModal(false); }}
        >
          <View style={[styles.assignModalSheet]} onStartShouldSetResponder={() => true}>
            {/* Drag Handle */}
            <View style={styles.sheetHandle} />
            
            {/* Header */}
            <View style={styles.assignModalHeader}>
              <Text style={styles.assignModalTitle}>Assign Mission</Text>
              <TouchableOpacity 
                onPress={() => { resetAssignForm(); setShowAssignModal(false); }}
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
                      onPress={() => setDueDay(option)}
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
                  <TextInput
                    placeholder="Select date (e.g., Jan 28)"
                    value={customDueDate}
                    onChangeText={setCustomDueDate}
                    style={[styles.assignInput, { marginTop: 12 }]}
                    placeholderTextColor={Colors.textMuted}
                  />
                )}

                {/* Time Picker */}
                <View style={styles.timePickerRow}>
                  <Text style={styles.timePickerLabel}>Time</Text>
                  <View style={styles.timePickerInputWrapper}>
                    <TextInput
                      value={dueTime}
                      onChangeText={setDueTime}
                      style={styles.timePickerInput}
                      placeholder="18:00"
                      placeholderTextColor={Colors.textMuted}
                    />
                    <Feather name="clock" size={18} color={Colors.textMuted} />
                  </View>
                </View>

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
                        onPress={() => setRepeatEndType('untilDate')}
                      >
                        <View style={[styles.radioOuter, repeatEndType === 'untilDate' && styles.radioOuterActive]}>
                          {repeatEndType === 'untilDate' && <View style={styles.radioInner} />}
                        </View>
                        <Text style={styles.repeatEndOptionText}>Until</Text>
                        {repeatEndType === 'untilDate' && (
                          <TextInput
                            value={repeatEndDate}
                            onChangeText={setRepeatEndDate}
                            placeholder="Date"
                            style={styles.repeatEndDateInput}
                            placeholderTextColor={Colors.textMuted}
                          />
                        )}
                      </TouchableOpacity>

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

              {/* Bottom Buttons */}
              <View style={styles.assignBottomButtons}>
                <TouchableOpacity
                  onPress={() => { resetAssignForm(); setShowAssignModal(false); }}
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
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Member Picker Modal (Nested) */}
      <Modal
        visible={showMemberPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMemberPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMemberPicker(false)}
        >
          <View style={styles.memberPickerSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            
            {/* Header */}
            <View style={styles.assignModalHeader}>
              <Text style={styles.assignModalTitle}>Choose member</Text>
              <TouchableOpacity 
                onPress={() => setShowMemberPicker(false)}
                style={styles.assignModalClose}
              >
                <Feather name="x" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Member Grid */}
            <View style={styles.memberPickerGrid}>
              {circleMembers.map(member => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberPickerGridItem,
                    assignedMember?.id === member.id && styles.memberPickerGridItemSelected
                  ]}
                  onPress={() => handleSelectMember(member)}
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
              ))}
            </View>
          </View>
        </TouchableOpacity>
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
                  {(selectedPost.user?.name === 'You' || isCurrentUserAdmin) && (
                    <TouchableOpacity
                      onPress={() => handleEditPost(selectedPost)}
                      style={styles.actionSheetButton}
                    >
                      <Feather name="edit-2" size={20} color={Colors.primary} />
                      <Text style={styles.actionSheetButtonText}>Edit Post</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Show Delete option for own posts or if admin */}
                  {(selectedPost.user?.name === 'You' || isCurrentUserAdmin) && (
                    <TouchableOpacity
                      onPress={() => handleDeletePost(selectedPost.id)}
                      style={[styles.actionSheetButton, styles.actionSheetButtonDestructive]}
                    >
                      <Feather name="trash-2" size={20} color={Colors.danger} />
                      <Text style={[styles.actionSheetButtonText, { color: Colors.danger }]}>
                        Delete Post
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Report option for other people's posts */}
                  {selectedPost.user?.name !== 'You' && (
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

      {/* Edit Post Modal */}
      <Modal
        visible={showEditPostModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditPostModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditPostModal(false)}
        >
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Edit Post</Text>

            <Text style={styles.inputLabel}>Post Content</Text>
            <TextInput
              value={editPostContent}
              onChangeText={setEditPostContent}
              style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
              multiline
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.editPostNote}>
              Note: Edited posts will show an "edited" indicator.
            </Text>

            <TouchableOpacity
              onPress={handleSavePostEdit}
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowEditPostModal(false);
                setSelectedPost(null);
              }}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Share to Circle</Text>
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

  // Section Title
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 16,
    letterSpacing: 0.5,
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
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  
  // Edit Post Modal
  editPostNote: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 20,
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
  },
  timePickerInput: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
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
});

// Named export for compatibility with App.tsx import
export { CircleHomeScreen };
