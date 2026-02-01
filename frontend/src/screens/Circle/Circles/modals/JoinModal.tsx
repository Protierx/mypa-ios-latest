import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Check } from 'lucide-react-native';
import { styles } from '../styles';

interface JoinModalProps {
  visible: boolean;
  joinCode: string;
  joinError: string;
  joinSuccess: boolean;
  onClose: () => void;
  onCodeChange: (text: string) => void;
  onSubmit: () => void;
}

export function JoinModal({
  visible,
  joinCode,
  joinError,
  joinSuccess,
  onClose,
  onCodeChange,
  onSubmit,
}: JoinModalProps) {
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
        <View style={styles.joinModal}>
          <View style={styles.modalHandle} />

          {joinSuccess ? (
            <View style={styles.joinSuccessContainer}>
              <View style={styles.joinSuccessIcon}>
                <Check color="#059669" size={32} />
              </View>
              <Text style={styles.joinSuccessTitle}>You're in!</Text>
              <Text style={styles.joinSuccessSubtitle}>
                Successfully joined the circle
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.modalTitle}>Join Circle</Text>
              <Text style={styles.modalSubtitle}>
                Enter the invite code to join
              </Text>

              <TextInput
                value={joinCode}
                onChangeText={(text) => onCodeChange(text.toUpperCase())}
                placeholder="e.g. MYPA-7K2P"
                placeholderTextColor="#94a3b8"
                style={styles.joinCodeInput}
                autoCapitalize="characters"
              />

              {joinError ? (
                <Text style={styles.joinError}>{joinError}</Text>
              ) : null}

              <Pressable
                onPress={onSubmit}
                disabled={!joinCode.trim()}
                style={({ pressed }) => [
                  styles.joinSubmitButton,
                  !joinCode.trim() && styles.joinSubmitButtonDisabled,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.joinSubmitText}>Join Circle</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
