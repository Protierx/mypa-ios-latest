/**
 * Brain Dump Modal — Premium Management Inbox
 *
 * A large bottom sheet (~82% height) for reviewing and organizing brain dump items.
 * No add input inside — items are created via Add Task flow (smart routing).
 * Three tabs: Active / Converted / Archived
 * "Move to Tasks" CTA on active items, "Open Task" on converted, "Restore" on archived.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useBrainDump, BrainDumpStatus } from '../../hooks/supabase/useBrainDump';
import { BrainDumpItem, Task } from '../../lib/supabase';
import { eventLogger } from '../../services/eventLogger';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius } from '../../styles/theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.82;

// ============================================================================
// Types
// ============================================================================

type TabKey = 'active' | 'converted' | 'archived';

interface BrainDumpModalProps {
  visible: boolean;
  onClose: () => void;
  onMoveToTasks: (item: BrainDumpItem) => void;
  onOpenTask?: (taskId: string) => void;
  tasks?: (Task | any)[];
}

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatAddedTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (dateOnly.getTime() === today.getTime()) return `Added today ${time}`;
  if (dateOnly.getTime() === yesterday.getTime()) return `Added yesterday ${time}`;
  const daysDiff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (daysDiff < 7) return `Added ${daysDiff}d ago`;
  return `Added ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

// ============================================================================
// Component
// ============================================================================

export function BrainDumpModal({ visible, onClose, onMoveToTasks, onOpenTask, tasks = [] }: BrainDumpModalProps) {
  const {
    activeItems,
    convertedItems,
    archivedItems,
    loading,
    error,
    archiveItem,
    restoreItem,
    deleteItem,
    refresh,
  } = useBrainDump();

  const [activeTab, setActiveTab] = useState<TabKey>('active');

  // Toast
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => setToast({ message: '', visible: false }), 2200);
  }, []);

  // Refresh on open
  useEffect(() => {
    if (visible) {
      refresh();
      setActiveTab('active');
      eventLogger.log('modal_opened', { modal: 'brain_dump' });
    }
  }, [visible]);

  // ── Data for current tab ──
  const currentData = activeTab === 'active'
    ? activeItems
    : activeTab === 'converted'
    ? convertedItems
    : archivedItems;

  // ── Archive handler ──
  const handleArchive = useCallback(async (item: BrainDumpItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await archiveItem(item.id);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Moved to Archive');
    }
  }, [archiveItem, showToast]);

  // ── Restore handler (archived → active) ──
  const handleRestore = useCallback(async (item: BrainDumpItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await restoreItem(item.id);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActiveTab('active');
      showToast('Restored to Active');
    } else {
      showToast("Couldn't restore item. Try again.");
    }
  }, [restoreItem, showToast]);

  // ── Delete handler ──
  const handleDelete = useCallback((item: BrainDumpItem) => {
    Alert.alert('Delete Permanently', `This will permanently remove "${item.text.slice(0, 40)}${item.text.length > 40 ? '...' : ''}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const ok = await deleteItem(item.id);
          if (ok) showToast('Deleted');
        },
      },
    ]);
  }, [deleteItem, showToast]);

  // ── Move to tasks handler ──
  const handleMoveToTasks = useCallback((item: BrainDumpItem) => {
    if (item.status !== 'active') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onMoveToTasks(item);
  }, [onMoveToTasks]);

  // ── Tab Chip ──
  const TabChip = ({ tab, label, count }: { tab: TabKey; label: string; count: number }) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 12,
          backgroundColor: isActive ? brand.surface : bg.input,
          borderWidth: isActive ? 1.5 : 1,
          borderColor: isActive ? brand.primary : 'transparent',
          ...(isActive ? {
            shadowColor: brand.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 4,
            elevation: 2,
          } : {}),
        }}
        onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={`${label} tab, ${count} items`}
      >
        <Text
          style={{
            fontSize: 13.5,
            fontWeight: isActive ? '700' : '500',
            color: isActive ? brand.primary : textTokens.secondary,
          }}
        >
          {label}
        </Text>
        <View
          style={{
            marginLeft: 6,
            backgroundColor: isActive ? `${brand.primary}20` : borderTokens.secondary,
            paddingHorizontal: 7,
            paddingVertical: 1.5,
            borderRadius: 7,
            minWidth: 22,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: isActive ? brand.primary : textTokens.tertiary,
            }}
          >
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render Active Item ──
  const renderActiveItem = useCallback(({ item }: { item: BrainDumpItem }) => (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        backgroundColor: bg.card,
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: borderTokens.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Content */}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
        <Text
          style={{
            fontSize: 15.5,
            fontWeight: '500',
            color: textTokens.primary,
            lineHeight: 22,
          }}
          numberOfLines={2}
        >
          {item.text}
        </Text>
        <Text style={{ fontSize: 12.5, color: textTokens.tertiary, marginTop: 5, fontWeight: '500' }}>
          {formatAddedTime(item.created_at)}
        </Text>
      </View>

      {/* Actions */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingBottom: 12,
          gap: 8,
        }}
      >
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: brand.primary,
            shadowColor: brand.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => handleMoveToTasks(item)}
          activeOpacity={0.8}
          accessibilityLabel="Move to Tasks"
          accessibilityHint="Convert this brain dump into a scheduled task"
        >
          <Ionicons name="arrow-forward-circle" size={14} color="#FFFFFF" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginLeft: 6 }}>
            Move to Tasks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: bg.input,
          }}
          onPress={() => handleArchive(item)}
          activeOpacity={0.7}
          accessibilityLabel="Archive"
        >
          <Ionicons name="archive-outline" size={14} color={textTokens.tertiary} />
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: textTokens.tertiary, marginLeft: 5 }}>
            Archive
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [handleMoveToTasks, handleArchive]);

  // ── Render Converted Item ──
  const renderConvertedItem = useCallback(({ item }: { item: BrainDumpItem }) => {
    // Look up linked task for preview
    const linkedTask = item.converted_task_id
      ? tasks.find((t: any) => t.id === item.converted_task_id)
      : null;

    return (
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 10,
          backgroundColor: semantic.successLight,
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: 'rgba(52,199,89,0.15)',
          overflow: 'hidden',
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
          {/* Converted badge + timestamp */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: semantic.successSoft,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 7,
              }}
            >
              <Ionicons name="checkmark-circle" size={12} color={semantic.success} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: semantic.success, marginLeft: 4 }}>
                Converted
              </Text>
            </View>
            {item.converted_at && (
              <Text style={{ fontSize: 11.5, color: textTokens.tertiary, marginLeft: 8, fontWeight: '500' }}>
                {formatRelativeTime(item.converted_at)}
              </Text>
            )}
          </View>

          {/* Original text */}
          <Text
            style={{ fontSize: 14.5, color: textTokens.secondary, lineHeight: 20 }}
            numberOfLines={2}
          >
            {item.text}
          </Text>

          {/* Linked task preview */}
          {linkedTask && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 8,
              paddingHorizontal: 10,
              paddingVertical: 7,
              backgroundColor: bg.hover,
              borderRadius: 8,
              borderWidth: 0.5,
              borderColor: 'rgba(52,199,89,0.12)',
            }}>
              <Ionicons name="document-text-outline" size={13} color={textTokens.tertiary} />
              <Text
                numberOfLines={1}
                style={{ fontSize: 12.5, color: textTokens.primary, fontWeight: '500', marginLeft: 6, flex: 1 }}
              >
                {(linkedTask as any).title || 'Linked task'}
              </Text>
              {(linkedTask as any).due_date && (
                <Text style={{ fontSize: 11, color: textTokens.tertiary, marginLeft: 6 }}>
                  {new Date((linkedTask as any).due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Actions */}
        {item.converted_task_id && onOpenTask && (
          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8,
                backgroundColor: 'rgba(52,199,89,0.12)',
                alignSelf: 'flex-start',
              }}
              onPress={() => onOpenTask(item.converted_task_id!)}
              activeOpacity={0.7}
              accessibilityLabel="Open linked task"
            >
              <Ionicons name="open-outline" size={13} color={semantic.success} />
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: semantic.success, marginLeft: 5 }}>
                Open Task
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [tasks, onOpenTask]);

  // ── Render Archived Item ──
  const renderArchivedItem = useCallback(({ item }: { item: BrainDumpItem }) => (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        backgroundColor: bg.input,
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: borderTokens.secondary,
        overflow: 'hidden',
      }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
        <Text
          style={{ fontSize: 14.5, color: textTokens.tertiary, lineHeight: 20 }}
          numberOfLines={2}
        >
          {item.text}
        </Text>
        <Text style={{ fontSize: 11.5, color: textTokens.disabled, marginTop: 4, fontWeight: '500' }}>
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: brand.muted,
          }}
          onPress={() => handleRestore(item)}
          activeOpacity={0.7}
          accessibilityLabel="Restore to Active"
        >
          <Ionicons name="refresh-outline" size={13} color={brand.primary} />
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: brand.primary, marginLeft: 5 }}>
            Restore
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 8,
            backgroundColor: semantic.errorLight,
          }}
          onPress={() => handleDelete(item)}
          activeOpacity={0.7}
          accessibilityLabel="Delete permanently"
        >
          <Ionicons name="trash-outline" size={13} color={semantic.error} />
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: semantic.error, marginLeft: 5 }}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [handleRestore, handleDelete]);

  // ── Render Item (dispatch by tab) ──
  const renderItem = useCallback(
    ({ item }: { item: BrainDumpItem }) => {
      if (activeTab === 'active') return renderActiveItem({ item });
      if (activeTab === 'converted') return renderConvertedItem({ item });
      return renderArchivedItem({ item });
    },
    [activeTab, renderActiveItem, renderConvertedItem, renderArchivedItem]
  );

  // ── Empty State ──
  const renderEmpty = () => {
    if (loading) return null;

    const messages: Record<TabKey, { icon: string; title: string; subtitle: string }> = {
      active: {
        icon: 'bulb-outline',
        title: 'No thoughts yet',
        subtitle: 'Add a task without date/time and it appears here.',
      },
      converted: {
        icon: 'checkmark-done-outline',
        title: 'No converted items yet',
        subtitle: 'Move active items to your task list to see them here.',
      },
      archived: {
        icon: 'archive-outline',
        title: 'No archived items',
        subtitle: 'Archived thoughts will appear here.',
      },
    };

    const msg = messages[activeTab];

    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 56, paddingHorizontal: 36 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: brand.muted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            shadowColor: brand.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
          }}
        >
          <Ionicons name={msg.icon as any} size={26} color={brand.primary} />
        </View>
        <Text style={{ fontSize: 17, fontWeight: '700', color: textTokens.primary, textAlign: 'center', letterSpacing: -0.2 }}>
          {msg.title}
        </Text>
        <Text style={{ fontSize: 13.5, color: textTokens.tertiary, marginTop: 6, textAlign: 'center', lineHeight: 19 }}>
          {msg.subtitle}
        </Text>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Backdrop */}
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => { Keyboard.dismiss(); onClose(); }}
        >
          <View style={{ flex: 1 }} />

          {/* Sheet */}
          <Pressable
            style={{
              height: SHEET_HEIGHT,
              backgroundColor: bg.secondary,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 14,
            }}
            onPress={Keyboard.dismiss}
          >
            <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
              {/* Handle */}
              <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
                <View style={{ width: 36, height: 5, borderRadius: 2.5, backgroundColor: textTokens.disabled }} />
              </View>

              {/* Header */}
              <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{
                      width: 32, height: 32, borderRadius: 10,
                      backgroundColor: brand.muted,
                      alignItems: 'center', justifyContent: 'center',
                      marginRight: 10,
                    }}>
                      <Ionicons name="bulb" size={18} color={brand.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: textTokens.primary, letterSpacing: -0.3 }}>
                        Brain Dump
                      </Text>
                    </View>
                  </View>
                  {/* Summary counts */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary }}>
                      {activeItems.length} active
                    </Text>
                    <Text style={{ fontSize: 12, color: textTokens.disabled, marginHorizontal: 4 }}>•</Text>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary }}>
                      {convertedItems.length} converted
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityLabel="Close brain dump"
                    accessibilityRole="button"
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: bg.input,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="close" size={16} color={textTokens.secondary} />
                    </View>
                  </TouchableOpacity>
                </View>
                {/* Helper subtitle */}
                <Text style={{ fontSize: 12.5, color: textTokens.tertiary, marginTop: 4, marginLeft: 42 }}>
                  Unscheduled items from Tasks appear here automatically.
                </Text>
              </View>

              {/* Tabs */}
              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 16,
                  paddingTop: 8,
                  paddingBottom: 12,
                  gap: 8,
                  borderBottomWidth: 0.5,
                  borderBottomColor: borderTokens.primary,
                }}
              >
                <TabChip tab="active" label="Active" count={activeItems.length} />
                <TabChip tab="converted" label="Converted" count={convertedItems.length} />
                <TabChip tab="archived" label="Archived" count={archivedItems.length} />
              </View>

              {/* Error banner */}
              {error && (
                <View
                  style={{
                    marginHorizontal: 16,
                    marginTop: 8,
                    marginBottom: 4,
                    backgroundColor: semantic.errorLight,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="alert-circle" size={16} color={semantic.error} />
                  <Text style={{ fontSize: 13, color: semantic.error, marginLeft: 8, flex: 1, fontWeight: '500' }}>
                    {error.message}
                  </Text>
                  <TouchableOpacity onPress={refresh}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: brand.primary }}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Loading */}
              {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={brand.primary} size="large" />
                </View>
              ) : (
                <FlatList
                  data={currentData}
                  keyExtractor={(item) => item.id}
                  renderItem={renderItem}
                  ListEmptyComponent={renderEmpty}
                  contentContainerStyle={{ paddingTop: 8, paddingBottom: 24, flexGrow: 1 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                />
              )}

              {/* Toast */}
              {toast.visible && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 40,
                    left: 0,
                    right: 0,
                    alignItems: 'center',
                    zIndex: 999,
                  }}
                  pointerEvents="none"
                >
                  <View
                    style={{
                      backgroundColor: 'rgba(28,28,30,0.92)',
                      paddingHorizontal: 20,
                      paddingVertical: 11,
                      borderRadius: 14,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.18,
                      shadowRadius: 12,
                      maxWidth: 280,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>{toast.message}</Text>
                  </View>
                </View>
              )}
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default BrainDumpModal;
