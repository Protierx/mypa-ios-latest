import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

export const CameraPreview: React.FC = () => (
  <View style={styles.cameraPlaceholder}>
    <View style={styles.cameraFrame}>
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
    </View>
    <Ionicons name="camera" size={64} color="rgba(255,255,255,0.3)" />
    <Text style={styles.cameraText}>Camera preview</Text>
  </View>
);
