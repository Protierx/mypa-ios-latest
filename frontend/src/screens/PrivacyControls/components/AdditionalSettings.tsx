import React from 'react';
import { View, Text } from 'react-native';
import { Toggle } from './Toggle';
import { styles } from '../styles';

interface AdditionalSettingsProps {
  hideWallet: boolean;
  setHideWallet: (value: boolean) => void;
  anonymousMode: boolean;
  setAnonymousMode: (value: boolean) => void;
}

export const AdditionalSettings: React.FC<AdditionalSettingsProps> = ({
  hideWallet,
  setHideWallet,
  anonymousMode,
  setAnonymousMode,
}) => (
  <View style={styles.sectionWrapper}>
    <Text style={styles.sectionLabel}>ADDITIONAL SETTINGS</Text>
    <View style={styles.card}>
      <View style={styles.settingRow}>
        <View style={styles.settingContent}>
          <Text style={styles.settingLabel}>Hide wallet balance</Text>
          <Text style={styles.settingDesc}>
            Hide your XP and coin balance from circles
          </Text>
        </View>
        <Toggle
          value={hideWallet}
          onToggle={() => setHideWallet(!hideWallet)}
        />
      </View>
      <View style={styles.divider} />
      <View style={styles.settingRow}>
        <View style={styles.settingContent}>
          <Text style={styles.settingLabel}>Anonymous mode</Text>
          <Text style={styles.settingDesc}>
            Appear as "Anonymous" in leaderboards
          </Text>
        </View>
        <Toggle
          value={anonymousMode}
          onToggle={() => setAnonymousMode(!anonymousMode)}
        />
      </View>
    </View>
  </View>
);
