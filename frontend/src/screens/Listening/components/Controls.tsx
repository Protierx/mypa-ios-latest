import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';
import { styles } from '../styles';

interface ControlsProps {
  isListening: boolean;
  showTextInput: boolean;
  onToggleListening: () => void;
  onToggleTextInput: () => void;
  onClose: () => void;
}

export function Controls({
  isListening,
  showTextInput,
  onToggleListening,
  onToggleTextInput,
  onClose,
}: ControlsProps) {
  return (
    <>
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlBtn, !isListening && styles.controlBtnMuted]}
          onPress={onToggleListening}
        >
          <Ionicons 
            name={isListening ? "mic" : "mic-off"} 
            size={20} 
            color={isListening ? "rgba(255,255,255,0.8)" : "#F87171"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.endCallBtn} onPress={onClose}>
          <Ionicons name="call" size={28} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlBtn, showTextInput && styles.controlBtnActive]}
          onPress={onToggleTextInput}
        >
          {showTextInput ? (
            <Ionicons name="close" size={20} color={colors.primary} />
          ) : (
            <Ionicons name="keypad-outline" size={20} color="rgba(255,255,255,0.8)" />
          )}
        </TouchableOpacity>
      </View>
      
      <Text style={styles.tipText}>
        {showTextInput 
          ? "Type your message or tap × to go back to voice"
          : "Speak naturally — or tap keyboard to type instead"
        }
      </Text>
    </>
  );
}
