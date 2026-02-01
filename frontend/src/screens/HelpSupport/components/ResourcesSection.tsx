import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QuickLink } from '../types';
import { QUICK_LINKS } from '../constants';
import { styles } from '../styles';

export const ResourcesSection: React.FC = () => {
  return (
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionLabel}>RESOURCES</Text>
      <View style={styles.card}>
        {QUICK_LINKS.map((link, i) => (
          <TouchableOpacity
            key={link.id}
            style={[styles.resourceItem, i > 0 && styles.resourceItemBorder]}
          >
            <View style={[styles.resourceIcon, { backgroundColor: link.color }]}>
              <Ionicons name={link.icon as any} size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.resourceLabel}>{link.label}</Text>
            <Ionicons name="open-outline" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
