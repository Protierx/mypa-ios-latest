/**
 * Notifications Modal (v2)
 *
 * Full-featured notification center with:
 *  • Tabbed filtering: All / Social / Tasks / System
 *  • Unread dot indicators + per-tab unread counts
 *  • Tap = mark read + deep-link
 *  • Long-press = delete (soft)
 *  • "Mark all read" scoped to active tab
 *  • Cursor-based pagination (infinite scroll)
 *  • Tab-specific empty states
 *  • Footer hint
 *  • Toast on failures
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useNotifications } from '../../hooks/supabase';
import { Notification } from '../../lib/supabase';
import { useGestureNavigation } from '../../navigation-v2/useGestureNavigation';
import {
  type NotificationTab,
  TAB_LABELS,
  TAB_EMPTY_STATES,
  getNotificationIcon,
  resolveDeepLink,
} from '../../types/notifications';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius, spacing } from '../../styles/theme';

// ── Props ───────────────────────────────────────────────────────────

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  onNotificationPress?: (notification: Notification) => void;
}

// ── Tabs ────────────────────────────────────────────────────────────

const TABS: NotificationTab[] = ['all', 'social', 'tasks', 'system'];

// ── Component ───────────────────────────────────────────────────────

export function NotificationsModal({ visible, onClose, onNotificationPress }: NotificationsModalProps) {
  const {
    notifications,
    unreadCounts,
    loading,
    loadingMore,
    hasMore,
    activeTab,
    setActiveTab,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refresh,
  } = useNotifications();

  const { navigateTo } = useGestureNavigation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => setToast({ message: '', visible: false }), 2500);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  const handleTabChange = useCallback((tab: NotificationTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  }, [setActiveTab]);

  const handleMarkAllRead = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await markAllAsRead();
    if (!success) showToast('Failed to mark all as read');
  }, [markAllAsRead, showToast]);

  const handlePress = useCallback(async (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mark as read
    if (!notification.read_at) {
      const ok = await markAsRead(notification.id);
      if (!ok) showToast('Failed to mark as read');
    }

    // Custom handler takes precedence
    if (onNotificationPress) {
      onNotificationPress(notification);
      return;
    }

    // Deep-link
    const target = resolveDeepLink(notification.type, notification.data);
    if (target) {
      onClose();
      // Small delay to let modal dismiss
      setTimeout(() => {
        navigateTo(target.screen as any);
        // TODO: open target.modal with target.params when modal routing is available
      }, 350);
    }
  }, [markAsRead, onNotificationPress, onClose, navigateTo, showToast]);

  const handleLongPress = useCallback((notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Notification',
      'Remove this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteNotification(notification.id);
            if (!ok) showToast('Failed to delete notification');
          },
        },
      ]
    );
  }, [deleteNotification, showToast]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore) loadMore();
  }, [hasMore, loadingMore, loadMore]);

  // ── Formatters ────────────────────────────────────────────────────

  const formatTimeAgo = (dateString: string): string => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return new Date(dateString).toLocaleDateString();
  };

  // ── Unread count for current tab ──────────────────────────────────

  const currentTabUnread = unreadCounts[activeTab];

  // ── Renders ───────────────────────────────────────────────────────

  const renderNotification = ({ item }: { item: Notification }) => {
    const { icon, color } = getNotificationIcon(item.type);
    const isUnread = !item.read_at;

    return (
      <TouchableOpacity
        style={[s.notifRow, isUnread && s.notifRowUnread]}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={[s.notifIcon, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>

        {/* Content */}
        <View style={s.notifContent}>
          <Text style={[s.notifTitle, isUnread && s.notifTitleUnread]}>{item.title}</Text>
          {item.body ? (
            <Text style={s.notifBody} numberOfLines={2}>{item.body}</Text>
          ) : null}
          <Text style={s.notifTime}>{formatTimeAgo(item.created_at)}</Text>
        </View>

        {/* Unread dot */}
        {isUnread && <View style={s.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    const emptyState = TAB_EMPTY_STATES[activeTab];
    return (
      <View style={s.emptyWrap}>
        <Ionicons name={emptyState.icon as any} size={56} color={textTokens.disabled} />
        <Text style={s.emptyTitle}>{emptyState.title}</Text>
        <Text style={s.emptySubtitle}>{emptyState.subtitle}</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={brand.primary} />
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
        {/* ── Header ───────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={textTokens.primary} />
          </TouchableOpacity>

          <Text style={s.headerTitle}>Notifications</Text>

          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={s.markAllBtn}
            disabled={currentTabUnread === 0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[s.markAllText, currentTabUnread === 0 && { color: textTokens.disabled }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <View style={s.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const count = unreadCounts[tab];
            return (
              <TouchableOpacity
                key={tab}
                style={[s.tab, isActive && s.tabActive]}
                onPress={() => handleTabChange(tab)}
                activeOpacity={0.7}
              >
                <Text style={[s.tabText, isActive && s.tabTextActive]}>
                  {TAB_LABELS[tab]}
                </Text>
                {count > 0 && (
                  <View style={[s.tabBadge, isActive && s.tabBadgeActive]}>
                    <Text style={[s.tabBadgeText, isActive && s.tabBadgeTextActive]}>
                      {count > 99 ? '99+' : count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── List ─────────────────────────────────────────────── */}
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={brand.primary} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={brand.primary} />
            }
            contentContainerStyle={notifications.length === 0 ? { flex: 1 } : undefined}
          />
        )}

        {/* ── Footer hint ──────────────────────────────────────── */}
        <View style={s.footerHint}>
          <Text style={s.footerHintText}>Long press a notification to delete it</Text>
        </View>

        {/* ── Toast ────────────────────────────────────────────── */}
        {toast.visible && (
          <View style={s.toast}>
            <Text style={s.toastText}>{toast.message}</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: bg.primary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: borderTokens.primary,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    color: textTokens.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  markAllBtn: {
    padding: 4,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: brand.primary,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: borderTokens.primary,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: 'transparent',
    gap: 4,
  },
  tabActive: {
    backgroundColor: brand.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: textTokens.tertiary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: `${brand.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: brand.primary,
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Notification row
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: borderTokens.primary,
    backgroundColor: 'transparent',
  },
  notifRowUnread: {
    backgroundColor: `${brand.primary}06`,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    color: textTokens.primary,
    fontSize: 15,
    fontWeight: '400',
  },
  notifTitleUnread: {
    fontWeight: '600',
  },
  notifBody: {
    color: textTokens.secondary,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  notifTime: {
    color: textTokens.tertiary,
    fontSize: 11,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brand.primary,
    marginTop: 8,
    marginLeft: 8,
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: textTokens.secondary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: textTokens.tertiary,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer hint
  footerHint: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: borderTokens.primary,
  },
  footerHintText: {
    color: textTokens.tertiary,
    fontSize: 11,
    textAlign: 'center',
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
