import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LanguageType, SpeedType, VoiceType } from '../types';
import { LANGUAGES, SPEEDS, VOICE_OPTIONS } from '../constants';
import { styles } from '../styles';

interface SettingsModalProps {
  visible: boolean;
  language: LanguageType;
  speed: SpeedType;
  voice: VoiceType;
  onClose: () => void;
  onLanguageChange: (lang: LanguageType) => void;
  onSpeedChange: (spd: SpeedType) => void;
  onVoiceChange: (v: VoiceType) => void;
}

export function SettingsModal({
  visible,
  language,
  speed,
  voice,
  onClose,
  onLanguageChange,
  onSpeedChange,
  onVoiceChange,
}: SettingsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.settingsOverlay}>
        <TouchableOpacity 
          style={styles.settingsBackdrop} 
          activeOpacity={1}
          onPress={onClose} 
        />
        <View style={styles.settingsModal}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Voice Settings</Text>
            <TouchableOpacity 
              style={styles.settingsCloseBtn}
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.settingsContent}>
            {/* Language Section */}
            <View style={styles.settingSection}>
              <View style={styles.settingSectionHeader}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(59,130,246,0.2)' }]}>
                  <Ionicons name="globe-outline" size={20} color="#60A5FA" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Language</Text>
                  <Text style={styles.settingDesc}>Choose your language</Text>
                </View>
              </View>
              <View style={styles.settingOptions}>
                {LANGUAGES.map(lang => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.settingOption,
                      language === lang && styles.settingOptionActive
                    ]}
                    onPress={() => onLanguageChange(lang)}
                  >
                    <Text style={[
                      styles.settingOptionText,
                      language === lang && styles.settingOptionTextActive
                    ]}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Speed Section */}
            <View style={styles.settingSection}>
              <View style={styles.settingSectionHeader}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(245,158,11,0.2)' }]}>
                  <Ionicons name="speedometer-outline" size={20} color="#FBBF24" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Speed</Text>
                  <Text style={styles.settingDesc}>How fast MYPA speaks</Text>
                </View>
              </View>
              <View style={styles.settingOptions}>
                {SPEEDS.map(spd => (
                  <TouchableOpacity
                    key={spd}
                    style={[
                      styles.settingOption,
                      styles.settingOptionFlex,
                      speed === spd && { backgroundColor: '#F59E0B' }
                    ]}
                    onPress={() => onSpeedChange(spd)}
                  >
                    <Text style={[
                      styles.settingOptionText,
                      speed === spd && styles.settingOptionTextActive
                    ]}>{spd}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Voice Section */}
            <View style={styles.settingSection}>
              <View style={styles.settingSectionHeader}>
                <View style={[styles.settingIcon, { backgroundColor: 'rgba(139,92,246,0.2)' }]}>
                  <Ionicons name="volume-high-outline" size={20} color="#A78BFA" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Voice</Text>
                  <Text style={styles.settingDesc}>MYPA's voice style</Text>
                </View>
              </View>
              <View style={styles.voiceOptions}>
                {VOICE_OPTIONS.map(v => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.voiceOption,
                      voice === v.id && styles.voiceOptionActive
                    ]}
                    onPress={() => onVoiceChange(v.id as VoiceType)}
                  >
                    <View>
                      <Text style={[
                        styles.voiceName,
                        voice === v.id && { color: '#C4B5FD' }
                      ]}>{v.id}</Text>
                      <Text style={styles.voiceDesc}>{v.desc}</Text>
                    </View>
                    {voice === v.id && (
                      <Ionicons name="checkmark" size={20} color="#A78BFA" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.settingsDoneBtn}
            onPress={onClose}
          >
            <Text style={styles.settingsDoneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
