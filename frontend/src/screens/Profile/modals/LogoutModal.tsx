import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Animated } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { styles } from '../styles';

interface LogoutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  opacityAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  visible,
  onClose,
  onConfirm,
  opacityAnim,
  scaleAnim,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalBackdrop,
            { opacity: opacityAnim },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.logoutModal,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoutIconContainer}>
            <LogOut color="#ef4444" size={32} />
          </View>
          <Text style={styles.logoutModalTitle}>Log out?</Text>
          <Text style={styles.logoutModalSubtitle}>
            Are you sure you want to log out of MYPA?
          </Text>
          <View style={styles.logoutModalButtons}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.logoutCancelButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.logoutCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.logoutConfirmButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.logoutConfirmText}>Log Out</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
