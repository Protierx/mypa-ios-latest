import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { styles } from '../styles';

interface LogoutButtonProps {
  onPress: () => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.logoutButton,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Log out"
    >
      <LogOut color="#ef4444" size={20} />
      <Text style={styles.logoutText}>Log Out</Text>
    </Pressable>
  );
};

export const VersionText: React.FC = () => (
  <Text style={styles.versionText}>MYPA v1.0.0</Text>
);
