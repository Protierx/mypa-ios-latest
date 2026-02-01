import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface SecuritySectionProps {
  onChangePassword: () => void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  onChangePassword,
}) => {
  return (
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionLabel}>SECURITY</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem} onPress={onChangePassword}>
          <View style={[styles.menuIcon, { backgroundColor: '#3B82F6' }]}>
            <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Change Password</Text>
            <Text style={styles.menuSubtitle}>Last changed 30 days ago</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#10B981' }]}>
            <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Two-Factor Authentication</Text>
            <Text style={[styles.menuSubtitle, { color: '#10B981' }]}>
              Enabled
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
