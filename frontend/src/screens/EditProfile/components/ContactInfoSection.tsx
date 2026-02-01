import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface ContactInfoSectionProps {
  email: string;
  phone: string;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({
  email,
  phone,
  onEmailChange,
  onPhoneChange,
}) => {
  return (
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionLabel}>CONTACT INFORMATION</Text>
      <View style={styles.card}>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#94A3B8" />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={onEmailChange}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.helperText}>
            Used for account recovery & notifications
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#94A3B8" />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={onPhoneChange}
              placeholder="+1 (555) 000-0000"
              keyboardType="phone-pad"
            />
          </View>
          <Text style={styles.helperText}>Optional - For 2FA & SMS alerts</Text>
        </View>
      </View>
    </View>
  );
};
