import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ViewStyle, TextStyle, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  style?: ViewStyle;
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

interface AccordionContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const AccordionContext = React.createContext<{
  expandedItems: string[];
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
}>({ expandedItems: [], toggleItem: () => {}, type: 'single' });

const AccordionItemContext = React.createContext<{
  value: string;
  isExpanded: boolean;
}>({ value: '', isExpanded: false });

export function Accordion({ children, type = 'single', style }: AccordionProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleItem = (value: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (type === 'single') {
      setExpandedItems(prev => prev.includes(value) ? [] : [value]);
    } else {
      setExpandedItems(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      );
    }
  };

  return (
    <AccordionContext.Provider value={{ expandedItems, toggleItem, type }}>
      <View style={[styles.accordion, style]}>{children}</View>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ value, children, style }: AccordionItemProps) {
  const { expandedItems } = React.useContext(AccordionContext);
  const isExpanded = expandedItems.includes(value);

  return (
    <AccordionItemContext.Provider value={{ value, isExpanded }}>
      <View style={[styles.item, style]}>{children}</View>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({ children, style, textStyle }: AccordionTriggerProps) {
  const { toggleItem } = React.useContext(AccordionContext);
  const { value, isExpanded } = React.useContext(AccordionItemContext);
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <TouchableOpacity
      style={[styles.trigger, style]}
      onPress={() => toggleItem(value)}
      activeOpacity={0.7}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.triggerText, textStyle]}>{children}</Text>
      ) : (
        children
      )}
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Ionicons name="chevron-down" size={18} color="#64748B" />
      </Animated.View>
    </TouchableOpacity>
  );
}

export function AccordionContent({ children, style }: AccordionContentProps) {
  const { isExpanded } = React.useContext(AccordionItemContext);

  if (!isExpanded) return null;

  return <View style={[styles.content, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  accordion: {
    gap: 0,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 16,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  content: {
    paddingBottom: 16,
  },
});
