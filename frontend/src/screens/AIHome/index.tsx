/**
 * AI Home Screen - The center of the Mylo app
 * 
 * From design spec:
 * - Greeting area at top
 * - Large 160px AI orb centered
 * - AI message below orb
 * - Quick action buttons (Focus, Add Task)
 * - Stats cards (tasks, streak, rank)
 * - Swipe hints at edges
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AIOrb from '../../components/AIOrb';
import DualInputBar from '../../components/DualInputBar';
import DailyBriefingCard from '../../components/DailyBriefingCard';
import SwipeHints from '../../navigation/SwipeHints';
import { structuredColors as colors } from '../../styles/colors';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { parseIntent, executeIntent } from '../../services';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AIHomeScreenProps {
  onOpenFocus?: () => void;
  onNavigateToTasks?: () => void;
  onNavigateToSocial?: () => void;
  onNavigateToProfile?: () => void;
}

export function AIHomeScreen({
  onOpenFocus,
  onNavigateToTasks,
  onNavigateToSocial,
  onNavigateToProfile,
}: AIHomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // State
  const [greeting, setGreeting] = useState('');
  const [aiMessage, setAiMessage] = useState('How can I help you today?');
  const [orbState, setOrbState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [stats, setStats] = useState({
    taskCount: 0,
    streakDays: 0,
    rank: 0,
  });
  
  // Get time-based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    const name = user?.name?.split(' ')[0] || 'there';
    
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good afternoon';
    } else if (hour >= 17) {
      timeGreeting = 'Good evening';
    }
    
    setGreeting(`${timeGreeting}, ${name}`);
  }, [user]);
  
  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch task count
        const tasksResponse = await api.get('/tasks?status=pending');
        const taskCount = tasksResponse.data?.tasks?.length || 0;
        
        // Fetch user profile for streak
        const profileResponse = await api.get('/users/profile');
        const streakDays = profileResponse.data?.user?.streakDays || 0;
        
        setStats({
          taskCount,
          streakDays,
          rank: Math.floor(Math.random() * 10) + 1, // Placeholder
        });
      } catch (error) {
        console.log('Error fetching stats:', error);
      }
    };
    
    fetchStats();
  }, []);
  
  // Handle orb press
  const handleOrbPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setOrbState('listening');
  }, []);
  
  // Handle voice input
  const handleVoiceInput = useCallback((text: string) => {
    setOrbState('processing');
    // TODO: Send to AI
    setTimeout(() => {
      setAiMessage(`I heard: "${text}"`);
      setOrbState('speaking');
      setTimeout(() => setOrbState('idle'), 2000);
    }, 1000);
  }, []);
  
  // Handle input submission (text or voice)
  const handleInputSubmit = useCallback(async (text: string, isVoice: boolean) => {
    setOrbState('processing');
    
    // Parse intent locally
    const parsedIntent = parseIntent(text);
    
    // Execute the intent
    const result = await executeIntent(parsedIntent, {
      speak: isVoice,
      navigate: (target) => {
        switch (target) {
          case 'tasks':
            onNavigateToTasks?.();
            break;
          case 'social':
            onNavigateToSocial?.();
            break;
          case 'profile':
            onNavigateToProfile?.();
            break;
          case 'focus':
            onOpenFocus?.();
            break;
        }
      },
    });
    
    setAiMessage(result.message);
    setOrbState(isVoice ? 'speaking' : 'idle');
    
    // Return to idle after speaking
    if (isVoice) {
      setTimeout(() => setOrbState('idle'), 3000);
    }
  }, [onNavigateToTasks, onNavigateToSocial, onNavigateToProfile, onOpenFocus]);
  
  // Quick action handlers
  const handleStartFocus = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onOpenFocus?.();
  }, [onOpenFocus]);
  
  const handleAddTask = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNavigateToTasks?.();
  }, [onNavigateToTasks]);
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Swipe hints (shown on first 3 sessions) */}
      <SwipeHints visible={true} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>
        
        {/* AI Orb */}
        <View style={styles.orbContainer}>
          <AIOrb
            state={orbState}
            size="large"
            onPress={handleOrbPress}
          />
        </View>
        
        {/* AI Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.aiMessage}>{aiMessage}</Text>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleStartFocus}
            activeOpacity={0.7}
          >
            <Ionicons name="play" size={18} color={colors.text.primary} />
            <Text style={styles.actionButtonText}>Focus</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddTask}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={colors.text.primary} />
            <Text style={styles.actionButtonText}>Task</Text>
          </TouchableOpacity>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={onNavigateToTasks}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.statValue}>{stats.taskCount}</Text>
            <Text style={styles.statLabel}>tasks</Text>
          </TouchableOpacity>
          
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Ionicons name="flame" size={20} color={colors.brand.primary} />
            <Text style={styles.statValue}>{stats.streakDays}</Text>
            <Text style={styles.statLabel}>days</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={onNavigateToSocial}
            activeOpacity={0.7}
          >
            <Ionicons name="trophy-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.statValue}>#{stats.rank}</Text>
            <Text style={styles.statLabel}>rank</Text>
          </TouchableOpacity>
        </View>
        
        {/* Daily Briefing Card */}
        <View style={styles.briefingContainer}>
          <DailyBriefingCard />
        </View>
      </ScrollView>
      
      {/* Dual Input Bar (fixed at bottom) */}
      <View style={[styles.inputBarContainer, { paddingBottom: insets.bottom + 16 }]}>
        <DualInputBar
          onSubmit={handleInputSubmit}
          placeholder="Ask Mylo anything..."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.black,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for input bar
  },
  greetingContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  greeting: {
    fontSize: theme.typography.title1.fontSize,
    fontWeight: theme.typography.title1.fontWeight as any,
    lineHeight: theme.typography.title1.lineHeight,
    color: colors.text.primary,
    textAlign: 'center',
  },
  orbContainer: {
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  aiMessage: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.body.fontWeight as any,
    lineHeight: theme.typography.body.lineHeight,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: 120,
    height: 48,
    backgroundColor: colors.background.surface2,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.background.surface3,
  },
  actionButtonText: {
    fontSize: theme.typography.callout.fontSize,
    fontWeight: theme.typography.callout.fontWeight as any,
    color: colors.text.primary,
  },
  statsContainer: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  statCard: {
    width: 80,
    height: 80,
    backgroundColor: colors.background.surface2,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statCardHighlight: {
    borderWidth: 1,
    borderColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  briefingContainer: {
    marginTop: 24,
    marginHorizontal: -20, // Offset padding to go full width
  },
  inputBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    backgroundColor: colors.background.black,
  },
});

export default AIHomeScreen;
