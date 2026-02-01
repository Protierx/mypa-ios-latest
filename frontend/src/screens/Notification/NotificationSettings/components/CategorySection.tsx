import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { NotificationCategory, NotificationSettings } from '../types';
import { SettingRow } from './SettingRow';

interface CategorySectionProps {
  categoryKey: string;
  category: NotificationCategory;
  settings: NotificationSettings;
  isExpanded: boolean;
  onToggleExpand: (key: string | null) => void;
  onUpdateSetting: (key: keyof NotificationSettings, value: boolean) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  categoryKey,
  category,
  settings,
  isExpanded,
  onToggleExpand,
  onUpdateSetting,
}) => {
  const enabledCount = category.items.filter(
    item => settings[item.key as keyof NotificationSettings]
  ).length;

  return (
    <View style={styles.categoryContainer}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => onToggleExpand(isExpanded ? null : categoryKey)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
          <Ionicons name={category.icon as any} size={18} color={category.color} />
        </View>
        <Text style={styles.categoryTitle}>{category.title}</Text>
        <View style={styles.categoryRight}>
          <Text style={styles.categoryCount}>
            {enabledCount}/{category.items.length}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#8E8E93"
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.categoryItems}>
          {category.items.map((item, index) => (
            <SettingRow
              key={item.key}
              icon={item.icon}
              iconColor={item.color}
              title={item.title}
              subtitle={item.subtitle}
              value={settings[item.key as keyof NotificationSettings] as boolean}
              onValueChange={(value) => onUpdateSetting(item.key as keyof NotificationSettings, value)}
              disabled={!settings.pushEnabled}
              isLast={index === category.items.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
};
