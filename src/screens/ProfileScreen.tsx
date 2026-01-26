import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { colors } from '../styles/colors';

interface MenuItem {
  id: string;
  iconName: string;
  iconColor: string;
  title: string;
  subtitle?: string;
}

const menuItems: MenuItem[] = [
  { id: '1', iconName: 'create', iconColor: '#3B82F6', title: 'Edit Profile', subtitle: 'Update your information' },
  { id: '2', iconName: 'notifications', iconColor: '#F59E0B', title: 'Notifications', subtitle: 'Manage alerts' },
  { id: '3', iconName: 'lock-closed', iconColor: '#8B5CF6', title: 'Privacy Controls', subtitle: 'Manage your data' },
  { id: '4', iconName: 'location', iconColor: '#F43F5E', title: 'Saved Places', subtitle: '5 locations' },
  { id: '5', iconName: 'card', iconColor: '#10B981', title: 'Payment Methods', subtitle: '2 cards' },
  { id: '6', iconName: 'settings', iconColor: '#64748B', title: 'Settings', subtitle: 'App preferences' },
  { id: '7', iconName: 'help-circle', iconColor: '#06B6D4', title: 'Help & Support', subtitle: 'Get assistance' },
];

interface Achievement {
  id: string;
  iconName: string;
  iconColor: string;
  title: string;
  description: string;
}

const achievements: Achievement[] = [
  { id: '1', iconName: 'fire', iconColor: '#F97316', title: 'Hot Streak', description: '30 days' },
  { id: '2', iconName: 'run', iconColor: '#3B82F6', title: 'Runner', description: '100 km' },
  { id: '3', iconName: 'spa', iconColor: '#8B5CF6', title: 'Zen Master', description: '50 sessions' },
  { id: '4', iconName: 'target', iconColor: '#10B981', title: 'Goal Getter', description: '25 goals' },
];

export function ProfileScreen({ navigation }: any) {
  const renderAchievementIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'fire':
        return <MaterialCommunityIcons name="fire" size={28} color={color} />;
      case 'run':
        return <MaterialCommunityIcons name="run" size={28} color={color} />;
      case 'spa':
        return <MaterialCommunityIcons name="spa" size={28} color={color} />;
      case 'target':
        return <MaterialCommunityIcons name="target" size={28} color={color} />;
      default:
        return <Ionicons name="trophy" size={28} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with gradient effect */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>AJ</Text>
              </View>
              <View style={styles.onlineIndicator}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.profileName}>Alex Johnson</Text>
            <Text style={styles.profileEmail}>alex.johnson@email.com</Text>
            <View style={styles.memberBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.memberText}>Pro Member since Jan 2024</Text>
            </View>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <TouchableOpacity style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="fire" size={22} color="#F97316" />
            </View>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="flash" size={22} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>Lvl 12</Text>
            <Text style={styles.statLabel}>2,450 XP</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="wallet" size={22} color="#10B981" />
            </View>
            <Text style={styles.statValue}>$250</Text>
            <Text style={styles.statLabel}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Achievements */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
          {achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              <View style={[styles.achievementIcon, { backgroundColor: achievement.iconColor + '20' }]}>
                {renderAchievementIcon(achievement.iconName, achievement.iconColor)}
              </View>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Level Progress */}
        <View style={styles.levelProgress}>
          <View style={styles.levelHeader}>
            <View style={styles.levelLeft}>
              <View style={styles.levelIconContainer}>
                <Ionicons name="flash" size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.levelTitle}>Level 12 Progress</Text>
            </View>
            <Text style={styles.levelXP}>2,450 / 3,000 XP</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '82%' }]} />
          </View>
          <View style={styles.levelFooter}>
            <Text style={styles.levelHint}>550 XP to Level 13</Text>
            <View style={styles.levelReward}>
              <Ionicons name="gift" size={14} color="#F59E0B" />
              <Text style={styles.levelRewardText}>+$25 reward</Text>
            </View>
          </View>
        </View>

        {/* Account Menu */}
        <Text style={[styles.sectionTitle, { marginHorizontal: 20, marginTop: 24, marginBottom: 12 }]}>Account</Text>
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={() => {
                if (item.title === 'Edit Profile') navigation?.navigate('EditProfile');
                else if (item.title === 'Notifications') navigation?.navigate('Notifications');
                else if (item.title === 'Privacy Controls') navigation?.navigate('PrivacyControls');
                else if (item.title === 'Settings') navigation?.navigate('SettingsFromProfile');
                else if (item.title === 'Help & Support') navigation?.navigate('HelpSupport');
              }}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: item.iconColor + '15' }]}>
                <Ionicons name={item.iconName as any} size={20} color={item.iconColor} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={20} color="#F43F5E" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1 },
  header: { backgroundColor: '#8B5CF6', paddingBottom: 48, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
  settingsButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  profileHeader: { alignItems: 'center', paddingTop: 4, paddingHorizontal: 20 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#8B5CF6' },
  onlineIndicator: { position: 'absolute', bottom: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: '#10B981', borderWidth: 3, borderColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 2 },
  profileEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  memberText: { fontSize: 12, color: '#FFFFFF', fontWeight: '500' },
  statsCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: -28, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#F1F5F9', marginHorizontal: 4 },
  statIconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#64748B' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A' },
  seeAll: { fontSize: 14, fontWeight: '500', color: '#8B5CF6' },
  achievementsScroll: { paddingLeft: 20 },
  achievementCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, alignItems: 'center', marginRight: 12, width: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  achievementIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  achievementTitle: { fontSize: 12, fontWeight: '600', color: '#0F172A', marginBottom: 2, textAlign: 'center' },
  achievementDescription: { fontSize: 11, color: '#64748B', textAlign: 'center' },
  levelProgress: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  levelLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelIconContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  levelTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  levelXP: { fontSize: 13, color: '#8B5CF6', fontWeight: '600' },
  progressBar: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 5 },
  levelFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelHint: { fontSize: 12, color: '#64748B' },
  levelReward: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  levelRewardText: { fontSize: 12, fontWeight: '500', color: '#F59E0B' },
  menuCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuIconContainer: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '500', color: '#0F172A' },
  menuSubtitle: { fontSize: 12, color: '#64748B', marginTop: 1 },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 20, padding: 14, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#FEE2E2' },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#F43F5E' },
});
