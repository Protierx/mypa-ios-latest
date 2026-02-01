import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { Message } from '../types';
import { styles } from '../styles';

interface MessagesListProps {
  messages: Message[];
  currentTranscript: string;
  scrollViewRef: React.RefObject<ScrollView>;
}

export function MessagesList({ messages, currentTranscript, scrollViewRef }: MessagesListProps) {
  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.messagesContainer}
      contentContainerStyle={styles.messagesContent}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((message) => (
        <View
          key={message.id}
          style={[
            styles.messageBubble,
            message.isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          {!message.isUser && (
            <View style={styles.assistantAvatar}>
              <Image
                source={require('../../../../assets/mypa-orb.png')}
                style={styles.avatarImage}
              />
            </View>
          )}
          <View style={[
            styles.messageContent,
            message.isUser ? styles.userContent : styles.assistantContent,
          ]}>
            <Text style={[
              styles.messageText,
              message.isUser ? styles.userText : styles.assistantText,
            ]}>
              {message.text}
            </Text>
          </View>
        </View>
      ))}
      
      {/* Current transcript (while speaking) */}
      {currentTranscript ? (
        <View style={[styles.messageBubble, styles.userBubble]}>
          <View style={[styles.messageContent, styles.userContent, styles.transcriptContent]}>
            <Text style={[styles.messageText, styles.userText, styles.transcriptText]}>
              {currentTranscript}...
            </Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
