import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { TimeField, TimePeriod } from '../types';
import { QUICK_TIME_OPTIONS } from '../constants';

interface TimePickerModalProps {
  visible: boolean;
  editingField: TimeField;
  tempHour: number;
  tempMinute: number;
  tempPeriod: TimePeriod;
  onChangeHour: (delta: number) => void;
  onChangeMinute: (delta: number) => void;
  onChangePeriod: () => void;
  onQuickSelect: (hour: number, minute: number, period: TimePeriod) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  editingField,
  tempHour,
  tempMinute,
  tempPeriod,
  onChangeHour,
  onChangeMinute,
  onChangePeriod,
  onQuickSelect,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onCancel}
        />

        <View style={styles.timePickerModal}>
          <View style={styles.timePickerHeader}>
            <TouchableOpacity
              onPress={onCancel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.timePickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.timePickerTitle}>
              {editingField === 'start' ? 'Quiet Hours Start' : 'Quiet Hours End'}
            </Text>
            <TouchableOpacity
              onPress={onConfirm}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.timePickerDone}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Custom Time Picker with Buttons */}
          <View style={styles.customTimePicker}>
            {/* Hour */}
            <View style={styles.timeColumn}>
              <TouchableOpacity
                style={styles.timeArrowButton}
                onPress={() => onChangeHour(1)}
              >
                <Ionicons name="chevron-up" size={28} color="#007AFF" />
              </TouchableOpacity>
              <View style={styles.timeValueBox}>
                <Text style={styles.timeValue}>{tempHour}</Text>
              </View>
              <TouchableOpacity
                style={styles.timeArrowButton}
                onPress={() => onChangeHour(-1)}
              >
                <Ionicons name="chevron-down" size={28} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.timeLabel}>Hour</Text>
            </View>

            <Text style={styles.timeSeparator}>:</Text>

            {/* Minute */}
            <View style={styles.timeColumn}>
              <TouchableOpacity
                style={styles.timeArrowButton}
                onPress={() => onChangeMinute(5)}
              >
                <Ionicons name="chevron-up" size={28} color="#007AFF" />
              </TouchableOpacity>
              <View style={styles.timeValueBox}>
                <Text style={styles.timeValue}>{tempMinute.toString().padStart(2, '0')}</Text>
              </View>
              <TouchableOpacity
                style={styles.timeArrowButton}
                onPress={() => onChangeMinute(-5)}
              >
                <Ionicons name="chevron-down" size={28} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.timeLabel}>Minute</Text>
            </View>

            {/* AM/PM */}
            <View style={styles.timeColumn}>
              <TouchableOpacity
                style={styles.timeArrowButton}
                onPress={onChangePeriod}
              >
                <Ionicons name="chevron-up" size={28} color="#007AFF" />
              </TouchableOpacity>
              <View style={[styles.timeValueBox, styles.periodBox]}>
                <Text style={styles.timeValue}>{tempPeriod}</Text>
              </View>
              <TouchableOpacity
                style={styles.timeArrowButton}
                onPress={onChangePeriod}
              >
                <Ionicons name="chevron-down" size={28} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.timeLabel}>Period</Text>
            </View>
          </View>

          {/* Quick Select Buttons */}
          <View style={styles.quickSelectRow}>
            {QUICK_TIME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={styles.quickSelectButton}
                onPress={() => onQuickSelect(option.hour, option.minute, option.period)}
              >
                <Text style={styles.quickSelectText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};
