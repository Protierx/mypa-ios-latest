import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BIO_MAX_LENGTH } from '../constants';
import { styles } from '../styles';

interface BasicInfoSectionProps {
  displayName: string;
  username: string;
  bio: string;
  usernameAvailable: boolean | null;
  onDisplayNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onBioChange: (value: string) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  displayName,
  username,
  bio,
  usernameAvailable,
  onDisplayNameChange,
  onUsernameChange,
  onBioChange,
}) => {
  return (
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionLabel}>BASIC INFORMATION</Text>
      <View style={styles.card}>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Display Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#94A3B8" />
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={onDisplayNameChange}
              placeholder="Your name"
            />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Username</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="at" size={20} color="#94A3B8" />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={onUsernameChange}
              placeholder="username"
              autoCapitalize="none"
            />
            {usernameAvailable === true && (
              <Ionicons name="checkmark" size={20} color="#10B981" />
            )}
            {usernameAvailable === false && (
              <Ionicons name="close" size={20} color="#EF4444" />
            )}
          </View>
          {usernameAvailable === false && (
            <Text style={styles.errorText}>Username is taken</Text>
          )}
          {usernameAvailable === true && (
            <Text style={styles.successText}>Username is available!</Text>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={onBioChange}
            placeholder="Tell us about yourself..."
            multiline
            maxLength={BIO_MAX_LENGTH}
          />
          <Text style={styles.charCount}>
            {bio.length}/{BIO_MAX_LENGTH}
          </Text>
        </View>
      </View>
    </View>
  );
};
