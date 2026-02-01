import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { BrainDumpTask, DateOption } from '../types';
import { Colors } from '../constants';
import { styles } from '../styles';

interface AddToPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedTask: BrainDumpTask | null;
  dateOptions: DateOption[];
  selectedDate: number;
  onSelectDate: (index: number) => void;
}

export const AddToPlanModal: React.FC<AddToPlanModalProps> = ({
  visible,
  onClose,
  onConfirm,
  selectedTask,
  dateOptions,
  selectedDate,
  onSelectDate,
}) => {
  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={true} 
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
          <View style={styles.sheetHandle} />
          
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderIcon}>
              <Feather name="calendar" size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.modalTitle}>Add to Plan</Text>
              <Text style={styles.modalSubtitle}>Select a date for this task</Text>
            </View>
          </View>
          
          {selectedTask && (
            <View style={styles.taskPreview}>
              <Text style={styles.taskPreviewText}>{selectedTask.title}</Text>
            </View>
          )}
          
          <ScrollView style={styles.dateOptionsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.dateOptions}>
              {dateOptions.map((option, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.dateOption, selectedDate === index && styles.dateOptionSelected]} 
                  onPress={() => onSelectDate(index)}
                >
                  <View style={styles.dateOptionContent}>
                    <Text style={[styles.dateOptionLabel, selectedDate === index && styles.dateOptionLabelSelected]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.dateOptionDate, selectedDate === index && styles.dateOptionDateSelected]}>
                      {option.date}
                    </Text>
                    {option.isRecommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedBadgeText}>Recommended</Text>
                      </View>
                    )}
                  </View>
                  {selectedDate === index && (
                    <View style={styles.dateCheckmark}>
                      <Feather name="check" size={16} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Feather name="send" size={16} color={Colors.white} />
              <Text style={styles.confirmButtonText}>Add to Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
