import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Message } from '../types';
import { styles } from '../styles';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  scrollViewRef: React.RefObject<ScrollView>;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  scrollViewRef,
}) => {
  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.messagesScroll}
      contentContainerStyle={styles.messagesContent}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((message) => (
        <View
          key={message.id}
          style={[
            styles.messageRow,
            message.type === 'user' && styles.messageRowUser,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              message.type === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        </View>
      ))}

      {isTyping && (
        <View style={styles.messageRow}>
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <View style={styles.typingDots}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};
