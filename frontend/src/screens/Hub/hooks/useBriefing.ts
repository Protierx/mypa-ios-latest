/**
 * useBriefing Hook
 * Manages briefing state and playback
 */
import { useState, useRef, useCallback } from 'react';
import * as Speech from 'expo-speech';
import { Alert } from 'react-native';
import { getVoiceAssistant } from '../../../services/voiceAssistant';
import {
  Hand,
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  Flame,
  Rocket,
} from 'lucide-react-native';

export interface BriefingItem {
  icon: React.ComponentType<any>;
  text: string;
  delay: number;
}

interface UseBriefingReturn {
  showBriefing: boolean;
  briefingStep: number;
  isSpeaking: boolean;
  aiBriefing: string | null;
  briefingItems: BriefingItem[];
  startBriefing: () => Promise<void>;
  closeBriefing: () => void;
  skipToEnd: () => void;
}

export function useBriefing(
  greeting: string,
  onXpAward: (amount: number) => void
): UseBriefingReturn {
  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingStep, setBriefingStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  
  const briefingTimer = useRef<NodeJS.Timeout | null>(null);
  const voiceAssistant = useRef(getVoiceAssistant()).current;

  // Briefing items
  const briefingItems: BriefingItem[] = [
    { icon: Hand, text: `${greeting}! I'm MYPA, your AI life organizer. Let me brief you.`, delay: 2500 },
    { icon: BarChart3, text: 'You have 3 tasks remaining today, with 2 marked priority. Very achievable!', delay: 3000 },
    { icon: Clock, text: "Your peak focus window is 9-11am. I've scheduled your hardest tasks then.", delay: 2800 },
    { icon: Target, text: 'Next up: "Review Q1 metrics" at 5PM. You usually finish these in 15 mins.', delay: 2800 },
    { icon: TrendingUp, text: "Exciting! You're 67% above last week. Your consistency is remarkable!", delay: 2500 },
    { icon: Flame, text: 'Your 7-day streak gives you 1.5x XP multiplier. Push to 14 days!', delay: 2300 },
    { icon: Rocket, text: "With your pace, you'll hit 85% completion. Ready to make it 100%?", delay: 2500 },
  ];

  const playBriefingSequence = useCallback((step: number) => {
    if (step >= briefingItems.length) {
      setIsSpeaking(false);
      onXpAward(10); // Bonus XP for listening
      return;
    }
    setBriefingStep(step);
    setIsSpeaking(true);

    briefingTimer.current = setTimeout(() => {
      if (step + 1 < briefingItems.length) {
        Speech.speak(briefingItems[step + 1].text, {
          rate: 0.95,
          pitch: 1,
        });
      }
      playBriefingSequence(step + 1);
    }, briefingItems[step].delay);
  }, [briefingItems, onXpAward]);

  const startBriefing = async () => {
    setShowBriefing(true);
    setBriefingStep(0);
    setIsSpeaking(true);

    try {
      // Get AI-generated morning briefing
      const briefing = await voiceAssistant.getMorningBriefing();
      setAiBriefing(briefing);

      // Use OpenAI TTS for human-like voice
      await voiceAssistant.speak(briefing);
      setIsSpeaking(false);

      // Award XP for listening to briefing
      onXpAward(10);
    } catch (error) {
      console.error('AI Briefing error:', error);
      // Fallback to static briefing
      playBriefingSequence(0);

      Speech.speak(briefingItems[0].text, {
        rate: 0.95,
        pitch: 1,
        onDone: () => {},
        onError: () => Alert.alert('Voice Briefing', 'Unable to play the briefing audio right now.'),
      });
    }
  };

  const closeBriefing = () => {
    setShowBriefing(false);
    setBriefingStep(0);
    setIsSpeaking(false);
    if (briefingTimer.current) clearTimeout(briefingTimer.current);
    Speech.stop();
  };

  const skipToEnd = () => {
    if (briefingTimer.current) clearTimeout(briefingTimer.current);
    Speech.stop();
    playBriefingSequence(briefingItems.length - 1);
  };

  return {
    showBriefing,
    briefingStep,
    isSpeaking,
    aiBriefing,
    briefingItems,
    startBriefing,
    closeBriefing,
    skipToEnd,
  };
}
