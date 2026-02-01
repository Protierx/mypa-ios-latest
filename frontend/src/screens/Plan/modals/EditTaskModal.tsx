import React from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, Priority } from '../types';
import { styles } from '../styles';

interface EditTaskModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: () => void;
  onDelete: (id: number) => void;
  // Form state
  editTitle: string;
  setEditTitle: (value: string) => void;
  editCategory: string;
  setEditCategory: (value: string) => void;
  editDuration: string;
  setEditDuration: (value: string) => void;
  editPriority: Priority;
  setEditPriority: (value: Priority) => void;
  editTime: string;
  setEditTime: (value: string) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  visible,
  task,
  onClose,
  onSave,
  onDelete,
  editTitle,
  setEditTitle,
  editCategory,
  setEditCategory,
  editDuration,
  setEditDuration,
  editPriority,
  setEditPriority,
  editTime,
  setEditTime,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Edit Task</Text>
          
          <TextInput
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="Task title (e.g., Review Q1 metrics)"
            placeholderTextColor="#94A3B8"
            style={styles.modalInput}
          />
          <Text style={styles.modalHelper}>Keep it short and action-oriented.</Text>
          
          <Text style={styles.modalLabel}>Time</Text>
          <TextInput
            value={editTime}
            onChangeText={setEditTime}
            placeholder="e.g., 2:30 PM"
            placeholderTextColor="#94A3B8"
            style={styles.modalInput}
          />
          
          <Text style={styles.modalLabel}>Duration</Text>
          <TextInput
            value={editDuration}
            onChangeText={setEditDuration}
            placeholder="e.g., 30m or 1h"
            placeholderTextColor="#94A3B8"
            style={styles.modalInput}
          />
          
          <Text style={styles.modalLabel}>Category</Text>
          <TextInput
            value={editCategory}
            onChangeText={setEditCategory}
            placeholder="e.g., Work, Health, Personal"
            placeholderTextColor="#94A3B8"
            style={styles.modalInput}
          />
          
          <Text style={styles.modalLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {(['Low', 'Normal', 'High'] as const).map(priority => (
              <TouchableOpacity
                key={priority}
                style={[styles.priorityChip, editPriority === priority && styles.priorityChipActive]}
                onPress={() => setEditPriority(priority)}
              >
                <Text style={[styles.priorityTextLabel, editPriority === priority && styles.priorityTextActive]}>
                  {priority}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.modalActions}>
            {task && (
              <TouchableOpacity
                style={styles.modalDelete}
                onPress={() => {
                  onDelete(task.id);
                  onClose();
                }}
              >
                <Ionicons name="trash" size={16} color="#EF4444" />
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.modalSubmit} onPress={onSave}>
              <Text style={styles.modalSubmitText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
