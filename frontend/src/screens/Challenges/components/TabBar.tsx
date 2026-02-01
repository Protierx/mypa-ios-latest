import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
          >
            {tab.icon === 'target' && (
              <MaterialCommunityIcons
                name="target"
                size={16}
                color={activeTab === tab.id ? '#0F172A' : '#64748B'}
              />
            )}
            {tab.icon === 'trophy' && (
              <Ionicons
                name="trophy"
                size={16}
                color={activeTab === tab.id ? '#0F172A' : '#64748B'}
              />
            )}
            {tab.icon === 'medal' && (
              <MaterialCommunityIcons
                name="medal"
                size={16}
                color={activeTab === tab.id ? '#0F172A' : '#64748B'}
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
