/**
 * QuickActions Component
 * Grid of quick action buttons
 */
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Calendar, BarChart3, Trophy, Wallet } from 'lucide-react-native';

interface QuickAction {
  icon: typeof Calendar;
  label: string;
  color: [string, string];
  screen: string;
}

interface QuickActionsProps {
  onNavigate: (screen: string) => void;
}

const quickActions: QuickAction[] = [
  { icon: Calendar, label: 'Plan', color: ['#3b82f6', '#06b6d4'], screen: 'plan' },
  { icon: BarChart3, label: 'Analytics', color: ['#7c3aed', '#a855f7'], screen: 'analytics' },
  { icon: Trophy, label: 'Challenges', color: ['#f97316', '#f59e0b'], screen: 'challenges' },
  { icon: Wallet, label: 'Wallet', color: ['#10b981', '#14b8a6'], screen: 'wallet' },
];

export function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.quickActionsTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <Pressable
              key={action.label}
              onPress={() => onNavigate(action.screen)}
              style={({ pressed }) => [
                styles.quickActionCard,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${action.label} quick action`}
              accessibilityHint={`Navigate to ${action.label} screen`}
            >
              <BlurView intensity={40} tint="light" style={styles.quickActionBlur}>
                <LinearGradient
                  colors={action.color}
                  style={styles.quickActionIcon}
                >
                  <ActionIcon color="#fff" size={20} />
                </LinearGradient>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </BlurView>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 4,
  },
  quickActionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionBlur: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
