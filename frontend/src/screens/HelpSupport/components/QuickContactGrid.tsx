import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContactType } from '../types';
import { colors } from '../../../styles/colors';
import { styles } from '../styles';

interface QuickContactGridProps {
  onContactType: (type: ContactType) => void;
}

export const QuickContactGrid: React.FC<QuickContactGridProps> = ({
  onContactType,
}) => {
  return (
    <View style={styles.quickContactGrid}>
      <TouchableOpacity
        style={styles.quickContactCard}
        onPress={() => onContactType('general')}
      >
        <View style={[styles.quickContactIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.quickContactLabel}>Chat</Text>
        <Text style={styles.quickContactDesc}>Message us</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickContactCard}
        onPress={() => onContactType('bug')}
      >
        <View style={[styles.quickContactIcon, { backgroundColor: '#EF4444' }]}>
          <Ionicons name="bug" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.quickContactLabel}>Bug</Text>
        <Text style={styles.quickContactDesc}>Report issue</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.quickContactCard}
        onPress={() => onContactType('feature')}
      >
        <View style={[styles.quickContactIcon, { backgroundColor: '#F59E0B' }]}>
          <Ionicons name="bulb" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.quickContactLabel}>Idea</Text>
        <Text style={styles.quickContactDesc}>Suggest feature</Text>
      </TouchableOpacity>
    </View>
  );
};
