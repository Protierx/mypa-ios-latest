/**
 * Integration Status Modal (75% sheet)
 *
 * Shows connection status for Apple / Email / Google / Calendar.
 * Frontend-only — buttons show UI state but make no backend calls.
 */

import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Integration {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  connected: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  integrations: Integration[];
  onToggle: (id: string) => void;
  accentColor?: string;
}

function StatusChip({ connected, accentColor }: { connected: boolean; accentColor: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: connected ? '#DCFCE7' : '#F2F2F7',
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: connected ? '#16A34A' : '#8E8E93',
        }}
      >
        {connected ? 'Connected' : 'Not Connected'}
      </Text>
    </View>
  );
}

export function IntegrationStatusModal({
  visible,
  onClose,
  integrations,
  onToggle,
  accentColor = '#4AADA1',
}: Props) {
  const handleToggle = (integ: Integration) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (integ.connected) {
      Alert.alert(
        `Disconnect ${integ.label}?`,
        `This will remove ${integ.label} integration from your account.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: () => onToggle(integ.id) },
        ],
      );
    } else {
      // Simulate connection — frontend-only
      onToggle(integ.id);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onClose}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            style={{
              backgroundColor: '#F8F8FA',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '75%',
              borderTopWidth: 1,
              borderColor: '#E5E5EA',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#C7C7CC' }} />
            </View>

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 16,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#1C1C1E' }}>
                Integrations
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close integrations"
                accessibilityRole="button"
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: '#E5E5EA',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={18} color="#8E8E93" />
                </View>
              </TouchableOpacity>
            </View>

            {/* List */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
              <Text style={{ fontSize: 14, color: '#8E8E93', marginBottom: 16, lineHeight: 20 }}>
                Connect services to sync calendars, email, and sign-in. Manage each integration below.
              </Text>

              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E5E5EA',
                  overflow: 'hidden',
                }}
              >
                {integrations.map((integ, idx) => (
                  <React.Fragment key={integ.id}>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 16,
                      }}
                      onPress={() => handleToggle(integ)}
                      activeOpacity={0.6}
                      accessibilityLabel={`${integ.label}: ${integ.connected ? 'Connected' : 'Not connected'}`}
                      accessibilityRole="button"
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: '#F2F2F7',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Ionicons name={integ.icon} size={20} color={integ.iconColor} />
                      </View>
                      <Text style={{ flex: 1, fontSize: 16, color: '#1C1C1E', fontWeight: '500' }}>
                        {integ.label}
                      </Text>
                      <StatusChip connected={integ.connected} accentColor={accentColor} />
                    </TouchableOpacity>
                    {idx < integrations.length - 1 && (
                      <View style={{ height: 1, backgroundColor: '#E5E5EA', marginLeft: 64 }} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>

            <SafeAreaView edges={['bottom']} />
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
