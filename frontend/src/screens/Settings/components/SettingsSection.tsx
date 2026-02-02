import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SettingsSection as SectionType } from '../types';
import { styles } from '../styles';

interface SettingsSectionProps {
  section: SectionType;
  toggles: { [key: string]: boolean };
  onToggle: (id: string) => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  section,
  toggles,
  onToggle,
}) => {
  const navigation = useNavigation<any>();

  const handlePress = (item: any) => {
    if (item.navigateTo) {
      navigation.navigate(item.navigateTo);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionCard}>
        {section.items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.settingItem,
              index < section.items.length - 1 && styles.settingItemBorder,
            ]}
            onPress={() => handlePress(item)}
            disabled={item.type === 'toggle'}
          >
            <View
              style={[
                styles.settingIconContainer,
                { backgroundColor: item.iconColor + '15' },
              ]}
            >
              <Ionicons name={item.iconName as any} size={18} color={item.iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              {item.subtitle && (
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            {item.type === 'toggle' && (
              <Switch
                value={toggles[item.id]}
                onValueChange={() => onToggle(item.id)}
                trackColor={{ false: '#E2E8F0', true: '#C4B5FD' }}
                thumbColor={toggles[item.id] ? '#8B5CF6' : '#94A3B8'}
                ios_backgroundColor="#E2E8F0"
              />
            )}
            {item.type === 'navigation' && (
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            )}
            {item.type === 'value' && (
              <View style={styles.valueContainer}>
                <Text style={styles.settingValue}>{item.value}</Text>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
