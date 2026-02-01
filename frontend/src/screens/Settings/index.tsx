import React from 'react';
import { View, ScrollView, SafeAreaView } from 'react-native';
import { SettingsScreenProps } from './types';
import { SETTINGS_SECTIONS } from './constants';
import { styles } from './styles';
import {
  Header,
  ProfileCard,
  SettingsSection,
  DangerZone,
  VersionInfo,
} from './components';
import { useSettingsData } from './hooks';

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { toggles, handleToggle } = useSettingsData();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Header onBack={() => navigation?.goBack()} />
        <ProfileCard />

        {SETTINGS_SECTIONS.map((section) => (
          <SettingsSection
            key={section.title}
            section={section}
            toggles={toggles}
            onToggle={handleToggle}
          />
        ))}

        <DangerZone />
        <VersionInfo />

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default SettingsScreen;
