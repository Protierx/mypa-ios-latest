import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  default: { icon: 'information-circle', color: '#64748B', bg: '#F8FAFC' },
  success: { icon: 'checkmark-circle', color: '#16A34A', bg: '#F0FDF4' },
  error: { icon: 'alert-circle', color: '#DC2626', bg: '#FEF2F2' },
  warning: { icon: 'warning', color: '#D97706', bg: '#FFFBEB' },
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
        <Ionicons name="close" size={18} color="#64748B" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  description: {
    fontSize: 13,
    color: '#64748B',
  },
  closeButton: {
    padding: 2,
  },
});
