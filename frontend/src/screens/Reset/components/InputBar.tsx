import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { styles } from '../styles';

interface InputBarProps {
  value: string;
  isRecording: boolean;
  recordSeconds: number;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onToggleRecording: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({
  value,
  isRecording,
  recordSeconds,
  onChangeText,
  onSend,
  onToggleRecording,
}) => {
  return (
    <>
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording... {recordSeconds}s</Text>
          <Text style={styles.recordingHint}>Tap mic to stop</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonRecording]}
          onPress={onToggleRecording}
        >
          {isRecording ? (
            <Ionicons name="stop" size={20} color="#FCA5A5" />
          ) : (
            <Ionicons name="mic" size={20} color="rgba(255,255,255,0.6)" />
          )}
        </TouchableOpacity>

        <View style={styles.textInputWrapper}>
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={onChangeText}
            placeholder="Say anything..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            onSubmitEditing={onSend}
            returnKeyType="send"
          />
        </View>

        <TouchableOpacity
          style={[styles.sendButton, value.trim() && styles.sendButtonActive]}
          onPress={onSend}
          disabled={!value.trim()}
        >
          <Feather
            name="send"
            size={20}
            color={value.trim() ? '#FFF' : 'rgba(255,255,255,0.3)'}
          />
        </TouchableOpacity>
      </View>
    </>
  );
};
