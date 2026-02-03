/**
 * Mylo Enhanced Onboarding Flow
 * 
 * A delightful, personalized onboarding experience that:
 * 1. Collects user preferences (persona, schedule, goals)
 * 2. Shows the "magic moment" with brain dump → organized tasks
 * 3. Explains key features progressively
 * 4. Gets notification permissions at the right moment
 * 
 * Based on MYLO_DESIGN_SPECIFICATION.md Section 15
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { userApi, eventsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==========================================
// TYPES
// ==========================================

type OnboardingStep = 
  | 'welcome'
  | 'persona'
  | 'schedule'
  | 'goals'
  | 'brain_dump'
  | 'magic_moment'
  | 'features'
  | 'notifications'
  | 'complete';

interface PersonaOption {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
}

interface SchedulePreference {
  wakeTime: string;
  sleepTime: string;
  productiveHours: 'morning' | 'afternoon' | 'evening';
  workDays: number[];
}

interface GoalOption {
  id: string;
  title: string;
  emoji: string;
  selected: boolean;
}

interface OnboardingState {
  persona: string | null;
  schedule: SchedulePreference;
  goals: string[];
  brainDumpText: string;
}

// ==========================================
// CONSTANTS
// ==========================================

const PERSONAS: PersonaOption[] = [
  {
    id: 'student',
    title: 'Student',
    description: 'Classes, assignments, study sessions',
    emoji: '📚',
    color: '#3B82F6',
  },
  {
    id: 'professional',
    title: 'Professional',
    description: 'Work projects, meetings, deadlines',
    emoji: '💼',
    color: '#8B5CF6',
  },
  {
    id: 'entrepreneur',
    title: 'Entrepreneur',
    description: 'Business growth, multiple priorities',
    emoji: '🚀',
    color: '#EC4899',
  },
  {
    id: 'creative',
    title: 'Creative',
    description: 'Projects, inspiration, flow states',
    emoji: '🎨',
    color: '#F59E0B',
  },
  {
    id: 'parent',
    title: 'Parent',
    description: 'Family, work-life balance',
    emoji: '👨‍👩‍👧',
    color: '#10B981',
  },
  {
    id: 'wellness',
    title: 'Wellness Focused',
    description: 'Health, fitness, mindfulness',
    emoji: '🧘',
    color: '#06B6D4',
  },
];

const GOAL_OPTIONS: GoalOption[] = [
  { id: 'productivity', title: 'Be more productive', emoji: '⚡', selected: false },
  { id: 'organized', title: 'Get organized', emoji: '📋', selected: false },
  { id: 'stress', title: 'Reduce stress', emoji: '😌', selected: false },
  { id: 'habits', title: 'Build better habits', emoji: '🎯', selected: false },
  { id: 'balance', title: 'Work-life balance', emoji: '⚖️', selected: false },
  { id: 'focus', title: 'Improve focus', emoji: '🧠', selected: false },
  { id: 'time', title: 'Save time', emoji: '⏰', selected: false },
  { id: 'achieve', title: 'Achieve goals', emoji: '🏆', selected: false },
];

const PRODUCTIVE_HOURS = [
  { id: 'morning', label: 'Morning', emoji: '🌅', timeRange: '6am - 12pm' },
  { id: 'afternoon', label: 'Afternoon', emoji: '☀️', timeRange: '12pm - 6pm' },
  { id: 'evening', label: 'Evening', emoji: '🌙', timeRange: '6pm - 12am' },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

interface EnhancedOnboardingProps {
  onComplete: () => void;
  navigation?: any;
}

export function EnhancedOnboardingScreen({ onComplete, navigation }: EnhancedOnboardingProps) {
  const { user, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [state, setState] = useState<OnboardingState>({
    persona: null,
    schedule: {
      wakeTime: '07:00',
      sleepTime: '23:00',
      productiveHours: 'morning',
      workDays: [1, 2, 3, 4, 5], // Mon-Fri
    },
    goals: [],
    brainDumpText: '',
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const STEPS: OnboardingStep[] = [
    'welcome',
    'persona', 
    'schedule',
    'goals',
    'brain_dump',
    'magic_moment',
    'features',
    'notifications',
    'complete',
  ];

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = (currentStepIndex + 1) / STEPS.length;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Update progress bar
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const goToNextStep = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < STEPS.length) {
        setCurrentStep(STEPS[nextIndex]);
        slideAnim.setValue(50);
      }
    });
  }, [currentStep, currentStepIndex]);

  const goToPrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(STEPS[currentStepIndex - 1]);
        slideAnim.setValue(50);
      });
    }
  }, [currentStepIndex]);

  const handleComplete = async () => {
    try {
      // Save preferences to backend
      await userApi.updateSettings({
        persona: state.persona,
        goals: state.goals,
        productiveHours: state.schedule.productiveHours,
      });

      // Mark onboarding complete
      await userApi.completeOnboarding();

      // Log event
      eventsApi.log('onboarding_completed', {
        persona: state.persona,
        goalsCount: state.goals.length,
        productiveHours: state.schedule.productiveHours,
      });

      // Refresh user data
      await refreshUser();

      // Navigate to main app
      onComplete();
    } catch (error) {
      console.error('Onboarding completion error:', error);
      onComplete(); // Continue anyway
    }
  };

  // ==========================================
  // RENDER STEP CONTENT
  // ==========================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onNext={goToNextStep} />;
      case 'persona':
        return (
          <PersonaStep
            selected={state.persona}
            onSelect={(persona) => {
              setState(prev => ({ ...prev, persona }));
              goToNextStep();
            }}
          />
        );
      case 'schedule':
        return (
          <ScheduleStep
            schedule={state.schedule}
            onUpdate={(schedule) => setState(prev => ({ ...prev, schedule }))}
            onNext={goToNextStep}
          />
        );
      case 'goals':
        return (
          <GoalsStep
            selectedGoals={state.goals}
            onUpdate={(goals) => setState(prev => ({ ...prev, goals }))}
            onNext={goToNextStep}
          />
        );
      case 'brain_dump':
        return (
          <BrainDumpStep
            text={state.brainDumpText}
            onUpdate={(text) => setState(prev => ({ ...prev, brainDumpText: text }))}
            onNext={goToNextStep}
          />
        );
      case 'magic_moment':
        return <MagicMomentStep brainDumpText={state.brainDumpText} onNext={goToNextStep} />;
      case 'features':
        return <FeaturesStep onNext={goToNextStep} />;
      case 'notifications':
        return <NotificationsStep onNext={goToNextStep} />;
      case 'complete':
        return <CompleteStep userName={user?.name || ''} onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Progress Bar */}
        {currentStep !== 'welcome' && currentStep !== 'complete' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentStepIndex} of {STEPS.length - 2}
            </Text>
          </View>
        )}

        {/* Back Button */}
        {currentStepIndex > 1 && currentStep !== 'complete' && (
          <TouchableOpacity style={styles.backButton} onPress={goToPrevStep}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Step Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {renderStepContent()}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ==========================================
// STEP COMPONENTS
// ==========================================

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  return (
    <View style={styles.stepContainer}>
      {/* Mylo Orb */}
      <Animated.View
        style={[
          styles.orbContainer,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Animated.View
          style={[
            styles.orbGlow,
            { opacity: glowAnim },
          ]}
        />
        <View style={styles.orb}>
          <Text style={styles.orbEmoji}>✨</Text>
        </View>
      </Animated.View>

      <Text style={styles.welcomeTitle}>Welcome to Mylo</Text>
      <Text style={styles.welcomeSubtitle}>
        Your AI-powered life organizer that learns how you work and helps you get things done.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
        <Text style={styles.primaryButtonText}>Let's Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Takes about 2 minutes to personalize your experience
      </Text>
    </View>
  );
}

function PersonaStep({ 
  selected, 
  onSelect 
}: { 
  selected: string | null; 
  onSelect: (persona: string) => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What best describes you?</Text>
      <Text style={styles.stepSubtitle}>
        This helps Mylo understand your typical day
      </Text>

      <ScrollView 
        style={styles.optionsScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.personaGrid}>
          {PERSONAS.map((persona) => (
            <TouchableOpacity
              key={persona.id}
              style={[
                styles.personaCard,
                selected === persona.id && styles.personaCardSelected,
                { borderColor: selected === persona.id ? persona.color : 'rgba(255,255,255,0.1)' },
              ]}
              onPress={() => onSelect(persona.id)}
            >
              <Text style={styles.personaEmoji}>{persona.emoji}</Text>
              <Text style={styles.personaTitle}>{persona.title}</Text>
              <Text style={styles.personaDescription}>{persona.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ScheduleStep({
  schedule,
  onUpdate,
  onNext,
}: {
  schedule: SchedulePreference;
  onUpdate: (schedule: SchedulePreference) => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>When are you most productive?</Text>
      <Text style={styles.stepSubtitle}>
        Mylo will suggest the best times for focused work
      </Text>

      <View style={styles.productiveHoursContainer}>
        {PRODUCTIVE_HOURS.map((hour) => (
          <TouchableOpacity
            key={hour.id}
            style={[
              styles.hourCard,
              schedule.productiveHours === hour.id && styles.hourCardSelected,
            ]}
            onPress={() => onUpdate({ ...schedule, productiveHours: hour.id as any })}
          >
            <Text style={styles.hourEmoji}>{hour.emoji}</Text>
            <Text style={styles.hourLabel}>{hour.label}</Text>
            <Text style={styles.hourRange}>{hour.timeRange}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

function GoalsStep({
  selectedGoals,
  onUpdate,
  onNext,
}: {
  selectedGoals: string[];
  onUpdate: (goals: string[]) => void;
  onNext: () => void;
}) {
  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      onUpdate(selectedGoals.filter(g => g !== goalId));
    } else if (selectedGoals.length < 3) {
      onUpdate([...selectedGoals, goalId]);
    }
    Haptics.selectionAsync();
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What do you want to achieve?</Text>
      <Text style={styles.stepSubtitle}>
        Select up to 3 goals (you can change these later)
      </Text>

      <View style={styles.goalsGrid}>
        {GOAL_OPTIONS.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);
          return (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalChip,
                isSelected && styles.goalChipSelected,
              ]}
              onPress={() => toggleGoal(goal.id)}
            >
              <Text style={styles.goalEmoji}>{goal.emoji}</Text>
              <Text style={[
                styles.goalText,
                isSelected && styles.goalTextSelected,
              ]}>
                {goal.title}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={18} color="#8B5CF6" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity 
        style={[
          styles.primaryButton,
          selectedGoals.length === 0 && styles.primaryButtonDisabled,
        ]} 
        onPress={onNext}
        disabled={selectedGoals.length === 0}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

function BrainDumpStep({
  text,
  onUpdate,
  onNext,
}: {
  text: string;
  onUpdate: (text: string) => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's on your mind?</Text>
      <Text style={styles.stepSubtitle}>
        Tell Mylo everything you need to do. Don't hold back!
      </Text>

      <View style={styles.brainDumpInput}>
        <BlurView intensity={30} tint="dark" style={styles.inputBlur}>
          <ScrollView style={styles.inputScroll}>
            <Text style={styles.inputPlaceholder}>
              Example: "Call mom, finish project report, buy groceries, schedule dentist appointment, gym at 6pm..."
            </Text>
          </ScrollView>
        </BlurView>
      </View>

      <View style={styles.brainDumpActions}>
        <TouchableOpacity style={styles.skipButton} onPress={onNext}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Organize It</Text>
          <Ionicons name="sparkles" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MagicMomentStep({ 
  brainDumpText, 
  onNext 
}: { 
  brainDumpText: string;
  onNext: () => void;
}) {
  // This would show the AI organizing the brain dump
  // For now, show a simplified version
  
  return (
    <View style={styles.stepContainer}>
      <View style={styles.magicContainer}>
        <Text style={styles.magicEmoji}>✨</Text>
        <Text style={styles.magicTitle}>Magic in Progress</Text>
        <Text style={styles.magicSubtitle}>
          Mylo is organizing your thoughts...
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
        <Text style={styles.primaryButtonText}>See the Results</Text>
      </TouchableOpacity>
    </View>
  );
}

function FeaturesStep({ onNext }: { onNext: () => void }) {
  const features = [
    { emoji: '🎤', title: 'Voice & Text', description: 'Talk or type - Mylo understands both' },
    { emoji: '🔄', title: 'Recurring Tasks', description: 'Set it once, never forget again' },
    { emoji: '📅', title: 'Smart Scheduling', description: 'AI suggests the best times' },
    { emoji: '🏆', title: 'Achievements', description: 'Gamified progress tracking' },
  ];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Mylo's Superpowers</Text>
      
      <View style={styles.featuresGrid}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <Text style={styles.featureEmoji}>{feature.emoji}</Text>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
        <Text style={styles.primaryButtonText}>Almost Done</Text>
      </TouchableOpacity>
    </View>
  );
}

function NotificationsStep({ onNext }: { onNext: () => void }) {
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermission = async () => {
    // In a real implementation, this would request notification permissions
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPermissionGranted(true);
    setTimeout(onNext, 500);
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.notificationIcon}>
        <Ionicons name="notifications" size={48} color="#8B5CF6" />
      </View>

      <Text style={styles.stepTitle}>Stay on Track</Text>
      <Text style={styles.stepSubtitle}>
        Get timely reminders and daily briefs to never miss what matters
      </Text>

      <View style={styles.notificationFeatures}>
        <View style={styles.notifFeature}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.notifFeatureText}>Task reminders</Text>
        </View>
        <View style={styles.notifFeature}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.notifFeatureText}>Morning briefings</Text>
        </View>
        <View style={styles.notifFeature}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.notifFeatureText}>Streak alerts</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
        <Text style={styles.primaryButtonText}>Enable Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={onNext}>
        <Text style={styles.skipButtonText}>Maybe Later</Text>
      </TouchableOpacity>
    </View>
  );
}

function CompleteStep({ 
  userName, 
  onComplete 
}: { 
  userName: string;
  onComplete: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.stepContainer}>
      <Animated.View
        style={[
          styles.completeIcon,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.completeEmoji}>🎉</Text>
      </Animated.View>

      <Text style={styles.completeTitle}>
        You're All Set{userName ? `, ${userName}` : ''}!
      </Text>
      <Text style={styles.completeSubtitle}>
        Mylo is ready to help you conquer your day
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={onComplete}>
        <Text style={styles.primaryButtonText}>Let's Go!</Text>
        <Ionicons name="rocket" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    padding: 8,
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  
  // Welcome Step
  orbContainer: {
    marginBottom: 32,
  },
  orbGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#8B5CF6',
    top: -25,
    left: -25,
  },
  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  orbEmoji: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 24,
  },

  // Step Common
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 32,
  },

  // Persona Step
  optionsScroll: {
    flex: 1,
    width: '100%',
  },
  personaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  personaCard: {
    width: (SCREEN_WIDTH - 64) / 2,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  personaCardSelected: {
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  personaEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  personaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  personaDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },

  // Schedule Step
  productiveHoursContainer: {
    width: '100%',
    marginBottom: 32,
  },
  hourCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  hourCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  hourEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  hourLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  hourRange: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },

  // Goals Step
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 32,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  goalChipSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  goalEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  goalText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginRight: 4,
  },
  goalTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },

  // Brain Dump Step
  brainDumpInput: {
    width: '100%',
    height: 200,
    marginBottom: 24,
  },
  inputBlur: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
  inputScroll: {
    flex: 1,
  },
  inputPlaceholder: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 22,
  },
  brainDumpActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Magic Moment Step
  magicContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  magicEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  magicTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  magicSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },

  // Features Step
  featuresGrid: {
    width: '100%',
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    flex: 1,
  },

  // Notifications Step
  notificationIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139,92,246,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  notificationFeatures: {
    marginBottom: 32,
  },
  notifFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notifFeatureText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },

  // Complete Step
  completeIcon: {
    marginBottom: 24,
  },
  completeEmoji: {
    fontSize: 80,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  completeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 48,
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    minWidth: 200,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
  skipButton: {
    padding: 16,
    marginTop: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
});

export default EnhancedOnboardingScreen;
