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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlarmClock,
  ArrowLeft,
  Calendar,
  CheckCheck,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Inbox,
  MessageSquare,
  Reply,
  Sparkles,
  Trash2,
  Users,
  UserPlus,
  X,
  Zap,
} from 'lucide-react-native';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { useNavigation } from '@react-navigation/native';
import { assignmentsApi, invitationsApi } from '../services/api';
import { useSocketEvent } from '../services/socket';

interface InboxScreenProps {
  navigation?: any;
}

interface Assignment {
  id: number | string;
  title: string;
  assignedByName: string;
  dueTime?: string;
  dueDate?: string;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  category?: string;
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
  | (DelayedActionBase & { type: 'removeItem'; itemId: number })
  | (DelayedActionBase & { type: 'removeItemNavigate'; itemId: number; target: string })
  | (DelayedActionBase & { type: 'removeAssignment'; assignmentId: number })
  | (DelayedActionBase & { type: 'removeAssignmentNavigate'; assignmentId: number; target: string })
  | (DelayedActionBase & { type: 'clearSnooze'; itemId: number });

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
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
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
  const handleNavigate = (screen: string) => {
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
      navigator.navigate('Plan');
    } else if (screen === 'circles' || screen === 'circle-home') {
      navigator.navigate('Circles', { screen: screen === 'circle-home' ? 'CircleHome' : 'CirclesList' });
    } else {
      navigator.navigate(screen);
    }
  };

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [actionFeedback, setActionFeedback] = useState<Feedback>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
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
      if (response.success && response.data) {
        const formatted: Assignment[] = response.data.map((a: any) => ({
          id: a.id,
          title: a.title,
          assignedByName: a.creator?.name || a.creator?.username || 'Someone',
          dueTime: a.dueDate ? new Date(a.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          dueDate: a.dueDate ? formatDueDate(a.dueDate) : undefined,
          status: a.status?.toLowerCase() || 'pending',
          category: 'Mission',
        }));
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

  // Real-time: New invitation received
  useSocketEvent('invitation:new', (data: any) => {
    console.log('📨 New invitation received:', data);
    fetchInvitations();
  }, []);

  // Real-time: New assignment received
  useSocketEvent('assignment:new', (data: any) => {
    console.log('📨 New assignment received:', data);
    fetchAssignments();
  }, []);

  const [snoozedItems, setSnoozedItems] = useState<Set<number>>(new Set());
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
    setActionFeedback({ id: typeof id === 'string' ? id.hashCode?.() || 0 : id, message, type });
  };

  const markRead = (id: number | string) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, isNew: false } : it)));
  };

  const snoozeItem = (id: number | string) => {
    setSnoozedItems(prev => new Set(prev).add(id as number));
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

  const handleMessageReply = async (id: number) => {
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

  const handleMessageArchive = (id: number) => {
    showFeedback(id, 'Archived', 'info');
    enqueueAction({ type: 'removeItem', itemId: id, delayMs: 600 });
  };

  const handleReminderDone = async (id: number) => {
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

  const acceptAssignment = async (id: number | string) => {
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;

    showFeedback(assignment.id, 'Accepting mission...', 'success');

    try {
      // Call real API to accept assignment
      const response = await assignmentsApi.accept(String(id));
      
      if (response.success) {
        // Update local state
        setAssignments(prev => prev.map(a => (a.id === id ? { ...a, status: 'accepted' } : a)));
        
        // Remove after delay
        setTimeout(() => {
          setAssignments(prev => prev.filter(a => a.id !== id));
        }, 1500);
        
        showFeedback(assignment.id, 'Mission accepted! ✅', 'success');
      } else {
        Alert.alert('Error', response.error || 'Failed to accept mission');
      }
    } catch (e) {
      console.error('Error accepting assignment:', e);
      Alert.alert('Error', 'Failed to accept mission');
    }
  };

  const declineAssignment = async (id: number | string) => {
    const assignment = assignments.find(a => a.id === id);
    
    try {
      // Call real API to decline assignment
      const response = await assignmentsApi.decline(String(id));
      
      if (response.success) {
        showFeedback(id, `Declined - ${assignment?.assignedByName} notified`, 'info');
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

  const confirmDecline = (id: number) => {
    Alert.alert('Decline assignment?', 'This will notify the sender.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => declineAssignment(id) },
    ]);
  };

  const renderAssignment = ({ item, index }: { item: Assignment; index: number }) => {
    const tone = statusTone(item.status);
    return (
      <SlideInCard index={index}>
        <BlurView intensity={50} tint="light" style={styles.card}>
          <View style={styles.assignmentHeader}>
            <View style={styles.assignmentIcon}>
              <Clock size={20} color="#FFFFFF" />
            </View>
            <View style={styles.assignmentInfo}>
              <Text style={styles.assignmentTitle}>{item.title}</Text>
              <Text style={styles.assignmentSubtitle}>From {item.assignedByName}</Text>
              <View style={styles.assignmentMeta}>
                <View style={[styles.statusBadge, { backgroundColor: tone.bg, borderColor: tone.border }]}
                >
                  <Text style={[styles.statusText, { color: tone.text }]}>{statusLabel(item.status)}</Text>
                </View>
                {item.dueTime && <Text style={styles.assignmentTime}>Due {item.dueTime}</Text>}
              </View>
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
                {item.status === 'pending' && (
                  <>
                    <Pressable style={styles.primaryAction} onPress={() => acceptAssignment(item.id)}>
                      <CheckCircle size={14} color="#10B981" />
                      <Text style={styles.primaryActionText}>Accept & Add</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryAction} onPress={() => confirmDecline(item.id)}>
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
                    <Pressable style={styles.secondaryAction} onPress={viewAssignmentInPlan}>
                      <Calendar size={14} color="#2563EB" />
                      <Text style={[styles.secondaryActionText, { color: '#2563EB' }]}>View Plan</Text>
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
  sectionCount: { fontSize: 12, color: '#CBD5F5' },
  card: { borderRadius: 18, padding: 16, overflow: 'hidden' },
  newCard: { borderWidth: 1, borderColor: '#DDD6FE' },
  assignmentHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  assignmentIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FB923C', alignItems: 'center', justifyContent: 'center' },
  assignmentInfo: { flex: 1 },
  assignmentTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  assignmentSubtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  assignmentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
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
