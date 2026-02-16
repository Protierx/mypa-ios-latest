import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { bg, text as textTokens, border as borderTokens } from '../../styles/colors';
import { radius, spacing, shadows } from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return <View style={[styles.header, style]}>{children}</View>;
}

export function CardTitle({ children, style }: CardTitleProps) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function CardDescription({ children, style }: CardDescriptionProps) {
  return <Text style={[styles.description, style]}>{children}</Text>;
}

export function CardContent({ children, style }: CardContentProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

export function CardFooter({ children, style }: CardFooterProps) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: borderTokens.primary,
    overflow: 'hidden',
    ...shadows.sm,
  },
  header: {
    padding: spacing.base,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: textTokens.primary,
  },
  description: {
    fontSize: 14,
    color: textTokens.secondary,
  },
  content: {
    padding: spacing.base,
    paddingTop: 0,
  },
  footer: {
    padding: spacing.base,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
