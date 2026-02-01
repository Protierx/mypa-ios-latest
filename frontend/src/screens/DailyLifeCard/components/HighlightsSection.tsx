import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Highlight } from '../types';
import { getStatusIcon } from '../constants';
import { styles } from '../styles';

interface HighlightsSectionProps {
  highlights: Highlight[];
}

export const HighlightsSection: React.FC<HighlightsSectionProps> = ({ highlights }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Today's Highlights</Text>
    {highlights.map((item) => {
      const statusIcon = getStatusIcon(item.status);
      return (
        <View key={item.id} style={styles.highlightItem}>
          <View style={styles.highlightTime}>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          <View style={styles.highlightContent}>
            <View style={styles.timelineDot}>
              <Ionicons name={statusIcon.name as any} size={20} color={statusIcon.color} />
            </View>
            <Text style={styles.highlightTitle}>{item.title}</Text>
          </View>
        </View>
      );
    })}
  </View>
);
