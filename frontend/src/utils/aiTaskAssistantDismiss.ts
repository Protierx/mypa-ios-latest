/**
 * AI Task Assistant Dismiss State
 *
 * Persists the dismiss state for the AI Task Assistant strip.
 * Strip is hidden for the day after user dismisses it.
 * Reappears automatically the next day.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISS_KEY = 'ai_task_assistant_dismissed_date';

/**
 * Check if the AI Task Assistant strip was dismissed today.
 */
export async function isAssistantDismissedToday(): Promise<boolean> {
  try {
    const dismissedDate = await AsyncStorage.getItem(DISMISS_KEY);
    if (!dismissedDate) return false;

    const today = getTodayString();
    return dismissedDate === today;
  } catch (error) {
    // On error, show the strip (safe default)
    console.warn('[AITaskAssistant] Failed to check dismiss state:', error);
    return false;
  }
}

/**
 * Mark the AI Task Assistant strip as dismissed for today.
 */
export async function dismissAssistantForToday(): Promise<void> {
  try {
    const today = getTodayString();
    await AsyncStorage.setItem(DISMISS_KEY, today);
  } catch (error) {
    console.warn('[AITaskAssistant] Failed to save dismiss state:', error);
  }
}

/**
 * Clear the dismiss state (for testing or reset).
 */
export async function clearAssistantDismissState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DISMISS_KEY);
  } catch (error) {
    console.warn('[AITaskAssistant] Failed to clear dismiss state:', error);
  }
}

/**
 * Get today's date as a string (YYYY-MM-DD).
 */
function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default {
  isAssistantDismissedToday,
  dismissAssistantForToday,
  clearAssistantDismissState,
};
