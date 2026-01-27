import React from 'react';
import { View, Text, ScrollView, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface TableProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TableHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TableBodyProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TableRowProps {
  children: React.ReactNode;
  style?: ViewStyle;
  selected?: boolean;
}

interface TableHeadProps {
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  flex?: number;
}

interface TableCellProps {
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  flex?: number;
}

interface TableCaptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export function Table({ children, style }: TableProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.table, style]}>{children}</View>
    </ScrollView>
  );
}

export function TableHeader({ children, style }: TableHeaderProps) {
  return <View style={[styles.header, style]}>{children}</View>;
}

export function TableBody({ children, style }: TableBodyProps) {
  return <View style={[styles.body, style]}>{children}</View>;
}

export function TableRow({ children, style, selected }: TableRowProps) {
  return (
    <View style={[styles.row, selected && styles.rowSelected, style]}>
      {children}
    </View>
  );
}

export function TableHead({ children, style, textStyle, flex = 1 }: TableHeadProps) {
  return (
    <View style={[styles.head, { flex }, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.headText, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

export function TableCell({ children, style, textStyle, flex = 1 }: TableCellProps) {
  return (
    <View style={[styles.cell, { flex }, style]}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text style={[styles.cellText, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

export function TableCaption({ children, style }: TableCaptionProps) {
  return <Text style={[styles.caption, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  table: {
    minWidth: '100%',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  body: {},
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowSelected: {
    backgroundColor: '#F1F5F9',
  },
  head: {
    padding: 12,
    minWidth: 80,
  },
  headText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  cell: {
    padding: 12,
    minWidth: 80,
  },
  cellText: {
    fontSize: 14,
    color: '#334155',
  },
  caption: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
