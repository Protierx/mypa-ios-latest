import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AISuggestion, Priority } from '../types';
import { CATEGORIES, DURATIONS } from '../constants';
import { styles } from '../styles';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  // Form state
  newTitle: string;
  setNewTitle: (value: string) => void;
  newCategory: string;
  setNewCategory: (value: string) => void;
  newDuration: string;
  setNewDuration: (value: string) => void;
  newPriority: Priority;
  setNewPriority: (value: Priority) => void;
  newTime: string;
  setNewTime: (value: string) => void;
  newTaskDate: Date;
  setNewTaskDate: (value: Date) => void;
  newTimeDate: Date;
  setNewTimeDate: (value: Date) => void;
  showNewTimePicker: boolean;
  setShowNewTimePicker: (value: boolean) => void;
  showNewDatePicker: boolean;
  setShowNewDatePicker: (value: boolean) => void;
  // AI
  aiSuggestion: AISuggestion | null;
  isLoadingAI: boolean;
  setAiSuggestion: (value: AISuggestion | null) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  onSubmit,
  newTitle,
  setNewTitle,
  newCategory,
  setNewCategory,
  newDuration,
  setNewDuration,
  newPriority,
  setNewPriority,
  newTime,
  setNewTime,
  newTaskDate,
  setNewTaskDate,
  newTimeDate,
  setNewTimeDate,
  showNewTimePicker,
  setShowNewTimePicker,
  showNewDatePicker,
  setShowNewDatePicker,
  aiSuggestion,
  isLoadingAI,
  setAiSuggestion,
}) => {
  const handleCancel = () => {
    setNewTitle('');
    setNewCategory('Personal');
    setNewDuration('30m');
    setNewPriority('Normal');
    setNewTime('');
    setShowNewTimePicker(false);
    setNewTimeDate(new Date());
    setNewTaskDate(new Date());
    setShowNewDatePicker(false);
    setAiSuggestion(null);
    onClose();
  };

  const isToday = newTaskDate.toDateString() === new Date().toDateString();
  const isTomorrow = newTaskDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add Task</Text>
          
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="What do you need to do?"
            placeholderTextColor="#94A3B8"
            style={styles.modalInput}
          />
          <Text style={styles.modalHelper}>Tip: start with a verb, like "Review" or "Call".</Text>

          {/* AI Suggestion Banner */}
          {isLoadingAI && (
            <View style={styles.aiSuggestionBanner}>
              <View style={styles.aiLoadingRow}>
                <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                <Text style={styles.aiLoadingText}>AI analyzing...</Text>
              </View>
            </View>
          )}
          
          {aiSuggestion && !isLoadingAI && (
            <View style={styles.aiSuggestionBanner}>
              <View style={styles.aiSuggestionHeader}>
                <View style={styles.aiSuggestionTitle}>
                  <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                  <Text style={styles.aiSuggestionLabel}>AI Suggests</Text>
                </View>
                <TouchableOpacity
                  style={styles.aiApplyAllBtn}
                  onPress={() => {
                    setNewCategory(aiSuggestion.category);
                    setNewPriority(aiSuggestion.priority);
                    setNewDuration(aiSuggestion.suggestedDuration);
                  }}
                >
                  <Text style={styles.aiApplyAllText}>Apply All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.aiSuggestionChips}>
                <TouchableOpacity
                  style={[styles.aiChip, newCategory === aiSuggestion.category && styles.aiChipApplied]}
                  onPress={() => setNewCategory(aiSuggestion.category)}
                >
                  <Ionicons name="folder-outline" size={12} color={newCategory === aiSuggestion.category ? '#059669' : '#6366F1'} />
                  <Text style={[styles.aiChipText, newCategory === aiSuggestion.category && styles.aiChipTextApplied]}>
                    {aiSuggestion.category}
                  </Text>
                  {newCategory === aiSuggestion.category && <Ionicons name="checkmark" size={12} color="#059669" />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.aiChip, newPriority === aiSuggestion.priority && styles.aiChipApplied]}
                  onPress={() => setNewPriority(aiSuggestion.priority)}
                >
                  <Ionicons name="flag-outline" size={12} color={newPriority === aiSuggestion.priority ? '#059669' : '#6366F1'} />
                  <Text style={[styles.aiChipText, newPriority === aiSuggestion.priority && styles.aiChipTextApplied]}>
                    {aiSuggestion.priority}
                  </Text>
                  {newPriority === aiSuggestion.priority && <Ionicons name="checkmark" size={12} color="#059669" />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.aiChip, newDuration === aiSuggestion.suggestedDuration && styles.aiChipApplied]}
                  onPress={() => setNewDuration(aiSuggestion.suggestedDuration)}
                >
                  <Ionicons name="time-outline" size={12} color={newDuration === aiSuggestion.suggestedDuration ? '#059669' : '#6366F1'} />
                  <Text style={[styles.aiChipText, newDuration === aiSuggestion.suggestedDuration && styles.aiChipTextApplied]}>
                    {aiSuggestion.suggestedDuration}
                  </Text>
                  {newDuration === aiSuggestion.suggestedDuration && <Ionicons name="checkmark" size={12} color="#059669" />}
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Date Selector */}
          <Text style={styles.modalLabel}>Date</Text>
          <View style={styles.dateQuickRow}>
            <TouchableOpacity
              style={[styles.dateQuickChip, isToday && styles.dateQuickChipActive]}
              onPress={() => setNewTaskDate(new Date())}
            >
              <Ionicons name="today-outline" size={14} color={isToday ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.dateQuickText, isToday && styles.dateQuickTextActive]}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateQuickChip, isTomorrow && styles.dateQuickChipActive]}
              onPress={() => setNewTaskDate(new Date(Date.now() + 86400000))}
            >
              <Ionicons name="arrow-forward-outline" size={14} color={isTomorrow ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.dateQuickText, isTomorrow && styles.dateQuickTextActive]}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateQuickChip, styles.datePickerChip]}
              onPress={() => setShowNewDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={14} color="#7C3AED" />
              <Text style={styles.datePickerChipText}>
                {!isToday && !isTomorrow
                  ? newTaskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Pick Date'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {showNewDatePicker && (
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowNewDatePicker(false)}>
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowNewDatePicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={newTaskDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') setShowNewDatePicker(false);
                  if (date) setNewTaskDate(date);
                }}
              />
            </View>
          )}
          
          <View style={styles.modalRow}>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Time</Text>
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => setShowNewTimePicker(true)}
              >
                <Ionicons name="time-outline" size={16} color={newTime ? '#0F172A' : '#94A3B8'} />
                <Text style={[styles.timePickerText, !newTime && styles.timePickerPlaceholder]}>
                  {newTime || 'Anytime'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Duration</Text>
              <View style={styles.durationRow}>
                {DURATIONS.map(dur => (
                  <TouchableOpacity
                    key={dur}
                    style={[styles.durationChip, newDuration === dur && styles.durationChipActive]}
                    onPress={() => setNewDuration(dur)}
                  >
                    <Text style={[styles.durationText, newDuration === dur && styles.durationTextActive]}>{dur}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          {/* Time Picker */}
          {showNewTimePicker && (
            <View style={styles.fullWidthPickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => {
                  setShowNewTimePicker(false);
                  setNewTime('');
                }}>
                  <Text style={styles.pickerCancelText}>Clear</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setShowNewTimePicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={newTimeDate}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                style={{ width: '100%' }}
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') setShowNewTimePicker(false);
                  if (date) {
                    setNewTimeDate(date);
                    const hours = date.getHours();
                    const minutes = date.getMinutes();
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const hour12 = hours % 12 || 12;
                    const timeStr = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                    setNewTime(timeStr);
                  }
                }}
              />
            </View>
          )}
          
          <Text style={styles.modalLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, newCategory === cat && styles.categoryChipActive]}
                onPress={() => setNewCategory(cat)}
              >
                <Text style={[styles.categoryChipText, newCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={styles.modalLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {(['Low', 'Normal', 'High'] as const).map(priority => (
              <TouchableOpacity
                key={priority}
                style={[styles.priorityChip, newPriority === priority && styles.priorityChipActive]}
                onPress={() => setNewPriority(priority)}
              >
                <Text style={[styles.priorityTextLabel, newPriority === priority && styles.priorityTextActive]}>
                  {priority}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancel} onPress={handleCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSubmit} onPress={onSubmit}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.modalSubmitText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
