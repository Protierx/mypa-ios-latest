/**
 * PostCard Component
 * Displays a single post in the circle feed
 */
import React from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors as Colors } from '../../../../styles/colors';
import { challengesApi } from '../../../../services/api';

interface PostCardProps {
  post: any;
  isSelected: boolean;
  postSelectionMode: boolean;
  circleMembers: any[];
  onPress: (post: any) => void;
  onLongPress: (post: any) => void;
  onToggleSelection: (id: string | number) => void;
  onReaction: (postId: string, reactionType: 'heart' | 'fire' | 'clap') => void;
  onChallengeJoin: () => void;
}

export function PostCard({
  post,
  isSelected,
  postSelectionMode,
  circleMembers,
  onPress,
  onLongPress,
  onToggleSelection,
  onReaction,
  onChallengeJoin,
}: PostCardProps) {
  const extractChallengeCategory = (description?: string) => {
    if (!description) return null;
    const match = description.match(/Category:\s*([^|\n]+)/i);
    return match?.[1]?.trim() || null;
  };

  // Handle challenge post type
  if (post.type === 'challenge') {
    let challengeData;
    try {
      challengeData = typeof post.content === 'string' ? JSON.parse(post.content) : post.content;
    } catch (e) {
      return null;
    }
    const postCategory = challengeData?.category || extractChallengeCategory(challengeData?.description);

    return (
      <Pressable 
        onPress={() => {
          Alert.alert(
            `${challengeData.emoji} ${challengeData.title}`,
            `Target: ${challengeData.targetValue} ${
              challengeData.type === 'FOCUS_MINUTES' ? 'minutes' :
              challengeData.type === 'TASKS_COMPLETED' ? 'tasks' : 'days'
            }\nReward: ${challengeData.xpReward} XP${postCategory ? `\nCategory: ${postCategory}` : ''}`,
            [
              { text: 'Later', style: 'cancel' },
              { 
                text: 'Join Challenge',
                onPress: async () => {
                  try {
                    const response = await challengesApi.join(challengeData.challengeId);
                    if (response.success) {
                      Alert.alert('Joined!', 'You\'ve joined the challenge!');
                      onChallengeJoin();
                    }
                  } catch (error) {
                    console.error('Failed to join:', error);
                  }
                }
              }
            ]
          );
        }}
        style={({ pressed }) => [
          styles.systemCard,
          pressed && styles.postCardPressed,
          { borderLeftWidth: 4, borderLeftColor: Colors.primary }
        ]}
      >
        <View style={styles.systemCardContent}>
          <View style={[styles.systemIconContainer, { backgroundColor: '#ede9fe' }]}>
            <Text style={{ fontSize: 24 }}>{challengeData.emoji}</Text>
          </View>
          <View style={styles.systemTextContainer}>
            <Text style={[styles.systemText, { fontWeight: '600' }]}>
              {post.author?.name || 'Someone'} created a challenge
            </Text>
            <Text style={[styles.systemText, { fontSize: 15, marginTop: 4 }]}>
              {challengeData.title}
            </Text>
            {postCategory && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{postCategory}</Text>
              </View>
            )}
            <View style={styles.challengeMetrics}>
              <Text style={styles.systemTime}>
                {challengeData.type === 'FOCUS_MINUTES' ? `🧠 ${challengeData.targetValue} min` :
                 challengeData.type === 'TASKS_COMPLETED' ? `✅ ${challengeData.targetValue} tasks` :
                 `🔥 ${challengeData.targetValue} day streak`}
              </Text>
              <Text style={[styles.systemTime, { color: Colors.success }]}>
                +{challengeData.xpReward} XP
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }
  
  // System post (assignments, etc.)
  if (post.type === 'system') {
    const iconColor = post.iconName === 'award' ? '#10B981' : 
                      post.iconName === 'check-circle' ? '#8B5CF6' :
                      post.iconName === 'user-plus' ? '#F59E0B' :
                      Colors.textSecondary;
    return (
      <Pressable 
        onPress={() => onPress(post)}
        onLongPress={() => onLongPress(post)}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.systemCard,
          pressed && styles.postCardPressed,
          isSelected && styles.selectedCard
        ]}
      >
        {postSelectionMode && (
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => onToggleSelection(post.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        )}
        <View style={styles.systemCardContent}>
          <View style={[styles.systemIconContainer, { backgroundColor: `${iconColor}20` }]}>
            <Feather name={post.iconName || "info"} size={20} color={iconColor} />
          </View>
          <View style={styles.systemTextContainer}>
            <View style={styles.systemTextRow}>
              <Text style={styles.systemText}>{post.systemText}</Text>
              {post.isEdited && (
                <View style={styles.editedBadge}>
                  <Feather name="edit-2" size={10} color="#64748B" />
                  <Text style={styles.editedBadgeText}>Edited</Text>
                </View>
              )}
            </View>
            <Text style={styles.systemTime}>{post.dueTime}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // Regular post (daily card)
  return (
    <Pressable 
      onPress={() => onPress(post)}
      onLongPress={() => onLongPress(post)}
      delayLongPress={400}
      style={({ pressed }) => [
        styles.postCard,
        pressed && styles.postCardPressed,
        isSelected && styles.selectedCard
      ]}
    >
      {postSelectionMode && (
        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => onToggleSelection(post.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>
      )}
      
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.postUserInfo}>
          <LinearGradient colors={['#a78bfa', '#7c3aed']} style={styles.avatar}>
            <Text style={styles.avatarText}>{post.user.initial}</Text>
          </LinearGradient>
          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{post.user.name}</Text>
              {circleMembers.find(m => m.name === post.user.name)?.role === 'admin' && (
                <View style={styles.adminBadgeSmall}>
                  <Text style={styles.adminBadgeSmallText}>Admin</Text>
                </View>
              )}
              {post.isEdited && (
                <View style={styles.editedBadge}>
                  <Feather name="edit-2" size={10} color="#64748B" />
                  <Text style={styles.editedBadgeText}>Edited</Text>
                </View>
              )}
            </View>
            <Text style={styles.postTime}>{post.time}</Text>
          </View>
        </View>
      </View>

      {/* Note */}
      {post.note && (
        <View style={styles.postNoteContainer}>
          <Text style={styles.postNoteText}>{post.note}</Text>
        </View>
      )}

      {/* Stats */}
      {post.missions && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Missions</Text>
            <Text style={styles.statValue}>{post.missions.completed}/{post.missions.total}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Time Saved</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>{post.wallet || '-'}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="fire" size={16} color={Colors.orange} />
            <Text style={[styles.statValue, { color: Colors.orange }]}>{post.streak || 0}</Text>
          </View>
        </View>
      )}

      {/* Reactions */}
      {post.reactions && (
        <View style={styles.reactionsContainer}>
          <TouchableOpacity 
            style={[styles.reactionButton, post.userReaction === '❤️' && styles.reactionButtonActive]}
            onPress={() => onReaction(post.id, 'heart')}
          >
            <Feather name="heart" size={16} color={post.userReaction === '❤️' ? '#EF4444' : Colors.textMuted} />
            <Text style={styles.reactionCount}>{post.reactions.heart || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.reactionButton, post.userReaction === '🔥' && styles.reactionButtonActive]}
            onPress={() => onReaction(post.id, 'fire')}
          >
            <MaterialCommunityIcons name="fire" size={16} color={post.userReaction === '🔥' ? Colors.orange : Colors.textMuted} />
            <Text style={styles.reactionCount}>{post.reactions.fire || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.reactionButton, post.userReaction === '👏' && styles.reactionButtonActive]}
            onPress={() => onReaction(post.id, 'clap')}
          >
            <Text style={styles.clapEmoji}>👏</Text>
            <Text style={styles.reactionCount}>{post.reactions.clap || 0}</Text>
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  systemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  postCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#F3F4F6',
  },
  postHeader: {
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  postTime: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  adminBadgeSmall: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeSmallText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  editedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editedBadgeText: {
    fontSize: 10,
    color: '#64748B',
  },
  postNoteContainer: {
    marginBottom: 12,
  },
  postNoteText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  reactionButtonActive: {
    backgroundColor: '#FEF2F2',
  },
  reactionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  clapEmoji: {
    fontSize: 16,
  },
  systemCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  systemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  systemTextContainer: {
    flex: 1,
  },
  systemTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  systemText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    flex: 1,
  },
  systemTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  challengeMetrics: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  checkboxRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
