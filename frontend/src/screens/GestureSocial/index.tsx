/**
 * GestureSocialView - Social screen accessed by swiping RIGHT from AI Home
 * 
 * From design spec:
 * - Header: "Social" + Mini AI Orb
 * - Sub-tabs: Circles / Challenges / Activity
 * - Circles Section: List of user's circles
 * - Challenges Section: Active challenges
 * - Activity Feed: Recent social updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AIOrb from '../../components/AIOrb';
import { structuredColors as colors } from '../../styles/colors';
import { theme } from '../../styles/theme';
import { api } from '../../services/api';

interface Circle {
  id: string;
  name: string;
  memberCount: number;
  imageUrl?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  participantCount: number;
  progress: number;
  endDate: string;
}

interface ActivityItem {
  id: string;
  type: 'task_completed' | 'challenge_joined' | 'streak_achieved' | 'level_up';
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
}

type TabType = 'circles' | 'challenges' | 'activity';

interface GestureSocialViewProps {
  onBack?: () => void;
}

export function GestureSocialView({ onBack }: GestureSocialViewProps) {
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<TabType>('circles');
  const [circles, setCircles] = useState<Circle[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [circlesRes, challengesRes] = await Promise.all([
        api.get('/circles'),
        api.get('/challenges'),
      ]);
      
      setCircles(circlesRes.data?.circles || []);
      setChallenges(challengesRes.data?.challenges || []);
      
      // Mock activity data
      setActivity([
        {
          id: '1',
          type: 'task_completed',
          userId: '1',
          userName: 'Sarah',
          message: 'completed "Morning workout"',
          timestamp: '2 min ago',
        },
        {
          id: '2',
          type: 'streak_achieved',
          userId: '2',
          userName: 'Mike',
          message: 'hit a 30-day streak! 🔥',
          timestamp: '15 min ago',
        },
        {
          id: '3',
          type: 'challenge_joined',
          userId: '3',
          userName: 'Emma',
          message: 'joined "30 Days of Meditation"',
          timestamp: '1 hour ago',
        },
      ]);
    } catch (error) {
      console.log('Error fetching social data:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);
  
  // Render circle card
  const renderCircleCard = (circle: Circle) => (
    <TouchableOpacity
      key={circle.id}
      style={styles.circleCard}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.selectionAsync();
        // TODO: Navigate to circle detail
      }}
    >
      <View style={styles.circleAvatar}>
        {circle.imageUrl ? (
          <Image source={{ uri: circle.imageUrl }} style={styles.circleImage} />
        ) : (
          <Ionicons name="people" size={24} color={colors.brand.secondary} />
        )}
      </View>
      <View style={styles.circleInfo}>
        <Text style={styles.circleName}>{circle.name}</Text>
        <Text style={styles.circleMemberCount}>{circle.memberCount} members</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
  
  // Render challenge card
  const renderChallengeCard = (challenge: Challenge) => (
    <TouchableOpacity
      key={challenge.id}
      style={styles.challengeCard}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.selectionAsync();
        // TODO: Navigate to challenge detail
      }}
    >
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeTitle}>{challenge.title}</Text>
        <View style={styles.challengeParticipants}>
          <Ionicons name="people-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.participantCount}>{challenge.participantCount}</Text>
        </View>
      </View>
      <Text style={styles.challengeDescription} numberOfLines={2}>
        {challenge.description}
      </Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${challenge.progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{challenge.progress}%</Text>
      </View>
    </TouchableOpacity>
  );
  
  // Render activity item
  const renderActivityItem = (item: ActivityItem) => (
    <View key={item.id} style={styles.activityItem}>
      <View style={styles.activityAvatar}>
        {item.userAvatar ? (
          <Image source={{ uri: item.userAvatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarLetter}>{item.userName[0]}</Text>
        )}
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>
          <Text style={styles.activityUserName}>{item.userName}</Text>
          {' '}{item.message}
        </Text>
        <Text style={styles.activityTime}>{item.timestamp}</Text>
      </View>
    </View>
  );
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <AIOrb size="mini" onPress={() => {}} />
        <Text style={styles.headerTitle}>Social</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['circles', 'challenges', 'activity'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab(tab);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        {activeTab === 'circles' && (
          <View>
            {circles.length > 0 ? (
              circles.map(renderCircleCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyTitle}>No Circles Yet</Text>
                <Text style={styles.emptyText}>Join or create a circle to connect with others</Text>
                <TouchableOpacity style={styles.createButton}>
                  <Text style={styles.createButtonText}>Create Circle</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        {activeTab === 'challenges' && (
          <View>
            {challenges.length > 0 ? (
              challenges.map(renderChallengeCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyTitle}>No Active Challenges</Text>
                <Text style={styles.emptyText}>Start a challenge to boost your productivity</Text>
                <TouchableOpacity style={styles.createButton}>
                  <Text style={styles.createButtonText}>Browse Challenges</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        {activeTab === 'activity' && (
          <View>
            {activity.length > 0 ? (
              activity.map(renderActivityItem)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="pulse-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyTitle}>No Recent Activity</Text>
                <Text style={styles.emptyText}>Activity from your circles will appear here</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.title1.fontSize,
    fontWeight: theme.typography.title1.fontWeight as any,
    color: colors.text.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.surface2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.brand.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  tabTextActive: {
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  circleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface2,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  circleAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  circleImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  circleMemberCount: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  challengeCard: {
    backgroundColor: colors.background.surface2,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 12,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  challengeParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantCount: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  challengeDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.background.surface3,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    width: 36,
    textAlign: 'right',
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.surface2,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
  },
  activityText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  activityUserName: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  activityTime: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  createButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.brand.primary,
    borderRadius: theme.radius.md,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

export default GestureSocialView;
