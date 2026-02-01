import React from 'react';
import {
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ResetScreenProps } from './types';
import { styles } from './styles';
import {
  Header,
  MessageList,
  QuickPrompts,
  InputBar,
  BreatheView,
} from './components';
import { useResetData } from './hooks';

export const ResetScreen: React.FC<ResetScreenProps> = ({ navigation }) => {
  const {
    messages,
    inputText,
    isTyping,
    isRecording,
    recordSeconds,
    breatheMode,
    breathePhase,
    breatheScale,
    glowOpacity,
    scrollViewRef,
    setInputText,
    sendMessage,
    toggleRecording,
    setBreatheMode,
    exitBreatheMode,
  } = useResetData();

  if (breatheMode) {
    return (
      <BreatheView
        breathePhase={breathePhase}
        breatheScale={breatheScale}
        glowOpacity={glowOpacity}
        onClose={exitBreatheMode}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.ambientBg}>
        <View style={[styles.ambientBlob, styles.blob1]} />
        <View style={[styles.ambientBlob, styles.blob2]} />
        <View style={[styles.ambientBlob, styles.blob3]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <Header
          onBack={() => navigation?.goBack()}
          onBreathe={() => setBreatheMode(true)}
        />

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <MessageList
            messages={messages}
            isTyping={isTyping}
            scrollViewRef={scrollViewRef}
          />

          <QuickPrompts
            visible={messages.length <= 2}
            onSelect={sendMessage}
          />

          <InputBar
            value={inputText}
            isRecording={isRecording}
            recordSeconds={recordSeconds}
            onChangeText={setInputText}
            onSend={() => sendMessage(inputText)}
            onToggleRecording={toggleRecording}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default ResetScreen;
