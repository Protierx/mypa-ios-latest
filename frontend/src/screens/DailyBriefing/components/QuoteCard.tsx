import React from 'react';
import { View, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Quote } from '../types';

interface QuoteCardProps {
  quote: Quote;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  fadeAnim,
  scaleAnim,
}) => {
  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.08)', 'rgba(99, 102, 241, 0.05)']}
        style={styles.quoteCard}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#8B5CF6" style={styles.quoteIcon} />
        <Text style={styles.quoteText}>"{quote.text}"</Text>
        <Text style={styles.quoteAuthor}>— {quote.author}</Text>
      </LinearGradient>
    </Animated.View>
  );
};
