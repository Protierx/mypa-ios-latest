import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { assignmentsApi, invitationsApi } from '../../../services/api';
import { useSocketEvent } from '../../../services/socket';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Assignment,
  NotificationItem,
  Feedback,
  DelayedAction,
  DelayedActionInput,
  TabType,
  EditMissionData,
  STORAGE_KEYS,
} from '../types';
import { formatTimeAgo, formatDueDate } from '../utils';

export function useInboxData() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [actionFeedback, setActionFeedback] = useState<Feedback>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [circleInvitations, setCircleInvitations] = useState<any[]>([]);
  const [items, setItems] = useState<NotificationItem[]>([]);

  // Delayed actions state
  const [snoozedItems, setSnoozedItems] = useState<Set<number | string>>(new Set());
  const [delayedActions, setDelayedActions] = useState<DelayedAction[]>([]);
  const scheduledRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const nextActionId = useRef(1);

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string | number>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);

  // Modal state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineAssignmentId, setDeclineAssignmentId] = useState<string | number | null>(null);
  const [declineAssignmentTitle, setDeclineAssignmentTitle] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [decliningInProgress, setDecliningInProgress] = useState(false);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  
  const [showEditMissionModal, setShowEditMissionModal] = useState(false);
  const [editMissionData, setEditMissionData] = useState<EditMissionData>({
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
  
  const [showEditResponseModal, setShowEditResponseModal] = useState(false);
  const [editResponseReason, setEditResponseReason] = useState('');
  const [editingResponseInProgress, setEditingResponseInProgress] = useState(false);
  
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [actionSheetAssignment, setActionSheetAssignment] = useState<Assignment | null>(null);

  // Transform circle invitations to NotificationItem format
  const inviteItems: NotificationItem[] = useMemo(() => 
    circleInvitations.map((inv: any) => ({
      id: inv.id,
      title: `Circle invite from ${inv.inviter?.name || inv.inviter?.username || 'Someone'}`,
      subtitle: `Join "${inv.circle?.name || 'circle'}"${inv.message ? ` - ${inv.message}` : ''}`,
      type: 'invite' as const,
      time: formatTimeAgo(inv.createdAt),
      isNew: true,
      circleName: inv.circle?.name,
      senderName: inv.inviter?.name || inv.inviter?.username,
      _invitationId: inv.id,
    })), [circleInvitations]);

  // Merge inviteItems with local items (messages, reminders)
  const allItems = useMemo(() => {
    const nonInviteItems = items.filter(i => i.type !== 'invite');
    return [...inviteItems, ...nonInviteItems];
  }, [inviteItems, items]);

  // Filtered items based on active tab
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
  const pendingCount = assignments.filter(a => a.status === 'pending').length;

  // Fetch functions
  const fetchAssignments = async () => {
    try {
      const response = await assignmentsApi.getMine({ role: 'assignee', status: 'PENDING' });
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

  // Socket event
  useSocketEvent('assignment:new', () => {
    fetchAssignments();
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [])
  );

  // Feedback timeout
  useEffect(() => {
    if (!actionFeedback) return;
    const timer = setTimeout(() => setActionFeedback(null), 2000);
    return () => clearTimeout(timer);
  }, [actionFeedback]);

  // Delayed actions processing
  const enqueueAction = (action: DelayedActionInput) => {
    const newAction: DelayedAction = { ...action, id: nextActionId.current++ };
    setDelayedActions(prev => [...prev, newAction]);
  };

  useEffect(() => {
    delayedActions.forEach(action => {
      if (scheduledRef.current.has(action.id)) return;
      const timer = setTimeout(() => {
        if (action.type === 'removeItem') {
          setItems(prev => prev.filter(it => it.id !== action.itemId));
        }
        if (action.type === 'removeAssignment') {
          setAssignments(prev => prev.filter(a => a.id !== action.assignmentId));
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
  }, [delayedActions]);

  useEffect(() => {
    return () => {
      scheduledRef.current.forEach(timer => clearTimeout(timer));
      scheduledRef.current.clear();
    };
  }, []);

  // Helper functions
  const showFeedback = (id: number | string, message: string, type: 'success' | 'info' = 'success') => {
    const numericId = typeof id === 'string' 
      ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) 
      : id;
    setActionFeedback({ id: numericId, message, type });
  };

  const markRead = (id: number | string) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, isNew: false } : it)));
  };

  const markAllRead = () => {
    setItems(prev => prev.map(it => ({ ...it, isNew: false })));
  };

  const snoozeItem = (id: number | string) => {
    setSnoozedItems(prev => new Set(prev).add(id));
    showFeedback(id, 'Snoozed for 1 hour', 'info');
    enqueueAction({ type: 'removeItem', itemId: id, delayMs: 1500 });
    enqueueAction({ type: 'clearSnooze', itemId: id, delayMs: 1500 });
  };

  // Selection mode
  const toggleAssignmentSelection = (id: string | number) => {
    setSelectedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        if (newSet.size === 0) setSelectionMode(false);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const cancelSelectionMode = () => {
    setSelectionMode(false);
    setSelectedAssignments(new Set());
  };

  const enterDeleteSelectionMode = (assignment: Assignment) => {
    setShowActionSheet(false);
    setSelectionMode(true);
    setSelectedAssignments(new Set([assignment.id]));
  };

  // Role checks
  const isAssignmentSender = (assignment: Assignment) => user?.id === assignment.assignedById;
  const isAssignmentRecipient = (assignment: Assignment) => user?.id === assignment.assigneeId;

  return {
    // State
    user,
    activeTab,
    setActiveTab,
    actionFeedback,
    loading,
    refreshing,
    assignments,
    setAssignments,
    allItems,
    filtered,
    newCount,
    pendingCount,
    snoozedItems,
    items,
    setItems,
    
    // Selection
    selectionMode,
    setSelectionMode,
    selectedAssignments,
    setSelectedAssignments,
    deletingSelected,
    setDeletingSelected,
    toggleAssignmentSelection,
    cancelSelectionMode,
    enterDeleteSelectionMode,
    
    // Modal state
    showDeclineModal,
    setShowDeclineModal,
    declineAssignmentId,
    setDeclineAssignmentId,
    declineAssignmentTitle,
    setDeclineAssignmentTitle,
    declineReason,
    setDeclineReason,
    decliningInProgress,
    setDecliningInProgress,
    showDetailModal,
    setShowDetailModal,
    selectedAssignment,
    setSelectedAssignment,
    showEditMissionModal,
    setShowEditMissionModal,
    editMissionData,
    setEditMissionData,
    showEditDatePicker,
    setShowEditDatePicker,
    showEditTimePicker,
    setShowEditTimePicker,
    editingInProgress,
    setEditingInProgress,
    showEditResponseModal,
    setShowEditResponseModal,
    editResponseReason,
    setEditResponseReason,
    editingResponseInProgress,
    setEditingResponseInProgress,
    showActionSheet,
    setShowActionSheet,
    actionSheetAssignment,
    setActionSheetAssignment,
    
    // Functions
    fetchAllData,
    fetchAssignments,
    onRefresh,
    showFeedback,
    markRead,
    markAllRead,
    snoozeItem,
    enqueueAction,
    isAssignmentSender,
    isAssignmentRecipient,
  };
}
