import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FocusSession } from '../types';
import { formatTimer } from '../utils';
import { styles } from '../styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SessionSummaryModalProps {
  session: FocusSession | null;
  onClose: () => void;
}

// Confetti particle component
const Confetti = ({ delay, color, startX }: { delay: number; color: string; startX: number }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const endX = startX + (Math.random() - 0.5) * 100;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 600,
          duration: 2500 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: endX,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]),
    ]);
    animation.start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: color,
        transform: [
          { translateX },
          { translateY },
          { rotate: rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
        ],
        opacity,
      }}
    />
  );
};

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  session,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;
  const xpSlide = useRef(new Animated.Value(30)).current;
  
  const confettiColors = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6'];
  
  useEffect(() => {
    if (session) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Emoji bounce
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(emojiScale, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
      
      // XP slide in
      Animated.sequence([
        Animated.delay(400),
        Animated.spring(xpSlide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [session]);

  if (!session) return null;
  
  const wasCompleted = session.wasCompleted;
  const xpEarned = wasCompleted ? Math.round(session.elapsedSeconds / 60) * 10 : Math.round(session.elapsedSeconds / 60) * 5;
  const isGreatSession = session.percentComplete >= 100;
  
  const getMessage = () => {
    if (isGreatSession) return "You crushed it! 🔥";
    if (session.percentComplete >= 75) return "Almost perfect!";
    if (session.percentComplete >= 50) return "Good progress!";
    if (wasCompleted) return "Task complete!";
    return "Every bit counts";
  };
  
  return (
    <Modal visible={!!session} animationType="fade" transparent>
      <View style={styles.celebrationOverlay}>
        {/* Confetti */}
        {wasCompleted && Array.from({ length: 30 }).map((_, i) => (
          <Confetti 
            key={i} 
            delay={i * 50} 
            color={confettiColors[i % confettiColors.length]}
            startX={Math.random() * SCREEN_WIDTH}
          />
        ))}
        
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        
        <Animated.View 
          style={[
            styles.celebrationCard,
            { 
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={wasCompleted ? ['#059669', '#10b981', '#34d399'] : ['#475569', '#64748b', '#94a3b8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.celebrationHeader}
          >
            {/* Big emoji */}
            <Animated.Text 
              style={[
                styles.celebrationEmoji,
                { transform: [{ scale: emojiScale }] }
              ]}
            >
              {wasCompleted ? (isGreatSession ? '🏆' : '✅') : '⏸️'}
            </Animated.Text>
            
            <Text style={styles.celebrationTitle}>
              {wasCompleted ? 'Session Complete!' : 'Session Paused'}
            </Text>
            <Text style={styles.celebrationMessage}>{getMessage()}</Text>
          </LinearGradient>
          
          <View style={styles.celebrationBody}>
            {/* Task name */}
            <Text style={styles.celebrationTaskName} numberOfLines={2}>
              {session.taskTitle}
            </Text>
            
            {/* XP Earned */}
            <Animated.View 
              style={[
                styles.xpEarnedBadge,
                { transform: [{ translateY: xpSlide }], opacity: opacityAnim }
              ]}
            >
              <Ionicons name="flash" size={18} color="#F59E0B" />
              <Text style={styles.xpEarnedText}>+{xpEarned} XP earned</Text>
            </Animated.View>
            
            {/* Stats */}
            <View style={styles.celebrationStats}>
              <View style={styles.celebrationStatItem}>
                <View style={styles.celebrationStatIcon}>
                  <Ionicons name="time-outline" size={20} color="#6366F1" />
                </View>
                <Text style={styles.celebrationStatValue}>{formatTimer(session.elapsedSeconds)}</Text>
                <Text style={styles.celebrationStatLabel}>focused</Text>
              </View>
              
              <View style={styles.celebrationStatDivider} />
              
              <View style={styles.celebrationStatItem}>
                <View style={styles.celebrationStatIcon}>
                  <Ionicons name="trending-up-outline" size={20} color="#10B981" />
                </View>
                <Text style={styles.celebrationStatValue}>{session.percentComplete}%</Text>
                <Text style={styles.celebrationStatLabel}>complete</Text>
              </View>
            </View>
            
            {/* Action button */}
            <TouchableOpacity 
              style={styles.celebrationButton} 
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.celebrationButtonText}>
                {wasCompleted ? "Keep Going!" : "Got it"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
