import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrivacyMode, PrivacyModeType } from '../types';
import { styles } from '../styles';

interface PrivacyModeSelectorProps {
  privacyModes: PrivacyMode[];
  selectedPrivacy: PrivacyModeType;
  onSelect: (mode: PrivacyModeType) => void;
}

export const PrivacyModeSelector: React.FC<PrivacyModeSelectorProps> = ({
  privacyModes,
  selectedPrivacy,
  onSelect,
}) => (
  <View style={styles.sectionWrapper}>
    <Text style={styles.sectionLabel}>DEFAULT PRIVACY MODE</Text>
    <View style={styles.card}>
      {privacyModes.map((mode, idx) => (
        <TouchableOpacity
          key={mode.id}
          style={[
            styles.privacyOption,
            idx > 0 && styles.privacyOptionBorder,
          ]}
          onPress={() => onSelect(mode.id)}
        >
          <View style={styles.privacyIcon}>
            <Ionicons name={mode.icon as any} size={18} color="#64748B" />
          </View>
          <View style={styles.privacyContent}>
            <Text style={styles.privacyLabel}>{mode.label}</Text>
            <Text style={styles.privacyDesc}>{mode.desc}</Text>
          </View>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              borderWidth: 2,
              borderColor:
                selectedPrivacy === mode.id ? '#7C3AED' : '#D1D5DB',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selectedPrivacy === mode.id && (
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#7C3AED',
                }}
              />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
