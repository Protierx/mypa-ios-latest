import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Circle } from '../types';
import { styles } from '../styles';

interface CircleSettingsProps {
  circles: Circle[];
  onSelectCircle: (circleId: number) => void;
  getPrivacyLabel: (privacy: string) => string;
}

export const CircleSettings: React.FC<CircleSettingsProps> = ({
  circles,
  onSelectCircle,
  getPrivacyLabel,
}) => (
  <View style={styles.sectionWrapper}>
    <Text style={styles.sectionLabel}>PER-CIRCLE SETTINGS</Text>
    <View style={styles.card}>
      {circles.map((circle, idx) => (
        <TouchableOpacity
          key={circle.id}
          style={[styles.circleRow, idx > 0 && styles.circleRowBorder]}
          onPress={() => onSelectCircle(circle.id)}
        >
          <Text style={styles.circleName}>{circle.name}</Text>
          <View style={styles.circlePrivacy}>
            <Text style={styles.circlePrivacyText}>
              {getPrivacyLabel(circle.privacy)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
