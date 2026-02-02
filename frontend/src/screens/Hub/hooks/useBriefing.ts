/**
 * useBriefing Hook
 * Manages briefing state and playback - Uses REAL user data!
 */
import { useState, useRef, useCallback, useMemo } from 'react';
import * as Speech from 'expo-speech';
import { Alert } from 'react-native';
import { getVoiceAssistant } from '../../../services/voiceAssistant';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Hand,
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  Flame,
  Rocket,
  Sparkles,
  Calendar,
  CheckCircle,
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

interface BriefingData {
  tasksCount: number;
  priorityCount: number;
  completedCount: number;
  streak: number;
  level: number;
  xp: number;
  focusMinutes: number;
  tasksCompleted: number;
  userName: string;
}

export function useBriefing(
  greeting: string,
  onXpAward: (amount: number) => void,
  briefingData?: Partial<BriefingData>
): UseBriefingReturn {
  const { user } = useAuth();
  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingStep, setBriefingStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  
  const briefingTimer = useRef<NodeJS.Timeout | null>(null);
  const voiceAssistant = useRef(getVoiceAssistant()).current;

  // Build dynamic briefing based on real user data
  const briefingItems: BriefingItem[] = useMemo(() => {
    const data = {
      tasksCount: briefingData?.tasksCount ?? 0,
      priorityCount: briefingData?.priorityCount ?? 0,
      completedCount: briefingData?.completedCount ?? 0,
      streak: user?.currentStreak ?? 0,
      level: user?.level ?? 1,
      xp: user?.xp ?? 0,
      focusMinutes: user?.focusMinutes ?? 0,
      tasksCompleted: user?.tasksCompleted ?? 0,
      userName: user?.name?.split(' ')[0] || 'there',
    };

    const items: BriefingItem[] = [];

    // 1. Welcome - always show
    items.push({
      icon: Hand,
      text: `${greeting}! I'm MYPA, your AI life organizer. Here's your quick brief.`,
      delay: 2500,
    });

    // 2. Tasks overview - adapt to actual data
    if (data.tasksCount > 0) {
      const priorityText = data.priorityCount > 0 
        ? `, with ${data.priorityCount} marked high priority` 
        : '';
      items.push({
        icon: BarChart3,
        text: `You have ${data.tasksCount} task${data.tasksCount !== 1 ? 's' : ''} today${priorityText}. Let's crush it!`,
        delay: 2800,
      });
    } else {
      items.push({
        icon: Calendar,
        text: "Your day is open! This is the perfect time to plan. What do you want to accomplish?",
        delay: 2800,
      });
    }

    // 3. Focus insight
    if (data.focusMinutes > 0) {
      const hours = Math.floor(data.focusMinutes / 60);
      const mins = data.focusMinutes % 60;
      const timeStr = hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ` ${mins} minutes` : ''}` : `${mins} minutes`;
      items.push({
        icon: Clock,
        text: `You've focused for ${timeStr} total. Every minute counts!`,
        delay: 2500,
      });
    } else {
      items.push({
        icon: Clock,
        text: "Ready to start your first focus session? Even 25 minutes can be transformative.",
        delay: 2500,
      });
    }

    // 4. Progress insight
    if (data.tasksCompleted > 0) {
      items.push({
        icon: CheckCircle,
        text: `Amazing! You've completed ${data.tasksCompleted} task${data.tasksCompleted !== 1 ? 's' : ''} so far. Keep that momentum!`,
        delay: 2500,
      });
    } else {
      items.push({
        icon: Target,
        text: "Complete your first task to start building momentum. Small wins lead to big results!",
        delay: 2500,
      });
    }

    // 5. Streak - only show if they have one
    if (data.streak > 0) {
      const multiplier = data.streak >= 14 ? '2x' : data.streak >= 7 ? '1.5x' : '1.2x';
      const nextMilestone = data.streak < 7 ? 7 : data.streak < 14 ? 14 : data.streak < 30 ? 30 : 100;
      items.push({
        icon: Flame,
        text: `${data.streak}-day streak! You're earning ${multiplier} XP. Push to ${nextMilestone} days for the next bonus!`,
        delay: 2500,
      });
    }

    // 6. Level progress
    if (data.level > 1 || data.xp > 0) {
      const xpToNext = (data.level * 100) - (data.xp % (data.level * 100));
      items.push({
        icon: TrendingUp,
        text: `Level ${data.level} with ${data.xp} XP! ${xpToNext} more XP to level up.`,
        delay: 2300,
      });
    }

    // 7. Motivation CTA - always end with this
    items.push({
      icon: Rocket,
      text: "You've got this! One task at a time. Ready to make today count?",
      delay: 2500,
    });

    return items;
  }, [greeting, user, briefingData]);

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
      // Fallback to static briefing with real data
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
