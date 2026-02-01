import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

interface Member {
  id: string;
  name: string;
  initial: string;
}

interface AssignModalProps {
  visible: boolean;
  onClose: () => void;
  // Form values
  assignmentTitle: string;
  assignmentNote: string;
  assignmentXp: number;
  assignedMember: Member | null;
  dueDay: 'today' | 'tomorrow' | 'custom';
  customDueDate: Date;
  dueTime: Date;
  repeatEnabled: boolean;
  repeatFrequency: 'daily' | 'weekly' | 'monthly';
  requireProof: boolean;
  showDatePicker: boolean;
  showTimePicker: boolean;
  // Handlers
  onTitleChange: (text: string) => void;
  onNoteChange: (text: string) => void;
  onXpChange: (xp: number) => void;
  onDueDayChange: (day: 'today' | 'tomorrow' | 'custom') => void;
  onCustomDueDateChange: (date: Date) => void;
  onDueTimeChange: (time: Date) => void;
  onRepeatEnabledChange: (enabled: boolean) => void;
  onRepeatFrequencyChange: (freq: 'daily' | 'weekly' | 'monthly') => void;
  onRequireProofChange: (required: boolean) => void;
  onShowDatePicker: (show: boolean) => void;
  onShowTimePicker: (show: boolean) => void;
  onMemberSelected: (member: Member) => void;
  onCreateAssignment: () => void;
  // Loading
  creatingAssignment: boolean;
  // Members for picker
  members: Member[];
}

const XP_OPTIONS = [25, 50, 100, 150, 200];

export const AssignModal: React.FC<AssignModalProps> = ({
  visible,
  onClose,
  assignmentTitle,
  assignmentNote,
  assignmentXp,
  assignedMember,
  dueDay,
  customDueDate,
  dueTime,
  repeatEnabled,
  repeatFrequency,
  requireProof,
  showDatePicker,
  showTimePicker,
  onTitleChange,
  onNoteChange,
  onXpChange,
  onDueDayChange,
  onCustomDueDateChange,
  onDueTimeChange,
  onRepeatEnabledChange,
  onRepeatFrequencyChange,
  onRequireProofChange,
  onShowDatePicker,
  onShowTimePicker,
  onMemberSelected,
  onCreateAssignment,
  creatingAssignment,
  members,
}) => {
  const [showMemberList, setShowMemberList] = useState(false);

  const formatTime = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${m} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>📋 Assign Mission</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            {/* Mission Title */}
            <Text style={styles.inputLabel}>Mission Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What needs to be done?"
              placeholderTextColor={Colors.textMuted}
              value={assignmentTitle}
              onChangeText={onTitleChange}
            />

            {/* Assign To */}
            <Text style={styles.inputLabel}>Assign To *</Text>
            <TouchableOpacity 
              style={styles.memberSelect} 
              onPress={() => setShowMemberList(!showMemberList)}
              activeOpacity={0.7}
            >
              {assignedMember ? (
                <View style={styles.selectedMember}>
                  <LinearGradient
                    colors={['#8b5cf6', '#ec4899']}
                    style={styles.memberAvatar}
                  >
                    <Text style={styles.memberAvatarText}>{assignedMember.initial}</Text>
                  </LinearGradient>
                  <Text style={styles.memberName}>{assignedMember.name}</Text>
                </View>
              ) : (
                <Text style={styles.memberSelectPlaceholder}>Select a member</Text>
              )}
              <Feather 
                name={showMemberList ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={Colors.textMuted} 
              />
            </TouchableOpacity>

            {/* Inline Member List */}
            {showMemberList && (
              <View style={styles.memberListContainer}>
                {members.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberListItem,
                      assignedMember?.id === member.id && styles.memberListItemSelected,
                    ]}
                    onPress={() => {
                      onMemberSelected(member);
                      setShowMemberList(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#8b5cf6', '#ec4899']}
                      style={styles.memberListAvatar}
                    >
                      <Text style={styles.memberListAvatarText}>{member.initial}</Text>
                    </LinearGradient>
                    <Text style={styles.memberListName}>{member.name}</Text>
                    {assignedMember?.id === member.id && (
                      <Feather name="check" size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                {members.length === 0 && (
                  <Text style={styles.noMembersText}>No members available</Text>
                )}
              </View>
            )}

            {/* Due Date */}
            <Text style={styles.inputLabel}>Due Date</Text>
            <View style={styles.dueDayRow}>
              {(['today', 'tomorrow', 'custom'] as const).map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dueDayButton, dueDay === day && styles.dueDayButtonActive]}
                  onPress={() => {
                    onDueDayChange(day);
                    if (day === 'custom') onShowDatePicker(true);
                  }}
                >
                  <Text style={[styles.dueDayText, dueDay === day && styles.dueDayTextActive]}>
                    {day === 'today' ? 'Today' : day === 'tomorrow' ? 'Tomorrow' : formatDate(customDueDate)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Due Time */}
            <Text style={styles.inputLabel}>Due Time</Text>
            <TouchableOpacity style={styles.timeSelect} onPress={() => onShowTimePicker(true)}>
              <Feather name="clock" size={18} color={Colors.primary} />
              <Text style={styles.timeText}>{formatTime(dueTime)}</Text>
            </TouchableOpacity>

            {/* iOS Time Picker - Inline */}
            {showTimePicker && Platform.OS === 'ios' && (
              <View style={styles.iosPickerContainer}>
                <DateTimePicker
                  value={dueTime}
                  mode="time"
                  display="spinner"
                  onChange={(event, time) => {
                    if (time) onDueTimeChange(time);
                  }}
                  textColor={Colors.textPrimary}
                />
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => onShowTimePicker(false)}
                >
                  <Text style={styles.pickerDoneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* iOS Date Picker - Inline */}
            {showDatePicker && Platform.OS === 'ios' && (
              <View style={styles.iosPickerContainer}>
                <DateTimePicker
                  value={customDueDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) onCustomDueDateChange(date);
                  }}
                  minimumDate={new Date()}
                  textColor={Colors.textPrimary}
                />
                <TouchableOpacity
                  style={styles.pickerDoneButton}
                  onPress={() => onShowDatePicker(false)}
                >
                  <Text style={styles.pickerDoneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Note */}
            <Text style={styles.inputLabel}>Note (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Add details or context..."
              placeholderTextColor={Colors.textMuted}
              value={assignmentNote}
              onChangeText={onNoteChange}
              multiline
              numberOfLines={3}
            />

            {/* XP Reward */}
            <Text style={styles.inputLabel}>XP Reward</Text>
            <View style={styles.xpRow}>
              {XP_OPTIONS.map((xp) => (
                <TouchableOpacity
                  key={xp}
                  style={[styles.xpButton, assignmentXp === xp && styles.xpButtonActive]}
                  onPress={() => onXpChange(xp)}
                >
                  <Text style={[styles.xpText, assignmentXp === xp && styles.xpTextActive]}>
                    {xp} XP
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Options */}
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Feather name="repeat" size={18} color={Colors.textSecondary} />
                <Text style={styles.optionLabel}>Repeat</Text>
              </View>
              <Switch
                value={repeatEnabled}
                onValueChange={onRepeatEnabledChange}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={repeatEnabled ? Colors.primary : Colors.white}
              />
            </View>

            {repeatEnabled && (
              <View style={styles.repeatFrequencyRow}>
                {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[styles.freqButton, repeatFrequency === freq && styles.freqButtonActive]}
                    onPress={() => onRepeatFrequencyChange(freq)}
                  >
                    <Text style={[styles.freqText, repeatFrequency === freq && styles.freqTextActive]}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Feather name="camera" size={18} color={Colors.textSecondary} />
                <Text style={styles.optionLabel}>Require Photo Proof</Text>
              </View>
              <Switch
                value={requireProof}
                onValueChange={onRequireProofChange}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={requireProof ? Colors.primary : Colors.white}
              />
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, creatingAssignment && styles.createButtonDisabled]}
            onPress={onCreateAssignment}
            disabled={creatingAssignment}
          >
            {creatingAssignment ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Feather name="send" size={18} color={Colors.white} />
                <Text style={styles.createButtonText}>Send Mission</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Date Picker - Android only */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={customDueDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              onShowDatePicker(false);
              if (date) onCustomDueDateChange(date);
            }}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker - Android only */}
        {showTimePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={dueTime}
            mode="time"
            display="default"
            onChange={(event, time) => {
              onShowTimePicker(false);
              if (time) onDueTimeChange(time);
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  scrollContent: {
    maxHeight: 450,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
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
    textAlignVertical: 'top',
  },
  memberSelect: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberSelectPlaceholder: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  selectedMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  memberName: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  memberListContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  memberListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  memberListItemSelected: {
    backgroundColor: Colors.primaryLight,
  },
  memberListAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberListAvatarText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  memberListName: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  noMembersText: {
    padding: 16,
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 14,
  },
  dueDayRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dueDayButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dueDayButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  dueDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  dueDayTextActive: {
    color: Colors.primary,
  },
  timeSelect: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
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
  xpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  xpButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  xpButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  xpTextActive: {
    color: Colors.primary,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  repeatFrequencyRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  freqButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freqButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  freqText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  freqTextActive: {
    color: Colors.primary,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
