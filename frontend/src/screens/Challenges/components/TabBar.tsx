import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TabType } from '../types';
import { styles } from '../styles';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'active', label: 'Active', icon: 'target' },
    { id: 'leaderboard', label: 'Rankings', icon: 'trophy' },
    { id: 'achievements', label: 'Badges', icon: 'medal' },
  ];

  return (
    <View style={styles.tabContainer}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: activeTab === tab.id }}
          >
            {activeTab === tab.id ? (
              <LinearGradient
                colors={['#8B5CF6', '#9333EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            {tab.icon === 'target' && (
              <MaterialCommunityIcons
                name="target"
                size={16}
                color={activeTab === tab.id ? '#FFFFFF' : '#94A3B8'}
              />
            )}
            {tab.icon === 'trophy' && (
              <Ionicons
                name="trophy"
                size={16}
                color={activeTab === tab.id ? '#FFFFFF' : '#94A3B8'}
              />
            )}
            {tab.icon === 'medal' && (
              <MaterialCommunityIcons
                name="medal"
                size={16}
                color={activeTab === tab.id ? '#FFFFFF' : '#94A3B8'}
              />
            )}
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
