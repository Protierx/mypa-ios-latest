import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Task, PriorityType } from '../types';
import { categoryColors, DUE_OPTIONS } from '../constants';
import { styles } from '../styles';

interface TaskModalProps {
  visible: boolean;
  editingTask: Task | null;
  titleInput: string;
  descInput: string;
  priorityInput: PriorityType;
  categoryInput: string;
  dueInput: string;
  onTitleChange: (text: string) => void;
  onDescChange: (text: string) => void;
  onPriorityChange: (priority: PriorityType) => void;
  onCategoryChange: (category: string) => void;
  onDueChange: (due: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function TaskModal({
  visible,
  editingTask,
  titleInput,
  descInput,
  priorityInput,
  categoryInput,
  dueInput,
  onTitleChange,
  onDescChange,
  onPriorityChange,
  onCategoryChange,
  onDueChange,
  onSave,
  onDelete,
  onClose,
}: TaskModalProps) {
  const priorities: PriorityType[] = ['high', 'medium', 'low'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'Add Task'}</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Task title"
            placeholderTextColor="#94A3B8"
            value={titleInput}
            onChangeText={onTitleChange}
          />
          <TextInput
            style={[styles.modalInput, styles.modalInputMultiline]}
            placeholder="Short description"
            placeholderTextColor="#94A3B8"
            value={descInput}
            onChangeText={onDescChange}
            multiline
          />
          <Text style={styles.modalLabel}>Priority</Text>
          <View style={styles.choiceRow}>
            {priorities.map(level => (
              <TouchableOpacity
                key={level}
                style={[styles.choiceChip, priorityInput === level && styles.choiceChipActive]}
                onPress={() => onPriorityChange(level)}
              >
                <Text style={[styles.choiceText, priorityInput === level && styles.choiceTextActive]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.modalLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.choiceScroll}>
            {Object.keys(categoryColors).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.choiceChip, categoryInput === cat && styles.choiceChipActive]}
                onPress={() => onCategoryChange(cat)}
              >
                <Text style={[styles.choiceText, categoryInput === cat && styles.choiceTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.modalLabel}>Due</Text>
          <View style={styles.choiceRow}>
            {DUE_OPTIONS.map(due => (
              <TouchableOpacity
                key={due}
                style={[styles.choiceChip, dueInput === due && styles.choiceChipActive]}
                onPress={() => onDueChange(due)}
              >
                <Text style={[styles.choiceText, dueInput === due && styles.choiceTextActive]}>{due}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalActions}>
            {editingTask ? (
              <TouchableOpacity style={styles.deleteButtonModal} onPress={onDelete}>
                <Ionicons name="trash" size={16} color="#EF4444" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <TouchableOpacity style={styles.saveButtonModal} onPress={onSave}>
              <Text style={styles.saveButtonText}>{editingTask ? 'Save' : 'Add Task'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
