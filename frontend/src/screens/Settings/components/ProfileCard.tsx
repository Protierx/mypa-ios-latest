import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

export const ProfileCard: React.FC = () => (
  <TouchableOpacity style={styles.profileCard}>
    <View style={styles.profileAvatar}>
      <Text style={styles.profileAvatarText}>AJ</Text>
    </View>
    <View style={styles.profileInfo}>
      <Text style={styles.profileName}>Alex Johnson</Text>
      <Text style={styles.profileEmail}>alex.johnson@email.com</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
  </TouchableOpacity>
);
