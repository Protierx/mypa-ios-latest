import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { IOSStatusBar } from '../../components/IOSStatusBar';
import { styles } from './styles';
import { useInboxData } from './hooks/useInboxData';
import { useInboxActions } from './hooks/useInboxActions';

import {
  AssignmentCard,
  NotificationCard,
  EmptyState,
  SelectionHeader,
  InboxHeader,
  TabsRow,
} from './components';

import {
  DetailModal,
  DeclineModal,
  ActionSheetModal,
  EditMissionModal,
  EditResponseModal,
} from './modals';

interface InboxScreenProps {
  navigation?: any;
}

// Section header component
const SectionHeader = ({ title, count }: { title: string; count: number }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionCount}>{count} {count === 1 ? 'task' : 'tasks'}</Text>
  </View>
);

// Separator component
const ItemSeparator = () => <View style={{ height: 12 }} />;

export function InboxScreen({ navigation }: InboxScreenProps) {
  const nav = useNavigation<any>();
  const [circleInvitations, setCircleInvitations] = useState<any[]>([]);

  // Navigation helper
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
      navigator.navigate('Today', { screen: homeStackRoutes[screen] });
    } else if (screen === 'plan') {
      navigator.navigate('Plan', params || {});
    } else if (screen === 'circles' || screen === 'circle-home') {
      if (screen === 'circle-home') {
        const parentNav = navigator.getParent?.();
        const rootNav = parentNav?.getParent?.() || parentNav || navigator;
        rootNav.navigate('CircleHome', params || {});
      } else {
        navigator.navigate('Circles', { screen: 'CirclesList' });
      }
    } else {
      navigator.navigate(screen);
    }
  };

  const inboxData = useInboxData();
  
  const actions = useInboxActions({
    assignments: inboxData.assignments,
    setAssignments: inboxData.setAssignments,
    items: inboxData.items,
    setItems: inboxData.setItems,
    allItems: inboxData.allItems,
    showFeedback: inboxData.showFeedback,
    enqueueAction: inboxData.enqueueAction,
    selectedAssignments: inboxData.selectedAssignments,
    setSelectedAssignments: inboxData.setSelectedAssignments,
    cancelSelectionMode: inboxData.cancelSelectionMode,
    setDeletingSelected: inboxData.setDeletingSelected,
    setCircleInvitations,
    handleNavigate,
    setShowDeclineModal: inboxData.setShowDeclineModal,
    setDeclineAssignmentId: inboxData.setDeclineAssignmentId,
    setDeclineAssignmentTitle: inboxData.setDeclineAssignmentTitle,
    declineReason: inboxData.declineReason,
    setDeclineReason: inboxData.setDeclineReason,
    setDecliningInProgress: inboxData.setDecliningInProgress,
    declineAssignmentId: inboxData.declineAssignmentId,
    setShowDetailModal: inboxData.setShowDetailModal,
    setSelectedAssignment: inboxData.setSelectedAssignment,
    setShowEditMissionModal: inboxData.setShowEditMissionModal,
    setEditMissionData: inboxData.setEditMissionData,
    editMissionData: inboxData.editMissionData,
    setEditingInProgress: inboxData.setEditingInProgress,
    setShowEditDatePicker: inboxData.setShowEditDatePicker,
    setShowEditTimePicker: inboxData.setShowEditTimePicker,
    setShowEditResponseModal: inboxData.setShowEditResponseModal,
    editResponseReason: inboxData.editResponseReason,
    setEditResponseReason: inboxData.setEditResponseReason,
    setEditingResponseInProgress: inboxData.setEditingResponseInProgress,
    setShowActionSheet: inboxData.setShowActionSheet,
    actionSheetAssignment: inboxData.actionSheetAssignment,
    setActionSheetAssignment: inboxData.setActionSheetAssignment,
    selectionMode: inboxData.selectionMode,
    fetchAssignments: inboxData.fetchAssignments,
  });

  const renderAssignment = ({ item, index }: { item: any; index: number }) => (
    <AssignmentCard
      item={item}
      index={index}
      isSelected={inboxData.selectedAssignments.has(item.id)}
      selectionMode={inboxData.selectionMode}
      actionFeedback={inboxData.actionFeedback}
      onPress={() => actions.openAssignmentDetail(item)}
      onLongPress={() => actions.handleLongPressAssignment(item)}
      onToggleSelection={() => inboxData.toggleAssignmentSelection(item.id)}
      onAccept={() => actions.acceptAssignment(item.id)}
      onDecline={() => actions.confirmDecline(item.id, item.title)}
      onComplete={() => actions.completeAssignment(item.id)}
      onViewInPlan={() => {
        const taskDate = item.dueDateFull ? new Date(item.dueDateFull).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        handleNavigate('plan', { date: taskDate });
      }}
    />
  );

  const renderNotification = ({ item, index }: { item: any; index: number }) => (
    <NotificationCard
      item={item}
      index={index}
      actionFeedback={inboxData.actionFeedback}
      snoozedItems={inboxData.snoozedItems}
      onMarkRead={() => inboxData.markRead(item.id)}
      onSnooze={() => inboxData.snoozeItem(item.id)}
      onAcceptInvite={() => actions.acceptInvite(item.id)}
      onDeclineInvite={() => actions.declineInvite(item.id)}
      onMessageReply={() => actions.handleMessageReply(item.id)}
      onMessageArchive={() => actions.handleMessageArchive(item.id)}
      onReminderDone={() => actions.handleReminderDone(item.id)}
      onReminderDismiss={() => actions.handleReminderDismiss(item.id)}
      onSocialView={() => actions.handleSocialView(item.id)}
      onArchive={() => actions.handleArchive(item.id)}
    />
  );

  // Memoize the combined list data to prevent unnecessary re-renders
  const inboxListData = useMemo(() => {
    const list: any[] = [];

    // Add header if not in selection mode
    if (!inboxData.selectionMode) {
      list.push({ type: 'header', id: 'header' });
      list.push({ type: 'tabs', id: 'tabs' });
    }

    // Add assignments section
    if (inboxData.assignments.length > 0) {
      list.push({
        type: 'sectionHeader',
        id: 'assignments-header',
        title: 'Assigned to you',
        count: inboxData.assignments.length,
      });

      inboxData.assignments.forEach((item) => {
        list.push({ type: 'assignment', id: `assignment-${item.id}`, item });
      });

      list.push({ type: 'spacer', id: 'spacer-after-assignments' });
    }

    // Add activity section
    list.push({
      type: 'sectionHeader',
      id: 'activity-header',
      title: 'Activity',
      count: inboxData.filtered.length,
    });

    if (inboxData.filtered.length === 0) {
      list.push({ type: 'emptyState', id: 'empty' });
    } else {
      inboxData.filtered.forEach((item) => {
        list.push({ type: 'notification', id: `notification-${item.id}`, item });
      });
    }

    return list;
  }, [inboxData.assignments, inboxData.filtered, inboxData.selectionMode]);

  const renderListItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case 'header':
        return (
          <InboxHeader
            newCount={inboxData.newCount}
            pendingCount={inboxData.pendingCount}
            onBack={() => handleNavigate('hub')}
            onMarkAllRead={inboxData.markAllRead}
          />
        );
      case 'tabs':
        return (
          <TabsRow
            activeTab={inboxData.activeTab}
            onTabChange={inboxData.setActiveTab}
          />
        );
      case 'sectionHeader':
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            <Text style={styles.sectionCount}>{item.count}</Text>
          </View>
        );
      case 'assignment':
        return (
          <AssignmentCard
            item={item.item}
            index={0}
            isSelected={inboxData.selectedAssignments.has(item.item.id)}
            selectionMode={inboxData.selectionMode}
            actionFeedback={inboxData.actionFeedback}
            onPress={() => actions.openAssignmentDetail(item.item)}
            onLongPress={() => actions.handleLongPressAssignment(item.item)}
            onAccept={() => actions.acceptAssignment(item.item.id)}
            onDecline={() => actions.confirmDecline(item.item.id, item.item.title)}
            onComplete={() => actions.completeAssignment(item.item.id)}
            onToggleSelection={() => inboxData.toggleAssignmentSelection(item.item.id)}
            onViewInPlan={() => {
              const taskDate = item.item.dueDateFull ? new Date(item.item.dueDateFull).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
              handleNavigate('plan', { date: taskDate });
            }}
          />
        );
      case 'notification':
        return renderNotification({ item: item.item, index: 0 });
      case 'emptyState':
        return (
          <EmptyState
            onViewPlan={() => handleNavigate('plan')}
            onViewCircles={() => handleNavigate('circles')}
          />
        );
      case 'spacer':
        return <View style={{ height: 12 }} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <IOSStatusBar />
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      {/* Selection Mode Header */}
      {inboxData.selectionMode && (
        <SelectionHeader
          selectedCount={inboxData.selectedAssignments.size}
          isDeleting={inboxData.deletingSelected}
          onCancel={inboxData.cancelSelectionMode}
          onDelete={actions.deleteSelectedAssignments}
        />
      )}

      {/* Optimized: Single FlatList as primary scroll container */}
      <FlatList
        data={inboxListData}
        renderItem={renderListItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={inboxData.refreshing}
            onRefresh={inboxData.onRefresh}
          />
        }
        // Performance optimizations
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        scrollIndicatorInsets={{ right: 1 }}
      />

      {/* Modals */}
      <DetailModal
        visible={inboxData.showDetailModal}
        assignment={inboxData.selectedAssignment}
        onClose={() => inboxData.setShowDetailModal(false)}
        onAccept={() => {
          actions.acceptAssignment(inboxData.selectedAssignment!.id);
          inboxData.setShowDetailModal(false);
        }}
        onDecline={() => {
          inboxData.setShowDetailModal(false);
          actions.confirmDecline(inboxData.selectedAssignment!.id, inboxData.selectedAssignment!.title);
        }}
        onComplete={() => {
          actions.completeAssignment(inboxData.selectedAssignment!.id);
          inboxData.setShowDetailModal(false);
        }}
      />

      <DeclineModal
        visible={inboxData.showDeclineModal}
        assignmentTitle={inboxData.declineAssignmentTitle}
        reason={inboxData.declineReason}
        isProcessing={inboxData.decliningInProgress}
        onReasonChange={inboxData.setDeclineReason}
        onConfirm={() => actions.handleConfirmDecline(true)}
        onCancel={() => {
          inboxData.setShowDeclineModal(false);
          inboxData.setDeclineAssignmentId(null);
          inboxData.setDeclineReason('');
        }}
      />

      <ActionSheetModal
        visible={inboxData.showActionSheet}
        assignment={inboxData.actionSheetAssignment}
        isRecipient={inboxData.actionSheetAssignment ? inboxData.isAssignmentRecipient(inboxData.actionSheetAssignment) : false}
        isSender={inboxData.actionSheetAssignment ? inboxData.isAssignmentSender(inboxData.actionSheetAssignment) : false}
        onClose={() => inboxData.setShowActionSheet(false)}
        onEditMission={() => actions.openEditMissionModal(inboxData.actionSheetAssignment!)}
        onEditResponse={() => actions.openEditResponseModal(inboxData.actionSheetAssignment!)}
        onAcceptAfterDecline={() => {
          inboxData.setShowActionSheet(false);
          actions.handleAcceptAfterDecline();
        }}
        onDelete={() => inboxData.enterDeleteSelectionMode(inboxData.actionSheetAssignment!)}
      />

      <EditMissionModal
        visible={inboxData.showEditMissionModal}
        data={inboxData.editMissionData}
        isProcessing={inboxData.editingInProgress}
        showDatePicker={inboxData.showEditDatePicker}
        showTimePicker={inboxData.showEditTimePicker}
        onDataChange={(data) => inboxData.setEditMissionData((prev: any) => ({ ...prev, ...data }))}
        onShowDatePicker={() => inboxData.setShowEditDatePicker(true)}
        onShowTimePicker={() => inboxData.setShowEditTimePicker(true)}
        onDateChange={(date) => {
          inboxData.setShowEditDatePicker(false);
          if (date) inboxData.setEditMissionData((prev: any) => ({ ...prev, dueDate: date }));
        }}
        onTimeChange={(time) => {
          inboxData.setShowEditTimePicker(false);
          if (time) inboxData.setEditMissionData((prev: any) => ({ ...prev, dueTime: time }));
        }}
        onSave={actions.handleSaveMissionEdit}
        onClose={() => inboxData.setShowEditMissionModal(false)}
      />

      <EditResponseModal
        visible={inboxData.showEditResponseModal}
        reason={inboxData.editResponseReason}
        isProcessing={inboxData.editingResponseInProgress}
        onReasonChange={inboxData.setEditResponseReason}
        onUpdateReason={actions.handleUpdateDeclineReason}
        onAcceptInstead={actions.handleAcceptAfterDecline}
        onClose={() => inboxData.setShowEditResponseModal(false)}
      />
    </SafeAreaView>
  );
}

export default InboxScreen;
