/**
 * Create Circle Sheet
 * 
 * Bottom sheet for creating a new circle with members.
 * Opens from Social View "+" button.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useCircles } from '../../hooks/supabase/useCircles';
import { Circle } from '../../lib/supabase';

interface CreateCircleSheetProps {
  visible: boolean;
  onClose: () => void;
  onCircleCreated?: (circle: Circle) => void;
}

const EMOJI_OPTIONS = ['👥', '💼', '🏠', '💪', '📚', '🎮', '🎨', '🎯', '🌟', '❤️', '🔥', '⚡'];

type PrivacyOption = 'public' | 'invite-only' | 'private';

const PRIVACY_OPTIONS: { value: PrivacyOption; label: string; icon: string; description: string }[] = [
  { value: 'public', label: 'Public', icon: 'globe-outline', description: 'Anyone can find and join' },
  { value: 'invite-only', label: 'Invite Only', icon: 'mail-outline', description: 'Requires invitation to join' },
  { value: 'private', label: 'Private', icon: 'lock-closed-outline', description: 'Hidden, invite only' },
];

export function CreateCircleSheet({ visible, onClose, onCircleCreated }: CreateCircleSheetProps) {
  const { createCircle } = useCircles();
  const nameInputRef = useRef<TextInput>(null);
  
  const [emoji, setEmoji] = useState('👥');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyOption>('invite-only');
  const [isCreating, setIsCreating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Success state — shows invite code after creation
  const [createdCircle, setCreatedCircle] = useState<Circle | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Animation
  const translateY = useSharedValue(500);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      setTimeout(() => nameInputRef.current?.focus(), 100);
    } else {
      translateY.value = withSpring(500);
      // Reset form
      setEmoji('👥');
      setName('');
      setDescription('');
      setPrivacy('invite-only');
      setShowEmojiPicker(false);
      setCreatedCircle(null);
      setCopiedCode(false);
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your circle.');
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert('Name Too Short', 'Circle name must be at least 2 characters.');
      return;
    }

    setIsCreating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const circle = await createCircle({
        name: name.trim(),
        emoji,
        description: description.trim() || null,
        privacy,
      });

      setIsCreating(false);

      if (circle) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCreatedCircle(circle);
        onCircleCreated?.(circle);
      } else {
        Alert.alert('Error', 'Something went wrong creating your circle. Please try again.');
      }
    } catch (err: any) {
      setIsCreating(false);
      const message = err?.message || 'Something went wrong. Please try again.';
      Alert.alert('Failed to Create Circle', message);
    }
  }, [name, emoji, description, privacy, createCircle, onCircleCreated]);

  const handleCopyCode = useCallback(async () => {
    if (!createdCircle) return;
    const code = createdCircle.invite_code || createdCircle.id.substring(0, 8);
    await Clipboard.setStringAsync(code);
    setCopiedCode(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [createdCircle]);

  const handleShareLink = useCallback(async () => {
    if (!createdCircle) return;
    const inviteCode = createdCircle.invite_code || createdCircle.id;
    try {
      await Share.share({
        message: `Join my circle "${createdCircle.name}" on MYPA! Use invite code: ${inviteCode}`,
      });
    } catch (err) {
      // User cancelled share
    }
  }, [createdCircle]);

  const handleClose = useCallback(() => {
    // If we're on the success screen, just close
    if (createdCircle) {
      onClose();
      return;
    }
    if (name.trim() || description.trim()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  }, [name, description, onClose, createdCircle]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <Animated.View 
          className="bg-zinc-900 rounded-t-3xl max-h-[90%]"
          style={containerStyle}
        >
          <SafeAreaView edges={['bottom']}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {/* Handle */}
              <View className="items-center py-3">
                <View className="w-10 h-1 bg-zinc-700 rounded-full" />
              </View>

              {/* Header */}
              <View className="flex-row items-center justify-between px-5 pb-4 border-b border-zinc-800">
              {createdCircle ? (
                <>
                  <View style={{ width: 50 }} />
                  <Text className="text-white text-lg font-semibold">Circle Created!</Text>
                  <View style={{ width: 50 }} />
                </>
              ) : (
                <>
                  <TouchableOpacity onPress={handleClose}>
                    <Text className="text-zinc-400">Cancel</Text>
                  </TouchableOpacity>
                  <Text className="text-white text-lg font-semibold">Create Circle</Text>
                  <TouchableOpacity onPress={handleCreate} disabled={isCreating || !name.trim()}>
                    {isCreating ? (
                      <ActivityIndicator size="small" color="#a855f7" />
                    ) : (
                      <Text className={`font-semibold ${name.trim() ? 'text-purple-500' : 'text-zinc-600'}`}>
                        Create
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>

            <ScrollView className="px-5">
              {/* ── Success Screen ── */}
              {createdCircle ? (
                <View className="py-8 items-center">
                  {/* Circle Icon */}
                  <View className="w-24 h-24 rounded-full bg-purple-900/30 border-2 border-purple-500 items-center justify-center mb-4">
                    <Text className="text-5xl">{createdCircle.emoji || '👥'}</Text>
                  </View>
                  
                  <Text className="text-white text-2xl font-bold mb-1">{createdCircle.name}</Text>
                  <Text className="text-green-400 text-base mb-6">Circle Created!</Text>

                  {/* Invite Code Box */}
                  <View className="w-full bg-zinc-800 rounded-2xl p-5 mb-4 border border-zinc-700">
                    <Text className="text-zinc-400 text-sm mb-2 text-center">Invite Code</Text>
                    <Text className="text-white text-3xl font-mono font-bold text-center tracking-widest mb-4">
                      {(createdCircle.invite_code || createdCircle.id.substring(0, 8)).toUpperCase()}
                    </Text>
                      
                      <View className="flex-row gap-3">
                        {/* Copy Code */}
                        <TouchableOpacity
                          className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                            copiedCode ? 'bg-green-600' : 'bg-zinc-700'
                          }`}
                          onPress={handleCopyCode}
                        >
                          <Ionicons 
                            name={copiedCode ? 'checkmark' : 'copy-outline'} 
                            size={18} 
                            color="#fff" 
                          />
                          <Text className="text-white font-medium ml-2">
                            {copiedCode ? 'Copied!' : 'Copy Code'}
                          </Text>
                        </TouchableOpacity>

                        {/* Share Link */}
                        <TouchableOpacity
                          className="flex-1 flex-row items-center justify-center bg-purple-600 py-3 rounded-xl"
                          onPress={handleShareLink}
                        >
                          <Ionicons name="share-outline" size={18} color="#fff" />
                          <Text className="text-white font-medium ml-2">Share</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                  <Text className="text-zinc-500 text-sm text-center mb-6">
                    Share this code with friends and family so they can join your circle.
                  </Text>

                  {/* Done Button */}
                  <TouchableOpacity
                    className="w-full bg-purple-600 py-4 rounded-xl items-center"
                    onPress={onClose}
                  >
                    <Text className="text-white text-lg font-semibold">Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
              <>
              {/* ── Create Form ── */}

              {/* Emoji Picker */}
              <View className="py-4 items-center">
                <TouchableOpacity
                  className="w-20 h-20 rounded-full bg-zinc-800 items-center justify-center"
                  onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Text className="text-4xl">{emoji}</Text>
                </TouchableOpacity>
                <Text className="text-zinc-500 text-sm mt-2">Tap to change emoji</Text>
                
                {showEmojiPicker && (
                  <View className="flex-row flex-wrap justify-center mt-3 bg-zinc-800 rounded-xl p-3">
                    {EMOJI_OPTIONS.map((e) => (
                      <TouchableOpacity
                        key={e}
                        className={`w-12 h-12 items-center justify-center rounded-lg ${
                          emoji === e ? 'bg-purple-600' : ''
                        }`}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setEmoji(e);
                          setShowEmojiPicker(false);
                        }}
                      >
                        <Text className="text-2xl">{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Name Input */}
              <View className="py-4 border-b border-zinc-800">
                <Text className="text-zinc-500 text-sm mb-2">Circle Name *</Text>
                <TextInput
                  ref={nameInputRef}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Work Team, Family, Fitness Buddies"
                  placeholderTextColor="#52525b"
                  className="text-white text-lg"
                  maxLength={30}
                />
                <Text className="text-zinc-600 text-xs mt-1 text-right">{name.length}/30</Text>
              </View>

              {/* Description */}
              <View className="py-4 border-b border-zinc-800">
                <Text className="text-zinc-500 text-sm mb-2">Description (optional)</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What's this circle about?"
                  placeholderTextColor="#52525b"
                  multiline
                  numberOfLines={2}
                  className="text-white text-base"
                  maxLength={100}
                />
              </View>

              {/* Privacy */}
              <View className="py-4">
                <Text className="text-zinc-500 text-sm mb-3">Privacy</Text>
                {PRIVACY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    className={`flex-row items-center p-3 rounded-xl mb-2 ${
                      privacy === option.value ? 'bg-purple-900/50 border border-purple-500' : 'bg-zinc-800'
                    }`}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPrivacy(option.value);
                    }}
                  >
                    <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-3">
                      <Ionicons name={option.icon as any} size={20} color="#fff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium">{option.label}</Text>
                      <Text className="text-zinc-500 text-sm">{option.description}</Text>
                    </View>
                    {privacy === option.value && (
                      <Ionicons name="checkmark-circle" size={24} color="#a855f7" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Info */}
              <View className="py-4 mb-4">
                <View className="flex-row items-start bg-zinc-800/50 p-3 rounded-lg">
                  <Ionicons name="information-circle-outline" size={20} color="#71717a" />
                  <Text className="text-zinc-500 text-sm ml-2 flex-1">
                    You can invite members after creating the circle. As the creator, you'll be the owner.
                  </Text>
                </View>
              </View>
              </>
              )}
            </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
