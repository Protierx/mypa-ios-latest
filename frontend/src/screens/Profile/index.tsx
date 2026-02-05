import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileScreenProps } from './types';
import { useProfileData } from './hooks/useProfileData';
import { useProfileActions } from './hooks/useProfileActions';
import {
  UserCard,
  StatsRow,
  AchievementsButton,
  SettingsCard,
  LogoutButton,
  VersionText,
  AIUnlocksSection,
} from './components';
import { LogoutModal, AchievementsModal } from './modals';
import { styles } from './styles';

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  // Data and state management
  const {
    user,
    userStats,
    xpProgress,
    achievements,
    settingsItems,
    statsConfig,
    showAchievements,
    setShowAchievements,
    showLogoutConfirm,
    setShowLogoutConfirm,
    achievementsSlideAnim,
    achievementsOpacityAnim,
    logoutOpacityAnim,
    logoutScaleAnim,
    logout,
  } = useProfileData();
  
  // Actions
  const {
    handleNavigate,
    handleEditProfile,
    handleOpenAchievements,
    handleCloseAchievements,
    handleOpenLogout,
    handleCloseLogout,
    handleConfirmLogout,
  } = useProfileActions({
    navigation,
    setShowAchievements,
    setShowLogoutConfirm,
    logout,
  });

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
          <UserCard
            user={user}
            userStats={userStats}
            xpProgress={xpProgress}
            onEditPress={handleEditProfile}
          />

          {/* Stats Row */}
          <StatsRow
            stats={statsConfig}
            onStatPress={handleNavigate}
          />

          {/* Achievements Button */}
          <AchievementsButton
            achievements={achievements}
            onPress={handleOpenAchievements}
          />

          {/* AI Unlocks Section */}
          <AIUnlocksSection />

          {/* Settings */}
          <SettingsCard
            items={settingsItems}
            onItemPress={handleNavigate}
          />

          {/* Logout Button */}
          <LogoutButton onPress={handleOpenLogout} />

          {/* Version */}
          <VersionText />
        </ScrollView>
      </SafeAreaView>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        visible={showLogoutConfirm}
        onClose={handleCloseLogout}
        onConfirm={handleConfirmLogout}
        opacityAnim={logoutOpacityAnim}
        scaleAnim={logoutScaleAnim}
      />

      {/* Achievements Modal */}
      <AchievementsModal
        visible={showAchievements}
        onClose={handleCloseAchievements}
        achievements={achievements}
        slideAnim={achievementsSlideAnim}
        opacityAnim={achievementsOpacityAnim}
      />
    </View>
  );
}

export default ProfileScreen;
