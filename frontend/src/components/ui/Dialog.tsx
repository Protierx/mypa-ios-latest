import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bg, text as textTokens } from '../../styles/colors';
import { radius, spacing, shadows } from '../../styles/theme';

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface DialogFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface DialogTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

const DialogContext = React.createContext<{ onClose: () => void }>({ onClose: () => {} });

export function Dialog({ visible, onClose, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ onClose }}>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardView}
            >
              <TouchableWithoutFeedback>
                <View style={styles.container}>
                  {children}
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={20} color={textTokens.tertiary} />
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </DialogContext.Provider>
  );
}

export function DialogContent({ children, style }: DialogContentProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

export function DialogHeader({ children, style }: DialogHeaderProps) {
  return <View style={[styles.header, style]}>{children}</View>;
}

export function DialogFooter({ children, style }: DialogFooterProps) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

export function DialogTitle({ children, style }: DialogTitleProps) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function DialogDescription({ children, style }: DialogDescriptionProps) {
  return <Text style={[styles.description, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
  },
  container: {
    backgroundColor: bg.elevated,
    borderRadius: radius.lg,
    width: '90%',
    maxWidth: 400,
    padding: spacing.xl,
    ...shadows.lg,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.base,
    padding: 4,
  },
  content: {
    gap: spacing.base,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: textTokens.primary,
  },
  description: {
    fontSize: 14,
    color: textTokens.secondary,
    lineHeight: 20,
  },
});
