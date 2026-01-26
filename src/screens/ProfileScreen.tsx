import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  ChevronRight,
  Settings,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  TrendingUp,
  Award,
  Flame,
  Crown,
  Star,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProfileScreenProps {
  navigation?: any;
}

interface Achievement {
  id: number;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  progress?: number;
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { logout } = useAuth();
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Animation values
  const achievementsSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const achievementsOpacityAnim = useRef(new Animated.Value(0)).current;
  const logoutOpacityAnim = useRef(new Animated.Value(0)).current;
  const logoutScaleAnim = useRef(new Animated.Value(0.9)).current;

  // User stats and achievements
  const userStats = {
    level: 12,
    xp: 2460,
    xpToNext: 340,
    streak: 12,
    timeSaved: '14h',
    challengesWon: 8,
    circlesJoined: 3,
  };

  const achievements: Achievement[] = [
    { id: 1, name: 'Early Bird', emoji: '🌅', description: 'Complete 7 tasks before 9 AM', unlocked: true },
    { id: 2, name: 'Streak Master', emoji: '🔥', description: 'Maintain a 14-day streak', unlocked: true },
    { id: 3, name: 'Time Lord', emoji: '⏰', description: 'Save 10+ hours', unlocked: true },
    { id: 4, name: 'Social Butterfly', emoji: '🦋', description: 'Join 5 circles', unlocked: false, progress: 60 },
    { id: 5, name: 'Challenge Champion', emoji: '🏆', description: 'Win 10 challenges', unlocked: false, progress: 80 },
    { id: 6, name: 'Zen Master', emoji: '🧘', description: 'Complete all daily goals for a month', unlocked: false, progress: 40 },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Navigation helper
  const handleNavigate = (screen: string) => {
    if (!navigation) return;
    const profileStackRoutes: { [key: string]: string } = {
      'edit-profile': 'EditProfile',
      'privacy-controls': 'PrivacyControls',
      notifications: 'Notifications',
      settings: 'SettingsFromProfile',
      help: 'HelpSupport',
    };

    const homeStackRoutes: { [key: string]: string } = {
      hub: 'Hub',
      streak: 'Streak',
      wallet: 'Wallet',
      challenges: 'Challenges',
    };

    if (profileStackRoutes[screen]) {
      navigation.navigate(profileStackRoutes[screen]);
    } else if (homeStackRoutes[screen]) {
      navigation.navigate('Home', { screen: homeStackRoutes[screen] });
    } else if (screen === 'circles') {
      navigation.navigate('Circles', { screen: 'CirclesList' });
    } else {
      navigation.navigate(screen);
    }
  };

  // Achievements modal animation
  useEffect(() => {
    if (showAchievements) {
      Animated.parallel([
        Animated.timing(achievementsSlideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(achievementsOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(achievementsSlideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(achievementsOpacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showAchievements]);

  // Logout modal animation
  useEffect(() => {
    if (showLogoutConfirm) {
      Animated.parallel([
        Animated.timing(logoutOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(logoutScaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(logoutOpacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(logoutScaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showLogoutConfirm]);

  // Settings items configuration
  const settingsItems = [
    { id: 'privacy-controls', label: 'Privacy Controls', icon: Lock, colors: ['#a855f7', '#9333ea'] as [string, string] },
    { id: 'notifications', label: 'Notifications', icon: Bell, colors: ['#fb923c', '#f97316'] as [string, string] },
    { id: 'settings', label: 'App Settings', icon: Settings, colors: ['#64748b', '#475569'] as [string, string] },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, colors: ['#10b981', '#059669'] as [string, string] },
  ];

  // Stats configuration
  const statsConfig = [
    { key: 'streak', value: userStats.streak, label: 'Streak', icon: Flame, color: '#f97316', screen: 'streak' },
    { key: 'circles', value: userStats.circlesJoined, label: 'Circles', icon: Users, color: '#8b5cf6', screen: 'circles' },
    { key: 'saved', value: userStats.timeSaved, label: 'Saved', icon: TrendingUp, color: '#10b981', screen: 'wallet' },
    { key: 'wins', value: userStats.challengesWon, label: 'Wins', icon: Award, color: '#f59e0b', screen: 'challenges' },
  ];

  const xpProgress = ((userStats.xp % 500) / 500) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9', '#f8fafc']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>Your Account</Text>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Card */}
          <View style={styles.userCard}>
            <View style={styles.userCardTop}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#8b5cf6', '#9333ea']}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>A</Text>
                </LinearGradient>
                {/* Level Badge */}
                <LinearGradient
                  colors={['#8b5cf6', '#9333ea']}
                  style={styles.levelBadge}
                >
                  <Text style={styles.levelBadgeText}>{userStats.level}</Text>
                </LinearGradient>
              </View>

              {/* User Info */}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Alex</Text>
                <Text style={styles.userEmail}>alex@email.com</Text>
              </View>

              {/* Edit Button */}
              <Pressable
                onPress={() => handleNavigate('edit-profile')}
                style={({ pressed }) => [
                  styles.editButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            </View>

            {/* XP Progress */}
            <View style={styles.xpContainer}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpLevel}>Level {userStats.level}</Text>
                <Text style={styles.xpToNext}>{userStats.xpToNext} XP to next</Text>
              </View>
              <View style={styles.xpBarBg}>
                <LinearGradient
                  colors={['#8b5cf6', '#9333ea']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.xpBarFill, { width: `${xpProgress}%` }]}
                />
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {statsConfig.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <Pressable
                  key={stat.key}
                  onPress={() => handleNavigate(stat.screen)}
                  style={({ pressed }) => [
                    styles.statCard,
                    pressed && styles.cardPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${stat.label}: ${stat.value}`}
                >
                  <StatIcon color={stat.color} size={20} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Achievements Button */}
          <Pressable
            onPress={() => setShowAchievements(true)}
            style={({ pressed }) => [
              styles.achievementsButton,
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${unlockedCount} achievements unlocked`}
          >
            <View style={styles.achievementAvatars}>
              {achievements.filter(a => a.unlocked).slice(0, 3).map((a, index) => (
                <LinearGradient
                  key={a.id}
                  colors={['#fbbf24', '#f97316']}
                  style={[
                    styles.achievementAvatar,
                    { marginLeft: index > 0 ? -8 : 0, zIndex: 3 - index },
                  ]}
                >
                  <Text style={styles.achievementEmoji}>{a.emoji}</Text>
                </LinearGradient>
              ))}
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>{unlockedCount} Achievements</Text>
              <Text style={styles.achievementSubtitle}>
                {achievements.length - unlockedCount} more to unlock
              </Text>
            </View>
            <ChevronRight color="#94a3b8" size={20} />
          </Pressable>

          {/* Settings */}
          <View style={styles.settingsCard}>
            {settingsItems.map((item, index) => {
              const ItemIcon = item.icon;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleNavigate(item.id)}
                  style={({ pressed }) => [
                    styles.settingsItem,
                    index < settingsItems.length - 1 && styles.settingsItemBorder,
                    pressed && styles.settingsItemPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <View style={styles.settingsItemLeft}>
                    <LinearGradient
                      colors={item.colors}
                      style={styles.settingsIcon}
                    >
                      <ItemIcon color="#fff" size={18} />
                    </LinearGradient>
                    <Text style={styles.settingsLabel}>{item.label}</Text>
                  </View>
                  <ChevronRight color="#94a3b8" size={20} />
                </Pressable>
              );
            })}
          </View>

          {/* Logout Button */}
          <Pressable
            onPress={() => setShowLogoutConfirm(true)}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <LogOut color="#ef4444" size={20} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>

          {/* Version */}
          <Text style={styles.versionText}>MYPA v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalBackdrop,
              { opacity: logoutOpacityAnim },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowLogoutConfirm(false)}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.logoutModal,
              {
                opacity: logoutOpacityAnim,
                transform: [{ scale: logoutScaleAnim }],
              },
            ]}
          >
            <View style={styles.logoutIconContainer}>
              <LogOut color="#ef4444" size={32} />
            </View>
            <Text style={styles.logoutModalTitle}>Log out?</Text>
            <Text style={styles.logoutModalSubtitle}>
              Are you sure you want to log out of MYPA?
            </Text>
            <View style={styles.logoutModalButtons}>
              <Pressable
                onPress={() => setShowLogoutConfirm(false)}
                style={({ pressed }) => [
                  styles.logoutCancelButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.logoutCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                }}
                style={({ pressed }) => [
                  styles.logoutConfirmButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.logoutConfirmText}>Log Out</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Achievements Modal */}
      <Modal
        visible={showAchievements}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowAchievements(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalBackdrop,
              { opacity: achievementsOpacityAnim },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowAchievements(false)}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.achievementsModal,
              { transform: [{ translateY: achievementsSlideAnim }] },
            ]}
          >
            <View style={styles.modalHandle} />

            {/* Modal Header */}
            <View style={styles.achievementsHeader}>
              <LinearGradient
                colors={['#fbbf24', '#f97316']}
                style={styles.achievementsHeaderIcon}
              >
                <Crown color="#fff" size={24} />
              </LinearGradient>
              <View>
                <Text style={styles.achievementsHeaderTitle}>Achievements</Text>
                <Text style={styles.achievementsHeaderSubtitle}>
                  {unlockedCount}/{achievements.length} unlocked
                </Text>
              </View>
            </View>

            {/* Achievements List */}
            <ScrollView
              style={styles.achievementsList}
              contentContainerStyle={styles.achievementsListContent}
              showsVerticalScrollIndicator={false}
            >
              {achievements.map(achievement => (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    achievement.unlocked
                      ? styles.achievementCardUnlocked
                      : styles.achievementCardLocked,
                  ]}
                >
                  {achievement.unlocked ? (
                    <LinearGradient
                      colors={['#fbbf24', '#f97316']}
                      style={styles.achievementCardIcon}
                    >
                      <Text style={styles.achievementCardEmoji}>{achievement.emoji}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.achievementCardIconLocked}>
                      <Text style={styles.achievementCardEmoji}>🔒</Text>
                    </View>
                  )}
                  <View style={styles.achievementCardContent}>
                    <Text
                      style={[
                        styles.achievementCardName,
                        !achievement.unlocked && styles.achievementCardNameLocked,
                      ]}
                    >
                      {achievement.name}
                    </Text>
                    <Text style={styles.achievementCardDescription}>
                      {achievement.description}
                    </Text>
                    {!achievement.unlocked && achievement.progress && (
                      <View style={styles.achievementProgress}>
                        <View style={styles.achievementProgressBar}>
                          <LinearGradient
                            colors={['#8b5cf6', '#9333ea']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                              styles.achievementProgressFill,
                              { width: `${achievement.progress}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.achievementProgressText}>
                          {achievement.progress}% complete
                        </Text>
                      </View>
                    )}
                  </View>
                  {achievement.unlocked && (
                    <Star color="#fbbf24" size={20} fill="#fbbf24" />
                  )}
                </View>
              ))}
            </ScrollView>

            {/* Close Button */}
            <Pressable
              onPress={() => setShowAchievements(false)}
              style={({ pressed }) => [pressed && styles.buttonPressed]}
            >
              <LinearGradient
                colors={['#8b5cf6', '#9333ea']}
                style={styles.achievementsCloseButton}
              >
                <Text style={styles.achievementsCloseText}>Close</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },

  // User Card
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    minHeight: 44,
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },

  // XP Progress
  xpContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLevel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  xpToNext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  xpBarBg: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 80,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
  },

  // Achievements Button
  achievementsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 72,
  },
  achievementAvatars: {
    flexDirection: 'row',
  },
  achievementAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  achievementEmoji: {
    fontSize: 18,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  achievementSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },

  // Settings
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 64,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingsItemPressed: {
    backgroundColor: '#f8fafc',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },

  // Version
  versionText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingBottom: 8,
  },

  // Button states
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },

  // Modal Base
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  // Logout Modal
  logoutModal: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  logoutIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  logoutModalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  logoutCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  logoutCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  logoutConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  logoutConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Achievements Modal
  achievementsModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  achievementsHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementsHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  achievementsHeaderSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  achievementsList: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  achievementsListContent: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
  },
  achievementCardUnlocked: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  achievementCardLocked: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  achievementCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementCardIconLocked: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementCardEmoji: {
    fontSize: 24,
  },
  achievementCardContent: {
    flex: 1,
  },
  achievementCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  achievementCardNameLocked: {
    color: '#64748b',
  },
  achievementCardDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  achievementProgress: {
    marginTop: 8,
  },
  achievementProgressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  achievementProgressText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  achievementsCloseButton: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 20,
    minHeight: 52,
    justifyContent: 'center',
  },
  achievementsCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProfileScreen;
