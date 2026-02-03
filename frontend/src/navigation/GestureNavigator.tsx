/**
 * GestureNavigator - Swipe-based navigation replacing tab bar
 * 
 * AI Home (center - default)
 * Swipe LEFT → Tasks View
 * Swipe RIGHT → Social View
 * Swipe DOWN → Profile View
 * Swipe UP → Focus Modal
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import AIHomeScreen from '../screens/AIHome';
import GestureTasksView from '../screens/GestureTasks';
import GestureSocialView from '../screens/GestureSocial';
import GestureProfileView from '../screens/GestureProfile';
import FocusModal from '../screens/FocusModal';
import { structuredColors as colors } from '../styles/colors';
import { theme } from '../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Gesture thresholds from design spec
const SWIPE_HORIZONTAL_TRIGGER = 50; // px
const SWIPE_VERTICAL_TRIGGER = 80; // px
const VELOCITY_THRESHOLD_HORIZONTAL = 300; // px/s
const VELOCITY_THRESHOLD_VERTICAL = 400; // px/s
const COMPLETE_THRESHOLD_HORIZONTAL = SCREEN_WIDTH * 0.5; // 50% of screen
const COMPLETE_THRESHOLD_VERTICAL = SCREEN_HEIGHT * 0.6; // 60% of screen

type ActiveView = 'home' | 'tasks' | 'social' | 'profile';

// Spring configuration from design spec
const springConfig = {
  damping: 20,
  stiffness: 200,
  mass: 1,
};

export function GestureNavigator() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [focusModalVisible, setFocusModalVisible] = useState(false);
  
  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  
  // Haptic feedback helpers
  const triggerLightHaptic = useCallback(() => {
    Haptics.selectionAsync();
  }, []);
  
  const triggerMediumHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
  const triggerHeavyHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);
  
  // Navigate to view with animation
  const navigateToView = useCallback((view: ActiveView) => {
    'worklet';
    
    switch (view) {
      case 'tasks':
        translateX.value = withSpring(-SCREEN_WIDTH, springConfig);
        break;
      case 'social':
        translateX.value = withSpring(SCREEN_WIDTH, springConfig);
        break;
      case 'profile':
        translateY.value = withSpring(-SCREEN_HEIGHT, springConfig);
        break;
      case 'home':
      default:
        translateX.value = withSpring(0, springConfig);
        translateY.value = withSpring(0, springConfig);
        break;
    }
    
    runOnJS(setActiveView)(view);
  }, []);
  
  // Open focus modal
  const openFocusModal = useCallback(() => {
    setFocusModalVisible(true);
    triggerHeavyHaptic();
  }, [triggerHeavyHaptic]);
  
  // Return to home from any view
  const returnToHome = useCallback(() => {
    navigateToView('home');
    triggerMediumHaptic();
  }, [navigateToView, triggerMediumHaptic]);
  
  // Pan gesture for navigation
  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(triggerLightHaptic)();
    })
    .onUpdate((event) => {
      // Only allow gestures when on home view
      if (activeView !== 'home') return;
      
      const { translationX, translationY } = event;
      
      // Determine primary direction
      const isHorizontal = Math.abs(translationX) > Math.abs(translationY);
      
      if (isHorizontal) {
        // Horizontal swipe - Tasks (left) or Social (right)
        translateX.value = translationX;
        // Subtle scale effect during drag
        scale.value = interpolate(
          Math.abs(translationX),
          [0, SCREEN_WIDTH * 0.5],
          [1, 0.98],
          Extrapolation.CLAMP
        );
      } else {
        // Vertical swipe - Profile (down) or Focus (up)
        translateY.value = translationY;
        scale.value = interpolate(
          Math.abs(translationY),
          [0, SCREEN_HEIGHT * 0.5],
          [1, 0.98],
          Extrapolation.CLAMP
        );
      }
    })
    .onEnd((event) => {
      if (activeView !== 'home') return;
      
      const { translationX, translationY, velocityX, velocityY } = event;
      const isHorizontal = Math.abs(translationX) > Math.abs(translationY);
      
      scale.value = withSpring(1, springConfig);
      
      if (isHorizontal) {
        // Check horizontal thresholds
        const reachedThreshold = Math.abs(translationX) > SWIPE_HORIZONTAL_TRIGGER;
        const velocityMet = Math.abs(velocityX) > VELOCITY_THRESHOLD_HORIZONTAL;
        const shouldComplete = Math.abs(translationX) > COMPLETE_THRESHOLD_HORIZONTAL;
        
        if ((reachedThreshold && velocityMet) || shouldComplete) {
          runOnJS(triggerMediumHaptic)();
          if (translationX < 0) {
            // Swipe left → Tasks
            navigateToView('tasks');
          } else {
            // Swipe right → Social
            navigateToView('social');
          }
        } else {
          // Snap back to home
          translateX.value = withSpring(0, springConfig);
        }
      } else {
        // Check vertical thresholds
        const reachedThreshold = Math.abs(translationY) > SWIPE_VERTICAL_TRIGGER;
        const velocityMet = Math.abs(velocityY) > VELOCITY_THRESHOLD_VERTICAL;
        const shouldComplete = Math.abs(translationY) > COMPLETE_THRESHOLD_VERTICAL;
        
        if ((reachedThreshold && velocityMet) || shouldComplete) {
          runOnJS(triggerMediumHaptic)();
          if (translationY < 0) {
            // Swipe up → Focus Modal
            translateY.value = withSpring(0, springConfig);
            runOnJS(openFocusModal)();
          } else {
            // Swipe down → Profile
            navigateToView('profile');
          }
        } else {
          // Snap back to home
          translateY.value = withSpring(0, springConfig);
        }
      }
    });
  
  // Animated styles for main container
  const homeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));
  
  // Animated styles for side views (peek effect)
  const tasksAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          translateX.value,
          [-SCREEN_WIDTH, 0],
          [0, SCREEN_WIDTH],
          Extrapolation.CLAMP
        ),
      },
    ],
    opacity: interpolate(
      translateX.value,
      [-SCREEN_WIDTH, -SCREEN_WIDTH * 0.15, 0],
      [1, 0.8, 0],
      Extrapolation.CLAMP
    ),
  }));
  
  const socialAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          translateX.value,
          [0, SCREEN_WIDTH],
          [-SCREEN_WIDTH, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
    opacity: interpolate(
      translateX.value,
      [0, SCREEN_WIDTH * 0.15, SCREEN_WIDTH],
      [0, 0.8, 1],
      Extrapolation.CLAMP
    ),
  }));
  
  const profileAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          translateY.value,
          [-SCREEN_HEIGHT, 0],
          [0, SCREEN_HEIGHT],
          Extrapolation.CLAMP
        ),
      },
    ],
    opacity: interpolate(
      translateY.value,
      [-SCREEN_HEIGHT, -SCREEN_HEIGHT * 0.2, 0],
      [1, 0.8, 0],
      Extrapolation.CLAMP
    ),
  }));
  
  // Overlay animated style (darkens home during swipe)
  const overlayAnimatedStyle = useAnimatedStyle(() => {
    const horizontalProgress = Math.abs(translateX.value) / SCREEN_WIDTH;
    const verticalProgress = Math.abs(translateY.value) / SCREEN_HEIGHT;
    const progress = Math.max(horizontalProgress, verticalProgress);
    
    return {
      opacity: interpolate(
        progress,
        [0, 0.15, 0.5],
        [0, 0.05, 0.15],
        Extrapolation.CLAMP
      ),
    };
  });
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Side Views (positioned off-screen) */}
      <Animated.View style={[styles.sideView, styles.tasksView, tasksAnimatedStyle]}>
        <GestureTasksView onBack={returnToHome} />
      </Animated.View>
      
      <Animated.View style={[styles.sideView, styles.socialView, socialAnimatedStyle]}>
        <GestureSocialView onBack={returnToHome} />
      </Animated.View>
      
      <Animated.View style={[styles.sideView, styles.profileView, profileAnimatedStyle]}>
        <GestureProfileView onBack={returnToHome} />
      </Animated.View>
      
      {/* Main AI Home View */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.homeView, homeAnimatedStyle]}>
          <AIHomeScreen
            onOpenFocus={openFocusModal}
            onNavigateToTasks={() => navigateToView('tasks')}
            onNavigateToSocial={() => navigateToView('social')}
            onNavigateToProfile={() => navigateToView('profile')}
          />
          {/* Overlay that darkens during swipe */}
          <Animated.View style={[styles.overlay, overlayAnimatedStyle]} pointerEvents="none" />
        </Animated.View>
      </GestureDetector>
      
      {/* Focus Modal */}
      <FocusModal
        visible={focusModalVisible}
        onClose={() => setFocusModalVisible(false)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.black,
  },
  homeView: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  sideView: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  tasksView: {
    // Positioned off-screen to the right (revealed by swiping left)
  },
  socialView: {
    // Positioned off-screen to the left (revealed by swiping right)
  },
  profileView: {
    // Positioned off-screen above (revealed by swiping down)
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
});

export default GestureNavigator;
