import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORT_EMAIL } from '../constants';
import { styles } from '../styles';

export const ContactCard: React.FC = () => {
  return (
    <View style={[styles.contactCard, { marginBottom: 120 }]}>
      <View style={styles.contactRow}>
        <Ionicons name="mail" size={20} color="#94A3B8" />
        <Text style={styles.contactEmail}>{SUPPORT_EMAIL}</Text>
      </View>
      <Text style={styles.contactNote}>
        For urgent matters, you can email us directly. We typically respond
        within 24 hours on business days.
      </Text>
    </View>
  );
};
