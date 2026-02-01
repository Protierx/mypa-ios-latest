export interface DailyLifeCardScreenProps {
  navigation?: any;
}

export interface DailyStat {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
}

export interface Highlight {
  id: string;
  title: string;
  time: string;
  status: 'completed' | 'in-progress' | 'upcoming';
}

export interface StatusIcon {
  name: string;
  color: string;
}
