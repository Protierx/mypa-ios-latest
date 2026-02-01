import React from 'react';
import { View, Text, Pressable, Modal, Share as RNShare } from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { styles } from '../styles';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  totalTime: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  totalTime,
}) => {
  const handleShare = async () => {
    const message = `I've saved ${totalTime} of time using MYPA! 🎉`;
    
    try {
      await RNShare.share({
        message,
        title: 'My Time Saved with MYPA',
      });
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <BlurView intensity={80} tint="dark" style={styles.infoModalContent}>
          <Pressable
            onPress={onClose}
            style={{ alignSelf: 'flex-end', marginBottom: 16 }}
          >
            <X color="#475569" size={24} />
          </Pressable>
          <Text style={styles.modalTitle}>Share Progress</Text>
          <Text style={styles.modalSubtitle}>Show off your time savings!</Text>
          
          <View style={{ marginVertical: 20, paddingHorizontal: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 8 }}>
              I've saved {totalTime}
            </Text>
            <Text style={{ fontSize: 14, color: '#64748b' }}>
              of time using MYPA! 🎉
            </Text>
          </View>

          <Pressable
            onPress={handleShare}
            style={styles.infoModalButton}
          >
            <Text style={styles.infoModalButtonText}>Share</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            style={[styles.infoModalButton, { backgroundColor: '#f1f5f9', marginTop: 8 }]}
          >
            <Text style={[styles.infoModalButtonText, { color: '#475569' }]}>Cancel</Text>
          </Pressable>
        </BlurView>
      </View>
    </Modal>
  );
};

export default ShareModal;
