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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useNotifications } from '../../hooks/supabase';
import { Notification } from '../../lib/supabase';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  onNotificationPress?: (notification: Notification) => void;
}

type FilterType = 'all' | 'social' | 'tasks' | 'system';

const NOTIFICATION_ICONS: Record<string, { icon: string; color: string }> = {
  circle_invite: { icon: 'people-outline', color: '#3b82f6' },
  challenge_update: { icon: 'trophy-outline', color: '#f59e0b' },
  task_reminder: { icon: 'alarm-outline', color: '#ef4444' },
  streak_warning: { icon: 'flame-outline', color: '#f97316' },
  achievement: { icon: 'star-outline', color: '#eab308' },
  system: { icon: 'information-circle-outline', color: '#6b7280' },
  default: { icon: 'notifications-outline', color: '#a855f7' },
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
        className={`flex-row items-start p-4 border-b border-zinc-800 ${
          !item.read ? 'bg-purple-900/10' : ''
        }`}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleDelete(item.id)}
      >
        {/* Icon */}
        <View 
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        
        {/* Content */}
        <View className="flex-1">
          <Text className="text-white font-medium">{item.title}</Text>
          {item.body && (
            <Text className="text-zinc-500 text-sm mt-0.5" numberOfLines={2}>
              {item.body}
            </Text>
          )}
          <Text className="text-zinc-600 text-xs mt-1">
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
        
        {/* Unread Indicator */}
        {!item.read && (
          <View className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Ionicons name="notifications-off-outline" size={64} color="#3f3f46" />
      <Text className="text-zinc-500 text-lg mt-4">You're all caught up!</Text>
      <Text className="text-zinc-600 mt-1">No new notifications</Text>
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
      <SafeAreaView className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-zinc-800">
          <TouchableOpacity onPress={onClose} className="p-2 -ml-2">
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text className="text-white text-lg font-semibold">Notifications</Text>
          
          <TouchableOpacity 
            onPress={handleMarkAllRead}
            className="p-2 -mr-2"
            disabled={unreadCount === 0}
          >
            <Text className={`text-sm ${unreadCount > 0 ? 'text-purple-500' : 'text-zinc-600'}`}>
              Mark all read
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row px-4 py-2 border-b border-zinc-800">
          {(['all', 'social', 'tasks', 'system'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              className={`flex-1 py-2 items-center rounded-lg mx-1 ${
                filter === f ? 'bg-purple-600' : ''
              }`}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(f);
              }}
            >
              <Text className={`text-sm capitalize ${
                filter === f ? 'text-white font-medium' : 'text-zinc-500'
              }`}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#a855f7" />
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
                tintColor="#a855f7"
              />
            }
          />
        )}

        {/* Hint */}
        <View className="px-5 py-3 border-t border-zinc-800">
          <Text className="text-zinc-600 text-xs text-center">
            Long press a notification to delete it
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
