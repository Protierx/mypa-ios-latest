import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  warning: '#f59e0b',
  white: '#ffffff',
};

interface TodayStats {
  completed: number;
  total: number;
  timeSaved: number;
}

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  todayStats: TodayStats;
  streakDays: number;
  shareNote: string;
  sharePrivacy: 'metrics' | 'full';
  onShareNoteChange: (text: string) => void;
  onSharePrivacyChange: (value: 'metrics' | 'full') => void;
  onConfirmShare: () => void;
  onCreateDailyCard?: () => void;
  postingDailyCard: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  todayStats,
  streakDays,
  shareNote,
  sharePrivacy,
  onShareNoteChange,
  onSharePrivacyChange,
  onConfirmShare,
  onCreateDailyCard,
  postingDailyCard,
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

        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>Share Your Day</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Your Stats Today</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{todayStats.completed}/{todayStats.total}</Text>
                  <Text style={styles.statLabel}>Tasks Done</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.success }]}>+{todayStats.timeSaved}m</Text>
                  <Text style={styles.statLabel}>Time Saved</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.warning }]}>{streakDays}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
              </View>
              {todayStats.total === 0 && (
                <Text style={styles.noTasksText}>Add tasks to your day first!</Text>
              )}
            </View>

            {onCreateDailyCard && (
              <TouchableOpacity onPress={onCreateDailyCard} style={styles.createDailyCardButton}>
                <LinearGradient
                  colors={['#8b5cf6', '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createDailyCardGradient}
                >
                  <Feather name="image" size={18} color={Colors.white} />
                  <Text style={styles.createDailyCardText}>Create Daily Life Card</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or quick share</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.inputLabel}>Add a note (optional)</Text>
            <TextInput
              value={shareNote}
              onChangeText={onShareNoteChange}
              placeholder="How was your day?"
              style={styles.textInput}
              placeholderTextColor={Colors.textMuted}
              multiline
            />

            <Text style={styles.inputLabel}>Privacy Level</Text>
            <View style={styles.privacyOptions}>
              <TouchableOpacity
                style={[styles.privacyOption, sharePrivacy === 'metrics' && styles.privacyOptionActive]}
                onPress={() => onSharePrivacyChange('metrics')}
              >
                <View style={[styles.privacyRadio, sharePrivacy === 'metrics' && styles.privacyRadioActive]}>
                  {sharePrivacy === 'metrics' && <View style={styles.privacyRadioDot} />}
                </View>
                <Text style={styles.privacyOptionText}>Metrics Only</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.privacyOption, sharePrivacy === 'full' && styles.privacyOptionActive]}
                onPress={() => onSharePrivacyChange('full')}
              >
                <View style={[styles.privacyRadio, sharePrivacy === 'full' && styles.privacyRadioActive]}>
                  {sharePrivacy === 'full' && <View style={styles.privacyRadioDot} />}
                </View>
                <Text style={styles.privacyOptionText}>Full Share</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={onConfirmShare}
              style={[styles.submitButton, (postingDailyCard || todayStats.total === 0) && styles.submitButtonDisabled]}
              disabled={postingDailyCard || todayStats.total === 0}
            >
              {postingDailyCard ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Share to Circle</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
  bottomSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  noTasksText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.warning,
    textAlign: 'center',
  },
  createDailyCardButton: {
    marginBottom: 12,
  },
  createDailyCardGradient: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  createDailyCardText: {
    color: Colors.white,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
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
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  privacyOptions: {
    gap: 8,
    marginBottom: 12,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  privacyOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  privacyRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyRadioActive: {
    borderColor: Colors.primary,
  },
  privacyRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  privacyOptionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
