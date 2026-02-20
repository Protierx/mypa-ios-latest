import * as Calendar from 'expo-calendar';
import * as Linking from 'expo-linking';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Current user ID - must be set before using calendar sync
let currentUserId: string | null = null;

// Set the current user ID (call this on login/logout)
export const setCalendarSyncUser = (userId: string | null) => {
  currentUserId = userId;
};

// Get user-specific storage key
const getUserKey = (baseKey: string): string => {
  if (!currentUserId) {
    console.warn('Calendar sync: No user ID set, using device-level storage');
    return baseKey;
  }
  return `${baseKey}_${currentUserId}`;
};

// Storage keys (base keys - will be prefixed with user ID)
const STORAGE_KEYS = {
  CALENDAR_PERMISSIONS: '@mypa_calendar_permissions',
  SELECTED_CALENDARS: '@mypa_selected_calendars',
  GOOGLE_TOKENS: '@mypa_google_tokens',
  SYNC_SETTINGS: '@mypa_sync_settings',
  LAST_SYNC: '@mypa_last_sync',
};

// Types
export interface CalendarSource {
  id: string;
  name: string;
  type: 'local' | 'google' | 'outlook' | 'icloud';
  color: string;
  isSelected: boolean;
  accountName?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  notes?: string;
  calendarId: string;
  color?: string;
}

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  importAsBlocks: boolean; // Import calendar events as time blocks
  exportCompletedTasks: boolean;
  twoWaySync: boolean;
}

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoSync: true,
  syncInterval: 30,
  importAsBlocks: true,
  exportCompletedTasks: false,
  twoWaySync: false,
};

// ============================================
// DEVICE CALENDAR (Apple Calendar / Android)
// ============================================

export const requestCalendarPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    const granted = status === 'granted';
    await AsyncStorage.setItem(getUserKey(STORAGE_KEYS.CALENDAR_PERMISSIONS), JSON.stringify(granted));
    return granted;
  } catch (error) {
    console.error('Error requesting calendar permissions:', error);
    return false;
  }
};

export const checkCalendarPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
};

export const getDeviceCalendars = async (): Promise<CalendarSource[]> => {
  try {
    const hasPermission = await checkCalendarPermissions();
    if (!hasPermission) {
      const granted = await requestCalendarPermissions();
      if (!granted) return [];
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    // Get previously selected calendars (user-specific)
    const savedSelections = await AsyncStorage.getItem(getUserKey(STORAGE_KEYS.SELECTED_CALENDARS));
    const selectedIds: string[] = savedSelections ? JSON.parse(savedSelections) : [];

    return calendars.map(cal => ({
      id: cal.id,
      name: cal.title,
      type: getCalendarType(cal.source?.type || ''),
      color: cal.color || '#B958FF',
      isSelected: selectedIds.length === 0 ? cal.isPrimary || false : selectedIds.includes(cal.id),
      accountName: cal.source?.name,
    }));
  } catch (error) {
    console.error('Error getting calendars:', error);
    return [];
  }
};

const getCalendarType = (sourceType: string): 'local' | 'google' | 'outlook' | 'icloud' => {
  const type = sourceType.toLowerCase();
  if (type.includes('google') || type.includes('com.google')) return 'google';
  if (type.includes('exchange') || type.includes('outlook')) return 'outlook';
  if (type.includes('icloud') || type.includes('subscribed')) return 'icloud';
  return 'local';
};

export const saveSelectedCalendars = async (calendarIds: string[]): Promise<void> => {
  await AsyncStorage.setItem(getUserKey(STORAGE_KEYS.SELECTED_CALENDARS), JSON.stringify(calendarIds));
};

export const getSelectedCalendars = async (): Promise<string[] | null> => {
  try {
    const saved = await AsyncStorage.getItem(getUserKey(STORAGE_KEYS.SELECTED_CALENDARS));
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    return null;
  }
};

export const getEventsFromCalendar = async (
  startDate: Date,
  endDate: Date,
  calendarIds?: string[]
): Promise<CalendarEvent[]> => {
  try {
    const hasPermission = await checkCalendarPermissions();
    if (!hasPermission) return [];

    let targetCalendarIds: string[] = calendarIds || [];
    
    if (targetCalendarIds.length === 0) {
      const saved = await AsyncStorage.getItem(getUserKey(STORAGE_KEYS.SELECTED_CALENDARS));
      targetCalendarIds = saved ? JSON.parse(saved) : [];
      
      // If no calendars selected, get all
      if (targetCalendarIds.length === 0) {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        targetCalendarIds = calendars.map(c => c.id);
      }
    }

    const events = await Calendar.getEventsAsync(
      targetCalendarIds,
      startDate,
      endDate
    );

    return events.map(event => ({
      id: event.id,
      title: event.title,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      allDay: event.allDay || false,
      location: event.location || undefined,
      notes: event.notes,
      calendarId: event.calendarId,
    }));
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
};

export const getTodayEvents = async (): Promise<CalendarEvent[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return getEventsFromCalendar(today, tomorrow);
};

export const getWeekEvents = async (): Promise<CalendarEvent[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  return getEventsFromCalendar(today, weekEnd);
};

// Create event in device calendar
export const createCalendarEvent = async (
  calendarId: string,
  event: {
    title: string;
    startDate: Date;
    endDate: Date;
    notes?: string;
    location?: string;
  }
): Promise<string | null> => {
  try {
    const hasPermission = await checkCalendarPermissions();
    if (!hasPermission) return null;

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      notes: event.notes,
      location: event.location,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return eventId;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
};

// Get or create MYPA calendar for exporting tasks
export const getOrCreateMYPACalendar = async (): Promise<string | null> => {
  try {
    const hasPermission = await checkCalendarPermissions();
    if (!hasPermission) return null;

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const mypaCalendar = calendars.find(c => c.title === 'MYPA Tasks');

    if (mypaCalendar) {
      return mypaCalendar.id;
    }

    // Create new calendar
    const defaultCalendarSource = Platform.OS === 'ios'
      ? calendars.find(c => c.source?.type === Calendar.CalendarType.LOCAL)?.source
      : { isLocalAccount: true, name: 'MYPA', type: Calendar.CalendarType.LOCAL };

    if (!defaultCalendarSource) return null;

    const newCalendarId = await Calendar.createCalendarAsync({
      title: 'MYPA Tasks',
      color: '#B958FF',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultCalendarSource.id,
      source: defaultCalendarSource,
      name: 'MYPA Tasks',
      ownerAccount: 'MYPA',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    return newCalendarId;
  } catch (error) {
    console.error('Error creating MYPA calendar:', error);
    return null;
  }
};

// ============================================
// SYNC SETTINGS
// ============================================

export const getSyncSettings = async (): Promise<SyncSettings> => {
  try {
    const saved = await AsyncStorage.getItem(getUserKey(STORAGE_KEYS.SYNC_SETTINGS));
    return saved ? { ...DEFAULT_SYNC_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SYNC_SETTINGS;
  } catch (error) {
    return DEFAULT_SYNC_SETTINGS;
  }
};

export const saveSyncSettings = async (settings: Partial<SyncSettings>): Promise<void> => {
  const current = await getSyncSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(getUserKey(STORAGE_KEYS.SYNC_SETTINGS), JSON.stringify(updated));
};

export const getLastSyncTime = async (): Promise<Date | null> => {
  try {
    const saved = await AsyncStorage.getItem(getUserKey(STORAGE_KEYS.LAST_SYNC));
    return saved ? new Date(saved) : null;
  } catch (error) {
    return null;
  }
};

export const setLastSyncTime = async (): Promise<void> => {
  await AsyncStorage.setItem(getUserKey(STORAGE_KEYS.LAST_SYNC), new Date().toISOString());
};

// Disconnect calendar for current user (clear all user-specific settings)
export const disconnectCalendar = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      getUserKey(STORAGE_KEYS.SELECTED_CALENDARS),
      getUserKey(STORAGE_KEYS.SYNC_SETTINGS),
      getUserKey(STORAGE_KEYS.LAST_SYNC),
      getUserKey(STORAGE_KEYS.CALENDAR_PERMISSIONS),
    ]);
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
  }
};

// ============================================
// EXPORT TASKS TO CALENDAR
// ============================================

export interface MYPATask {
  id: number | string;
  title: string;
  date?: string;
  time?: string;
  duration?: string;
  durationMin?: number;
  category?: string;
  completed?: boolean;
}

export const exportTaskToCalendar = async (task: MYPATask): Promise<string | null> => {
  try {
    const hasPermission = await checkCalendarPermissions();
    if (!hasPermission) return null;

    // Get or create MYPA calendar
    const calendarId = await getOrCreateMYPACalendar();
    if (!calendarId) {
      console.error('Could not get or create MYPA calendar');
      return null;
    }

    // Parse task date and time
    const taskDate = task.date ? new Date(task.date) : new Date();
    
    // Parse time if provided (e.g., "2:30 PM")
    if (task.time) {
      const timeMatch = task.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3]?.toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        taskDate.setHours(hours, minutes, 0, 0);
      }
    } else {
      // Default to 9 AM if no time specified
      taskDate.setHours(9, 0, 0, 0);
    }

    // Calculate end time based on duration
    const durationMinutes = task.durationMin || 30;
    const endDate = new Date(taskDate.getTime() + durationMinutes * 60 * 1000);

    // Create the event
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: task.title,
      startDate: taskDate,
      endDate: endDate,
      notes: `MYPA Task • ${task.category || 'Personal'}${task.completed ? ' ✓ Completed' : ''}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return eventId;
  } catch (error) {
    console.error('Error exporting task to calendar:', error);
    return null;
  }
};

export const exportMultipleTasksToCalendar = async (tasks: MYPATask[]): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const task of tasks) {
    const result = await exportTaskToCalendar(task);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
};

// ============================================
// TASK <-> CALENDAR CONVERSION
// ============================================

export interface TaskFromCalendar {
  title: string;
  date: string;
  time: string;
  duration: string;
  durationMin: number;
  category: string;
  priority: 'High' | 'Normal' | 'Low';
  source: 'calendar';
  sourceEventId: string;
  sourceCalendarId: string;
}

export const convertEventToTask = (event: CalendarEvent): TaskFromCalendar => {
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  // Calculate duration in minutes
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationMin = Math.round(durationMs / (1000 * 60));
  
  // Format time
  const hours = startDate.getHours();
  const minutes = startDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const time = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  
  // Format duration
  const formatDuration = (mins: number): string => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return {
    title: event.title,
    date: startDate.toISOString().split('T')[0],
    time,
    duration: formatDuration(durationMin),
    durationMin: Math.max(15, Math.min(durationMin, 480)), // Clamp to 15min - 8h
    category: categorizeEvent(event),
    priority: 'Normal',
    source: 'calendar',
    sourceEventId: event.id,
    sourceCalendarId: event.calendarId,
  };
};

const categorizeEvent = (event: CalendarEvent): string => {
  const title = event.title.toLowerCase();
  const notes = (event.notes || '').toLowerCase();
  const combined = `${title} ${notes}`;

  if (combined.match(/meeting|call|zoom|teams|standup|sync|1:1|interview/)) return 'Work';
  if (combined.match(/gym|workout|run|exercise|yoga|fitness|health|doctor|dentist/)) return 'Health';
  if (combined.match(/study|class|lecture|exam|assignment|school|university/)) return 'Study';
  if (combined.match(/dinner|lunch|breakfast|coffee|date|party|birthday|celebration/)) return 'Social';
  if (combined.match(/errand|shopping|groceries|bank|appointment/)) return 'Errands';
  
  return 'Personal';
};

// ============================================
// EXTERNAL APP LINKS
// ============================================

export const openAppleCalendar = async (): Promise<void> => {
  const url = Platform.OS === 'ios' ? 'calshow://' : 'content://com.android.calendar/time/';
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
};

export const openGoogleCalendar = async (): Promise<void> => {
  const webUrl = 'https://calendar.google.com';
  const appUrl = Platform.OS === 'ios' 
    ? 'googlecalendar://' 
    : 'com.google.android.calendar';
  
  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch {
    await Linking.openURL(webUrl);
  }
};

export const openReminders = async (): Promise<void> => {
  if (Platform.OS === 'ios') {
    await Linking.openURL('x-apple-reminderkit://');
  }
};

export const openNotion = async (): Promise<void> => {
  const webUrl = 'https://notion.so';
  const appUrl = 'notion://';
  
  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch {
    await Linking.openURL(webUrl);
  }
};

export const openTodoist = async (): Promise<void> => {
  const webUrl = 'https://todoist.com';
  const appUrl = 'todoist://';
  
  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch {
    await Linking.openURL(webUrl);
  }
};

// ============================================
// GOOGLE CALENDAR OAUTH (for deeper integration)
// ============================================

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = ''; // Add your Google OAuth client ID here
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const signInWithGoogle = async (): Promise<{ accessToken: string; refreshToken?: string } | null> => {
  if (!GOOGLE_CLIENT_ID) {
    console.log('Google OAuth not configured - using device calendar instead');
    return null;
  }

  try {
    const redirectUri = AuthSession.makeRedirectUri();
    
    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: GOOGLE_SCOPES,
      redirectUri,
    });

    const result = await request.promptAsync(googleDiscovery);

    if (result.type === 'success' && result.authentication) {
      const tokens = {
        accessToken: result.authentication.accessToken,
        refreshToken: result.authentication.refreshToken,
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.GOOGLE_TOKENS, JSON.stringify(tokens));
      return tokens;
    }

    return null;
  } catch (error) {
    console.error('Google sign in error:', error);
    return null;
  }
};

export const getGoogleTokens = async (): Promise<{ accessToken: string; refreshToken?: string } | null> => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.GOOGLE_TOKENS);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const signOutGoogle = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEYS.GOOGLE_TOKENS);
};

export const isGoogleConnected = async (): Promise<boolean> => {
  const tokens = await getGoogleTokens();
  return tokens !== null;
};
