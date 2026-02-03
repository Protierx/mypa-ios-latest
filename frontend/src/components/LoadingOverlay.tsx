import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../styles';

export function LoadingOverlay() {
  return (
    <View style={styles.container}>
      <View style={styles.overlay} />
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});
