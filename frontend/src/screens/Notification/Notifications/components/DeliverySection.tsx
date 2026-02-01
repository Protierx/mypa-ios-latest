import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToggleSwitch } from '../../../../components/ToggleSwitch';
import { DeliveryOption } from '../types';
import { styles } from '../styles';

interface DeliverySectionProps {
  options: DeliveryOption[];
}

export const DeliverySection: React.FC<DeliverySectionProps> = ({ options }) => (
  <View style={[styles.sectionWrapper, { marginBottom: 120 }]}>
    <Text style={styles.sectionLabel}>DELIVERY</Text>
    <View style={styles.card}>
      {options.map((item, i) => (
        <View key={item.key}>
          <View style={styles.toggleRow}>
            <View style={[styles.toggleIcon, { backgroundColor: item.value ? item.color : '#94A3B8' }]}>
              <Ionicons name={item.icon as any} size={20} color="#FFFFFF" />
            </View>
            {item.desc ? (
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>{item.label}</Text>
                <Text style={styles.toggleDesc}>{item.desc}</Text>
              </View>
            ) : (
              <Text style={styles.toggleLabel}>{item.label}</Text>
            )}
            <ToggleSwitch active={item.value} onToggle={() => item.setter(!item.value)} />
          </View>
          {i < options.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  </View>
);
