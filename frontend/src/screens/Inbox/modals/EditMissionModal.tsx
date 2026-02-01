import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar, Camera, Clock, Repeat, Zap } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { EditMissionData } from '../types';
import { editModalStyles } from '../styles';

interface EditMissionModalProps {
  visible: boolean;
  data: EditMissionData;
  isProcessing: boolean;
  showDatePicker: boolean;
  showTimePicker: boolean;
  onDataChange: (data: Partial<EditMissionData>) => void;
  onShowDatePicker: () => void;
  onShowTimePicker: () => void;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: Date | null) => void;
  onSave: () => void;
  onClose: () => void;
}

export const EditMissionModal: React.FC<EditMissionModalProps> = ({
  visible,
  data,
  isProcessing,
  showDatePicker,
  showTimePicker,
  onDataChange,
  onShowDatePicker,
  onShowTimePicker,
  onDateChange,
  onTimeChange,
  onSave,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={editModalStyles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={editModalStyles.sheet}>
          <View style={editModalStyles.handle} />
          
          {/* Header */}
          <View style={editModalStyles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={editModalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={editModalStyles.title}>Edit Mission</Text>
            <TouchableOpacity onPress={onSave} disabled={isProcessing}>
              <Text style={[editModalStyles.saveText, isProcessing && { opacity: 0.5 }]}>
                {isProcessing ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={editModalStyles.content} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={editModalStyles.label}>Mission Title</Text>
            <TextInput
              value={data.title}
              onChangeText={(text) => onDataChange({ title: text })}
              style={editModalStyles.input}
              placeholder="Enter mission title"
              placeholderTextColor="#94A3B8"
            />

            {/* Note/Description */}
            <Text style={editModalStyles.label}>Note (Optional)</Text>
            <TextInput
              value={data.description}
              onChangeText={(text) => onDataChange({ description: text })}
              style={[editModalStyles.input, { height: 80 }]}
              placeholder="Add a note for context..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
            />

            {/* Due Date & Time */}
            <Text style={editModalStyles.label}>Due Date & Time</Text>
            <View style={editModalStyles.dateTimeRow}>
              <TouchableOpacity
                style={editModalStyles.dateTimeButton}
                onPress={onShowDatePicker}
              >
                <Calendar size={16} color="#7C3AED" />
                <Text style={editModalStyles.dateTimeText}>
                  {data.dueDate
                    ? data.dueDate.toLocaleDateString()
                    : 'Select Date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={editModalStyles.dateTimeButton}
                onPress={onShowTimePicker}
              >
                <Clock size={16} color="#7C3AED" />
                <Text style={editModalStyles.dateTimeText}>
                  {data.dueTime
                    ? data.dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Select Time'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* XP Reward */}
            <Text style={editModalStyles.label}>XP Reward</Text>
            <View style={editModalStyles.xpRow}>
              {[25, 50, 75, 100].map((xp) => (
                <TouchableOpacity
                  key={xp}
                  style={[
                    editModalStyles.xpOption,
                    data.xpReward === xp && editModalStyles.xpOptionActive,
                  ]}
                  onPress={() => onDataChange({ xpReward: xp })}
                >
                  <Zap size={14} color={data.xpReward === xp ? '#F59E0B' : '#94A3B8'} />
                  <Text
                    style={[
                      editModalStyles.xpOptionText,
                      data.xpReward === xp && editModalStyles.xpOptionTextActive,
                    ]}
                  >
                    {xp} XP
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Toggle Options */}
            <View style={editModalStyles.toggleSection}>
              {/* Repeat */}
              <View style={editModalStyles.toggleRow}>
                <View style={editModalStyles.toggleInfo}>
                  <Repeat size={18} color="#2563EB" />
                  <Text style={editModalStyles.toggleLabel}>Repeat Mission</Text>
                </View>
                <TouchableOpacity
                  style={[
                    editModalStyles.toggle,
                    data.repeatEnabled && editModalStyles.toggleActive,
                  ]}
                  onPress={() => onDataChange({ repeatEnabled: !data.repeatEnabled })}
                >
                  <View style={[
                    editModalStyles.toggleKnob,
                    data.repeatEnabled && editModalStyles.toggleKnobActive,
                  ]} />
                </TouchableOpacity>
              </View>
              
              {data.repeatEnabled && (
                <View style={editModalStyles.frequencyRow}>
                  {['daily', 'weekly', 'monthly'].map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        editModalStyles.frequencyOption,
                        data.repeatFrequency === freq && editModalStyles.frequencyOptionActive,
                      ]}
                      onPress={() => onDataChange({ repeatFrequency: freq })}
                    >
                      <Text style={[
                        editModalStyles.frequencyText,
                        data.repeatFrequency === freq && editModalStyles.frequencyTextActive,
                      ]}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Require Proof */}
              <View style={editModalStyles.toggleRow}>
                <View style={editModalStyles.toggleInfo}>
                  <Camera size={18} color="#7C3AED" />
                  <Text style={editModalStyles.toggleLabel}>Require Proof</Text>
                </View>
                <TouchableOpacity
                  style={[
                    editModalStyles.toggle,
                    data.requireProof && editModalStyles.toggleActive,
                  ]}
                  onPress={() => onDataChange({ requireProof: !data.requireProof })}
                >
                  <View style={[
                    editModalStyles.toggleKnob,
                    data.requireProof && editModalStyles.toggleKnobActive,
                  ]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Note */}
            <View style={editModalStyles.infoNote}>
              <Feather name="info" size={14} color="#64748B" />
              <Text style={editModalStyles.infoNoteText}>
                The recipient will be notified of your changes.
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={data.dueDate || new Date()}
            mode="date"
            display="spinner"
            onChange={(event, date) => {
              onDateChange(date || null);
            }}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={data.dueTime || new Date()}
            mode="time"
            display="spinner"
            onChange={(event, time) => {
              onTimeChange(time || null);
            }}
          />
        )}
      </View>
    </Modal>
  );
};
