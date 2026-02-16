import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bg, text as textTokens, semantic } from '../../styles/colors';
import { radius, spacing } from '../../styles/theme';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
}

const variantConfig: Record<ToastVariant, { icon: string; color: string; bg: string }> = {
  default: { icon: 'information-circle', color: textTokens.secondary, bg: bg.primary },
  success: { icon: 'checkmark-circle', color: semantic.success, bg: semantic.successLight },
  error: { icon: 'alert-circle', color: semantic.error, bg: semantic.errorLight },
  warning: { icon: 'warning', color: semantic.warning, bg: semantic.warningLight },
};

export function Toast({
  visible,
  message,
  description,
  variant = 'default',
  duration = 3000,
  onClose,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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

      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  if (!visible) return null;

  const config = variantConfig[variant];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.bg, transform: [{ translateY }], opacity },
      ]}
    >
      <Ionicons name={config.icon as any} size={22} color={config.color} />
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Ionicons name="close" size={18} color={textTokens.secondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.base,
    right: spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.base,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: spacing.md,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    color: textTokens.primary,
  },
  description: {
    fontSize: 13,
    color: textTokens.secondary,
  },
  closeButton: {
    padding: 2,
  },
});
