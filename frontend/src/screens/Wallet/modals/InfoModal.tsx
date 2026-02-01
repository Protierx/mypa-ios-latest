import React from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { InfoModalData } from '../types';
import { styles } from '../styles';

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
  data: InfoModalData | null;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  visible,
  onClose,
  data,
}) => {
  return (
    <Modal
      visible={visible && !!data}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <BlurView intensity={80} tint="dark" style={[styles.infoModalContent, { maxHeight: '80%' }]}>
          <Pressable
            onPress={onClose}
            style={{ alignSelf: 'flex-end', marginBottom: 12 }}
          >
            <X color="#475569" size={24} />
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{data?.title}</Text>
            {data?.description && (
              <Text style={[styles.modalSubtitle, { marginTop: 12 }]}>
                {data.description}
              </Text>
            )}

            {data?.details && data.details.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.modalTitle, { fontSize: 14, marginBottom: 12 }]}>Details</Text>
                {data.details.map((detail, index) => (
                  <View key={index} style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 8, marginTop: 6 }} />
                    <Text style={{ fontSize: 13, color: '#475569', flex: 1 }}>{detail}</Text>
                  </View>
                ))}
              </View>
            )}

            {data?.tips && data.tips.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.modalTitle, { fontSize: 14, marginBottom: 12 }]}>Tips</Text>
                {data.tips.map((tip, index) => (
                  <View key={index} style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' }}>
                    <Text style={{ marginRight: 8, fontSize: 16 }}>💡</Text>
                    <Text style={{ fontSize: 13, color: '#475569', flex: 1 }}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={[styles.infoModalButton, { marginTop: 20 }]}
          >
            <Text style={styles.infoModalButtonText}>Got it</Text>
          </Pressable>
        </BlurView>
      </View>
    </Modal>
  );
};

export default InfoModal;
