import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StreakBenefit } from '../types';
import { styles } from '../styles';

interface BenefitsSectionProps {
  benefits: StreakBenefit[];
}

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({ benefits }) => (
  <View style={[styles.section, { marginBottom: 120 }]}>
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name="fire" size={20} color="#F97316" />
      <Text style={styles.sectionTitle}>Streak Benefits</Text>
    </View>
    {benefits.map((benefit, i) => (
      <View key={i} style={[styles.benefitItem, !benefit.active && { opacity: 0.6 }]}>
        <View style={[styles.benefitIcon, benefit.active && styles.benefitIconActive]}>
          <Ionicons name={benefit.icon as any} size={20} color={benefit.active ? '#FFFFFF' : '#94A3B8'} />
        </View>
        <View style={styles.benefitContent}>
          <Text style={styles.benefitTitle}>{benefit.title}</Text>
          <Text style={styles.benefitDesc}>{benefit.desc}</Text>
        </View>
        {benefit.active && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        )}
      </View>
    ))}
  </View>
);
