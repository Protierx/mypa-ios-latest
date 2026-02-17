/**
 * ListRow — pressable row with spring feedback.
 *
 * Used for task items, settings rows, circle cards, etc.
 * Token-driven, memoized by default.
 */
import React, { memo, useCallback } from 'react';
import { Text, StyleSheet, ViewStyle, TouchableWithoutFeedback } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { bg, text as textTokens, border as borderTokens } from '../../styles/colors';
import { radius, spacing } from '../../styles/theme';
import { usePressFeedback } from '../../styles/motion';

interface ListRowProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** Leading icon name from Ionicons */
  leadingIcon?: keyof typeof Ionicons.glyphMap;
  leadingIconColor?: string;
  /** Show a trailing chevron */
  showChevron?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}

function ListRowComponent({
  children,
  onPress,
  leadingIcon,
  leadingIconColor = textTokens.tertiary,
  showChevron = false,
  style,
  disabled = false,
}: ListRowProps) {
  const { animatedStyle, pressHandlers } = usePressFeedback(0.98, 0.9);

  const handlePress = useCallback(() => {
    if (!disabled && onPress) onPress();
  }, [disabled, onPress]);

  const content = (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      {leadingIcon && (
        <Ionicons name={leadingIcon} size={20} color={leadingIconColor} style={styles.leadingIcon} />
      )}
      <Animated.View style={styles.content}>{children}</Animated.View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={18} color={textTokens.disabled} />
      )}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableWithoutFeedback
        onPress={handlePress}
        onPressIn={pressHandlers.onPressIn}
        onPressOut={pressHandlers.onPressOut}
        disabled={disabled}
      >
        {content}
      </TouchableWithoutFeedback>
    );
  }

  return content;
}

export const ListRow = memo(ListRowComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: bg.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderTokens.secondary,
    minHeight: 52,
  },
  leadingIcon: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
});
