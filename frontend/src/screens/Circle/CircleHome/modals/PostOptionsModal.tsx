import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors as Colors } from '../../../../styles/colors';

interface Post {
  id: string;
  user?: {
    id: string;
    name?: string;
  };
}

interface PostOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedPost: Post | null;
  currentUserId: string | undefined;
  isCurrentUserAdmin: boolean;
  onEditPost: (post: Post) => void;
  onDeletePost: (post: Post) => void;
  onHidePost: (postId: string) => void;
}

export const PostOptionsModal: React.FC<PostOptionsModalProps> = ({
  visible,
  onClose,
  selectedPost,
  currentUserId,
  isCurrentUserAdmin,
  onEditPost,
  onDeletePost,
  onHidePost,
}) => {
  const isOwnPost = selectedPost?.user?.id === currentUserId;
  const canModify = isOwnPost || isCurrentUserAdmin;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.actionSheetContainer}>
          <View style={styles.actionSheetGroup}>
            {selectedPost && (
              <>
                {/* Show Edit option only for own posts or if admin */}
                {canModify && (
                  <TouchableOpacity
                    onPress={() => onEditPost(selectedPost)}
                    style={styles.actionSheetButton}
                  >
                    <Feather name="edit-2" size={20} color={Colors.primary} />
                    <Text style={styles.actionSheetButtonText}>Edit Post</Text>
                  </TouchableOpacity>
                )}
                
                {/* Show Delete option for own posts or if admin - triggers multi-select mode */}
                {canModify && (
                  <TouchableOpacity
                    onPress={() => onDeletePost(selectedPost)}
                    style={[styles.actionSheetButton, styles.actionSheetButtonDestructive]}
                  >
                    <Feather name="trash-2" size={20} color={Colors.danger} />
                    <Text style={[styles.actionSheetButtonText, { color: Colors.danger }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Report option for other people's posts */}
                {!isOwnPost && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      Alert.alert('Report Submitted', 'Thank you for your report. We will review this post.');
                    }}
                    style={styles.actionSheetButton}
                  >
                    <Feather name="flag" size={20} color={Colors.warning} />
                    <Text style={[styles.actionSheetButtonText, { color: Colors.warning }]}>
                      Report Post
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Hide from feed option - available for all posts */}
                <TouchableOpacity
                  onPress={() => onHidePost(selectedPost.id)}
                  style={styles.actionSheetButton}
                >
                  <Feather name="eye-off" size={20} color={Colors.textSecondary} />
                  <Text style={styles.actionSheetButtonText}>Hide from Feed</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          <TouchableOpacity
            onPress={onClose}
            style={styles.actionSheetCancel}
          >
            <Text style={styles.actionSheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    paddingHorizontal: 12,
    paddingBottom: 34,
  },
  actionSheetGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  actionSheetButtonDestructive: {
    // Keep same layout, just different text color
  },
  actionSheetButtonText: {
    fontSize: 17,
    color: Colors.textPrimary,
    fontWeight: '400',
  },
  actionSheetCancel: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionSheetCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default PostOptionsModal;
