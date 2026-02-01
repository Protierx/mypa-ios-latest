import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { colors as Colors } from '../../../../styles/colors';

interface EditPostModalProps {
  visible: boolean;
  onClose: () => void;
  editPostContent: string;
  onEditPostContentChange: (text: string) => void;
  onSave: () => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  visible,
  onClose,
  editPostContent,
  onEditPostContentChange,
  onSave,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.editPostSheet}>
          <View style={styles.editPostSheetHandle} />
          
          {/* Header */}
          <View style={styles.editPostHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.editPostCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editPostTitle}>Edit Post</Text>
            <TouchableOpacity onPress={onSave}>
              <Text style={styles.editPostSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Content Editor */}
          <View style={styles.editPostContent}>
            <TextInput
              value={editPostContent}
              onChangeText={onEditPostContentChange}
              style={styles.editPostTextInput}
              multiline
              placeholder="What's on your mind?"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
          </View>

          {/* Info Note */}
          <View style={styles.editPostInfoContainer}>
            <Feather name="info" size={14} color="#64748B" />
            <Text style={styles.editPostInfoText}>
              Edited posts will show an "Edited" badge
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  editPostSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  editPostSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  editPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  editPostCancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  editPostTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  editPostSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  editPostContent: {
    padding: 16,
    minHeight: 150,
  },
  editPostTextInput: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editPostInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  editPostInfoText: {
    fontSize: 13,
    color: '#64748B',
  },
});

export default EditPostModal;
