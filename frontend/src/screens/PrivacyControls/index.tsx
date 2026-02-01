import React from 'react';
import { View, ScrollView } from 'react-native';
import { PrivacyControlsScreenProps } from './types';
import { PRIVACY_MODES, PRIVACY_OPTIONS } from './constants';
import { styles } from './styles';
import {
  Header,
  InfoCard,
  PrivacyModeSelector,
  CircleSettings,
  AdditionalSettings,
  DataPermissions,
} from './components';
import { PrivacyPickerModal } from './modals';
import { usePrivacyControlsData } from './hooks';

export const PrivacyControlsScreen: React.FC<PrivacyControlsScreenProps> = ({
  navigation,
}) => {
  const {
    defaultPrivacy,
    setDefaultPrivacy,
    circles,
    showPicker,
    setShowPicker,
    selectedCircle,
    hideWallet,
    setHideWallet,
    anonymousMode,
    setAnonymousMode,
    dataPermissions,
    getPrivacyLabel,
    handleSelectCircle,
    handleSelectPrivacy,
  } = usePrivacyControlsData();

  return (
    <View style={styles.container}>
      <Header onBack={() => navigation?.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <InfoCard />

        <PrivacyModeSelector
          privacyModes={PRIVACY_MODES}
          selectedPrivacy={defaultPrivacy}
          onSelect={setDefaultPrivacy}
        />

        <CircleSettings
          circles={circles}
          onSelectCircle={handleSelectCircle}
          getPrivacyLabel={getPrivacyLabel}
        />

        <AdditionalSettings
          hideWallet={hideWallet}
          setHideWallet={setHideWallet}
          anonymousMode={anonymousMode}
          setAnonymousMode={setAnonymousMode}
        />

        <DataPermissions permissions={dataPermissions} />
      </ScrollView>

      <PrivacyPickerModal
        visible={showPicker}
        selectedCircle={selectedCircle}
        privacyOptions={PRIVACY_OPTIONS}
        onSelectPrivacy={handleSelectPrivacy}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
};

export default PrivacyControlsScreen;
