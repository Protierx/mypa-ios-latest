import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bg, text as textTokens, border as borderTokens } from '../../styles/colors';
import { radius, spacing, shadows } from '../../styles/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <SheetContext.Provider value={{ onClose: handleClose }}>
        <Animated.View style={[styles.overlay, { opacity }]}>
          <TouchableOpacity style={styles.overlayTouch} onPress={handleClose} />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={20} color={textTokens.tertiary} />
          </TouchableOpacity>
          {children}
        </Animated.View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    paddingBottom: 32,
    maxHeight: '80%',
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: borderTokens.primary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
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
    fontSize: 18,
    fontWeight: '600',
    color: textTokens.primary,
  },
  description: {
    fontSize: 14,
    color: textTokens.secondary,
  },
});
