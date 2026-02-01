import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

export const DangerZone: React.FC = () => (
  <View style={styles.dangerSection}>
    <TouchableOpacity style={styles.dangerButton}>
      <Ionicons name="log-out-outline" size={20} color="#F43F5E" />
      <Text style={styles.dangerButtonText}>Sign Out</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.dangerButton, styles.deleteButton]}>
      <Ionicons name="trash-outline" size={20} color="#F43F5E" />
      <Text style={styles.dangerButtonText}>Delete Account</Text>
    </TouchableOpacity>
  </View>
);
