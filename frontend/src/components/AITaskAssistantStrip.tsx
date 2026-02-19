/**
 * AI Task Assistant Strip
 *
 * A compact, dismissible AI assistant bar for the Tasks page.
 * Provides contextual task management suggestions without Focus CTAs.
 * Focus belongs to the dedicated Focus surface, not Tasks.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ============================================================================
// Types
// ============================================================================

export interface AITaskSuggestion {
  text: string;
  type: 'overdue' | 'missing_duration' | 'prioritize' | 'cleanup' | 'default';
}

export interface AITaskAssistantStripProps {
  suggestion: AITaskSuggestion;
  onDismiss: () => void;
  isLoading?: boolean;
  error?: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const COLORS = {
  bg: '#FFFFFF',
  bgSubtle: '#F0FAF9',
  border: 'rgba(74, 173, 161, 0.12)',
  purple: '#4AADA1',
  purpleLight: '#E0F4F1',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  textTertiary: '#AEAEB2',
  chipBg: '#F2F2F7',
  chipBgActive: '#D0EDE9',
  error: '#FF3B30',
  errorBg: '#FFF1F0',
};

// ============================================================================
// Component
// ============================================================================

export function AITaskAssistantStrip({
  suggestion,
  onDismiss,
  isLoading = false,
  error = null,
}: AITaskAssistantStripProps) {
  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={[styles.strip, styles.stripError]}>
          <View style={styles.leftSection}>
            <View style={[styles.aiBadge, styles.aiBadgeError]}>
              <Ionicons name="alert-circle" size={12} color={COLORS.error} />
            </View>
            <Text style={[styles.suggestionText, styles.errorText]} numberOfLines={1}>
              {error}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleDismiss}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Dismiss error"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Strip */}
      <View style={styles.strip} accessibilityRole="region" accessibilityLabel="AI Task Assistant">
        {/* Left: AI Badge + Suggestion */}
        <View style={styles.leftSection}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={10} color={COLORS.purple} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
          <Text style={styles.suggestionText} numberOfLines={1}>
            {isLoading ? 'Analyzing tasks...' : suggestion.text}
          </Text>
        </View>

        {/* Right: Dismiss */}
        <TouchableOpacity
          onPress={handleDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.dismissButton}
          accessibilityLabel="Dismiss AI suggestions for today"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgSubtle,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stripError: {
    backgroundColor: COLORS.errorBg,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purpleLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  aiBadgeError: {
    backgroundColor: COLORS.errorBg,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.purple,
    marginLeft: 3,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  errorText: {
    color: COLORS.error,
  },
  dismissButton: {
    padding: 4,
  },
});

export default AITaskAssistantStrip;
