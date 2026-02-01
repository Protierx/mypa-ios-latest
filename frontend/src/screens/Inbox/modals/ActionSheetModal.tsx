import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { CheckCircle, Trash2 } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';

import { Assignment } from '../types';
import { actionSheetStyles } from '../styles';

interface ActionSheetModalProps {
  visible: boolean;
  assignment: Assignment | null;
  isRecipient: boolean;
  isSender: boolean;
  onClose: () => void;
  onEditMission: () => void;
  onEditResponse: () => void;
  onAcceptAfterDecline: () => void;
  onDelete: () => void;
}

export const ActionSheetModal: React.FC<ActionSheetModalProps> = ({
  visible,
  assignment,
  isRecipient,
  isSender,
  onClose,
  onEditMission,
  onEditResponse,
  onAcceptAfterDecline,
  onDelete,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={actionSheetStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={actionSheetStyles.container}>
          <BlurView intensity={90} tint="light" style={actionSheetStyles.blur}>
            <View style={actionSheetStyles.content}>
              <View style={actionSheetStyles.handle} />
              <Text style={actionSheetStyles.title}>
                {assignment?.title || 'Mission Options'}
              </Text>
              
              {/* Show different options based on user role */}
              {assignment && isRecipient && (
                <>
                  {assignment.status === 'declined' && (
                    <>
                      <TouchableOpacity
                        style={actionSheetStyles.option}
                        onPress={onEditResponse}
                      >
                        <View style={[actionSheetStyles.optionIcon, { backgroundColor: '#FEF3C7' }]}>
                          <Feather name="edit-2" size={18} color="#F59E0B" />
                        </View>
                        <View style={actionSheetStyles.optionText}>
                          <Text style={actionSheetStyles.optionTitle}>Edit Decline Reason</Text>
                          <Text style={actionSheetStyles.optionSubtitle}>Update why you declined</Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={actionSheetStyles.option}
                        onPress={onAcceptAfterDecline}
                      >
                        <View style={[actionSheetStyles.optionIcon, { backgroundColor: '#DCFCE7' }]}>
                          <CheckCircle size={18} color="#10B981" />
                        </View>
                        <View style={actionSheetStyles.optionText}>
                          <Text style={actionSheetStyles.optionTitle}>Accept Instead</Text>
                          <Text style={actionSheetStyles.optionSubtitle}>Changed your mind? Accept the mission</Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {assignment.status === 'pending' && (
                    <Text style={actionSheetStyles.infoText}>
                      You can accept or decline this mission using the buttons below the card.
                    </Text>
                  )}
                </>
              )}
              
              {assignment && isSender && (
                <>
                  <TouchableOpacity
                    style={actionSheetStyles.option}
                    onPress={onEditMission}
                  >
                    <View style={[actionSheetStyles.optionIcon, { backgroundColor: '#DBEAFE' }]}>
                      <Feather name="edit-2" size={18} color="#2563EB" />
                    </View>
                    <View style={actionSheetStyles.optionText}>
                      <Text style={actionSheetStyles.optionTitle}>Edit Mission</Text>
                      <Text style={actionSheetStyles.optionSubtitle}>Change title, due date, XP, and more</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={actionSheetStyles.option}
                    onPress={onDelete}
                  >
                    <View style={[actionSheetStyles.optionIcon, { backgroundColor: '#FEE2E2' }]}>
                      <Trash2 size={18} color="#EF4444" />
                    </View>
                    <View style={actionSheetStyles.optionText}>
                      <Text style={[actionSheetStyles.optionTitle, { color: '#EF4444' }]}>Delete</Text>
                      <Text style={actionSheetStyles.optionSubtitle}>Select multiple missions to delete</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
              
              {/* Delete option for recipients too (only their copy) */}
              {assignment && isRecipient && (
                <TouchableOpacity
                  style={actionSheetStyles.option}
                  onPress={onDelete}
                >
                  <View style={[actionSheetStyles.optionIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Trash2 size={18} color="#EF4444" />
                  </View>
                  <View style={actionSheetStyles.optionText}>
                    <Text style={[actionSheetStyles.optionTitle, { color: '#EF4444' }]}>Delete</Text>
                    <Text style={actionSheetStyles.optionSubtitle}>Select multiple to delete at once</Text>
                  </View>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={actionSheetStyles.cancelButton}
                onPress={onClose}
              >
                <Text style={actionSheetStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
