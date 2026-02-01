import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Toggle } from './Toggle';
import { DataPermission } from '../types';
import { styles } from '../styles';

interface DataPermissionsProps {
  permissions: DataPermission[];
}

export const DataPermissions: React.FC<DataPermissionsProps> = ({
  permissions,
}) => (
  <View style={styles.sectionWrapper}>
    <Text style={styles.sectionLabel}>DATA PERMISSIONS</Text>
    <View style={styles.card}>
      {permissions.map((perm, idx) => (
        <React.Fragment key={perm.key}>
          {idx > 0 && <View style={styles.divider} />}
          <View style={styles.permissionRow}>
            <View style={[styles.permIcon, { backgroundColor: perm.color + '20' }]}>
              <Ionicons name={perm.icon as any} size={20} color={perm.color} />
            </View>
            <View style={styles.permContent}>
              <Text style={styles.permLabel}>{perm.label}</Text>
              <Text style={styles.permDesc}>{perm.desc}</Text>
            </View>
            <Toggle
              value={perm.value}
              onToggle={() => perm.setter(!perm.value)}
            />
          </View>
        </React.Fragment>
      ))}
    </View>
    <Text style={styles.permNote}>
      You can change these permissions anytime in your device settings.
    </Text>
  </View>
);
