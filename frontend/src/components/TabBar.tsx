import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        activeOpacity={0.7}
      >
        <View style={[styles.tabIconContainer, isActive && { backgroundColor: tab.color }]}>
          <Ionicons
            name={(isActive ? tab.icon : tab.iconOutline) as any}
            size={22}
            color={isActive ? '#FFFFFF' : '#64748B'}
          />
          {badgeCount && badgeCount > 0 && !isActive && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badgeCount > 9 ? '9+' : badgeCount}
              </Text>
            </View>
          )}
        </View>
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
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: 'rgba(181, 140, 255, 0.15)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
    height: 76,
  },
  tabButton: {
    alignItems: 'center',
    gap: 2,
    width: 60,
  },
  tabIconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#0F172A',
  },
  voiceButton: {
    alignItems: 'center',
    marginTop: -24,
  },
  voiceGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  voiceOrbContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B5CF6',
    marginTop: 4,
  },
});
