/**
 * Services index - Export all services
 */

// API services
export { api, aiApi, eventsApi } from './api';

// Socket service
export { socketService } from './socket';

// Voice services
export * from './voiceAssistant';
export { executeIntent } from './voiceActionExecutor';

// Intent parsing
export { 
  parseIntent, 
  extractDateTime,
  type ParsedIntent,
  type IntentType,
} from './intentParser';

// Widget service
export { 
  widgetService,
  type WidgetData,
  type TaskWidgetData,
  type FocusWidgetData,
  type StatsWidgetData,
} from './widgetService';

// Calendar service
export * from './calendarSync';

// Push notifications
export { default as pushNotifications } from './pushNotifications';
