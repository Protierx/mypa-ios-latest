import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface TextInputBarProps {
  textMessage: string;
  onTextChange: (text: string) => void;
  onSend: () => void;
}

export function TextInputBar({ textMessage, onTextChange, onSend }: TextInputBarProps) {
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.textInputContainer}
    >
      <View style={styles.textInputWrapper}>
        <TextInput
          style={styles.textInput}
          value={textMessage}
          onChangeText={onTextChange}
          placeholder="Type your message..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, !textMessage.trim() && styles.sendBtnDisabled]}
          onPress={onSend}
          disabled={!textMessage.trim()}
        >
          <Ionicons name="send" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
