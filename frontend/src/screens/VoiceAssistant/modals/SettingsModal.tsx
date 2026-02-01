import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VoiceType } from '../types';
import { VOICE_OPTIONS } from '../constants';
import { styles } from '../styles';

interface SettingsModalProps {
  visible: boolean;
  selectedVoice: VoiceType;
  continuousMode: boolean;
  onClose: () => void;
  onSelectVoice: (voice: VoiceType) => void;
  onToggleContinuous: () => void;
}

export function SettingsModal({
  visible,
  selectedVoice,
  continuousMode,
  onClose,
  onSelectVoice,
  onToggleContinuous,
}: SettingsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.settingsOverlay}>
        <View style={styles.settingsModal}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Voice Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.settingLabel}>MYPA Voice</Text>
          <View style={styles.voiceOptions}>
            {VOICE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.voiceOption,
                  selectedVoice === option.id && styles.voiceOptionActive,
                ]}
                onPress={() => onSelectVoice(option.id)}
              >
                <Text style={[
                  styles.voiceOptionText,
                  selectedVoice === option.id && styles.voiceOptionTextActive,
                ]}>
                  {option.name}
                </Text>
                <Text style={styles.voiceOptionDesc}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Continuous Listening</Text>
            <TouchableOpacity
              style={[
                styles.toggleSwitch,
                continuousMode && styles.toggleSwitchActive,
              ]}
              onPress={onToggleContinuous}
            >
              <View style={[
                styles.toggleKnob,
                continuousMode && styles.toggleKnobActive,
              ]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
