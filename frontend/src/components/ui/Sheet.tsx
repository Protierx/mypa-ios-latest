import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { bg, text as textTokens, border as borderTokens } from '../../styles/colors';
import { radius, spacing, shadows } from '../../styles/theme';
import { springs, durations, easings } from '../../styles/motion';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 120;

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: 'bottom' | 'right';
}

interface SheetHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface SheetFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface SheetTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface SheetDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

const SheetContext = React.createContext<{ onClose: () => void }>({ onClose: () => {} });

export function Sheet({ visible, onClose, children, side = 'bottom' }: SheetProps) {
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);

  const handleClose = useCallback(() => {
    progress.value = withTiming(0, { duration: durations.fast, easing: easings.easeIn }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
    dragY.value = withTiming(0, { duration: durations.fast });
  }, [onClose, progress, dragY]);

  useEffect(() => {
    if (visible) {
      dragY.value = 0;
      progress.value = withSpring(1, springs.sheet);
    }
  }, [visible]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        dragY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 500) {
        runOnJS(handleClose)();
      } else {
        dragY.value = withSpring(0, springs.sheet);
      }
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [SCREEN_HEIGHT, 0]) + dragY.value,
      },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <SheetContext.Provider value={{ onClose: handleClose }}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <TouchableOpacity style={styles.overlayTouch} onPress={handleClose} activeOpacity={1} />
        </Animated.View>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.handle} />
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={20} color={textTokens.tertiary} />
            </TouchableOpacity>
            {children}
          </Animated.View>
        </GestureDetector>
      </SheetContext.Provider>
    </Modal>
  );
}

export function SheetHeader({ children, style }: SheetHeaderProps) {
  return <View style={[styles.header, style]}>{children}</View>;
}

export function SheetFooter({ children, style }: SheetFooterProps) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

export function SheetTitle({ children, style }: SheetTitleProps) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function SheetDescription({ children, style }: SheetDescriptionProps) {
  return <Text style={[styles.description, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  overlayTouch: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: bg.elevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 40,
    maxHeight: '85%',
    ...shadows.lg,
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: borderTokens.primary,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.base,
    padding: 4,
    zIndex: 1,
  },
  header: {
    padding: spacing.base,
    gap: 4,
  },
  footer: {
    padding: spacing.base,
    paddingTop: 0,
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: textTokens.primary,
    letterSpacing: -0.4,
  },
  description: {
    fontSize: 15,
    color: textTokens.secondary,
    lineHeight: 21,
  },
});
