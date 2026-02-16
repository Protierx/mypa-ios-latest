/**
 * Notifications Modal
 * 
 * Notifications center showing all app notifications.
 * Supports filtering by type and mark as read.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useNotifications } from '../../hooks/supabase';
import { Notification } from '../../lib/supabase';
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius } from '../../styles/theme';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  onNotificationPress?: (notification: Notification) => void;
}

type FilterType = 'all' | 'social' | 'tasks' | 'system';

const NOTIFICATION_ICONS: Record<string, { icon: string; color: string }> = {
  circle_invite: { icon: 'people-outline', color: semantic.info },
  challenge_update: { icon: 'trophy-outline', color: semantic.warning },
  task_reminder: { icon: 'alarm-outline', color: semantic.error },
  streak_warning: { icon: 'flame-outline', color: '#F97316' },
  achievement: { icon: 'star-outline', color: semantic.warning },
  system: { icon: 'information-circle-outline', color: textTokens.tertiary },
  default: { icon: 'notifications-outline', color: brand.primary },
};

const getNotificationIcon = (type: string) => {
  return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default;
};

const getFilterForType = (type: string): FilterType => {
  if (['circle_invite', 'challenge_update'].includes(type)) return 'social';
  if (['task_reminder'].includes(type)) return 'tasks';
  if (['system'].includes(type)) return 'system';
  return 'all';
};

export function NotificationsModal({ visible, onClose, onNotificationPress }: NotificationsModalProps) {
  const { notifications, loading: isLoading, refresh, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredNotifications = notifications.filter((n: Notification) => {
    if (filter === 'all') return true;
    return getFilterForType(n.type) === filter;
  });

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  const handleMarkAllRead = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleNotificationPress = useCallback(async (notification: Notification) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    onNotificationPress?.(notification);
  }, [markAsRead, onNotificationPress]);

  const handleDelete = useCallback(async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteNotification(id);
  }, [deleteNotification]);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const { icon, color } = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row', alignItems: 'flex-start', padding: 16,
          borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary,
          backgroundColor: !item.read ? `${brand.primary}08` : 'transparent',
        }}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleDelete(item.id)}
      >
        {/* Icon */}
        <View 
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        
        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: textTokens.primary, fontWeight: '500', fontSize: 15 }}>{item.title}</Text>
          {item.body && (
            <Text style={{ color: textTokens.secondary, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
              {item.body}
            </Text>
          )}
          <Text style={{ color: textTokens.tertiary, fontSize: 11, marginTop: 4 }}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
        
        {/* Unread Indicator */}
        {!item.read && (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: brand.primary, marginTop: 8 }} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
      <Ionicons name="notifications-off-outline" size={64} color={textTokens.disabled} />
      <Text style={{ color: textTokens.secondary, fontSize: 18, marginTop: 16 }}>You're all caught up!</Text>
      <Text style={{ color: textTokens.tertiary, marginTop: 4, fontSize: 14 }}>No new notifications</Text>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: bg.primary }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, marginLeft: -8 }}>
            <Ionicons name="close" size={24} color={textTokens.primary} />
          </TouchableOpacity>
          
          <Text style={{ color: textTokens.primary, fontSize: 17, fontWeight: '600' }}>Notifications</Text>
          
          <TouchableOpacity 
            onPress={handleMarkAllRead}
            style={{ padding: 8, marginRight: -8 }}
            disabled={unreadCount === 0}
          >
            <Text style={{ fontSize: 13, color: unreadCount > 0 ? brand.primary : textTokens.disabled }}>
              Mark all read
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
          {(['all', 'social', 'tasks', 'system'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={{
                flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, marginHorizontal: 4,
                backgroundColor: filter === f ? brand.primary : 'transparent',
              }}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(f);
              }}
            >
              <Text style={{ fontSize: 13, textTransform: 'capitalize', fontWeight: filter === f ? '600' : '500', color: filter === f ? '#fff' : textTokens.tertiary }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications List */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={brand.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={brand.primary}
              />
            }
          />
        )}

        {/* Hint */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: borderTokens.primary }}>
          <Text style={{ color: textTokens.tertiary, fontSize: 11, textAlign: 'center' }}>
            Long press a notification to delete it
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
