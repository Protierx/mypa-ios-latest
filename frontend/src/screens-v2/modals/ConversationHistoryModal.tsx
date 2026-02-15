/**
 * Conversation History Modal — Voice Polish Step 6
 *
 * Displays past AI voice conversations from the conversation_history table.
 * Grouped by date, with summary, mood emoji, action count, and timestamps.
 * Tap to expand details, swipe to delete.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  Animated as RNAnimated,
  PanResponder,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { supabase } from '../../lib/supabase';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

// ============================================================================
// Types
// ============================================================================

interface ConversationRecord {
  id: string;
  user_id: string;
  conversation_id: string;
  summary: string;
  key_decisions: string[];
  action_items: Array<{ tool: string; [key: string]: unknown }>;
  mood: string | null;
  created_at: string;
}

interface ConversationHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

const MOOD_MAP: Record<string, { emoji: string; color: string }> = {
  calm: { emoji: '🟢', color: '#22c55e' },
  happy: { emoji: '🟢', color: '#22c55e' },
  focused: { emoji: '🔵', color: '#3b82f6' },
  productive: { emoji: '🔵', color: '#3b82f6' },
  excited: { emoji: '🔵', color: '#3b82f6' },
  stressed: { emoji: '🟡', color: '#eab308' },
  anxious: { emoji: '🟡', color: '#eab308' },
  overwhelmed: { emoji: '🟡', color: '#eab308' },
  tired: { emoji: '🟠', color: '#f97316' },
  frustrated: { emoji: '🔴', color: '#ef4444' },
  sad: { emoji: '🔴', color: '#ef4444' },
};

function getMoodInfo(mood: string | null): { emoji: string; color: string } {
  if (!mood) return { emoji: '⚪', color: '#71717a' };
  return MOOD_MAP[mood.toLowerCase()] || { emoji: '⚪', color: '#71717a' };
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today — show time
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '📅 Today';
  if (diffDays === 1) return '📅 Yesterday';
  if (diffDays < 7) return '📅 This Week';
  if (diffDays < 30) return '📅 This Month';
  return `📅 ${date.toLocaleDateString([], { month: 'long', year: 'numeric' })}`;
}

// ============================================================================
// Swipeable Row
// ============================================================================

function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const DELETE_THRESHOLD = -80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < DELETE_THRESHOLD) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert('Delete Conversation', 'Remove this conversation from history?', [
            {
              text: 'Cancel',
              onPress: () => {
                RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
              },
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                onDelete();
              },
            },
          ]);
        } else {
          RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <View className="relative overflow-hidden">
      {/* Delete background */}
      <View className="absolute right-0 top-0 bottom-0 w-24 items-center justify-center bg-red-600 rounded-xl">
        <Ionicons name="trash-outline" size={22} color="#fff" />
        <Text className="text-white text-xs mt-1">Delete</Text>
      </View>
      {/* Swipeable content */}
      <RNAnimated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </RNAnimated.View>
    </View>
  );
}

// ============================================================================
// Conversation Row
// ============================================================================

function ConversationRow({
  item,
  onDelete,
}: {
  item: ConversationRecord;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const moodInfo = getMoodInfo(item.mood);
  const actionCount = Array.isArray(item.action_items) ? item.action_items.length : 0;
  const decisions = Array.isArray(item.key_decisions) ? item.key_decisions : [];

  return (
    <SwipeableRow onDelete={() => onDelete(item.id)}>
      <TouchableOpacity
        className="bg-zinc-900/80 rounded-xl mx-4 mb-2 border border-zinc-800/50"
        activeOpacity={0.7}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded(!expanded);
        }}
      >
        <View className="px-4 py-3">
          {/* Top row: mood + summary */}
          <View className="flex-row items-start">
            <Text className="text-lg mr-2 mt-0.5">{moodInfo.emoji}</Text>
            <View className="flex-1">
              <Text
                className="text-white text-base leading-5"
                numberOfLines={expanded ? undefined : 2}
              >
                {item.summary}
              </Text>
            </View>
          </View>

          {/* Bottom row: meta */}
          <View className="flex-row items-center mt-2 ml-7">
            {actionCount > 0 && (
              <View className="flex-row items-center mr-3">
                <Ionicons name="flash-outline" size={13} color="#a855f7" />
                <Text className="text-zinc-500 text-xs ml-1">
                  {actionCount} action{actionCount !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {item.mood && (
              <Text className="text-zinc-500 text-xs mr-3">{item.mood}</Text>
            )}
            <Text className="text-zinc-600 text-xs ml-auto">
              {formatTimestamp(item.created_at)}
            </Text>
          </View>

          {/* Expanded details */}
          {expanded && (
            <View className="mt-3 pt-3 border-t border-zinc-800">
              {/* Key decisions */}
              {decisions.length > 0 && (
                <View className="mb-2">
                  <Text className="text-zinc-400 text-xs font-semibold uppercase mb-1">
                    Key Decisions
                  </Text>
                  {decisions.map((decision, i) => (
                    <View key={i} className="flex-row items-start ml-1 mb-1">
                      <Text className="text-zinc-500 text-sm mr-2">•</Text>
                      <Text className="text-zinc-300 text-sm flex-1">
                        {typeof decision === 'string' ? decision : JSON.stringify(decision)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action items */}
              {actionCount > 0 && (
                <View>
                  <Text className="text-zinc-400 text-xs font-semibold uppercase mb-1">
                    Actions Taken
                  </Text>
                  {item.action_items.map((action, i) => (
                    <View key={i} className="flex-row items-center ml-1 mb-1">
                      <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                      <Text className="text-zinc-300 text-sm ml-2">
                        {action.tool?.replace(/_/g, ' ') || 'action'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </SwipeableRow>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ConversationHistoryModal({ visible, onClose }: ConversationHistoryModalProps) {
  const { user } = useSupabaseAuth();
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[ConversationHistory] Fetch error:', error);
        return;
      }

      setConversations((data as ConversationRecord[]) || []);
    } catch (err) {
      console.error('[ConversationHistory] Error:', err);
    }
  }, [user?.id]);

  // Fetch on open
  useEffect(() => {
    if (visible && user?.id) {
      setLoading(true);
      fetchConversations().finally(() => setLoading(false));
    }
  }, [visible, user?.id, fetchConversations]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from('conversation_history')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('[ConversationHistory] Delete error:', error);
          Alert.alert('Error', 'Failed to delete conversation');
          return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setConversations((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        console.error('[ConversationHistory] Delete error:', err);
      }
    },
    []
  );

  // Group conversations by date
  const sections = conversations.reduce<Array<{ title: string; data: ConversationRecord[] }>>(
    (acc, item) => {
      const group = getDateGroup(item.created_at);
      const existing = acc.find((s) => s.title === group);
      if (existing) {
        existing.data.push(item);
      } else {
        acc.push({ title: group, data: [item] });
      }
      return acc;
    },
    []
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-zinc-800">
          <TouchableOpacity onPress={onClose} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Conversations</Text>
          <View className="w-10" />
        </View>

        {/* Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#a855f7" />
            <Text className="text-zinc-500 mt-3">Loading conversations...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="chatbubbles-outline" size={48} color="#3f3f46" />
            <Text className="text-zinc-500 text-base text-center mt-4">
              No conversations yet
            </Text>
            <Text className="text-zinc-600 text-sm text-center mt-1">
              Your voice conversations with MYPA will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={sections}
            keyExtractor={(section) => section.title}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={{ paddingBottom: 32 }}
            renderItem={({ item: section }) => (
              <View>
                {/* Section header */}
                <Text className="text-zinc-500 text-xs font-semibold uppercase px-5 pt-5 pb-2">
                  {section.title}
                </Text>
                {/* Conversation rows */}
                {section.data.map((convo) => (
                  <ConversationRow
                    key={convo.id}
                    item={convo}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
