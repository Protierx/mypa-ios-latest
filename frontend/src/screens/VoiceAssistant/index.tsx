/**
 * MYPA Voice Assistant Screen
 * Continuous listening AI assistant with natural voice
 */
import React from 'react';
import { View, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VoiceAssistantScreenProps } from './types';
import { useVoiceAssistantData } from './hooks';
import { Header, MessagesList, VoiceOrb, InputBar } from './components';
import { SettingsModal } from './modals';
import { styles } from './styles';

export function VoiceAssistantScreen({ visible, onClose }: VoiceAssistantScreenProps) {
  const {
    assistantState,
    messages,
    currentTranscript,
    showTextInput,
    textMessage,
    showSettings,
    selectedVoice,
    continuousMode,
    scrollViewRef,
    pulseAnim,
    glowAnim,
    waveAnim1,
    waveAnim2,
    waveAnim3,
    setShowTextInput,
    setTextMessage,
    setShowSettings,
    setSelectedVoice,
    setContinuousMode,
    toggleListening,
    handleSendText,
  } = useVoiceAssistantData({ visible, onClose });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F172A', '#1E1B4B', '#312E81']}
          style={styles.gradient}
        >
          {/* Header */}
          <Header
            assistantState={assistantState}
            onClose={onClose}
            onOpenSettings={() => setShowSettings(true)}
          />

          {/* Messages */}
          <MessagesList
            messages={messages}
            currentTranscript={currentTranscript}
            scrollViewRef={scrollViewRef}
          />

          {/* Voice Orb */}
          <VoiceOrb
            assistantState={assistantState}
            pulseAnim={pulseAnim}
            glowAnim={glowAnim}
            waveAnim1={waveAnim1}
            waveAnim2={waveAnim2}
            waveAnim3={waveAnim3}
            onPress={toggleListening}
          />

          {/* Text Input */}
          <InputBar
            showTextInput={showTextInput}
            textMessage={textMessage}
            continuousMode={continuousMode}
            onToggleTextInput={() => setShowTextInput(!showTextInput)}
            onTextChange={setTextMessage}
            onSend={handleSendText}
            onToggleContinuous={() => setContinuousMode(!continuousMode)}
          />

          {/* Settings Modal */}
          <SettingsModal
            visible={showSettings}
            selectedVoice={selectedVoice}
            continuousMode={continuousMode}
            onClose={() => setShowSettings(false)}
            onSelectVoice={setSelectedVoice}
            onToggleContinuous={() => setContinuousMode(!continuousMode)}
          />
        </LinearGradient>
      </View>
    </Modal>
  );
}

export default VoiceAssistantScreen;
