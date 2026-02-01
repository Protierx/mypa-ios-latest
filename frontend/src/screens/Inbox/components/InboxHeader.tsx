import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle, Inbox, Sparkles } from 'lucide-react-native';
import { styles } from '../styles';
import { TabType, tabs } from '../types';

interface InboxHeaderProps {
  newCount: number;
  pendingCount: number;
  onBack: () => void;
  onMarkAllRead: () => void;
}

export const InboxHeader: React.FC<InboxHeaderProps> = ({
  newCount,
  pendingCount,
  onBack,
  onMarkAllRead,
}) => {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable 
            style={styles.backButton} 
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back to hub"
          >
            <ArrowLeft size={18} color="#475569" />
          </Pressable>
          <View>
            <Text style={styles.headerSubtitle}>Messages & Requests</Text>
            <Text style={styles.headerTitle}>Inbox</Text>
          </View>
        </View>
        {newCount > 0 && (
          <LinearGradient colors={['#8B5CF6', '#6366F1']} style={styles.newBadge}>
            <Sparkles size={14} color="#FFFFFF" />
            <Text style={styles.newBadgeText}>{newCount} new</Text>
          </LinearGradient>
        )}
      </View>

      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.summaryCard}>
        <View style={styles.summaryDecorationTop} />
        <View style={styles.summaryDecorationBottom} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryIcon}>
            <Inbox size={20} color="#FFFFFF" />
          </View>
          <View style={styles.summaryTextWrap}>
            <Text style={styles.summaryTitle}>
              {newCount === 0 ? 'All caught up! 🎉' : `${newCount} things need your attention`}
            </Text>
            <Text style={styles.summarySubtitle}>
              {pendingCount > 0
                ? `You have ${pendingCount} tasks waiting for your response`
                : 'Looking good - your tasks are under control'}
            </Text>
          </View>
        </View>
        {newCount > 0 && (
          <Pressable
            style={styles.markAllBtn}
            onPress={onMarkAllRead}
          >
            <CheckCircle size={14} color="#FFFFFF" />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </Pressable>
        )}
      </LinearGradient>
    </>
  );
};

interface TabsRowProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabsRow: React.FC<TabsRowProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <View style={styles.tabsRow}>
      {tabs.map(tab => (
        <Pressable
          key={tab.id}
          onPress={() => onTabChange(tab.id)}
          style={[styles.tabChip, activeTab === tab.id && styles.tabChipActive]}
        >
          <Text style={[styles.tabChipText, activeTab === tab.id && styles.tabChipTextActive]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};
