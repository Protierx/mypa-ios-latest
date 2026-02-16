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
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius } from '../../styles/theme';

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
  calm: { emoji: '🟢', color: semantic.success },
  happy: { emoji: '🟢', color: semantic.success },
  focused: { emoji: '🔵', color: semantic.info },
  productive: { emoji: '🔵', color: semantic.info },
  excited: { emoji: '🔵', color: semantic.info },
  stressed: { emoji: '🟡', color: semantic.warning },
  anxious: { emoji: '🟡', color: semantic.warning },
  overwhelmed: { emoji: '🟡', color: semantic.warning },
  tired: { emoji: '🟠', color: '#F97316' },
  frustrated: { emoji: '🔴', color: semantic.error },
  sad: { emoji: '🔴', color: semantic.error },
};

function getMoodInfo(mood: string | null): { emoji: string; color: string } {
  if (!mood) return { emoji: '⚪', color: textTokens.tertiary };
  return MOOD_MAP[mood.toLowerCase()] || { emoji: '⚪', color: textTokens.tertiary };
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
    <View style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Delete background */}
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 96, alignItems: 'center', justifyContent: 'center', backgroundColor: semantic.error, borderRadius: radius.lg }}>
        <Ionicons name="trash-outline" size={22} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 11, marginTop: 4 }}>Delete</Text>
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
        style={{ backgroundColor: bg.card, borderRadius: radius.lg, marginHorizontal: 16, marginBottom: 8, borderWidth: 0.5, borderColor: borderTokens.primary, ...shadows.sm }}
        activeOpacity={0.7}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded(!expanded);
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          {/* Top row: mood + summary */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 18, marginRight: 8, marginTop: 2 }}>{moodInfo.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: textTokens.primary, fontSize: 15, lineHeight: 20, fontWeight: '500' }}
                numberOfLines={expanded ? undefined : 2}
              >
                {item.summary}
              </Text>
            </View>
          </View>

          {/* Bottom row: meta */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 28 }}>
            {actionCount > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                <Ionicons name="flash-outline" size={13} color={brand.primary} />
                <Text style={{ color: textTokens.tertiary, fontSize: 11, marginLeft: 4 }}>
                  {actionCount} action{actionCount !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {item.mood && (
              <Text style={{ color: textTokens.tertiary, fontSize: 11, marginRight: 12 }}>{item.mood}</Text>
            )}
            <Text style={{ color: textTokens.disabled, fontSize: 11, marginLeft: 'auto' }}>
              {formatTimestamp(item.created_at)}
            </Text>
          </View>

          {/* Expanded details */}
          {expanded && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: borderTokens.primary }}>
              {/* Key decisions */}
              {decisions.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: textTokens.secondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>
                    Key Decisions
                  </Text>
                  {decisions.map((decision, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginLeft: 4, marginBottom: 4 }}>
                      <Text style={{ color: textTokens.tertiary, fontSize: 13, marginRight: 8 }}>•</Text>
                      <Text style={{ color: textTokens.secondary, fontSize: 13, flex: 1 }}>
                        {typeof decision === 'string' ? decision : JSON.stringify(decision)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action items */}
              {actionCount > 0 && (
                <View>
                  <Text style={{ color: textTokens.secondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 }}>
                    Actions Taken
                  </Text>
                  {item.action_items.map((action, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4, marginBottom: 4 }}>
                      <Ionicons name="checkmark-circle" size={14} color={semantic.success} />
                      <Text style={{ color: textTokens.secondary, fontSize: 13, marginLeft: 8 }}>
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
      <SafeAreaView style={{ flex: 1, backgroundColor: bg.primary }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, marginLeft: -8 }}>
            <Ionicons name="arrow-back" size={24} color={textTokens.primary} />
          </TouchableOpacity>
          <Text style={{ color: textTokens.primary, fontSize: 17, fontWeight: '600' }}>Conversations</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={brand.primary} />
            <Text style={{ color: textTokens.tertiary, marginTop: 12 }}>Loading conversations...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <Ionicons name="chatbubbles-outline" size={48} color={textTokens.disabled} />
            <Text style={{ color: textTokens.secondary, fontSize: 15, textAlign: 'center', marginTop: 16 }}>
              No conversations yet
            </Text>
            <Text style={{ color: textTokens.tertiary, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
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
                <Text style={{ color: textTokens.tertiary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
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
