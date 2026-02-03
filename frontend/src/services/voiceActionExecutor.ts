/**
 * VoiceActionExecutor - Executes actions based on parsed intents
 * 
 * From implementation guide Step 4.6:
 * Handle intents from both local parser and API response
 */

import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { api } from './api';
import { 
  ParsedIntent, 
  NavigationTarget,
  extractDateTime 
} from './intentParser';

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  navigateTo?: NavigationTarget;
  speakMessage?: string;
}

// TTS helper
async function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.95,
      pitch: 1.0,
      onDone: () => resolve(),
      onError: () => resolve(),
    });
  });
}

/**
 * Execute an action based on parsed intent
 */
export async function executeIntent(
  intent: ParsedIntent,
  options?: {
    speak?: boolean;
    navigate?: (target: NavigationTarget) => void;
    showToast?: (message: string) => void;
  }
): Promise<ActionResult> {
  const { speak: shouldSpeak = true, navigate, showToast } = options || {};
  
  try {
    switch (intent.intent) {
      case 'add_task':
        return await handleAddTask(intent, shouldSpeak, showToast);
      
      case 'complete_task':
        return await handleCompleteTask(intent, shouldSpeak, showToast);
      
      case 'query_tasks':
        return await handleQueryTasks(intent, shouldSpeak);
      
      case 'start_focus':
        return handleStartFocus(intent, shouldSpeak, navigate);
      
      case 'status':
        return await handleStatus(shouldSpeak);
      
      case 'navigate':
        return handleNavigate(intent, shouldSpeak, navigate);
      
      case 'braindump':
        return handleBrainDump(shouldSpeak, navigate);
      
      case 'unknown':
      default:
        // Defer to backend AI for unknown intents
        return await handleUnknown(intent, shouldSpeak);
    }
  } catch (error) {
    console.error('Action execution error:', error);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    return {
      success: false,
      message: 'Something went wrong. Please try again.',
      speakMessage: "Sorry, I couldn't do that. Please try again.",
    };
  }
}

/**
 * Add a new task
 */
async function handleAddTask(
  intent: ParsedIntent,
  shouldSpeak: boolean,
  showToast?: (message: string) => void
): Promise<ActionResult> {
  if (!intent.task) {
    return {
      success: false,
      message: 'No task provided',
      speakMessage: "What task would you like to add?",
    };
  }
  
  // Extract date/time from task text
  const { dueDate, dueTime, cleanedText } = extractDateTime(intent.task);
  
  try {
    const response = await api.post('/tasks', {
      title: cleanedText,
      priority: intent.priority || 'medium',
      dueDate,
      dueTime,
    });
    
    if (response.data?.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const speakMsg = `Added: ${cleanedText}`;
      if (shouldSpeak) await speak(speakMsg);
      showToast?.(`Task added: ${cleanedText}`);
      
      return {
        success: true,
        message: `Task added: ${cleanedText}`,
        data: response.data.data,
        speakMessage: speakMsg,
      };
    }
    
    throw new Error('Failed to create task');
  } catch (error) {
    return {
      success: false,
      message: 'Failed to add task',
      speakMessage: "I couldn't add that task. Please try again.",
    };
  }
}

/**
 * Complete a task
 */
async function handleCompleteTask(
  intent: ParsedIntent,
  shouldSpeak: boolean,
  showToast?: (message: string) => void
): Promise<ActionResult> {
  if (!intent.task) {
    return {
      success: false,
      message: 'No task specified',
      speakMessage: "Which task did you complete?",
    };
  }
  
  try {
    // Search for task by name
    const searchResponse = await api.get(`/tasks?search=${encodeURIComponent(intent.task)}&limit=1`);
    
    const tasks = searchResponse.data?.data?.tasks || [];
    if (tasks.length === 0) {
      return {
        success: false,
        message: `Couldn't find task: ${intent.task}`,
        speakMessage: `I couldn't find a task matching "${intent.task}".`,
      };
    }
    
    const task = tasks[0];
    await api.patch(`/tasks/${task.id}`, { completed: true });
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const speakMsg = "Done!";
    if (shouldSpeak) await speak(speakMsg);
    showToast?.(`Completed: ${task.title}`);
    
    return {
      success: true,
      message: `Completed: ${task.title}`,
      data: task,
      speakMessage: speakMsg,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to complete task',
      speakMessage: "I couldn't mark that task as done.",
    };
  }
}

/**
 * Query tasks
 */
async function handleQueryTasks(
  intent: ParsedIntent,
  shouldSpeak: boolean
): Promise<ActionResult> {
  try {
    let queryParams = 'completed=false';
    
    // Apply filter
    switch (intent.filter) {
      case 'today': {
        const today = new Date().toISOString().split('T')[0];
        queryParams += `&dueDate=${today}`;
        break;
      }
      case 'tomorrow': {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        queryParams += `&dueDate=${tomorrow.toISOString().split('T')[0]}`;
        break;
      }
      case 'priority':
        queryParams += '&priority=high';
        break;
    }
    
    const response = await api.get(`/tasks?${queryParams}`);
    const tasks = response.data?.data?.tasks || [];
    
    let speakMsg: string;
    if (tasks.length === 0) {
      speakMsg = `You have no ${intent.filter || ''} tasks.`;
    } else if (tasks.length === 1) {
      speakMsg = `You have 1 task ${intent.filter ? 'for ' + intent.filter : ''}: ${tasks[0].title}`;
    } else {
      speakMsg = `You have ${tasks.length} tasks ${intent.filter ? 'for ' + intent.filter : ''}. `;
      speakMsg += `Top items: ${tasks.slice(0, 3).map((t: any) => t.title).join(', ')}`;
    }
    
    if (shouldSpeak) await speak(speakMsg);
    
    return {
      success: true,
      message: speakMsg,
      data: tasks,
      speakMessage: speakMsg,
      navigateTo: 'tasks',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to fetch tasks',
      speakMessage: "I couldn't get your tasks right now.",
    };
  }
}

/**
 * Start focus session
 */
function handleStartFocus(
  intent: ParsedIntent,
  shouldSpeak: boolean,
  navigate?: (target: NavigationTarget) => void
): ActionResult {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  
  const duration = intent.duration || 25;
  const speakMsg = `Starting ${duration} minute focus session.`;
  
  if (shouldSpeak) speak(speakMsg);
  navigate?.('focus');
  
  return {
    success: true,
    message: speakMsg,
    data: { duration },
    navigateTo: 'focus',
    speakMessage: speakMsg,
  };
}

/**
 * Get user status
 */
async function handleStatus(shouldSpeak: boolean): Promise<ActionResult> {
  try {
    const response = await api.get('/users/profile');
    const user = response.data?.user;
    
    if (!user) {
      throw new Error('No user data');
    }
    
    const streak = user.streakDays || 0;
    const xp = user.xp || 0;
    const level = user.level || 1;
    const tasksToday = user.tasksCompletedToday || 0;
    
    let speakMsg = `You're on a ${streak} day streak. Level ${level} with ${xp} XP. `;
    speakMsg += `You've completed ${tasksToday} tasks today.`;
    
    if (shouldSpeak) await speak(speakMsg);
    
    return {
      success: true,
      message: speakMsg,
      data: user,
      speakMessage: speakMsg,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to get status',
      speakMessage: "I couldn't get your status right now.",
    };
  }
}

/**
 * Handle navigation
 */
function handleNavigate(
  intent: ParsedIntent,
  shouldSpeak: boolean,
  navigate?: (target: NavigationTarget) => void
): ActionResult {
  const target = intent.target || 'home';
  
  Haptics.selectionAsync();
  navigate?.(target);
  
  const speakMsg = `Going to ${target}.`;
  if (shouldSpeak) speak(speakMsg);
  
  return {
    success: true,
    message: speakMsg,
    navigateTo: target,
    speakMessage: speakMsg,
  };
}

/**
 * Handle brain dump
 */
function handleBrainDump(
  shouldSpeak: boolean,
  navigate?: (target: NavigationTarget) => void
): ActionResult {
  const speakMsg = "Let's do a brain dump. Tell me everything on your mind.";
  if (shouldSpeak) speak(speakMsg);
  
  // Could navigate to a special brain dump modal
  return {
    success: true,
    message: speakMsg,
    speakMessage: speakMsg,
  };
}

/**
 * Handle unknown intent - defer to AI
 */
async function handleUnknown(
  intent: ParsedIntent,
  shouldSpeak: boolean
): Promise<ActionResult> {
  try {
    // Send to AI for processing
    const response = await api.post('/ai/chat', {
      message: intent.rawText,
      context: 'general',
    });
    
    const aiMessage = response.data?.message || "I'm not sure how to help with that.";
    
    if (shouldSpeak) await speak(aiMessage);
    
    return {
      success: true,
      message: aiMessage,
      data: response.data,
      speakMessage: aiMessage,
    };
  } catch (error) {
    return {
      success: false,
      message: "I'm not sure how to help with that.",
      speakMessage: "I'm not sure what you'd like me to do. Could you try rephrasing?",
    };
  }
}

export default {
  executeIntent,
};
