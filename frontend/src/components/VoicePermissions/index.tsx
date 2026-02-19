/**
 * Voice Permissions Component
 * 
 * Handles microphone permission requests with friendly UI.
 * Never blocks the app - voice is a feature, not a requirement.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface VoicePermissionsProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

export function VoicePermissions({
  visible,
  onClose,
  onPermissionGranted,
  onPermissionDenied,
}: VoicePermissionsProps) {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [showDeniedMessage, setShowDeniedMessage] = useState(false);

  // Animation for the microphone icon
  const micScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (visible) {
      // Pulse animation for microphone
      micScale.value = withRepeat(
        withSequence(
          withSpring(1.1),
          withSpring(1)
        ),
        -1,
        true
      );

      // Pulse ring animation
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const checkPermission = useCallback(async () => {
    const { status } = await getRecordingPermissionsAsync();
    if (status === 'granted') {
      setPermissionStatus('granted');
      return true;
    } else if (status === 'denied') {
      setPermissionStatus('denied');
      return false;
    }
    setPermissionStatus('undetermined');
    return null;
  }, []);

  const requestPermission = useCallback(async () => {
    const { status } = await requestRecordingPermissionsAsync();
    
    if (status === 'granted') {
      setPermissionStatus('granted');
      onPermissionGranted();
      onClose();
    } else {
      setPermissionStatus('denied');
      setShowDeniedMessage(true);
    }
  }, [onPermissionGranted, onClose]);

  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
    onClose();
  }, [onClose]);

  const handleSkip = useCallback(() => {
    onPermissionDenied();
    onClose();
  }, [onPermissionDenied, onClose]);

  useEffect(() => {
    if (visible) {
      checkPermission();
      setShowDeniedMessage(false);
    }
  }, [visible, checkPermission]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={40}
        tint="dark"
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(22, 22, 22, 0.95)',
            borderRadius: 24,
            padding: 32,
            width: '100%',
            maxWidth: 340,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Microphone Icon with Pulse */}
          <View style={{ position: 'relative', marginBottom: 24 }}>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: '#4AADA1',
                  top: -10,
                  left: -10,
                },
                pulseAnimatedStyle,
              ]}
            />
            <Animated.View
              style={[
                {
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#4AADA1',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                micAnimatedStyle,
              ]}
            >
              <Ionicons name="mic" size={36} color="#FFFFFF" />
            </Animated.View>
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: '#FFFFFF',
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            Enable Voice
          </Text>

          {/* Description */}
          {!showDeniedMessage ? (
            <Text
              style={{
                fontSize: 15,
                color: '#A1A1AA',
                textAlign: 'center',
                marginBottom: 32,
                lineHeight: 22,
              }}
            >
              MYPA needs microphone access to hear your voice commands.{'\n\n'}
              Just tap anywhere and talk naturally - like chatting with a friend.
            </Text>
          ) : (
            <Text
              style={{
                fontSize: 15,
                color: '#A1A1AA',
                textAlign: 'center',
                marginBottom: 32,
                lineHeight: 22,
              }}
            >
              Microphone access was denied.{'\n\n'}
              You can still use MYPA with text input, or enable microphone in Settings.
            </Text>
          )}

          {/* Privacy Note */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(74, 173, 161, 0.1)',
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              marginBottom: 24,
            }}
          >
            <Ionicons name="shield-checkmark" size={18} color="#4AADA1" />
            <Text
              style={{
                fontSize: 13,
                color: '#A1A1AA',
                marginLeft: 8,
                flex: 1,
              }}
            >
              Your voice is processed securely and never stored.
            </Text>
          </View>

          {/* Buttons */}
          {!showDeniedMessage ? (
            <TouchableOpacity
              onPress={requestPermission}
              style={{
                width: '100%',
                backgroundColor: '#4AADA1',
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                marginBottom: 12,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}
              >
                Allow Microphone
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={openSettings}
              style={{
                width: '100%',
                backgroundColor: '#4AADA1',
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                marginBottom: 12,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}
              >
                Open Settings
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleSkip}
            style={{
              width: '100%',
              paddingVertical: 14,
              alignItems: 'center',
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 15,
                color: '#A1A1AA',
              }}
            >
              {showDeniedMessage ? 'Continue without voice' : 'Maybe later'}
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}

/**
 * Hook to check and request voice permissions
 */
export function useVoicePermissions() {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const checkPermission = useCallback(async (): Promise<PermissionStatus> => {
    const { status: audioStatus } = await getRecordingPermissionsAsync();
    
    const newStatus: PermissionStatus = 
      audioStatus === 'granted' ? 'granted' :
      audioStatus === 'denied' ? 'denied' : 'undetermined';
    
    setStatus(newStatus);
    return newStatus;
  }, []);

  const requestPermissionIfNeeded = useCallback(async (): Promise<boolean> => {
    const currentStatus = await checkPermission();
    
    if (currentStatus === 'granted') {
      return true;
    }
    
    if (currentStatus === 'undetermined') {
      setShowPermissionModal(true);
      return false; // Will be handled by modal
    }
    
    // Denied - show modal to guide to settings
    setShowPermissionModal(true);
    return false;
  }, [checkPermission]);

  const hideModal = useCallback(() => {
    setShowPermissionModal(false);
  }, []);

  return {
    permissionStatus: status,
    showPermissionModal,
    checkPermission,
    requestPermissionIfNeeded,
    hideModal,
    setShowPermissionModal,
  };
}

export default VoicePermissions;
