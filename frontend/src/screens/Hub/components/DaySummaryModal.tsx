/**
 * DaySummaryModal Component
 * Shows a celebratory summary when all tasks are complete
 */
import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Trophy,
  Flame,
  CheckCircle2,
  Clock,
  TrendingUp,
  Sparkles,
  Share2,
  Star,
  Zap,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DaySummaryModalProps {
  visible: boolean;
  onClose: () => void;
  stats: {
    tasksCompleted: number;
    totalTasks: number;
    xpEarned: number;
    focusMinutes: number;
    streak: number;
    level: number;
  };
  completedTasks: Array<{
    id: string | number;
    title: string;
    category: string;
    xp?: number;
  }>;
}

export function DaySummaryModal({
  visible,
  onClose,
  stats,
  completedTasks,
}: DaySummaryModalProps) {
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'work': return '#3b82f6';
      case 'health': return '#10b981';
      case 'fitness': return '#f59e0b';
      case 'personal': return '#8b5cf6';
      case 'errands': return '#ec4899';
      case 'learning': return '#06b6d4';
      default: return '#8b5cf6';
    }
  };

  const getMotivationalMessage = () => {
    if (stats.streak >= 7) {
      return "You're on fire! 🔥 Keep that streak alive!";
    }
    if (stats.tasksCompleted >= 5) {
      return "Incredible productivity! You crushed it today! 💪";
    }
    return "Another successful day in the books! 🌟";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <LinearGradient
          colors={['#f0fdf4', '#ecfdf5', '#ffffff']}
          style={styles.gradientBackground}
        >
          {/* Header with close button */}
          <SafeAreaView edges={['top']} style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Day Complete!</Text>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <X color="#64748b" size={22} />
              </Pressable>
            </View>
          </SafeAreaView>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Celebration Hero */}
            <View style={styles.heroSection}>
              <View style={styles.trophyContainer}>
                <LinearGradient
                  colors={['#fbbf24', '#f59e0b', '#d97706']}
                  style={styles.trophyGradient}
                >
                  <Trophy color="#fff" size={48} />
                </LinearGradient>
              </View>

              <Text style={styles.heroTitle}>Amazing Work! 🎉</Text>
              <Text style={styles.heroSubtitle}>{getMotivationalMessage()}</Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.statGradient}
                >
                  <CheckCircle2 color="#fff" size={24} />
                  <Text style={styles.statValue}>{stats.tasksCompleted}</Text>
                  <Text style={styles.statLabel}>Tasks Done</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  style={styles.statGradient}
                >
                  <Zap color="#fff" size={24} />
                  <Text style={styles.statValue}>{stats.xpEarned}</Text>
                  <Text style={styles.statLabel}>XP Earned</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.statGradient}
                >
                  <Flame color="#fff" size={24} />
                  <Text style={styles.statValue}>{stats.streak}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  style={styles.statGradient}
                >
                  <Clock color="#fff" size={24} />
                  <Text style={styles.statValue}>{stats.focusMinutes}</Text>
                  <Text style={styles.statLabel}>Focus Min</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Completed Tasks List */}
            {completedTasks.length > 0 && (
              <View style={styles.tasksSection}>
                <View style={styles.tasksSectionHeader}>
                  <Star color="#f59e0b" size={18} fill="#f59e0b" />
                  <Text style={styles.tasksSectionTitle}>
                    Completed Today
                  </Text>
                </View>
                
                {completedTasks.slice(0, 5).map((task) => (
                  <View key={task.id} style={styles.completedTaskRow}>
                    <View
                      style={[
                        styles.taskDot,
                        { backgroundColor: getCategoryColor(task.category) },
                      ]}
                    />
                    <Text style={styles.completedTaskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <View style={styles.taskXpBadge}>
                      <Text style={styles.taskXpText}>+{task.xp || 5} XP</Text>
                    </View>
                  </View>
                ))}
                
                {completedTasks.length > 5 && (
                  <Text style={styles.moreTasksText}>
                    +{completedTasks.length - 5} more tasks completed
                  </Text>
                )}
              </View>
            )}

            {/* Level Progress */}
            <View style={styles.levelSection}>
              <View style={styles.levelHeader}>
                <TrendingUp color="#8b5cf6" size={18} />
                <Text style={styles.levelTitle}>Level {stats.level}</Text>
              </View>
              <View style={styles.levelProgressBar}>
                <View 
                  style={[
                    styles.levelProgressFill,
                    { width: `${Math.min((stats.xpEarned % 100), 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.levelSubtext}>
                Keep going to reach Level {stats.level + 1}!
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  style={styles.primaryButtonGradient}
                >
                  <Sparkles color="#fff" size={18} />
                  <Text style={styles.primaryButtonText}>Back to Hub</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Share2 color="#64748b" size={18} />
                <Text style={styles.secondaryButtonText}>Share Progress</Text>
              </Pressable>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH - 32,
    maxHeight: '90%',
    borderRadius: 28,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  trophyContainer: {
    marginBottom: 16,
  },
  trophyGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (SCREEN_WIDTH - 32 - 40 - 12) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  tasksSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tasksSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  completedTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  completedTaskTitle: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
  },
  taskXpBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  taskXpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  moreTasksText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 12,
  },
  levelSection: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  levelProgressBar: {
    height: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  levelSubtext: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 14,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
});
