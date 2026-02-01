import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Copy, Bell, Trash2 } from 'lucide-react-native';
import { Circle } from '../types';
import { styles } from '../styles';

interface ActionSheetModalProps {
  visible: boolean;
  circle: Circle | null;
  scaleAnim: Animated.Value;
  onClose: () => void;
  onCopyCode: () => void;
  onMuteNotifications: () => void;
  onLeaveCircle: () => void;
}

export function ActionSheetModal({
  visible,
  circle,
  scaleAnim,
  onClose,
  onCopyCode,
  onMuteNotifications,
  onLeaveCircle,
}: ActionSheetModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <Animated.View
          style={[
            styles.actionSheet,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.actionSheetHandle} />

          <Pressable
            onPress={onCopyCode}
            style={({ pressed }) => [
              styles.actionSheetItem,
              pressed && styles.actionSheetItemPressed,
            ]}
          >
            <View style={[styles.actionSheetIcon, { backgroundColor: '#f0f9ff' }]}>
              <Copy color="#0284c7" size={20} />
            </View>
            <View style={styles.actionSheetText}>
              <Text style={styles.actionSheetTitle}>Copy Invite Code</Text>
              <Text style={styles.actionSheetSubtitle}>
                Share with friends to join
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={onMuteNotifications}
            style={({ pressed }) => [
              styles.actionSheetItem,
              pressed && styles.actionSheetItemPressed,
            ]}
          >
            <View style={[styles.actionSheetIcon, { backgroundColor: '#f1f5f9' }]}>
              <Bell color="#475569" size={20} />
            </View>
            <View style={styles.actionSheetText}>
              <Text style={styles.actionSheetTitle}>Mute Notifications</Text>
              <Text style={styles.actionSheetSubtitle}>
                Stop receiving updates
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={onLeaveCircle}
            style={({ pressed }) => [
              styles.actionSheetItem,
              pressed && styles.actionSheetItemPressedDanger,
            ]}
          >
            <View style={[styles.actionSheetIcon, { backgroundColor: '#fef2f2' }]}>
              <Trash2 color="#dc2626" size={20} />
            </View>
            <View style={styles.actionSheetText}>
              <Text style={[styles.actionSheetTitle, { color: '#dc2626' }]}>
                Leave Circle
              </Text>
              <Text style={styles.actionSheetSubtitle}>
                Remove yourself from this circle
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
