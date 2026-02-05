/**
 * AI Hub Screen
 * 
 * The heart of MYPA - the Living Background interface.
 * The entire screen IS the AI - you're stepping INTO MYPA's presence.
 * 
 * Tap anywhere to activate voice.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { LivingBackground, VoiceState } from '../../components/LivingBackground';
import { VoiceFeedback } from '../../components/VoiceFeedback';
import { VoicePermissions, useVoicePermissions } from '../../components/VoicePermissions';
import { useVoice } from '../../contexts/VoiceContext';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useTasks } from '../../hooks/supabase/useTasks';
import supabaseApi from '../../services/supabaseApi';

interface AIHubScreenProps {
  voiceState?: VoiceState;
  audioLevel?: number;
}

export function AIHubScreen({ voiceState: externalVoiceState, audioLevel: externalAudioLevel }: AIHubScreenProps) {
  const { user } = useSupabaseAuth();
  const { tasks } = useTasks('today');
  
  // Voice integration
  const voice = useVoice();
  const { 
    permissionStatus, 
    showPermissionModal, 
    requestPermissionIfNeeded, 
    hideModal,
    setShowPermissionModal 
  } = useVoicePermissions();
  
  // Use voice context state if available, otherwise fallback to props/local state
  const voiceState = voice.voiceState || externalVoiceState || 'idle';
  const audioLevel = voice.audioLevel || externalAudioLevel || 0;
  
  const [greeting, setGreeting] = useState('');
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(false);

  // Get today's date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Get time-based greeting
  const getTimeGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Hey there';
  };

  // Fetch AI greeting on mount
  useEffect(() => {
    const fetchGreeting = async () => {
      if (!user) return;
      
      setIsLoadingGreeting(true);
      try {
        const result = await supabaseApi.getGreeting();
        if (result?.greeting) {
          setGreeting(result.greeting);
        }
      } catch (error) {
        console.log('Using default greeting');
      } finally {
        setIsLoadingGreeting(false);
      }
    };

    fetchGreeting();
  }, [user]);

  // Tap handler for voice activation
  const handleTap = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (voiceState === 'idle') {
      // Check permissions first
      if (permissionStatus !== 'granted') {
        const hasPermission = await requestPermissionIfNeeded();
        if (!hasPermission) return;
      }
      
      // Start voice recording
      try {
        await voice.startListening();
      } catch (error) {
        console.error('Failed to start listening:', error);
        // If permission denied at runtime, show modal
        if (String(error).includes('permission')) {
          setShowPermissionModal(true);
        }
      }
    } else if (voiceState === 'listening') {
      // Stop listening and process
      try {
        await voice.stopListening();
      } catch (error) {
        console.error('Failed to stop listening:', error);
      }
    } else {
      // Cancel any ongoing voice activity
      voice.cancelListening();
      voice.stopSpeaking();
    }
  }, [voiceState, voice, permissionStatus, requestPermissionIfNeeded, setShowPermissionModal]);

  // Handle permission granted callback
  const handlePermissionGranted = useCallback(async () => {
    // Start listening after permission granted
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await voice.startListening();
    } catch (error) {
      console.error('Failed to start listening after permission:', error);
    }
  }, [voice]);

  // Handle permission denied callback
  const handlePermissionDenied = useCallback(() => {
    // User chose not to enable voice - that's okay
    console.log('Voice permission denied by user');
  }, []);

  // Calculate task stats
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  // Pulse animation for the tap hint
  const pulseScale = useSharedValue(1);
  
  useEffect(() => {
    if (voiceState === 'idle') {
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [voiceState]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const displayName = user?.name || user?.profile?.display_name || 'there';
  const displayGreeting = greeting || `${getTimeGreeting()}, ${displayName}!`;

  return (
    <View style={styles.container}>
      {/* Living Background */}
      <LivingBackground voiceState={voiceState} audioLevel={audioLevel} />
      
      {/* Tap Area - entire screen */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleTap}>
        <SafeAreaView style={styles.content}>
          {/* Top Section - Greeting */}
          <View style={styles.header}>
            <Animated.Text 
              entering={FadeIn.duration(500)} 
              style={styles.greeting}
            >
              {displayGreeting}
            </Animated.Text>
            <Text style={styles.date}>{dateString}</Text>
          </View>

          {/* Center Section - Voice State */}
          <View style={styles.center}>
            {voiceState === 'idle' && (
              <Animated.View style={[styles.tapHintContainer, pulseStyle]}>
                <View style={styles.tapCircle}>
                  <Ionicons name="mic-outline" size={32} color="rgba(255,255,255,0.8)" />
                </View>
                <Text style={styles.tapHint}>Tap anywhere to talk</Text>
              </Animated.View>
            )}
            
            {/* Voice Feedback Component - shows during active voice states */}
            {voiceState !== 'idle' && (
              <VoiceFeedback
                voiceState={voiceState}
                audioLevel={audioLevel}
                transcript={voice.transcript}
                aiResponse={voice.aiResponse}
                onCancel={() => {
                  voice.cancelListening();
                  voice.stopSpeaking();
                }}
              />
            )}
          </View>

          {/* Bottom Section - Context Cards */}
          <View style={styles.contextSection}>
            {/* Tasks Card */}
            <View style={styles.contextCard}>
              <View style={styles.cardRow}>
                <Ionicons name="checkbox-outline" size={18} color="#a855f7" />
                <Text style={styles.cardLabel}>Today's Tasks</Text>
              </View>
              <Text style={styles.cardValue}>
                {pendingTasks} pending{completedTasks > 0 ? ` · ${completedTasks} done` : ''}
              </Text>
            </View>

            {/* Streak Card */}
            {user?.currentStreak && user.currentStreak > 0 && (
              <View style={styles.contextCard}>
                <View style={styles.cardRow}>
                  <Ionicons name="flame" size={18} color="#f97316" />
                  <Text style={styles.cardLabel}>Streak</Text>
                </View>
                <Text style={styles.cardValue}>{user.currentStreak} days</Text>
              </View>
            )}

            {/* XP Card */}
            <View style={styles.contextCard}>
              <View style={styles.cardRow}>
                <Ionicons name="star" size={18} color="#eab308" />
                <Text style={styles.cardLabel}>Level {user?.level || 1}</Text>
              </View>
              <Text style={styles.cardValue}>{user?.xp || 0} XP</Text>
            </View>
          </View>
        </SafeAreaView>
      </Pressable>
      
      {/* Voice Permissions Modal */}
      <VoicePermissions
        visible={showPermissionModal}
        onClose={hideModal}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
  },
  greeting: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  date: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapHintContainer: {
    alignItems: 'center',
  },
  tapCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  tapHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 16,
  },
  stateContainer: {
    alignItems: 'center',
  },
  stateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  contextSection: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  contextCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  cardValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
});
