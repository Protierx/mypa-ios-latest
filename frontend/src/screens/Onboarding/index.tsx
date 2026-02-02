/**
 * MYPA Onboarding - The Magic Moment
 * 
 * This is where new users experience the "holy shit" moment.
 * They brain dump their chaos → AI organizes it → Instant value.
 * 
 * Flow:
 * 1. Welcome with MYPA orb
 * 2. Ask "What's on your mind?" 
 * 3. User voice/text dumps everything
 * 4. AI processes and organizes
 * 5. Show organized tasks with categories
 * 6. "Add to my plan" → Hub
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mic,
  Send,
  Sparkles,
  Check,
  ChevronRight,
  Brain,
  Target,
  Clock,
  Briefcase,
  Heart,
  ShoppingBag,
  Dumbbell,
  Home,
  Plus,
} from 'lucide-react-native';
import { MYPAOrb } from '../../components/MYPAOrb';
import { brainDumpApi, userApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// Stages of onboarding
type OnboardingStage = 'welcome' | 'listening' | 'processing' | 'results' | 'complete';

interface OrganizedTask {
  id: string;
  title: string;
  category: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  duration: number;
  icon: any;
  color: string;
  selected: boolean;
}

interface OnboardingScreenProps {
  onComplete: () => void;
  navigation?: any;
}

export function OnboardingScreen({ onComplete, navigation }: OnboardingScreenProps) {
  const { user, refreshUser } = useAuth();
  const [stage, setStage] = useState<OnboardingStage>('welcome');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [organizedTasks, setOrganizedTasks] = useState<OrganizedTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('Understanding your thoughts...');
  const [totalTime, setTotalTime] = useState(0);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const orbPulse = useRef(new Animated.Value(1)).current;
  const orbGlow = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Initial animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Orb breathing animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, {
          toValue: 1.08,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orbPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(orbGlow, {
          toValue: 0.7,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(orbGlow, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulse.start();
    glow.start();
    
    return () => {
      pulse.stop();
      glow.stop();
    };
  }, []);

  // Get category icon and color
  const getCategoryConfig = (category: string): { icon: any; color: string } => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('work') || categoryLower.includes('business')) {
      return { icon: Briefcase, color: '#3b82f6' };
    }
    if (categoryLower.includes('health') || categoryLower.includes('medical')) {
      return { icon: Heart, color: '#ef4444' };
    }
    if (categoryLower.includes('fitness') || categoryLower.includes('exercise') || categoryLower.includes('gym')) {
      return { icon: Dumbbell, color: '#f59e0b' };
    }
    if (categoryLower.includes('shopping') || categoryLower.includes('errand') || categoryLower.includes('groceries')) {
      return { icon: ShoppingBag, color: '#10b981' };
    }
    if (categoryLower.includes('home') || categoryLower.includes('house')) {
      return { icon: Home, color: '#8b5cf6' };
    }
    return { icon: Target, color: '#6366f1' };
  };

  // Handle starting the brain dump
  const handleStartListening = () => {
    setStage('listening');
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  // Handle submitting the brain dump
  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    
    setStage('processing');
    setIsProcessing(true);
    
    // Animate progress
    const processingMessages = [
      'Understanding your thoughts...',
      'Organizing by category...',
      'Finding the best approach...',
      'Creating your action plan...',
    ];
    
    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % processingMessages.length;
      setProcessingText(processingMessages[msgIndex]);
    }, 1200);
    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 4000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    
    try {
      // Send to brain dump API with auto-process
      const response = await brainDumpApi.create(inputText, true);
      
      clearInterval(interval);
      
      if (response.success && response.data) {
        // Parse the AI response into tasks
        const suggestion = response.data.suggestion;
        
        // Create organized tasks from the response
        // If we have a multi-item dump, split and process
        let tasks: OrganizedTask[] = [];
        
        if (suggestion) {
          const config = getCategoryConfig(suggestion.category || 'Personal');
          tasks.push({
            id: response.data.id,
            title: suggestion.suggestedTitle || inputText.slice(0, 50),
            category: suggestion.category || 'Personal',
            priority: suggestion.priority || 'NORMAL',
            duration: suggestion.suggestedDuration || 30,
            icon: config.icon,
            color: config.color,
            selected: true,
          });
        } else {
          // Parse the input manually if AI didn't process
          const items = inputText.split(/[,\n]/).filter(item => item.trim());
          tasks = items.map((item, index) => {
            const config = getCategoryConfig(item);
            return {
              id: `temp-${index}`,
              title: item.trim(),
              category: 'Personal',
              priority: 'NORMAL' as const,
              duration: 30,
              icon: config.icon,
              color: config.color,
              selected: true,
            };
          });
        }
        
        // Calculate total time
        const total = tasks.reduce((sum, t) => sum + t.duration, 0);
        setTotalTime(total);
        setOrganizedTasks(tasks);
        
        // Small delay for drama
        setTimeout(() => {
          setIsProcessing(false);
          setStage('results');
        }, 500);
      } else {
        // Fallback: parse manually
        clearInterval(interval);
        const items = inputText.split(/[,\n]/).filter(item => item.trim());
        const tasks = items.map((item, index) => {
          const config = getCategoryConfig(item);
          return {
            id: `temp-${index}`,
            title: item.trim(),
            category: 'Personal',
            priority: 'NORMAL' as const,
            duration: 30,
            icon: config.icon,
            color: config.color,
            selected: true,
          };
        });
        
        setTotalTime(tasks.length * 30);
        setOrganizedTasks(tasks);
        setTimeout(() => {
          setIsProcessing(false);
          setStage('results');
        }, 500);
      }
    } catch (error) {
      console.error('Brain dump failed:', error);
      clearInterval(interval);
      
      // Fallback: create basic tasks from input
      const items = inputText.split(/[,\n]/).filter(item => item.trim());
      const tasks = items.map((item, index) => {
        const config = getCategoryConfig(item);
        return {
          id: `temp-${index}`,
          title: item.trim(),
          category: 'Personal',
          priority: 'NORMAL' as const,
          duration: 30,
          icon: config.icon,
          color: config.color,
          selected: true,
        };
      });
      
      setTotalTime(tasks.length * 30);
      setOrganizedTasks(tasks);
      setTimeout(() => {
        setIsProcessing(false);
        setStage('results');
      }, 500);
    }
  };

  // Toggle task selection
  const toggleTask = (id: string) => {
    setOrganizedTasks(prev => 
      prev.map(task => 
        task.id === id ? { ...task, selected: !task.selected } : task
      )
    );
  };

  // Handle completing onboarding
  const handleComplete = async () => {
    setStage('complete');
    
    try {
      // Mark user as onboarded
      await userApi.completeOnboarding();
      await refreshUser();
      
      // Convert selected tasks to actual tasks
      const selectedTasks = organizedTasks.filter(t => t.selected);
      for (const task of selectedTasks) {
        if (!task.id.startsWith('temp-')) {
          await brainDumpApi.convertToTask(task.id, {
            title: task.title,
            category: task.category,
            priority: task.priority,
            durationMin: task.duration,
          });
        }
      }
      
      // Small celebration delay
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      // Still proceed
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  // Skip to hub
  const handleSkip = async () => {
    try {
      await userApi.completeOnboarding();
      await refreshUser();
    } catch (error) {
      console.error('Skip failed:', error);
    }
    onComplete();
  };

  // Render based on stage
  const renderContent = () => {
    switch (stage) {
      case 'welcome':
        return (
          <Animated.View 
            style={[
              styles.stageContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {/* Orb with glow */}
            <Animated.View 
              style={[
                styles.orbContainer,
                { transform: [{ scale: orbPulse }] }
              ]}
            >
              <Animated.View 
                style={[
                  styles.orbGlow, 
                  { opacity: orbGlow }
                ]} 
              />
              <MYPAOrb size="xl" />
            </Animated.View>
            
            <Text style={styles.welcomeTitle}>
              Hey{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
            </Text>
            <Text style={styles.welcomeSubtitle}>
              I'm MYPA, your personal AI assistant.
            </Text>
            <Text style={styles.welcomeDescription}>
              Tell me what's on your mind, and I'll help organize your day.
            </Text>
            
            <Pressable 
              style={styles.primaryButton}
              onPress={handleStartListening}
            >
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Brain size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Let's Get Started</Text>
              </LinearGradient>
            </Pressable>
            
            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </Animated.View>
        );
        
      case 'listening':
        return (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.stageContainer}
          >
            <Animated.View 
              style={[
                styles.listeningContent,
                { transform: [{ translateY: slideAnim }] }
              ]}
            >
              {/* Small orb */}
              <Animated.View 
                style={[
                  styles.smallOrbContainer,
                  { transform: [{ scale: orbPulse }] }
                ]}
              >
                <MYPAOrb size="md" />
              </Animated.View>
              
              <Text style={styles.promptTitle}>
                What's on your mind?
              </Text>
              <Text style={styles.promptSubtitle}>
                Brain dump everything — tasks, thoughts, worries. I'll organize it all.
              </Text>
              
              {/* Input area */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Call the dentist, finish that report, buy groceries, pay rent, gym..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline
                  value={inputText}
                  onChangeText={setInputText}
                  autoFocus
                />
              </View>
              
              {/* Example suggestions */}
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsLabel}>Examples:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {[
                    "Schedule dentist appointment",
                    "Finish project report",
                    "Buy groceries",
                    "Call mom",
                    "Go to gym"
                  ].map((example, i) => (
                    <Pressable 
                      key={i}
                      style={styles.suggestionChip}
                      onPress={() => setInputText(prev => prev ? `${prev}, ${example}` : example)}
                    >
                      <Plus size={12} color="#8b5cf6" />
                      <Text style={styles.suggestionText}>{example}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              
              {/* Action buttons */}
              <View style={styles.actionButtons}>
                <Pressable 
                  style={[
                    styles.sendButton,
                    !inputText.trim() && styles.sendButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={!inputText.trim()}
                >
                  <LinearGradient
                    colors={inputText.trim() ? ['#6366f1', '#8b5cf6'] : ['#4b5563', '#4b5563']}
                    style={styles.sendButtonGradient}
                  >
                    <Sparkles size={20} color="#fff" />
                    <Text style={styles.sendButtonText}>Organize with AI</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        );
        
      case 'processing':
        return (
          <View style={styles.stageContainer}>
            <Animated.View 
              style={[
                styles.processingContent,
                { transform: [{ scale: orbPulse }] }
              ]}
            >
              <MYPAOrb size="lg" />
            </Animated.View>
            
            <Text style={styles.processingTitle}>{processingText}</Text>
            
            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]}
              />
            </View>
          </View>
        );
        
      case 'results':
        const selectedCount = organizedTasks.filter(t => t.selected).length;
        const selectedTime = organizedTasks.filter(t => t.selected).reduce((sum, t) => sum + t.duration, 0);
        
        return (
          <View style={styles.stageContainer}>
            <View style={styles.resultsHeader}>
              <Sparkles size={24} color="#10b981" />
              <Text style={styles.resultsTitle}>Got it! Here's your plan:</Text>
            </View>
            
            <Text style={styles.resultsSummary}>
              {organizedTasks.length} task{organizedTasks.length !== 1 ? 's' : ''} • {formatDuration(totalTime)} total
            </Text>
            
            <ScrollView 
              style={styles.tasksScroll}
              showsVerticalScrollIndicator={false}
            >
              {organizedTasks.map((task, index) => {
                const IconComponent = task.icon;
                return (
                  <Pressable
                    key={task.id}
                    style={[
                      styles.taskCard,
                      task.selected && styles.taskCardSelected
                    ]}
                    onPress={() => toggleTask(task.id)}
                  >
                    <View style={[styles.taskIcon, { backgroundColor: `${task.color}20` }]}>
                      <IconComponent size={20} color={task.color} />
                    </View>
                    
                    <View style={styles.taskContent}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <View style={styles.taskMeta}>
                        <Text style={styles.taskCategory}>{task.category}</Text>
                        <View style={styles.taskDot} />
                        <Clock size={12} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.taskDuration}>{task.duration}min</Text>
                      </View>
                    </View>
                    
                    <View style={[
                      styles.taskCheck,
                      task.selected && styles.taskCheckSelected
                    ]}>
                      {task.selected && <Check size={14} color="#fff" />}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            
            <View style={styles.resultsFooter}>
              <Text style={styles.selectedInfo}>
                {selectedCount} selected • {formatDuration(selectedTime)}
              </Text>
              
              <Pressable 
                style={styles.addToPlanButton}
                onPress={handleComplete}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.addToPlanGradient}
                >
                  <Text style={styles.addToPlanText}>Add to My Plan</Text>
                  <ChevronRight size={20} color="#fff" />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        );
        
      case 'complete':
        return (
          <View style={styles.stageContainer}>
            <Animated.View 
              style={[
                styles.completeContent,
                { transform: [{ scale: orbPulse }] }
              ]}
            >
              <View style={styles.completeIcon}>
                <Check size={48} color="#10b981" />
              </View>
            </Animated.View>
            
            <Text style={styles.completeTitle}>You're all set! 🎉</Text>
            <Text style={styles.completeSubtitle}>
              Your tasks are ready. Let's crush it!
            </Text>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#312e81']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {renderContent()}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

// Format duration in human readable
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  stageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  
  // Welcome stage
  orbContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#8b5cf6',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  primaryButton: {
    width: '100%',
    marginBottom: 16,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  
  // Listening stage
  listeningContent: {
    flex: 1,
    width: '100%',
    paddingTop: 40,
  },
  smallOrbContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  promptTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  promptSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  textInput: {
    fontSize: 16,
    color: '#fff',
    padding: 16,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionsLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139,92,246,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  suggestionText: {
    fontSize: 13,
    color: '#c4b5fd',
  },
  actionButtons: {
    marginTop: 'auto',
    marginBottom: 24,
  },
  sendButton: {
    width: '100%',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 10,
  },
  sendButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Processing stage
  processingContent: {
    marginBottom: 32,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  
  // Results stage
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  resultsSummary: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
  },
  tasksScroll: {
    flex: 1,
    width: '100%',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  taskCardSelected: {
    borderColor: 'rgba(139,92,246,0.4)',
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  taskIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskCategory: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  taskDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  taskDuration: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  taskCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckSelected: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  resultsFooter: {
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  selectedInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 12,
  },
  addToPlanButton: {
    width: '100%',
  },
  addToPlanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
  },
  addToPlanText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Complete stage
  completeContent: {
    marginBottom: 24,
  },
  completeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16,185,129,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});

export default OnboardingScreen;
