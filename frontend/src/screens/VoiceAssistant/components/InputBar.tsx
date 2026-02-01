import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface InputBarProps {
  showTextInput: boolean;
  textMessage: string;
  continuousMode: boolean;
  onToggleTextInput: () => void;
  onTextChange: (text: string) => void;
  onSend: () => void;
  onToggleContinuous: () => void;
}

export function InputBar({
  showTextInput,
  textMessage,
  continuousMode,
  onToggleTextInput,
  onTextChange,
  onSend,
  onToggleContinuous,
}: InputBarProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.inputContainer}
    >
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.inputToggle}
          onPress={onToggleTextInput}
        >
          <Ionicons 
            name={showTextInput ? 'mic' : 'chatbubble-outline'} 
            size={24} 
            color="#8B5CF6" 
          />
        </TouchableOpacity>

        {showTextInput ? (
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#64748B"
              value={textMessage}
              onChangeText={onTextChange}
              onSubmitEditing={onSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={onSend}
              disabled={!textMessage.trim()}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={textMessage.trim() ? '#8B5CF6' : '#64748B'} 
              />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.inputHint}>
            {continuousMode ? 'Always listening' : 'Tap orb to talk'}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.continuousToggle,
            continuousMode && styles.continuousToggleActive,
          ]}
          onPress={onToggleContinuous}
        >
          <Ionicons 
            name={continuousMode ? 'radio' : 'radio-outline'} 
            size={20} 
            color={continuousMode ? '#10B981' : '#64748B'} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
