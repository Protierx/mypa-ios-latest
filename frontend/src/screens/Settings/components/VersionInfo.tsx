import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

export const VersionInfo: React.FC = () => (
  <View style={styles.versionContainer}>
    <Ionicons name="information-circle-outline" size={16} color="#94A3B8" />
    <Text style={styles.versionText}>Version 1.0.0 (Build 156)</Text>
  </View>
);
