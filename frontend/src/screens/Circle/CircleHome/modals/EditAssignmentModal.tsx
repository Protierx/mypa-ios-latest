import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
const Colors = {
  primary: '#7c3aed',
  primaryLight: '#ede9fe',
  background: '#ffffff',
  surface: '#f9fafb',
  border: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  success: '#10b981',
  white: '#ffffff',
};

interface EditAssignmentData {
  title: string;
  description: string;
  dueDate: Date | null;
  dueTime: Date | null;
  xpReward: number;
  repeatEnabled: boolean;
  repeatFrequency: 'daily' | 'weekly' | 'monthly';
  requireProof: boolean;
}

interface EditAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  editAssignmentData: EditAssignmentData;
  setEditAssignmentData: (updater: (prev: EditAssignmentData) => EditAssignmentData) => void;
  editDueDay: 'today' | 'tomorrow' | 'custom';
  setEditDueDay: (day: 'today' | 'tomorrow' | 'custom') => void;
  editCustomDueDate: Date;
  setEditCustomDueDate: (date: Date) => void;
  showEditDatePicker: boolean;
  setShowEditDatePicker: (show: boolean) => void;
  showEditTimePicker: boolean;
  setShowEditTimePicker: (show: boolean) => void;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
  getEditDueSummary: () => string;
  onSave: () => void;
  saving: boolean;
}

export const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({
  visible,
  onClose,
  editAssignmentData,
  setEditAssignmentData,
  editDueDay,
  setEditDueDay,
  editCustomDueDate,
  setEditCustomDueDate,
  showEditDatePicker,
  setShowEditDatePicker,
  showEditTimePicker,
  setShowEditTimePicker,
  formatDate,
  formatTime,
  getEditDueSummary,
  onSave,
  saving,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.header}>
            <Text style={styles.title}>Edit Mission</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.section}>
              <Text style={styles.label}>Mission</Text>
              <TextInput
                placeholder="e.g. Take bins out"
                value={editAssignmentData.title}
                onChangeText={(text) => setEditAssignmentData(prev => ({ ...prev, title: text }))}
                style={styles.input}
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Schedule</Text>
              <View style={styles.segmentedControl}>
                {(['today', 'tomorrow', 'custom'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.segmentOption, editDueDay === option && styles.segmentOptionActive]}
                    onPress={() => {
                      setEditDueDay(option);
                      if (option === 'custom') {
                        setShowEditDatePicker(true);
                      } else {
                        const newDate = new Date();
                        if (option === 'tomorrow') {
                          newDate.setDate(newDate.getDate() + 1);
                        }
                        setEditCustomDueDate(newDate);
                        setEditAssignmentData(prev => ({ ...prev, dueDate: newDate }));
                      }
                    }}
                  >
                    <Text style={[styles.segmentOptionText, editDueDay === option && styles.segmentOptionTextActive]}>
                      {option === 'today' ? 'Today' : option === 'tomorrow' ? 'Tomorrow' : 'Pick date'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {editDueDay === 'custom' && (
                <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowEditDatePicker(true)}>
                  <Feather name="calendar" size={18} color={Colors.primary} />
                  <Text style={styles.datePickerButtonText}>{formatDate(editCustomDueDate)}</Text>
                  <Feather name="chevron-down" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}

              {showEditDatePicker && Platform.OS === 'ios' && (
                <View style={styles.iosPickerContainer}>
                  <DateTimePicker
                    value={editCustomDueDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setEditCustomDueDate(selectedDate);
                        setEditAssignmentData(prev => ({ ...prev, dueDate: selectedDate }));
                      }
                    }}
                    minimumDate={new Date()}
                    textColor={Colors.textPrimary}
                  />
                  <TouchableOpacity style={styles.pickerDoneButton} onPress={() => setShowEditDatePicker(false)}>
                    <Text style={styles.pickerDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}

              {showEditDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={editCustomDueDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEditDatePicker(false);
                    if (selectedDate) {
                      setEditCustomDueDate(selectedDate);
                      setEditAssignmentData(prev => ({ ...prev, dueDate: selectedDate }));
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}

              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Time</Text>
                <TouchableOpacity style={styles.timeInput} onPress={() => setShowEditTimePicker(true)}>
                  <Text style={styles.timeInputText}>
                    {editAssignmentData.dueTime ? formatTime(editAssignmentData.dueTime) : '9:00 AM'}
                  </Text>
                  <Feather name="clock" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {showEditTimePicker && Platform.OS === 'ios' && (
                <View style={styles.iosPickerContainer}>
                  <DateTimePicker
                    value={editAssignmentData.dueTime || new Date()}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      if (selectedTime) {
                        setEditAssignmentData(prev => ({ ...prev, dueTime: selectedTime }));
                      }
                    }}
                    textColor={Colors.textPrimary}
                  />
                  <TouchableOpacity style={styles.pickerDoneButton} onPress={() => setShowEditTimePicker(false)}>
                    <Text style={styles.pickerDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}

              {showEditTimePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={editAssignmentData.dueTime || new Date()}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowEditTimePicker(false);
                    if (selectedTime) {
                      setEditAssignmentData(prev => ({ ...prev, dueTime: selectedTime }));
                    }
                  }}
                />
              )}

              <Text style={styles.dueSummary}>{getEditDueSummary()}</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Repeat</Text>
                <TouchableOpacity
                  onPress={() => setEditAssignmentData(prev => ({ ...prev, repeatEnabled: !prev.repeatEnabled }))}
                  style={[styles.toggleSwitch, editAssignmentData.repeatEnabled ? styles.toggleSwitchOn : styles.toggleSwitchOff]}
                >
                  <View style={[styles.toggleKnob, editAssignmentData.repeatEnabled ? styles.toggleKnobOn : styles.toggleKnobOff]} />
                </TouchableOpacity>
              </View>

              {editAssignmentData.repeatEnabled && (
                <View style={styles.segmentedControl}>
                  {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[styles.segmentOption, editAssignmentData.repeatFrequency === freq && styles.segmentOptionActive]}
                      onPress={() => setEditAssignmentData(prev => ({ ...prev, repeatFrequency: freq }))}
                    >
                      <Text style={[styles.segmentOptionText, editAssignmentData.repeatFrequency === freq && styles.segmentOptionTextActive]}>
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.toggleRowWithSubtitle}>
                <View>
                  <Text style={styles.toggleLabel}>Require proof</Text>
                  <Text style={styles.toggleSubtitle}>Photo required to complete</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEditAssignmentData(prev => ({ ...prev, requireProof: !prev.requireProof }))}
                  style={[styles.toggleSwitch, editAssignmentData.requireProof ? styles.toggleSwitchOn : styles.toggleSwitchOff]}
                >
                  <View style={[styles.toggleKnob, editAssignmentData.requireProof ? styles.toggleKnobOn : styles.toggleKnobOff]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Add a note (optional)</Text>
              <TextInput
                placeholder="Any extra details or motivation..."
                value={editAssignmentData.description}
                onChangeText={(text) => setEditAssignmentData(prev => ({ ...prev, description: text }))}
                style={[styles.input, styles.textArea]}
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.footerRow}>
              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSave}
                style={[styles.saveButton, (saving || !editAssignmentData.title.trim()) && styles.saveButtonDisabled]}
                disabled={saving || !editAssignmentData.title.trim()}
              >
                <Text style={[styles.saveButtonText, (saving || !editAssignmentData.title.trim()) && styles.saveButtonTextDisabled]}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentOptionActive: {
    backgroundColor: Colors.white,
  },
  segmentOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  segmentOptionTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: 12,
  },
  datePickerButtonText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 100,
  },
  timeInputText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  dueSummary: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  iosPickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerDoneButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  pickerDoneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleRowWithSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  toggleSwitch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchOn: {
    backgroundColor: Colors.primary,
  },
  toggleSwitchOff: {
    backgroundColor: Colors.border,
  },
  toggleKnob: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: Colors.white,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  toggleKnobOff: {
    alignSelf: 'flex-start',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.border,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  saveButtonTextDisabled: {
    color: Colors.textMuted,
  },
});
