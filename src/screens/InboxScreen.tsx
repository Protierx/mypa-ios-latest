import React, { useState } from 'react';
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

interface InboxItem {
  id: string;
  type: 'assignment' | 'message' | 'reminder';
  title: string;
  subtitle: string;
  time: string;
  sender?: string;
  senderInitial?: string;
  senderColor?: string;
  priority?: 'high' | 'medium' | 'low';
  completed?: boolean;
  iconName: string;
  iconColor: string;
}

const inboxItems: InboxItem[] = [
  { id: '1', type: 'assignment', title: 'Complete workout proof', subtitle: 'Morning Workout Challenge', time: '10:00 AM', priority: 'high', iconName: 'dumbbell', iconColor: '#F43F5E' },
  { id: '2', type: 'message', title: 'Sarah Chen', subtitle: 'Great job on completing the challenge!', time: '2m ago', sender: 'Sarah', senderInitial: 'S', senderColor: '#EC4899', iconName: 'message', iconColor: '#3B82F6' },
  { id: '3', type: 'reminder', title: 'Team Standup', subtitle: 'In 30 minutes', time: '10:30 AM', iconName: 'calendar', iconColor: '#8B5CF6' },
  { id: '4', type: 'assignment', title: 'Share reading progress', subtitle: 'Daily Reading Challenge', time: '8:00 PM', completed: true, iconName: 'book-open', iconColor: '#3B82F6' },
  { id: '5', type: 'message', title: 'Morning Runners', subtitle: 'Emma shared a new route for Saturday run', time: '1h ago', sender: 'Emma', senderInitial: 'E', senderColor: '#F97316', iconName: 'people', iconColor: '#10B981' },
  { id: '6', type: 'reminder', title: 'Hydration Check', subtitle: 'Time to drink water', time: '2:00 PM', iconName: 'water', iconColor: '#06B6D4' },
];

export function InboxScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'assignments' | 'messages' | 'reminders'>('all');

  const filteredItems = inboxItems.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'assignments') return item.type === 'assignment';
    if (activeTab === 'messages') return item.type === 'message';
    if (activeTab === 'reminders') return item.type === 'reminder';
    return true;
  });

  const pendingCount = inboxItems.filter(i => i.type === 'assignment' && !i.completed).length;

  const renderIcon = (iconName: string, size: number, color: string) => {
    switch (iconName) {
      case 'dumbbell':
        return <MaterialCommunityIcons name="dumbbell" size={size} color={color} />;
      case 'message':
        return <Ionicons name="chatbubble" size={size} color={color} />;
      case 'calendar':
        return <Ionicons name="calendar" size={size} color={color} />;
      case 'book-open':
        return <Feather name="book-open" size={size} color={color} />;
      case 'people':
        return <Ionicons name="people" size={size} color={color} />;
      case 'water':
        return <Ionicons name="water" size={size} color={color} />;
      default:
        return <Ionicons name="notifications" size={size} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inbox</Text>
          <Text style={styles.subtitle}>{pendingCount} pending actions</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {[
            { id: 'all', label: 'All', icon: 'apps' },
            { id: 'assignments', label: 'To Do', icon: 'checkbox' },
            { id: 'messages', label: 'Messages', icon: 'chatbubbles' },
            { id: 'reminders', label: 'Reminders', icon: 'alarm' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.id ? '#FFFFFF' : '#64748B'} 
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Today Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <Ionicons name="today" size={16} color="#64748B" />
            <Text style={styles.sectionTitle}>Today</Text>
          </View>
          <Text style={styles.sectionCount}>{filteredItems.length} items</Text>
        </View>

        {filteredItems.map((item) => (
          <TouchableOpacity key={item.id} style={styles.inboxItem}>
            <View style={[styles.itemIcon, { backgroundColor: item.iconColor + '20' }]}>
              {item.type === 'message' && item.senderInitial ? (
                <View style={[styles.avatarIcon, { backgroundColor: item.senderColor }]}>
                  <Text style={styles.avatarText}>{item.senderInitial}</Text>
                </View>
              ) : (
                renderIcon(item.iconName, 20, item.iconColor)
              )}
            </View>

            <View style={styles.itemContent}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, item.completed && styles.itemTitleCompleted]}>
                  {item.title}
                </Text>
                {item.priority === 'high' && !item.completed && (
                  <View style={styles.priorityBadge}>
                    <MaterialCommunityIcons name="fire" size={12} color="#F43F5E" />
                  </View>
                )}
              </View>
              <Text style={styles.itemSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              <View style={styles.itemMeta}>
                <Ionicons name="time-outline" size={12} color="#94A3B8" />
                <Text style={styles.itemTime}>{item.time}</Text>
                {item.type === 'assignment' && (
                  <View style={[styles.typeBadge, item.completed ? styles.typeBadgeCompleted : styles.typeBadgePending]}>
                    <Text style={[styles.typeText, item.completed ? styles.typeTextCompleted : styles.typeTextPending]}>
                      {item.completed ? 'Done' : 'To Do'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.itemActions}>
              {item.type === 'assignment' && !item.completed && (
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="camera" size={18} color="#8B5CF6" />
                </TouchableOpacity>
              )}
              {item.type === 'message' && (
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="arrow-redo" size={18} color="#3B82F6" />
                </TouchableOpacity>
              )}
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </View>
          </TouchableOpacity>
        ))}

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="add-circle" size={22} color="#8B5CF6" />
              </View>
              <Text style={styles.quickActionText}>New Task</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="create" size={22} color="#3B82F6" />
              </View>
              <Text style={styles.quickActionText}>Compose</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="alarm" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.quickActionText}>Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="calendar" size={22} color="#10B981" />
              </View>
              <Text style={styles.quickActionText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
  filterButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabContainer: { paddingHorizontal: 20, marginBottom: 16 },
  tabScroll: { flexDirection: 'row' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', marginRight: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabActive: { backgroundColor: '#0F172A' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#475569' },
  sectionCount: { fontSize: 12, color: '#94A3B8' },
  inboxItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  itemIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  itemContent: { flex: 1 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  itemTitleCompleted: { color: '#94A3B8', textDecorationLine: 'line-through' },
  priorityBadge: { backgroundColor: '#FFF1F2', padding: 4, borderRadius: 6 },
  itemSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  itemTime: { fontSize: 12, color: '#94A3B8', marginRight: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeBadgePending: { backgroundColor: '#FEF3C7' },
  typeBadgeCompleted: { backgroundColor: '#ECFDF5' },
  typeText: { fontSize: 10, fontWeight: '600' },
  typeTextPending: { color: '#B45309' },
  typeTextCompleted: { color: '#059669' },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  quickActionsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  quickActionsTitle: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 12 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickActionText: { fontSize: 11, color: '#64748B', textAlign: 'center' },
});
