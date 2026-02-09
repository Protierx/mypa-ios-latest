/**
 * AI Learning System Integration Guide & Testing Utilities
 * 
 * This file documents how to integrate all Phase 6 AI Learning features
 * and provides testing utilities.
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Phase 6, Step 6.10
 */

import { eventLogger } from '@/services/eventLogger';
import { supabase } from '@/lib/supabase';

// ============================================================================
// INTEGRATION CHECKLIST
// ============================================================================
/**
 * PHASE 6 INTEGRATION POINTS:
 * 
 * 1. EVENT LOGGING (eventLogger.ts)
 *    ✅ Import in screens that need logging
 *    ✅ Call appropriate log methods:
 *       - App.tsx: eventLogger.logAppOpened()
 *       - TasksScreen: eventLogger.logTaskCreated(), logTaskCompleted()
 *       - FocusScreen: eventLogger.logFocusStarted(), logFocusCompleted()
 *       - VoiceContext: eventLogger.logVoiceCommand()
 *       - Navigation: eventLogger.logScreenViewed()
 * 
 * 2. USER MODEL CONTEXT (UserModelContext.tsx)
 *    ✅ Wrap App with <UserModelProvider>
 *    ✅ Use in components: const { model, isUnlocked, isInPeakHours } = useUserModel()
 * 
 * 3. UNLOCK CELEBRATION MODAL (UnlockCelebrationModal.tsx)
 *    ✅ Add <UnlockCelebrationModal /> to App.tsx
 *    ✅ Use hook: const { pendingCelebration, celebrate, dismiss } = useUnlockCelebrations()
 * 
 * 4. AI UNLOCKS SECTION (AIUnlocksSection.tsx)
 *    ✅ Add to Profile screen: <AIUnlocksSection unlocks={unlocks} stats={stats} />
 * 
 * 5. AI TASK SORTING (aiTaskSorting.ts)
 *    ✅ Use in TasksScreen when sorting:
 *       if (isUnlocked('ai_task_sorting')) {
 *         tasks = sortTasksWithAI(tasks, userModel)
 *       }
 * 
 * 6. DURATION ESTIMATION (durationEstimation.ts)
 *    ✅ Show estimates on task cards:
 *       if (isUnlocked('duration_estimation')) {
 *         const estimate = estimateTaskDuration(task, userModel)
 *         // Show "~25 mins" badge
 *       }
 * 
 * 7. OVERWHELM DETECTION (overwhelmDetection.ts)
 *    ✅ Check on Tasks screen load:
 *       if (isUnlocked('overwhelm_detection')) {
 *         const status = checkOverwhelmStatus(tasks, userModel)
 *         if (status.isOverwhelmed) {
 *           // Show AI suggestion modal
 *         }
 *       }
 * 
 * 8. DAILY BRIEF (daily-brief Edge Function)
 *    ✅ Call on first app open of day:
 *       const brief = await api.getDailyBrief()
 *       // Speak brief.briefText via TTS
 *       // Show summary in AI Hub
 * 
 * 9. PREDICTIVE SUGGESTIONS (predictiveSuggestions.ts)
 *    ✅ Use hook: const { predictedTasks, suggestions } = usePredictiveSuggestions()
 *    ✅ Show predicted tasks in AI Hub or Quick Add
 */

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Test that event logging is working
 */
export async function testEventLogging(): Promise<{ success: boolean; message: string }> {
  try {
    // Log a test event
    await eventLogger.log('test_event', {
      screen: 'test',
      metadata: { test: true, timestamp: new Date().toISOString() }
    });
    
    // Flush the queue
    await eventLogger.flush();
    
    return { success: true, message: 'Event logging is working' };
  } catch (error: any) {
    return { success: false, message: `Event logging failed: ${error.message}` };
  }
}

/**
 * Test that user model is fetching correctly
 */
export async function testUserModelFetch(userId: string): Promise<{ 
  success: boolean; 
  message: string;
  data?: any;
}> {
  try {
    const { data: model, error } = await supabase
      .from('user_model')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }
    
    return { 
      success: true, 
      message: model ? 'User model found' : 'No user model yet (this is normal for new users)',
      data: model
    };
  } catch (error: any) {
    return { success: false, message: `User model fetch failed: ${error.message}` };
  }
}

/**
 * Test that unlocks are being calculated
 */
export async function testUnlockCalculation(userId: string): Promise<{
  success: boolean;
  message: string;
  unlocks?: any[];
}> {
  try {
    const { data: unlocks, error } = await supabase
      .from('unlocks')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return {
      success: true,
      message: `Found ${unlocks?.length || 0} unlocks`,
      unlocks: unlocks || []
    };
  } catch (error: any) {
    return { success: false, message: `Unlock fetch failed: ${error.message}` };
  }
}

/**
 * Run all Phase 6 tests
 */
export async function runPhase6Tests(userId: string): Promise<{
  overall: boolean;
  results: Array<{ test: string; success: boolean; message: string }>;
}> {
  const results: Array<{ test: string; success: boolean; message: string }> = [];
  
  // Test 1: Event Logging
  const eventTest = await testEventLogging();
  results.push({ test: 'Event Logging', ...eventTest });
  
  // Test 2: User Model
  const modelTest = await testUserModelFetch(userId);
  results.push({ test: 'User Model', ...modelTest });
  
  // Test 3: Unlocks
  const unlockTest = await testUnlockCalculation(userId);
  results.push({ test: 'Unlock Calculation', ...unlockTest });
  
  // Calculate overall
  const overall = results.every(r => r.success);
  
  return { overall, results };
}

// ============================================================================
// MANUAL TESTING CHECKLIST
// ============================================================================
/**
 * MANUAL TESTING CHECKLIST FOR PHASE 6:
 * 
 * EVENT LOGGING:
 * [ ] App open logs 'app_opened' event
 * [ ] Task creation logs 'task_created' event
 * [ ] Task completion logs 'task_completed' event
 * [ ] Focus start logs 'focus_started' event
 * [ ] Focus complete logs 'focus_completed' event
 * [ ] Voice command logs 'voice_command' event
 * [ ] Events are batched and sent correctly
 * [ ] Events persist across app restarts
 * 
 * USER MODEL CONTEXT:
 * [ ] UserModelProvider wraps app correctly
 * [ ] useUserModel() returns model data
 * [ ] isUnlocked() returns correct values
 * [ ] isInPeakHours() works with peak_hours data
 * [ ] getPendingUnlocks() returns new unlocks
 * 
 * UNLOCK CELEBRATION:
 * [ ] Modal appears when new unlock detected
 * [ ] Confetti animation plays
 * [ ] Feature description is correct
 * [ ] Dismiss marks unlock as seen
 * [ ] Haptic feedback on celebration
 * 
 * AI UNLOCKS SECTION:
 * [ ] Shows in Profile screen
 * [ ] Displays locked features with progress
 * [ ] Displays unlocked features with date
 * [ ] Progress bars are accurate
 * [ ] Overall progress displays correctly
 * 
 * AI TASK SORTING:
 * [ ] Tasks sorted by completion likelihood
 * [ ] High likelihood tasks appear first
 * [ ] Sort reason can be shown if desired
 * [ ] Respects peak hours in scoring
 * 
 * DURATION ESTIMATION:
 * [ ] Estimates appear on tasks (when unlocked)
 * [ ] Uses historical data if available
 * [ ] Falls back to category defaults
 * [ ] Format is user-friendly (e.g., "~25 mins")
 * 
 * OVERWHELM DETECTION:
 * [ ] Detects when task count exceeds threshold
 * [ ] Shows appropriate warning level
 * [ ] Suggestions are helpful
 * [ ] Can defer suggested tasks
 * 
 * DAILY BRIEF:
 * [ ] API call returns brief
 * [ ] Brief text is personalized
 * [ ] Peak hour suggestion included
 * [ ] Challenge update included
 * [ ] Can be spoken via TTS
 * 
 * PREDICTIVE SUGGESTIONS:
 * [ ] Detects recurring patterns
 * [ ] Suggests tasks at right time
 * [ ] Can accept suggested task
 * [ ] Can dismiss suggested task
 * [ ] Context suggestions appear appropriately
 * 
 * INTEGRATION:
 * [ ] All features work together
 * [ ] No performance issues
 * [ ] No duplicate events
 * [ ] Graceful degradation without data
 */

export default {
  testEventLogging,
  testUserModelFetch,
  testUnlockCalculation,
  runPhase6Tests,
};
