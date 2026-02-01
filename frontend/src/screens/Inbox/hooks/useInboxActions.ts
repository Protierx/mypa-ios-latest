import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { assignmentsApi, invitationsApi } from '../../../services/api';
import { Assignment, NotificationItem, STORAGE_KEYS } from '../types';

interface UseInboxActionsProps {
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  items: NotificationItem[];
  setItems: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  allItems: NotificationItem[];
  showFeedback: (id: number | string, message: string, type?: 'success' | 'info') => void;
  enqueueAction: (action: any) => void;
  selectedAssignments: Set<string | number>;
  setSelectedAssignments: React.Dispatch<React.SetStateAction<Set<string | number>>>;
  cancelSelectionMode: () => void;
  setDeletingSelected: React.Dispatch<React.SetStateAction<boolean>>;
  setCircleInvitations: React.Dispatch<React.SetStateAction<any[]>>;
  handleNavigate: (screen: string, params?: any) => void;
  
  // Modal states
  setShowDeclineModal: React.Dispatch<React.SetStateAction<boolean>>;
  setDeclineAssignmentId: React.Dispatch<React.SetStateAction<string | number | null>>;
  setDeclineAssignmentTitle: React.Dispatch<React.SetStateAction<string>>;
  declineReason: string;
  setDeclineReason: React.Dispatch<React.SetStateAction<string>>;
  setDecliningInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  declineAssignmentId: string | number | null;
  
  setShowDetailModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedAssignment: React.Dispatch<React.SetStateAction<Assignment | null>>;
  
  setShowEditMissionModal: React.Dispatch<React.SetStateAction<boolean>>;
  setEditMissionData: React.Dispatch<React.SetStateAction<any>>;
  editMissionData: any;
  setEditingInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  setShowEditDatePicker: React.Dispatch<React.SetStateAction<boolean>>;
  setShowEditTimePicker: React.Dispatch<React.SetStateAction<boolean>>;
  
  setShowEditResponseModal: React.Dispatch<React.SetStateAction<boolean>>;
  editResponseReason: string;
  setEditResponseReason: React.Dispatch<React.SetStateAction<string>>;
  setEditingResponseInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  
  setShowActionSheet: React.Dispatch<React.SetStateAction<boolean>>;
  actionSheetAssignment: Assignment | null;
  setActionSheetAssignment: React.Dispatch<React.SetStateAction<Assignment | null>>;
  
  selectionMode: boolean;
  fetchAssignments: () => Promise<void>;
}

export function useInboxActions({
  assignments,
  setAssignments,
  items,
  setItems,
  allItems,
  showFeedback,
  enqueueAction,
  selectedAssignments,
  setSelectedAssignments,
  cancelSelectionMode,
  setDeletingSelected,
  setCircleInvitations,
  handleNavigate,
  setShowDeclineModal,
  setDeclineAssignmentId,
  setDeclineAssignmentTitle,
  declineReason,
  setDeclineReason,
  setDecliningInProgress,
  declineAssignmentId,
  setShowDetailModal,
  setSelectedAssignment,
  setShowEditMissionModal,
  setEditMissionData,
  editMissionData,
  setEditingInProgress,
  setShowEditDatePicker,
  setShowEditTimePicker,
  setShowEditResponseModal,
  editResponseReason,
  setEditResponseReason,
  setEditingResponseInProgress,
  setShowActionSheet,
  actionSheetAssignment,
  setActionSheetAssignment,
  selectionMode,
  fetchAssignments,
}: UseInboxActionsProps) {
  
  // Accept assignment
  const acceptAssignment = async (id: number | string, goToPlan: boolean = false) => {
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;

    showFeedback(assignment.id, 'Adding to your plan...', 'success');

    try {
      const response = await assignmentsApi.accept(String(id));
      
      if (response.success) {
        const taskData = response.data?.task;
        const taskId = taskData?.id ? String(taskData.id) : undefined;
        const taskDate = taskData?.date || (assignment.dueDateFull ? new Date(assignment.dueDateFull).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        
        setAssignments(prev => prev.map(a => (a.id === id ? { ...a, status: 'accepted' } : a)));
        showFeedback(assignment.id, '✅ Added to Plan!', 'success');
        
        const navigateToPlan = () => {
          setAssignments(prev => prev.filter(a => a.id !== id));
          handleNavigate('plan', { date: taskDate, taskId });
        };
        
        if (goToPlan) {
          setTimeout(navigateToPlan, 800);
        } else {
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

  // Decline assignment
  const declineAssignment = async (id: number | string, reason?: string) => {
    const assignment = assignments.find(a => a.id === id);
    
    try {
      const response = await assignmentsApi.decline(String(id), reason);
      
      if (response.success) {
        const message = reason 
          ? `Declined - ${assignment?.assignedByName} will see your reason`
          : `Declined - ${assignment?.assignedByName} notified`;
        showFeedback(id, message, 'info');
        setAssignments(prev => prev.map(a => (a.id === id ? { ...a, status: 'declined' } : a)));
        
        setTimeout(() => {
          setAssignments(prev => prev.filter(a => a.id !== id));
        }, 1500);
      }
    } catch (e) {
      console.error('Error declining assignment:', e);
    }
  };

  // Confirm decline modal
  const confirmDecline = (id: number | string, title?: string) => {
    setDeclineAssignmentId(id);
    setDeclineAssignmentTitle(title || 'this mission');
    setDeclineReason('');
    setShowDeclineModal(true);
  };

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

  // Complete assignment
  const completeAssignment = async (id: number | string) => {
    try {
      const response = await assignmentsApi.complete(String(id));
      
      if (response.success) {
        showFeedback(id, 'Completed! Great job 🎉', 'success');
        setAssignments(prev => prev.map(a => (a.id === id ? { ...a, status: 'completed' } : a)));
        
        setTimeout(() => {
          setAssignments(prev => prev.filter(a => a.id !== id));
        }, 1500);
      }
    } catch (e) {
      console.error('Error completing assignment:', e);
    }
  };

  // Open detail modal
  const openAssignmentDetail = (assignment: Assignment) => {
    if (selectionMode) {
      // Toggle selection instead
      setSelectedAssignments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(assignment.id)) {
          newSet.delete(assignment.id);
        } else {
          newSet.add(assignment.id);
        }
        return newSet;
      });
      return;
    }
    setSelectedAssignment(assignment);
    setShowDetailModal(true);
  };

  // Long press handler
  const handleLongPressAssignment = (assignment: Assignment) => {
    if (selectionMode) {
      setSelectedAssignments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(assignment.id)) {
          newSet.delete(assignment.id);
        } else {
          newSet.add(assignment.id);
        }
        return newSet;
      });
    } else {
      setActionSheetAssignment(assignment);
      setShowActionSheet(true);
    }
  };

  // Delete selected
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
              const deletePromises = Array.from(selectedAssignments).map(id =>
                assignmentsApi.delete(String(id))
              );
              
              const results = await Promise.allSettled(deletePromises);
              const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
              
              if (successCount > 0) {
                setAssignments(prev => prev.filter(a => !selectedAssignments.has(a.id)));
                Alert.alert('Success', `Deleted ${successCount} mission${successCount > 1 ? 's' : ''}`);
              } else {
                Alert.alert('Error', 'Failed to delete missions. You can only delete missions you created.');
              }
              
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

  // Invitation actions
  const acceptInvite = async (id: number | string) => {
    const invite = allItems.find(it => it.id === id);
    const circleName = invite?.circleName || 'circle';
    const invitationId = invite?._invitationId || id;

    showFeedback(id, `Joining ${circleName}...`, 'success');

    try {
      const response = await invitationsApi.accept(String(invitationId));
      
      if (response.success) {
        setCircleInvitations((prev: any[]) => prev.filter(inv => inv.id !== invitationId));
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
    const invitationId = invite?._invitationId || id;

    showFeedback(id, 'Invite declined', 'info');

    try {
      const response = await invitationsApi.decline(String(invitationId));
      
      if (response.success) {
        setCircleInvitations((prev: any[]) => prev.filter(inv => inv.id !== invitationId));
      }
    } catch (e) {
      console.error('Error declining invite:', e);
    }
  };

  // Message handlers
  const handleMessageReply = async (id: number | string) => {
    const message = items.find(it => it.id === id);
    setItems(prev => prev.map(it => (it.id === id ? { ...it, isNew: false } : it)));

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

  // Reminder handlers
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

  const handleReminderDismiss = (id: number | string) => {
    showFeedback(id, 'Dismissed', 'info');
    enqueueAction({ type: 'removeItem', itemId: id, delayMs: 600 });
  };

  // Social handlers
  const handleSocialView = (id: number | string) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, isNew: false } : it)));
    handleNavigate('circles');
  };

  const handleArchive = (id: number | string) => {
    showFeedback(id, 'Archived', 'info');
    enqueueAction({ type: 'removeItem', itemId: id, delayMs: 600 });
  };

  // Edit mission modal (sender)
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

  const handleSaveMissionEdit = async () => {
    if (!actionSheetAssignment) return;
    
    setEditingInProgress(true);
    try {
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
        await fetchAssignments();
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

  // Edit response modal (assignee)
  const openEditResponseModal = (assignment: Assignment) => {
    setShowActionSheet(false);
    setEditResponseReason(assignment.declineReason || '');
    setShowEditResponseModal(true);
  };

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

  return {
    acceptAssignment,
    declineAssignment,
    confirmDecline,
    handleConfirmDecline,
    completeAssignment,
    openAssignmentDetail,
    handleLongPressAssignment,
    deleteSelectedAssignments,
    acceptInvite,
    declineInvite,
    handleMessageReply,
    handleMessageArchive,
    handleReminderDone,
    handleReminderDismiss,
    handleSocialView,
    handleArchive,
    openEditMissionModal,
    handleSaveMissionEdit,
    openEditResponseModal,
    handleUpdateDeclineReason,
    handleAcceptAfterDecline,
  };
}
