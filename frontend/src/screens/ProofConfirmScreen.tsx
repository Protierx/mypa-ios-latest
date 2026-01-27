import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../styles';

interface ProofConfirmScreenProps {
  navigation?: any;
}

export function ProofConfirmScreen({ navigation }: ProofConfirmScreenProps) {
  const handleConfirm = () => {
    navigation?.navigate('Hub');
  };

  const handleRetake = () => {
    navigation?.goBack();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Confirm Proof</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image" size={64} color="rgba(255,255,255,0.3)" />
            <Text style={styles.placeholderText}>Captured photo preview</Text>
          </View>
        </View>

        <View style={styles.taskInfo}>
          <View style={styles.taskCard}>
            <View style={styles.taskIcon}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            </View>
            <View style={styles.taskDetails}>
              <Text style={styles.taskTitle}>Gym Session</Text>
              <Text style={styles.taskCategory}>Health - 1h</Text>
            </View>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+50 XP</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <Ionicons name="refresh" size={20} color={colors.white} />
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Ionicons name="checkmark" size={20} color={colors.white} />
            <Text style={styles.confirmText}>Confirm & Submit</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  imageContainer: {
    flex: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  taskInfo: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.lg,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  taskIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  taskCategory: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  xpBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  xpText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  retakeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});

export default ProofConfirmScreen;
