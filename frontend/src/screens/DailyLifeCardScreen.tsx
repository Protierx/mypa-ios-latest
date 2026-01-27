import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../styles';

interface DailyLifeCardScreenProps {
  navigation?: any;
}

const dailyStats = [
  { id: '1', label: 'Tasks Completed', value: '8/12', icon: 'checkbox-marked-circle', color: colors.success },
  { id: '2', label: 'Focus Time', value: '4h 32m', icon: 'timer', color: colors.primary },
  { id: '3', label: 'Steps', value: '6,842', icon: 'walk', color: colors.work },
  { id: '4', label: 'Mindfulness', value: '15 min', icon: 'meditation', color: colors.wellness },
];

const highlights = [
  { id: '1', title: 'Morning Routine', time: '7:00 AM', status: 'completed' },
  { id: '2', title: 'Team Standup', time: '9:30 AM', status: 'completed' },
  { id: '3', title: 'Gym Session', time: '12:00 PM', status: 'in-progress' },
  { id: '4', title: 'Project Review', time: '3:00 PM', status: 'upcoming' },
];

export function DailyLifeCardScreen({ navigation }: DailyLifeCardScreenProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return { name: 'checkmark-circle', color: colors.success };
      case 'in-progress': return { name: 'time', color: colors.warning };
      default: return { name: 'ellipse-outline', color: colors.mutedForeground };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>Daily Life Card</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.dateCard}>
          <Text style={styles.dateLabel}>Today</Text>
          <Text style={styles.dateValue}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>

        <View style={styles.statsGrid}>
          {dailyStats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <MaterialCommunityIcons name={stat.icon as any} size={22} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Highlights</Text>
          {highlights.map((item) => {
            const statusIcon = getStatusIcon(item.status);
            return (
              <View key={item.id} style={styles.highlightItem}>
                <View style={styles.highlightTime}>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <View style={styles.highlightContent}>
                  <View style={styles.timelineDot}>
                    <Ionicons name={statusIcon.name as any} size={20} color={statusIcon.color} />
                  </View>
                  <Text style={styles.highlightTitle}>{item.title}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood Check</Text>
          <View style={styles.moodRow}>
            {['😔', '😕', '😐', '🙂', '😊'].map((emoji, index) => (
              <TouchableOpacity key={index} style={[styles.moodButton, index === 3 && styles.moodButtonActive]}>
                <Text style={styles.moodEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.base,
  },
  dateCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  dateLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: 'center',
    ...shadows.sm,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  statLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  highlightItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  highlightTime: {
    width: 70,
  },
  timeText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  highlightContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timelineDot: {},
  highlightTitle: {
    fontSize: 15,
    color: colors.foreground,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  moodButtonActive: {
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  moodEmoji: {
    fontSize: 24,
  },
});

export default DailyLifeCardScreen;
