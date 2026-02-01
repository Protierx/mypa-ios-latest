import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Pressable,
  Animated,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { ChallengesScreenProps, ChallengeMember } from './types';
import { styles } from './styles';
import { categoryColors, dayOptions, xpOptions, categoryList } from './constants';
import { categoryToEmoji, getMemberColor } from './utils';
import {
  ChallengesHeader,
  StatsBanner,
  TabBar,
  ChallengeCard,
  renderIcon,
} from './components';
import { useChallengesData, useChallengesActions } from './hooks';

export function ChallengesScreen({ navigation, route }: ChallengesScreenProps) {
  const focusChallengeId = route?.params?.focusChallengeId as string | undefined;
  
  const data = useChallengesData(focusChallengeId);
  const actions = useChallengesActions({
    activeChallenges: data.activeChallenges,
    setActiveChallenges: data.setActiveChallenges,
    availableChallenges: data.availableChallenges,
    setAvailableChallenges: data.setAvailableChallenges,
    joiningChallengeId: data.joiningChallengeId,
    setJoiningChallengeId: data.setJoiningChallengeId,
    fetchChallenges: data.fetchChallenges,
    showToast: data.showToast,
    newName: data.newName,
    newCategory: data.newCategory,
    newTarget: data.newTarget,
    newDays: data.newDays,
    newXp: data.newXp,
    selectedCircleId: data.selectedCircleId,
    userCircles: data.userCircles,
    editingChallenge: data.editingChallenge,
    setEditingChallenge: data.setEditingChallenge,
    setShowCreateModal: data.setShowCreateModal,
    setShowOptionsModal: data.setShowOptionsModal,
    resetCreateForm: data.resetCreateForm,
    setNewName: data.setNewName,
    setNewCategory: data.setNewCategory,
    setNewTarget: data.setNewTarget,
    setNewDays: data.setNewDays,
    setNewXp: data.setNewXp,
  });

  // Build leaderboard members for a challenge
  const getLeaderboardMembers = (challengeId: string): ChallengeMember[] => {
    const entries = data.challengeLeaderboards[challengeId] || [];
    return entries.map((p: any, idx: number) => ({
      id: p.user?.id,
      name: p.user?.name || p.user?.username || 'User',
      initial: (p.user?.name || p.user?.username || 'U')[0]?.toUpperCase(),
      color: getMemberColor(idx),
      streak: p.progress || 0,
      rank: p.rank || idx + 1,
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Toast */}
      {data.toast && (
        <Animated.View
          style={[
            styles.toast,
            data.toast.type === 'success' ? styles.toastSuccess : styles.toastInfo,
            {
              opacity: data.toastAnim,
              transform: [
                {
                  translateY: data.toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.toastText}>{data.toast.message}</Text>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={data.refreshing} onRefresh={data.onRefresh} tintColor="#8B5CF6" />
        }
      >
        {/* Header */}
        <ChallengesHeader
          onBack={() => navigation.goBack()}
          onAdd={() => data.setShowCreateModal(true)}
        />

        {/* Stats Banner */}
        <StatsBanner userStats={data.userStats} />

        {/* Tab Navigation */}
        <TabBar activeTab={data.activeTab} onTabChange={data.setActiveTab} />

        <View style={styles.content}>
          {/* Active Challenges Tab */}
          {data.activeTab === 'active' && (
            <View style={styles.challengesList}>
              {/* Loading state */}
              {data.loading && (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text style={{ marginTop: 12, color: '#64748B' }}>Loading challenges...</Text>
                </View>
              )}

              {/* Available challenges to join */}
              {!data.loading && data.availableChallenges.length > 0 && (
                <View style={styles.inviteCard}>
                  <View style={styles.inviteHeader}>
                    <Ionicons name="flash" size={16} color="#D97706" />
                    <Text style={styles.inviteHeaderText}>Join a Challenge</Text>
                  </View>
                  {data.availableChallenges.slice(0, 3).map((challenge) => (
                    <View key={challenge.id} style={styles.inviteContent}>
                      <View style={styles.inviteIconContainer}>
                        <Text style={{ fontSize: 24 }}>{challenge.emoji}</Text>
                      </View>
                      <View style={styles.inviteInfo}>
                        <Text style={styles.inviteName}>{challenge.title}</Text>
                        <Text style={styles.inviteDetails}>
                          {challenge.participantCount} participants • +{challenge.xpReward} XP
                        </Text>
                      </View>
                      <View style={styles.inviteActions}>
                        <TouchableOpacity
                          style={[styles.joinButton, data.joiningChallengeId === challenge.id && { opacity: 0.5 }]}
                          onPress={() => actions.handleJoinChallenge(challenge.id)}
                          disabled={data.joiningChallengeId === challenge.id}
                        >
                          <Text style={styles.joinButtonText}>
                            {data.joiningChallengeId === challenge.id ? 'Joining...' : 'Join'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Empty state */}
              {!data.loading && data.activeChallenges.length === 0 && (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Ionicons name="trophy-outline" size={48} color="#CBD5E1" />
                  <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: '#475569' }}>
                    No active challenges
                  </Text>
                  <Text style={{ marginTop: 4, color: '#94A3B8', textAlign: 'center' }}>
                    Create a challenge or join one above to get started!
                  </Text>
                  <TouchableOpacity
                    style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#0F172A', borderRadius: 12 }}
                    onPress={() => data.setShowCreateModal(true)}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Create Challenge</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Challenge cards */}
              {!data.loading &&
                data.activeChallenges.map((challenge) => {
                  const leaderboardMembers = getLeaderboardMembers(challenge.id);

                  return (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      isExpanded={data.expandedChallenge === challenge.id}
                      leaderboardMembers={leaderboardMembers}
                      onPress={() => {
                        const next = data.expandedChallenge === challenge.id ? null : challenge.id;
                        data.setExpandedChallenge(next);
                        if (next && !data.challengeLeaderboards[challenge.id]) {
                          data.fetchChallengeLeaderboard(challenge.id);
                        }
                      }}
                      onLongPress={() => {
                        data.setSelectedChallengeForOptions(challenge);
                        data.setShowOptionsModal(true);
                      }}
                      onOptionsPress={() => {
                        data.setSelectedChallengeForOptions(challenge);
                        data.setShowOptionsModal(true);
                      }}
                      onSubmitProof={() => actions.handleSubmitProof(challenge.id)}
                    />
                  );
                })}
            </View>
          )}

          {/* Leaderboard Tab */}
          {data.activeTab === 'leaderboard' && (
            <View style={styles.leaderboardTab}>
              <View style={styles.timeframeSelector}>
                {(['week', 'month', 'all'] as const).map((tf) => (
                  <TouchableOpacity
                    key={tf}
                    style={[styles.timeframeButton, data.selectedTimeframe === tf && styles.timeframeButtonActive]}
                    onPress={() => data.setSelectedTimeframe(tf)}
                  >
                    <Text style={[styles.timeframeButtonText, data.selectedTimeframe === tf && styles.timeframeButtonTextActive]}>
                      {tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'All Time'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {data.leaderboard.length < 3 ? (
                <View style={{ padding: 40, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16 }}>
                  <Ionicons name="trophy-outline" size={48} color="#CBD5E1" />
                  <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: '#475569' }}>
                    Not enough players yet
                  </Text>
                  <Text style={{ marginTop: 4, color: '#94A3B8', textAlign: 'center' }}>
                    Complete challenges to climb the leaderboard!
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.podiumCard}>
                    <View style={styles.podium}>
                      {/* 2nd Place */}
                      <View style={styles.podiumPosition}>
                        <View style={[styles.podiumAvatar, styles.podiumAvatar2]}>
                          <Text style={styles.podiumAvatarText}>{data.leaderboard[1].initial}</Text>
                        </View>
                        <MaterialCommunityIcons name="medal" size={24} color="#94A3B8" />
                        <Text style={styles.podiumName}>{data.leaderboard[1].name}</Text>
                        <Text style={styles.podiumXP}>{data.leaderboard[1].xp} XP</Text>
                        <View style={[styles.podiumStand, styles.podiumStand2]}>
                          <Text style={styles.podiumNumber}>2</Text>
                        </View>
                      </View>
                      {/* 1st Place */}
                      <View style={[styles.podiumPosition, styles.podiumPosition1]}>
                        <View style={[styles.podiumAvatar, styles.podiumAvatar1]}>
                          <Text style={styles.podiumAvatarText1}>{data.leaderboard[0].initial}</Text>
                        </View>
                        <MaterialCommunityIcons name="crown" size={28} color="#F59E0B" />
                        <Text style={styles.podiumName1}>{data.leaderboard[0].name}</Text>
                        <Text style={styles.podiumXP1}>{data.leaderboard[0].xp} XP</Text>
                        <View style={[styles.podiumStand, styles.podiumStand1]}>
                          <Text style={styles.podiumNumber1}>1</Text>
                        </View>
                      </View>
                      {/* 3rd Place */}
                      <View style={styles.podiumPosition}>
                        <View style={[styles.podiumAvatar, styles.podiumAvatar3, data.leaderboard[2].isYou && styles.podiumAvatarYou]}>
                          <Text style={styles.podiumAvatarText}>{data.leaderboard[2].initial}</Text>
                        </View>
                        <MaterialCommunityIcons name="medal" size={24} color="#D97706" />
                        <Text style={[styles.podiumName, data.leaderboard[2].isYou && styles.podiumNameYou]}>{data.leaderboard[2].name}</Text>
                        <Text style={styles.podiumXP}>{data.leaderboard[2].xp} XP</Text>
                        <View style={[styles.podiumStand, styles.podiumStand3, data.leaderboard[2].isYou && styles.podiumStandYou]}>
                          <Text style={[styles.podiumNumber, data.leaderboard[2].isYou && styles.podiumNumberYou]}>3</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.fullLeaderboard}>
                    {data.leaderboard.slice(3).map((player) => (
                      <View key={player.rank} style={[styles.leaderboardItem, player.isYou && styles.leaderboardItemYou]}>
                        <View style={styles.leaderboardItemLeft}>
                          <Text style={styles.leaderboardItemRank}>#{player.rank}</Text>
                          <View style={[styles.leaderboardItemAvatar, player.isYou && styles.leaderboardItemAvatarYou]}>
                            <Text style={styles.leaderboardItemAvatarText}>{player.initial}</Text>
                          </View>
                          <View>
                            <Text style={[styles.leaderboardItemName, player.isYou && styles.leaderboardItemNameYou]}>{player.name}</Text>
                            <View style={styles.leaderboardItemMeta}>
                              <Text style={styles.leaderboardItemXP}>{player.xp} XP</Text>
                              <Text style={styles.leaderboardItemDot}>•</Text>
                              <Text style={styles.leaderboardItemStreak}>{player.streak}🔥</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.leaderboardItemRight}>
                          {player.movement === 'up' && <Ionicons name="trending-up" size={16} color="#10B981" />}
                          {player.movement === 'down' && <Ionicons name="trending-down" size={16} color="#F43F5E" />}
                          <Text style={styles.leaderboardItemWins}>{player.wins} wins</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Achievements Tab */}
          {data.activeTab === 'achievements' && (
            <View style={styles.achievementsTab}>
              <View style={styles.achievementStats}>
                <View style={styles.achievementStat}>
                  <Text style={[styles.achievementStatValue, { color: '#10B981' }]}>
                    {data.achievements.filter((a) => a.unlocked).length}
                  </Text>
                  <Text style={styles.achievementStatLabel}>Unlocked</Text>
                </View>
                <View style={styles.achievementStat}>
                  <Text style={[styles.achievementStatValue, { color: '#94A3B8' }]}>
                    {data.achievements.filter((a) => !a.unlocked).length}
                  </Text>
                  <Text style={styles.achievementStatLabel}>Locked</Text>
                </View>
                <View style={styles.achievementStat}>
                  <Text style={[styles.achievementStatValue, { color: '#8B5CF6' }]}>
                    {data.achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xp, 0)}
                  </Text>
                  <Text style={styles.achievementStatLabel}>XP Earned</Text>
                </View>
              </View>

              {data.achievements.map((achievement) => (
                <View key={achievement.id} style={[styles.achievementCard, !achievement.unlocked && styles.achievementCardLocked]}>
                  <View style={[styles.achievementIcon, achievement.unlocked ? styles.achievementIconUnlocked : styles.achievementIconLocked]}>
                    {achievement.unlocked ? (
                      renderIcon(achievement.iconName, 28, achievement.color)
                    ) : (
                      <Ionicons name="lock-closed" size={24} color="#94A3B8" />
                    )}
                  </View>
                  <View style={styles.achievementInfo}>
                    <View style={styles.achievementTitleRow}>
                      <Text style={[styles.achievementName, !achievement.unlocked && styles.achievementNameLocked]}>
                        {achievement.name}
                      </Text>
                      {achievement.unlocked && <Ionicons name="checkmark-circle" size={16} color="#10B981" />}
                    </View>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <View style={styles.achievementProgress}>
                        <View style={styles.achievementProgressLabels}>
                          <Text style={styles.achievementProgressText}>
                            {achievement.progress}/{achievement.total}
                          </Text>
                          <Text style={styles.achievementProgressText}>
                            {Math.round((achievement.progress / (achievement.total || 1)) * 100)}%
                          </Text>
                        </View>
                        <View style={styles.achievementProgressBar}>
                          <View
                            style={[
                              styles.achievementProgressFill,
                              { width: `${(achievement.progress / (achievement.total || 1)) * 100}%` },
                            ]}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                  <View style={[styles.achievementXP, achievement.unlocked ? styles.achievementXPUnlocked : styles.achievementXPLocked]}>
                    <Text style={[styles.achievementXPText, achievement.unlocked ? styles.achievementXPTextUnlocked : styles.achievementXPTextLocked]}>
                      +{achievement.xp} XP
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={data.showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          data.setShowCreateModal(false);
          data.setEditingChallenge(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              data.setShowCreateModal(false);
              data.setEditingChallenge(null);
            }}
          />
          <ScrollView
            style={{ width: '100%', maxHeight: '85%' }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{data.editingChallenge ? 'Edit Challenge' : 'Create Challenge'}</Text>

              {/* Challenge Name */}
              <TextInput
                placeholder="Challenge name"
                placeholderTextColor="#94A3B8"
                value={data.newName}
                onChangeText={data.setNewName}
                style={styles.modalInput}
              />

              {/* Category Selection */}
              <Text style={styles.modalLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <View style={styles.choiceRow}>
                  {categoryList.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.choiceChip, data.newCategory === cat && styles.choiceChipActive]}
                      onPress={() => data.setNewCategory(cat)}
                    >
                      <Text style={styles.categoryEmoji}>{categoryToEmoji(cat)}</Text>
                      <Text style={[styles.choiceText, data.newCategory === cat && styles.choiceTextActive]}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Target */}
              <Text style={styles.modalLabel}>Target</Text>
              <TextInput
                placeholder="10"
                placeholderTextColor="#94A3B8"
                value={data.newTarget}
                onChangeText={data.setNewTarget}
                style={styles.modalInput}
                keyboardType="number-pad"
              />

              {/* Duration Selection */}
              <Text style={styles.modalLabel}>Duration</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <View style={styles.choiceRow}>
                  {dayOptions.map((days) => (
                    <TouchableOpacity
                      key={days}
                      style={[styles.numChip, data.newDays === days && styles.numChipActive]}
                      onPress={() => data.setNewDays(days)}
                    >
                      <Text style={[styles.numChipValue, data.newDays === days && styles.numChipValueActive]}>{days}</Text>
                      <Text style={[styles.numChipLabel, data.newDays === days && styles.numChipLabelActive]}>days</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* XP Reward Selection */}
              <Text style={styles.modalLabel}>XP Reward</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <View style={styles.choiceRow}>
                  {xpOptions.map((xp) => (
                    <TouchableOpacity
                      key={xp}
                      style={[styles.numChip, styles.xpChip, data.newXp === xp && styles.xpChipActive]}
                      onPress={() => data.setNewXp(xp)}
                    >
                      <Text style={[styles.numChipValue, data.newXp === xp && styles.xpChipValueActive]}>{xp}</Text>
                      <Text style={[styles.numChipLabel, data.newXp === xp && styles.xpChipLabelActive]}>XP</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Circle Selection */}
              {data.userCircles.length > 0 && (
                <>
                  <Text style={styles.modalLabel}>Share with Circle</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    <TouchableOpacity
                      style={[styles.circleChip, !data.selectedCircleId && styles.circleChipActive]}
                      onPress={() => data.setSelectedCircleId(null)}
                    >
                      <Text style={[styles.circleChipText, !data.selectedCircleId && styles.circleChipTextActive]}>🔒 Just Me</Text>
                    </TouchableOpacity>
                    {data.userCircles.map((circle) => (
                      <TouchableOpacity
                        key={circle.id}
                        style={[styles.circleChip, data.selectedCircleId === circle.id && styles.circleChipActive]}
                        onPress={() => data.setSelectedCircleId(circle.id)}
                      >
                        <Text style={styles.circleEmoji}>{circle.emoji || '👥'}</Text>
                        <Text style={[styles.circleChipText, data.selectedCircleId === circle.id && styles.circleChipTextActive]}>
                          {circle.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => {
                    data.setShowCreateModal(false);
                    data.setEditingChallenge(null);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={actions.handleCreateChallenge}>
                  <Text style={styles.modalSaveText}>{data.editingChallenge ? 'Save' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* Options Modal */}
      <Modal visible={data.showOptionsModal} animationType="fade" transparent onRequestClose={() => data.setShowOptionsModal(false)}>
        <View style={styles.optionsOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => data.setShowOptionsModal(false)} />
          <View style={styles.optionsSheet}>
            <View style={styles.optionsHandle} />
            {data.selectedChallengeForOptions && (
              <>
                <Text style={styles.optionsTitle}>{data.selectedChallengeForOptions.name}</Text>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => actions.handleEditChallenge(data.selectedChallengeForOptions!)}
                >
                  <Feather name="edit-2" size={20} color="#0F172A" />
                  <Text style={styles.optionText}>Edit Challenge</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionItem, styles.optionItemWarning]}
                  onPress={() => {
                    data.setShowOptionsModal(false);
                    actions.handleLeaveChallenge(data.selectedChallengeForOptions!.id);
                  }}
                >
                  <Feather name="log-out" size={20} color="#F97316" />
                  <Text style={[styles.optionText, { color: '#F97316' }]}>Leave Challenge</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionItem, styles.optionItemDanger]}
                  onPress={() => {
                    data.setShowOptionsModal(false);
                    actions.handleDeleteChallenge(data.selectedChallengeForOptions!.id);
                  }}
                >
                  <Feather name="trash-2" size={20} color="#EF4444" />
                  <Text style={[styles.optionText, { color: '#EF4444' }]}>Delete Challenge</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default ChallengesScreen;
