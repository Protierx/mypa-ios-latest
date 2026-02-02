import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MYPAOrb } from './MYPAOrb';

interface TabBarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onVoiceClick?: () => void;
  notifications?: { home?: number; circles?: number };
}

const tabs = [
  { id: 'home', label: 'Home', icon: 'home', iconOutline: 'home-outline', color: '#8B5CF6' },
  { id: 'plan', label: 'Plan', icon: 'calendar', iconOutline: 'calendar-outline', color: '#3B82F6' },
  { id: 'circles', label: 'Circles', icon: 'people', iconOutline: 'people-outline', color: '#EC4899' },
  { id: 'profile', label: 'Me', icon: 'person', iconOutline: 'person-outline', color: '#10B981' },
];

export function TabBar({
  activeTab = 'home',
  onTabChange,
  onVoiceClick,
  notifications = { home: 2, circles: 1 },
}: TabBarProps) {
  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);

  const renderTab = (tab: typeof tabs[0]) => {
    const isActive = activeTab === tab.id;
    const badgeCount = notifications?.[tab.id as keyof typeof notifications];

    return (
      <TouchableOpacity
        key={tab.id}
        onPress={() => onTabChange?.(tab.id)}
        style={styles.tabButton}
        activeOpacity={0.8}
      >
        {isActive ? (
          <LinearGradient
            colors={[tab.color, tab.color]}
            style={[styles.tabIconContainer, styles.tabIconContainerActive]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name={tab.icon as any}
              size={22}
              color="#FFFFFF"
            />
          </LinearGradient>
        ) : (
          <View style={styles.tabIconContainer}>
            <Ionicons
              name={tab.iconOutline as any}
              size={22}
              color="#94A3B8"
            />
            {badgeCount && badgeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {badgeCount > 9 ? '9+' : badgeCount}
                </Text>
              </View>
            )}
          </View>
        )}
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      <View style={styles.content}>
        {leftTabs.map(renderTab)}

        <TouchableOpacity onPress={onVoiceClick} style={styles.voiceButton} activeOpacity={0.8}>
          <View style={styles.voiceGlow} />
          <View style={styles.voiceOrbContainer}>
            <MYPAOrb size="sm" showGlow={true} />
          </View>
          <Text style={styles.voiceLabel}>Talk</Text>
        </TouchableOpacity>

        {rightTabs.map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  background: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    height: 70,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 8,
    height: 76,
  },
  tabButton: {
    alignItems: 'center',
    gap: 4,
    width: 56,
  },
  tabIconContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  tabIconContainerActive: {
    backgroundColor: undefined,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
  voiceButton: {
    alignItems: 'center',
    marginTop: -28,
    gap: 4,
  },
  voiceGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  voiceOrbContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  voiceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
});
