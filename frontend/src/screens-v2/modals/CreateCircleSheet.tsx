/**
 * Create Circle Sheet — Premium Light Theme
 *
 * Bottom sheet for creating a new circle.
 * Opens from Circles Home "Create Circle" button.
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
import { bg, brand, text as textTokens, border as borderTokens, semantic } from '../../styles/colors';
import { shadows, radius } from '../../styles/theme';

/* ────────────── Types ────────────── */

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

/* ────────────── Component ────────────── */

export function CreateCircleSheet({ visible, onClose, onCircleCreated }: CreateCircleSheetProps) {
  const { createCircle } = useCircles();
  const nameInputRef = useRef<TextInput>(null);

  const [emoji, setEmoji] = useState('👥');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyOption>('invite-only');
  const [isCreating, setIsCreating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [createdCircle, setCreatedCircle] = useState<Circle | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const translateY = useSharedValue(500);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      setTimeout(() => nameInputRef.current?.focus(), 100);
    } else {
      translateY.value = withSpring(500);
      setEmoji('👥'); setName(''); setDescription(''); setPrivacy('invite-only');
      setShowEmojiPicker(false); setCreatedCircle(null); setCopiedCode(false);
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const handleCreate = useCallback(async () => {
    if (!name.trim()) { Alert.alert('Name Required', 'Please enter a name for your circle.'); return; }
    if (name.trim().length < 2) { Alert.alert('Name Too Short', 'Circle name must be at least 2 characters.'); return; }

    setIsCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const circle = await createCircle({ name: name.trim(), emoji, description: description.trim() || null, privacy });
      setIsCreating(false);
      if (circle) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCreatedCircle(circle);
        onCircleCreated?.(circle);
      } else {
        Alert.alert('Error', 'Something went wrong creating your circle.');
      }
    } catch (err: any) {
      setIsCreating(false);
      Alert.alert('Failed to Create Circle', err?.message || 'Something went wrong.');
    }
  }, [name, emoji, description, privacy, createCircle, onCircleCreated]);

  const handleCopyCode = useCallback(async () => {
    if (!createdCircle) return;
    const code = createdCircle.invite_code || createdCircle.id.substring(0, 8);
    await Clipboard.setStringAsync(code);
    setCopiedCode(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [createdCircle]);

  const handleShareLink = useCallback(async () => {
    if (!createdCircle) return;
    const inviteCode = createdCircle.invite_code || createdCircle.id;
    try { await Share.share({ message: `Join my circle "${createdCircle.name}" on MYPA! Use invite code: ${inviteCode}` }); } catch {}
  }, [createdCircle]);

  const handleClose = useCallback(() => {
    if (createdCircle) { onClose(); return; }
    if (name.trim() || description.trim()) {
      Alert.alert('Discard Changes?', 'You have unsaved changes.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onClose },
      ]);
    } else { onClose(); }
  }, [name, description, onClose, createdCircle]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
        <Animated.View style={[{ backgroundColor: bg.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }, containerStyle]}>
          <SafeAreaView edges={['bottom']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              {/* Handle */}
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: borderTokens.primary }} />
              </View>

              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
                {createdCircle ? (
                  <>
                    <View style={{ width: 50 }} />
                    <Text style={{ fontSize: 17, fontWeight: '700', color: textTokens.primary }}>Circle Created!</Text>
                    <View style={{ width: 50 }} />
                  </>
                ) : (
                  <>
                    <TouchableOpacity onPress={handleClose}><Text style={{ fontSize: 15, color: textTokens.tertiary }}>Cancel</Text></TouchableOpacity>
                    <Text style={{ fontSize: 17, fontWeight: '700', color: textTokens.primary }}>Create Circle</Text>
                    <TouchableOpacity onPress={handleCreate} disabled={isCreating || !name.trim()}>
                      {isCreating ? <ActivityIndicator size="small" color={brand.primary} /> : (
                        <Text style={{ fontSize: 15, fontWeight: '700', color: name.trim() ? brand.primary : textTokens.disabled }}>Create</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
                {createdCircle ? (
                  /* ── Success Screen ── */
                  <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                    <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: brand.muted, borderWidth: 2, borderColor: brand.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Text style={{ fontSize: 44 }}>{createdCircle.emoji || '👥'}</Text>
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: textTokens.primary, marginBottom: 4 }}>{createdCircle.name}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: semantic.success }}>Circle Created!</Text>

                    <View style={{ width: '100%', backgroundColor: bg.primary, borderRadius: 16, padding: 20, marginTop: 20, marginBottom: 16, borderWidth: 0.5, borderColor: borderTokens.primary }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, textAlign: 'center', marginBottom: 8 }}>INVITE CODE</Text>
                      <Text style={{ fontSize: 28, fontWeight: '800', color: textTokens.primary, textAlign: 'center', letterSpacing: 3, marginBottom: 16, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                        {(createdCircle.invite_code || createdCircle.id.substring(0, 8)).toUpperCase()}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: copiedCode ? semantic.successLight : borderTokens.primary, paddingVertical: 12, borderRadius: 12, gap: 6 }}
                          onPress={handleCopyCode}
                        >
                          <Ionicons name={copiedCode ? 'checkmark' : 'copy-outline'} size={16} color={copiedCode ? semantic.success : textTokens.secondary} />
                          <Text style={{ fontSize: 14, fontWeight: '600', color: copiedCode ? semantic.success : textTokens.secondary }}>{copiedCode ? 'Copied!' : 'Copy Code'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: brand.primary, paddingVertical: 12, borderRadius: 12, gap: 6 }}
                          onPress={handleShareLink}
                        >
                          <Ionicons name="share-outline" size={16} color="#fff" />
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={{ fontSize: 13, color: textTokens.tertiary, textAlign: 'center', marginBottom: 20 }}>
                      Share this code with friends so they can join your circle.
                    </Text>

                    <TouchableOpacity
                      style={{ width: '100%', backgroundColor: brand.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: brand.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 }}
                      onPress={onClose}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Done</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* ── Create Form ── */
                  <>
                    {/* Emoji Picker */}
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                      <TouchableOpacity
                        style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: bg.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: borderTokens.primary }}
                        onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <Text style={{ fontSize: 36 }}>{emoji}</Text>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 12, color: textTokens.tertiary, marginTop: 6 }}>Tap to change</Text>
                      {showEmojiPicker && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10, backgroundColor: bg.primary, borderRadius: 14, padding: 10, gap: 4 }}>
                          {EMOJI_OPTIONS.map((e) => (
                            <TouchableOpacity
                              key={e}
                              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: emoji === e ? brand.muted : 'transparent' }}
                              onPress={() => { Haptics.selectionAsync(); setEmoji(e); setShowEmojiPicker(false); }}
                            >
                              <Text style={{ fontSize: 22 }}>{e}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Name Input */}
                    <View style={{ paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 6 }}>Circle Name *</Text>
                      <TextInput
                        ref={nameInputRef}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g., Work Team, Family, Fitness Buddies"
                        placeholderTextColor={textTokens.disabled}
                        style={{ fontSize: 17, color: textTokens.primary, fontWeight: '500' }}
                        maxLength={30}
                      />
                      <Text style={{ fontSize: 11, color: textTokens.disabled, marginTop: 4, textAlign: 'right' }}>{name.length}/30</Text>
                    </View>

                    {/* Description */}
                    <View style={{ paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: borderTokens.primary }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 6 }}>Description (optional)</Text>
                      <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="What's this circle about?"
                        placeholderTextColor={textTokens.disabled}
                        multiline numberOfLines={2}
                        style={{ fontSize: 15, color: textTokens.primary }}
                        maxLength={100}
                      />
                    </View>

                    {/* Privacy */}
                    <View style={{ paddingVertical: 14 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: textTokens.tertiary, marginBottom: 10 }}>Privacy</Text>
                      {PRIVACY_OPTIONS.map((option) => {
                        const selected = privacy === option.value;
                        return (
                          <TouchableOpacity
                            key={option.value}
                            style={{
                              flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8,
                              backgroundColor: selected ? brand.muted : bg.primary,
                              borderWidth: 1, borderColor: selected ? `${brand.primary}30` : borderTokens.primary,
                            }}
                            onPress={() => { Haptics.selectionAsync(); setPrivacy(option.value); }}
                          >
                            <View style={{
                              width: 40, height: 40, borderRadius: 20, marginRight: 12,
                              backgroundColor: selected ? brand.surface : borderTokens.primary,
                              alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Ionicons name={option.icon as any} size={18} color={selected ? brand.primary : textTokens.tertiary} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 15, fontWeight: '600', color: textTokens.primary }}>{option.label}</Text>
                              <Text style={{ fontSize: 12, color: textTokens.tertiary, marginTop: 1 }}>{option.description}</Text>
                            </View>
                            {selected && <Ionicons name="checkmark-circle" size={22} color={brand.primary} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Info */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: bg.primary, padding: 12, borderRadius: 10, marginBottom: 20 }}>
                      <Ionicons name="information-circle-outline" size={18} color={textTokens.tertiary} />
                      <Text style={{ fontSize: 12.5, color: textTokens.tertiary, marginLeft: 8, flex: 1, lineHeight: 17 }}>
                        You can invite members after creating the circle. As the creator, you'll be the owner.
                      </Text>
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
