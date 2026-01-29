import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlarmClock,
  ArrowLeft,
  Bell,
  Calendar,
  Camera,
  CheckCheck,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Inbox,
  MessageSquare,
  Repeat,
  Reply,
  Sparkles,
  StickyNote,
  Trash2,
  Users,
  UserPlus,
  X,
  Zap,
} from 'lucide-react-native';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { assignmentsApi, invitationsApi } from '../services/api';
import { useSocketEvent } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';

interface InboxScreenProps {
  navigation?: any;
}

interface Assignment {
  id: number | string;
  title: string;
  description?: string;
  assignedByName: string;
  assignedByAvatar?: string;
  assignedById?: string;  // Creator ID
  assigneeId?: string;    // Recipient ID
  circleName?: string;
  circleEmoji?: string;
  circleId?: string;
  dueTime?: string;
  dueDate?: string;
  dueDateFull?: string;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  category?: string;
  xpReward?: number;
  requireProof?: boolean;
  repeatEnabled?: boolean;
  repeatFrequency?: string;
  declineReason?: string;
  isEdited?: boolean;
  editedAt?: string;
  editedChanges?: string[];  // Array of what was changed
  createdAt?: string;
}

type TabType = 'all' | 'messages' | 'reminders' | 'invites';

interface NotificationItem {
  id: number | string;
  title: string;
  subtitle?: string;
  type: 'message' | 'reminder' | 'invite' | 'social';
  time: string;
  isNew?: boolean;
  circleName?: string;
  senderName?: string;
}

type Feedback = { id: number; message: string; type: 'success' | 'info' } | null;

type DelayedActionBase = { id: number; delayMs: number };

type DelayedAction =
  | (DelayedActionBase & { type: 'removeItem'; itemId: number | string })
  | (DelayedActionBase & { type: 'removeItemNavigate'; itemId: number | string; target: string })
  | (DelayedActionBase & { type: 'removeAssignment'; assignmentId: number | string })
  | (DelayedActionBase & { type: 'removeAssignmentNavigate'; assignmentId: number | string; target: string })
  | (DelayedActionBase & { type: 'clearSnooze'; itemId: number | string });

type DelayedActionInput =
  | { type: 'removeItem'; itemId: number | string; delayMs: number }
  | { type: 'removeItemNavigate'; itemId: number | string; delayMs: number; target: string }
  | { type: 'removeAssignment'; assignmentId: number | string; delayMs: number }
  | { type: 'removeAssignmentNavigate'; assignmentId: number | string; delayMs: number; target: string }
  | { type: 'clearSnooze'; itemId: number | string; delayMs: number };

const STORAGE_KEYS = {
  pendingPlanTasks: 'pendingPlanTasks',
  highlightNewTask: 'highlightNewTask',
  pendingCircleAction: 'pendingCircleAction',
  pendingMessageAction: 'pendingMessageAction',
  lastCompletedReminder: 'lastCompletedReminder',
};

// Helper: Format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
};

// Helper: Format due date
const formatDueDate = (dateString: string): string => {
  // Parse the date - handle ISO strings properly
  const date = new Date(dateString);
  
  // Get today and tomorrow in local time (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Compare just the date parts
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) return 'Today';
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const tabs: { id: TabType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'messages', label: 'Messages' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'invites', label: 'Invites' },
];

const iconFor = (type: NotificationItem['type']) => {
  switch (type) {
    case 'message':
      return { Icon: MessageSquare, color: '#2563EB', bg: '#DBEAFE' };
    case 'reminder':
      return { Icon: AlarmClock, color: '#D97706', bg: '#FEF3C7' };
    case 'invite':
      return { Icon: Users, color: '#7C3AED', bg: '#EDE9FE' };
    case 'social':
      return { Icon: Heart, color: '#DB2777', bg: '#FCE7F3' };
    default:
      return { Icon: Inbox, color: '#64748B', bg: '#E2E8F0' };
  }
};

const statusTone = (status: Assignment['status']) => {
  switch (status) {
    case 'pending':
      return { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' };
    case 'accepted':
      return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
    case 'completed':
      return { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' };
    case 'declined':
      return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
    default:
      return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
  }
};

const statusLabel = (status: Assignment['status']) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Accepted';
    case 'completed':
      return 'Done';
    case 'declined':
      return 'Declined';
    default:
      return status;
  }
};

const SlideInCard = ({ children, index }: { children: React.ReactNode; index?: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      delay: Math.min((index || 0) * 40, 200),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

const PulseDot = ({ color }: { color: string }) => {
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.pulseDot, { backgroundColor: color, opacity: pulse }]} />
  );
};

export function InboxScreen({ navigation }: InboxScreenProps) {
  const nav = useNavigation<any>();
  // Navigation helper for cross-stack navigation
  const handleNavigate = (screen: string, params?: { date?: string; taskId?: string }) => {
    const navigator = navigation || nav;
    if (!navigator) return;
    const homeStackRoutes: { [key: string]: string } = {
      hub: 'Hub',
      inbox: 'Inbox',
      wallet: 'Wallet',
      challenges: 'Challenges',
      settings: 'Settings',
    };

    if (homeStackRoutes[screen]) {
      navigator.navigate('Home', { screen: homeStackRoutes[screen] });
    } else if (screen === 'plan') {
      navigator.navigate('Plan', params || {});
    } else if (screen === 'circles' || screen === 'circle-home') {
      navigator.navigate('Circles', { screen: screen === 'circle-home' ? 'CircleHome' : 'CirclesList' });
    } else {
      navigator.navigate(screen);
    }
  };

  // Get current user
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [actionFeedback, setActionFeedback] = useState<Feedback>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Decline Mission Modal State
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineAssignmentId, setDeclineAssignmentId] = useState<string | number | null>(null);
  const [declineAssignmentTitle, setDeclineAssignmentTitle] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [decliningInProgress, setDecliningInProgress] = useState(false);
  
  // Assignment Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  
  // Edit Mission Modal State (for mission sender)
  const [showEditMissionModal, setShowEditMissionModal] = useState(false);
  const [editMissionData, setEditMissionData] = useState<{
    title: string;
    description: string;
    dueDate: Date | null;
    dueTime: Date | null;
    xpReward: number;
    repeatEnabled: boolean;
    repeatFrequency: string;
    requireProof: boolean;
  }>({
    title: '',
    description: '',
    dueDate: null,
    dueTime: null,
    xpReward: 50,
    repeatEnabled: false,
    repeatFrequency: 'daily',
    requireProof: false,
  });
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [editingInProgress, setEditingInProgress] = useState(false);
  
  // Edit Response Modal State (for assignee - edit decline reason or accept)
  const [showEditResponseModal, setShowEditResponseModal] = useState(false);
  const [editResponseReason, setEditResponseReason] = useState('');
  const [editingResponseInProgress, setEditingResponseInProgress] = useState(false);
  
  // Action Sheet State (shown on long press)
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [actionSheetAssignment, setActionSheetAssignment] = useState<Assignment | null>(null);
  
  // Multi-select mode (WhatsApp-style)
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string | number>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);
  
  // Real data from API - start empty
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [circleInvitations, setCircleInvitations] = useState<any[]>([]);
  
  // Transform circle invitations to NotificationItem format
  const inviteItems: NotificationItem[] = circleInvitations.map((inv: any) => ({
    id: inv.id,
    title: `Circle invite from ${inv.inviter?.name || inv.inviter?.username || 'Someone'}`,
    subtitle: `Join "${inv.circle?.name || 'circle'}"${inv.message ? ` - ${inv.message}` : ''}`,
    type: 'invite' as const,
    time: formatTimeAgo(inv.createdAt),
    isNew: true,
    circleName: inv.circle?.name,
    senderName: inv.inviter?.name || inv.inviter?.username,
    _invitationId: inv.id,
  }));
  
  // Combine invites with other notification items
  const [items, setItems] = useState<NotificationItem[]>([]);
  
  // Merge inviteItems with local items (messages, reminders)
  const allItems = useMemo(() => {
    // Filter out old invite items and add fresh ones from API
    const nonInviteItems = items.filter(i => i.type !== 'invite');
    return [...inviteItems, ...nonInviteItems];
  }, [inviteItems, items]);

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('[InboxScreen] Screen focused, fetching data...');
      fetchAllData();
    }, [])
  );

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAssignments(),
      fetchInvitations(),
    ]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const fetchAssignments = async () => {
    try {
      const response = await assignmentsApi.getMine({ role: 'assignee', status: 'PENDING' });
      console.log('[InboxScreen] Raw assignments from API:', JSON.stringify(response.data?.map((a: any) => ({ id: a.id, title: a.title, dueDate: a.dueDate })), null, 2));
      if (response.success && response.data) {
        const formatted: Assignment[] = response.data.map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description || '',
          assignedByName: a.creator?.name || a.creator?.username || 'Someone',
          assignedByAvatar: a.creator?.avatarUrl,
          assignedById: a.creator?.id,
          assigneeId: a.assignee?.id,
          circleName: a.circle?.name,
          circleEmoji: a.circle?.emoji || '👥',
          circleId: a.circleId,
          dueTime: a.dueDate ? new Date(a.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          dueDate: a.dueDate ? formatDueDate(a.dueDate) : undefined,
          dueDateFull: a.dueDate,
          status: a.status?.toLowerCase() || 'pending',
          category: 'Mission',
          xpReward: a.xpReward || 50,
          requireProof: a.requireProof || false,
          repeatEnabled: a.repeatEnabled || false,
          repeatFrequency: a.repeatFrequency,
          declineReason: a.declineReason,
          isEdited: a.isEdited || false,
          editedAt: a.editedAt,
          editedChanges: a.editedChanges || [],
          createdAt: a.createdAt,
        }));
        console.log('[InboxScreen] Formatted assignments:', JSON.stringify(formatted.map(a => ({ id: a.id, title: a.title, dueDate: a.dueDate, dueDateFull: a.dueDateFull })), null, 2));
        setAssignments(formatted);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await invitationsApi.getMine();
      if (response.success && response.data) {
        setCircleInvitations(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  // Real-time: New assignment received
  useSocketEvent('assignment:new', (data: any) => {
    console.log('📨 New assignment received:', data);
    fetchAssignments();
  }, []);

  const [snoozedItems, setSnoozedItems] = useState<Set<number | string>>(new Set());
  const [delayedActions, setDelayedActions] = useState<DelayedAction[]>([]);
  const scheduledRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const nextActionId = useRef(1);

  const enqueueAction = (action: DelayedActionInput) => {
    const newAction: DelayedAction = { ...action, id: nextActionId.current++ };
    setDelayedActions(prev => [...prev, newAction]);
  };

  useEffect(() => {
    if (!actionFeedback) return;
    const timer = setTimeout(() => setActionFeedback(null), 2000);
    return () => clearTimeout(timer);
  }, [actionFeedback]);

  useEffect(() => {
    delayedActions.forEach(action => {
      if (scheduledRef.current.has(action.id)) return;
      const timer = setTimeout(() => {
        if (action.type === 'removeItem') {
          setItems(prev => prev.filter(it => it.id !== action.itemId));
        }
        if (action.type === 'removeItemNavigate') {
          setItems(prev => prev.filter(it => it.id !== action.itemId));
          handleNavigate(action.target);
        }
        if (action.type === 'removeAssignment') {
          setAssignments(prev => prev.filter(a => a.id !== action.assignmentId));
        }
        if (action.type === 'removeAssignmentNavigate') {
          setAssignments(prev => prev.filter(a => a.id !== action.assignmentId));
          handleNavigate(action.target);
        }
        if (action.type === 'clearSnooze') {
          setSnoozedItems(prev => {
            const next = new Set(prev);
            next.delete(action.itemId);
            return next;
          });
        }
        setDelayedActions(prev => prev.filter(a => a.id !== action.id));
        scheduledRef.current.delete(action.id);
      }, action.delayMs);
      scheduledRef.current.set(action.id, timer);
    });
  }, [delayedActions, navigation, nav]);

  useEffect(() => {
    return () => {
      scheduledRef.current.forEach(timer => clearTimeout(timer));
      scheduledRef.current.clear();
    };
  }, []);

  const filtered = useMemo(() => {
    return allItems.filter(it =>
      activeTab === 'all'
        ? true
        : activeTab === 'messages'
        ? it.type === 'message'
        : activeTab === 'reminders'
        ? it.type === 'reminder'
        : activeTab === 'invites'
        ? it.type === 'invite'
        : true
    );
  }, [activeTab, allItems]);

  const newCount = allItems.filter(i => i.isNew).length;

  const showFeedback = (id: number | string, message: string, type: 'success' | 'info' = 'success') => {
    // Convert string id to a numeric hash for feedback
    const numericId = typeof id === 'string' 
      ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) 
      : id;
    setActionFeedback({ id: numericId, message, type });
  };

  const markRead = (id: number | string) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, isNew: false } : it)));
  };

  const snoozeItem = (id: number | string) => {
    setSnoozedItems(prev => new Set(prev).add(id));
    showFeedback(id, 'Snoozed for 1 hour', 'info');
    enqueueAction({ type: 'removeItem', itemId: id, delayMs: 1500 });
    enqueueAction({ type: 'clearSnooze', itemId: id, delayMs: 1500 });
  };

  const acceptInvite = async (id: number | string) => {
    const invite = allItems.find(it => it.id === id);
    const circleName = invite?.circleName || 'circle';
    const invitationId = (invite as any)?._invitationId || id;

    showFeedback(id, `Joining ${circleName}...`, 'success');

    try {
      // Call real API to accept invitation
      const response = await invitationsApi.accept(String(invitationId));
      
      if (response.success) {
        // Remove from local state
        setCircleInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        
        // Navigate to circles
        setTimeout(() => handleNavigate('circles'), 1000);
      } else {
        Alert.alert('Error', response.error || 'Failed to accept invitation');
      }
    } catch (e) {
      console.error('Error accepting invite:', e);
      Alert.alert('Error', 'Failed to accept invitation');
    }
  };

  const declineInvite = async (id: number | string) => {
    const invite = allItems.find(it => it.id === id);
    const invitationId = (invite as any)?._invitationId || id;

    showFeedback(id, 'Invite declined', 'info');

    try {
      // Call real API to decline invitation
      const response = await invitationsApi.decline(String(invitationId));
      
      if (response.success) {
        // Remove from local state
        setCircleInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      }
    } catch (e) {
      console.error('Error declining invite:', e);
    }
  };

  const handleMessageReply = async (id: number | string) => {
    const message = items.find(it => it.id === id);
    markRead(id);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.pendingMessageAction,
        JSON.stringify({
          action: 'reply',
          senderName: message?.senderName || 'Unknown',
          messagePreview: message?.subtitle || '',
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.warn('Error storing message action', e);
    }

    handleNavigate('circle-home');
  };

  const handleMessageArchive = (id: number | string) => {
    showFeedback(id, 'Archived', 'info');
    enqueueAction({ type: 'removeItem', itemId: id, delayMs: 600 });
  };

  const handleReminderDone = async (id: number | string) => {
    const reminder = items.find(it => it.id === id);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.lastCompletedReminder,
        JSON.stringify({
          action: 'completed',
          title: reminder?.title || 'Reminder',
          completedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.warn('Error storing reminder completion', e);
    }

    showFeedback(id, 'Marked complete ✓', 'success');
    enqueueAction({ type: 'removeItem', itemId: id, delayMs: 800 });
  };

  const handleSocialView = (id: number | string) => {
    markRead(id);
    handleNavigate('circles');
  };

  const acceptAssignment = async (id: number | string, goToPlan: boolean = false) => {
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;

    showFeedback(assignment.id, 'Adding to your plan...', 'success');

    try {
      // Call real API to accept assignment (this creates a task in the backend)
      const response = await assignmentsApi.accept(String(id));
      
      if (response.success) {
        // Extract task info from response for navigation
        const taskData = response.data?.task;
        const taskId = taskData?.id ? String(taskData.id) : undefined;
        // Use dueDateFull (the raw ISO date) not dueDate (the formatted "Today" string)
        const taskDate = taskData?.date || (assignment.dueDateFull ? new Date(assignment.dueDateFull).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        
        // Update local state
        setAssignments(prev => prev.map(a => (a.id === id ? { ...a, status: 'accepted' } : a)));
        
        showFeedback(assignment.id, '✅ Added to Plan!', 'success');
        
        // Navigate to plan with the task date
        const navigateToPlan = () => {
          setAssignments(prev => prev.filter(a => a.id !== id));
          handleNavigate('plan', { date: taskDate, taskId });
        };
        
        if (goToPlan) {
          setTimeout(navigateToPlan, 800);
        } else {
          // Show success and offer to view plan with the specific date
          setTimeout(() => {
            Alert.alert(
              'Mission Added! 🎯',
              `"${assignment.title}" has been added to your plan for ${new Date(taskDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}.`,
              [
                { text: 'Stay Here', style: 'cancel', onPress: () => setAssignments(prev => prev.filter(a => a.id !== id)) },
                { text: 'View in Plan', onPress: navigateToPlan },
              ]
            );
          }, 500);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to accept mission');
      }
    } catch (e) {
      console.error('Error accepting assignment:', e);
      Alert.alert('Error', 'Failed to accept mission');
    }
  };

  const declineAssignment = async (id: number | string, reason?: string) => {
    const assignment = assignments.find(a => a.id === id);
    
    try {
      // Call real API to decline assignment with optional reason
      const response = await assignmentsApi.decline(String(id), reason);
      
      if (response.success) {
        const message = reason 
          ? `Declined - ${assignment?.assignedByName} will see your reason`
          : `Declined - ${assignment?.assignedByName} notified`;
        showFeedback(id, message, 'info');
        setAssignments(prev => prev.map(a => (a.id === id ? { ...a, status: 'declined' } : a)));
        
        // Remove after delay
        setTimeout(() => {
          setAssignments(prev => prev.filter(a => a.id !== id));
        }, 1500);
      }
    } catch (e) {
      console.error('Error declining assignment:', e);
    }
  };

  // Show decline modal instead of simple alert
  const confirmDecline = (id: number | string, title?: string) => {
    setDeclineAssignmentId(id);
    setDeclineAssignmentTitle(title || 'this mission');
    setDeclineReason('');
    setShowDeclineModal(true);
  };

  // Confirm decline with optional reason
  const handleConfirmDecline = async (withReason: boolean) => {
    if (!declineAssignmentId) return;
    
    setDecliningInProgress(true);
    try {
      await declineAssignment(
        declineAssignmentId, 
        withReason && declineReason.trim() ? declineReason.trim() : undefined
      );
      setShowDeclineModal(false);
      setDeclineAssignmentId(null);
      setDeclineReason('');
    } catch (error) {
      console.error('Failed to decline assignment:', error);
      Alert.alert('Error', 'Failed to decline assignment');
    } finally {
      setDecliningInProgress(false);
    }
  };

  const completeAssignment = async (id: number | string) => {
    try {
      const response = await assignmentsApi.complete(String(id));
      
      if (response.success) {
        showFeedback(id, 'Completed! Great job 🎉', 'success');
        setAssignments(prev => prev.map(a => (a.id === id ? { ...a, status: 'completed' } : a)));
        
        // Remove after delay
        setTimeout(() => {
          setAssignments(prev => prev.filter(a => a.id !== id));
        }, 1500);
      }
    } catch (e) {
      console.error('Error completing assignment:', e);
    }
  };

  const viewAssignmentInPlan = () => {
    handleNavigate('plan');
  };

  const openAssignmentDetail = (assignment: Assignment) => {
    // Don't open detail if in selection mode - toggle selection instead
    if (selectionMode) {
      toggleAssignmentSelection(assignment.id);
      return;
    }
    setSelectedAssignment(assignment);
    setShowDetailModal(true);
  };

  // Long press handler - shows action sheet first (restored original behavior)
  const handleLongPressAssignment = (assignment: Assignment) => {
    if (selectionMode) {
      // Already in selection mode, just toggle this item
      toggleAssignmentSelection(assignment.id);
    } else {
      // Show action sheet with options
      setActionSheetAssignment(assignment);
      setShowActionSheet(true);
    }
  };

  // Enter selection mode for delete (triggered from action sheet "Delete" option)
  const enterDeleteSelectionMode = (assignment: Assignment) => {
    setShowActionSheet(false);
    setSelectionMode(true);
    setSelectedAssignments(new Set([assignment.id]));
  };

  // Toggle assignment selection
  const toggleAssignmentSelection = (id: string | number) => {
    setSelectedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        // Exit selection mode if nothing selected
        if (newSet.size === 0) {
          setSelectionMode(false);
        }
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Cancel selection mode
  const cancelSelectionMode = () => {
    setSelectionMode(false);
    setSelectedAssignments(new Set());
  };

  // Delete selected assignments
  const deleteSelectedAssignments = async () => {
    const count = selectedAssignments.size;
    
    Alert.alert(
      'Delete Missions',
      `Are you sure you want to delete ${count} mission${count > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingSelected(true);
            try {
              // Delete each selected assignment
              const deletePromises = Array.from(selectedAssignments).map(id =>
                assignmentsApi.delete(String(id))
              );
              
              const results = await Promise.allSettled(deletePromises);
              const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
              
              if (successCount > 0) {
                // Remove from local state
                setAssignments(prev => prev.filter(a => !selectedAssignments.has(a.id)));
                Alert.alert('Success', `Deleted ${successCount} mission${successCount > 1 ? 's' : ''}`);
              } else {
                Alert.alert('Error', 'Failed to delete missions. You can only delete missions you created.');
              }
              
              // Exit selection mode
              cancelSelectionMode();
            } catch (error) {
              console.error('Failed to delete assignments:', error);
              Alert.alert('Error', 'Failed to delete some missions');
            } finally {
              setDeletingSelected(false);
            }
          },
        },
      ]
    );
  };

  // Check if current user is the sender (creator) of the assignment
  const isAssignmentSender = (assignment: Assignment) => {
    return user?.id === assignment.assignedById;
  };

  // Check if current user is the recipient (assignee) of the assignment
  const isAssignmentRecipient = (assignment: Assignment) => {
    return user?.id === assignment.assigneeId;
  };

  // Open edit mission modal (for sender to edit mission details)
  const openEditMissionModal = (assignment: Assignment) => {
    setShowActionSheet(false);
    setEditMissionData({
      title: assignment.title,
      description: assignment.description || '',
      dueDate: assignment.dueDateFull ? new Date(assignment.dueDateFull) : null,
      dueTime: assignment.dueDateFull ? new Date(assignment.dueDateFull) : null,
      xpReward: assignment.xpReward || 50,
      repeatEnabled: assignment.repeatEnabled || false,
      repeatFrequency: assignment.repeatFrequency || 'daily',
      requireProof: assignment.requireProof || false,
    });
    setShowEditMissionModal(true);
  };

  // Open edit response modal (for assignee to edit decline reason or accept)
  const openEditResponseModal = (assignment: Assignment) => {
    setShowActionSheet(false);
    setEditResponseReason(assignment.declineReason || '');
    setShowEditResponseModal(true);
  };

  // Handle saving mission edits (sender only)
  const handleSaveMissionEdit = async () => {
    if (!actionSheetAssignment) return;
    
    setEditingInProgress(true);
    try {
      // Combine date and time
      let dueDateISO: string | null = null;
      if (editMissionData.dueDate) {
        const combined = new Date(editMissionData.dueDate);
        if (editMissionData.dueTime) {
          combined.setHours(editMissionData.dueTime.getHours());
          combined.setMinutes(editMissionData.dueTime.getMinutes());
        }
        dueDateISO = combined.toISOString();
      }

      const response = await assignmentsApi.update(String(actionSheetAssignment.id), {
        title: editMissionData.title,
        description: editMissionData.description || null,
        dueDate: dueDateISO,
        xpReward: editMissionData.xpReward,
        repeatEnabled: editMissionData.repeatEnabled,
        repeatFrequency: editMissionData.repeatEnabled ? editMissionData.repeatFrequency : null,
        requireProof: editMissionData.requireProof,
      });

      if (response.success) {
        Alert.alert('Success', 'Mission updated! The recipient has been notified.');
        await fetchAssignments(); // Refresh the list
        setShowEditMissionModal(false);
        setActionSheetAssignment(null);
      } else {
        Alert.alert('Error', response.error || 'Failed to update mission');
      }
    } catch (error) {
      console.error('Failed to update mission:', error);
      Alert.alert('Error', 'Failed to update mission');
    } finally {
      setEditingInProgress(false);
    }
  };

  // Handle updating decline reason (assignee only)
  const handleUpdateDeclineReason = async () => {
    if (!actionSheetAssignment) return;
    
    setEditingResponseInProgress(true);
    try {
      const response = await assignmentsApi.updateResponse(
        String(actionSheetAssignment.id),
        'update-reason',
        editResponseReason.trim() || undefined
      );

      if (response.success) {
        Alert.alert('Success', 'Your response has been updated.');
        await fetchAssignments();
        setShowEditResponseModal(false);
        setActionSheetAssignment(null);
      } else {
        Alert.alert('Error', response.error || 'Failed to update response');
      }
    } catch (error) {
      console.error('Failed to update response:', error);
      Alert.alert('Error', 'Failed to update response');
    } finally {
      setEditingResponseInProgress(false);
    }
  };

  // Handle accepting after previously declining (assignee only)
  const handleAcceptAfterDecline = async () => {
    if (!actionSheetAssignment) return;
    
    setEditingResponseInProgress(true);
    try {
      const response = await assignmentsApi.updateResponse(
        String(actionSheetAssignment.id),
        'accept'
      );

      if (response.success) {
        Alert.alert('Success', 'Mission accepted! The sender has been notified.');
        await fetchAssignments();
        setShowEditResponseModal(false);
        setActionSheetAssignment(null);
      } else {
        Alert.alert('Error', response.error || 'Failed to accept mission');
      }
    } catch (error) {
      console.error('Failed to accept mission:', error);
      Alert.alert('Error', 'Failed to accept mission');
    } finally {
      setEditingResponseInProgress(false);
    }
  };

  const renderAssignment = ({ item, index }: { item: Assignment; index: number }) => {
    const tone = statusTone(item.status);
    const isSelected = selectedAssignments.has(item.id);
    
    return (
      <SlideInCard index={index}>
        <Pressable 
          onPress={() => openAssignmentDetail(item)}
          onLongPress={() => handleLongPressAssignment(item)}
          delayLongPress={400}
          style={({ pressed }) => [
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
          ]}
        >
          <BlurView intensity={50} tint="light" style={[
            styles.card, 
            item.isEdited && styles.editedCard,
            isSelected && selectionStyles.selectedCard
          ]}>
            {/* Selection Checkbox (WhatsApp style) */}
            {selectionMode && (
              <TouchableOpacity 
                style={selectionStyles.checkboxRow}
                onPress={() => toggleAssignmentSelection(item.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  selectionStyles.checkbox,
                  isSelected && selectionStyles.checkboxSelected
                ]}>
                  {isSelected && (
                    <Feather name="check" size={14} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            )}
            
            {/* Edited Banner */}
            {item.isEdited && (
              <View style={styles.editedBanner}>
                <Feather name="edit-2" size={12} color="#F59E0B" />
                <Text style={styles.editedBannerText}>Mission Updated</Text>
                <Text style={styles.editedBannerSubtext}>Tap to see changes</Text>
              </View>
            )}
            
            {/* Header Row */}
            <View style={styles.assignmentHeader}>
              <View style={[styles.assignmentIcon, item.isEdited && { backgroundColor: '#F59E0B' }]}>
                {item.isEdited ? (
                  <Feather name="refresh-cw" size={20} color="#FFFFFF" />
                ) : (
                  <Clock size={20} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.assignmentInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.assignmentTitle}>{item.title}</Text>
                </View>
                <View style={styles.assignmentFromRow}>
                  <Text style={styles.assignmentSubtitle}>From {item.assignedByName}</Text>
                  {item.circleName && (
                    <View style={styles.circleChip}>
                      <Text style={styles.circleChipEmoji}>{item.circleEmoji || '👥'}</Text>
                      <Text style={styles.circleChipText}>{item.circleName}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Eye size={18} color="#94A3B8" style={{ marginLeft: 8 }} />
            </View>

            {/* Changes Summary for Edited Missions */}
            {item.isEdited && item.editedChanges && item.editedChanges.length > 0 && (
              <View style={styles.changesPreview}>
                <Text style={styles.changesPreviewLabel}>What changed:</Text>
                <Text style={styles.changesPreviewText} numberOfLines={2}>
                  {item.editedChanges.slice(0, 2).join(' • ')}
                  {item.editedChanges.length > 2 ? ` +${item.editedChanges.length - 2} more` : ''}
                </Text>
              </View>
            )}

            {/* Note/Description */}
            {item.description && (
              <View style={styles.missionNote}>
                <StickyNote size={14} color="#64748B" />
                <Text style={styles.missionNoteText} numberOfLines={2}>{item.description}</Text>
              </View>
            )}

            {/* Details Row */}
            <View style={styles.missionDetails}>
              {/* Due Date & Time */}
              {item.dueDate && (
                <View style={styles.detailChip}>
                  <Calendar size={12} color="#7C3AED" />
                  <Text style={styles.detailChipText}>{item.dueDate} at {item.dueTime}</Text>
                </View>
              )}

              {/* XP Reward */}
              <View style={[styles.detailChip, styles.xpChip]}>
                <Zap size={12} color="#F59E0B" />
                <Text style={[styles.detailChipText, { color: '#F59E0B' }]}>{item.xpReward || 50} XP</Text>
              </View>
            </View>

            {/* Tags Row - Repeat, Proof, Nudged */}
            <View style={styles.missionTags}>
              {item.repeatEnabled && (
                <View style={[styles.tagChip, styles.repeatTag]}>
                  <Repeat size={12} color="#2563EB" />
                  <Text style={styles.repeatTagText}>
                    {item.repeatFrequency === 'daily' ? 'Daily' : 
                     item.repeatFrequency === 'weekly' ? 'Weekly' : 'Monthly'}
                  </Text>
                </View>
              )}

              {item.requireProof && (
                <View style={[styles.tagChip, styles.proofTag]}>
                  <Camera size={12} color="#7C3AED" />
                  <Text style={styles.proofTagText}>Proof Required</Text>
                </View>
              )}

              <View style={[styles.tagChip, styles.nudgeTag]}>
                <Bell size={12} color="#10B981" />
                <Text style={styles.nudgeTagText}>Nudged</Text>
              </View>
            </View>

            {/* Status Badge */}
            <View style={styles.assignmentMeta}>
              <View style={[styles.statusBadge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                <Text style={[styles.statusText, { color: tone.text }]}>{statusLabel(item.status)}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.cardActions}>
              {actionFeedback?.id === item.id ? (
                <View style={[styles.feedbackChip, actionFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackInfo]}>
                  <CheckCircle size={14} color={actionFeedback.type === 'success' ? '#10B981' : '#64748B'} />
                  <Text style={styles.feedbackText}>{actionFeedback.message}</Text>
                </View>
              ) : (
                <>
                  {item.status === 'pending' && (
                    <>
                      <Pressable style={styles.primaryAction} onPress={() => acceptAssignment(item.id)}>
                        <CheckCircle size={14} color="#10B981" />
                        <Text style={styles.primaryActionText}>Add to Plan</Text>
                      </Pressable>
                      <Pressable style={styles.secondaryAction} onPress={() => confirmDecline(item.id, item.title)}>
                        <X size={14} color="#94A3B8" />
                        <Text style={styles.secondaryActionText}>Decline</Text>
                      </Pressable>
                    </>
                  )}
                  {item.status === 'accepted' && (
                    <>
                      <Pressable style={styles.primaryAction} onPress={() => completeAssignment(item.id)}>
                        <CheckCircle size={14} color="#10B981" />
                        <Text style={styles.primaryActionText}>Mark Complete</Text>
                      </Pressable>
                    <Pressable style={styles.secondaryAction} onPress={() => {
                      const taskDate = item.dueDateFull ? new Date(item.dueDateFull).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                      handleNavigate('plan', { date: taskDate });
                    }}>
                      <Calendar size={14} color="#2563EB" />
                      <Text style={[styles.secondaryActionText, { color: '#2563EB' }]}>View in Plan</Text>
                    </Pressable>
                  </>
                )}
              </>
            )}
          </View>
        </BlurView>
        </Pressable>
      </SlideInCard>
    );
  };

  const renderItem = ({ item, index }: { item: NotificationItem; index: number }) => {
    const icon = iconFor(item.type);
    return (
      <SlideInCard index={index}>
        <BlurView intensity={50} tint="light" style={[styles.card, item.isNew && styles.newCard]}>
          <View style={styles.activityHeader}>
            <View style={[styles.activityIcon, { backgroundColor: icon.bg }]}>
              <icon.Icon size={18} color={icon.color} />
            </View>
            <View style={styles.activityBody}>
              <View style={styles.activityTitleRow}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <View style={styles.activityMeta}>
                  {item.isNew && <PulseDot color="#7C3AED" />}
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              </View>
              {item.subtitle && <Text style={styles.activitySubtitle}>{item.subtitle}</Text>}
            </View>
          </View>

          <View style={styles.cardActions}>
            {actionFeedback?.id === item.id ? (
              <View style={[styles.feedbackChip, actionFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackInfo]}>
                <CheckCircle size={14} color={actionFeedback.type === 'success' ? '#10B981' : '#64748B'} />
                <Text style={styles.feedbackText}>{actionFeedback.message}</Text>
              </View>
            ) : (
              <>
                {item.type === 'message' && (
                  <>
                    <Pressable style={styles.primaryAction} onPress={() => handleMessageReply(item.id)}>
                      <Reply size={14} color="#2563EB" />
                      <Text style={[styles.primaryActionText, { color: '#2563EB' }]}>Reply</Text>
                    </Pressable>
                    {item.isNew && (
                      <Pressable style={styles.secondaryAction} onPress={() => markRead(item.id)}>
                        <CheckCheck size={14} color="#64748B" />
                        <Text style={styles.secondaryActionText}>Read</Text>
                      </Pressable>
                    )}
                    <Pressable style={styles.iconAction} onPress={() => handleMessageArchive(item.id)}>
                      <Trash2 size={16} color="#94A3B8" />
                    </Pressable>
                  </>
                )}
                {item.type === 'reminder' && (
                  <>
                    <Pressable style={styles.primaryAction} onPress={() => handleReminderDone(item.id)}>
                      <CheckCircle size={14} color="#10B981" />
                      <Text style={styles.primaryActionText}>Done</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.secondaryAction, snoozedItems.has(item.id) && styles.secondaryDisabled]}
                      onPress={() => snoozeItem(item.id)}
                      disabled={snoozedItems.has(item.id)}
                    >
                      <AlarmClock size={14} color="#B45309" />
                      <Text style={[styles.secondaryActionText, { color: '#B45309' }]}>
                        {snoozedItems.has(item.id) ? 'Snoozed' : 'Snooze 1h'}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.iconAction} onPress={() => {
                      showFeedback(item.id, 'Dismissed', 'info');
                      enqueueAction({ type: 'removeItem', itemId: item.id, delayMs: 600 });
                    }}>
                      <X size={16} color="#94A3B8" />
                    </Pressable>
                  </>
                )}
                {item.type === 'invite' && (
                  <>
                    <Pressable style={styles.primaryAction} onPress={() => acceptInvite(item.id)}>
                      <UserPlus size={14} color="#7C3AED" />
                      <Text style={[styles.primaryActionText, { color: '#7C3AED' }]}>Join Circle</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryAction} onPress={() => handleSocialView(item.id)}>
                      <Eye size={14} color="#64748B" />
                      <Text style={styles.secondaryActionText}>View</Text>
                    </Pressable>
                    <Pressable style={styles.iconAction} onPress={() => declineInvite(item.id)}>
                      <X size={16} color="#94A3B8" />
                    </Pressable>
                  </>
                )}
                {item.type === 'social' && (
                  <>
                    <Pressable style={styles.primaryAction} onPress={() => handleSocialView(item.id)}>
                      <Heart size={14} color="#DB2777" />
                      <Text style={[styles.primaryActionText, { color: '#DB2777' }]}>View Activity</Text>
                    </Pressable>
                    {item.isNew && (
                      <Pressable style={styles.secondaryAction} onPress={() => markRead(item.id)}>
                        <CheckCheck size={14} color="#64748B" />
                        <Text style={styles.secondaryActionText}>Read</Text>
                      </Pressable>
                    )}
                    <Pressable style={styles.iconAction} onPress={() => {
                      showFeedback(item.id, 'Archived', 'info');
                      enqueueAction({ type: 'removeItem', itemId: item.id, delayMs: 600 });
                    }}>
                      <Trash2 size={16} color="#94A3B8" />
                    </Pressable>
                  </>
                )}
              </>
            )}
          </View>
        </BlurView>
      </SlideInCard>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <IOSStatusBar />
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      {/* Selection Mode Header (WhatsApp style) */}
      {selectionMode && (
        <View style={selectionStyles.header}>
          <TouchableOpacity 
            style={selectionStyles.cancelButton}
            onPress={cancelSelectionMode}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={selectionStyles.headerText}>
            {selectedAssignments.size} selected
          </Text>
          <View style={selectionStyles.headerActions}>
            <TouchableOpacity 
              style={selectionStyles.deleteButton}
              onPress={deleteSelectedAssignments}
              disabled={deletingSelected || selectedAssignments.size === 0}
            >
              {deletingSelected ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="trash-2" size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Regular Header - hide when in selection mode */}
        {!selectionMode && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable 
              style={styles.backButton} 
              onPress={() => handleNavigate('hub')}
              accessibilityRole="button"
              accessibilityLabel="Go back to hub"
            >
              <ArrowLeft size={18} color="#475569" />
            </Pressable>
            <View>
              <Text style={styles.headerSubtitle}>Messages & Requests</Text>
              <Text style={styles.headerTitle}>Inbox</Text>
            </View>
          </View>
          {newCount > 0 && (
            <LinearGradient colors={['#8B5CF6', '#6366F1']} style={styles.newBadge}>
              <Sparkles size={14} color="#FFFFFF" />
              <Text style={styles.newBadgeText}>{newCount} new</Text>
            </LinearGradient>
          )}
        </View>
        )}

        {!selectionMode && (
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.summaryCard}>
          <View style={styles.summaryDecorationTop} />
          <View style={styles.summaryDecorationBottom} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Inbox size={20} color="#FFFFFF" />
            </View>
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryTitle}>
                {newCount === 0 ? 'All caught up! 🎉' : `${newCount} things need your attention`}
              </Text>
              <Text style={styles.summarySubtitle}>
                {assignments.filter(a => a.status === 'pending').length > 0
                  ? `You have ${assignments.filter(a => a.status === 'pending').length} tasks waiting for your response`
                  : 'Looking good - your tasks are under control'}
              </Text>
            </View>
          </View>
          {newCount > 0 && (
            <Pressable
              style={styles.markAllBtn}
              onPress={() => {
                setItems(prev => prev.map(it => ({ ...it, isNew: false })));
              }}
            >
              <CheckCircle size={14} color="#FFFFFF" />
              <Text style={styles.markAllText}>Mark all as read</Text>
            </Pressable>
          )}
        </LinearGradient>
        )}

        {!selectionMode && (
        <View style={styles.tabsRow}>
          {tabs.map(tab => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabChip, activeTab === tab.id && styles.tabChipActive]}
            >
              <Text style={[styles.tabChipText, activeTab === tab.id && styles.tabChipTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
        )}

        {assignments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Assigned to you</Text>
              <Text style={styles.sectionCount}>{assignments.length} tasks</Text>
            </View>
            <FlatList
              data={assignments}
              scrollEnabled={false}
              keyExtractor={item => `assignment-${item.id}`}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              renderItem={renderAssignment}
            />
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity</Text>
            <Text style={styles.sectionCount}>{filtered.length} items</Text>
          </View>
          {filtered.length === 0 ? (
            <BlurView intensity={50} tint="light" style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Zap size={20} color="#10B981" />
              </View>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>New messages and updates will appear here.</Text>
              <View style={styles.emptyBadge}>
                <Zap size={14} color="#10B981" />
                <Text style={styles.emptyBadgeText}>+10 XP for staying organized</Text>
              </View>
              <View style={styles.emptyActions}>
                <Pressable style={styles.emptyActionPrimary} onPress={() => handleNavigate('plan')}>
                  <Calendar size={16} color="#2563EB" />
                  <Text style={styles.emptyActionText}>View Plan</Text>
                </Pressable>
                <Pressable style={styles.emptyActionSecondary} onPress={() => handleNavigate('circles')}>
                  <Users size={16} color="#7C3AED" />
                  <Text style={[styles.emptyActionText, { color: '#7C3AED' }]}>Circles</Text>
                </Pressable>
              </View>
            </BlurView>
          ) : (
            <FlatList
              data={filtered}
              scrollEnabled={false}
              keyExtractor={item => `item-${item.id}`}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              renderItem={renderItem}
            />
          )}
        </View>
      </ScrollView>

      {/* Mission Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={detailModalStyles.overlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowDetailModal(false)}
          />
          <View style={detailModalStyles.container}>
            <View style={detailModalStyles.handle} />
            
            {selectedAssignment && (
              <>
                {/* Edited Banner - Prominent at top */}
                {selectedAssignment.isEdited && (
                  <View style={detailModalStyles.editedSection}>
                    <View style={detailModalStyles.editedHeader}>
                      <Feather name="edit-2" size={16} color="#F59E0B" />
                      <Text style={detailModalStyles.editedTitle}>Mission Updated</Text>
                    </View>
                    <Text style={detailModalStyles.editedSubtitle}>
                      {selectedAssignment.assignedByName} has modified this mission
                    </Text>
                    {selectedAssignment.editedChanges && selectedAssignment.editedChanges.length > 0 && (
                      <View style={detailModalStyles.changesList}>
                        <Text style={detailModalStyles.changesLabel}>What changed:</Text>
                        {selectedAssignment.editedChanges.map((change, idx) => (
                          <View key={idx} style={detailModalStyles.changeItem}>
                            <View style={detailModalStyles.changeBullet} />
                            <Text style={detailModalStyles.changeText}>{change}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {selectedAssignment.editedAt && (
                      <Text style={detailModalStyles.editedTime}>
                        Updated {formatTimeAgo(selectedAssignment.editedAt)}
                      </Text>
                    )}
                  </View>
                )}

                {/* Header */}
                <View style={detailModalStyles.header}>
                  <View style={[detailModalStyles.headerIcon, selectedAssignment.isEdited && { backgroundColor: '#FEF3C7' }]}>
                    <Text style={detailModalStyles.headerEmoji}>
                      {selectedAssignment.isEdited ? '🔄' : selectedAssignment.circleEmoji || '📋'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={detailModalStyles.closeButton}
                    onPress={() => setShowDetailModal(false)}
                  >
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Title */}
                <Text style={detailModalStyles.title}>{selectedAssignment.title}</Text>
                
                {/* Circle Info */}
                {selectedAssignment.circleName && (
                  <View style={detailModalStyles.circleTag}>
                    <Users size={14} color="#7C3AED" />
                    <Text style={detailModalStyles.circleTagText}>{selectedAssignment.circleName}</Text>
                  </View>
                )}

                {/* Description */}
                {selectedAssignment.description && (
                  <View style={detailModalStyles.section}>
                    <Text style={detailModalStyles.sectionLabel}>Description</Text>
                    <Text style={detailModalStyles.description}>{selectedAssignment.description}</Text>
                  </View>
                )}

                {/* Info Grid */}
                <View style={detailModalStyles.infoGrid}>
                  {/* From */}
                  <View style={detailModalStyles.infoItem}>
                    <Text style={detailModalStyles.infoLabel}>Assigned by</Text>
                    <Text style={detailModalStyles.infoValue}>{selectedAssignment.assignedByName}</Text>
                  </View>

                  {/* Due Date */}
                  {selectedAssignment.dueDate && (
                    <View style={detailModalStyles.infoItem}>
                      <Text style={detailModalStyles.infoLabel}>Due</Text>
                      <Text style={detailModalStyles.infoValue}>{selectedAssignment.dueDate} at {selectedAssignment.dueTime}</Text>
                    </View>
                  )}

                  {/* XP Reward */}
                  <View style={detailModalStyles.infoItem}>
                    <Text style={detailModalStyles.infoLabel}>XP Reward</Text>
                    <View style={detailModalStyles.xpBadge}>
                      <Zap size={14} color="#F59E0B" />
                      <Text style={detailModalStyles.xpText}>{selectedAssignment.xpReward || 50} XP</Text>
                    </View>
                  </View>

                  {/* Proof Required */}
                  {selectedAssignment.requireProof && (
                    <View style={detailModalStyles.infoItem}>
                      <Text style={detailModalStyles.infoLabel}>Proof Required</Text>
                      <View style={detailModalStyles.proofBadge}>
                        <Eye size={14} color="#7C3AED" />
                        <Text style={detailModalStyles.proofText}>Yes</Text>
                      </View>
                    </View>
                  )}

                  {/* Repeat */}
                  {selectedAssignment.repeatEnabled && (
                    <View style={detailModalStyles.infoItem}>
                      <Text style={detailModalStyles.infoLabel}>Repeats</Text>
                      <Text style={detailModalStyles.infoValue}>
                        {selectedAssignment.repeatFrequency === 'daily' ? 'Daily' : 
                         selectedAssignment.repeatFrequency === 'weekly' ? 'Weekly' : 'Monthly'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={detailModalStyles.actions}>
                  {selectedAssignment.status === 'pending' && (
                    <>
                      <TouchableOpacity 
                        style={detailModalStyles.acceptButton}
                        onPress={() => {
                          acceptAssignment(selectedAssignment.id);
                          setShowDetailModal(false);
                        }}
                      >
                        <CheckCircle size={18} color="#FFFFFF" />
                        <Text style={detailModalStyles.acceptButtonText}>Accept Mission</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={detailModalStyles.declineButton}
                        onPress={() => {
                          setShowDetailModal(false);
                          confirmDecline(selectedAssignment.id, selectedAssignment.title);
                        }}
                      >
                        <X size={18} color="#EF4444" />
                        <Text style={detailModalStyles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {selectedAssignment.status === 'accepted' && (
                    <TouchableOpacity 
                      style={detailModalStyles.acceptButton}
                      onPress={() => {
                        completeAssignment(selectedAssignment.id);
                        setShowDetailModal(false);
                      }}
                    >
                      <CheckCircle size={18} color="#FFFFFF" />
                      <Text style={detailModalStyles.acceptButtonText}>Mark Complete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
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
        <View style={declineModalStyles.overlay}>
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
          <View style={declineModalStyles.content}>
            {/* Header */}
            <View style={declineModalStyles.header}>
              <View style={declineModalStyles.iconContainer}>
                <X size={28} color="#EF4444" />
              </View>
              <Text style={declineModalStyles.title}>Decline Mission?</Text>
              <Text style={declineModalStyles.subtitle}>
                Would you like to share why you're declining{'\n'}"{declineAssignmentTitle}"?
              </Text>
            </View>
            
            {/* Reason Input */}
            <View style={declineModalStyles.inputContainer}>
              <TextInput
                style={declineModalStyles.input}
                placeholder="e.g., I have a prior commitment, busy with exams..."
                placeholderTextColor="#9CA3AF"
                value={declineReason}
                onChangeText={setDeclineReason}
                multiline
                maxLength={200}
              />
              <Text style={declineModalStyles.charCount}>
                {declineReason.length}/200 (optional)
              </Text>
            </View>
            
            {/* Quick Reason Chips */}
            <View style={declineModalStyles.chipsContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {['Busy right now', 'Not enough time', 'Already have plans', 'Not feeling well'].map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => setDeclineReason(chip)}
                    style={[
                      declineModalStyles.chip,
                      declineReason === chip && declineModalStyles.chipSelected
                    ]}
                  >
                    <Text style={[
                      declineModalStyles.chipText,
                      declineReason === chip && declineModalStyles.chipTextSelected
                    ]}>
                      {chip}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Action Buttons */}
            <View style={declineModalStyles.actions}>
              <TouchableOpacity
                onPress={() => handleConfirmDecline(true)}
                disabled={decliningInProgress}
                style={[declineModalStyles.declineButton, decliningInProgress && { opacity: 0.5 }]}
              >
                {decliningInProgress ? (
                  <ActivityIndicator color="#EF4444" />
                ) : (
                  <Text style={declineModalStyles.declineButtonText}>
                    {declineReason.trim() ? 'Decline with Reason' : 'Decline without Reason'}
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setShowDeclineModal(false);
                  setDeclineAssignmentId(null);
                  setDeclineReason('');
                }}
                disabled={decliningInProgress}
                style={declineModalStyles.cancelButton}
              >
                <Text style={declineModalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Sheet Modal (shown on long press) */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <TouchableOpacity
          style={actionSheetStyles.overlay}
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}
        >
          <View style={actionSheetStyles.container}>
            <BlurView intensity={90} tint="light" style={actionSheetStyles.blur}>
              <View style={actionSheetStyles.content}>
                <View style={actionSheetStyles.handle} />
                <Text style={actionSheetStyles.title}>
                  {actionSheetAssignment?.title || 'Mission Options'}
                </Text>
                
                {/* Show different options based on user role */}
                {actionSheetAssignment && isAssignmentRecipient(actionSheetAssignment) && (
                  <>
                    {actionSheetAssignment.status === 'declined' && (
                      <>
                        <TouchableOpacity
                          style={actionSheetStyles.option}
                          onPress={() => openEditResponseModal(actionSheetAssignment)}
                        >
                          <View style={[actionSheetStyles.optionIcon, { backgroundColor: '#FEF3C7' }]}>
                            <Feather name="edit-2" size={18} color="#F59E0B" />
                          </View>
                          <View style={actionSheetStyles.optionText}>
                            <Text style={actionSheetStyles.optionTitle}>Edit Decline Reason</Text>
                            <Text style={actionSheetStyles.optionSubtitle}>Update why you declined</Text>
                          </View>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={actionSheetStyles.option}
                          onPress={() => {
                            setShowActionSheet(false);
                            handleAcceptAfterDecline();
                          }}
                        >
                          <View style={[actionSheetStyles.optionIcon, { backgroundColor: '#DCFCE7' }]}>
                            <CheckCircle size={18} color="#10B981" />
                          </View>
                          <View style={actionSheetStyles.optionText}>
                            <Text style={actionSheetStyles.optionTitle}>Accept Instead</Text>
                            <Text style={actionSheetStyles.optionSubtitle}>Changed your mind? Accept the mission</Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    )}
                    
                    {actionSheetAssignment.status === 'pending' && (
                      <Text style={actionSheetStyles.infoText}>
                        You can accept or decline this mission using the buttons below the card.
                      </Text>
                    )}
                  </>
                )}
                
                {actionSheetAssignment && isAssignmentSender(actionSheetAssignment) && (
                  <>
                    <TouchableOpacity
                      style={actionSheetStyles.option}
                      onPress={() => openEditMissionModal(actionSheetAssignment)}
                    >
                      <View style={[actionSheetStyles.optionIcon, { backgroundColor: '#DBEAFE' }]}>
                        <Feather name="edit-2" size={18} color="#2563EB" />
                      </View>
                      <View style={actionSheetStyles.optionText}>
                        <Text style={actionSheetStyles.optionTitle}>Edit Mission</Text>
                        <Text style={actionSheetStyles.optionSubtitle}>Change title, due date, XP, and more</Text>
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={actionSheetStyles.option}
                      onPress={() => enterDeleteSelectionMode(actionSheetAssignment)}
                    >
                      <View style={[actionSheetStyles.optionIcon, { backgroundColor: '#FEE2E2' }]}>
                        <Trash2 size={18} color="#EF4444" />
                      </View>
                      <View style={actionSheetStyles.optionText}>
                        <Text style={[actionSheetStyles.optionTitle, { color: '#EF4444' }]}>Delete</Text>
                        <Text style={actionSheetStyles.optionSubtitle}>Select multiple missions to delete</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
                
                {/* Delete option for recipients too (only their copy) */}
                {actionSheetAssignment && isAssignmentRecipient(actionSheetAssignment) && (
                  <TouchableOpacity
                    style={actionSheetStyles.option}
                    onPress={() => enterDeleteSelectionMode(actionSheetAssignment)}
                  >
                    <View style={[actionSheetStyles.optionIcon, { backgroundColor: '#FEE2E2' }]}>
                      <Trash2 size={18} color="#EF4444" />
                    </View>
                    <View style={actionSheetStyles.optionText}>
                      <Text style={[actionSheetStyles.optionTitle, { color: '#EF4444' }]}>Delete</Text>
                      <Text style={actionSheetStyles.optionSubtitle}>Select multiple to delete at once</Text>
                    </View>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={actionSheetStyles.cancelButton}
                  onPress={() => setShowActionSheet(false)}
                >
                  <Text style={actionSheetStyles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Mission Modal (for sender) */}
      <Modal
        visible={showEditMissionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditMissionModal(false)}
      >
        <View style={editModalStyles.overlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowEditMissionModal(false)}
          />
          <View style={editModalStyles.sheet}>
            <View style={editModalStyles.handle} />
            
            {/* Header */}
            <View style={editModalStyles.header}>
              <TouchableOpacity onPress={() => setShowEditMissionModal(false)}>
                <Text style={editModalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={editModalStyles.title}>Edit Mission</Text>
              <TouchableOpacity onPress={handleSaveMissionEdit} disabled={editingInProgress}>
                <Text style={[editModalStyles.saveText, editingInProgress && { opacity: 0.5 }]}>
                  {editingInProgress ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={editModalStyles.content} showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={editModalStyles.label}>Mission Title</Text>
              <TextInput
                value={editMissionData.title}
                onChangeText={(text) => setEditMissionData(prev => ({ ...prev, title: text }))}
                style={editModalStyles.input}
                placeholder="Enter mission title"
                placeholderTextColor="#94A3B8"
              />

              {/* Note/Description */}
              <Text style={editModalStyles.label}>Note (Optional)</Text>
              <TextInput
                value={editMissionData.description}
                onChangeText={(text) => setEditMissionData(prev => ({ ...prev, description: text }))}
                style={[editModalStyles.input, { height: 80 }]}
                placeholder="Add a note for context..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
              />

              {/* Due Date & Time */}
              <Text style={editModalStyles.label}>Due Date & Time</Text>
              <View style={editModalStyles.dateTimeRow}>
                <TouchableOpacity
                  style={editModalStyles.dateTimeButton}
                  onPress={() => setShowEditDatePicker(true)}
                >
                  <Calendar size={16} color="#7C3AED" />
                  <Text style={editModalStyles.dateTimeText}>
                    {editMissionData.dueDate
                      ? editMissionData.dueDate.toLocaleDateString()
                      : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={editModalStyles.dateTimeButton}
                  onPress={() => setShowEditTimePicker(true)}
                >
                  <Clock size={16} color="#7C3AED" />
                  <Text style={editModalStyles.dateTimeText}>
                    {editMissionData.dueTime
                      ? editMissionData.dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Select Time'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* XP Reward */}
              <Text style={editModalStyles.label}>XP Reward</Text>
              <View style={editModalStyles.xpRow}>
                {[25, 50, 75, 100].map((xp) => (
                  <TouchableOpacity
                    key={xp}
                    style={[
                      editModalStyles.xpOption,
                      editMissionData.xpReward === xp && editModalStyles.xpOptionActive,
                    ]}
                    onPress={() => setEditMissionData(prev => ({ ...prev, xpReward: xp }))}
                  >
                    <Zap size={14} color={editMissionData.xpReward === xp ? '#F59E0B' : '#94A3B8'} />
                    <Text
                      style={[
                        editModalStyles.xpOptionText,
                        editMissionData.xpReward === xp && editModalStyles.xpOptionTextActive,
                      ]}
                    >
                      {xp} XP
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Toggle Options */}
              <View style={editModalStyles.toggleSection}>
                {/* Repeat */}
                <View style={editModalStyles.toggleRow}>
                  <View style={editModalStyles.toggleInfo}>
                    <Repeat size={18} color="#2563EB" />
                    <Text style={editModalStyles.toggleLabel}>Repeat Mission</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      editModalStyles.toggle,
                      editMissionData.repeatEnabled && editModalStyles.toggleActive,
                    ]}
                    onPress={() => setEditMissionData(prev => ({ ...prev, repeatEnabled: !prev.repeatEnabled }))}
                  >
                    <View style={[
                      editModalStyles.toggleKnob,
                      editMissionData.repeatEnabled && editModalStyles.toggleKnobActive,
                    ]} />
                  </TouchableOpacity>
                </View>
                
                {editMissionData.repeatEnabled && (
                  <View style={editModalStyles.frequencyRow}>
                    {['daily', 'weekly', 'monthly'].map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        style={[
                          editModalStyles.frequencyOption,
                          editMissionData.repeatFrequency === freq && editModalStyles.frequencyOptionActive,
                        ]}
                        onPress={() => setEditMissionData(prev => ({ ...prev, repeatFrequency: freq }))}
                      >
                        <Text style={[
                          editModalStyles.frequencyText,
                          editMissionData.repeatFrequency === freq && editModalStyles.frequencyTextActive,
                        ]}>
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Require Proof */}
                <View style={editModalStyles.toggleRow}>
                  <View style={editModalStyles.toggleInfo}>
                    <Camera size={18} color="#7C3AED" />
                    <Text style={editModalStyles.toggleLabel}>Require Proof</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      editModalStyles.toggle,
                      editMissionData.requireProof && editModalStyles.toggleActive,
                    ]}
                    onPress={() => setEditMissionData(prev => ({ ...prev, requireProof: !prev.requireProof }))}
                  >
                    <View style={[
                      editModalStyles.toggleKnob,
                      editMissionData.requireProof && editModalStyles.toggleKnobActive,
                    ]} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Info Note */}
              <View style={editModalStyles.infoNote}>
                <Feather name="info" size={14} color="#64748B" />
                <Text style={editModalStyles.infoNoteText}>
                  The recipient will be notified of your changes.
                </Text>
              </View>
            </ScrollView>
          </View>

          {/* Date Picker */}
          {showEditDatePicker && (
            <DateTimePicker
              value={editMissionData.dueDate || new Date()}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                setShowEditDatePicker(false);
                if (date) setEditMissionData(prev => ({ ...prev, dueDate: date }));
              }}
              minimumDate={new Date()}
            />
          )}

          {/* Time Picker */}
          {showEditTimePicker && (
            <DateTimePicker
              value={editMissionData.dueTime || new Date()}
              mode="time"
              display="spinner"
              onChange={(event, time) => {
                setShowEditTimePicker(false);
                if (time) setEditMissionData(prev => ({ ...prev, dueTime: time }));
              }}
            />
          )}
        </View>
      </Modal>

      {/* Edit Response Modal (for assignee - edit decline reason) */}
      <Modal
        visible={showEditResponseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditResponseModal(false)}
      >
        <View style={editModalStyles.overlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowEditResponseModal(false)}
          />
          <View style={editModalStyles.sheet}>
            <View style={editModalStyles.handle} />
            
            {/* Header */}
            <View style={editModalStyles.header}>
              <TouchableOpacity onPress={() => setShowEditResponseModal(false)}>
                <Text style={editModalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={editModalStyles.title}>Edit Your Response</Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView style={editModalStyles.content} showsVerticalScrollIndicator={false}>
              <Text style={editModalStyles.label}>Your Decline Reason</Text>
              <TextInput
                value={editResponseReason}
                onChangeText={setEditResponseReason}
                style={[editModalStyles.input, { height: 120 }]}
                placeholder="Explain why you can't complete this mission..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={editModalStyles.primaryButton}
                onPress={handleUpdateDeclineReason}
                disabled={editingResponseInProgress}
              >
                {editingResponseInProgress ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={editModalStyles.primaryButtonText}>Update Reason</Text>
                )}
              </TouchableOpacity>

              <View style={editModalStyles.divider}>
                <View style={editModalStyles.dividerLine} />
                <Text style={editModalStyles.dividerText}>or</Text>
                <View style={editModalStyles.dividerLine} />
              </View>

              <TouchableOpacity
                style={editModalStyles.acceptButton}
                onPress={handleAcceptAfterDecline}
                disabled={editingResponseInProgress}
              >
                <CheckCircle size={18} color="#10B981" />
                <Text style={editModalStyles.acceptButtonText}>Accept Mission Instead</Text>
              </TouchableOpacity>

              <Text style={editModalStyles.acceptHint}>
                Changed your mind? Accept the mission and it will be added to your tasks.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 120 },
  backgroundGlowTop: {
    position: 'absolute',
    top: 60,
    right: -40,
    width: 220,
    height: 220,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 999,
  },
  backgroundGlowBottom: {
    position: 'absolute',
    top: 360,
    left: -60,
    width: 180,
    height: 180,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderRadius: 999,
  },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  headerSubtitle: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  newBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  newBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  summaryCard: { marginHorizontal: 20, borderRadius: 24, padding: 18, overflow: 'hidden' },
  summaryDecorationTop: { position: 'absolute', top: -20, right: -10, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(139, 92, 246, 0.2)' },
  summaryDecorationBottom: { position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(59, 130, 246, 0.18)' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(139, 92, 246, 0.8)', alignItems: 'center', justifyContent: 'center' },
  summaryTextWrap: { flex: 1 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  summarySubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  markAllBtn: { marginTop: 14, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  markAllText: { color: '#FFFFFF', fontWeight: '600' },
  tabsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 16 },
  tabChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
  tabChipActive: { backgroundColor: '#6366F1' },
  tabChipText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  tabChipTextActive: { color: '#FFFFFF' },
  section: { paddingHorizontal: 20, marginTop: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, color: '#94A3B8', fontWeight: '700' },
  sectionCount: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  card: { borderRadius: 18, padding: 16, overflow: 'hidden' },
  newCard: { borderWidth: 1, borderColor: '#DDD6FE' },
  assignmentHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  assignmentIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FB923C', alignItems: 'center', justifyContent: 'center' },
  assignmentInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  assignmentTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  editedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  editedBadgeText: { fontSize: 10, fontWeight: '600', color: '#64748B' },
  editedCard: { borderWidth: 2, borderColor: '#F59E0B' },
  editedBanner: { 
    backgroundColor: '#FEF3C7', 
    paddingVertical: 10, 
    paddingHorizontal: 14, 
    marginBottom: 12, 
    borderRadius: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  editedBannerText: { fontSize: 14, fontWeight: '700', color: '#B45309', flex: 1 },
  editedBannerSubtext: { fontSize: 11, color: '#92400E' },
  changesPreview: { 
    backgroundColor: '#FFFBEB', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    marginTop: 8, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  changesPreviewLabel: { fontSize: 11, fontWeight: '600', color: '#92400E', marginBottom: 4 },
  changesPreviewText: { fontSize: 12, color: '#B45309', lineHeight: 16 },
  assignmentSubtitle: { fontSize: 12, color: '#64748B' },
  assignmentFromRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  circleChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  circleChipEmoji: { fontSize: 10 },
  circleChipText: { fontSize: 10, fontWeight: '600', color: '#7C3AED' },
  missionNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#CBD5E1' },
  missionNoteText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18 },
  missionDetails: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3E8FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  detailChipText: { fontSize: 11, fontWeight: '600', color: '#7C3AED' },
  xpChip: { backgroundColor: '#FEF3C7' },
  missionTags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  repeatTag: { backgroundColor: '#DBEAFE' },
  repeatTagText: { fontSize: 10, fontWeight: '600', color: '#2563EB' },
  proofTag: { backgroundColor: '#EDE9FE' },
  proofTagText: { fontSize: 10, fontWeight: '600', color: '#7C3AED' },
  nudgeTag: { backgroundColor: '#D1FAE5' },
  nudgeTagText: { fontSize: 10, fontWeight: '600', color: '#10B981' },
  assignmentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700' },
  assignmentTime: { fontSize: 12, color: '#94A3B8' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  primaryAction: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  primaryActionText: { fontSize: 12, fontWeight: '700', color: '#10B981' },
  secondaryAction: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  secondaryActionText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  secondaryDisabled: { opacity: 0.6 },
  iconAction: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  feedbackChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  feedbackSuccess: { backgroundColor: '#ECFDF5' },
  feedbackInfo: { backgroundColor: '#F1F5F9' },
  feedbackText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  activityHeader: { flexDirection: 'row', gap: 12 },
  activityIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  activityBody: { flex: 1 },
  activityTitleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  activityTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', flex: 1 },
  activitySubtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activityTime: { fontSize: 12, color: '#94A3B8' },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  emptyCard: { borderRadius: 20, padding: 24, alignItems: 'center' },
  emptyIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  emptySubtitle: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 6 },
  emptyBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginTop: 12 },
  emptyBadgeText: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  emptyActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  emptyActionPrimary: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#DBEAFE' },
  emptyActionSecondary: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#EDE9FE' },
  emptyActionText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
});

// Detail Modal Styles
const detailModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  // Edited Section Styles
  editedSection: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  editedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  editedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B45309',
  },
  editedSubtitle: {
    fontSize: 13,
    color: '#92400E',
    marginBottom: 12,
  },
  changesList: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
  },
  changesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  changeBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 6,
  },
  changeText: {
    fontSize: 14,
    color: '#78350F',
    flex: 1,
    lineHeight: 20,
  },
  editedTime: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 10,
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 24,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  circleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 20,
  },
  circleTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F59E0B',
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  proofText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7C3AED',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  declineButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#EF4444',
  },
});

// Decline Modal Styles
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const declineModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    width: SCREEN_WIDTH - 40,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
    color: '#0F172A',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  charCount: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 6,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  chipText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#8B5CF6',
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  declineButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  declineButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#EF4444',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});

// Selection Mode Styles (WhatsApp style)
const selectionStyles = StyleSheet.create({
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
    top: 16,
    right: 16,
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

// Action Sheet Styles
const actionSheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    margin: 8,
    marginBottom: 34,
    borderRadius: 14,
    overflow: 'hidden',
  },
  blur: {
    overflow: 'hidden',
    borderRadius: 14,
  },
  content: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    fontStyle: 'italic',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#EF4444',
  },
});

// Edit Modal Styles
const editModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
  },
  cancelText: {
    fontSize: 17,
    color: '#8B5CF6',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateTimeText: {
    fontSize: 15,
    color: '#0F172A',
  },
  xpRow: {
    flexDirection: 'row',
    gap: 10,
  },
  xpOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  xpOptionActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  xpOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  xpOptionTextActive: {
    color: '#F59E0B',
  },
  toggleSection: {
    marginTop: 16,
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#8B5CF6',
  },
  toggleKnob: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginLeft: 46,
  },
  frequencyOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  frequencyOptionActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  frequencyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  frequencyTextActive: {
    color: '#8B5CF6',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginTop: 20,
  },
  infoNoteText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  acceptHint: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
