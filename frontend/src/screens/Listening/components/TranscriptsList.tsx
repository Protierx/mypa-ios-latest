import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';
import { Transcript } from '../types';
import { styles } from '../styles';

interface TranscriptsListProps {
  transcripts: Transcript[];
}

export function TranscriptsList({ transcripts }: TranscriptsListProps) {
  return (
    <ScrollView style={styles.transcriptsContainer} showsVerticalScrollIndicator={false}>
      {transcripts.map((t, i) => (
        <View 
          key={t.id}
          style={[
            styles.transcript,
            t.isUser ? styles.transcriptUser : styles.transcriptAI,
            { opacity: 0.85 - (transcripts.length - 1 - i) * 0.15 }
          ]}
        >
          <Text style={styles.transcriptText}>{t.text}</Text>
          <Text style={styles.transcriptTime}>{t.time}</Text>
        </View>
      ))}
      
      <View style={styles.thinkingIndicator}>
        <MaterialCommunityIcons name="shimmer" size={12} color={colors.primary} />
        <Text style={styles.thinkingText}>MYPA is thinking...</Text>
      </View>
    </ScrollView>
  );
}
