import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function IOSStatusBar() {
  return (
    <View style={styles.container}>
      <Text style={styles.time}>9:41</Text>
      <View style={styles.icons}>
        <Ionicons name="cellular" size={16} color="#0F172A" style={styles.icon} />
        <Ionicons name="wifi" size={16} color="#0F172A" style={styles.icon} />
        <Ionicons name="battery-full" size={18} color="#0F172A" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  time: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    opacity: 0.9,
  },
});
