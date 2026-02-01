import { useState } from 'react';

/**
 * Manages challenge creation form state
 * Handles all form fields for creating challenges
 */
export function useChallengeForm() {
  // Basic fields
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [challengeEmoji, setChallengeEmoji] = useState('🏆');
  const [challengeCategory, setChallengeCategory] = useState('Personal Growth');
  
  // Challenge configuration
  const [challengeType, setChallengeType] = useState<'FOCUS_MINUTES' | 'TASKS_COMPLETED' | 'STREAK_DAYS'>('TASKS_COMPLETED');
  const [challengeTarget, setChallengeTarget] = useState('10');
  const [challengeDays, setChallengeDays] = useState('7');
  const [challengeXP, setChallengeXP] = useState(100);
  
  // AI suggestion
  const [challengePrompt, setChallengePrompt] = useState('');
  const [aiSuggestingChallenge, setAiSuggestingChallenge] = useState(false);
  
  // Loading state
  const [creatingChallenge, setCreatingChallenge] = useState(false);

  // Reset form to defaults
  const resetForm = () => {
    setChallengeTitle('');
    setChallengeDescription('');
    setChallengeEmoji('🏆');
    setChallengeCategory('Personal Growth');
    setChallengeType('TASKS_COMPLETED');
    setChallengeTarget('10');
    setChallengeDays('7');
    setChallengeXP(100);
    setChallengePrompt('');
    setAiSuggestingChallenge(false);
  };

  // Validate form
  const validateForm = (): { valid: boolean; error?: string } => {
    if (!challengeTitle.trim()) {
      return { valid: false, error: 'Please enter a challenge title' };
    }

    const target = parseInt(challengeTarget);
    if (isNaN(target) || target < 1) {
      return { valid: false, error: 'Please enter a valid target number' };
    }

    const days = parseInt(challengeDays);
    if (isNaN(days) || days < 1) {
      return { valid: false, error: 'Please enter a valid number of days' };
    }

    return { valid: true };
  };

  // Get form data for submission
  const getFormData = (circleId: string) => {
    const now = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + parseInt(challengeDays));

    const description = `Category: ${challengeCategory}${
      challengeDescription.trim() ? ` | ${challengeDescription.trim()}` : ''
    }`;

    return {
      title: challengeTitle.trim(),
      description,
      type: challengeType,
      targetValue: parseInt(challengeTarget),
      xpReward: challengeXP,
      startsAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      circleId,
      emoji: challengeEmoji,
    };
  };

  // Apply AI suggestions
  const applySuggestion = (suggestion: {
    title?: string;
    type?: 'FOCUS_MINUTES' | 'TASKS_COMPLETED' | 'STREAK_DAYS';
    targetValue?: number;
    days?: number;
    xpReward?: number;
    category?: string;
    description?: string;
  }) => {
    if (suggestion.title) setChallengeTitle(suggestion.title);
    if (suggestion.type) setChallengeType(suggestion.type);
    if (suggestion.targetValue) setChallengeTarget(String(suggestion.targetValue));
    if (suggestion.days) setChallengeDays(String(suggestion.days));
    if (suggestion.xpReward) setChallengeXP(suggestion.xpReward);
    if (suggestion.category) setChallengeCategory(suggestion.category);
    if (suggestion.description) setChallengeDescription(suggestion.description);
  };

  return {
    // Basic fields
    challengeTitle,
    setChallengeTitle,
    challengeDescription,
    setChallengeDescription,
    challengeEmoji,
    setChallengeEmoji,
    challengeCategory,
    setChallengeCategory,
    
    // Configuration
    challengeType,
    setChallengeType,
    challengeTarget,
    setChallengeTarget,
    challengeDays,
    setChallengeDays,
    challengeXP,
    setChallengeXP,
    
    // AI suggestion
    challengePrompt,
    setChallengePrompt,
    aiSuggestingChallenge,
    setAiSuggestingChallenge,
    
    // Loading
    creatingChallenge,
    setCreatingChallenge,
    
    // Helpers
    resetForm,
    validateForm,
    getFormData,
    applySuggestion,
  };
}
