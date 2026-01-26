import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { colors } from '../styles/colors';

interface SettingItem {
  id: string;
  iconName: string;
  iconColor: string;
  title: string;
  type: 'toggle' | 'navigation' | 'value';
  value?: string | boolean;
}

const settingsSections = [
  {
    title: 'Preferences',
    items: [
      { id: '1', iconName: 'notifications', iconColor: '#F59E0B', title: 'Push Notifications', type: 'toggle' as const, value: true },
      { id: '2', iconName: 'moon', iconColor: '#8B5CF6', title: 'Dark Mode', type: 'toggle' as const, value: false },
      { id: '3', iconName: 'volume-high', iconColor: '#3B82F6', title: 'Sound Effects', type: 'toggle' as const, value: true },
      { id: '4', iconName: 'location', iconColor: '#F43F5E', title: 'Location Services', type: 'toggle' as const, value: true },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: '5', iconName: 'person', iconColor: '#3B82F6', title: 'Personal Information', type: 'navigation' as const },
      { id: '6', iconName: 'lock-closed', iconColor: '#10B981', title: 'Password & Security', type: 'navigation' as const },
      { id: '7', iconName: 'mail', iconColor: '#8B5CF6', title: 'Email Preferences', type: 'navigation' as const },
      { id: '8', iconName: 'link', iconColor: '#F59E0B', title: 'Connected Accounts', type: 'value' as const, value: '3 connected' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { id: '9', iconName: 'calendar', iconColor: '#F43F5E', title: 'Calendar Sync', type: 'value' as const, value: 'Google' },
      { id: '10', iconName: 'fitness', iconColor: '#10B981', title: 'Health Apps', type: 'value' as const, value: 'Apple Health' },
      { id: '11', iconName: 'musical-notes', iconColor: '#EC4899', title: 'Music', type: 'value' as const, value: 'Spotify' },
    ],
  },
  {
    title: 'App Settings',
    items: [
      { id: '12', iconName: 'globe', iconColor: '#06B6D4', title: 'Language', type: 'value' as const, value: 'English' },
      { id: '13', iconName: 'resize', iconColor: '#64748B', title: 'Units', type: 'value' as const, value: 'Metric' },
      { id: '14', iconName: 'time', iconColor: '#3B82F6', title: 'Time Format', type: 'value' as const, value: '12-hour' },
      { id: '15', iconName: 'calendar-outline', iconColor: '#F59E0B', title: 'Week Start', type: 'value' as const, value: 'Monday' },
    ],
  },
  {
    title: 'Support',
    items: [
      { id: '16', iconName: 'help-circle', iconColor: '#3B82F6', title: 'Help Center', type: 'navigation' as const },
      { id: '17', iconName: 'chatbubbles', iconColor: '#10B981', title: 'Contact Support', type: 'navigation' as const },
      { id: '18', iconName: 'star', iconColor: '#F59E0B', title: 'Rate App', type: 'navigation' as const },
      { id: '19', iconName: 'document-text', iconColor: '#64748B', title: 'Terms & Privacy', type: 'navigation' as const },
    ],
  },
];

export function SettingsScreen({ navigation }: any) {
  const [toggles, setToggles] = useState<{ [key: string]: boolean }>({
    '1': true,
    '2': false,
    '3': true,
    '4': true,
  });

  const handleToggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Profile Quick Access */}
        <TouchableOpacity style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>AJ</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Alex Johnson</Text>
            <Text style={styles.profileEmail}>alex.johnson@email.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.settingItem, index < section.items.length - 1 && styles.settingItemBorder]}
                >
                  <View style={[styles.settingIconContainer, { backgroundColor: item.iconColor + '15' }]}>
                    <Ionicons name={item.iconName as any} size={18} color={item.iconColor} />
                  </View>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  {item.type === 'toggle' && (
                    <Switch
                      value={toggles[item.id]}
                      onValueChange={() => handleToggle(item.id)}
                      trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                      thumbColor={toggles[item.id] ? '#8B5CF6' : '#94A3B8'}
                      ios_backgroundColor="#E2E8F0"
                    />
                  )}
                  {item.type === 'navigation' && (
                    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                  )}
                  {item.type === 'value' && (
                    <View style={styles.valueContainer}>
                      <Text style={styles.settingValue}>{item.value}</Text>
                      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.dangerButton}>
            <Ionicons name="log-out-outline" size={20} color="#F43F5E" />
            <Text style={styles.dangerButtonText}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dangerButton, styles.deleteButton]}>
            <Ionicons name="trash-outline" size={20} color="#F43F5E" />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#94A3B8" />
          <Text style={styles.versionText}>Version 1.0.0 (Build 156)</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 20, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  profileAvatarText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  profileEmail: { fontSize: 13, color: '#64748B' },
  section: { marginBottom: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  settingIconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingTitle: { flex: 1, fontSize: 15, color: '#0F172A' },
  valueContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingValue: { fontSize: 14, color: '#64748B' },
  dangerSection: { paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  dangerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FEE2E2' },
  deleteButton: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  dangerButtonText: { fontSize: 15, fontWeight: '600', color: '#F43F5E' },
  versionContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 },
  versionText: { fontSize: 12, color: '#94A3B8' },
});
