import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../../../styles/colors';

const CATEGORIES = ['Productivity', 'Fitness', 'Wellness', 'Learning', 'Social'] as const;
const DURATION_DAYS = ['3', '7', '14', '30'] as const;
const XP_REWARDS = [50, 100, 150, 200] as const;

type ChallengeType = 'TASKS_COMPLETED' | 'FOCUS_MINUTES' | 'STREAK_DAYS';
type ChallengeCategory = typeof CATEGORIES[number];

interface CreateChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  // Form values
  challengeTitle: string;
  challengePrompt: string;
  challengeType: ChallengeType;
  challengeCategory: ChallengeCategory;
  challengeDescription: string;
  challengeTarget: string;
  challengeDays: string;
  challengeXP: number;
  // Handlers
  onTitleChange: (text: string) => void;
  onPromptChange: (text: string) => void;
  onTypeChange: (type: ChallengeType) => void;
  onCategoryChange: (category: ChallengeCategory) => void;
  onDescriptionChange: (text: string) => void;
  onTargetChange: (text: string) => void;
  onDaysChange: (days: string) => void;
  onXPChange: (xp: number) => void;
  onAiSuggest: () => void;
  onCreateChallenge: () => void;
  // Loading states
  aiSuggestingChallenge: boolean;
  creatingChallenge: boolean;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  visible,
  onClose,
  challengeTitle,
  challengePrompt,
  challengeType,
  challengeCategory,
  challengeDescription,
  challengeTarget,
  challengeDays,
  challengeXP,
  onTitleChange,
  onPromptChange,
  onTypeChange,
  onCategoryChange,
  onDescriptionChange,
  onTargetChange,
  onDaysChange,
  onXPChange,
  onAiSuggest,
  onCreateChallenge,
  aiSuggestingChallenge,
  creatingChallenge,
}) => {
  const getTargetLabel = () => {
    switch (challengeType) {
      case 'TASKS_COMPLETED': return 'Tasks';
      case 'FOCUS_MINUTES': return 'Minutes';
      case 'STREAK_DAYS': return 'Days';
      default: return 'Target';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
        />
        <View style={styles.bottomSheet} pointerEvents="auto">
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>🏆 Create Challenge</Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Challenge Title */}
            <Text style={styles.inputLabel}>Challenge Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Complete 10 tasks"
              value={challengeTitle}
              onChangeText={onTitleChange}
              maxLength={50}
            />

            {/* AI Assist */}
            <Text style={[styles.inputLabel, { marginTop: 8 }]}>AI Assist (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Describe the challenge you want..."
              value={challengePrompt}
              onChangeText={onPromptChange}
              maxLength={120}
            />
            <TouchableOpacity
              onPress={onAiSuggest}
              disabled={aiSuggestingChallenge}
              style={styles.aiButton}
            >
              {aiSuggestingChallenge ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.aiButtonText}>✨ Generate with AI</Text>
              )}
            </TouchableOpacity>

            {/* Challenge Type */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Challenge Type</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.typeChip, challengeType === 'TASKS_COMPLETED' && styles.typeChipActive]}
                onPress={() => onTypeChange('TASKS_COMPLETED')}
              >
                <Text style={[styles.typeChipText, challengeType === 'TASKS_COMPLETED' && styles.typeChipTextActive]}>
                  ✅ Tasks
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeChip, challengeType === 'FOCUS_MINUTES' && styles.typeChipActive]}
                onPress={() => onTypeChange('FOCUS_MINUTES')}
              >
                <Text style={[styles.typeChipText, challengeType === 'FOCUS_MINUTES' && styles.typeChipTextActive]}>
                  🧠 Focus
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeChip, challengeType === 'STREAK_DAYS' && styles.typeChipActive]}
                onPress={() => onTypeChange('STREAK_DAYS')}
              >
                <Text style={[styles.typeChipText, challengeType === 'STREAK_DAYS' && styles.typeChipTextActive]}>
                  🔥 Streak
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Category</Text>
            <View style={styles.chipRowWrap}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.typeChip, challengeCategory === cat && styles.typeChipActive]}
                  onPress={() => onCategoryChange(cat)}
                >
                  <Text style={[styles.typeChipText, challengeCategory === cat && styles.typeChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Description (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Short details for the challenge"
              value={challengeDescription}
              onChangeText={onDescriptionChange}
              maxLength={140}
              multiline
            />

            {/* Target */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>
              Target {getTargetLabel()}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="10"
              value={challengeTarget}
              onChangeText={onTargetChange}
              keyboardType="number-pad"
              maxLength={4}
            />

            {/* Duration */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Duration (Days)</Text>
            <View style={styles.chipRow}>
              {DURATION_DAYS.map(days => (
                <TouchableOpacity
                  key={days}
                  style={[styles.typeChip, challengeDays === days && styles.typeChipActive]}
                  onPress={() => onDaysChange(days)}
                >
                  <Text style={[styles.typeChipText, challengeDays === days && styles.typeChipTextActive]}>
                    {days}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* XP Reward */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>XP Reward</Text>
            <View style={styles.chipRow}>
              {XP_REWARDS.map(xp => (
                <TouchableOpacity
                  key={xp}
                  style={[styles.typeChip, challengeXP === xp && styles.typeChipActive]}
                  onPress={() => onXPChange(xp)}
                >
                  <Text style={[styles.typeChipText, challengeXP === xp && styles.typeChipTextActive]}>
                    {xp} XP
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalButton, styles.cancelButton]}
              disabled={creatingChallenge}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCreateChallenge}
              style={[styles.modalButton, styles.submitButton]}
              disabled={creatingChallenge || !challengeTitle.trim()}
            >
              {creatingChallenge ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Create Challenge</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  aiButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: -6,
    marginBottom: 8,
  },
  aiButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  typeChipTextActive: {
    color: Colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  submitButton: {
    flex: 2,
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default CreateChallengeModal;
