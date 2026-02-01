import { colors } from '../../styles';
import { DailyStat, Highlight, StatusIcon } from './types';

export const DAILY_STATS: DailyStat[] = [
  { id: '1', label: 'Tasks Completed', value: '8/12', icon: 'checkbox-marked-circle', color: colors.success },
  { id: '2', label: 'Focus Time', value: '4h 32m', icon: 'timer', color: colors.primary },
  { id: '3', label: 'Steps', value: '6,842', icon: 'walk', color: colors.work },
  { id: '4', label: 'Mindfulness', value: '15 min', icon: 'meditation', color: colors.wellness },
];

export const HIGHLIGHTS: Highlight[] = [
  { id: '1', title: 'Morning Routine', time: '7:00 AM', status: 'completed' },
  { id: '2', title: 'Team Standup', time: '9:30 AM', status: 'completed' },
  { id: '3', title: 'Gym Session', time: '12:00 PM', status: 'in-progress' },
  { id: '4', title: 'Project Review', time: '3:00 PM', status: 'upcoming' },
];

export const MOOD_EMOJIS = ['😔', '😕', '😐', '🙂', '😊'];

export const DEFAULT_SELECTED_MOOD = 3;

export const getStatusIcon = (status: string): StatusIcon => {
  switch (status) {
    case 'completed':
      return { name: 'checkmark-circle', color: colors.success };
    case 'in-progress':
      return { name: 'time', color: colors.warning };
    default:
      return { name: 'ellipse-outline', color: colors.mutedForeground };
  }
};
