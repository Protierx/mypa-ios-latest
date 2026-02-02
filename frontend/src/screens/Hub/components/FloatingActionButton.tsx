/**
 * Floating Action Button
 * Beautiful voice assistant trigger with motion
 */
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic } from 'lucide-react-native';

interface FloatingActionButtonProps {
  onPress: () => void;
}

export function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Ask MYPA voice assistant"
      accessibilityHint="Tap to speak with MYPA AI for task management and planning"
    >
      <LinearGradient
        colors={['#ff1493', '#ec4899', '#8b5cf6', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Mic color="#fff" size={28} strokeWidth={2.5} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#ff1493',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 14,
    zIndex: 100,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  gradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
