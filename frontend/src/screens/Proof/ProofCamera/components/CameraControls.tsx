import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../styles';
import { styles } from '../styles';

interface CameraControlsProps {
  isCapturing: boolean;
  onCapture: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  isCapturing,
  onCapture,
}) => (
  <View style={styles.controls}>
    <TouchableOpacity style={styles.flashButton}>
      <Ionicons name="flash-off" size={24} color={colors.white} />
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.captureButton, isCapturing && styles.capturing]}
      onPress={onCapture}
      activeOpacity={0.8}
    >
      <View style={styles.captureInner} />
    </TouchableOpacity>

    <TouchableOpacity style={styles.flipButton}>
      <Ionicons name="camera-reverse" size={24} color={colors.white} />
    </TouchableOpacity>
  </View>
);
