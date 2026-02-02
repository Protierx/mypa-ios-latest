/**
 * Compact AI Briefing Banner
 * Elegant minimal banner with subtle visual depth
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';

interface BriefingBannerProps {
  onPress: () => void;
}

export function BriefingBanner({ onPress }: BriefingBannerProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="MYPA AI Daily Briefing"
      accessibilityHint="Tap to hear your personalized daily briefing"
    >
      <LinearGradient
        colors={['#ec4899', '#a855f7', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Sparkles color="#ffd700" size={20} strokeWidth={2.5} />
            </View>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              <Text style={styles.boldText}>Your briefing</Text> is ready ✨
            </Text>
            <Text style={styles.subtext}>Tap to unlock today's mission</Text>
          </View>
          <View style={styles.chevron}>
            <Text style={styles.chevronText}>›</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  gradient: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    lineHeight: 22,
  },
  subtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 4,
    fontStyle: 'italic',
  },
  boldText: {
    fontWeight: '800',
  },
  chevron: {
    marginLeft: 8,
  },
  chevronText: {
    fontSize: 28,
    color: '#ffd700',
    fontWeight: '300',
  },
});
