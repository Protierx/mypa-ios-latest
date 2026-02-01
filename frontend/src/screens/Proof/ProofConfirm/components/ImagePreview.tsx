import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

export const ImagePreview: React.FC = () => (
  <View style={styles.imageContainer}>
    <View style={styles.imagePlaceholder}>
      <Ionicons name="image" size={64} color="rgba(255,255,255,0.3)" />
      <Text style={styles.placeholderText}>Captured photo preview</Text>
    </View>
  </View>
);
