import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

interface PrivacyControlsScreenProps {
  navigation?: any;
}

export function PrivacyControlsScreen({ navigation }: PrivacyControlsScreenProps) {
  const [defaultPrivacy, setDefaultPrivacy] = useState<'private' | 'metrics' | 'proof'>('metrics');
  const [circles, setCircles] = useState([
    { id: 1, name: 'Morning Warriors', privacy: 'metrics' },
    { id: 2, name: 'Product Team', privacy: 'proof' },
    { id: 3, name: 'Book Club', privacy: 'private' },
  ]);
  const [showPicker, setShowPicker] = useState<number | null>(null);
  const [hideWallet, setHideWallet] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [calendarAccess, setCalendarAccess] = useState(true);
  const [contactsAccess, setContactsAccess] = useState(false);
  const [microphoneAccess, setMicrophoneAccess] = useState(true);
  const [healthAccess, setHealthAccess] = useState(false);
  const [backgroundRefresh, setBackgroundRefresh] = useState(true);

  const privacyModes = [
    { id: 'private', label: 'Private', desc: 'Only you can see your activity', icon: 'lock-closed' },
    { id: 'metrics', label: 'Metrics only', desc: 'Share numbers, no personal details', icon: 'eye' },
    { id: 'proof', label: 'Proof to circle', desc: 'Share photos and full details', icon: 'people' },
  ];

  const privacyOptions = [
    { value: 'default', label: 'Use default' },
    { value: 'private', label: 'Private' },
    { value: 'metrics', label: 'Metrics only' },
    { value: 'proof', label: 'Proof to circle' },
  ];

  const dataPermissions = [
    { key: 'location', label: 'Location', desc: 'Commute ETAs & reminders', icon: 'location', color: '#3B82F6', value: locationEnabled, setter: setLocationEnabled },
    { key: 'calendar', label: 'Calendar', desc: 'Read & write events', icon: 'calendar', color: '#EF4444', value: calendarAccess, setter: setCalendarAccess },
    { key: 'contacts', label: 'Contacts', desc: 'For meeting invites', icon: 'phone-portrait', color: '#10B981', value: contactsAccess, setter: setContactsAccess },
    { key: 'microphone', label: 'Microphone', desc: 'Voice commands & calls', icon: 'mic', color: '#8B5CF6', value: microphoneAccess, setter: setMicrophoneAccess },
    { key: 'health', label: 'Health & Fitness', desc: 'Sleep & activity data', icon: 'heart', color: '#EC4899', value: healthAccess, setter: setHealthAccess },
    { key: 'background', label: 'Background Refresh', desc: 'Keep data synced', icon: 'refresh', color: '#06B6D4', value: backgroundRefresh, setter: setBackgroundRefresh },
  ];

  const getPrivacyLabel = (value: string) => {
    return privacyOptions.find(o => o.value === value)?.label || 'Use default';
  };

  const handleSelectPrivacy = (circleId: number, privacy: string) => {
    setCircles(circles.map(c => c.id === circleId ? { ...c, privacy } : c));
    setShowPicker(null);
  };

  const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.toggle, value && styles.toggleActive]}
    >
      <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Controls</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Your privacy matters</Text>
          <Text style={styles.infoText}>MYPA is designed with privacy-first principles. You control what you share.</Text>
        </View>

        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>DEFAULT PRIVACY MODE</Text>
          <View style={styles.card}>
            {privacyModes.map((mode, i) => {
              const isSelected = defaultPrivacy === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[styles.privacyOption, i > 0 && styles.privacyOptionBorder]}
                  onPress={() => setDefaultPrivacy(mode.id as typeof defaultPrivacy)}
                >
                  <View style={[styles.privacyIcon, isSelected && { backgroundColor: colors.primary }]}>
                    <Ionicons name={mode.icon as any} size={16} color={isSelected ? '#FFFFFF' : '#475569'} />
                  </View>
                  <View style={styles.privacyContent}>
                    <Text style={styles.privacyLabel}>{mode.label}</Text>
                    <Text style={styles.privacyDesc}>{mode.desc}</Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>PER-CIRCLE SETTINGS</Text>
          <View style={styles.card}>
            {circles.map((circle, i) => (
              <TouchableOpacity
                key={circle.id}
                style={[styles.circleRow, i > 0 && styles.circleRowBorder]}
                onPress={() => setShowPicker(circle.id)}
              >
                <Text style={styles.circleName}>{circle.name}</Text>
                <View style={styles.circlePrivacy}>
                  <Text style={styles.circlePrivacyText}>{getPrivacyLabel(circle.privacy)}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionLabel}>ADDITIONAL SETTINGS</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Hide wallet amounts</Text>
                <Text style={styles.settingDesc}>Don't show time saved to circles</Text>
              </View>
              <Toggle value={hideWallet} onToggle={() => setHideWallet(!hideWallet)} />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Anonymous mode</Text>
                <Text style={styles.settingDesc}>Show as "Someone" in circles</Text>
              </View>
              <Toggle value={anonymousMode} onToggle={() => setAnonymousMode(!anonymousMode)} />
            </View>
          </View>
        </View>

        <View style={[styles.sectionWrapper, { marginBottom: 120 }]}>
          <Text style={styles.sectionLabel}>DATA PERMISSIONS</Text>
          <View style={styles.card}>
            {dataPermissions.map((perm, i) => (
              <View key={perm.key}>
                <View style={styles.permissionRow}>
                  <View style={[styles.permIcon, { backgroundColor: perm.value ? perm.color : '#E2E8F0' }]}>
                    <Ionicons name={perm.icon as any} size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.permContent}>
                    <Text style={styles.permLabel}>{perm.label}</Text>
                    <Text style={styles.permDesc}>{perm.desc}</Text>
                  </View>
                  <Toggle value={perm.value} onToggle={() => perm.setter(!perm.value)} />
                </View>
                {i < dataPermissions.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
          <Text style={styles.permNote}>These permissions help MYPA assist you better. Disable any you're not comfortable with.</Text>
        </View>
      </ScrollView>

      <Modal visible={showPicker !== null} transparent animationType="slide">
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowPicker(null)}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>
              {circles.find(c => c.id === showPicker)?.name}
            </Text>
            <View style={styles.pickerOptions}>
              {privacyOptions.map((option, i) => {
                const currentCircle = circles.find(c => c.id === showPicker);
                const isSelected = currentCircle?.privacy === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.pickerOption, i > 0 && styles.pickerOptionBorder]}
                    onPress={() => showPicker && handleSelectPrivacy(showPicker, option.value)}
                  >
                    <Text style={[styles.pickerOptionText, isSelected && { color: '#3B82F6', fontWeight: '600' }]}>
                      {option.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color="#3B82F6" />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowPicker(null)}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  sectionWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  privacyOptionBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  privacyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  privacyContent: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  privacyDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  circleRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  circleName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  circlePrivacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  circlePrivacyText: {
    fontSize: 14,
    color: '#64748B',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  settingDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleKnob: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  permIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  permContent: {
    flex: 1,
  },
  permLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  permDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  permNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    paddingLeft: 4,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingBottom: 32,
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerOptions: {
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pickerOptionBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  pickerOptionText: {
    fontSize: 17,
    color: '#0F172A',
  },
  pickerCancel: {
    marginHorizontal: 8,
    marginTop: 8,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
