import React from 'react';
import { View, Modal } from 'react-native';
import { ListeningScreenProps } from './types';
import { useListeningData } from './hooks';
import {
  Header,
  OrbSection,
  TranscriptsList,
  TextInputBar,
  Controls,
} from './components';
import { SettingsModal } from './modals';
import { styles } from './styles';

export function ListeningScreen({ visible, onClose }: ListeningScreenProps) {
  const {
    isListening,
    dots,
    showTextInput,
    textMessage,
    showSettings,
    language,
    speed,
    voice,
    transcripts,
    pulseAnim1,
    pulseAnim2,
    pulseAnim3,
    floatAnim,
    setIsListening,
    setShowTextInput,
    setTextMessage,
    setShowSettings,
    setLanguage,
    setSpeed,
    setVoice,
    handleSendText,
  } = useListeningData({ visible, onClose });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.backgroundGlow} />
        
        <Header
          dots={dots}
          onOpenSettings={() => setShowSettings(true)}
          onClose={onClose}
        />

        <OrbSection
          pulseAnim1={pulseAnim1}
          pulseAnim2={pulseAnim2}
          pulseAnim3={pulseAnim3}
          floatAnim={floatAnim}
        />

        <TranscriptsList transcripts={transcripts} />

        {showTextInput && (
          <TextInputBar
            textMessage={textMessage}
            onTextChange={setTextMessage}
            onSend={handleSendText}
          />
        )}

        <Controls
          isListening={isListening}
          showTextInput={showTextInput}
          onToggleListening={() => setIsListening(!isListening)}
          onToggleTextInput={() => setShowTextInput(!showTextInput)}
          onClose={onClose}
        />

        <SettingsModal
          visible={showSettings}
          language={language}
          speed={speed}
          voice={voice}
          onClose={() => setShowSettings(false)}
          onLanguageChange={setLanguage}
          onSpeedChange={setSpeed}
          onVoiceChange={setVoice}
        />
      </View>
    </Modal>
  );
}

export default ListeningScreen;
