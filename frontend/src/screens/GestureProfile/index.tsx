/**
 * GestureProfileView - Profile screen accessed by swiping DOWN from AI Home
 * 
 * From design spec:
 * - Header: Profile pic, name, streak badge
 * - Stats Grid: Tasks completed, Focus minutes, Current streak, XP
 * - Unlocks Section: Show locked/unlocked AI features
 * - Settings: List of settings options
 * - Logout: At bottom
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AIOrb from '../../components/AIOrb';
import { structuredColors as colors } from '../../styles/colors';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { 
  UnlockProgressCard, 
  UnlockCelebration,
  APP_FEATURES,
  type UnlockableFeature 
} from '../../components/Unlock';

interface UserStats {
  tasksCompleted: number;
  focusMinutes: number;
  currentStreak: number;
  totalXP: number;
  level: number;
}

interface SettingItem {
  id: string;
  icon: string;
  label: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

interface GestureProfileViewProps {
  onBack?: () => void;
}

export function GestureProfileView({ onBack }: GestureProfileViewProps) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  
  const [stats, setStats] = useState<UserStats>({
    tasksCompleted: 0,
    focusMinutes: 0,
    currentStreak: 0,
    totalXP: 0,
    level: 1,
  });
  
  const [unlocks, setUnlocks] = useState<UnlockableFeature[]>(APP_FEATURES);
  const [celebrationFeature, setCelebrationFeature] = useState<UnlockableFeature | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Fetch user stats and unlocks
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, unlocksRes] = await Promise.all([
          api.get('/users/profile'),
          api.get('/unlocks'),
        ]);
        
        const userData = profileRes.data?.user;
        if (userData) {
          const newStats = {
            tasksCompleted: userData.tasksCompleted || 0,
            focusMinutes: userData.focusMinutes || 0,
            currentStreak: userData.streakDays || 0,
            totalXP: userData.xp || 0,
            level: userData.level || 1,
          };
          setStats(newStats);
          
          // Update unlock progress based on user stats
          const updatedUnlocks = APP_FEATURES.map(feature => {
            const updatedReqs = feature.requirements.map(req => {
              let current = req.current;
              let met = req.met;
              
              // Update current values based on actual user data
              if (req.description.includes('days')) {
                current = Math.min(req.target, Math.ceil((userData.accountAgeHours || 0) / 24));
                met = current >= req.target;
              } else if (req.description.includes('tasks')) {
                current = Math.min(req.target, newStats.tasksCompleted);
                met = current >= req.target;
              } else if (req.description.includes('focus sessions')) {
                current = Math.min(req.target, userData.focusSessions || 0);
                met = current >= req.target;
              } else if (req.description.includes('streak')) {
                current = Math.min(req.target, newStats.currentStreak);
                met = current >= req.target;
              } else if (req.description.includes('circle')) {
                current = Math.min(req.target, userData.circleCount || 0);
                met = current >= req.target;
              } else if (req.description.includes('AI conversations')) {
                current = Math.min(req.target, userData.aiConversations || 0);
                met = current >= req.target;
              }
              
              return { ...req, current, met };
            });
            
            const allMet = updatedReqs.every(r => r.met);
            return {
              ...feature,
              requirements: updatedReqs,
              unlocked: allMet,
              unlockedAt: allMet ? String(Math.ceil((userData.accountAgeHours || 0) / 24)) : undefined,
            };
          });
          
          setUnlocks(updatedUnlocks);
        }
        
        // Use API unlock data if available
        if (unlocksRes.data?.unlocks) {
          setUnlocks(unlocksRes.data.unlocks);
        }
      } catch (error) {
        console.log('Error fetching profile data:', error);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle logout
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            logout();
          },
        },
      ]
    );
  }, [logout]);
  
  // Settings items
  const settingsItems: SettingItem[] = [
    {
      id: 'notifications',
      icon: 'notifications-outline',
      label: 'Notifications',
      onPress: () => {},
      showArrow: true,
    },
    {
      id: 'privacy',
      icon: 'shield-outline',
      label: 'Privacy',
      onPress: () => {},
      showArrow: true,
    },
    {
      id: 'integrations',
      icon: 'apps-outline',
      label: 'Integrations',
      onPress: () => {},
      showArrow: true,
    },
    {
      id: 'help',
      icon: 'help-circle-outline',
      label: 'Help & Support',
      onPress: () => {},
      showArrow: true,
    },
    {
      id: 'logout',
      icon: 'log-out-outline',
      label: 'Log Out',
      onPress: handleLogout,
      danger: true,
    },
  ];
  
  // Render stat card
  const renderStatCard = (
    value: number | string,
    label: string,
    icon: string
  ) => (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={20} color={colors.brand.secondary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
  
  // Handle feature unlock celebration
  const handleFeatureUnlocked = (feature: UnlockableFeature) => {
    setCelebrationFeature(feature);
    setShowCelebration(true);
  };
  
  // Render settings item
  const renderSettingsItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingsItem}
      onPress={() => {
        Haptics.selectionAsync();
        item.onPress();
      }}
      activeOpacity={0.7}
    >
      <Ionicons
        name={item.icon as any}
        size={22}
        color={item.danger ? colors.semantic.error : colors.text.secondary}
      />
      <Text style={[
        styles.settingsLabel,
        item.danger && styles.settingsLabelDanger,
      ]}>
        {item.label}
      </Text>
      {item.showArrow && (
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      )}
    </TouchableOpacity>
  );
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <AIOrb size="mini" onPress={() => {}} />
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-up" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv{stats.level}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color={colors.brand.primary} />
            <Text style={styles.streakText}>{stats.currentStreak} day streak</Text>
          </View>
        </View>
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard(stats.tasksCompleted, 'Tasks Done', 'checkmark-circle-outline')}
          {renderStatCard(`${stats.focusMinutes}m`, 'Focus Time', 'time-outline')}
          {renderStatCard(stats.currentStreak, 'Streak', 'flame-outline')}
          {renderStatCard(stats.totalXP, 'XP', 'star-outline')}
        </View>
        
        {/* Unlocks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Features</Text>
            <Text style={styles.unlockCount}>
              {unlocks.filter(u => u.unlocked).length}/{unlocks.length} unlocked
            </Text>
          </View>
          <View style={styles.unlocksList}>
            {unlocks.map(feature => (
              <UnlockProgressCard
                key={feature.id}
                feature={feature}
                onPress={() => {
                  // Navigate to feature when unlocked
                  console.log(`Feature ${feature.name} pressed`);
                }}
              />
            ))}
          </View>
        </View>
        
        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsList}>
            {settingsItems.map(renderSettingsItem)}
          </View>
        </View>
      </ScrollView>
      
      {/* Unlock Celebration Overlay */}
      {celebrationFeature && (
        <UnlockCelebration
          visible={showCelebration}
          featureName={celebrationFeature.name}
          featureDescription={celebrationFeature.description}
          icon={celebrationFeature.icon}
          onDismiss={() => {
            setShowCelebration(false);
            setCelebrationFeature(null);
          }}
        />
      )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.background.surface3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.background.black,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background.surface2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background.surface2,
    borderRadius: theme.radius.lg,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  unlockCount: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.brand.secondary,
  },
  unlocksList: {
    // No background since UnlockProgressCard has its own
  },
  unlockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.surface3,
  },
  unlockIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.surface3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unlockIconActive: {
    backgroundColor: colors.brand.primary,
  },
  unlockContent: {
    flex: 1,
  },
  unlockName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  unlockNameLocked: {
    color: colors.text.tertiary,
  },
  unlockDescription: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  settingsList: {
    backgroundColor: colors.background.surface2,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.surface3,
    gap: 12,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  settingsLabelDanger: {
    color: colors.semantic.error,
  },
});

export default GestureProfileView;
