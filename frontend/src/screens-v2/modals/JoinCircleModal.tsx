/**
 * Join Circle Modal — Light Theme v2
 *
 * Handles circle invitation acceptance via deep links.
 * Uses joinCircleByCode from useCircles hook.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useCircles } from '../../hooks/supabase/useCircles';

/* ── Light Palette ── */
const L = {
  bg:             '#F5F5F7',
  card:           '#FFFFFF',
  cardBorder:     '#EDEDF0',
  textPrimary:    '#1C1C1E',
  textSecondary:  '#48484A',
  textTertiary:   '#8E8E93',
  textQuaternary: '#C7C7CC',
  divider:        '#EDEDF0',
  purple:         '#7C3AED',
  purpleLight:    '#F5F0FF',
  green:          '#34C759',
  greenLight:     '#ECFDF5',
  danger:         '#DC2626',
  dangerLight:    '#FEF2F2',
};

interface JoinCircleModalProps {
  visible: boolean;
  inviteCode: string | null;
  onClose: () => void;
  onJoined?: () => void;
}

export function JoinCircleModal({ visible, inviteCode, onClose, onJoined }: JoinCircleModalProps) {
  const { joinCircleByCode } = useCircles();

  const [isJoining, setIsJoining] = useState(false);
  const [result, setResult] = useState<'idle' | 'success' | 'error' | 'already_member'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 20, stiffness: 200 });
      opacity.value = withSpring(1);
      setResult('idle');
      setErrorMessage('');
    } else {
      scale.value = withSpring(0.9);
      opacity.value = withSpring(0);
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleJoin = useCallback(async () => {
    if (!inviteCode || isJoining) return;

    setIsJoining(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await joinCircleByCode(inviteCode);
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setResult('success');
        onJoined?.();
      } else {
        const msg = res.error || 'Unable to join circle.';
        if (msg.toLowerCase().includes('already')) {
          setResult('already_member');
        } else {
          setResult('error');
          setErrorMessage(msg);
        }
      }
    } catch {
      setResult('error');
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsJoining(false);
    }
  }, [inviteCode, isJoining, joinCircleByCode, onJoined]);

  // Auto-join on open
  useEffect(() => {
    if (visible && inviteCode && result === 'idle') {
      handleJoin();
    }
  }, [visible, inviteCode]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Animated.View style={[{
          backgroundColor: L.card, borderRadius: 24, width: '100%', maxWidth: 360,
          padding: 28, alignItems: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20,
        }, containerStyle]}>
          {isJoining ? (
            <>
              <ActivityIndicator size="large" color={L.purple} />
              <Text style={{ fontSize: 15, color: L.textTertiary, marginTop: 16, fontWeight: '500' }}>Joining circle…</Text>
            </>
          ) : result === 'success' ? (
            <>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: L.greenLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="checkmark-circle" size={36} color={L.green} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: L.textPrimary, marginBottom: 6 }}>You're In!</Text>
              <Text style={{ fontSize: 14, color: L.textTertiary, textAlign: 'center', marginBottom: 24 }}>
                You've successfully joined the circle.
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: L.purple, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, width: '100%', alignItems: 'center' }}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Done</Text>
              </TouchableOpacity>
            </>
          ) : result === 'already_member' ? (
            <>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: L.purpleLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="people" size={32} color={L.purple} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: L.textPrimary, marginBottom: 6 }}>Already a Member</Text>
              <Text style={{ fontSize: 14, color: L.textTertiary, textAlign: 'center', marginBottom: 24 }}>
                You're already part of this circle!
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: L.purple, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, width: '100%', alignItems: 'center' }}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Got It</Text>
              </TouchableOpacity>
            </>
          ) : result === 'error' ? (
            <>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: L.dangerLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="close-circle" size={36} color={L.danger} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: L.textPrimary, marginBottom: 6 }}>Couldn't Join</Text>
              <Text style={{ fontSize: 14, color: L.textTertiary, textAlign: 'center', marginBottom: 24 }}>
                {errorMessage}
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: L.purple, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, width: '100%', alignItems: 'center' }}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Close</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={L.purple} />
              <Text style={{ fontSize: 15, color: L.textTertiary, marginTop: 16, fontWeight: '500' }}>Loading…</Text>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
