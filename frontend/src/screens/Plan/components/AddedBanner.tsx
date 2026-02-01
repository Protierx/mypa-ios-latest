import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../styles';

interface AddedBannerProps {
  taskTitle: string;
}

export const AddedBanner: React.FC<AddedBannerProps> = ({ taskTitle }) => {
  return (
    <LinearGradient colors={['#10B981', '#14B8A6']} style={styles.addedBanner}>
      <View style={styles.addedIcon}>
        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
      </View>
      <View style={styles.addedTextWrap}>
        <Text style={styles.addedTitle}>Task Added Successfully!</Text>
        <Text style={styles.addedSubtitle}>"{taskTitle}" is now in your plan</Text>
      </View>
    </LinearGradient>
  );
};
