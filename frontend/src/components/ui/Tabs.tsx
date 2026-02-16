import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, ScrollView } from 'react-native';
import { bg, text as textTokens } from '../../styles/colors';
import { radius, spacing } from '../../styles/theme';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TabsListProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({ value: '', onValueChange: () => {} });

export function Tabs({ value, onValueChange, children, style }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <View style={[styles.tabs, style]}>{children}</View>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, style }: TabsListProps) {
  return (
    <View style={[styles.list, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.listInner}>{children}</View>
      </ScrollView>
    </View>
  );
}

export function TabsTrigger({ value, children, style, textStyle, disabled }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
  const isActive = selectedValue === value;

  return (
    <TouchableOpacity
      style={[styles.trigger, isActive && styles.triggerActive, disabled && styles.disabled, style]}
      onPress={() => !disabled && onValueChange(value)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.triggerText, isActive && styles.triggerTextActive, textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

export function TabsContent({ value, children, style }: TabsContentProps) {
  const { value: selectedValue } = React.useContext(TabsContext);

  if (selectedValue !== value) return null;

  return <View style={[styles.content, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  tabs: {
    gap: 8,
  },
  list: {
    backgroundColor: bg.secondary,
    borderRadius: 10,
    padding: 4,
  },
  listInner: {
    flexDirection: 'row',
  },
  trigger: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  triggerActive: {
    backgroundColor: bg.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
    color: textTokens.secondary,
  },
  triggerTextActive: {
    color: textTokens.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
});
