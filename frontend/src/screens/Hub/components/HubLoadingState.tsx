/**
 * Hub Loading State
 * Beautiful loading experience for initial data fetch
 */
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function HubLoadingState() {
  return (
    <LinearGradient
      colors={['#f8fafc', '#ffffff']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
        <Text style={styles.text}>Loading your day...</Text>
        <Text style={styles.subtext}>Preparing your tasks and briefing</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  spinnerContainer: {
    marginBottom: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
  },
});
