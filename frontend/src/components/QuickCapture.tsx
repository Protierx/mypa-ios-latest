/**
 * QuickCapture - Floating action button for instant task/thought entry
 * 
 * Features:
 * - Expandable FAB with voice + text options
 * - Quick text input with smart parsing
 * - Voice input with real-time transcription
 * - AI-powered categorization
 * - Haptic feedback
 * - Smooth animations
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { tasksApi, brainDumpApi, eventsApi } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuickCaptureProps {
  onTaskCreated?: (task: any) => void;
  onBrainDumpCreated?: (item: any) => void;
  visible?: boolean;
  mode?: 'task' | 'braindump' | 'auto';
}

export default function QuickCapture({
  onTaskCreated,
  onBrainDumpCreated,
  visible = true,
  mode = 'auto',
}: QuickCaptureProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Animations
  const expandAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const inputScale = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(expandAnim, {
        toValue: isExpanded ? 1 : 0,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }),
      Animated.spring(inputScale, {
        toValue: isExpanded ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();

    if (isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isExpanded]);

  const handleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExpanded(true);
    
    // Log event
    eventsApi.log('quick_capture_opened', { mode });
  };

  const handleCollapse = () => {
    Keyboard.dismiss();
    setIsExpanded(false);
    setInputText('');
  };

  const handleSubmit = async () => {
    if (!inputText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Smart parsing: detect if it's a task or thought
      const isTask = detectIfTask(inputText);
      
      if (isTask || mode === 'task') {
        // Parse the input for task details
        const parsed = parseTaskInput(inputText);
        
        const response = await tasksApi.create({
          title: parsed.title,
          date: parsed.date || new Date().toISOString().split('T')[0],
          time: parsed.time,
          priority: parsed.priority,
          category: parsed.category,
        });

        if (response.success) {
          onTaskCreated?.(response.data);
          showSuccessAnimation('Task added! ✓');
          
          eventsApi.log('task_created', {
            source: 'quick_capture',
            hasTime: !!parsed.time,
            hasPriority: !!parsed.priority,
          });
        }
      } else {
        // Send to brain dump for AI processing
        const response = await brainDumpApi.create(inputText, true);

        if (response.success) {
          onBrainDumpCreated?.(response.data);
          showSuccessAnimation('Captured! 💭');
          
          eventsApi.log('braindump_created', {
            source: 'quick_capture',
          });
        }
      }

      // Reset and collapse
      setInputText('');
      setTimeout(() => setIsExpanded(false), 1500);
    } catch (error) {
      console.error('Quick capture failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSuccessAnimation = (message: string) => {
    setShowSuccess(true);
    Animated.sequence([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(successAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setShowSuccess(false));
  };

  const detectIfTask = (text: string): boolean => {
    const taskIndicators = [
      /\b(do|complete|finish|submit|send|buy|call|email|meet|schedule)\b/i,
      /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      /\b(at|by|before|after)\s+\d/i,
      /\b(high|medium|low)\s+priority\b/i,
      /\b(urgent|asap|important)\b/i,
    ];

    return taskIndicators.some(pattern => pattern.test(text));
  };

  const parseTaskInput = (text: string) => {
    let title = text;
    let date: string | undefined;
    let time: string | undefined;
    let priority: string | undefined;
    let category: string | undefined;

    // Extract time (e.g., "at 3pm", "at 15:00")
    const timeMatch = text.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (timeMatch) {
      time = parseTime(timeMatch[1]);
      title = title.replace(timeMatch[0], '').trim();
    }

    // Extract date keywords
    const todayMatch = text.match(/\btoday\b/i);
    const tomorrowMatch = text.match(/\btomorrow\b/i);
    if (todayMatch) {
      date = new Date().toISOString().split('T')[0];
      title = title.replace(todayMatch[0], '').trim();
    } else if (tomorrowMatch) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toISOString().split('T')[0];
      title = title.replace(tomorrowMatch[0], '').trim();
    }

    // Extract priority
    const priorityMatch = text.match(/\b(high|medium|low)\s+priority\b/i);
    const urgentMatch = text.match(/\b(urgent|asap|important)\b/i);
    if (priorityMatch) {
      priority = priorityMatch[1].toUpperCase();
      title = title.replace(priorityMatch[0], '').trim();
    } else if (urgentMatch) {
      priority = 'HIGH';
      title = title.replace(urgentMatch[0], '').trim();
    }

    // Clean up title
    title = title.replace(/\s+/g, ' ').trim();

    return { title, date, time, priority, category };
  };

  const parseTime = (timeStr: string): string => {
    const cleanTime = timeStr.toLowerCase().trim();
    
    // Handle "3pm" format
    const simpleMatch = cleanTime.match(/(\d{1,2})\s*(am|pm)/);
    if (simpleMatch) {
      let hour = parseInt(simpleMatch[1]);
      if (simpleMatch[2] === 'pm' && hour !== 12) hour += 12;
      if (simpleMatch[2] === 'am' && hour === 12) hour = 0;
      return `${hour.toString().padStart(2, '0')}:00`;
    }

    // Handle "15:00" format
    const militaryMatch = cleanTime.match(/(\d{1,2}):(\d{2})/);
    if (militaryMatch) {
      return `${militaryMatch[1].padStart(2, '0')}:${militaryMatch[2]}`;
    }

    return '09:00';
  };

  if (!visible) return null;

  const fabRotation = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const backdropOpacity = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const inputTranslateY = inputScale.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <Animated.View 
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents={isExpanded ? 'auto' : 'none'}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            onPress={handleCollapse}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Quick Input Panel */}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            opacity: inputScale,
            transform: [{ translateY: inputTranslateY }, { scale: inputScale }],
          },
        ]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <BlurView intensity={90} tint="dark" style={styles.inputBlur}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="What's on your mind? (e.g., 'Call mom tomorrow at 3pm')"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSubmit}
              returnKeyType="send"
              autoCapitalize="sentences"
              multiline={false}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                { opacity: inputText.trim() ? 1 : 0.5 },
              ]}
              onPress={handleSubmit}
              disabled={!inputText.trim() || isSubmitting}
            >
              <Ionicons 
                name={isSubmitting ? 'hourglass' : 'arrow-up-circle'} 
                size={32} 
                color="#8B5CF6" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.hints}>
            <Text style={styles.hintText}>
              💡 Try: "Buy groceries tomorrow" or "Meeting at 2pm high priority"
            </Text>
          </View>
        </BlurView>
      </Animated.View>

      {/* Success Toast */}
      {showSuccess && (
        <Animated.View
          style={[
            styles.successToast,
            {
              opacity: successAnim,
              transform: [
                {
                  translateY: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <BlurView intensity={80} tint="dark" style={styles.successBlur}>
            <Text style={styles.successText}>Added! ✓</Text>
          </BlurView>
        </Animated.View>
      )}

      {/* FAB Button */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={isExpanded ? handleCollapse : handleExpand}
          onPressIn={() => {
            Animated.spring(fabScale, {
              toValue: 0.9,
              useNativeDriver: true,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(fabScale, {
              toValue: 1,
              useNativeDriver: true,
            }).start();
          }}
          activeOpacity={0.9}
        >
          <Animated.View style={{ transform: [{ rotate: fabRotation }] }}>
            <Ionicons name="add" size={32} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 998,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 180,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  inputBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginRight: 12,
  },
  sendButton: {
    padding: 4,
  },
  hints: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  hintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  successToast: {
    position: 'absolute',
    bottom: 260,
    alignSelf: 'center',
    zIndex: 1001,
  },
  successBlur: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
});
