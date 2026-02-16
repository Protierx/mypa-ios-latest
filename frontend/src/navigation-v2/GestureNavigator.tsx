/**
 * Gesture Navigator
 * 
 * Main navigation component using swipe gestures.
 * - CENTER: AI Hub (default)
 * - LEFT: Social View
 * - RIGHT: Tasks View
 * - DOWN: Profile View
 * - UP: Focus Modal (opens as overlay)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Modal, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useGestureNavigation, Screen } from './useGestureNavigation';
import { GestureProvider, useGesture } from './GestureContext';
import { FocusModalProvider } from './FocusModalContext';
import { SwipeIndicator } from './SwipeIndicator';
import { useVoice } from '../contexts/VoiceContext';

// Import screens
import { AIHubScreen } from '../screens-v2/AIHub';
import { TasksViewScreen } from '../screens-v2/TasksView';
import { SocialViewScreen } from '../screens-v2/SocialView';
import { ProfileViewScreen } from '../screens-v2/ProfileView';
import { FocusModal } from '../screens-v2/FocusModal/FocusModal';

// Swipe thresholds
const HORIZONTAL_THRESHOLD = 100;
const VERTICAL_THRESHOLD = 50;

// Spring config for smooth animations
const SPRING_CONFIG = {
  damping: 22,
  stiffness: 160,
  mass: 0.8,
};

function GestureNavigatorContent() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const { currentScreen, navigateTo, canSwipe } = useGestureNavigation();
  const { requestedNavigation, clearNavigationRequest } = useVoice();
  
  // Focus modal overlay state
  const [showFocusModal, setShowFocusModal] = useState(false);

  // Animated values for screen positions
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  // Track if we're currently transitioning
  const isTransitioning = useSharedValue(false);

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Open focus modal as overlay
  const openFocusModal = useCallback((_taskId?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowFocusModal(true);
  }, []);

  // Navigate with animation
  const animateToScreen = useCallback((screen: Screen) => {
    'worklet';
    
    isTransitioning.value = true;
    
    switch (screen) {
      case 'tasks':
        translateX.value = withSpring(-SCREEN_WIDTH, SPRING_CONFIG, () => {
          isTransitioning.value = false;
        });
        translateY.value = withSpring(0, SPRING_CONFIG);
        break;
      case 'social':
        translateX.value = withSpring(SCREEN_WIDTH, SPRING_CONFIG, () => {
          isTransitioning.value = false;
        });
        translateY.value = withSpring(0, SPRING_CONFIG);
        break;
      case 'profile':
        translateY.value = withSpring(-SCREEN_HEIGHT, SPRING_CONFIG, () => {
          isTransitioning.value = false;
        });
        translateX.value = withSpring(0, SPRING_CONFIG);
        break;
      case 'ai_hub':
      default:
        translateX.value = withSpring(0, SPRING_CONFIG, () => {
          isTransitioning.value = false;
        });
        translateY.value = withSpring(0, SPRING_CONFIG);
        break;
    }
    
    runOnJS(navigateTo)(screen);
    runOnJS(triggerHaptic)();
  }, [navigateTo, triggerHaptic, SCREEN_WIDTH, SCREEN_HEIGHT]);

  // Step 7b: Voice-triggered navigation — AI tool call sets requestedNavigation,
  // we animate to that screen and clear the request.
  useEffect(() => {
    if (!requestedNavigation) return;
    const { screen } = requestedNavigation;
    if (screen === currentScreen) {
      clearNavigationRequest();
      return;
    }
    if (screen === 'focus') {
      openFocusModal();
    } else {
      animateToScreen(screen);
    }
    clearNavigationRequest();
  }, [requestedNavigation, currentScreen, animateToScreen, openFocusModal, clearNavigationRequest]);

  // Pan gesture handler
  const panGesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-15, 15])
    .activeOffsetY([-15, 15])
    .onUpdate((event) => {
      if (isTransitioning.value) return;
      
      // Allow drag preview
      if (currentScreen === 'ai_hub') {
        translateX.value = event.translationX * 0.5;
        translateY.value = event.translationY * 0.5;
      } else if (currentScreen === 'tasks') {
        // Tasks is on the right: base translateX = -SCREEN_WIDTH, swipe right to return
        translateX.value = -SCREEN_WIDTH + Math.max(0, event.translationX * 0.5);
      } else if (currentScreen === 'social') {
        // Social is on the left: base translateX = SCREEN_WIDTH, swipe left to return
        translateX.value = SCREEN_WIDTH + Math.min(0, event.translationX * 0.5);
      } else if (currentScreen === 'profile') {
        // Swipe up to return — higher drag ratio for easier feel
        translateY.value = -SCREEN_HEIGHT + event.translationY * 0.7;
      }
    })
    .onEnd((event) => {
      if (isTransitioning.value) return;
      
      const { translationX, translationY, velocityX, velocityY } = event;
      
      // From AI Hub - can go any direction
      if (currentScreen === 'ai_hub') {
        if (translationX < -HORIZONTAL_THRESHOLD || velocityX < -500) {
          // Swipe left → Tasks
          animateToScreen('tasks');
        } else if (translationX > HORIZONTAL_THRESHOLD || velocityX > 500) {
          // Swipe right → Social
          animateToScreen('social');
        } else if (translationY < -VERTICAL_THRESHOLD || velocityY < -300) {
          // Swipe up → Focus Modal (overlay)
          animateToScreen('ai_hub'); // Snap back to center
          runOnJS(openFocusModal)();
        } else if (translationY > VERTICAL_THRESHOLD || velocityY > 300) {
          // Swipe down → Profile
          animateToScreen('profile');
        } else {
          // Snap back
          animateToScreen('ai_hub');
        }
      }
      // From Tasks (on the right) - swipe right to return
      else if (currentScreen === 'tasks') {
        if (translationX > HORIZONTAL_THRESHOLD || velocityX > 500) {
          animateToScreen('ai_hub');
        } else {
          animateToScreen('tasks');
        }
      }
      // From Social (on the left) - swipe left to return
      else if (currentScreen === 'social') {
        if (translationX < -HORIZONTAL_THRESHOLD || velocityX < -500) {
          animateToScreen('ai_hub');
        } else {
          animateToScreen('social');
        }
      }
      // From Profile - swipe up to return (easier threshold)
      else if (currentScreen === 'profile') {
        if (translationY < -VERTICAL_THRESHOLD || velocityY < -300) {
          animateToScreen('ai_hub');
        } else {
          animateToScreen('profile');
        }
      }
    }), [currentScreen, animateToScreen, SCREEN_WIDTH, SCREEN_HEIGHT]);

  // Animated styles for the screen container
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // Dynamic screen positioning based on current window dimensions
  const screenStyle = useMemo(() => ({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  }), [SCREEN_WIDTH, SCREEN_HEIGHT]);

  const containerDynamic = useMemo(() => ({
    width: SCREEN_WIDTH * 3,
    height: SCREEN_HEIGHT * 2,
  }), [SCREEN_WIDTH, SCREEN_HEIGHT]);

  return (
    <>
      <FocusModalProvider openFocusModal={openFocusModal}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.container}>
            <Animated.View style={[styles.screenContainer, containerDynamic, animatedContainerStyle]}>
              <View style={[screenStyle, { position: 'absolute', left: -SCREEN_WIDTH, top: 0 }]}>
                <SocialViewScreen />
              </View>
              <View style={[screenStyle, { position: 'absolute', left: 0, top: 0 }]}>
                <AIHubScreen />
              </View>
              <View style={[screenStyle, { position: 'absolute', left: SCREEN_WIDTH, top: 0 }]}>
                <TasksViewScreen />
              </View>
              <View style={[screenStyle, { position: 'absolute', left: 0, top: SCREEN_HEIGHT }]}>
                <ProfileViewScreen />
              </View>
            </Animated.View>
          
          {/* Swipe Indicators */}
          {currentScreen === 'ai_hub' && (
            <>
              <SwipeIndicator direction="left" label="Tasks" visible />
              <SwipeIndicator direction="right" label="Social" visible />
              <SwipeIndicator direction="down" label="Profile" visible />
              <SwipeIndicator direction="up" label="Focus" visible />
            </>
          )}
          {currentScreen === 'tasks' && (
            <SwipeIndicator direction="right" label="Back" visible />
          )}
          {currentScreen === 'social' && (
            <SwipeIndicator direction="left" label="Back" visible />
          )}
          {currentScreen === 'profile' && (
            <SwipeIndicator direction="up" label="Back" visible />
          )}
        </View>
      </GestureDetector>
      </FocusModalProvider>

      {/* Focus Modal Overlay — outside GestureDetector to avoid single-child constraint */}
      <Modal
        visible={showFocusModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFocusModal(false)}
      >
        <FocusModal onDismiss={() => setShowFocusModal(false)} />
      </Modal>
    </>
  );
}

/**
 * Bridge component — watches screen changes and sends contextual updates
 * to the active ElevenLabs voice session (Step 14a).
 * Lives inside GestureProvider so it can access both useGesture() and useVoice().
 */
function ScreenContextBridge() {
  const { currentScreen } = useGesture();
  const { updateScreenContext } = useVoice();
  const prevScreenRef = useRef<Screen>(currentScreen);

  useEffect(() => {
    if (currentScreen !== prevScreenRef.current) {
      prevScreenRef.current = currentScreen;
      updateScreenContext(currentScreen);
    }
  }, [currentScreen, updateScreenContext]);

  return null; // Renderless bridge
}

export function GestureNavigator() {
  return (
    <View style={styles.root}>
      <GestureProvider>
        <ScreenContextBridge />
        <GestureNavigatorContent />
      </GestureProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  screenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
