import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

interface CircleHomeScreenProps {
  navigation?: any;
}

interface Member {
  id: string;
  initial: string;
  name: string;
  posted: boolean;
  role?: 'admin' | 'member';
}

interface Post {
  id: number;
  type: 'receipt' | 'system';
  user?: { initial: string; name: string };
  time?: string;
  missions?: { completed: number; total: number };
  wallet?: string;
  streak?: number;
  systemText?: string;
  reactions?: { heart: number; fire: number; clap: number };
}

export function CircleHomeScreen({ navigation }: CircleHomeScreenProps) {
  const circleName = "Morning Warriors";
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges' | 'members'>('feed');
  const [showShareModal, setShowShareModal] = useState(false);
  
  const members: Member[] = [
    { id: 'a', initial: 'A', name: 'Alex', posted: true, role: 'admin' },
    { id: 'b', initial: 'B', name: 'Blake', posted: true, role: 'member' },
    { id: 'c', initial: 'C', name: 'Charlie', posted: false, role: 'member' },
    { id: 'd', initial: 'D', name: 'Dana', posted: true, role: 'member' },
  ];

  const posts: Post[] = [
    {
      id: 1,
      type: 'system',
      systemText: 'Dana completed: Take bins out',
      time: '1h ago',
    },
    {
      id: 2,
      type: 'receipt',
      user: { initial: 'A', name: 'Alex' },
      time: '2h ago',
      missions: { completed: 4, total: 5 },
      wallet: '+26m',
      streak: 6,
      reactions: { heart: 3, fire: 2, clap: 1 },
    },
    {
      id: 3,
      type: 'receipt',
      user: { initial: 'B', name: 'Blake' },
      time: '4h ago',
      missions: { completed: 5, total: 5 },
      wallet: '+32m',
      streak: 12,
      reactions: { heart: 5, fire: 4, clap: 2 },
    },
  ];

  const postedCount = members.filter(m => m.posted).length;
  const totalCount = members.length + 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#475569" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{circleName}</Text>
          <Text style={styles.headerSubtitle}>{postedCount}/{totalCount} posted today</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#475569" />
        </TouchableOpacity>
      </View>

      <View style={styles.membersRow}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberInitial}>Y</Text>
          <View style={styles.memberStatusEmpty} />
        </View>
        {members.map(member => (
          <View key={member.id} style={styles.memberAvatar}>
            <Text style={styles.memberInitial}>{member.initial}</Text>
            {member.posted && <View style={styles.memberStatusPosted} />}
            {!member.posted && <View style={styles.memberStatusEmpty} />}
          </View>
        ))}
        <TouchableOpacity style={styles.addMemberButton}>
          <Ionicons name="add" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {['feed', 'challenges', 'members'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab as typeof activeTab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>
        {activeTab === 'feed' && (
          <>
            <TouchableOpacity style={styles.shareCard} onPress={() => setShowShareModal(true)}>
              <View style={styles.shareIcon}>
                <Ionicons name="add" size={24} color="#8B5CF6" />
              </View>
              <View style={styles.shareContent}>
                <Text style={styles.shareTitle}>Share your progress</Text>
                <Text style={styles.shareDesc}>Post your daily life card to the circle</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            {posts.map(post => (
              <View key={post.id} style={styles.postCard}>
                {post.type === 'system' ? (
                  <View style={styles.systemPost}>
                    <View style={styles.systemIcon}>
                      <Ionicons name="checkmark" size={16} color="#10B981" />
                    </View>
                    <Text style={styles.systemText}>{post.systemText}</Text>
                    <Text style={styles.postTime}>{post.time}</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.postHeader}>
                      <View style={styles.postAvatar}>
                        <Text style={styles.postAvatarText}>{post.user?.initial}</Text>
                      </View>
                      <View style={styles.postHeaderContent}>
                        <Text style={styles.postUserName}>{post.user?.name}'s Daily Card</Text>
                        <Text style={styles.postTime}>{post.time}</Text>
                      </View>
                    </View>
                    <View style={styles.postStats}>
                      <View style={styles.postStat}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.postStatText}>{post.missions?.completed}/{post.missions?.total} missions</Text>
                      </View>
                      <View style={styles.postStat}>
                        <Ionicons name="wallet" size={16} color="#8B5CF6" />
                        <Text style={styles.postStatText}>{post.wallet}</Text>
                      </View>
                      <View style={styles.postStat}>
                        <MaterialCommunityIcons name="fire" size={16} color="#F97316" />
                        <Text style={styles.postStatText}>{post.streak} days</Text>
                      </View>
                    </View>
                    <View style={styles.postReactions}>
                      <TouchableOpacity style={styles.reactionButton}>
                        <Ionicons name="heart" size={18} color="#EC4899" />
                        <Text style={styles.reactionCount}>{post.reactions?.heart}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.reactionButton}>
                        <MaterialCommunityIcons name="fire" size={18} color="#F97316" />
                        <Text style={styles.reactionCount}>{post.reactions?.fire}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.reactionButton}>
                        <Ionicons name="thumbs-up" size={18} color="#3B82F6" />
                        <Text style={styles.reactionCount}>{post.reactions?.clap}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            ))}
          </>
        )}

        {activeTab === 'challenges' && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No active challenges</Text>
            <Text style={styles.emptyDesc}>Start a challenge to compete with your circle</Text>
            <TouchableOpacity style={styles.emptyButton}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Create Challenge</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'members' && (
          <View style={styles.membersList}>
            <View style={styles.memberItem}>
              <View style={[styles.memberItemAvatar, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.memberItemInitial}>Y</Text>
              </View>
              <View style={styles.memberItemContent}>
                <Text style={styles.memberItemName}>You</Text>
                <Text style={styles.memberItemRole}>Admin</Text>
              </View>
              <View style={styles.memberItemBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
              </View>
            </View>
            {members.map(member => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberItemAvatar}>
                  <Text style={styles.memberItemInitial}>{member.initial}</Text>
                </View>
                <View style={styles.memberItemContent}>
                  <Text style={styles.memberItemName}>{member.name}</Text>
                  <Text style={styles.memberItemRole}>{member.role === 'admin' ? 'Admin' : 'Member'}</Text>
                </View>
                {member.posted && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
              </View>
            ))}
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showShareModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Share to Circle</Text>
            <Text style={styles.modalDesc}>Choose what to share from your daily progress</Text>
            
            <View style={styles.shareOptions}>
              <TouchableOpacity style={styles.shareOption}>
                <View style={styles.shareOptionCheck}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.shareOptionLabel}>Mission stats</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareOption}>
                <View style={styles.shareOptionCheck}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.shareOptionLabel}>Time wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareOption}>
                <View style={styles.shareOptionCheck}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.shareOptionLabel}>Streak</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowShareModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={() => setShowShareModal(false)}>
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  memberStatusPosted: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  memberStatusEmpty: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  addMemberButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  feed: {
    flex: 1,
    paddingHorizontal: 20,
  },
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E9D5FF',
    borderStyle: 'dashed',
  },
  shareIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shareContent: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  shareDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  systemPost: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  systemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  systemText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },
  postTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  postAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postHeaderContent: {
    flex: 1,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postStatText: {
    fontSize: 13,
    color: '#475569',
  },
  postReactions: {
    flexDirection: 'row',
    gap: 12,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  reactionCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 24,
    marginTop: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  membersList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  memberItemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberItemInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberItemContent: {
    flex: 1,
  },
  memberItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  memberItemRole: {
    fontSize: 12,
    color: '#64748B',
  },
  memberItemBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  shareOptions: {
    gap: 12,
    marginBottom: 24,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  shareOptionCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareOptionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  shareButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
