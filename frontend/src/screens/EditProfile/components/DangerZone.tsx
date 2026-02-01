import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

export const DangerZone: React.FC = () => {
  return (
    <View style={[styles.sectionWrapper, { marginBottom: 120 }]}>
      <Text style={[styles.sectionLabel, { color: '#EF4444' }]}>
        DANGER ZONE
      </Text>
      <View style={[styles.card, { borderColor: '#FEE2E2', borderWidth: 1 }]}>
        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: '#EF4444' }]}>
              Delete Account
            </Text>
            <Text style={styles.menuSubtitle}>
              Permanently delete your account & data
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FECACA" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
