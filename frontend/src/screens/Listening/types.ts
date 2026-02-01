export interface ListeningScreenProps {
  visible: boolean;
  onClose: () => void;
}

export interface Transcript {
  id: number;
  text: string;
  isUser: boolean;
  time: string;
}

export interface VoiceOptionItem {
  id: string;
  desc: string;
}

export type LanguageType = 'English' | 'Spanish' | 'French' | 'Arabic';
export type SpeedType = 'Slow' | 'Normal' | 'Fast';
export type VoiceType = 'Nova' | 'Aria' | 'Echo';
