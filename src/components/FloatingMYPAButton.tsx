import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MYPAOrb } from './MYPAOrb';

interface FloatingMYPAButtonProps {
  onTap: () => void;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const sizeConfig = {
  small: { button: 48, orbSize: 'sm' as const },
  medium: { button: 56, orbSize: 'sm' as const },
  large: { button: 64, orbSize: 'sm' as const },
};

export function FloatingMYPAButton({
  onTap,
  size = 'medium',
  showLabel = false,
}: FloatingMYPAButtonProps) {
  const config = sizeConfig[size];

  return (
    <TouchableOpacity onPress={onTap} style={styles.container} activeOpacity={0.8}>
      <View style={[styles.glow, { width: config.button + 16, height: config.button + 16 }]} />
      <View
        style={[
          styles.button,
          {
            width: config.button,
            height: config.button,
            borderRadius: config.button / 2,
          },
        ]}
      >
        <MYPAOrb size={config.orbSize} showGlow={false} />
      </View>
      {showLabel && <Text style={styles.label}>Talk</Text>}
    </TouchableOpacity>
  );
}

export function FloatingMYPAButtonFixed({ onTap }: { onTap: () => void }) {
  return (
    <View style={styles.fixedContainer}>
      <FloatingMYPAButton onTap={onTap} size="medium" showLabel={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 50,
  },
  button: {
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  fixedContainer: {
    position: 'absolute',
    bottom: 112,
    right: 20,
    zIndex: 40,
  },
});
