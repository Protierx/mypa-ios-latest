/**
 * Join Circle Modal
 * 
 * Handle circle invitation acceptance via deep links.
 * Shows circle preview and join/decline options.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
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
import { Circle, Profile } from '../../lib/supabase';

interface JoinCircleModalProps {
  visible: boolean;
  inviteCode: string | null;
  onClose: () => void;
  onJoined?: (circle: Circle) => void;
}

interface CirclePreview {
  circle: Circle;
  members: Profile[];
  inviter?: Profile;
  memberCount: number;
}

export function JoinCircleModal({ visible, inviteCode, onClose, onJoined }: JoinCircleModalProps) {
  const { getInvitePreview, acceptInvite, declineInvite, checkMembership } = useCircles();
  
  const [preview, setPreview] = useState<CirclePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  // Animation
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 20, stiffness: 200 });
      opacity.value = withSpring(1);
    } else {
      scale.value = withSpring(0.9);
      opacity.value = withSpring(0);
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const loadPreview = useCallback(async () => {
    if (!inviteCode) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getInvitePreview(inviteCode);
      
      if (!data) {
        setError('This invitation link is invalid or has expired.');
        return;
      }
      
      // Check if already a member
      const isMember = await checkMembership(data.circle.id);
      if (isMember) {
        setAlreadyMember(true);
        setPreview(data);
        return;
      }
      
      setPreview(data);
    } catch (err) {
      setError('Unable to load invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inviteCode, getInvitePreview, checkMembership]);

  useEffect(() => {
    if (visible && inviteCode) {
      loadPreview();
    }
  }, [visible, inviteCode, loadPreview]);

  const handleJoin = useCallback(async () => {
    if (!inviteCode) return;
    
    setIsJoining(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const circle = await acceptInvite(inviteCode);
      
      if (circle) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onJoined?.(circle);
        onClose();
      } else {
        Alert.alert('Error', 'Unable to join circle. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsJoining(false);
    }
  }, [inviteCode, acceptInvite, onJoined, onClose]);

  const handleDecline = useCallback(async () => {
    if (!inviteCode) return;
    
    setIsDeclining(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await declineInvite(inviteCode);
    } finally {
      setIsDeclining(false);
      onClose();
    }
  }, [inviteCode, declineInvite, onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 items-center justify-center px-6">
        <Animated.View 
          className="bg-zinc-900 rounded-3xl w-full max-w-sm overflow-hidden"
          style={containerStyle}
        >
          {isLoading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color="#a855f7" />
              <Text className="text-zinc-500 mt-4">Loading invitation...</Text>
            </View>
          ) : error ? (
            <View className="p-6 items-center">
              <View className="w-16 h-16 rounded-full bg-red-900/50 items-center justify-center mb-4">
                <Ionicons name="close-circle-outline" size={40} color="#ef4444" />
              </View>
              <Text className="text-white text-lg font-semibold mb-2">Invalid Invitation</Text>
              <Text className="text-zinc-500 text-center">{error}</Text>
              <TouchableOpacity
                className="mt-6 py-3 px-6 bg-zinc-800 rounded-xl"
                onPress={onClose}
              >
                <Text className="text-white font-medium">Close</Text>
              </TouchableOpacity>
            </View>
          ) : alreadyMember ? (
            <View className="p-6 items-center">
              <View className="w-16 h-16 rounded-full bg-green-900/50 items-center justify-center mb-4">
                <Ionicons name="checkmark-circle-outline" size={40} color="#22c55e" />
              </View>
              <Text className="text-white text-lg font-semibold mb-2">Already a Member</Text>
              <Text className="text-zinc-500 text-center">
                You're already part of {preview?.circle.name || 'this circle'}!
              </Text>
              <TouchableOpacity
                className="mt-6 py-3 px-6 bg-purple-600 rounded-xl"
                onPress={onClose}
              >
                <Text className="text-white font-semibold">Got it</Text>
              </TouchableOpacity>
            </View>
          ) : preview ? (
            <>
              {/* Circle Preview */}
              <View className="p-6 items-center border-b border-zinc-800">
                <View className="w-20 h-20 rounded-full bg-zinc-800 items-center justify-center mb-4">
                  <Text className="text-4xl">{preview.circle.emoji || '👥'}</Text>
                </View>
                <Text className="text-white text-xl font-bold mb-1">{preview.circle.name}</Text>
                <Text className="text-zinc-500">{preview.memberCount} member{preview.memberCount !== 1 ? 's' : ''}</Text>
                
                {preview.circle.description && (
                  <Text className="text-zinc-400 text-center mt-3">{preview.circle.description}</Text>
                )}
              </View>

              {/* Member Avatars */}
              {preview.members.length > 0 && (
                <View className="px-6 py-4 border-b border-zinc-800">
                  <View className="flex-row justify-center">
                    {preview.members.slice(0, 5).map((member, index) => (
                      <View 
                        key={member.id}
                        className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center border-2 border-zinc-900"
                        style={{ marginLeft: index > 0 ? -10 : 0 }}
                      >
                        {member.avatar_url ? (
                          <Image source={{ uri: member.avatar_url }} className="w-full h-full rounded-full" />
                        ) : (
                          <Text className="text-white font-semibold">
                            {member.display_name?.[0]?.toUpperCase() || '?'}
                          </Text>
                        )}
                      </View>
                    ))}
                    {preview.memberCount > 5 && (
                      <View 
                        className="w-10 h-10 rounded-full bg-zinc-600 items-center justify-center border-2 border-zinc-900"
                        style={{ marginLeft: -10 }}
                      >
                        <Text className="text-white text-xs font-medium">+{preview.memberCount - 5}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Inviter */}
              {preview.inviter && (
                <View className="px-6 py-3 border-b border-zinc-800">
                  <Text className="text-zinc-500 text-sm text-center">
                    Invited by <Text className="text-white">{preview.inviter.display_name}</Text>
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View className="p-6">
                <TouchableOpacity
                  className="bg-purple-600 py-4 rounded-xl items-center mb-3"
                  onPress={handleJoin}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold text-base">Join Circle</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="py-3 items-center"
                  onPress={handleDecline}
                  disabled={isDeclining}
                >
                  {isDeclining ? (
                    <ActivityIndicator size="small" color="#71717a" />
                  ) : (
                    <Text className="text-zinc-500">Decline</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
