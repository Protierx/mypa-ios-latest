import { useState, useEffect, useCallback } from 'react';
import * as calendarSync from '../services/calendarSync';

interface UseCalendarEventsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}

interface UseCalendarEventsReturn {
  events: calendarSync.CalendarEvent[];
  todayEvents: calendarSync.CalendarEvent[];
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
  refresh: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  convertToTask: (event: calendarSync.CalendarEvent) => calendarSync.TaskFromCalendar;
}

export const useCalendarEvents = (
  options: UseCalendarEventsOptions = {}
): UseCalendarEventsReturn => {
  const { autoRefresh = true, refreshInterval = 30 } = options;

  const [events, setEvents] = useState<calendarSync.CalendarEvent[]>([]);
  const [todayEvents, setTodayEvents] = useState<calendarSync.CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const checkPermission = useCallback(async () => {
    const granted = await calendarSync.checkCalendarPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await calendarSync.requestCalendarPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      
      const permission = await checkPermission();
      if (!permission) {
        setLoading(false);
        return;
      }

      // Get today's events
      const today = await calendarSync.getTodayEvents();
      setTodayEvents(today);

      // Get week events
      const week = await calendarSync.getWeekEvents();
      setEvents(week);

      await calendarSync.setLastSyncTime();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [checkPermission]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchEvents();
  }, [fetchEvents]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !hasPermission) return;

    const interval = setInterval(() => {
      fetchEvents();
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, hasPermission, fetchEvents]);

  const convertToTask = useCallback((event: calendarSync.CalendarEvent) => {
    return calendarSync.convertEventToTask(event);
  }, []);

  return {
    events,
    todayEvents,
    loading,
    error,
    hasPermission,
    refresh,
    requestPermission,
    convertToTask,
  };
};

// Hook for getting upcoming events (next 3 hours)
export const useUpcomingEvents = () => {
  const { todayEvents, loading, hasPermission, refresh, requestPermission } = useCalendarEvents();

  const upcomingEvents = todayEvents.filter(event => {
    const now = new Date();
    const eventStart = new Date(event.startDate);
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    
    return eventStart >= now && eventStart <= threeHoursLater;
  });

  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  return {
    upcomingEvents,
    nextEvent,
    loading,
    hasPermission,
    refresh,
    requestPermission,
  };
};

// Hook for calendar-based time blocking suggestions
export const useTimeBlockSuggestions = () => {
  const { todayEvents, loading, hasPermission } = useCalendarEvents();

  const getFreeSlots = useCallback((minDuration: number = 30): { start: Date; end: Date; duration: number }[] => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(22, 0, 0, 0); // End at 10 PM

    if (now >= endOfDay) return [];

    // Sort events by start time
    const sortedEvents = [...todayEvents]
      .filter(e => new Date(e.endDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const freeSlots: { start: Date; end: Date; duration: number }[] = [];
    let currentTime = new Date(Math.max(now.getTime(), new Date(now).setHours(8, 0, 0, 0))); // Start from 8 AM or now

    for (const event of sortedEvents) {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);

      // If there's a gap before this event
      if (eventStart > currentTime) {
        const duration = (eventStart.getTime() - currentTime.getTime()) / 60000; // in minutes
        
        if (duration >= minDuration) {
          freeSlots.push({
            start: new Date(currentTime),
            end: new Date(eventStart),
            duration,
          });
        }
      }

      // Move current time to after this event
      if (eventEnd > currentTime) {
        currentTime = new Date(eventEnd);
      }
    }

    // Check for free time until end of day
    if (currentTime < endOfDay) {
      const duration = (endOfDay.getTime() - currentTime.getTime()) / 60000;
      
      if (duration >= minDuration) {
        freeSlots.push({
          start: new Date(currentTime),
          end: new Date(endOfDay),
          duration,
        });
      }
    }

    return freeSlots;
  }, [todayEvents]);

  const suggestFocusTime = useCallback((taskDuration: number = 30): Date | null => {
    const freeSlots = getFreeSlots(taskDuration);
    
    if (freeSlots.length === 0) return null;

    // Find the best slot (prefer longer slots for longer tasks)
    const suitableSlots = freeSlots.filter(slot => slot.duration >= taskDuration);
    
    if (suitableSlots.length === 0) return freeSlots[0].start;

    // Return the start of the first suitable slot
    return suitableSlots[0].start;
  }, [getFreeSlots]);

  return {
    getFreeSlots,
    suggestFocusTime,
    loading,
    hasPermission,
    todayEvents,
  };
};

export default useCalendarEvents;
