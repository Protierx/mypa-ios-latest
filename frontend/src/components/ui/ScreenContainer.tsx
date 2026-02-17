/**
 * ScreenContainer — standard SafeArea wrapper with screen background.
 *
 * Provides consistent safe-area insets, background color from tokens,
 * and an optional screen skin accent.
 */
import React from 'react';
import { StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bg } from '../../styles/colors';
import type { ScreenSkin } from '../../styles/screenSkins';

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Optional skin for accent styling */
  skin?: ScreenSkin;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenContainer({
  children,
  skin,
  style,
  edges = ['top', 'left', 'right'],
}: ScreenContainerProps) {
  const backgroundColor = skin?.backgroundTint ?? bg.primary;

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={[styles.container, { backgroundColor }, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bg.primary,
  },
});
